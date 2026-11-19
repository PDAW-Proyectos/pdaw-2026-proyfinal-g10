import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth } from "./middleware/autentificacion.js";
import { crearUsuariosRoutes } from "./routes/usuariosRoutes.js";
import { RepositorioUsuarios } from "./service/repositorioUsuarios.js";
import ubicacionRoutes from "./routes/ubicacionRoutes.js";
import { crearPublicacionRoutes } from "./routes/publicacionRoutes.js";
import { crearAlquilerRoutes } from "./routes/alquilerRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp({ config }) {
  const usuarios = new RepositorioUsuarios();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  app.use(express.urlencoded({ extended: true }));

  app.use(express.json());
  app.set("trust proxy", config.env === "production" ? 1 : false);

  app.use(
    session({
      name: "Alquiya.sid",
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.env === "production",
        maxAge: 60 * 60 * 1000,
      },
    }),
  );

  app.use((req, res, next) => {
    req.user = req.session.userId
      ? usuarios.buscarUsuarioPorCorreo(req.session.userId)
      : null;
    next();
  });

  app.use("/usuarios", crearUsuariosRoutes(usuarios));
  app.use("/api/ubicacion", ubicacionRoutes);
  app.use("/api/publicaciones", crearPublicacionRoutes(usuarios));
  app.use("/api/alquileres", crearAlquilerRoutes(usuarios));
  app.use("/me", requireAuth, (req, res) => {
    res.json(usuarios.toPublic(req.user));
  });

  app.get("/api/salud", (req, res) => {
    res.json({
      estado: "ok",
      version: config.version,
      entorno: config.env,
      uptime: Math.round(process.uptime()), // segundos desde el arranque
    });
  });

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(errorHandler);

  return app;
}
