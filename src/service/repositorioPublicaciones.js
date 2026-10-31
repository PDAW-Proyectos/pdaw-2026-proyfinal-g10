import { Publicacion } from "../models/Publicacion.js";

export class RepositorioPublicaciones {

    constructor() {
        this.publicaciones = [];
        this.proximoId = 1;
    }

    crearPublicacion(titulo, descripcion, direccion, precio, autor) {
        const publicacion = new Publicacion(this.proximoId, titulo, descripcion, direccion, precio, autor);
        this.publicaciones.push(publicacion);
        this.proximoId++;
        return publicacion;
    }

    buscarPublicacionPorId(id) {
        return this.publicaciones.find(publicacion => publicacion.id === id);
    }

    buscarActivas() {
        return this.publicaciones.filter(publicacion => publicacion.activa);
    }

    cargarDesde(publicaciones) {
        this.publicaciones = publicaciones.map(pub => {
            const publicacion = new Publicacion(pub.id, pub.titulo, pub.descripcion, pub.direccion, pub.precio);
            publicacion.disponibilidad = pub.disponibilidad;
            publicacion.estado = pub.estado;
            publicacion.activa = pub.activa;
            publicacion.fechaCreacion = new Date(pub.fechaCreacion);
            return publicacion;
        });
    }
    
}