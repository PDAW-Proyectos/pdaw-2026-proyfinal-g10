import { readFile, writeFile } from 'node:fs/promises';
import { Publicacion } from '../models/Publicacion.js';
import { validarDireccionPublicacion } from '../service/publicacionesService.js';

const archivoPublicaciones = new URL('../repositories/Publicaciones.json', import.meta.url);
let colaReportes = Promise.resolve();

export async function listarPublicaciones(req, res, next, usuarios) {
  try {
    const archivo = await readFile(archivoPublicaciones, 'utf8');
    const publicaciones = JSON.parse(archivo);
    if (!Array.isArray(publicaciones)) {
      throw new Error('El archivo de publicaciones no contiene una lista válida.');
    }

    const paginaSolicitada = Number(req.query.page ?? 1);
    const limiteSolicitado = Number(req.query.limit ?? 6);
    if (
      !Number.isSafeInteger(paginaSolicitada) ||
      paginaSolicitada < 1 ||
      !Number.isSafeInteger(limiteSolicitado) ||
      limiteSolicitado < 1
    ) {
      return res.status(400).json({ error: 'La página y el límite deben ser números enteros positivos.' });
    }

    const limite = Math.min(limiteSolicitado, 6);
    const { maxPrice = '', order = '', onlyMine = 'false' } = req.query;
    if (
      (maxPrice !== '' && !Number.isFinite(Number(maxPrice))) ||
      !['', 'menor-precio', 'mayor-precio', 'mayor-calificacion', 'cantidad-valoraciones'].includes(order) ||
      !['true', 'false'].includes(onlyMine)
    ) {
      return res.status(400).json({ error: 'Los filtros de publicaciones no son válidos.' });
    }
    if (onlyMine === 'true' && req.user?.tipo !== 'Propietario') {
      return res.status(403).json({ error: 'Solo un propietario puede filtrar sus publicaciones.' });
    }

    let resultado = publicaciones;
    if (onlyMine === 'true') {
      const correoPropietario = req.user.correo.trim().toLowerCase();
      resultado = resultado.filter(
        (publicacion) => String(publicacion.autor || '').trim().toLowerCase() === correoPropietario
      );
    }
    if (maxPrice !== '') {
      const precioMaximo = Number(maxPrice);
      resultado = resultado.filter((publicacion) => Number(publicacion.precio) <= precioMaximo);
    }

    const obtenerNumero = (valor) => {
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero : 0;
    };
    switch (order) {
      case 'menor-precio':
        resultado = [...resultado].sort((a, b) => obtenerNumero(a.precio) - obtenerNumero(b.precio));
        break;
      case 'mayor-precio':
        resultado = [...resultado].sort((a, b) => obtenerNumero(b.precio) - obtenerNumero(a.precio));
        break;
      case 'mayor-calificacion':
        resultado = [...resultado].sort((a, b) => obtenerNumero(b.calificacion) - obtenerNumero(a.calificacion));
        break;
      case 'cantidad-valoraciones':
        resultado = [...resultado].sort(
          (a, b) => obtenerNumero(b.cantidadValoraciones) - obtenerNumero(a.cantidadValoraciones)
        );
        break;
    }

    const total = resultado.length;
    const totalPaginas = Math.ceil(total / limite);
    const pagina = Math.min(paginaSolicitada, Math.max(totalPaginas, 1));
    const inicio = (pagina - 1) * limite;
    const publicacionesPaginadas = resultado
      .slice(inicio, inicio + limite)
      .map((publicacion) => agregarNombreAutor(publicacion, usuarios));

    return res.status(200).json({
      publicaciones: publicacionesPaginadas,
      pagina,
      limite,
      total,
      totalPaginas
    });
  } catch (error) {
    return next(error);
  }
}

export async function crearPublicacion(req, res, next, usuarios) {
  const { imagen, precio, titulo, descripcion, direccion } = req.body || {};
  const camposTexto = [
    [titulo, 'El título es obligatorio.'],
    [imagen, 'La imagen es obligatoria.'],
    [descripcion, 'La descripción es obligatoria.'],
    [direccion, 'La dirección es obligatoria.']
  ];

  const campoIncompleto = camposTexto.find(
    ([valor]) => typeof valor !== 'string' || !valor.trim()
  );
  if (campoIncompleto) {
    return res.status(400).json({ error: campoIncompleto[1] });
  }

  const precioNumerico = Number(precio);
  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un número mayor que cero.' });
  }

  try {
    const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
    if (!Array.isArray(publicaciones)) {
      throw new Error('El archivo de publicaciones no contiene una lista válida.');
    }

    const resultadoDireccion = await validarDireccionPublicacion(direccion);
    const direccionCompleta = resultadoDireccion.ubicacion.direccionCompleta;
    const id = Math.max(0, ...publicaciones.map((publicacion) => Number(publicacion.id) || 0)) + 1;
    const nuevaPublicacion = new Publicacion(
      id,
      titulo.trim(),
      descripcion.trim(),
      direccion.trim(),
      precioNumerico,
      req.user?.correo ?? null,
      {
        imagen: imagen.trim(),
        alt: 'Publicación de alquiler',
        ubicacion: direccionCompleta,
        calificacion: 0,
        cantidadValoraciones: 0,
        detalle: titulo.trim()
      }
    );

    publicaciones.push(nuevaPublicacion);
    await writeFile(archivoPublicaciones, `${JSON.stringify(publicaciones, null, 2)}\n`, 'utf8');
    return res.status(201).json(agregarNombreAutor(nuevaPublicacion, usuarios));
  } catch (error) {
    return responderErrorDireccion(error, res, next);
  }
}

export async function reportarPublicacion(req, res, next, usuarios) {
  const { motivo, descripcion = '' } = req.body || {};
  if (typeof motivo !== 'string' || !motivo.trim()) {
    return res.status(400).json({ error: 'El motivo del reporte es obligatorio.' });
  }
  if (typeof descripcion !== 'string') {
    return res.status(400).json({ error: 'La descripción del reporte debe ser texto.' });
  }

  try {
    const operacion = colaReportes.then(async () => {
      const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
      const indice = publicaciones.findIndex(
        (publicacion) => String(publicacion.id) === String(req.params.id)
      );
      if (indice === -1) {
        return res.status(404).json({ error: 'No se encontró la publicación.' });
      }

      const datosPublicacion = publicaciones[indice];
      const autor = usuarios.buscarUsuarioPorCorreo(datosPublicacion.autor);
      if (!autor) {
        return res.status(400).json({ error: 'No se puede reportar una publicación sin autor registrado.' });
      }

      const publicacion = new Publicacion(
        datosPublicacion.id,
        datosPublicacion.titulo,
        datosPublicacion.descripcion,
        datosPublicacion.direccion,
        datosPublicacion.precio,
        autor,
        datosPublicacion
      );
      publicacion.reportes = Array.isArray(datosPublicacion.reportes)
        ? datosPublicacion.reportes
        : [];
      publicacion.reportar(motivo.trim(), descripcion.trim(), req.user.correo);
      publicaciones[indice] = { ...datosPublicacion, reportes: publicacion.reportes };
      await writeFile(archivoPublicaciones, `${JSON.stringify(publicaciones, null, 2)}\n`, 'utf8');

      return res.status(201).json({ mensaje: 'Reporte creado.' });
    });
    colaReportes = operacion.catch(() => {});
    return await operacion;
  } catch (error) {
    return next(error);
  }
}

let colaValoraciones = Promise.resolve();

export async function valorarPublicacion(req, res, next) {
  const puntuacion = Number(req.body?.puntuacion);
  const comentario = typeof req.body?.comentario === "string"
    ? req.body.comentario.trim()
    : "";

  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    return res.status(400).json({ error: "La puntuación debe ser un número entero entre 1 y 5." });
  }

  try {
    const operacion = colaValoraciones.then(async () => {
      const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
      const indice = publicaciones.findIndex(
        (publicacion) => String(publicacion.id) === String(req.params.id)
      );
      if (indice === -1) {
        return res.status(404).json({ error: 'No se encontró la publicación.' });
      }

      const datosPublicacion = publicaciones[indice];
      const autor = datosPublicacion.autor;
      const publicacion = new Publicacion(
        datosPublicacion.id,
        datosPublicacion.titulo,
        datosPublicacion.descripcion,
        datosPublicacion.direccion,
        datosPublicacion.precio,
        autor,
        datosPublicacion
      );
      publicacion.reportes = Array.isArray(datosPublicacion.reportes)
        ? datosPublicacion.reportes
        : [];
      publicacion.valoraciones = Array.isArray(datosPublicacion.valoraciones)
        ? datosPublicacion.valoraciones
        : [];
      publicacion.valorar(puntuacion, comentario, req.user.correo);

      publicaciones[indice] = {
        ...datosPublicacion,
        valoraciones: publicacion.valoraciones,
        calificacion: publicacion.calificacion,
        cantidadValoraciones: publicacion.cantidadValoraciones
      };
      await writeFile(archivoPublicaciones, `${JSON.stringify(publicaciones, null, 2)}\n`, 'utf8');

      return res.status(201).json({
        mensaje: "Valoración creada.",
        calificacion: publicacion.calificacion,
        cantidadValoraciones: publicacion.cantidadValoraciones
      });
    });
    colaValoraciones = operacion.catch(() => {});
    return await operacion;
  } catch (error) {
    return next(error);
  }
}

export async function listarReportesPublicacion(req, res, next) {
  try {
    const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
    const publicacion = publicaciones.find(
      (item) => String(item.id) === String(req.params.id)
    );
    if (
      !publicacion ||
      String(publicacion.autor || '').trim().toLowerCase() !== req.user.correo.trim().toLowerCase()
    ) {
      return res.status(404).json({ error: 'No se encontró la publicación.' });
    }

    const reportes = Array.isArray(publicacion.reportes) ? publicacion.reportes : [];
    return res.status(200).json(reportes.map(({ id, motivo, descripcion, fecha, estado }) => ({
      id,
      motivo,
      descripcion,
      fecha,
      estado
    })));
  } catch (error) {
    return next(error);
  }
}

export async function listarValoracionesPublicacion(req, res, next, usuarios) {
  try {
    const publicaciones = JSON.parse(await readFile(archivoPublicaciones, 'utf8'));
    const publicacion = publicaciones.find(
      (item) => String(item.id) === String(req.params.id)
    );
    if (
      !publicacion ||
      String(publicacion.autor || '').trim().toLowerCase() !== req.user.correo.trim().toLowerCase()
    ) {
      return res.status(404).json({ error: 'No se encontró la publicación.' });
    }

    const valoraciones = Array.isArray(publicacion.valoraciones)
      ? publicacion.valoraciones
      : [];
    return res.status(200).json(valoraciones.map((valoracion) => {
      const usuario = usuarios.buscarUsuarioPorCorreo(valoracion.emisor);
      return {
        puntuacion: valoracion.puntuacion,
        comentario: valoracion.comentario || "",
        nombreUsuario: usuario
          ? `${usuario.nombre} ${usuario.apellido}`.trim()
          : valoracion.emisor
      };
    }));
  } catch (error) {
    return next(error);
  }
}

export async function validarDireccion(req, res, next) {
  try {
    const resultado = await validarDireccionPublicacion(req.body?.direccion || req.query?.direccion);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.message === 'La dirección es obligatoria.') {
      return res.status(400).json({ error: error.message });
    }
    return responderErrorDireccion(error, res, next);
  }
}

function agregarNombreAutor(publicacion, usuarios) {
  const autor = publicacion.autor
    ? usuarios?.buscarUsuarioPorCorreo(publicacion.autor)
    : null;
  const datosPublicos = { ...publicacion };
  delete datosPublicos.reportes;
  return { ...datosPublicos, nombreAutor: autor?.nombre ?? null };
}

function responderErrorDireccion(error, res, next) {
  if (error.code === 'ADDRESS_NOT_FOUND') {
    return res.status(400).json({ error: error.message });
  }
  if (error.code === 'ADDRESS_LOOKUP_FAILED') {
    return res.status(503).json({ error: error.message });
  }
  return next(error);
}
