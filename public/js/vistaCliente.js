function actualizarMapaEnModal(modal, lat, lon) {
  const iframe = modal.querySelector("iframe");
  if (!iframe) return;

  const latMin = Number(lat) - 0.02;
  const latMax = Number(lat) + 0.02;
  const lonMin = Number(lon) - 0.02;
  const lonMax = Number(lon) + 0.02;

  iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lonMin}%2C${latMin}%2C${lonMax}%2C${latMax}&layer=mapnik&marker=${lat}%2C${lon}`;
}

async function buscarUbicacionEnModal(modal, direccion) {
  try {
    const response = await fetch(`/api/ubicacion?q=${encodeURIComponent(direccion)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo ubicar la dirección.');
    }

    actualizarMapaEnModal(modal, data.lat, data.lon);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('shown.bs.modal', (event) => {
  const ubicacion = event.target.dataset.ubicacion;
  if (ubicacion) buscarUbicacionEnModal(event.target, ubicacion);
});
