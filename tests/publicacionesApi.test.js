import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

describe('API de publicaciones', () => {
  test('GET /api/publicaciones devuelve publicaciones de prueba para mostrar en la página', async () => {
    const response = await request(app).get('/api/publicaciones');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: 1,
      titulo: 'Departamento moderno',
      tipo: 'Departamento',
      precio: 560
    });
    expect(response.body[1]).toMatchObject({
      id: 2,
      titulo: 'Casa con patio',
      tipo: 'Casa',
      precio: 680
    });
  });
});
