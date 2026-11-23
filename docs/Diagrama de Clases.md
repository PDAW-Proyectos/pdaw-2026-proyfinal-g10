# `Diagrama de Clases`

Este diagrama reúne las entidades de dominio y la jerarquía de errores implementadas por la aplicación.
La composición de las capas y su flujo HTTP se documentan en [`Diagrama de Capas.md`](./Diagrama%20de%20Capas.md).

Para visualizar el preview del archivo en VSCode se puede usar una extensión Mermaid como: https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart.

```mermaid
---
config:
  layout: elk
---

classDiagram

classDef models fill:#0D47A1,stroke:#082D68,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef errors fill:#B71C1C,stroke:#7F0000,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;

namespace Models {
    class Usuario:::models {
        +String nombre
        +String apellido
        +String correo
        +String contrasena
        +String telefono
        +boolean activo
        +Reporte[] reportes
        +mostrarPerfil()
        +Reportar(motivo, descripcion)
    }
    class Cliente:::models {
        +String tipo = "Cliente"
        +Alquiler[] historial
    }
    class Propietario:::models {
        +String tipo = "Propietario"
        +Publicacion[] publicaciones
    }
    class Publicacion:::models {
        +int id
        +String titulo
        +String descripcion
        +String direccion
        +String ubicacion
        +Number precio
        +Object autor
        +String imagen
        +String alt
        +String tipo
        +Number calificacion
        +Number cantidadValoraciones
        +String detalle
        +String disponibilidad
        +String estado
        +boolean activa
        +Date fechaCreacion
        +Reporte[] reportes
        +Valoracion[] valoraciones
        +reportar(motivo, descripcion, correo)
        +valorar(puntuacion, comentario, emisor)
        +calcularCalificacion()
        +desactivar()
    }
    class Alquiler:::models {
        +String id (UUID)
        +Object producto
        +String fechaInicio
        +String fechaFin
        +String estado
        +Date fechaSolicitud
        +cancelar()
        +finalizar()
    }
    class Direccion:::models {
        +String direccionCompleta
        +Number lat
        +Number lon
        +Object direccion
    }
    class Reporte:::models {
        +int id
        +String motivo
        +String descripcion
        +String reportante
        +Date fecha
        +String estado
        +consultarEstado()
    }
    class Producto:::models {
        +int id
        +String nombre
        +Object imagen
        +Number promedioValoraciones
    }
    class Propiedad:::models {
        +Object direccion
        +String tipo = "Propiedad"
    }
    class Valoracion:::models {
        +Number puntuacion
        +String comentario
        +String emisor
    }
}

namespace Errors {
    class AppError:::errors {
        +String message
        +int status
    }
    class ConflictError:::errors {
        +int status = 409
    }
    class NotFoundError:::errors {
        +int status = 404
    }
    class ValidationError:::errors {
        +int status = 400
    }
    class UnauthorizedError:::errors {
        +int status = 401
    }
    class ForbiddenError:::errors {
        +int status = 403
    }
}

%% Relaciones de dominio
Usuario <|-- Propietario
Usuario <|-- Cliente
Producto <|-- Propiedad
Usuario "1" --> "0..*" Reporte : acumula reportes en memoria
Publicacion "1" --> "0..*" Reporte : recibe reportes
Publicacion "1" --> "0..*" Valoracion : recibe valoraciones
Propietario "1" --> "0..*" Publicacion : autor (referencia por correo)
Cliente "1" --> "0..*" Alquiler : solicita
Publicacion "1" --> "0..*" Alquiler : producto contiene el objeto leído del JSON

%% Relaciones de errores
Publicacion "1" ..> "0..*" ConflictError : evita reportes o valoraciones duplicados
Publicacion "1" ..> "0..*" ValidationError : valida reportes y valoraciones

AppError <|-- ConflictError
AppError <|-- NotFoundError
AppError <|-- ValidationError
AppError <|-- UnauthorizedError
AppError <|-- ForbiddenError
```
