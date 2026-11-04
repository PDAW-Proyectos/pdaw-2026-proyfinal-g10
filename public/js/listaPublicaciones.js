const listaPublicaciones = document.getElementById("publicaciones");

window.addEventListener("load", async () => {
    await cargarPublicaciones();
});

document.addEventListener("show.bs.modal", (event) => {
    const publicacion = event.relatedTarget?.dataset.publicacion;
    if (!publicacion) return;

    actualizarModal(event.target, JSON.parse(publicacion));
});

export async function cargarPublicaciones() {
    if (!listaPublicaciones || listaPublicaciones.dataset.vista) return;

    listaPublicaciones.textContent = "";
    try {
        //const response = await fetch("/api/publicaciones");
        /*if (!response.ok) {
            throw new Error("");
        }*/
       // const publicaciones = await response.json();
        const publicaciones = [
            {
                id: 1,
                imagen: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
                tipo: "Departamento",
                precio: 560,
                titulo: "Departamento moderno",
                descripcion: "2 dorm. · 1 baño · Centro",
                ubicacion: "Centro, Bahía Blanca",
                detalleDescripcion: "Departamento luminoso en una ubicación céntrica, cerca de comercios y transporte.",
                caracteristicas: "2 dormitorios · 1 baño · Cocina equipada",
                calificacion: 4.5,
                cantidadValoraciones: 12
            },
            {
                id: 2,
                imagen: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
                tipo: "Departamento",
                precio: 450,
                titulo: "Departamento acogedor",
                descripcion: "1 dorm. · 1 baño · Barrio Norte",
                ubicacion: "Barrio Norte, Bahía Blanca",
                detalleDescripcion: "Departamento acogedor, ideal para una persona o una pareja.",
                caracteristicas: "1 dormitorio · 1 baño · Cocina equipada",
                calificacion: 0,
                cantidadValoraciones: 0
            }
        ];
        const publicacionesEnLista = crearPublicaciones(publicaciones);
        listaPublicaciones.appendChild(publicacionesEnLista);
    } catch (error) {
        console.error("Error al cargar las publicaciones:", error);
    }
}

export function crearPublicaciones(publicaciones, acciones = null) {
    const listado = document.createElement("div");
    listado.classList.add("row", "g-4");

    publicaciones.forEach((publicacion) => {
        const card = document.createElement("div");
        card.classList.add("col-md-6");

        const propertyCard = document.createElement("div");
        propertyCard.classList.add(
            "card",
            "border-0",
            "shadow-sm",
            "rounded-4",
            "overflow-hidden",
            "h-100",
            "property-card"
        );

        const image = document.createElement("img");
        image.src = publicacion.imagen;
        image.classList.add("card-img-top");
        image.alt = publicacion.alt || "Publicación de alquiler";

        const detailsButton = document.createElement("button");
        detailsButton.type = "button";
        detailsButton.classList.add("stretched-link", "border-0", "bg-transparent", "p-0");
        detailsButton.dataset.bsToggle = "modal";
        detailsButton.dataset.bsTarget = "#detallePublicacion";
        detailsButton.setAttribute(
            "aria-label",
            `Ver detalles de ${publicacion.detalle || publicacion.titulo}`
        );
        detailsButton.dataset.publicacion = JSON.stringify(publicacion);

        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "p-4");

        const summary = document.createElement("div");
        summary.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-2");

        const type = document.createElement("span");
        type.classList.add("badge", "rounded-pill", "bg-light", "text-primary");
        type.textContent = publicacion.tipo;

        const price = document.createElement("strong");
        price.classList.add("text-primary");
        price.textContent = `$ ${publicacion.precio}`;

        const title = document.createElement("h4");
        title.classList.add("fw-semibold", "mb-2");
        title.textContent = publicacion.titulo;

        const description = document.createElement("p");
        description.classList.add("text-secondary", "mb-3");
        description.textContent = publicacion.descripcion;

        summary.append(type, price);
        cardBody.append(summary, title, description);

        if (acciones) {
            const footer = document.createElement("div");
            footer.classList.add(
                "d-flex",
                "justify-content-between",
                "align-items-center",
                "position-relative",
                "z-2"
            );
            footer.appendChild(crearEstrellas(publicacion.calificacion));

            const actionButtons = document.createElement("div");
            actionButtons.classList.add("d-flex", "gap-2");
            const botonPrincipal = crearBoton(acciones[0], "btn-outline-primary");
            if (acciones[0] === "Ver") {
                botonPrincipal.dataset.bsToggle = "modal";
                botonPrincipal.dataset.bsTarget = "#detallePublicacion";
                botonPrincipal.dataset.publicacion = JSON.stringify(publicacion);
                botonPrincipal.setAttribute("aria-label", `Ver detalles de ${publicacion.titulo}`);
            }
            actionButtons.append(botonPrincipal, crearBoton(acciones[1], "btn-outline-secondary"));
            footer.appendChild(actionButtons);
            cardBody.appendChild(footer);
        } else {
            const loginLink = document.createElement("a");
            loginLink.href = "login.html";
            loginLink.classList.add(
                "btn",
                "btn-outline-primary",
                "btn-sm",
                "rounded-pill",
                "position-relative",
                "z-2"
            );
            loginLink.textContent = "Iniciá sesión para consultar";
            cardBody.appendChild(loginLink);
        }

        propertyCard.append(image, detailsButton, cardBody);
        card.appendChild(propertyCard);
        listado.appendChild(card);
    });

    return listado;
}

function actualizarModal(modal, publicacion) {
    modal.querySelector("[data-publicacion-titulo]").textContent = publicacion.titulo;
    modal.querySelector("[data-publicacion-imagen]").src = publicacion.imagen;
    modal.querySelector("[data-publicacion-imagen]").alt = publicacion.alt || publicacion.titulo;
    modal.querySelector("[data-publicacion-ubicacion]").textContent =
        `${publicacion.tipo} · ${publicacion.ubicacion || publicacion.descripcion}`;
    modal.querySelector("[data-publicacion-precio]").textContent = `$ ${publicacion.precio}`;
    modal.querySelector("[data-publicacion-descripcion]").textContent =
        publicacion.detalleDescripcion || publicacion.descripcion;
    modal.querySelector("[data-publicacion-caracteristicas]").textContent =
        `Características: ${publicacion.caracteristicas || publicacion.descripcion}`;
    modal.dataset.ubicacion = publicacion.ubicacion || "";

    const calificacion = Number(publicacion.calificacion) || 0;
    const rating = modal.querySelector("[data-publicacion-calificacion]");
    const estrellas = crearEstrellas(calificacion);
    const textoValoracion = document.createElement("span");
    textoValoracion.classList.add("text-secondary", "ms-2");
    textoValoracion.textContent =
        `${calificacion.toLocaleString("es-AR")} (${publicacion.cantidadValoraciones || 0} valoraciones)`;
    rating.setAttribute("aria-label", `Valoración: ${calificacion.toLocaleString("es-AR")} de 5 estrellas`);
    rating.replaceChildren(...estrellas.childNodes, textoValoracion);
}

function crearEstrellas(calificacion = 0) {
    const estrellas = document.createElement("div");
    estrellas.classList.add("text-warning");

    for (let indice = 0; indice < 5; indice += 1) {
        const estrella = document.createElement("i");
        const clase = calificacion >= indice + 1
            ? "bi-star-fill"
            : calificacion >= indice + 0.5
                ? "bi-star-half"
                : "bi-star";
        estrella.classList.add("bi", clase);
        estrellas.appendChild(estrella);
    }

    return estrellas;
}

function crearBoton(texto, estilo) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.classList.add("btn", estilo, "btn-sm", "rounded-pill");
    boton.textContent = texto;
    return boton;
}
