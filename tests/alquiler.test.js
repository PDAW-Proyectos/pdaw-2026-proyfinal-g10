import { describe, expect, test, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const publicacionesMock = [{
  id: 1,
  titulo: 'Publicación simulada',
  descripcion: 'Descripción simulada',
  direccion: 'Avenida Colón 123',
  precio: 100,
  autor: 'propietario@example.com',
  imagen: 'https://example.test/imagen.jpg',
  activa: true,
  disponibilidad: 'disponible'
}];

jest.unstable_mockModule('node:fs/promises', () => ({
  readFile: jest.fn(async () => JSON.stringify(publicacionesMock)),
  writeFile: jest.fn(async (_url, contenido) => {
    const nuevasPublicaciones = JSON.parse(contenido);
    publicacionesMock.splice(0, publicacionesMock.length, ...nuevasPublicaciones);
  })
}));

const { crearAlquiler, listarAlquileres } = await import('../src/controllers/alquilerController.js');
const { Alquiler } = await import('../src/models/Alquiler.js');
const { crearAlquilerRoutes } = await import('../src/routes/alquilerRoutes.js');
const { createApp } = await import('../src/app.js');
const { loadConfig } = await import('../src/config.js');

const config = loadConfig({
  NODE_ENV: 'test',
  SESSION_SECRET: 'test-secret',
});
const app = createApp({ config });

describe('API de alquileres', () => {
  test('requiere sesión para consultar o crear alquileres', async () => {
    const lectura = await request(app).get('/api/alquileres');
    const creacion = await request(app).post('/api/alquileres').send({});

    expect(lectura.status).toBe(401);
    expect(creacion.status).toBe(401);
  });

  test('agrega el alquiler al historial del cliente y bloquea otra solicitud pendiente', async () => {
    const cliente = request.agent(app);
    const correo = `alquiler-${Date.now()}@example.com`;
    const contrasena = 'Alquiler123!';

    await cliente.post('/usuarios').send({
      nombre: 'Cliente de prueba',
      apellido: 'Prueba',
      correo,
      contrasena,
      telefono: '1123456789',
      tipo: 'Cliente'
    }).expect(201);
    await cliente.post('/usuarios/login').send({ correo, contrasena }).expect(201);

    const publicacion = publicacionesMock[0];
    const fechaInicio = fechaRelativa(1);
    const fechaFin = fechaRelativa(3);
    const solicitud = { publicacionId: publicacion.id, fechaInicio, fechaFin };

    const creado = await cliente.post('/api/alquileres').send(solicitud).expect(201);
    expect(creado.body).toEqual(expect.objectContaining({
      estado: 'pendiente',
      fechaInicio,
      fechaFin,
      producto: expect.objectContaining({ id: publicacion.id })
    }));

    const historial = await cliente.get('/api/alquileres').expect(200);
    expect(historial.body).toEqual([creado.body]);

    const repetido = await cliente.post('/api/alquileres').send(solicitud).expect(409);
    expect(repetido.body.error).toBe('Ya tienes un alquiler activo o pendiente.');

    const cancelado = await cliente
      .patch(`/api/alquileres/${creado.body.id}/cancelar`)
      .expect(200);
    expect(cancelado.body.estado).toBe('cancelado');

    const historialCancelado = await cliente.get('/api/alquileres').expect(200);
    expect(historialCancelado.body).toEqual([cancelado.body]);
  });

  test('trata el historial ausente de un cliente API como vacío', async () => {
    const cliente = { tipo: 'Cliente' };
    const respuesta = respuestaMock();
    listarAlquileres({ user: cliente }, respuesta);

    expect(respuesta.codigo).toBe(200);
    expect(respuesta.cuerpo).toEqual([]);

    const publicacion = publicacionesMock[0];
    const solicitud = {
      publicacionId: publicacion.id,
      fechaInicio: fechaRelativa(1),
      fechaFin: fechaRelativa(3)
    };
    const respuestaCreacion = respuestaMock();
    await crearAlquiler({ user: cliente, body: solicitud }, respuestaCreacion, (error) => {
      throw error;
    });

    expect(respuestaCreacion.codigo).toBe(201);
    expect(cliente.historial).toEqual([respuestaCreacion.cuerpo]);
  });

  test('permite al propietario listar sus solicitudes y aceptar o rechazar las pendientes', async () => {
    const propietario = { tipo: 'Propietario', correo: 'propietario@example.com' };
    const solicitudes = [
      { id: 'aceptar-1', estado: 'pendiente', producto: { autor: propietario.correo, titulo: 'Casa' } },
      { id: 'rechazar-1', estado: 'pendiente', producto: { autor: propietario.correo, titulo: 'Habitación' } },
      { id: 'otro-1', estado: 'pendiente', producto: { autor: 'otro@example.com', titulo: 'Otro' } }
    ];
    const usuarios = {
      listarUsuarios: () => [
        { tipo: 'Cliente', nombre: 'Inquilino', historial: solicitudes }
      ]
    };
    const api = express();
    api.use(express.json());
    api.use((req, res, next) => {
      req.user = propietario;
      next();
    });
    api.use('/api/alquileres', crearAlquilerRoutes(usuarios));

    const alquileres = await request(api).get('/api/alquileres/propietario').expect(200);
    expect(alquileres.body).toEqual([
      expect.objectContaining({ id: 'aceptar-1', solicitante: 'Inquilino' }),
      expect.objectContaining({ id: 'rechazar-1', solicitante: 'Inquilino' })
    ]);

    const aceptado = await request(api)
      .patch('/api/alquileres/aceptar-1/estado')
      .send({ estado: 'activo' })
      .expect(200);
    expect(aceptado.body.estado).toBe('activo');

    const rechazado = await request(api)
      .patch('/api/alquileres/rechazar-1/estado')
      .send({ estado: 'rechazado' })
      .expect(200);
    expect(rechazado.body.estado).toBe('rechazado');

    await request(api)
      .patch('/api/alquileres/aceptar-1/estado')
      .send({ estado: 'rechazado' })
      .expect(409);
    await request(api)
      .patch('/api/alquileres/otro-1/estado')
      .send({ estado: 'activo' })
      .expect(404);
  });

  test('el cliente puede cancelar alquileres activos o pendientes y los activos vencidos finalizan', async () => {
    const cliente = {
      tipo: 'Cliente',
      historial: [
        alquilerDePrueba('activo', 'activo', fechaRelativa(2)),
        alquilerDePrueba('pendiente', 'pendiente', fechaRelativa(2)),
        alquilerDePrueba('vencido', 'activo', fechaRelativa(0))
      ]
    };
    const api = express();
    api.use(express.json());
    api.use((req, res, next) => {
      req.user = cliente;
      next();
    });
    api.use('/api/alquileres', crearAlquilerRoutes({ listarUsuarios: () => [cliente] }));

    const historial = await request(api).get('/api/alquileres').expect(200);
    expect(historial.body.map(({ estado }) => estado)).toEqual([
      'activo',
      'pendiente',
      'finalizado'
    ]);

    const canceladoActivo = await request(api)
      .patch('/api/alquileres/activo/cancelar')
      .expect(200);
    expect(canceladoActivo.body.estado).toBe('cancelado');

    const canceladoPendiente = await request(api)
      .patch('/api/alquileres/pendiente/cancelar')
      .expect(200);
    expect(canceladoPendiente.body.estado).toBe('cancelado');

    await request(api)
      .patch('/api/alquileres/vencido/cancelar')
      .expect(409);
  });
});

function alquilerDePrueba(id, estado, fechaFin) {
  const alquiler = new Alquiler(id, {}, fechaRelativa(0), fechaFin);
  alquiler.estado = estado;
  return alquiler;
}

function respuestaMock() {
  return {
    codigo: null,
    cuerpo: null,
    status(codigo) {
      this.codigo = codigo;
      return this;
    },
    json(cuerpo) {
      this.cuerpo = cuerpo;
      return this;
    }
  };
}

function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
