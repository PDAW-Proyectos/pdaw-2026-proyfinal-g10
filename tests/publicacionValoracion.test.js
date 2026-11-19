import { describe, expect, test } from '@jest/globals';
import { Publicacion } from '../src/models/Publicacion.js';

describe('Valoraciones de publicaciones', () => {
  test('calcula el promedio y impide una segunda valoración del mismo cliente', () => {
    const publicacion = new Publicacion(1, 'Casa', 'Descripción', 'Dirección', 100, 'autor@example.com');

    publicacion.valorar(5, '', 'cliente@example.com');
    publicacion.valorar(3, '', 'otro@example.com');

    expect(publicacion.calificacion).toBe(4);
    expect(publicacion.cantidadValoraciones).toBe(2);
    expect(() =>
      publicacion.valorar(1, '', ' CLIENTE@example.com ')
    ).toThrow('Ya valoraste esta publicación.');
  });

  test('rechaza puntuaciones fuera del rango permitido', () => {
    const publicacion = new Publicacion(1, 'Casa', 'Descripción', 'Dirección', 100, 'autor@example.com');

    expect(() => publicacion.valorar(0, '', 'cliente@example.com')).toThrow(
      'La puntuación debe ser un número entre 1 y 5.'
    );
    expect(() => publicacion.valorar(6, '', 'cliente@example.com')).toThrow(
      'La puntuación debe ser un número entre 1 y 5.'
    );
  });
});
