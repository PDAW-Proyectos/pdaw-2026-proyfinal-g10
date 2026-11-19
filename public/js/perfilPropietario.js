const seccionAlquileres = document.getElementById('solicitudesAlquilerPropietario');
const listaAlquileres = document.getElementById('alquileresPropietario');
const mensajeAlquileres = document.getElementById('mensajeSolicitudesAlquiler');

if (seccionAlquileres && listaAlquileres && mensajeAlquileres) {
  cargarAlquileresPropietario();
}

async function cargarAlquileresPropietario() {
  try {
    const perfilResponse = await fetch('/usuarios/me', { credentials: 'same-origin' });
    const perfil = await perfilResponse.json();
    if (!perfilResponse.ok) {
      throw new Error(perfil.error || 'No se pudo consultar el perfil.');
    }
    if(!perfil.autenticado || !perfil.usuario) return
    if (perfil.usuario.tipo !== 'Propietario') {
      return;
    }

    seccionAlquileres.hidden = false;
    const response = await fetch('/api/alquileres/propietario', {
      credentials: 'same-origin'
    });
    const alquileres = await response.json();
    if (!response.ok || !Array.isArray(alquileres)) {
      throw new Error(alquileres.error || 'No se pudieron cargar las solicitudes.');
    }

    renderizarAlquileres(alquileres);
  } catch (error) {
    console.error('Error al cargar las solicitudes de alquiler:', error);
    if (seccionAlquileres.hidden) return;
    seccionAlquileres.hidden = false;
    mensajeAlquileres.textContent = error.message || 'No se pudieron cargar las solicitudes.';
    mensajeAlquileres.classList.add('text-danger');
  }
}

function renderizarAlquileres(alquileres) {
  listaAlquileres.replaceChildren();
  mensajeAlquileres.classList.remove('text-danger');

  if (alquileres.length === 0) {
    mensajeAlquileres.textContent = 'Todavía no tienes solicitudes de alquiler.';
    return;
  }

  mensajeAlquileres.textContent = '';
  alquileres.forEach((alquiler) => {
    const columna = document.createElement('div');
    columna.className = 'col-12';

    const tarjeta = document.createElement('article');
    tarjeta.className = 'border rounded-3 p-3';

    const titulo = document.createElement('h3');
    titulo.className = 'h6 fw-bold';
    titulo.textContent = alquiler.producto?.titulo || 'Alquiler solicitado';

    const solicitante = document.createElement('p');
    solicitante.className = 'mb-1';
    solicitante.textContent = `Solicitante: ${alquiler.solicitante || 'No disponible'}`;

    const fechas = document.createElement('p');
    fechas.className = 'mb-2 text-secondary';
    fechas.textContent = `Desde ${alquiler.fechaInicio} hasta ${alquiler.fechaFin}`;

    const estado = document.createElement('p');
    estado.className = 'mb-2';
    estado.textContent = `Estado: ${alquiler.estado}`;

    tarjeta.append(titulo, solicitante, fechas, estado);

    if (alquiler.estado === 'pendiente') {
      const acciones = document.createElement('div');
      acciones.className = 'd-flex gap-2';
      acciones.append(
        crearBotonAccion(alquiler.id, 'activo', 'Aceptar', 'btn-success'),
        crearBotonAccion(alquiler.id, 'rechazado', 'Rechazar', 'btn-outline-danger')
      );
      tarjeta.append(acciones);
    }

    columna.append(tarjeta);
    listaAlquileres.append(columna);
  });
}

function crearBotonAccion(id, estado, etiqueta, clase) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `btn ${clase} btn-sm`;
  boton.textContent = etiqueta;
  boton.addEventListener('click', () => responderSolicitud(id, estado, boton));
  return boton;
}

async function responderSolicitud(id, estado, boton) {
  boton.disabled = true;
  try {
    const response = await fetch(`/api/alquileres/${encodeURIComponent(id)}/estado`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    const resultado = await response.json();
    if (!response.ok) {
      throw new Error(resultado.error || 'No se pudo actualizar la solicitud.');
    }

    await cargarAlquileresPropietario();
  } catch (error) {
    console.error('Error al responder la solicitud de alquiler:', error);
    mensajeAlquileres.textContent = error.message || 'No se pudo actualizar la solicitud.';
    mensajeAlquileres.classList.add('text-danger');
    boton.disabled = false;
  }
}