import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

describe('API de publicaciones', () => {
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

  test('rechaza la creación si faltan campos requeridos', async () => {
    const response = await request(app)
      .post('/api/publicaciones')
      .send({ titulo: 'Publicación incompleta' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'La imagen es obligatoria.' });
  });

  test('valida una publicación usando solo los cinco campos del formulario', async () => {
    const response = await request(app)
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
    const response = await request(app)
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
