import { Router } from 'express';
import { requireAuth } from '../middleware/autentificacion.js';
import {
  actualizarEstadoAlquiler,
  cancelarAlquiler,
  crearAlquiler,
  listarAlquileres,
  listarAlquileresPropietario
} from '../controllers/alquilerController.js';

export function crearAlquilerRoutes(usuarios) {
  const router = Router();

  router.get('/', requireAuth, listarAlquileres);
  router.post('/', requireAuth, crearAlquiler);
  router.patch('/:id/cancelar', requireAuth, cancelarAlquiler);
  router.get('/propietario', requireAuth, (req, res) =>
    listarAlquileresPropietario(req, res, usuarios)
  );
  router.patch('/:id/estado', requireAuth, (req, res) =>
    actualizarEstadoAlquiler(req, res, usuarios)
  );

  return router;
}
