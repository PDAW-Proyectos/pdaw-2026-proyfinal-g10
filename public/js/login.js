import { redireccion } from './common.js';
import { botonSesion } from './common.js';


window.addEventListener('load', async () => {
const formLogin = document.getElementById('loginForm')
const Registro = document.getElementById('formRegistro')

formLogin.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorSesion.hidden = true;
  errorSesion.textContent = '';
  try {
      const datos = new FormData(formLogin);
     const usuario = await fetch('/usuarios/login', {
        method: 'POST',
        body: new URLSearchParams(datos),
        
    });
      if (!usuario.ok) {
    const res = await usuario.json(); 
      handlerSesion(res.message);
      return;
    }
        redireccion();
    
  }  catch (error) {
    handlerSesion(error.message);
    }
 })
 

  Registro.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorRegistro.hidden = true;
    errorRegistro.textContent = '';
    try{
    const datos = new FormData(Registro);
    const respuesta = await fetch('/usuarios', {
        method: 'POST',
        body: new URLSearchParams(datos)
    });
 if (!respuesta.ok) {
    const res = await respuesta.json();
      handlerRegistro(res.message);
      return;
    }

      await fetch('/usuarios/login', {
        method: 'POST',
        body: new URLSearchParams(datos),       
    });
    redireccion();
        
}
  catch (error) {
        handlerRegistro(error.message);}
});


   })


  
  


function handlerRegistro(mensaje) {
  errorRegistro.textContent = mensaje || 'No se pudo completar el registro.';
  errorRegistro.hidden = false;
}
function handlerSesion(mensaje) {
  errorSesion.textContent = mensaje || 'No se pudo iniciar sesión.';
  errorSesion.hidden = false;
}