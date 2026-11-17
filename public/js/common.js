import  {api} from './api.js';


export const inicio = document.getElementById('inicio');
inicio.addEventListener('click', async () => {
   redireccion();
   })

const modalRegistro = document.getElementById('registerModal');
if (modalRegistro && location.hash === '#registerModal' && typeof bootstrap !== 'undefined') {
  bootstrap.Modal.getOrCreateInstance(modalRegistro).show();
}

 const botonSesion = document.getElementById('cerrarSesion');

botonSesion?.addEventListener('click', async () => {
  try {
    const respuesta = await fetch("/usuarios/logout", {
      method: "POST",
      credentials: "include"
    });

    if (respuesta.ok) location.href = '../index.html';
  } catch (error) {
    console.error("Error:", error);
  }
});

export async function redireccion(){

  try{
  const usuario = await api.buscarUsuario()
 
  if(usuario.tipo === 'Propietario'){
    location.href = '../vistaPropietario.html';
  }else{
    location.href = '../vistaCliente.html';
  }}
  catch{
    location.href = '../index.html';
  } 

  } 
