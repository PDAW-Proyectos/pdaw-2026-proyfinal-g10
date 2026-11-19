import { describe, expect, test } from '@jest/globals';
import { Publicacion } from '../src/models/Publicacion.js';

describe('Reportes de publicaciones', () => {
  test('un cliente no puede reportar dos veces la misma publicación', () => {
    const autor = { reportes: [] };
    const publicacion = new Publicacion(1, 'Casa', 'Descripción', 'Dirección', 100, autor);

    publicacion.reportar('Motivo inicial', '', 'cliente@example.com');

    expect(() =>
      publicacion.reportar('Otro motivo', '', ' CLIENTE@example.com ')
    ).toThrow('Ya reportaste esta publicación.');
    expect(publicacion.reportes).toHaveLength(1);
    expect(autor.reportes).toHaveLength(1);
  });

  test('permite que clientes distintos reporten la misma publicación', () => {
    const autor = { reportes: [] };
    const publicacion = new Publicacion(1, 'Casa', 'Descripción', 'Dirección', 100, autor);

    publicacion.reportar('Primer motivo', '', 'primero@example.com');
    publicacion.reportar('Segundo motivo', '', 'segundo@example.com');

    expect(publicacion.reportes).toHaveLength(2);
    expect(publicacion.reportes.map((reporte) => reporte.reportante)).toEqual([
      'primero@example.com',
      'segundo@example.com'
    ]);
    expect(autor.reportes).toHaveLength(2);
  });
});
