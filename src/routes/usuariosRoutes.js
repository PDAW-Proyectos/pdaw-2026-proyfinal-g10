import { Router } from 'express';
import {agregarUsuario} from "../controllers/usuariosController.js"

const router = Router();
router.post('./', agregarUsuario)
export default router