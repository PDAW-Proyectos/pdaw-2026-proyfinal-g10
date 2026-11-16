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
        let nuevoUsuario;
        if(usuario.tipo === "Cliente") {
            nuevoUsuario = await this.agregarCliente(usuario.nombre,usuario.apellido, usuario.correo, usuario.contrasena,usuario.telefono);
        } else if(usuario.tipo === "Propietario") {
            nuevoUsuario = await this.agregarPropietario(usuario.nombre,usuario.apellido, usuario.correo, usuario.contrasena,usuario.telefono);
        } else {
            throw new ValidationError('El tipo de usuario es obligatorio');
        }
        return nuevoUsuario;
    }

    async agregarCliente(nombre,apellido, correo, contrasena,telefono) {
   const cliente = new Cliente(nombre,apellido, correo, contrasena,telefono);
   cliente.contrasena = await hash(contrasena, ROUNDS);
   this.usuarios.push(cliente);
   return cliente;
    }

    async agregarPropietario(nombre,apellido, correo, contrasena,telefono)  {
   const propietario = new Propietario(nombre,apellido, correo, contrasena,telefono);
   propietario.contrasena = await hash(contrasena, ROUNDS);
   this.usuarios.push(propietario);
   return propietario;
    }

    buscarUsuarioPorCorreo(correo) {
        if (!correo) return undefined;
        return this.usuarios.find(usuario => usuario.correo.trim().toLowerCase() === String(correo).trim().toLowerCase());
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

    toPublic = ({ nombre,apellido, correo, tipo,telefono }) => ({ nombre,apellido, correo, tipo,telefono });

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
