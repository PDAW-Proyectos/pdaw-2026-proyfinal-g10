function actualizarMapaEnModal(modalId, lat, lon) {
  const iframe = document.querySelector(`#${modalId} iframe`);
  if (!iframe) return;

  const latMin = Number(lat) - 0.02;
  const latMax = Number(lat) + 0.02;
  const lonMin = Number(lon) - 0.02;
  const lonMax = Number(lon) + 0.02;

  iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lonMin}%2C${latMin}%2C${lonMax}%2C${latMax}&layer=mapnik&marker=${lat}%2C${lon}`;
}

async function buscarUbicacionEnModal(modalId, direccion) {
  try {
    const response = await fetch(`/api/ubicacion?q=${encodeURIComponent(direccion)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo ubicar la dirección.');
    }

    actualizarMapaEnModal(modalId, data.lat, data.lon);
  } catch (error) {
    console.error(error);
  }
}

const modalDepartamento = document.getElementById('detalleDepartamento');
if (modalDepartamento) {
  modalDepartamento.addEventListener('shown.bs.modal', () => {
    buscarUbicacionEnModal('detalleDepartamento', 'Centro, Bahía Blanca');
  });
}

const modalCasa = document.getElementById('detalleCasa');
if (modalCasa) {
  modalCasa.addEventListener('shown.bs.modal', () => {
    buscarUbicacionEnModal('detalleCasa', 'Villa Mitre, Bahía Blanca');
  });
}
