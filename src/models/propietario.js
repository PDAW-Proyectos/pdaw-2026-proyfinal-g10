import { Usuario } from "./usuario.js";

export class Propietario extends Usuario {
  constructor(nombre,apellido, correo, contrasena,telefono) {
    super(nombre,apellido, correo, contrasena,telefono);
    this.tipo = "Propietario";
    this.publicaciones = []; // Array para almacenar las publicaciones del propietario
  }
}