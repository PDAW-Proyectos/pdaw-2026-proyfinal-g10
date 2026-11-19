const seccionMisAlquileres = document.getElementById('misAlquileresCliente');
const listaMisAlquileres = document.getElementById('listaMisAlquileres');
const mensajeMisAlquileres = document.getElementById('mensajeMisAlquileres');

if (seccionMisAlquileres && listaMisAlquileres && mensajeMisAlquileres) {
  cargarAlquileresCliente();
}

async function cargarAlquileresCliente() {
  try {
    const perfilResponse = await fetch('/usuarios/me', { credentials: 'same-origin' });
    const perfil = await perfilResponse.json();
    if (!perfilResponse.ok) {
      throw new Error(perfil.error || 'No se pudo consultar el perfil.');
    }
    if(!perfil.autenticado || !perfil.usuario) return  
    
    if (perfil.usuario.tipo !== 'Cliente') return;

    seccionMisAlquileres.hidden = false;
    const response = await fetch('/api/alquileres', { credentials: 'same-origin' });
    const alquileres = await response.json();
    if (!response.ok || !Array.isArray(alquileres)) {
      throw new Error(alquileres.error || 'No se pudieron cargar tus alquileres.');
    }

    renderizarMisAlquileres(alquileres);
  } catch (error) {
    console.error('Error al cargar los alquileres del cliente:', error);
    if (seccionMisAlquileres.hidden) return;
    mensajeMisAlquileres.textContent = error.message || 'No se pudieron cargar tus alquileres.';
    mensajeMisAlquileres.classList.add('text-danger');
  }
}

function renderizarMisAlquileres(alquileres) {
  listaMisAlquileres.replaceChildren();
  mensajeMisAlquileres.classList.remove('text-danger');

  if (alquileres.length === 0) {
    mensajeMisAlquileres.textContent = 'Todavía no tienes alquileres.';
    return;
  }

  mensajeMisAlquileres.textContent = '';
  alquileres.forEach((alquiler) => {
    const columna = document.createElement('div');
    columna.className = 'col-12';

    const tarjeta = document.createElement('article');
    tarjeta.className = 'border rounded-3 p-3';

    const titulo = document.createElement('h3');
    titulo.className = 'h6 fw-bold';
    titulo.textContent = alquiler.producto?.titulo || 'Alquiler';

    const fechas = document.createElement('p');
    fechas.className = 'mb-2 text-secondary';
    fechas.textContent = `Desde ${alquiler.fechaInicio} hasta ${alquiler.fechaFin}`;

    const estado = document.createElement('p');
    estado.className = 'mb-2';
    estado.textContent = `Estado: ${alquiler.estado}`;

    tarjeta.append(titulo, fechas, estado);
    if (['activo', 'pendiente'].includes(alquiler.estado)) {
      const botonCancelar = document.createElement('button');
      botonCancelar.type = 'button';
      botonCancelar.className = 'btn btn-outline-danger btn-sm';
      botonCancelar.textContent = 'Cancelar alquiler';
      botonCancelar.addEventListener('click', () => cancelarAlquiler(alquiler.id, botonCancelar));
      tarjeta.append(botonCancelar);
    }

    columna.append(tarjeta);
    listaMisAlquileres.append(columna);
  });
}

async function cancelarAlquiler(id, boton) {
  boton.disabled = true;
  try {
    const response = await fetch(`/api/alquileres/${encodeURIComponent(id)}/cancelar`, {
      method: 'PATCH',
      credentials: 'same-origin'
    });
    const alquiler = await response.json();
    if (!response.ok) {
      throw new Error(alquiler.error || 'No se pudo cancelar el alquiler.');
    }

    await cargarAlquileresCliente();
  } catch (error) {
    console.error('Error al cancelar el alquiler:', error);
    mensajeMisAlquileres.textContent = error.message || 'No se pudo cancelar el alquiler.';
    mensajeMisAlquileres.classList.add('text-danger');
    boton.disabled = false;
  }
}
