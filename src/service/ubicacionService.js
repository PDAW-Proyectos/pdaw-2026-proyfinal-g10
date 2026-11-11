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

  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'es',
      'User-Agent': 'AlquiYA-Universidad/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim respondió con estado ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No se encontró la ubicación solicitada.');
  }

  const ubicacion = data[0];

  return new Direccion(
    ubicacion.display_name,
    Number(ubicacion.lat),
    Number(ubicacion.lon),
    ubicacion.address || {}
  );
}
