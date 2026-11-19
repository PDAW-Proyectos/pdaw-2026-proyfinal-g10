import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Alquiler } from '../models/Alquiler.js';

const archivoPublicaciones = new URL('../repositories/Publicaciones.json', import.meta.url);
const estadosQueBloquean = new Set(['activo', 'pendiente']);

export async function listarAlquileres(req, res) {
  if (req.user.tipo !== 'Cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden consultar alquileres.' });
  }

  const historial = obtenerHistorial(req.user);
  finalizarAlquileresVencidos(historial);
  return res.status(200).json(historial);
}

export async function crearAlquiler(req, res, next) {
  const cliente = req.user;
  if (cliente.tipo !== 'Cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden realizar alquileres.' });
  }
  const historial = obtenerHistorial(cliente);
  finalizarAlquileresVencidos(historial);

  if (historial.some((alquiler) => estadosQueBloquean.has(alquiler.estado))) {
    return res.status(409).json({ error: 'Ya tienes un alquiler activo o pendiente.' });
  }

  const { publicacionId, fechaInicio, fechaFin } = req.body || {};
  if (!publicacionId) {
    return res.status(400).json({ error: 'La publicación es obligatoria.' });
  }

  if (!esFechaValida(fechaInicio) || !esFechaValida(fechaFin)) {
    return res.status(400).json({ error: 'Las fechas del alquiler no son válidas.' });
  }

  const fechaHoy = fechaLocal(new Date());
  if (fechaInicio < fechaHoy || fechaFin <= fechaInicio) {
    return res.status(400).json({ error: 'El inicio debe ser hoy o a futuro y el fin debe ser posterior al inicio.' });
  }

  try {
    const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
    if (!Array.isArray(publicaciones)) {
      throw new Error('El archivo de publicaciones no contiene una lista válida.');
    }

    const publicacion = publicaciones.find(
      (elemento) => String(elemento.id) === String(publicacionId)
    );
    if (!publicacion) {
      return res.status(404).json({ error: 'No se encontró la publicación solicitada.' });
    }

    if (publicacion.activa === false || publicacion.disponibilidad !== 'disponible') {
      return res.status(409).json({ error: 'La publicación no está disponible para alquilar.' });
    }

    if (historial.some((alquiler) => estadosQueBloquean.has(alquiler.estado))) {
      return res.status(409).json({ error: 'Ya tienes un alquiler activo o pendiente.' });
    }

    const alquiler = new Alquiler(
      randomUUID(),
      publicacion,
      fechaInicio,
      fechaFin
    );
    historial.push(alquiler);

    return res.status(201).json(alquiler);
  } catch (error) {
    return next(error);
  }
}

export function listarAlquileresPropietario(req, res, usuarios) {
  if (req.user.tipo !== 'Propietario') {
    return res.status(403).json({ error: 'Solo los propietarios pueden consultar solicitudes de alquiler.' });
  }

  const correoPropietario = normalizarCorreo(req.user.correo);
  const alquileres = usuarios.listarUsuarios()
    .filter((usuario) => usuario.tipo === 'Cliente')
    .flatMap((cliente) => {
      const historial = obtenerHistorial(cliente);
      finalizarAlquileresVencidos(historial);
      return historial
        .filter((alquiler) => normalizarCorreo(alquiler.producto?.autor) === correoPropietario)
        .map((alquiler) => ({ ...alquiler, solicitante: cliente.nombre }));
    });

  return res.status(200).json(alquileres);
}

export function actualizarEstadoAlquiler(req, res, usuarios) {
  if (req.user.tipo !== 'Propietario') {
    return res.status(403).json({ error: 'Solo los propietarios pueden responder solicitudes de alquiler.' });
  }

  const estadosPermitidos = new Set(['activo', 'rechazado']);
  const nuevoEstado = req.body?.estado;
  if (!estadosPermitidos.has(nuevoEstado)) {
    return res.status(400).json({ error: 'El estado debe ser activo o rechazado.' });
  }

  const correoPropietario = normalizarCorreo(req.user.correo);
  const solicitud = usuarios.listarUsuarios()
    .filter((usuario) => usuario.tipo === 'Cliente')
    .flatMap((cliente) => obtenerHistorial(cliente)
      .filter((alquiler) => String(alquiler.id) === String(req.params.id)
        && normalizarCorreo(alquiler.producto?.autor) === correoPropietario)
      .map((alquiler) => ({ cliente, alquiler })))
    .find(() => true);

  if (!solicitud) {
    return res.status(404).json({ error: 'No se encontró la solicitud de alquiler.' });
  }
  finalizarAlquileresVencidos([solicitud.alquiler]);
  if (solicitud.alquiler.estado !== 'pendiente') {
    return res.status(409).json({ error: 'La solicitud ya fue respondida.' });
  }
  if (nuevoEstado === 'activo' && solicitud.alquiler.fechaFin <= fechaLocal(new Date())) {
    return res.status(409).json({ error: 'El período solicitado ya terminó.' });
  }

  solicitud.alquiler.estado = nuevoEstado;
  return res.status(200).json(solicitud.alquiler);
}

export function cancelarAlquiler(req, res) {
  if (req.user.tipo !== 'Cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden cancelar alquileres.' });
  }

  const historial = obtenerHistorial(req.user);
  finalizarAlquileresVencidos(historial);
  const alquiler = historial.find((elemento) => String(elemento.id) === String(req.params.id));
  if (!alquiler) {
    return res.status(404).json({ error: 'No se encontró el alquiler solicitado.' });
  }
  if (!['pendiente', 'activo'].includes(alquiler.estado)) {
    return res.status(409).json({ error: 'Solo puedes cancelar alquileres activos o pendientes.' });
  }

  alquiler.cancelar();
  return res.status(200).json(alquiler);
}

function obtenerHistorial(cliente) {
  if (!Array.isArray(cliente.historial)) {
    cliente.historial = [];
  }
  return cliente.historial;
}

function finalizarAlquileresVencidos(historial) {
  const hoy = fechaLocal(new Date());
  for (const alquiler of historial) {
    if (alquiler.estado === 'activo' && esFechaValida(alquiler.fechaFin) && alquiler.fechaFin <= hoy) {
      alquiler.finalizar();
    }
  }
}

function normalizarCorreo(correo) {
  return typeof correo === 'string' ? correo.trim().toLowerCase() : '';
}

function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const parsed = new Date(`${fecha}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === fecha;
}

function fechaLocal(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
