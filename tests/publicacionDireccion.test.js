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

    const direccion = new Direccion('Avenida Colón', 123, 'Bahía Blanca, Argentina');
    const resultado = await validarDireccionPublicacion(direccion.comoTextoBusqueda());

    expect(resultado.valido).toBe(true);
    expect(resultado.direccion).toBe('Avenida Colón 123, Bahía Blanca, Argentina');
    expect(resultado.ubicacion.lat).toBe(-38.7177);
  });

  test('rechaza una dirección vacía', async () => {
    const direccion = new Direccion('', '', '');

    await expect(validarDireccionPublicacion(direccion.comoTextoBusqueda())).rejects.toThrow('La dirección es obligatoria.');
  });

  test('el controlador devuelve 400 si la dirección no existe o está vacía', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const direccion = new Direccion('Calle inexistente', 999, 'Bahía Blanca, Argentina');
    const req = { body: { direccion: direccion.comoTextoBusqueda() } };
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
