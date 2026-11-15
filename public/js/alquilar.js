const modal = document.getElementById('detallePublicacion');
const formAlquiler = document.getElementById('formAlquiler');
const botonAlquilar = document.getElementById('botonAlquilar');
const mensajeAlquiler = document.getElementById('mensajeAlquiler');
const fechaInicio = document.getElementById('fechaInicioAlquiler');
const fechaFin = document.getElementById('fechaFinAlquiler');

let alquilerBloqueado = false;
let mensajeBloqueo = '';

if (modal && formAlquiler && botonAlquilar && mensajeAlquiler && fechaInicio && fechaFin) {
  botonAlquilar.disabled = true;

  document.addEventListener('show.bs.modal', (event) => {
    if (event.target !== modal) return;

    const publicacion = event.relatedTarget?.dataset.publicacion;
    modal.dataset.publicacionId = '';
    formAlquiler.reset();
    ocultarMensaje();

    if (publicacion) {
      try {
        modal.dataset.publicacionId = String(JSON.parse(publicacion).id || '');
      } catch (error) {
        console.error('No se pudo leer la publicación seleccionada:', error);
        mostrarMensaje('No se pudo identificar la publicación.', 'danger');
      }
    }

    const hoy = fechaActualLocal();
    fechaInicio.min = hoy;
    fechaInicio.value = hoy;
    actualizarFechaMinimaFin();

    if (alquilerBloqueado) {
      mostrarMensaje(mensajeBloqueo, 'warning');
    }
  });

  fechaInicio.addEventListener('change', actualizarFechaMinimaFin);

  formAlquiler.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (alquilerBloqueado) {
      mostrarMensaje(mensajeBloqueo, 'warning');
      return;
    }

    const publicacionId = modal.dataset.publicacionId;
    if (!publicacionId) {
      mostrarMensaje('No se pudo identificar la publicación.', 'danger');
      return;
    }

    if (!formAlquiler.reportValidity()) return;

    botonAlquilar.disabled = true;
    try {
      const response = await fetch('/api/alquileres', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicacionId,
          fechaInicio: fechaInicio.value,
          fechaFin: fechaFin.value
        })
      });
      const resultado = await response.json();

      if (!response.ok) {
        if (response.status === 409 && resultado.error === 'Ya tienes un alquiler activo o pendiente.') {
          alquilerBloqueado = true;
          mensajeBloqueo = resultado.error;
        }
        throw new Error(resultado.error || 'No se pudo realizar el alquiler.');
      }

      alquilerBloqueado = true;
      mensajeBloqueo = 'Ya tienes un alquiler activo o pendiente.';
      mostrarMensaje('Solicitud de alquiler registrada. Quedó pendiente de aprobación.', 'success');
    } catch (error) {
      console.error('Error al realizar el alquiler:', error);
      mostrarMensaje(error.message || 'No se pudo realizar el alquiler.', 'danger');
    } finally {
      botonAlquilar.disabled = alquilerBloqueado;
    }
  });

  window.addEventListener('DOMContentLoaded', cargarHistorial);
}

async function cargarHistorial() {
  try {
    const response = await fetch('/api/alquileres', { credentials: 'same-origin' });
    if (response.status === 401 || response.status === 403) {
      alquilerBloqueado = true;
      mensajeBloqueo = response.status === 401
        ? 'Inicia sesión como cliente para realizar un alquiler.'
        : 'Solo los clientes pueden realizar alquileres.';
      botonAlquilar.disabled = true;
      return;
    }

    const historial = await response.json();
    if (!response.ok || !Array.isArray(historial)) {
      throw new Error(historial.error || 'No se pudo consultar el historial de alquileres.');
    }

    alquilerBloqueado = historial.some(
      (alquiler) => ['activo', 'pendiente'].includes(alquiler.estado)
    );
    if (alquilerBloqueado) {
      mensajeBloqueo = 'Ya tienes un alquiler activo o pendiente.';
      botonAlquilar.disabled = true;
    } else {
      botonAlquilar.disabled = false;
    }
  } catch (error) {
    console.error('Error al consultar el historial de alquileres:', error);
    botonAlquilar.disabled = true;
    alquilerBloqueado = true;
    mensajeBloqueo = 'No se pudo validar tu historial. Intenta nuevamente más tarde.';
  }
}

function actualizarFechaMinimaFin() {
  if (!fechaInicio.value) {
    fechaFin.min = '';
    return;
  }

  const siguienteDia = new Date(`${fechaInicio.value}T00:00:00`);
  siguienteDia.setDate(siguienteDia.getDate() + 1);
  const year = siguienteDia.getFullYear();
  const month = String(siguienteDia.getMonth() + 1).padStart(2, '0');
  const day = String(siguienteDia.getDate()).padStart(2, '0');
  fechaFin.min = `${year}-${month}-${day}`;

  if (fechaFin.value && fechaFin.value < fechaFin.min) {
    fechaFin.value = '';
  }
}

function fechaActualLocal() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mostrarMensaje(texto, tipo) {
  mensajeAlquiler.textContent = texto;
  mensajeAlquiler.className = `alert alert-${tipo} mb-0`;
  mensajeAlquiler.hidden = false;
}

function ocultarMensaje() {
  mensajeAlquiler.textContent = '';
  mensajeAlquiler.hidden = true;
}