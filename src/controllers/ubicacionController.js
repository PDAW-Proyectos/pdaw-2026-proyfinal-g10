import { buscarUbicacionPorTexto } from '../service/ubicacionService.js';

export async function obtenerUbicacion(req, res) {
  try {
    const ubicacion = await buscarUbicacionPorTexto(req.query.q);
    return res.status(200).json(ubicacion);
  } catch (error) {
    const mensaje = error.message || 'No se pudo consultar la API de ubicación.';

    if (mensaje.includes('Debe enviar') || mensaje.includes('No se encontró')) {
      return res.status(400).json({ error: mensaje });
    }

    return res.status(500).json({ error: mensaje });
  }
}
