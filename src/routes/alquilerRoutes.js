import { Router } from 'express';
import { requireAuth } from '../middleware/autentificacion.js';
import { crearAlquiler, listarAlquileres } from '../controllers/alquilerController.js';

const router = Router();

router.get('/', requireAuth, listarAlquileres);
router.post('/', requireAuth, crearAlquiler);

export default router;
