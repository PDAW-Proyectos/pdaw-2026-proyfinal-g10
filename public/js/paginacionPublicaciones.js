export function crearPaginadorPublicaciones(elemento, renderizarPublicaciones) {
    const filtroPrecio = document.querySelector("[data-filtro-precio-maximo]");
    const filtroOrden = document.querySelector("[data-filtro-orden]");
    const filtroSoloPropias = document.querySelector("[data-filtro-solo-propias]");
    let paginaActual = 1;
    let solicitudActual = 0;

    const cargar = async (pagina = paginaActual) => {
        const idSolicitud = ++solicitudActual;
        const parametros = new URLSearchParams({
            page: String(pagina),
            limit: "6"
        });
        if (filtroPrecio?.value.trim()) {
            parametros.set("maxPrice", filtroPrecio.value.trim());
        }
        if (filtroOrden?.value) {
            parametros.set("order", filtroOrden.value);
        }
        if (filtroSoloPropias) {
            parametros.set("onlyMine", String(filtroSoloPropias.checked));
        }

        try {
            const response = await fetch(`/api/publicaciones?${parametros}`);
            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.error || `Error al obtener publicaciones: ${response.status}`);
            }
            if (
                !Array.isArray(resultado.publicaciones) ||
                !Number.isInteger(resultado.pagina) ||
                !Number.isInteger(resultado.totalPaginas)
            ) {
                throw new Error("La respuesta de publicaciones no tiene un formato válido.");
            }
            if (idSolicitud !== solicitudActual) return;

            paginaActual = resultado.pagina;
            const contenido = renderizarPublicaciones(resultado.publicaciones);
            const elementos = [];
            if (resultado.totalPaginas > 1) {
                elementos.push(crearNavegacion(resultado.pagina, resultado.totalPaginas, cargar, true));
            }
            elementos.push(contenido);
            if (resultado.totalPaginas > 1) {
                elementos.push(crearNavegacion(resultado.pagina, resultado.totalPaginas, cargar));
            }
            elemento.replaceChildren(...elementos);
        } catch (error) {
            if (idSolicitud !== solicitudActual) return;
            console.error("Error al cargar las publicaciones:", error);
            elemento.textContent = error.message || "No se pudieron cargar las publicaciones.";
        }
    };

    filtroPrecio?.addEventListener("input", () => cargar(1));
    filtroOrden?.addEventListener("change", () => cargar(1));
    filtroSoloPropias?.addEventListener("change", () => cargar(1));

    return { cargar };
}

function crearNavegacion(pagina, totalPaginas, cargar, superior = false) {
    const navegacion = document.createElement("nav");
    navegacion.className = superior ? "mt-5 mb-4" : "mt-4";
    navegacion.setAttribute("aria-label", "Paginación de publicaciones");

    const lista = document.createElement("ul");
    lista.className = "pagination flex-wrap justify-content-center align-items-center mb-0";

    const anterior = crearBotonPagina("Anterior", pagina - 1, pagina === 1, cargar);
    const botonesPagina = Array.from({ length: totalPaginas }, (_, indice) => {
        const numeroPagina = indice + 1;
        return crearBotonPagina(
            String(numeroPagina),
            numeroPagina,
            false,
            cargar,
            numeroPagina === pagina
        );
    });
    const siguiente = crearBotonPagina("Siguiente", pagina + 1, pagina === totalPaginas, cargar);

    lista.append(anterior, ...botonesPagina, siguiente);
    navegacion.appendChild(lista);
    return navegacion;
}

function crearBotonPagina(texto, pagina, deshabilitado, cargar, actual = false) {
    const item = document.createElement("li");
    item.className = `page-item${deshabilitado ? " disabled" : ""}${actual ? " active" : ""}`;
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "page-link";
    boton.textContent = texto;
    boton.disabled = deshabilitado || actual;
    if (actual) {
        boton.setAttribute("aria-current", "page");
    }
    boton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        cargar(pagina);
    });
    item.appendChild(boton);
    return item;
}
