import { Cliente } from "./Cliente.js";
import { Propietario } from "./Propietario.js";
export class RepositorioUsuarios {
    constructor() {
        this.usuarios = [];
    }

    async agregarUsuario(usuario) {
        if (this.buscarUsuarioPorCorreo(usuario.correo)) {
            throw new Error(`El correo ${usuario.correo} ya está registrado`);
        }
        if(usuario.tipo === "Cliente") {
            await this.agregarCliente(usuario.nombre, usuario.correo, usuario.contrasena);
        } else if(usuario.tipo === "Propietario") {
            await this.agregarPropietario(usuario.nombre, usuario.correo, usuario.contrasena);
        }
    }

    async agregarCliente(nombre, correo, contrasena) {
        const cliente = new Cliente(nombre, correo, contrasena);
        this.usuarios.push(cliente);
    }

    async agregarPropietario(nombre, correo, contrasena) {
        const propietario = new Propietario(nombre, correo, contrasena);
        this.usuarios.push(propietario);
    }

    buscarUsuarioPorCorreo(correo) {
        return this.usuarios.find(usuario => usuario.correo === correo);
    }

    buscarUsuarioActivo() {
        return this.usuarios.find(usuario => usuario.activo);
    }

    async cargarDesde(datos) {
        for (const elemento of datos) {
            this.agregarUsuario(elemento);
        }
    }
}