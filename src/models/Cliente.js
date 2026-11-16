import { Usuario } from "./usuario.js";

export class Cliente extends Usuario {
  constructor(nombre,apellido, correo, contrasena,telefono) {
    super(nombre,apellido, correo, contrasena,telefono);
    this.tipo = "Cliente";
    this.historial = [];
  }
}