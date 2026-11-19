# `Diagrama de Clases - Layers`

Para visualizar el preview del archivo en VSCode es requerida una extension Mermaid como: https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart. (No es necesario crear cuenta o iniciar sesion).

Recomendamos seleccionar el tema de visualizacion "Redux-Color" o "Redux-Dark-Color" para la extension Mermaid, ya que es la que mayor visibilidad ofrece.

El diagrama representa los módulos y comportamientos presentes actualmente en el código. Distingue las clases implementadas de los módulos que acceden directamente a los datos.

```mermaid
---
config:
  layout: elk
---

classDiagram

%% ===================================================================
%% STYLING (Bigger, bolder, and color-coded by layer)
%% ===================================================================
classDef entry fill:#2C3E50,stroke:#1A252F,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef middleware fill:#006064,stroke:#00363A,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef routes fill:#4A148C,stroke:#311B92,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef controllers fill:#1B5E20,stroke:#0A3D0A,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef services fill:#E65100,stroke:#BF360C,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef repositories fill:#3E2723,stroke:#271310,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef models fill:#0D47A1,stroke:#082D68,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef errors fill:#B71C1C,stroke:#7F0000,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;
classDef utils fill:#455A64,stroke:#263238,stroke-width:3px,color:#ffffff,font-weight:bold,font-size:16px;

%% ===================================================================
%% LAYER 1: ENTRY / COMPOSICION
%% ===================================================================
namespace Entry {
    class server_js["server.js"]:::entry {
        +createApp(config)
        +listen(config.port)
    }
    class config_js["config.js"]:::entry {
        +loadConfig(env)
        +nominatimBaseUrl
        +env
        +port
        +sessionSecret
        +version
    }
    class app_js["app.js"]:::entry {
        +Express app
        -usuarios: RepositorioUsuarios
        +use(express.urlencoded)
        +use(express.json)
        +use(session)
        +use(middleware inline de hidratación)
        +use("/usuarios", crearUsuariosRoutes)
        +use("/api/ubicacion", ubicacionRoutes)
        +use("/api/publicaciones", crearPublicacionRoutes)
        +use("/api/alquileres", crearAlquilerRoutes)
        +get("/api/salud")
        +use(express.static)
        +use(errorHandler)
    }
}

%% ===================================================================
%% LAYER 2: MIDDLEWARE (Transversal)
%% ===================================================================
namespace Middleware {
    class hidratacion["Middleware inline de hidratación"]:::middleware {
        +asigna req.user desde req.session.userId
        +busca usuario por req.session.userId
    }
    class requireAuth["requireAuth"]:::middleware {
        +requireAuth(req, res, next)
        -lanza UnauthorizedError si !req.user
    }
    class rol["rol(tipo)"]:::middleware {
        +rol(tipo)(req, res, next)
        -lanza UnauthorizedError o ForbiddenError
    }
    class errorHandler["errorHandler"]:::middleware {
        +errorHandler(err, req, res, next)
        -traduce AppError a status y message
    }
    class bodyParsers["express.urlencoded / express.json"]:::middleware
    class sessionMiddleware["express-session"]:::middleware
}

%% ===================================================================
%% LAYER 3: ROUTES (Mapeo URL + Metodo)
%% ===================================================================
namespace Routes {
    class crearUsuariosRoutes["crearUsuariosRoutes (factory)"]:::routes {
        +Router
        -router.post("/", agregar)
        -router.get("/me", buscarLogueado)
        -router.get("/correo/:correo", requireAuth, buscarPorCorreo)
        -router.post("/login", iniciarSesion)
        -router.post("/logout", requireAuth, cerrarSesion)
    }
    class crearPublicacionRoutes["crearPublicacionRoutes (factory)"]:::routes {
        +Router
        -router.get("/", listarPublicaciones)
        -router.post("/", requireAuth, rol(Propietario), crearPublicacion)
        -router.post("/validar-direccion", validarDireccion)
        -router.get("/:id/reportes", requireAuth, rol(Propietario))
        -router.post("/:id/reportes", requireAuth, rol(Cliente))
        -router.post("/:id/valoraciones", requireAuth, rol(Cliente))
        -router.get("/:id/valoraciones", requireAuth, rol(Propietario))
    }
    class crearAlquilerRoutes["crearAlquilerRoutes (factory)"]:::routes {
        +Router
        -router.get("/", requireAuth, listarAlquileres)
        -router.post("/", requireAuth, crearAlquiler)
        -router.patch("/:id/cancelar", requireAuth, cancelarAlquiler)
        -router.get("/propietario", requireAuth, listarAlquileresPropietario)
        -router.patch("/:id/estado", requireAuth, actualizarEstadoAlquiler)
    }
    class ubicacionRoutes["ubicacionRoutes.js"]:::routes {
        +Router
        -router.get("/", obtenerUbicacion)
    }
}

%% ===================================================================
%% LAYER 4: CONTROLLERS (Traducen HTTP)
%% ===================================================================
namespace Controllers {
    class UserController:::controllers {
        -userService: RepositorioUsuarios
        +listarUsuarios(req, res, next)
        +agregar(req, res, next)
        +buscarPorCorreo(req, res, next)
        +iniciarSesion(req, res, next)
        +cerrarSesion(req, res, next)
        +buscarLogueado(req, res, next)
    }
    class publicacionController["publicacionController.js"]:::controllers {
        +listarPublicaciones(req, res, next, usuarios)
        +crearPublicacion(req, res, next, usuarios)
        +validarDireccion(req, res, next)
        +reportarPublicacion(req, res, next, usuarios)
        +listarReportesPublicacion(req, res, next)
        +valorarPublicacion(req, res, next)
        +listarValoracionesPublicacion(req, res, next, usuarios)
    }
    class alquilerController["alquilerController.js"]:::controllers {
        <<lógica de negocio + acceso directo a datos>>
        +listarAlquileres(req, res)
        +crearAlquiler(req, res, next)
        +cancelarAlquiler(req, res)
        +listarAlquileresPropietario(req, res, usuarios)
        +actualizarEstadoAlquiler(req, res, usuarios)
    }
    class ubicacionController["ubicacionController.js"]:::controllers {
        +obtenerUbicacion(req, res)
    }
}

%% ===================================================================
%% LAYER 5: SERVICES (Reglas de negocio)
%% ===================================================================
namespace Services {
    class RepositorioUsuarios:::services {
        <<mezcla servicio + repositorio>>
        -usuarios: Usuario[]
        +agregarUsuario(usuario): Usuario
        +agregarCliente(...)
        +agregarPropietario(...)
        +buscarUsuarioPorCorreo(correo)
        +buscarUsuarioActivo()
        +listarUsuarios()
        +cargar()
        +cargarDesde(datos)
        +iniciarSesion(correo, contrasena, req)
        +cerrarSesion(req)
        +verify(correo, contrasena)
        +toPublic(usuario)
    }
    class publicacionesService["publicacionesService.js"]:::services {
        +validarDireccionPublicacion(direccion)
    }
    class ubicacionService["ubicacionService.js"]:::services {
        <<adapter Nominatim>>
        +buscarUbicacionPorTexto(texto): Direccion
    }
}

%% ===================================================================
%% LAYER 6: REPOSITORIES (Persistencia)
%% ===================================================================
namespace Repositories {
    class RepositorioPublicaciones:::repositories {
        -publicaciones: Publicacion[]
        -proximoId: number
        +crearPublicacion(titulo, descripcion, direccion, precio, autor)
        +buscarPublicacionPorId(id)
        +buscarActivas()
        +cargarDesde(publicaciones)
    }
    class PublicacionesJson["Publicaciones.json (datos persistidos)"]:::repositories {
        +Object[] publicaciones
        +reportes y valoraciones dentro de cada publicación
    }
}

%% ===================================================================
%% LAYER 7: MODELS (Entidades de dominio implementadas)
%% ===================================================================
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

%% ===================================================================
%% LAYER 8: ERRORS (Jerarquia de errores)
%% ===================================================================
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

%% ===================================================================
%% LAYER 9: UTILS (Helpers puros)
%% ===================================================================
namespace Utils {
    class validacion_js["utils/validacion.js"]:::utils {
        +regenerate(req): Promise
        +destroy(req): Promise
    }
}

%% ===================================================================
%% CODE FLOW & RELATIONS (De afuera hacia adentro)
%% ===================================================================

%% --- Entry / composicion ---
server_js "1" --> "1" app_js : carga config, crea app y abre el puerto
server_js "1" --> "1" config_js : carga la configuración del servidor
app_js "1" --> "1" bodyParsers : registra express.urlencoded y express.json
app_js "1" --> "1" sessionMiddleware : registra express-session
app_js "1" --> "1" hidratacion : asigna req.user antes de los routers
app_js "1" --> "1" crearUsuariosRoutes : invoca factory, inyecta repo, monta /usuarios
app_js "1" --> "1" crearPublicacionRoutes : invoca factory, inyecta usuarios, monta /api/publicaciones
app_js "1" --> "1" crearAlquilerRoutes : invoca factory, inyecta usuarios, monta /api/alquileres
app_js "1" --> "1" ubicacionRoutes : importa router, monta /api/ubicacion
app_js "1" --> "1" errorHandler : registra al final para errores delegados
app_js "1" --> "1" RepositorioUsuarios : crea (new) al arrancar, consulta en hidratacion

%% --- Routes -> Middleware / Controllers ---
crearUsuariosRoutes "1" --> "1" requireAuth : protege búsqueda por correo y cierre de sesión
crearUsuariosRoutes "1" --> "1" UserController : crea (new) por factory, inyecta repo
crearPublicacionRoutes "1" --> "1" publicacionController : importa y asigna a rutas
crearPublicacionRoutes "1" --> "1" requireAuth : protege alta, reportes y valoraciones
crearPublicacionRoutes "1" --> "1" rol : restringe alta/reportes/valoraciones por tipo de usuario
crearAlquilerRoutes "1" --> "1" requireAuth : aplica en todas las rutas
crearAlquilerRoutes "1" --> "1" alquilerController : importa y asigna a rutas
ubicacionRoutes "1" --> "1" ubicacionController : importa y asigna a ruta

%% --- Controllers -> Services / Repositories ---
UserController "1" --> "1" RepositorioUsuarios : recibe inyectada, delega reglas
publicacionController "1" --> "1" publicacionesService : valida direccion al publicar
publicacionController "1" --> "1" PublicacionesJson : lee y escribe publicaciones, reportes y valoraciones
publicacionController "1" --> "1" RepositorioUsuarios : busca autores y nombres para respuestas
publicacionController "1" ..> "0..*" Publicacion : crea publicaciones y aplica reportar/valorar
alquilerController "1" --> "1" PublicacionesJson : lee publicaciones para crear alquileres
alquilerController "1" --> "1" RepositorioUsuarios : consulta clientes para las vistas del propietario
alquilerController "1" --> "1" Cliente : usa req.user e historial en memoria
alquilerController "1" ..> "0..*" Alquiler : crea y actualiza alquileres
ubicacionController "1" --> "1" ubicacionService : busca ubicación
ubicacionService "1" --> "1" config_js : usa la URL base de Nominatim
ubicacionService "1" ..> "0..*" Direccion : crea resultados de búsqueda
publicacionesService "1" --> "1" ubicacionService : valida direcciones mediante geocodificación

%% --- Middleware -> Errors ---
requireAuth "1" ..> "0..*" UnauthorizedError : crea (new) y lanza si falta user
rol "1" ..> "0..*" UnauthorizedError : crea (new) si falta user
rol "1" ..> "0..*" ForbiddenError : crea (new) si el rol no coincide
errorHandler "1" ..> "0..*" AppError : recibe via next(), traduce status, enmascara 500

%% --- Repositorios -> Modelos / Errores / Utils ---
RepositorioUsuarios "1" ..> "0..*" Cliente : crea (new) tipo Cliente
RepositorioUsuarios "1" ..> "0..*" Propietario : crea (new) tipo Propietario
RepositorioUsuarios "1" ..> "0..*" ValidationError : crea (new) y lanza si duplicado/invalido
RepositorioUsuarios "1" ..> "0..*" NotFoundError : crea (new) y lanza si no existe
RepositorioUsuarios "1" --> "1" validacion_js : usa regenerate/destroy en auth

RepositorioPublicaciones "1" ..> "0..*" Publicacion : administra un arreglo en memoria (no inyectado en controladores)
PublicacionesJson "1" --> "0..*" Publicacion : serializa instancias y objetos planos en el archivo

%% --- Domain relations ---
Usuario <|-- Propietario
Usuario <|-- Cliente
Producto <|-- Propiedad
Usuario "1" --> "0..*" Reporte : acumula reportes en memoria
Publicacion "1" --> "0..*" Reporte : recibe reportes
Publicacion "1" --> "0..*" Valoracion : recibe valoraciones
Publicacion "1" ..> "0..*" ConflictError : evita reportes o valoraciones duplicados
Publicacion "1" ..> "0..*" ValidationError : valida reportes y valoraciones

RepositorioUsuarios "1" --> "0..*" Usuario : almacena en memoria
Propietario "1" --> "0..*" Publicacion : autor (referencia por correo)
Cliente "1" --> "0..*" Alquiler : solicita
Publicacion "1" --> "0..*" Alquiler : producto contiene el objeto leído del JSON

%% --- Error hierarchy ---
AppError <|-- ConflictError
AppError <|-- NotFoundError
AppError <|-- ValidationError
AppError <|-- UnauthorizedError
AppError <|-- ForbiddenError


```

## NOTAS

- `GET /usuarios/me` está implementado en la ruta de usuarios; no existe una ruta `GET /me`.
- `UserController.listarUsuarios()` y `RepositorioUsuarios.listarUsuarios()` existen, pero no hay una ruta HTTP que liste usuarios.
- `RepositorioUsuarios` vive en `src/service/`, guarda usuarios en memoria y también gestiona registro, autenticación y sesiones. `cargar()` está vacío y `cargarDesde()` no espera las altas asíncronas.
- `Usuario.contrasena` contiene el hash bcrypt después del registro; `Propietario.publicaciones` se inicializa vacío y no se sincroniza con las publicaciones persistidas.
- `RepositorioPublicaciones` existe en `src/service/repositorioPublicaciones.js`, pero no se inyecta ni es utilizado por los controladores.
- `publicacionController` lee y escribe directamente `src/repositories/Publicaciones.json`; cada registro contiene publicaciones y puede incluir sus reportes y valoraciones. Los reportes acumulados en `Usuario.reportes` no se persisten en el usuario.
- `Valoracion.emisor` guarda el correo como texto; no mantiene una referencia al objeto `Cliente`.
- `alquilerController` lee publicaciones de ese JSON y guarda el historial en `Cliente.historial` en memoria. Comprueba los roles dentro del controlador; las rutas solo aplican `requireAuth`.
- El middleware que asigna `req.user` está definido inline en `src/app.js`; no es un módulo exportado.
- `src/models/Propiedad.js` intenta importar `Producto` como default, pero `Producto.js` solo exporta `Producto` con nombre; ese módulo falla al cargarse. La herencia dibujada representa la declaración del código, no una clase utilizable actualmente.
- `src/repositories/historial.js` está vacío y no participa en el flujo actual.
- `GET /api/publicaciones/:id`, `PATCH /api/publicaciones/:id` y `DELETE /api/publicaciones/:id` no están implementados.
