
import { AppError} from "../models/errores.js";


export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

     const status = err instanceof AppError ? err.status : 500;

     
     if (status === 500) {
  }
  return res.status(status).json({
    status: "error",
    message: status === 500
      ? "Error interno del servidor"
      : err.message,
  });
};