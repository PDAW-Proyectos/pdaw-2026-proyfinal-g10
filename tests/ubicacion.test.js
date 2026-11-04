import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { buscarUbicacionPorTexto } from '../src/service/ubicacionService.js';
import { obtenerUbicacion } from '../src/controllers/ubicacionController.js';
import { Direccion } from '../src/models/Direccion.js';

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

    const direccion = new Direccion('Calle', 123, 'Bahía Blanca, Argentina');
    const resultado = await buscarUbicacionPorTexto(direccion.comoTextoBusqueda());

    expect(resultado).toEqual({
      display_name: 'Calle 123, Bahía Blanca, Argentina',
      lat: -38.7196,
      lon: -62.2654,
      address: { city: 'Bahía Blanca', country: 'Argentina' }
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = global.fetch.mock.calls[0];
    expect(String(url)).toContain('format=jsonv2');
    expect(url.searchParams.get('q')).toBe('Calle 123, Bahía Blanca, Argentina');
  });

  test('lanza error cuando Nominatim no encuentra resultados para una dirección inventada', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const direccion = new Direccion('Dirección inexistente', 99999, 'Bahía Blanca, Argentina');

    await expect(buscarUbicacionPorTexto(direccion.comoTextoBusqueda())).rejects.toThrow('No se encontró la ubicación solicitada.');
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

    const direccion = new Direccion('Avenida Colón', 123);
    const resultado = await buscarUbicacionPorTexto(direccion.comoTextoBusqueda());

    expect(resultado.lat).toBe(-38.7177);
    expect(resultado.lon).toBe(-62.2681);
    expect(resultado.display_name).toContain('Bahía Blanca');
  });

  test('rechaza una dirección ambigua o incompleta', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const direccion = new Direccion('Calle sin nombre', '', '');

    await expect(buscarUbicacionPorTexto(direccion.comoTextoBusqueda())).rejects.toThrow('No se encontró la ubicación solicitada.');
  });

  test('el controlador devuelve 400 cuando la busqueda llega vacía', async () => {
    const direccion = new Direccion('', '', '');
    const req = { query: { q: direccion.comoTextoBusqueda() } };
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
