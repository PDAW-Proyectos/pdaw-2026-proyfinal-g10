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
  const { imagen, precio, titulo, descripcion, direccion } = req.body || {};
  const camposTexto = [
    [titulo, 'El título es obligatorio.'],
    [imagen, 'La imagen es obligatoria.'],
    [descripcion, 'La descripción es obligatoria.'],
    [direccion, 'La dirección es obligatoria.']
  ];

  const campoIncompleto = camposTexto.find(
    ([valor]) => typeof valor !== 'string' || !valor.trim()
  );
  if (campoIncompleto) {
    return res.status(400).json({ error: campoIncompleto[1] });
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

    const resultadoDireccion = await validarDireccionPublicacion(direccion);
    const direccionCompleta = resultadoDireccion.ubicacion.direccionCompleta;
    const id = Math.max(0, ...publicaciones.map((publicacion) => Number(publicacion.id) || 0)) + 1;
    const nuevaPublicacion = new Publicacion(
      id,
      titulo.trim(),
      descripcion.trim(),
      direccion.trim(),
      precioNumerico,
      req.user?.correo ?? null,
      {
        imagen: imagen.trim(),
        alt: 'Publicación de alquiler',
        ubicacion: direccionCompleta,
        calificacion: 0,
        cantidadValoraciones: 0,
        detalle: titulo.trim()
      }
    );

    publicaciones.push(nuevaPublicacion);
    await writeFile(archivoPublicaciones, `${JSON.stringify(publicaciones, null, 2)}\n`, 'utf8');
    return res.status(201).json(nuevaPublicacion);
  } catch (error) {
    return responderErrorDireccion(error, res, next);
  }
}

export async function validarDireccion(req, res, next) {
  try {
    const resultado = await validarDireccionPublicacion(req.body?.direccion || req.query?.direccion);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.message === 'La dirección es obligatoria.') {
      return res.status(400).json({ error: error.message });
    }
    return responderErrorDireccion(error, res, next);
  }
}

function responderErrorDireccion(error, res, next) {
  if (error.code === 'ADDRESS_NOT_FOUND') {
    return res.status(400).json({ error: error.message });
  }
  if (error.code === 'ADDRESS_LOOKUP_FAILED') {
    return res.status(503).json({ error: error.message });
  }
  return next(error);
}
