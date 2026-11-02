import { Router } from 'express';
import { validarDireccion } from '../controllers/publicacionController.js';

const router = Router();

router.post('/validar-direccion', validarDireccion);

export default router;
