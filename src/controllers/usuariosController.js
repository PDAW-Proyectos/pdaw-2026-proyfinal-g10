import { UserService } from "../service/usuariosService.js";


export class UserController {
  constructor(userService) {
    this.userService =  userService
  }

  agregar = async (req, res) => {
    try {
  console.log(this.userService)

      console.log(req.body, 'usuario')
      const usuario = await this.userService.agregarUsuario({
        nombre: req.body.nombre,
        correo: req.body.correo,
        contrasena: req.body.contrasena,
        tipo: req.body.tipo
      });
      return res.status(200).json(usuario);
    } catch (error) {
      return res.status(420).json({ error: error.messages });
    }
  };
  buscarPorCorreo = async (req, res, next) => {
    try {
      const usuario = await this.userService.buscarUsuarioPorEmail(
        req.params.correo,
      );
      res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  };
  listarUsuarios = async (req, res, next) => {
    try {
      const usuarios = await this.userService.listarUsuarios();
      res.status(200).json(usuarios);
    } catch (error) {
      next(error);
    }
  };
}
