import { buscarUbicacionPorTexto } from './ubicacionService.js';

export async function validarDireccionPublicacion(direccion) {
  const texto = (direccion || '').toString().trim();

  if (!texto) {
    throw new Error('La dirección es obligatoria.');
  }

  const consulta = /bah[ií]a blanca/i.test(texto)
    ? texto
    : `${texto}, Bahía Blanca, Buenos Aires, Argentina`;
  const ubicacion = await buscarUbicacionPorTexto(consulta);

  return {
    valido: true,
    direccion: texto,
    ubicacion
  };
}
