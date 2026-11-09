 export class AppError extends Error {
constructor(message, status) {
super(message);
this.name = this.constructor.name;
this.status = status;
}
}

 export class ConflictError extends AppError {
constructor(message = '	Conflicto con el estado actual o recurso duplicado') { super(message, 409); }
}

  export  class NotFoundError extends AppError {
        constructor(message = "Recurso no encontrado") {
            super(message, 404);
        }
    }

  export  class ValidationError extends AppError {
        constructor(message = "Error de validación") {
            super(message, 400);
        }
    }
 export   class UnauthorizedError extends AppError {
        constructor(message = "No estás autenticado") {
            super(message, 401);
        }
}
export class ForbiddenError extends AppError{
    constructor(message = 'Usuario autenticado sin permisos para la operacion'){
        super(message,403)
    }
}