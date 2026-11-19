import { Reporte } from "./Reporte.js";
import { Valoracion } from "./Valoracion.js";
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
        this.valoraciones = Array.isArray(detalles.valoraciones)
            ? detalles.valoraciones
            : [];
        if (this.valoraciones.length > 0) {
            this.calcularCalificacion();
        }
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
    
    valorar(puntuacion, comentario, emisor) {
        if (typeof puntuacion !== "number" || puntuacion < 1 || puntuacion > 5) {
            throw new ValidationError("La puntuación debe ser un número entre 1 y 5.");
        }
        if (typeof emisor !== "string" || !emisor.trim()) {
            throw new ValidationError("El emisor es obligatorio.");
        }

        const emisorNormalizado = emisor.trim().toLowerCase();
        const yaValorada = this.valoraciones.some(
            (valoracion) => String(valoracion.emisor ?? "").trim().toLowerCase() === emisorNormalizado
        );
        if (yaValorada) {
            throw new ConflictError("Ya valoraste esta publicación.");
        }

        const valoracion = new Valoracion(puntuacion, comentario, emisor);
        this.valoraciones.push(valoracion);
        this.calcularCalificacion();
        return valoracion;
    }

    calcularCalificacion() {
        if (this.valoraciones.length === 0) {
            this.calificacion = 0;
            this.cantidadValoraciones = 0;
            return;
        }
        let sumaPuntuaciones = 0;
        this.valoraciones.forEach((element) => {
            sumaPuntuaciones += element.puntuacion;
        });
        this.calificacion = sumaPuntuaciones / this.valoraciones.length;
        this.cantidadValoraciones = this.valoraciones.length;
    }
}