import { Router } from 'express';
import { crearPublicacion, listarPublicaciones, validarDireccion } from '../controllers/publicacionController.js';

export function crearPublicacionRoutes(usuarios) {
  const router = Router();

  router.get('/', (req, res, next) =>
    listarPublicaciones(req, res, next, usuarios)
  );
  router.post('/', (req, res, next) =>
    crearPublicacion(req, res, next, usuarios)
  );
  router.post('/validar-direccion', validarDireccion);

  return router;
}
