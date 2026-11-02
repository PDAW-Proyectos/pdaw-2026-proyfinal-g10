import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { buscarUbicacionPorTexto } from '../src/service/ubicacionService.js';
import { obtenerUbicacion } from '../src/controllers/ubicacionController.js';

describe('API externa de ubicación', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve la ubicación geocodificada cuando Nominatim responde con datos', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Calle 123, Bahía Blanca, Argentina',
          lat: '-38.7196',
          lon: '-62.2654',
          address: { city: 'Bahía Blanca', country: 'Argentina' }
        }
      ]
    });

    const resultado = await buscarUbicacionPorTexto('Calle 123, Bahia Blanca');

    expect(resultado).toEqual({
      display_name: 'Calle 123, Bahía Blanca, Argentina',
      lat: -38.7196,
      lon: -62.2654,
      address: { city: 'Bahía Blanca', country: 'Argentina' }
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = global.fetch.mock.calls[0];
    expect(String(url)).toContain('format=jsonv2');
    expect(String(url)).toContain('q=Calle+123%2C+Bahia+Blanca');
  });

  test('lanza error cuando Nominatim no encuentra resultados para una dirección inventada', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await expect(buscarUbicacionPorTexto('Dirección inexistente 99999')).rejects.toThrow('No se encontró la ubicación solicitada.');
  });

  test('acepta una dirección real válida de Bahía Blanca', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Avenida Colón 123, Bahía Blanca, Buenos Aires, Argentina',
          lat: '-38.7177',
          lon: '-62.2681',
          address: { city: 'Bahía Blanca', state: 'Buenos Aires', country: 'Argentina' }
        }
      ]
    });

    const resultado = await buscarUbicacionPorTexto('Avenida Colon 123, Bahía Blanca');

    expect(resultado.lat).toBe(-38.7177);
    expect(resultado.lon).toBe(-62.2681);
    expect(resultado.display_name).toContain('Bahía Blanca');
  });

  test('rechaza una dirección ambigua o incompleta', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await expect(buscarUbicacionPorTexto('Calle sin nombre')).rejects.toThrow('No se encontró la ubicación solicitada.');
  });

  test('el controlador devuelve 400 cuando la busqueda llega vacía', async () => {
    const req = { query: { q: '' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await obtenerUbicacion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Debe enviar un texto de búsqueda en q.'
    });
  });
});
