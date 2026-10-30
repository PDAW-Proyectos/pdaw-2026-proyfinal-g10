import { Cliente } from "./Cliente.js";
import { Propietario } from "./Propietario.js";
import { hash, compare } from 'bcryptjs';
const ROUNDS = 10;
const password = 'clase08'
  const passwordHash = await hash(password, ROUNDS);
export class RepositorioUsuarios {
constructor() {
        this.usuarios = [

   { id: 'u1', nombre: 'Tomás Herrera', correo: 'tomas@ejemplo.test', role: 'member',contrasena: passwordHash },
   { id: 'u2', nombre: 'Lucía Fernández', correo: 'lucia@ejemplo.test', role: 'librarian',contrasena: passwordHash },
  ];
    }

    async agregarUsuario(usuario) { 
        const ROUNDS = 10
        const passwordHash = await hash(password, ROUNDS);

        if (this.buscarUsuarioPorCorreo(usuario.correo)) {
            throw new Error(`El correo ${usuario.correo} ya está registrado`);
        }
        if(usuario.tipo === "Cliente") {
            await this.agregarCliente(usuario.nombre, usuario.correo, usuario.contrasena);
            console.log('agregocliente')
        } else if(usuario.tipo === "Propietario") {
            await this.agregarPropietario(usuario.nombre, usuario.correo, usuario.contrasena);
        }
    }

    async agregarCliente(nombre, correo, contrasena) {
        const passwordHash = await hash(contrasena, ROUNDS);
        const cliente = new Cliente(nombre, correo, passwordHash);
        this.usuarios.push(cliente);
    }

    async agregarPropietario(nombre, correo, contrasena) {
        const passwordHash = await hash(contrasena, ROUNDS);
        const propietario = new Propietario(nombre, correo, passwordHash);
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
    async cargar() {
    if (!this.ruta) return;
}
  listarUsuarios() {
    return [...this.usuarios];
  }
 

 async verify(correo, plainPassword) {
      const usuario = this.usuarios.find((u) => u.correo === String(correo).trim().toLowerCase());
      if (!usuario) return null;
      return (await compare(String(plainPassword), usuario.contrasena)) ? usuario : null;
    }
     findById()
     {return  (id) => this.usuarios.find((u) => u.id === id) ?? null}

    toPublic = ({ id, nombre, correo, role }) => ({ id, nombre, correo, role });
}
