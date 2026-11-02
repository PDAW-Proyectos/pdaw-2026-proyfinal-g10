import { validarDireccionPublicacion } from '../service/publicacionesService.js';

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
