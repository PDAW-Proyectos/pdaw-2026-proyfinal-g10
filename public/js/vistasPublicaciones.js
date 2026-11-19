import { crearPublicaciones } from "./listaPublicaciones.js";
import { configurarFiltros } from "./filtrosPublicaciones.js";

var publicaciones = [];
let actualizarPublicaciones;
let correoUsuario = null;

const listaPublicaciones = document.getElementById("publicaciones");
const formularioPublicacion = document.getElementById("formCrearPublicacion");
const formularioReporte = document.getElementById("formReportarPublicacion");
const modalReporte = document.getElementById("reportarPublicacionModal");
let reporteEnviando = false;

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

        if (listaPublicaciones?.dataset.vista === "propietario") {
            const sesionResponse = await fetch("/usuarios/me");
            const sesion = await sesionResponse.json();
            if (!sesionResponse.ok || !sesion.autenticado || sesion.usuario?.tipo !== "Propietario") {
                throw new Error(sesion.error || sesion.message || "No se pudo validar el propietario.");
            }
            correoUsuario = sesion.usuario.correo;
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
        precio: Number(datos.get("precio")),
        titulo,
        descripcion: datos.get("descripcion").trim(),
        direccion: datos.get("direccion").trim()
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

function cargarPublicacionesVista() {
    if (!listaPublicaciones) return;

    const acciones = listaPublicaciones.dataset.vista === "propietario"
        ? ["Ver", "Reportes"]
        : ["Valorar", "Reportar"];

    if (!actualizarPublicaciones) {
        actualizarPublicaciones = configurarFiltros(
            publicaciones,
            (filtradas) => {
                listaPublicaciones.replaceChildren(crearPublicaciones(filtradas, acciones, correoUsuario));
            },
            correoUsuario
        );
    }
    actualizarPublicaciones();
}

const modalReportes = document.getElementById("reportesPublicacionModal");
modalReportes?.addEventListener("show.bs.modal", async (event) => {
    const boton = event.relatedTarget;
    if (!boton) return;

    modalReportes.querySelector("[data-reportes-titulo]").textContent =
        boton.dataset.publicacionTitulo;
    const lista = modalReportes.querySelector("[data-lista-reportes]");
    mostrarMensajeReportes(lista, "Cargando reportes...");

    try {
        const response = await fetch(
            `/api/publicaciones/${encodeURIComponent(boton.dataset.publicacionId)}/reportes`
        );
        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.error || resultado.message || "No se pudieron cargar los reportes.");
        }
        if (!Array.isArray(resultado)) {
            throw new Error("La respuesta de reportes no tiene un formato válido.");
        }

        if (resultado.length === 0) {
            mostrarMensajeReportes(lista, "Esta publicación todavía no tiene reportes.");
            return;
        }
        lista.replaceChildren(...resultado.map(crearTarjetaReporte));
    } catch (error) {
        console.error("Error al cargar los reportes:", error);
        mostrarMensajeReportes(lista, error.message || "No se pudieron cargar los reportes.", "text-danger");
    }
});

function mostrarMensajeReportes(lista, texto, clase = "text-secondary") {
    const mensaje = document.createElement("p");
    mensaje.className = `${clase} mb-0`;
    mensaje.textContent = texto;
    lista.replaceChildren(mensaje);
}

function crearTarjetaReporte(reporte) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "border rounded-3 p-3 mb-3";

    const motivo = document.createElement("h3");
    motivo.className = "h6 fw-bold";
    motivo.textContent = reporte.motivo || "Reporte";
    tarjeta.appendChild(motivo);

    if (reporte.descripcion) {
        const descripcion = document.createElement("p");
        descripcion.className = "mb-2";
        descripcion.textContent = reporte.descripcion;
        tarjeta.appendChild(descripcion);
    }

    const fecha = document.createElement("p");
    fecha.className = "small text-secondary mb-1";
    const fechaReporte = new Date(reporte.fecha);
    fecha.textContent = Number.isNaN(fechaReporte.getTime())
        ? "Fecha no disponible"
        : fechaReporte.toLocaleString("es-AR");
    tarjeta.appendChild(fecha);

    const estado = document.createElement("p");
    estado.className = "small text-secondary mb-0";
    estado.textContent = `Estado: ${reporte.estado || "pendiente"}`;
    tarjeta.appendChild(estado);

    return tarjeta;
}

modalReporte?.addEventListener("show.bs.modal", (event) => {
    const boton = event.relatedTarget;
    if (!boton) return;

    modalReporte.querySelector("[data-reporte-publicacion]").textContent =
        boton.dataset.publicacionTitulo;
    formularioReporte.reset();
    formularioReporte.elements.publicacionId.value = boton.dataset.publicacionId;
    const mensaje = document.getElementById("mensajeReporte");
    mensaje.hidden = true;
    mensaje.textContent = "";
    mensaje.className = "alert mb-0";
});

modalReporte?.addEventListener("hidden.bs.modal", () => {
    formularioReporte.reset();
    const mensaje = document.getElementById("mensajeReporte");
    mensaje.hidden = true;
    mensaje.textContent = "";
    mensaje.className = "alert mb-0";

    if (!reporteEnviando) {
        document.getElementById("enviarReporte").disabled = false;
    }
});

formularioReporte?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const botonEnviar = document.getElementById("enviarReporte");
    const mensaje = document.getElementById("mensajeReporte");
    const datos = new FormData(formularioReporte);
    botonEnviar.disabled = true;
    reporteEnviando = true;
    mensaje.hidden = true;
    let enviado = false;

    try {
        const response = await fetch(
            `/api/publicaciones/${encodeURIComponent(datos.get("publicacionId"))}/reportes`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    motivo: datos.get("motivo").trim(),
                    descripcion: datos.get("descripcion").trim()
                })
            }
        );
        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(
                resultado.error || resultado.message || `Error al enviar el reporte: ${response.status}`
            );
        }

        mensaje.classList.add("alert-success");
        mensaje.textContent = "El reporte se envió correctamente.";
        mensaje.hidden = false;
        enviado = true;
    } catch (error) {
        console.error("Error al enviar el reporte:", error);
        mensaje.classList.add("alert-danger");
        mensaje.textContent = error.message || "No se pudo enviar el reporte.";
        mensaje.hidden = false;
    } finally {
        reporteEnviando = false;
        if (!enviado || !modalReporte.classList.contains("show")) {
            botonEnviar.disabled = false;
        }
    }
});
