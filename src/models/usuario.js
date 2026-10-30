import Validator from "validator";
import { Reporte } from "./Reporte.js";
//import {hash,compare} from 'bcryptjs'
export class Usuario {

  constructor(nombre, correo, contrasena) {
    if(!nombre) throw new Error("El nombre es obligatorio");
    if(!Validator.isLength(nombre, { min: 3, max: 30 })) throw new Error("El nombre debe tener entre 3 y 30 caracteres");
    this.nombre = nombre;
    if(!correo) throw new Error("El correo es obligatorio");
    if(!Validator.isEmail(correo)) throw new Error("El correo no es válido");
    this.correo = correo;
    if(!contrasena) throw new Error("La contraseña es obligatoria");
    if(!Validator.isStrongPassword(contrasena)) throw new Error("La contraseña no es segura, debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo");
      //const passwordHash =  hash(contrasena, 10);
    this.contrasena = contrasena
    this.reportes = [];
    this.activo = false
  }

  mostrarPerfil() {
    return ("Nombre: " + this.nombre + " Correo: " + this.correo);
  }

  Reportar(motivo, descripcion) {
    const reporte = new Reporte(this.reportes.length + 1, motivo, descripcion);
    this.reportes.push(reporte);
  }
 
}