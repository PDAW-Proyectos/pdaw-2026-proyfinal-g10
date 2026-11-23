import { describe, test, expect, jest } from "@jest/globals";
import request from "supertest";

const correoAutor = "andresnressia@gmail.com";
const publicacionesMock = [
  {
    id: 1,
    titulo: "Casa simulada",
    descripcion: "Descripción simulada",
    imagen: "https://example.test/casa.jpg",
    precio: 100,
    autor: correoAutor,
    direccion: "Avenida Colón 123",
  },
];

jest.unstable_mockModule("node:fs/promises", () => ({
  readFile: jest.fn(async () => JSON.stringify(publicacionesMock)),
  writeFile: jest.fn(async (_url, contenido) => {
    const nuevasPublicaciones = JSON.parse(contenido);
    publicacionesMock.splice(
      0,
      publicacionesMock.length,
      ...nuevasPublicaciones,
    );
  }),
}));

const { createApp } = await import("../src/app.js");
const { loadConfig } = await import("../src/config.js");

const config = loadConfig({
  NODE_ENV: "test",
  SESSION_SECRET: "test-secret",
});
const app = createApp({ config });

describe("API de publicaciones", () => {
  test("requiere sesión de propietario para crear publicaciones", async () => {
    await request(app).post("/api/publicaciones").send({}).expect(401);

    const cliente = await crearUsuarioAutenticado("Cliente");
    await cliente.post("/api/publicaciones").send({}).expect(403);
  });

  test("devuelve las publicaciones como JSON", async () => {
    const publicaciones = publicacionesMock;

    expect(Array.isArray(publicaciones)).toBe(true);
    publicaciones.forEach((publicacion) => {
      expect(publicacion).toEqual(
        expect.objectContaining({
          titulo: expect.any(String),
          descripcion: expect.any(String),
          imagen: expect.any(String),
          precio: expect.any(Number),
        }),
      );
      expect(publicacion).not.toHaveProperty("detalleDescripcion");
      expect(publicacion).not.toHaveProperty("caracteristicas");
    });
  });

  test("limita el GET a seis publicaciones y pagina los resultados filtrados", async () => {
    const originales = [...publicacionesMock];
    publicacionesMock.splice(
      0,
      publicacionesMock.length,
      ...Array.from({ length: 8 }, (_, indice) => ({
        id: indice + 1,
        titulo: `Casa ${indice + 1}`,
        descripcion: "Descripción",
        imagen: "https://example.test/casa.jpg",
        precio: (indice + 1) * 100,
        autor: correoAutor,
        direccion: "Avenida Colón 123",
      })),
    );

    try {
      const primeraPagina = await request(app)
        .get("/api/publicaciones?limit=20&page=1")
        .expect(200);
      expect(primeraPagina.body).toEqual(
        expect.objectContaining({
          pagina: 1,
          limite: 6,
          total: 8,
          totalPaginas: 2,
        }),
      );
      expect(primeraPagina.body.publicaciones).toHaveLength(6);

      const segundaPagina = await request(app)
        .get("/api/publicaciones?limit=6&page=2")
        .expect(200);
      expect(segundaPagina.body.publicaciones).toHaveLength(2);
      expect(segundaPagina.body.publicaciones[0].titulo).toBe("Casa 7");

      const filtradas = await request(app)
        .get("/api/publicaciones?limit=6&maxPrice=300&order=mayor-precio")
        .expect(200);
      expect(filtradas.body.publicaciones.map(({ titulo }) => titulo)).toEqual([
        "Casa 3",
        "Casa 2",
        "Casa 1",
      ]);
      expect(filtradas.body.total).toBe(3);
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("resuelve el nombre del autor por el correo guardado en la publicación", async () => {
    const correo = correoAutor;
    const nombre = "Andrés";
    await request(app)
      .post("/usuarios")
      .send({
        nombre,
        apellido: "Ressia",
        correo,
        contrasena: "ClaveSegura123!",
        telefono: "1123456789",
        tipo: "Propietario",
      })
      .expect(201);

    const publicacion = publicacionesMock.find((item) => item.autor === correo);

    expect(publicacion).toBeDefined();
    expect(publicacion.autor).toBe(correo);
  });

  test("rechaza la creación si faltan campos requeridos", async () => {
    const propietario = await crearUsuarioAutenticado("Propietario");
    const response = await propietario
      .post("/api/publicaciones")
      .send({ titulo: "Publicación incompleta" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "La imagen es obligatoria." });
  });

  test("valida una publicación usando solo los cinco campos del formulario", async () => {
    const propietario = await crearUsuarioAutenticado("Propietario");
    const response = await propietario.post("/api/publicaciones").send({
      titulo: "Publicación de prueba",
      imagen: "https://example.test/imagen.jpg",
      precio: 0,
      direccion: "Avenida Colón 123",
      descripcion: "Descripción de prueba",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "El precio debe ser un número mayor que cero.",
    });
  });

  test("indica específicamente cuando falta la dirección", async () => {
    const propietario = await crearUsuarioAutenticado("Propietario");
    const response = await propietario.post("/api/publicaciones").send({
      titulo: "Publicación de prueba",
      imagen: "https://example.test/imagen.jpg",
      precio: 100,
      descripcion: "Descripción de prueba",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "La dirección es obligatoria." });
  });

  test("GET por id devuelve la proyección pública y el nombre del autor", async () => {
    const originales = [...publicacionesMock];
    const correo = `get-autor-${Date.now()}@example.com`;
    const publicacion = {
      id: 42,
      titulo: "Casa simulada",
      descripcion: "Descripción simulada",
      autor: correo,
      reportes: [{ motivo: "Prueba", descripcion: "Reporte existente" }],
      valoraciones: [
        {
          puntuacion: 5,
          comentario: "Valoración existente",
          emisor: "cliente@example.test",
        },
      ],
    };
    publicacionesMock.splice(0, publicacionesMock.length, publicacion);

    try {
      await request(app)
        .post("/usuarios")
        .send({
          nombre: "Usuario de prueba",
          apellido: "Prueba",
          correo,
          contrasena: "ClaveSegura123!",
          telefono: "1123456789",
          tipo: "Propietario",
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/publicaciones/${publicacion.id}`)
        .expect(200);

      expect(response.body.nombreAutor).toBe("Usuario de prueba");
      expect(response.body).not.toHaveProperty("reportes");
      expect(response.body.valoraciones).toEqual(publicacion.valoraciones);
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("GET por id devuelve 404 si no existe la publicación", async () => {
    const originales = [...publicacionesMock];
    publicacionesMock.splice(0, publicacionesMock.length);

    try {
      const response = await request(app)
        .get("/api/publicaciones/999")
        .expect(404);

      expect(response.body.message).toBe("Publicación no encontrada");
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("PATCH actualiza campos permitidos y preserva los omitidos y no editables", async () => {
    const originales = [...publicacionesMock];
    const correo = `patch-autor-${Date.now()}@example.com`;

    const publicacionOriginal = {
      id: 42,
      titulo: "Casa simulada",
      descripcion: "Descripción simulada",
      imagen: "https://example.test/casa.jpg",
      precio: 100,
      autor: ` ${correo.toUpperCase()} `,
      direccion: "Avenida Colón 123",
      disponibilidad: "disponible",
      reportes: [{ motivo: "Prueba", descripcion: "Reporte existente" }],
      valoraciones: [
        {
          puntuacion: 5,
          comentario: "Valoración existente",
          emisor: "cliente@example.test",
        },
      ],
      otroDato: "Preservar",
    };

    publicacionesMock.splice(0, publicacionesMock.length, publicacionOriginal);

    try {
      const propietario = request.agent(app);
      const contrasena = "ClaveSegura123!";

      await propietario
        .post("/usuarios")
        .send({
          nombre: "Usuario de prueba",
          apellido: "Prueba",
          correo,
          contrasena,
          telefono: "1123456789",
          tipo: "Propietario",
        })
        .expect(201);

      await propietario
        .post("/usuarios/login")
        .send({ correo, contrasena })
        .expect(201);

      await propietario
        .patch(`/api/publicaciones/${publicacionOriginal.id}`)
        .send({ titulo: "  Casa nueva  ", precio: 250 })
        .expect(200);

      expect(publicacionesMock[0]).toEqual({
        ...publicacionOriginal,
        titulo: "Casa nueva",
        precio: 250,
      });

      await propietario
        .patch(`/api/publicaciones/${publicacionOriginal.id}`)
        .send({
          descripcion: "  Descripción nueva  ",
          imagen: "  https://example.test/nueva.jpg  ",
        })
        .expect(200);

      expect(publicacionesMock[0]).toEqual({
        ...publicacionOriginal,
        titulo: "Casa nueva",
        descripcion: "Descripción nueva",
        imagen: "https://example.test/nueva.jpg",
        precio: 250,
      });
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("PATCH rechaza cuerpos y campos no válidos", async () => {
    const originales = [...publicacionesMock];
    const correo = `patch-validacion-${Date.now()}@example.com`;
    const publicacionOriginal = {
      id: 42,
      titulo: "Casa simulada",
      autor: correo,
    };
    const cuerposInvalidos = [
      {},
      [],
      { titulo: "  " },
      { descripcion: "" },
      { imagen: "" },
      { precio: "250" },
      { precio: 0 },
      { campo: "desconocido" },
      { direccion: "Otra dirección" },
      { disponibilidad: "no disponible" },
    ];
    publicacionesMock.splice(0, publicacionesMock.length, publicacionOriginal);

    try {
      const propietario = await crearUsuarioAutenticado("Propietario", correo);

      for (const cuerpo of cuerposInvalidos) {
        await propietario
          .patch(`/api/publicaciones/${publicacionOriginal.id}`)
          .send(cuerpo)
          .expect(400);
      }

      expect(publicacionesMock[0]).toEqual(publicacionOriginal);
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("PATCH y DELETE requieren sesión, rol Propietario y autoría", async () => {
    const originales = [...publicacionesMock];
    const publicacion = {
      id: 42,
      autor: `autor-publicacion-${Date.now()}@example.com`,
    };
    const path = `/api/publicaciones/${publicacion.id}`;
    publicacionesMock.splice(0, publicacionesMock.length, publicacion);

    try {
      await request(app).patch(path).send({ titulo: "Cambio" }).expect(401);
      await request(app).delete(path).expect(401);

      const cliente = await crearUsuarioAutenticado("Cliente");
      await cliente.patch(path).send({ titulo: "Cambio" }).expect(403);
      await cliente.delete(path).expect(403);

      const otroPropietario = await crearUsuarioAutenticado("Propietario");
      const patchAjeno = await otroPropietario
        .patch(path)
        .send({ titulo: "Cambio" })
        .expect(403);
      const deleteAjeno = await otroPropietario.delete(path).expect(403);

      expect(patchAjeno.body.message).toBe(
        "No tenés permisos para modificar esta publicación",
      );
      expect(deleteAjeno.body.message).toBe(
        "No tenés permisos para eliminar esta publicación",
      );
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("PATCH y DELETE devuelven 404 si no existe la publicación", async () => {
    const originales = [...publicacionesMock];
    publicacionesMock.splice(0, publicacionesMock.length);

    try {
      const propietario = await crearUsuarioAutenticado("Propietario");
      const patch = await propietario
        .patch("/api/publicaciones/999")
        .send({ titulo: "Cambio" })
        .expect(404);
      const borrar = await propietario
        .delete("/api/publicaciones/999")
        .expect(404);

      expect(patch.body.message).toBe("Publicación no encontrada");
      expect(borrar.body.message).toBe("Publicación no encontrada");
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });

  test("DELETE desactiva sin borrar datos y responde de forma idempotente", async () => {
    const originales = [...publicacionesMock];
    const correo = `delete-autor-${Date.now()}@example.com`;
    const publicacionOriginal = {
      id: 42,
      titulo: "Casa simulada",
      descripcion: "Descripción simulada",
      autor: correo,
      direccion: "Avenida Colón 123",
      activa: true,
      reportes: [{ motivo: "Prueba", descripcion: "Reporte existente" }],
      valoraciones: [
        {
          puntuacion: 5,
          comentario: "Valoración existente",
          emisor: "cliente@example.test",
        },
      ],
    };
    const path = `/api/publicaciones/${publicacionOriginal.id}`;
    publicacionesMock.splice(0, publicacionesMock.length, publicacionOriginal);

    try {
      const propietario = await crearUsuarioAutenticado("Propietario", correo);

      const primeraRespuesta = await propietario.delete(path).expect(204);

      expect(primeraRespuesta.text ?? "").toBe("");
      expect(publicacionesMock[0]).toEqual({
        ...publicacionOriginal,
        activa: false,
      });

      const segundaRespuesta = await propietario.delete(path).expect(204);
      expect(segundaRespuesta.text ?? "").toBe("");
      expect(publicacionesMock[0]).toEqual({
        ...publicacionOriginal,
        activa: false,
      });
    } finally {
      publicacionesMock.splice(0, publicacionesMock.length, ...originales);
    }
  });
});

async function crearUsuarioAutenticado(
  tipo,
  correo = `${tipo.toLowerCase()}-${Date.now()}-${Math.random()}@example.com`,
) {
  const agente = request.agent(app);
  const contrasena = "ClaveSegura123!";

  await agente
    .post("/usuarios")
    .send({
      nombre: "Usuario de prueba",
      apellido: "Prueba",
      correo,
      contrasena,
      telefono: "1123456789",
      tipo,
    })
    .expect(201);
  await agente.post("/usuarios/login").send({ correo, contrasena }).expect(201);

  return agente;
}
