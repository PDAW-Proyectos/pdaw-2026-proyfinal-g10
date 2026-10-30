import { Router } from "express";
import { UserController } from "../controllers/usuariosController.js";

export function crearUsuariosRoutes(usuarios){
const router = Router();    
const userController = (usuarios);


    router.get("/", userController.listarUsuarios)
    router.post("/", userController.agregar);
    router.get("/correo", userController.buscarPorCorreo);
   router.post("/login", userController.iniciarSesion);
   router.post("/logout", userController.cerrarSesion);
return router


}