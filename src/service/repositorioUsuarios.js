import { Cliente } from "../models/Cliente.js";
import { Propietario } from "../models/propietario.js";
import { hash, compare } from 'bcryptjs';
import { regenerate, destroy } from "../utils/validacion.js";
import { NotFoundError, UnauthorizedError, ValidationError } from "../models/errores.js";

const ROUNDS = 10;
export class RepositorioUsuarios {
constructor() {
        this.usuarios = [];
    }
    async agregarUsuario(usuario) { 
        if (this.buscarUsuarioPorCorreo(usuario.correo)) {
            throw new ValidationError(`El correo ${usuario.correo} ya está registrado`);
        }
        if(usuario.tipo === "Cliente") {
            await this.agregarCliente(usuario.nombre, usuario.correo, usuario.contrasena);
        } else if(usuario.tipo === "Propietario") {
            await this.agregarPropietario(usuario.nombre, usuario.correo, usuario.contrasena);
        }
    }

    async agregarCliente(nombre, correo, contrasena) {
   const cliente = new Cliente(nombre, correo, contrasena);
  cliente.contrasena = await hash(contrasena, ROUNDS);
  this.usuarios.push(cliente);
    }

    async agregarPropietario(nombre, correo, contrasena) {
   const propietario = new Propietario(nombre, correo, contrasena);
  propietario.contrasena = await hash(contrasena, ROUNDS);
  this.usuarios.push(propietario);
    }

    buscarUsuarioPorCorreo(correo) {
        return this.usuarios.find(usuario => usuario.correo.trim().toLowerCase() === correo.trim().toLowerCase());
    }

    buscarUsuarioActivo() {
        return this.usuarios.find(usuario => usuario.activo);
    }

    async cargarDesde(datos) {
        for (const elemento of datos) {
            this.agregarUsuario(elemento);
        }
    }
    async cargar() {
    if (!this.ruta) return;
}
  listarUsuarios() {
    return [...this.usuarios];
  }
 

 async verify(correo, contrasena) {
    const correoComparable = String(correo).trim().toLowerCase();
      const usuario = this.usuarios.find((u) => u.correo.trim().toLowerCase() === correoComparable);
      if (!usuario) return null;
      return (await compare(String(contrasena), usuario.contrasena)) ? usuario : null;
    }

    toPublic = ({ nombre, correo, tipo }) => ({ nombre, correo, tipo });

 iniciarSesion = async (correo, contrasena, req) => {
    const usuario = this.buscarUsuarioPorCorreo(
      String(correo).trim().toLowerCase()
    );

    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    const ok = await this.verify(correo, contrasena);

    if (!ok) throw new ValidationError('Credenciales inválidas');
    usuario.activo = true
    await regenerate(req); 
    req.session.userId = usuario.correo;
    return usuario;
  };

  cerrarSesion = async (req) => {
    this.buscarUsuarioPorCorreo(req.session.userId).activo = false
    await destroy(req);
  };

}
