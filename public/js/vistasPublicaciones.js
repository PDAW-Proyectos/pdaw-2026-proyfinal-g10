import { crearPublicaciones } from "./listaPublicaciones.js";

var publicaciones = [];

const listaPublicaciones = document.getElementById("publicaciones");
const formularioPublicacion = document.getElementById("formCrearPublicacion");

window.addEventListener("load", async () => {
    try {
        const response = await fetch("/api/publicaciones");
        if (!response.ok) {
            throw new Error(`Error al obtener publicaciones: ${response.status}`);
        }

        const resultado = await response.json();
        if (!Array.isArray(resultado)) {
            throw new Error("La respuesta de publicaciones no tiene un formato válido.");
        }

        publicaciones = resultado;
        await cargarPublicacionesVista();
    } catch (error) {
        console.error("Error al cargar las publicaciones:", error);
        if (listaPublicaciones) {
            listaPublicaciones.textContent = "No se pudieron cargar las publicaciones.";
        }
    }
});

formularioPublicacion?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const botonGuardar = document.getElementById("guardarPublicacion");
    const mensajeError = document.getElementById("errorCrearPublicacion");
    const datos = new FormData(formularioPublicacion);
    const titulo = datos.get("titulo").trim();
    const publicacion = {
        imagen: datos.get("imagen").trim(),
        alt: `Publicación de ${datos.get("tipo").toLowerCase()}`,
        tipo: datos.get("tipo"),
        precio: Number(datos.get("precio")),
        titulo,
        descripcion: datos.get("descripcion").trim(),
        ubicacion: datos.get("ubicacion").trim(),
        detalleDescripcion: datos.get("detalleDescripcion").trim(),
        caracteristicas: datos.get("caracteristicas").trim(),
        calificacion: 0,
        cantidadValoraciones: 0,
        detalle: titulo
    };

    mensajeError.hidden = true;
    botonGuardar.disabled = true;

    try {
        const response = await fetch("/api/publicaciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(publicacion)
        });
        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.error || `Error al crear la publicación: ${response.status}`);
        }

        publicaciones.push(resultado);
        await cargarPublicacionesVista();
        formularioPublicacion.reset();
        window.bootstrap.Modal.getOrCreateInstance(
            document.getElementById("crearPublicacionModal")
        ).hide();
    } catch (error) {
        console.error("Error al crear la publicación:", error);
        mensajeError.textContent = error.message || "No se pudo crear la publicación.";
        mensajeError.hidden = false;
    } finally {
        botonGuardar.disabled = false;
    }
});

async function cargarPublicacionesVista() {
    if (!listaPublicaciones) return;

    const acciones = listaPublicaciones.dataset.vista === "propietario"
        ? ["Ver", "Reportes"]
        : ["Valorar", "Reportar"];
    const publicacionesEnLista = crearPublicaciones(publicaciones, acciones);
    listaPublicaciones.replaceChildren(publicacionesEnLista);
}
