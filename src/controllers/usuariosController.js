

export class UserController {
  constructor(userService) {
    this.userService =  userService
  }

  agregar = async (req, res) => {
    try {
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
      const usuario = await this.userService.buscarUsuarioPorCorreo(
        req.params.correo,
      );
      res.status(200).json(usuario);
    } catch (error) {
    return res.status(400).json({ error: error.messages });
    }
  };
  listarUsuarios = async (req, res, next) => {
    try {
      const usuarios = await this.userService.listarUsuarios();
      res.status(200).json(usuarios);
    } catch (error) {
   return res.status(418).json({ error: error.messages });
    }
  };

  iniciarSesion = async (req, res, next) => {
    try {
      const { correo, contrasena } = req.body;
      const usuario = await this.userService.iniciarSesion(correo, contrasena, req);
      res.status(200).json(usuario);
    } catch (error) {
    return res.status(403).json({ error: error.messages });
    }
  };
  cerrarSesion = async (req, res, next) => {
    try {
      await this.userService.cerrarSesion(req);
      res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
    return res.status(403).json({ error: error.messages });
    }
}
}



