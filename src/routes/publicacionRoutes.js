import { Router } from "express";
import {
  crearPublicacion,
  listarPublicaciones,
  listarReportesPublicacion,
  listarValoracionesPublicacion,
  obtenerPublicacion,
  actualizarPublicacion,
  eliminarPublicacion,
  reportarPublicacion,
  validarDireccion,
  valorarPublicacion,
} from "../controllers/publicacionController.js";
import { requireAuth, rol } from "../middleware/autentificacion.js";

export function crearPublicacionRoutes(usuarios) {
  const router = Router();

  router.get("/", (req, res, next) =>
    listarPublicaciones(req, res, next, usuarios),
  );
  router.post("/", requireAuth, rol("Propietario"), (req, res, next) =>
    crearPublicacion(req, res, next, usuarios),
  );
  router.post("/validar-direccion", validarDireccion);
  router.get(
    "/:id/reportes",
    requireAuth,
    rol("Propietario"),
    (req, res, next) => listarReportesPublicacion(req, res, next),
  );
  router.post("/:id/reportes", requireAuth, rol("Cliente"), (req, res, next) =>
    reportarPublicacion(req, res, next, usuarios),
  );
  router.post(
    "/:id/valoraciones",
    requireAuth,
    rol("Cliente"),
    valorarPublicacion,
  );
  router.get(
    "/:id/valoraciones",
    requireAuth,
    rol("Propietario"),
    (req, res, next) => listarValoracionesPublicacion(req, res, next, usuarios),
  );

  router.get("/:id", (req, res, next) =>
    obtenerPublicacion(req, res, next, usuarios),
  );
  router.patch("/:id", requireAuth, rol("Propietario"), (req, res, next) =>
    actualizarPublicacion(req, res, next, usuarios),
  );
  router.delete("/:id", requireAuth, rol("Propietario"), (req, res, next) =>
    eliminarPublicacion(req, res, next),
  );

  return router;
}
