import { Router } from "express";
import { UserController } from "../controllers/usuariosController.js";
import { UserService } from "../service/usuariosService.js";
const router = Router();    
const userService = new UserService();
const userController = new UserController(userService);


    router.get("/", userController.listarUsuarios)
    router.post("/", userController.agregar);
    router.get("/:correo", userController.buscarPorCorreo);


   export default  router;
