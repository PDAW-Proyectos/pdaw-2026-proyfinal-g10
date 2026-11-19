export class Valoracion {
    constructor(puntuacion, comentario, emisor) {
        this.puntuacion = puntuacion;
        this.comentario = typeof comentario === "string" ? comentario : "";
        this.emisor = String(emisor).trim().toLowerCase();
    }
}