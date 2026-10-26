import Producto from './Producto.js';

export class Propiedad extends Producto {
    constructor(id, nombre, imagen, direccion) {
        super(id, nombre, imagen);
        this.direccion = direccion; // Objeto de tipo direccion
        this.tipo = "Propiedad";
    }
}