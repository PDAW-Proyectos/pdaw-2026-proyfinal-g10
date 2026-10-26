import Producto from './Producto.js';

export class Vehiculo extends Producto {
    constructor(id, nombre, imagen, patente, marca, modelo, anio) {
        super(id, nombre, imagen);
        this.patente = patente;
        this.marca = marca;
        this.modelo = modelo;
        this.anio = anio;
        this.tipo = "Vehiculo"
    }
}