import { Usuario } from "./usuario.js";

export class Cliente extends Usuario {
  constructor(nombre, correo, contrasena) {
    super(nombre, correo, contrasena);
    this.tipo = "Cliente";
  }
}