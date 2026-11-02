import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { validarDireccionPublicacion } from '../src/service/publicacionesService.js';
import { validarDireccion } from '../src/controllers/publicacionController.js';

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

    const resultado = await validarDireccionPublicacion('Avenida Colón 123, Bahía Blanca');

    expect(resultado.valido).toBe(true);
    expect(resultado.direccion).toBe('Avenida Colón 123, Bahía Blanca');
    expect(resultado.ubicacion.lat).toBe(-38.7177);
  });

  test('rechaza una dirección vacía', async () => {
    await expect(validarDireccionPublicacion('')).rejects.toThrow('La dirección es obligatoria.');
  });

  test('el controlador devuelve 400 si la dirección no existe o está vacía', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const req = { body: { direccion: 'Calle inexistente 999' } };
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
