import { buscarUbicacionPorTexto } from './ubicacionService.js';

export async function validarDireccionPublicacion(direccion) {
  const texto = (direccion || '').toString().trim();

  if (!texto) {
    throw new Error('La dirección es obligatoria.');
  }

  const ubicacion = await buscarUbicacionPorTexto(texto);

  return {
    valido: true,
    direccion: texto,
    ubicacion
  };
}
