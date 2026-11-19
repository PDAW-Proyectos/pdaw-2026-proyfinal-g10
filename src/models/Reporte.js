export class Reporte {
    constructor(id, motivo, descripcion, reportante){
        this.id = id;
        this.motivo = motivo;
        this.descripcion = descripcion;
        this.reportante = reportante;
        this.fecha = new Date();
        this.estado = "pendiente";
    }

    consultarEstado() {
        return this.estado;
    }
}