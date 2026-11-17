export function configurarFiltros(publicaciones, renderizarPublicaciones) {
    const filtroPrecio = document.querySelector("[data-filtro-precio-maximo]");
    const filtroOrden = document.querySelector("[data-filtro-orden]");

    const actualizarPublicaciones = () => {
        const publicacionesFiltradas = filtrarPublicaciones(
            publicaciones,
            filtroPrecio?.value ?? "",
            filtroOrden?.value ?? ""
        );
        renderizarPublicaciones(publicacionesFiltradas);
    };

    filtroPrecio?.addEventListener("keyup", actualizarPublicaciones);
    filtroOrden?.addEventListener("change", actualizarPublicaciones);

    return actualizarPublicaciones;
}

export function filtrarPublicaciones(publicaciones, precioMaximo = "", orden = "") {
    let resultado = [...publicaciones];
    const limitePrecio = precioMaximo.trim() === "" ? NaN : Number(precioMaximo);

    if (Number.isFinite(limitePrecio)) {
        resultado = resultado.filter((publicacion) => Number(publicacion.precio) <= limitePrecio);
    }

    switch (orden) {
        case "menor-precio":
            resultado.sort((a, b) => obtenerNumero(a.precio) - obtenerNumero(b.precio));
            break;
        case "mayor-precio":
            resultado.sort((a, b) => obtenerNumero(b.precio) - obtenerNumero(a.precio));
            break;
        case "mayor-calificacion":
            resultado.sort((a, b) => obtenerNumero(b.calificacion) - obtenerNumero(a.calificacion));
            break;
        case "cantidad-valoraciones":
            resultado.sort(
                (a, b) => obtenerNumero(b.cantidadValoraciones) - obtenerNumero(a.cantidadValoraciones)
            );
            break;
    }

    return resultado;
}

function obtenerNumero(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}
