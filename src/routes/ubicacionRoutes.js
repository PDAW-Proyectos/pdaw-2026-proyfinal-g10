import { Router } from 'express';
import { obtenerUbicacion } from '../controllers/ubicacionController.js';

const router = Router();

router.get('/', obtenerUbicacion);

export default router;
