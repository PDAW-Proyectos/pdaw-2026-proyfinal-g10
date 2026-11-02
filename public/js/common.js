window.AlquiYA = window.AlquiYA || {};
const botonSesion = document.getElementById('cerrarSesion')

window.AlquiYA.initModalFromHash = function (modalId, hash = '#registerModal') {
  const modalElement = document.getElementById(modalId);

  if (!modalElement || typeof bootstrap === 'undefined') {
    return null;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  if (window.location.hash === hash) {
    modal.show();
  }

  return modal;
};

window.AlquiYA.bindModalTriggers = function (triggerSelector, modalId) {
  const modalElement = document.getElementById(modalId);

  if (!modalElement || typeof bootstrap === 'undefined') {
    return null;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  document.querySelectorAll(triggerSelector).forEach((trigger) => {
    trigger.addEventListener('click', () => modal.show());
  });

  return modal;
};

window.AlquiYA.initLoginPage = function () {
  if (typeof bootstrap === 'undefined') {
    return;
  }

  window.AlquiYA.initModalFromHash('registerModal', '#registerModal');
  window.AlquiYA.bindModalTriggers('[data-bs-target="#registerModal"]', 'registerModal');
};


botonSesion.addEventListener('click', async ()=>{
try {
        const respuesta = await fetch("/usuarios/logout", {
            method: "POST",
            credentials: "include"
        });

        if (respuesta.ok) {
            window.location.href = '../index.html';
        }

    } catch (error) {
        console.error("Error:", error);
    }
} )


