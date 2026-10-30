import { Router } from "express";
import { UserController } from "../controllers/usuariosController.js";
import { RepositorioUsuarios } from "../models/repositorioUsuarios.js";
const router = Router();    

const userController = new UserController(new RepositorioUsuarios ());

    router.get("/", userController.listarUsuarios)
    router.post("/", userController.agregar);
    router.get("/:correo", userController.buscarPorCorreo);
   export default  router;
