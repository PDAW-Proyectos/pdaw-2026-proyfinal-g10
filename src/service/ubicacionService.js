import { config } from '../config.js';
import { Direccion } from '../models/Direccion.js';
export async function buscarUbicacionPorTexto(query) {
  const texto = (query || '').toString().trim();

  if (!texto) {
    throw new Error('Debe enviar un texto de búsqueda en q.');
  }

  const url = new URL(config.nominatimBaseUrl);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', texto);
  url.searchParams.set('addressdetails', '1');

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'AlquiYA-Universidad/1.0'
      }
    });
  } catch (cause) {
    const error = new Error('No se pudo verificar la dirección en este momento. Intentá nuevamente.');
    error.code = 'ADDRESS_LOOKUP_FAILED';
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    const error = new Error('No se pudo verificar la dirección en este momento. Intentá nuevamente.');
    error.code = 'ADDRESS_LOOKUP_FAILED';
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (cause) {
    const error = new Error('No se pudo verificar la dirección en este momento. Intentá nuevamente.');
    error.code = 'ADDRESS_LOOKUP_FAILED';
    error.cause = cause;
    throw error;
  }

  if (!Array.isArray(data) || data.length === 0) {
    const error = new Error('No encontramos esa dirección. Verificá que esté escrita correctamente y que pertenezca a Bahía Blanca.');
    error.code = 'ADDRESS_NOT_FOUND';
    throw error;
  }

  const ubicacion = data[0];

  return new Direccion(
    ubicacion.display_name,
    Number(ubicacion.lat),
    Number(ubicacion.lon),
    ubicacion.address || {}
  );
}
