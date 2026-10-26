export class Alquiler {
    constructor(id, producto, fechaInicio, fechaFin){
        this.id = id;
        this.producto = producto; // Objeto de tipo Producto
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = "pendiente";
        this.fechaSolicitud = new Date();
    }

    cancelar() {
        if (this.estado === "pendiente") {
            this.estado = "cancelado";
        } 
    }

    finalizar() {
        if (this.estado === "pendiente") {
            this.estado = "finalizado";
        }
    }
}