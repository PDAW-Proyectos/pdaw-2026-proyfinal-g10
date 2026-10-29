

export class UserService {
    repositorioUsuarios;

    constructor(repositorioUsuarios) {
        this.repositorioUsuarios = repositorioUsuarios;
    }

    buscarPorPorCorreo = async (correo) => {
        return await this.repositorioUsuarios.buscarUsuarioPorCorreo({ correo: correo });
    };

    agregar = async (datos) => {
        return await this.repositorioUsuarios.agregarUsuario(datos);
    }; 

    listarUsuarios = async () => { return this.repositorioUsuarios.listar()}


}