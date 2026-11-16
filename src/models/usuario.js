import Validator from "validator";
import { Reporte } from "./Reporte.js";
import { ValidationError } from "./errores.js";
export class Usuario {

  constructor(nombre,apellido, correo, contrasena,telefono) {
    if(!nombre) throw new ValidationError("El nombre es obligatorio");
    if(!Validator.isLength(nombre, { min: 3, max: 30 })) throw new ValidationError("El nombre debe tener entre 3 y 30 caracteres");
    this.nombre = nombre;
      if(!apellido) throw new ValidationError("El apellido es obligatorio");
    if(!Validator.isLength(apellido, { min: 3, max: 15 })) throw new ValidationError("El apellido debe tener entre 3 y 15 caracteres");
      this.apellido = apellido
    if(!correo) throw new ValidationError("El correo es obligatorio");
    if(!Validator.isEmail(correo)) throw new ValidationError("El correo no es válido");
    this.correo = correo;
    if(!telefono)throw new ValidationError("El telefono es obligatorio");
    if(!Validator.isMobilePhone(telefono,'es-AR'))throw new ValidationError("ingrese un numero de argentina");
    this.telefono = telefono;
    if(!contrasena) throw new ValidationError("La contraseña es obligatoria");
    if(!Validator.isStrongPassword(contrasena)) throw new ValidationError("La contraseña no es segura, debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo");
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