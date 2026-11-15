import { Router } from 'express';
import { crearPublicacion, listarPublicaciones, validarDireccion } from '../controllers/publicacionController.js';

const router = Router();

router.get('/', listarPublicaciones);
router.post('/', crearPublicacion);
router.post('/validar-direccion', validarDireccion);

export default router;
