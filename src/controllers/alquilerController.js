import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Alquiler } from '../models/Alquiler.js';

const archivoPublicaciones = new URL('../repositories/Publicaciones.json', import.meta.url);
const estadosQueBloquean = new Set(['activo', 'pendiente']);

export async function listarAlquileres(req, res) {
  if (req.user.tipo !== 'Cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden consultar alquileres.' });
  }

  return res.status(200).json(obtenerHistorial(req.user));
}

export async function crearAlquiler(req, res, next) {
  const cliente = req.user;
  if (cliente.tipo !== 'Cliente') {
    return res.status(403).json({ error: 'Solo los clientes pueden realizar alquileres.' });
  }
  const historial = obtenerHistorial(cliente);

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

function obtenerHistorial(cliente) {
  if (!Array.isArray(cliente.historial)) {
    cliente.historial = [];
  }
  return cliente.historial;
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
