
const datosPersonales = document.getElementById('datos')
const encabezado = document.getElementById('perfil')
import { api } from "./api.js";

 async function obtenerUsuario(){
    try{
    const usuario = await api.buscarUsuario()
    encabezado.appendChild(crearEncabezado(usuario.nombre))
    datosPersonales.appendChild(crearPerfil(usuario))
}catch{
    location.href = '../index.html';
}
}

function crearPerfil(usuario){
const columna = document.createElement("div");
    columna.className = "col-lg-5";

    const card = document.createElement("div");
    card.className = "card border-0 shadow-sm rounded-4 h-100";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body p-4";

    const titulo = document.createElement("h3");
    titulo.className = "fw-semibold mb-3";
    titulo.textContent = "Datos personales";

    const lista = document.createElement("ul");
    lista.className = "list-group list-group-flush";

    Object.entries(usuario).forEach(([etiqueta, valor]) => {
        const item = document.createElement("li");
        item.className = "list-group-item px-0 py-3 d-flex justify-content-between";

        const span = document.createElement("span");
        span.className = "text-secondary";
        span.textContent = etiqueta;

        const strong = document.createElement("strong");
        strong.textContent = valor;

        item.appendChild(span);
        item.appendChild(strong);
        lista.appendChild(item);
    });

    cardBody.appendChild(titulo);
    cardBody.appendChild(lista);
    card.appendChild(cardBody);
    columna.appendChild(card);

    return columna;
 }

 function crearEncabezado(nombre){
    const columna = document.createElement('div')
    columna.className ='row align-items-center g-4'

const div = document.createElement('div')
div.className = 'col-auto'
const logo = document.createElement('div')   
logo.className = 'avatar-circle'
logo.textContent = (nombre.slice(0,1)) 
const usuario = document.createElement('h1')    
usuario.textContent = nombre
const div2 = document.createElement('div')
div2.className = 'col-md text-center'

div.appendChild(logo)
div2.appendChild(usuario)

columna.appendChild(div)
columna.appendChild(div2)

return columna
 }

 obtenerUsuario()

 