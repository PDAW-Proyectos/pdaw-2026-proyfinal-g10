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
