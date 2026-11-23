# `Diagrama de Capas`

Este diagrama representa los módulos actuales y sus relaciones de composición o dependencia. No incluye atributos, firmas ni reglas internas.

Las entidades de dominio y la jerarquía de errores se documentan por separado en [`Diagrama de Clases.md`](./Diagrama%20de%20Clases.md).

Para visualizar el preview del archivo en VSCode se puede usar una extensión Mermaid como: https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart.

```mermaid
---
config:
  layout: elk
---

flowchart TB

classDef entry fill:#2C3E50,stroke:#1A252F,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef middleware fill:#006064,stroke:#00363A,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef routes fill:#4A148C,stroke:#311B92,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef controllers fill:#1B5E20,stroke:#0A3D0A,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef services fill:#E65100,stroke:#BF360C,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef repositories fill:#3E2723,stroke:#271310,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef utils fill:#455A64,stroke:#263238,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;

subgraph Entry["Entrada y composición"]
  server["server.js"]:::entry
  app["app.js"]:::entry
  config["config.js"]:::entry
end

subgraph Middleware["Middleware"]
  authentication["autentificacion.js"]:::middleware
  errorHandler["errorHandler.js"]:::middleware
end

subgraph Routes["Rutas"]
  usuariosRoutes["usuariosRoutes.js"]:::routes
  publicacionesRoutes["publicacionRoutes.js"]:::routes
  alquileresRoutes["alquilerRoutes.js"]:::routes
  ubicacionRoutes["ubicacionRoutes.js"]:::routes
end

subgraph Controllers["Controladores"]
  usuariosController["usuariosController.js"]:::controllers
  publicacionesController["publicacionController.js"]:::controllers
  alquileresController["alquilerController.js"]:::controllers
  ubicacionController["ubicacionController.js"]:::controllers
end

subgraph Services["Servicios"]
  repositorioUsuarios["repositorioUsuarios.js"]:::services
  publicacionesService["publicacionesService.js"]:::services
  ubicacionService["ubicacionService.js"]:::services
  repositorioPublicaciones["repositorioPublicaciones.js"]:::services
end

subgraph Repositories["Persistencia"]
  publicacionesJson["Publicaciones.json"]:::repositories
  historial["historial.js"]:::repositories
end

subgraph Utils["Utilidades"]
  validacion["validacion.js"]:::utils
end

server -->|"crea y inicia la aplicación"| app
server -->|"carga la configuración del entorno"| config
app -->|"aplica autenticación y autorización"| authentication
app -->|"captura y traduce errores"| errorHandler
app -->|"mantiene el repositorio de usuarios"| repositorioUsuarios
app -->|"monta las rutas de usuarios"| usuariosRoutes
app -->|"monta las rutas de publicaciones"| publicacionesRoutes
app -->|"monta las rutas de alquileres"| alquileresRoutes
app -->|"monta las rutas de ubicación"| ubicacionRoutes

usuariosRoutes -->|"protegen y autorizan solicitudes"| authentication
usuariosRoutes -->|"delegan el registro y la sesión"| usuariosController
publicacionesRoutes -->|"protegen y autorizan solicitudes"| authentication
publicacionesRoutes -->|"delegan operaciones sobre publicaciones"| publicacionesController
alquileresRoutes -->|"protege las solicitudes de alquiler"| authentication
alquileresRoutes -->|"delegan operaciones sobre alquileres"| alquileresController
ubicacionRoutes -->|"delegan la consulta de ubicación"| ubicacionController

usuariosController -->|"consume usuarios y sesiones"| repositorioUsuarios
publicacionesController -->|"valida direcciones antes de publicar"| publicacionesService
publicacionesController -->|"consulta autores y usuarios"| repositorioUsuarios
publicacionesController -->|"lee y persiste publicaciones"| publicacionesJson
alquileresController -->|"consulta usuarios y clientes"| repositorioUsuarios
alquileresController -->|"consulta publicaciones disponibles"| publicacionesJson
ubicacionController -->|"busca ubicaciones externas"| ubicacionService

publicacionesService -->|"resuelve direcciones geográficamente"| ubicacionService
ubicacionService -->|"usa la URL y parámetros de Nominatim"| config
repositorioUsuarios -->|"regenera o destruye sesiones"| validacion
```

## Estado actual

- `repositorioPublicaciones.js` existe, pero no está conectado al flujo de controladores.
- `historial.js` está vacío y no participa en las rutas actuales.
- Los alquileres mantienen su historial en memoria dentro de los clientes.
- Las publicaciones se leen y escriben directamente desde `Publicaciones.json`.
- `app.js` configura directamente los parsers de Express y las sesiones.
- La hidratación consulta `req.session.userId` y asigna el usuario a `req.user` mediante middleware inline en `app.js`; no existe un módulo separado.
