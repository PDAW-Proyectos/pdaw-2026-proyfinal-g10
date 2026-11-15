import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { crearAlquiler, listarAlquileres } from '../src/controllers/alquilerController.js';

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
      correo,
      contrasena,
      tipo: 'Cliente'
    }).expect(201);
    await cliente.post('/usuarios/login').send({ correo, contrasena }).expect(201);

    const publicaciones = await cliente.get('/api/publicaciones').expect(200);
    const publicacion = publicaciones.body[0];
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
  });

  test('trata el historial ausente de un cliente API como vacío', async () => {
    const cliente = { tipo: 'Cliente' };
    const respuesta = respuestaMock();
    listarAlquileres({ user: cliente }, respuesta);

    expect(respuesta.codigo).toBe(200);
    expect(respuesta.cuerpo).toEqual([]);

    const publicacion = (await request(app).get('/api/publicaciones').expect(200)).body[0];
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
});

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
