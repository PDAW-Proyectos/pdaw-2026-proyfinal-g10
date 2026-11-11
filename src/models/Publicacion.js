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
        this.detalleDescripcion = detalles.detalleDescripcion ?? descripcion;
        this.caracteristicas = detalles.caracteristicas ?? "";
        this.calificacion = detalles.calificacion ?? 0;
        this.cantidadValoraciones = detalles.cantidadValoraciones ?? 0;
        this.detalle = detalles.detalle ?? titulo;
        this.disponibilidad = "disponible";
        this.estado = "pendiente";
        this.activa = true;
        this.fechaCreacion = new Date();
    }

    desactivar() {
        this.activa = false;
    }
    
    
}