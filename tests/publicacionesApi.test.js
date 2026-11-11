import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

describe('API de publicaciones', () => {
  test('devuelve las publicaciones como JSON', async () => {
    const response = await request(app).get('/api/publicaciones');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ titulo: 'Departamento moderno' }),
      expect.objectContaining({ titulo: 'Casa con patio' })
    ]));
  });

  test('rechaza la creación si faltan campos requeridos', async () => {
    const response = await request(app)
      .post('/api/publicaciones')
      .send({ titulo: 'Publicación incompleta' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Completá todos los campos de la publicación.' });
  });
});
