import { Reporte } from "./Reporte.js";
import { ConflictError, ValidationError } from "./errores.js";
export class Publicacion {
    constructor(id, titulo, descripcion, direccion, precio, autor, detalles = {}) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.direccion = direccion;
        this.ubicacion = detalles.ubicacion ?? direccion;
        this.precio = precio;
        this.autor = autor; // Propietario que creó la publicación
        this.imagen = detalles.imagen ?? "";
        this.alt = detalles.alt ?? "";
        this.tipo = detalles.tipo ?? "";
        this.calificacion = detalles.calificacion ?? 0;
        this.cantidadValoraciones = detalles.cantidadValoraciones ?? 0;
        this.detalle = detalles.detalle ?? titulo;
        this.disponibilidad = "disponible";
        this.estado = "pendiente";
        this.activa = true;
        this.fechaCreacion = new Date();
        this.reportes = [];
    }

    desactivar() {
        this.activa = false;
    }
    
    reportar(motivo, descripcion, correoReportante) {
        if (typeof correoReportante !== "string" || !correoReportante.trim()) {
            throw new ValidationError("El reportante es obligatorio.");
        }

        const reportante = correoReportante.trim().toLowerCase();
        const yaReportada = this.reportes.some(
            (reporte) => String(reporte.reportante ?? "").trim().toLowerCase() === reportante
        );
        if (yaReportada) {
            throw new ConflictError("Ya reportaste esta publicación.");
        }

        const report = new Reporte(
            this.autor.reportes.length + 1,
            motivo,
            descripcion,
            reportante
        );
        this.reportes.push(report);
        this.autor.reportes.push(report);
    }
    
}