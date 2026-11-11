import { readFile, writeFile } from 'node:fs/promises';
import { Publicacion } from '../models/Publicacion.js';
import { validarDireccionPublicacion } from '../service/publicacionesService.js';

const archivoPublicaciones = new URL('../repositories/Publicaciones.json', import.meta.url);

export async function listarPublicaciones(req, res, next) {
  try {
    const archivo = await readFile(archivoPublicaciones, 'utf8');
    return res.status(200).json(JSON.parse(archivo));
  } catch (error) {
    return next(error);
  }
}

export async function crearPublicacion(req, res, next) {
  const { imagen, tipo, precio, titulo, descripcion, ubicacion, detalleDescripcion, caracteristicas } = req.body || {};
  const camposTexto = { imagen, tipo, titulo, descripcion, ubicacion, detalleDescripcion, caracteristicas };

  if (Object.values(camposTexto).some((valor) => typeof valor !== 'string' || !valor.trim())) {
    return res.status(400).json({ error: 'Completá todos los campos de la publicación.' });
  }

  const precioNumerico = Number(precio);
  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un número mayor que cero.' });
  }

  try {
    const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
    if (!Array.isArray(publicaciones)) {
      throw new Error('El archivo de publicaciones no contiene una lista válida.');
    }

    const resultadoDireccion = await validarDireccionPublicacion(ubicacion);
    const direccionCompleta = resultadoDireccion.ubicacion.direccionCompleta;
    const id = Math.max(0, ...publicaciones.map((publicacion) => Number(publicacion.id) || 0)) + 1;
    const nuevaPublicacion = new Publicacion(
      id,
      titulo.trim(),
      descripcion.trim(),
      direccionCompleta,
      precioNumerico,
      req.user?.correo ?? null,
      {
        imagen: imagen.trim(),
        alt: `Publicación de ${tipo.trim().toLowerCase()}`,
        tipo: tipo.trim(),
        ubicacion: direccionCompleta,
        detalleDescripcion: detalleDescripcion.trim(),
        caracteristicas: caracteristicas.trim(),
        calificacion: 0,
        cantidadValoraciones: 0,
        detalle: titulo.trim()
      }
    );

    publicaciones.push(nuevaPublicacion);
    await writeFile(archivoPublicaciones, `${JSON.stringify(publicaciones, null, 2)}\n`, 'utf8');
    return res.status(201).json(nuevaPublicacion);
  } catch (error) {
    if (error.message?.includes('No se encontró')) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

export async function validarDireccion(req, res) {
  try {
    const resultado = await validarDireccionPublicacion(req.body?.direccion || req.query?.direccion);
    return res.status(200).json(resultado);
  } catch (error) {
    const mensaje = error.message || 'La dirección no es válida.';

    if (mensaje.includes('obligatoria') || mensaje.includes('No se encontró')) {
      return res.status(400).json({ error: mensaje });
    }

    return res.status(500).json({ error: mensaje });
  }
}
