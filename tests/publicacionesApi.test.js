import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const config = loadConfig({
  NODE_ENV: 'test',
  SESSION_SECRET: 'test-secret',
});
const app = createApp({ config });

describe('API de publicaciones', () => {
  test('requiere sesión de propietario para crear publicaciones', async () => {
    await request(app)
      .post('/api/publicaciones')
      .send({})
      .expect(401);

    const cliente = await crearUsuarioAutenticado('Cliente');
    await cliente
      .post('/api/publicaciones')
      .send({})
      .expect(403);
  });

  test('devuelve las publicaciones como JSON', async () => {
    const response = await request(app).get('/api/publicaciones');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((publicacion) => {
      expect(publicacion).toEqual(expect.objectContaining({
        titulo: expect.any(String),
        descripcion: expect.any(String),
        imagen: expect.any(String),
        precio: expect.any(Number)
      }));
      expect(publicacion).not.toHaveProperty('detalleDescripcion');
      expect(publicacion).not.toHaveProperty('caracteristicas');
    });
  });

  test('resuelve el nombre del autor por el correo guardado en la publicación', async () => {
    const correo = 'andresnressia@gmail.com';
    const nombre = 'Andrés';
    await request(app).post('/usuarios').send({
      nombre: 'Andrés',
      apellido: 'Ressia',
      correo,
      contrasena: 'ClaveSegura123!',
      telefono: '1123456789',
      tipo: 'Propietario'
    }).expect(201);

    const response = await request(app).get('/api/publicaciones').expect(200);
    const publicacion = response.body.find((item) => item.autor === correo);

    expect(publicacion.nombreAutor).toBe(nombre);
  });

  test('rechaza la creación si faltan campos requeridos', async () => {
    const propietario = await crearUsuarioAutenticado('Propietario');
    const response = await propietario
      .post('/api/publicaciones')
      .send({ titulo: 'Publicación incompleta' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'La imagen es obligatoria.' });
  });

  test('valida una publicación usando solo los cinco campos del formulario', async () => {
    const propietario = await crearUsuarioAutenticado('Propietario');
    const response = await propietario
      .post('/api/publicaciones')
      .send({
        titulo: 'Publicación de prueba',
        imagen: 'https://example.test/imagen.jpg',
        precio: 0,
        direccion: 'Avenida Colón 123',
        descripcion: 'Descripción de prueba'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'El precio debe ser un número mayor que cero.' });
  });

  test('indica específicamente cuando falta la dirección', async () => {
    const propietario = await crearUsuarioAutenticado('Propietario');
    const response = await propietario
      .post('/api/publicaciones')
      .send({
        titulo: 'Publicación de prueba',
        imagen: 'https://example.test/imagen.jpg',
        precio: 100,
        descripcion: 'Descripción de prueba'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'La dirección es obligatoria.' });
  });
});

async function crearUsuarioAutenticado(tipo) {
  const agente = request.agent(app);
  const correo = `${tipo.toLowerCase()}-${Date.now()}-${Math.random()}@example.com`;
  const contrasena = 'ClaveSegura123!';

  await agente.post('/usuarios').send({
    nombre: 'Usuario de prueba',
    apellido: 'Prueba',
    correo,
    contrasena,
    telefono: '1123456789',
    tipo
  }).expect(201);
  await agente.post('/usuarios/login').send({ correo, contrasena }).expect(201);

  return agente;
}
