import { crearPublicaciones, obtenerPublicaciones } from "./listaPublicaciones.js";

const listaPublicaciones = document.getElementById("publicaciones");

window.addEventListener("load", async () => {
    await cargarPublicacionesVista();
});

async function cargarPublicacionesVista() {
    if (!listaPublicaciones) return;

    try {
        const publicaciones = await obtenerPublicaciones();
        const acciones = listaPublicaciones.dataset.vista === "propietario"
            ? ["Ver", "Reportes"]
            : ["Valorar", "Reportar"];
        const publicacionesEnLista = crearPublicaciones(publicaciones, acciones);
        listaPublicaciones.replaceChildren(publicacionesEnLista);
    } catch (error) {
        console.error("Error al cargar las publicaciones:", error);
        listaPublicaciones.textContent = "No se pudieron cargar las publicaciones.";
    }
}
