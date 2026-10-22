import { Usuario } from "./Usuario.js";

export class Propietario extends Usuario {
  constructor(nombre, correo, contrasena) {
    super(nombre, correo, contrasena);
    this.tipo = "Propietario";
    this.publicaciones = [];
  }
}