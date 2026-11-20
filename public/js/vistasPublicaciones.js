import { crearPublicaciones } from "./listaPublicaciones.js";
import { crearPaginadorPublicaciones } from "./paginacionPublicaciones.js";

let paginadorPublicaciones;
let correoUsuario = null;

const listaPublicaciones = document.getElementById("publicaciones");
const formularioPublicacion = document.getElementById("formCrearPublicacion");
const formularioReporte = document.getElementById("formReportarPublicacion");
const modalReporte = document.getElementById("reportarPublicacionModal");
const formularioValoracion = document.getElementById("formValorarPublicacion");
const modalValoracion = document.getElementById("valorarPublicacionModal");
let reporteEnviando = false;

window.addEventListener("load", async () => {
    try {
        if (listaPublicaciones?.dataset.vista === "propietario") {
            const sesionResponse = await fetch("/usuarios/me");
            const sesion = await sesionResponse.json();
            if (!sesionResponse.ok || !sesion.autenticado || sesion.usuario?.tipo !== "Propietario") {
                throw new Error(sesion.error || sesion.message || "No se pudo validar el propietario.");
            }
            correoUsuario = sesion.usuario.correo;
        }

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
        ? ["", "Reportes", "Valoraciones"]
        : ["Valorar", "Reportar"];

    if (!paginadorPublicaciones) {
        paginadorPublicaciones = crearPaginadorPublicaciones(
            listaPublicaciones,
            (filtradas) => crearPublicaciones(filtradas, acciones, correoUsuario)
        );
    }
    return paginadorPublicaciones.cargar(1);
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

const modalValoraciones = document.getElementById("valoracionesPublicacionModal");
modalValoraciones?.addEventListener("show.bs.modal", async (event) => {
    const boton = event.relatedTarget;
    if (!boton) return;

    modalValoraciones.querySelector("[data-valoraciones-titulo]").textContent =
        boton.dataset.publicacionTitulo;
    const lista = modalValoraciones.querySelector("[data-lista-valoraciones]");
    mostrarMensajeValoraciones(lista, "Cargando valoraciones...");

    try {
        const response = await fetch(
            `/api/publicaciones/${encodeURIComponent(boton.dataset.publicacionId)}/valoraciones`
        );
        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.error || resultado.message || "No se pudieron cargar las valoraciones.");
        }
        if (!Array.isArray(resultado)) {
            throw new Error("La respuesta de valoraciones no tiene un formato válido.");
        }
        if (resultado.length === 0) {
            mostrarMensajeValoraciones(lista, "Esta publicación todavía no tiene valoraciones.");
            return;
        }
        lista.replaceChildren(...resultado.map(crearTarjetaValoracion));
    } catch (error) {
        console.error("Error al cargar las valoraciones:", error);
        mostrarMensajeValoraciones(lista, error.message || "No se pudieron cargar las valoraciones.", "text-danger");
    }
});

function mostrarMensajeValoraciones(lista, texto, clase = "text-secondary") {
    const mensaje = document.createElement("p");
    mensaje.className = `${clase} mb-0`;
    mensaje.textContent = texto;
    lista.replaceChildren(mensaje);
}

function crearTarjetaValoracion(valoracion) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "border rounded-3 p-3 mb-3";

    const nombre = document.createElement("h3");
    nombre.className = "h6 fw-bold mb-2";
    nombre.textContent = valoracion.nombreUsuario || "Usuario";

    const estrellas = document.createElement("div");
    estrellas.className = "text-warning mb-1";
    estrellas.setAttribute("aria-label", `${valoracion.puntuacion} de 5 estrellas`);
    for (let indice = 1; indice <= 5; indice += 1) {
        const estrella = document.createElement("i");
        estrella.className = `bi ${indice <= valoracion.puntuacion ? "bi-star-fill" : "bi-star"} me-1`;
        estrellas.appendChild(estrella);
    }

    tarjeta.append(nombre, estrellas);
    if (valoracion.comentario) {
        const comentario = document.createElement("p");
        comentario.className = "mb-0";
        comentario.textContent = valoracion.comentario;
        tarjeta.appendChild(comentario);
    }
    return tarjeta;
}

modalValoracion?.addEventListener("show.bs.modal", (event) => {
    const boton = event.relatedTarget;
    if (!boton) return;

    modalValoracion.querySelector("[data-valoracion-publicacion]").textContent =
        boton.dataset.publicacionTitulo;
    formularioValoracion.reset();
    formularioValoracion.elements.publicacionId.value = boton.dataset.publicacionId;
    actualizarEstrellasValoracion(0);
    const mensaje = document.getElementById("mensajeValoracion");
    mensaje.hidden = true;
    mensaje.textContent = "";
    mensaje.className = "alert mt-3 mb-0";
});

modalValoracion?.querySelectorAll("[data-puntaje]").forEach((boton) => {
    boton.addEventListener("click", () => {
        const puntaje = Number(boton.dataset.puntaje);
        formularioValoracion.elements.puntuacion.value = String(puntaje);
        actualizarEstrellasValoracion(puntaje);
    });
});

function actualizarEstrellasValoracion(puntaje) {
    modalValoracion?.querySelectorAll("[data-puntaje]").forEach((boton) => {
        const icono = boton.querySelector("i");
        icono.className = Number(boton.dataset.puntaje) <= puntaje
            ? "bi bi-star-fill"
            : "bi bi-star";
    });
}

formularioValoracion?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const botonEnviar = document.getElementById("enviarValoracion");
    const mensaje = document.getElementById("mensajeValoracion");
    const datos = new FormData(formularioValoracion);
    const puntuacion = Number(datos.get("puntuacion"));
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
        mensaje.className = "alert alert-danger mt-3 mb-0";
        mensaje.textContent = "Elegí una puntuación de entre 1 y 5 estrellas.";
        mensaje.hidden = false;
        return;
    }

    botonEnviar.disabled = true;
    mensaje.hidden = true;
    try {
        const response = await fetch(
            `/api/publicaciones/${encodeURIComponent(datos.get("publicacionId"))}/valoraciones`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    puntuacion,
                    comentario: datos.get("comentario").trim()
                })
            }
        );
        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.error || resultado.message || "No se pudo enviar la valoración.");
        }
        mensaje.className = "alert alert-success mt-3 mb-0";
        mensaje.textContent = "La valoración se envió correctamente.";
        mensaje.hidden = false;
    } catch (error) {
        console.error("Error al enviar la valoración:", error);
        mensaje.className = "alert alert-danger mt-3 mb-0";
        mensaje.textContent = error.message || "No se pudo enviar la valoración.";
        mensaje.hidden = false;
    } finally {
        botonEnviar.disabled = false;
    }
});

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
