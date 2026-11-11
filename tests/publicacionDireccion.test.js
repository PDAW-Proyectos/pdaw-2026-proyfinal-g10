import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { validarDireccionPublicacion } from '../src/service/publicacionesService.js';
import { validarDireccion } from '../src/controllers/publicacionController.js';
import { Direccion } from '../src/models/Direccion.js';

describe('Validación de dirección para publicación', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('acepta una dirección real para una publicación', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Avenida Colón 123, Bahía Blanca, Argentina',
          lat: '-38.7177',
          lon: '-62.2681'
        }
      ]
    });

    const textoDireccion = 'Avenida Colón 123, Bahía Blanca, Argentina';
    const resultado = await validarDireccionPublicacion(textoDireccion);

    expect(resultado.valido).toBe(true);
    expect(resultado.direccion).toBe(textoDireccion);
    expect(resultado.ubicacion).toBeInstanceOf(Direccion);
    expect(resultado.ubicacion).toEqual(new Direccion(
      'Avenida Colón 123, Bahía Blanca, Argentina',
      -38.7177,
      -62.2681,
      {}
    ));
  });

  test('busca en Bahía Blanca cuando se ingresa solo la dirección', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Avenida Colón 123, Bahía Blanca, Buenos Aires, Argentina',
          lat: '-38.7177',
          lon: '-62.2681'
        }
      ]
    });

    await validarDireccionPublicacion('Avenida Colón 123');

    const [url] = global.fetch.mock.calls[0];
    expect(url.searchParams.get('q')).toBe('Avenida Colón 123, Bahía Blanca, Buenos Aires, Argentina');
  });

  test('rechaza una dirección vacía', async () => {
    await expect(validarDireccionPublicacion('')).rejects.toThrow('La dirección es obligatoria.');
  });

  test('el controlador devuelve 400 si la dirección no existe o está vacía', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const req = { body: { direccion: 'Calle inexistente 999, Bahía Blanca, Argentina' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await validarDireccion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No se encontró la ubicación solicitada.'
    });
  });
});
