async function solicitar(url, opciones = {}, formato = "json") {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new Error("No hay conexión con el servidor.");
  }

  if (respuesta.status === 204) return null;

  const datos = formato === "text" ? await respuesta.text() : await respuesta.json();
  if (!respuesta.ok) {
    const mensaje =
      typeof datos === "object" && datos !== null
        ? (datos.error ?? datos.message)
        : null;
    throw new Error(mensaje || `Error del servidor (${respuesta.status}).`);
  }
  return datos;
}

const JSON_HEADERS = { "Content-Type": "application/json" };


export const api = {
  buscarUsuario: () =>
 solicitar(`/usuarios/me`)

  }