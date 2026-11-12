
import { exponerUsuario } from "../middleware/transformador.js";
export class UserController {
  constructor(userService) {
    this.userService =  userService
  }

  agregar = async (req, res,next) => {
    try {
      const usuario = await this.userService.agregarUsuario({
        nombre: req.body.nombre,
        correo: req.body.correo,
        contrasena: req.body.contrasena,
        tipo: req.body.tipo
      });
      return res.status(201).json(usuario);
    } catch (error) {
       return next(error);
    }
  };
  buscarPorCorreo = async (req, res, next) => {
    try {
      const usuario = await this.userService.buscarUsuarioPorCorreo(
        req.params.correo,
      );
      res.status(200).json(usuario);
    } catch (error) {
     return next(error);
    }
  };
  listarUsuarios = async (req, res, next) => {
    try {
      const usuarios = await this.userService.listarUsuarios();
      res.status(200).json(usuarios);
    } catch (error) {
     return next(error);
    }
  };

  iniciarSesion = async (req, res, next) => {
    try {
      const { correo, contrasena } = req.body;
      const usuario = await this.userService.iniciarSesion(correo, contrasena, req);
      res.status(201).json(usuario);
    } catch (error) {
     return next(error);
    }
  };
  cerrarSesion = async (req, res, next) => {
    try {
      await this.userService.cerrarSesion(req);
      res.status(204).json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
    return next(error);
    }
}

buscarLogueado =  (req,res,next) => {
    try {
      res.status(200).json(exponerUsuario(this.userService.toPublic(req.user)));
    } catch (error) {
    return next(error);
    }

}
}



