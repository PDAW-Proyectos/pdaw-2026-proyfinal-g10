

export class UserService {
  constructor(repositorioUsuarios) {
    this.repositorioUsuarios = repositorioUsuarios;
  }

  iniciarSesion = async (correo, contrasena, req) => {
    const usuario = this.repositorioUsuarios.buscarUsuarioPorCorreo(
      String(correo).trim().toLowerCase()
    );

    if (!usuario) throw new Error('Usuario no encontrado');
    const ok = await this.repositorioUsuarios.verify(correo, contrasena);

    if (!ok) throw new Error('Credenciales inválidas');

    req.session.userId = usuario.correo;
    return usuario;
  };

  cerrarSesion = async (req) => {
    if (!req.session.userId) throw new Error('No hay sesión iniciada');
    req.session.destroy();
  };
}