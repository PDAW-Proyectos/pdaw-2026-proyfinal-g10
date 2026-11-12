import { Router } from "express";
import { UserController } from "../controllers/usuariosController.js";
import { requireAuth } from "../middleware/autentificacion.js";

export function crearUsuariosRoutes(usuarios){
const router = Router();    
const userController = new UserController(usuarios);


    router.get("/",requireAuth, userController.listarUsuarios)
    router.get("/me",requireAuth, userController.buscarLogueado)
    router.post("/", userController.agregar);
    router.get("/correo/:correo",requireAuth, userController.buscarPorCorreo);
    router.post("/login", userController.iniciarSesion);
    router.post("/logout",requireAuth, userController.cerrarSesion);
return router


}