export class Publicacion {
    constructor(id, titulo, descripcion, direccion, precio, autor) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.direccion = direccion;
        this.precio = precio;
        this.autor = autor; // Propietario que creó la publicación
        this.disponibilidad = "disponible";
        this.estado = "pendiente";
        this.activa = true;
        this.fechaCreacion = new Date();
    }

    desactivar() {
        this.activa = false;
    }
    
    
}