import { crearPublicaciones } from "./listaPublicaciones.js";

const publicaciones = [
    {
        imagen: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
        alt: "Publicación de alquiler",
        tipo: "Departamento",
        precio: 560,
        titulo: "Departamento moderno",
        descripcion: "2 dorm. · 1 baño · Centro",
        ubicacion: "Centro, Bahía Blanca",
        detalleDescripcion: "Departamento luminoso, cerca de comercios y transporte.",
        caracteristicas: "2 dormitorios · 1 baño · Cocina equipada",
        calificacion: 4.5,
        cantidadValoraciones: 12,
        detalle: "el departamento moderno"
    },
    {
        imagen: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        alt: "Publicación de casa",
        tipo: "Casa",
        precio: 680,
        titulo: "Casa con patio",
        descripcion: "3 dorm. · 2 baños · Barrio Norte",
        ubicacion: "Barrio Norte, Bahía Blanca",
        detalleDescripcion: "Casa amplia y luminosa, con espacios para disfrutar en familia.",
        caracteristicas: "3 dormitorios · 2 baños · Patio",
        calificacion: 3.5,
        cantidadValoraciones: 8,
        detalle: "la casa con patio"
    }
];

const listaPublicaciones = document.getElementById("publicaciones");

window.addEventListener("load", async () => {
    await cargarPublicacionesVista();
});

async function cargarPublicacionesVista() {
    if (!listaPublicaciones) return;

    const acciones = listaPublicaciones.dataset.vista === "propietario"
        ? ["Ver", "Reportes"]
        : ["Valorar", "Reportar"];
    const publicacionesEnLista = crearPublicaciones(publicaciones, acciones);
    listaPublicaciones.replaceChildren(publicacionesEnLista);
}
