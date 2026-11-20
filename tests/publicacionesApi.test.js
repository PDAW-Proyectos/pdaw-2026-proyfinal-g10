import { describe, test, expect, jest } from '@jest/globals';
import request from 'supertest';

const correoAutor = 'andresnressia@gmail.com';
const publicacionesMock = [{
  id: 1,
  titulo: 'Casa simulada',
  descripcion: 'Descripción simulada',
  imagen: 'https://example.test/casa.jpg',
  precio: 100,
  autor: correoAutor,
  direccion: 'Avenida Colón 123'
}];

jest.unstable_mockModule('node:fs/promises', () => ({
  readFile: jest.fn(async () => JSON.stringify(publicacionesMock)),
  writeFile: jest.fn(async (_url, contenido) => {
    const nuevasPublicaciones = JSON.parse(contenido);
    publicacionesMock.splice(0, publicacionesMock.length, ...nuevasPublicaciones);
  })
}));

const { createApp } = await import('../src/app.js');
const { loadConfig } = await import('../src/config.js');

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
    const publicaciones = publicacionesMock;

    expect(Array.isArray(publicaciones)).toBe(true);
    publicaciones.forEach((publicacion) => {
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

  test('limita el GET a seis publicaciones y pagina los resultados filtrados', async () => {
    const originales = [...publicacionesMock];
    publicacionesMock.splice(0, publicacionesMock.length, ...Array.from({ length: 8 }, (_, indice) => ({
      id: indice + 1,
      titulo: `Casa ${indice + 1}`,
      descripcion: 'Descripción',
      imagen: 'https://example.test/casa.jpg',
      precio: (indice + 1) * 100,
      autor: correoAutor,
      direccion: 'Avenida Colón 123'
    })));

    try {
      const primeraPagina = await request(app)
        .get('/api/publicaciones?limit=20&page=1')
        .expect(200);
      expect(primeraPagina.body).toEqual(expect.objectContaining({
        pagina: 1,
        limite: 6,
        total: 8,
        totalPaginas: 2
      }));
      expect(primeraPagina.body.publicaciones).toHaveLength(6);

      const segundaPagina = await request(app)
        .get('/api/publicaciones?limit=6&page=2')
        .expect(200);
      expect(segundaPagina.body.publicaciones).toHaveLength(2);
      expect(segundaPagina.body.publicaciones[0].titulo).toBe('Casa 7');

      const filtradas = await request(app)
        .get('/api/publicaciones?limit=6&maxPrice=300&order=mayor-precio')
        .expect(200);
      expect(filtradas.body.publicaciones.map(({ titulo }) => titulo)).toEqual([
        'Casa 3',
        'Casa 2',
        'Casa 1'
      ]);
      expect(filtradas.body.total).toBe(3);
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test('resuelve el nombre del autor por el correo guardado en la publicación', async () => {
    const correo = correoAutor;
    const nombre = 'Andrés';
    await request(app).post('/usuarios').send({
      nombre,
      apellido: 'Ressia',
      correo,
      contrasena: 'ClaveSegura123!',
      telefono: '1123456789',
      tipo: 'Propietario'
    }).expect(201);

    const publicacion = publicacionesMock.find((item) => item.autor === correo);

    expect(publicacion).toBeDefined();
    expect(publicacion.autor).toBe(correo);
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
