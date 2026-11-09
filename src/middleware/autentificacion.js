import { UnauthorizedError,ForbiddenError } from "../models/errores.js";
  export const requireAuth = (req, res, next) =>
  {
    if(!req.user){
     throw new UnauthorizedError
    }
    next()
  }

export  const rol = (tipo) => (req, res, next) => {
if (!req.user) throw new UnauthorizedError
if (req.user.tipo !== tipo) throw new ForbiddenError ;
next();

};

