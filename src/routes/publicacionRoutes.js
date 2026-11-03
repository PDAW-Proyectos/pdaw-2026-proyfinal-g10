import { Router } from 'express';
import { listarPublicaciones, validarDireccion } from '../controllers/publicacionController.js';

const router = Router();

router.get('/', listarPublicaciones);
router.post('/validar-direccion', validarDireccion);

export default router;
