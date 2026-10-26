export class Reporte {
    constructor(id, motivo, descripcion){
        this.id = id;
        this.motivo = motivo;
        this.descripcion = descripcion;
        this.fecha = new Date();
        this.estado = "pendiente";
    }

    consultarEstado() {
        return this.estado;
    }
}