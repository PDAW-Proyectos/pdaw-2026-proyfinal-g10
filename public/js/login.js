
const formLogin = document.getElementById('loginForm')
const Registro = document.getElementById('formRegistro')
//import { botonSesion } from "./common.js";
//botonSesion
window.addEventListener('DOMContentLoaded', () => {
  if (window.AlquiYA && typeof window.AlquiYA.initLoginPage === 'function') {
    window.AlquiYA.initLoginPage();
  }
});


formLogin.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
      const datos = new FormData(formLogin);
     const usuario = await fetch('/usuarios/login', {
        method: 'POST',
        body: new URLSearchParams(datos),
        
    });
       if (usuario.ok) {
            window.location.href = '../index.html';
        }
    
  }  catch (error) {
        console.error("Error:", error);
    }
 })




Registro.addEventListener('submit', async (event) => {
    event.preventDefault();
    try{
    const datos = new FormData(Registro);
    const respuesta = await fetch('/usuarios', {
        method: 'POST',
        body: new URLSearchParams(datos)
    });

     if (respuesta.ok) {
      await fetch('/usuarios/login', {
        method: 'POST',
        body: new URLSearchParams(datos),
        
    });
            
            window.location.href = '../index.html';
        }
}
  catch (error) {
        console.error("Error:", error);}
});
