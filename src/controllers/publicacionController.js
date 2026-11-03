import { validarDireccionPublicacion } from '../service/publicacionesService.js';

const publicacionesDePrueba = [
  {
    id: 1,
    imagen: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
    alt: 'Departamento moderno en alquiler',
    tipo: 'Departamento',
    precio: 560,
    titulo: 'Departamento moderno',
    descripcion: '2 dorm. · 1 baño · Centro',
    ubicacion: 'Centro, Bahía Blanca',
    detalleDescripcion: 'Departamento luminoso, cerca de comercios y transporte.',
    caracteristicas: '2 dormitorios · 1 baño · Cocina equipada',
    calificacion: 4.5,
    cantidadValoraciones: 12,
    modal: 'detalleDepartamento',
    detalle: 'el departamento moderno'
  },
  {
    id: 2,
    imagen: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    alt: 'Casa con patio en alquiler',
    tipo: 'Casa',
    precio: 680,
    titulo: 'Casa con patio',
    descripcion: '3 dorm. · 2 baños · Barrio Norte',
    ubicacion: 'Barrio Norte, Bahía Blanca',
    detalleDescripcion: 'Casa amplia y luminosa, con espacios para disfrutar en familia.',
    caracteristicas: '3 dormitorios · 2 baños · Patio',
    calificacion: 3.5,
    cantidadValoraciones: 8,
    modal: 'detalleCasa',
    detalle: 'la casa con patio'
  }
];

export function listarPublicaciones(req, res) {
  return res.status(200).json(publicacionesDePrueba);
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
