# Contrato de la API — AlquiYA!

> El documento describe **qué endpoints expone el servidor**, **qué recibe y devuelve cada uno**, y **cuáles son sus convenciones**.
>
> **Estructura del documento.** Para cada endpoint se presentan dos bloques:
>
> 1. **Tabla de estado actual:** describe el comportamiento del endpoint
> 2. **Ejemplos:** solicitud y respuesta
>
> Los endpoints no implementados se marcan con **⏳ Pendiente** y se describe **cómo deberían construirse**. Los endpoints en trabajo (rama `feature/implementacion-de-alquileres`) se marcan como **⏳ WIP**.

---

<br>

# 1. Información general

| Campo                        | Definición                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre de la API             | API de AlquiYA!                                                                                                                                |
| URL base                     | `http://localhost:3000` — usuarios montados en `/usuarios`, publicaciones en `/api/publicaciones`, ubicación en `/api/ubicacion` (sin versión) |
| Formato principal            | `application/json`                                                                                                                             |
| Recursos                     | `usuarios`, `publicaciones`, `alquileres` (⏳ WIP), `reportes` (⏳ pendiente)                                                                  |
| Autenticación                | Sesión con cookie `clase08.sid` gestionada por `express-session`. `requireAuth` protege las rutas que lo requieren.                            |
| Identificador de usuario     | El **correo electrónico** es el identificador de negocio (no hay `idUsuario` en el modelo).                                                    |
| Identificador de publicación | Entero autoincremental. Se calcula a partir del archivo JSON.                                                                                  |
| Identificador de alquiler    | A definir según el diseño WIP.                                                                                                                 |
| Identificador de reporte     | Entero autoincremental. Aún no implementado.                                                                                                   |
| Roles                        | `Cliente` y `Propietario` (campo `tipo` del modelo).                                                                                           |
| Persistencia                 | Usuarios en memoria (`this.usuarios = []`) — se pierde al reiniciar; publicaciones en archivo JSON (`Publicaciones.json`).                     |

<br>

La API recibe y responde JSON, salvo en los casos en que la operación devuelve `204 No Content` y no hay cuerpo.

Los ejemplos usan `http://localhost:3000` como origen base. Los correos actúan como identificadores de usuario (ej. `ana@example.com` en `/usuarios/correo/ana@example.com`). Los identificadores de publicaciones son enteros (ej. `42`).

<br>

### 1.1 Formato de error

El proyecto define un **error handler central** (`src/middleware/errorHandler.js`) que responde con el siguiente formato:

```json
{ "status": "error", "message": "mensaje legible" }
```

Los controladores delegan a este handler con `next(error)`. Los servicios lanzan **errores de dominio** (`ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, todos heredando de `AppError` en `src/models/errores.js`).

⚠️ Algunos controladores (principalmente en publicaciones) aún responden directamente con `{ "error": "mensaje legible" }`, conviviendo dos formatos. La unificación es una de las deudas pendientes.

<br>

## 1.2 Glosario rápido

| Término              | Qué significa                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Endpoint**         | Combinación de método HTTP + ruta. Ej: `POST /usuarios/login`.                                              |
| **Path param**       | Parámetro que forma parte de la URL, marcado con `:`. Ej: `:correo`.                                        |
| **Query param**      | Parámetro que va en la URL después de `?`. Ej: `?pagina=1`.                                                 |
| **Status code**      | Código numérico de 3 dígitos (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `500`, `503`). |
| **Hash**             | Transformación irreversible. Se aplica a contraseñas (`bcryptjs`, 10 rounds).                               |
| **Cookie de sesión** | Dato que el servidor envía al cliente y el cliente devuelve automáticamente.                                |
| **Middleware**       | Función entre la petición y el controlador. Puede cortar el flujo (`401`) o pasar con `next()`.             |
| **Error de dominio** | Error que representa una regla de negocio violada (ej. `ConflictError`, `NotFoundError`).                   |

<br>

## 1.3 Respuestas HTTP utilizadas

| Estado                      | Uso                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `200 OK`                    | Consulta o actualización exitosa con respuesta.                                         |
| `201 Created`               | Recurso creado (alta de usuario o publicación).                                         |
| `204 No Content`            | Operación exitosa sin cuerpo (cierre de sesión, borrado lógico).                        |
| `400 Bad Request`           | Parámetros inválidos, JSON mal formado o validación de negocio fallida.                 |
| `401 Unauthorized`          | Falta sesión en ruta protegida (`requireAuth`) o credenciales inválidas.                |
| `403 Forbidden`             | Usuario autenticado sin permisos para la operación (rol incorrecto o falta de autoría). |
| `404 Not Found`             | Recurso inexistente (usuario, publicación, alquiler, reporte).                          |
| `409 Conflict`              | Correo duplicado en el alta de usuario.                                                 |
| `422 Unprocessable Content` | Datos bien formados que incumplen validaciones de negocio.                              |
| `500 Internal Server Error` | Error inesperado del servidor, sin exponer detalles internos.                           |
| `503 Service Unavailable`   | Falla en un servicio externo (geocodificación / Google Maps).                           |

<br>

## 1.4 Convenciones generales

| Campo                       | Definición                                                                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exposición de usuarios      | Se proyectan mediante `toPublic()` (excluye `contrasena`). Actualmente `toPublic` proyecta `{ nombre, apellido, correo, tipo, telefono }` y se aplica en `GET /me`, `GET /usuarios` y `GET /usuarios/correo/:correo`. ⚠️ `POST /usuarios/login` todavía no la aplica. |
| Exposición de publicaciones | Se devuelve el objeto tal cual se persiste en `Publicaciones.json`. No hay proyección formal que excluya campos internos.                                                                                                                                             |
| Formato de error            | El `errorHandler` responde con `{ "status": "error", "message": "..." }`. Algunos controladores aún responden `{ "error": "..." }`.                                                                                                                                   |
| Identidad pública           | El correo es el identificador de usuario.                                                                                                                                                                                                                             |
| Normalización de correo     | La búsqueda y el login normalizan con `trim().toLowerCase()`. El constructor de `usuario.js` **no** normaliza al almacenar.                                                                                                                                           |
| Autenticación               | `requireAuth` protege `GET /usuarios`, `GET /usuarios/correo/:correo`, `GET /me` y `POST /usuarios/logout`. `POST /usuarios` y `POST /usuarios/login` son públicos por diseño.                                                                                        |
| Autorización por rol        | El middleware `rol(tipo)` existe en `autentificacion.js`, pero **no se aplica en ninguna ruta actualmente**. Debería usarse en la creación y edición de publicaciones (`rol('Propietario')`).                                                                         |
| Sesión                      | Cookie `clase08.sid`, secret hardcodeado `'secret'` (inseguro), TTL 1 hora, `httpOnly`, `sameSite=lax`.                                                                                                                                                               |
| Persistencia                | Usuarios en memoria (`this.usuarios = []`); publicaciones en archivo JSON.                                                                                                                                                                                            |
| Proveedor externo           | Integración con Google Maps Geocoding API para validación de direcciones, a través de `/api/publicaciones/validar-direccion` y `/api/ubicacion`.                                                                                                                      |

---

<br>
<br>

# 2. Resumen general

| Sección           | Endpoints implementados | Endpoints pendientes                                  |
| ----------------- | ----------------------- | ----------------------------------------------------- |
| **Usuarios**      | 6                       | —                                                     |
| **Publicaciones** | 3                       | 3 (GET /:id, PATCH, DELETE)                           |
| **Alquileres**    | —                       | ⏳ WIP en rama `feature/implementacion-de-alquileres` |
| **Reportes**      | —                       | ⏳ Pendiente                                          |

<br>

**Endpoints de Usuarios:**

- `GET /usuarios`
- `POST /usuarios`
- `GET /usuarios/correo/:correo`
- `POST /usuarios/login`
- `POST /usuarios/logout`
- `GET /me`

**Endpoints de Publicaciones (implementados):**

- `GET /api/publicaciones`
- `POST /api/publicaciones`
- `POST /api/publicaciones/validar-direccion`

**Endpoints de Publicaciones (⏳ pendientes):**

- `GET /api/publicaciones/:id`
- `PATCH /api/publicaciones/:id`
- `DELETE /api/publicaciones/:id`

---

<br>
<br>

# 3. Sección Usuarios

<br>

**Descripción.** Este módulo gestiona el alta, la autenticación y la consulta de usuarios (`Cliente` o `Propietario`).

<br>

## 3.1 Resumen de endpoints

| Operación         | Método y ruta                  | Cuerpo de entrada                                                | Cuerpo de respuesta               | Autenticación |
| ----------------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------------- | ------------- |
| Listar usuarios   | `GET /usuarios`                | —                                                                | Arreglo de usuarios (proyectados) | `requireAuth` |
| Crear usuario     | `POST /usuarios`               | `nombre`, `apellido`, `telefono`, `correo`, `contrasena`, `tipo` | Usuario creado                    | Pública       |
| Buscar por correo | `GET /usuarios/correo/:correo` | Path: `correo`                                                   | Usuario (proyectado)              | `requireAuth` |
| Iniciar sesión    | `POST /usuarios/login`         | `correo`, `contrasena`                                           | Usuario + cookie `clase08.sid`    | Pública       |
| Cerrar sesión     | `POST /usuarios/logout`        | Cookie `clase08.sid`                                             | `204 No Content`                  | `requireAuth` |
| Perfil propio     | `GET /me`                      | Cookie `clase08.sid`                                             | Proyección `toPublic`             | `requireAuth` |

---

<br>

## 3.2 Listar usuarios — GET /usuarios

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                 |
| ------------------------ | ------------------------------------------------------------ |
| Recurso                  | Colección de usuarios                                        |
| Propósito                | Listar todos los usuarios registrados                        |
| Método HTTP              | GET                                                          |
| Endpoint                 | `/usuarios`                                                  |
| Parámetros de ruta       | No utiliza                                                   |
| Query string             | No utiliza                                                   |
| Encabezados de solicitud | `Accept: application/json` (opcional)                        |
| Cuerpo JSON              | No utiliza                                                   |
| Reglas de validación     | Ninguna                                                      |
| Autenticación            | `requireAuth`                                                |
| Respuesta exitosa        | `200 OK` con arreglo de usuarios proyectados con `toPublic`  |
| Encabezados de respuesta | `Content-Type: application/json`                             |
| Respuestas de error      | `401 Unauthorized` (sin sesión), `500 Internal Server Error` |

<br>

### Estructura del cuerpo de respuesta

| Campo      | Tipo   | Descripción                        |
| ---------- | ------ | ---------------------------------- |
| `nombre`   | string | Nombre del usuario                 |
| `apellido` | string | Apellido del usuario               |
| `correo`   | string | Correo del usuario (identificador) |
| `tipo`     | string | `"Cliente"` o `"Propietario"`      |
| `telefono` | string | Teléfono del usuario               |

La respuesta **no incluye** `contrasena` ni `reportes` ni `activo` porque se aplica `toPublic`.

<br>

### Ejemplo de solicitud

```http
GET /usuarios
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "nombre": "Ana",
    "apellido": "Pérez",
    "correo": "ana@example.com",
    "tipo": "Cliente",
    "telefono": "+5492911234567"
  }
]
```

<br>

### Ejemplo de error (sin sesión)

```json
{ "status": "error", "message": "No estás autenticado" }
```

<br>

### Notas

- La proyección `toPublic` se aplica en el servicio antes de responder (`RepositorioUsuarios.toPublic`).

---

<br>

## 3.3 Crear usuario — POST /usuarios

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Colección de usuarios                                                                                                                                                                                   |
| Propósito                | Registrar un nuevo `Cliente` o `Propietario`                                                                                                                                                            |
| Método HTTP              | POST                                                                                                                                                                                                    |
| Endpoint                 | `/usuarios`                                                                                                                                                                                             |
| Parámetros de ruta       | No utiliza                                                                                                                                                                                              |
| Query string             | No utiliza                                                                                                                                                                                              |
| Encabezados de solicitud | `Content-Type: application/json`                                                                                                                                                                        |
| Cuerpo JSON              | `nombre`, `apellido`, `telefono`, `correo`, `contrasena`, `tipo`                                                                                                                                        |
| Reglas de validación     | Modelo `usuario.js`: `nombre` 3–30 caracteres; `correo` válido (`Validator.isEmail`); `contrasena` fuerte (`Validator.isStrongPassword`); `tipo` debe ser `"Cliente"` o `"Propietario"` (casing exacto) |
| Autenticación            | Pública                                                                                                                                                                                                 |
| Respuesta exitosa        | `201 Created` con el usuario creado (proyectado)                                                                                                                                                        |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                                                                                                        |
| Respuestas de error      | `400 Bad Request` (datos inválidos), `409 Conflict` (correo duplicado), `500 Internal Server Error`                                                                                                     |

<br>

### Estructura del cuerpo de solicitud

| Campo        | Tipo   | Obligatorio | Descripción                              |
| ------------ | ------ | ----------- | ---------------------------------------- |
| `nombre`     | string | Sí          | Nombre del usuario (3–30 caracteres)     |
| `apellido`   | string | No          | Apellido del usuario                     |
| `telefono`   | string | No          | Teléfono de contacto                     |
| `correo`     | string | Sí          | Correo válido; identificador del usuario |
| `contrasena` | string | Sí          | Contraseña fuerte                        |
| `tipo`       | string | Sí          | `"Cliente"` o `"Propietario"`            |

<br>

### Ejemplo de solicitud

```http
POST /usuarios
Content-Type: application/json
```

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "telefono": "+5492911234567",
  "correo": "ana@example.com",
  "contrasena": "Ejemplo!123",
  "tipo": "Cliente"
}
```

<br>

### Ejemplo de respuesta exitosa

```http
201 Created
```

```json
{
  "nombre": "Ana Pérez",
  "correo": "ana@example.com",
  "tipo": "Cliente",
  "telefono": "+5492911234567"
}
```

<br>

### Ejemplo de error (correo duplicado)

```json
{ "status": "error", "message": "El correo ana@example.com ya está registrado" }
```

<br>

### Ejemplo de error (datos inválidos)

```json
{ "status": "error", "message": "El nombre debe tener entre 3 y 30 caracteres" }
```

<br>

### Notas

- El controlador combina `nombre` y `apellido` con `[nombre, apellido].filter(...).join(' ')` antes de pasarlos al servicio.
- **Deuda:** el servicio `agregarUsuario` no retorna el usuario creado; en la práctica el cuerpo `201` puede quedar vacío (`undefined`).
- **Deuda:** no se envía el header `Location: /usuarios/{correo}`.
- **Deuda:** si `tipo` no es `"Cliente"` ni `"Propietario"`, el servicio falla en silencio en lugar de lanzar error.

---

<br>

## 3.4 Buscar usuario por correo — GET /usuarios/correo/:correo

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                             |
| ------------------------ | ------------------------------------------------------------------------ |
| Recurso                  | Un usuario                                                               |
| Propósito                | Buscar un usuario por su correo electrónico                              |
| Método HTTP              | GET                                                                      |
| Endpoint                 | `/usuarios/correo/:correo`                                               |
| Parámetros de ruta       | `correo`: string (correo electrónico)                                    |
| Query string             | No utiliza                                                               |
| Encabezados de solicitud | `Accept: application/json` (opcional)                                    |
| Cuerpo JSON              | No utiliza                                                               |
| Reglas de validación     | El correo debe existir. La búsqueda normaliza con `trim().toLowerCase()` |
| Autenticación            | `requireAuth`                                                            |
| Respuesta exitosa        | `200 OK` con el usuario proyectado                                       |
| Encabezados de respuesta | `Content-Type: application/json`                                         |
| Respuestas de error      | `404 Not Found` si no se encuentra; `401 Unauthorized` sin sesión        |

<br>

### Estructura del cuerpo de respuesta

| Campo      | Tipo   | Descripción                   |
| ---------- | ------ | ----------------------------- |
| `nombre`   | string | Nombre del usuario            |
| `apellido` | string | Apellido del usuario          |
| `correo`   | string | Correo del usuario            |
| `tipo`     | string | `"Cliente"` o `"Propietario"` |
| `telefono` | string | Teléfono del usuario          |

<br>

### Ejemplo de solicitud

```http
GET /usuarios/correo/ana@example.com
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana@example.com",
  "tipo": "Cliente",
  "telefono": "+5492911234567"
}
```

<br>

### Ejemplo de error

```json
{ "status": "error", "message": "Usuario no encontrado" }
```

<br>

### Notas

- La búsqueda normaliza el correo con `trim().toLowerCase()` antes de comparar.
- El servicio lanza `NotFoundError`, que el `errorHandler` traduce a `404`.

---

<br>

## 3.5 Iniciar sesión — POST /usuarios/login

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Sesión de usuario                                                                                                                                                           |
| Propósito                | Autenticar al usuario y crear una sesión                                                                                                                                    |
| Método HTTP              | POST                                                                                                                                                                        |
| Endpoint                 | `/usuarios/login`                                                                                                                                                           |
| Parámetros de ruta       | No utiliza                                                                                                                                                                  |
| Query string             | No utiliza                                                                                                                                                                  |
| Encabezados de solicitud | `Content-Type: application/json`                                                                                                                                            |
| Cuerpo JSON              | `correo`, `contrasena`                                                                                                                                                      |
| Reglas de validación     | El usuario debe existir; `bcrypt.compare` debe confirmar la contraseña. El correo se normaliza con `trim().toLowerCase()`                                                   |
| Autenticación            | Pública (no requiere sesión previa)                                                                                                                                         |
| Respuesta exitosa        | ⚠️ `201 Created` con el **modelo crudo** (incluye hash). Debería ser `200 OK` con `toPublic`. Marca `activo = true`, regenera sesión y guarda `req.session.userId = correo` |
| Encabezados de respuesta | `Set-Cookie: clase08.sid=...; Path=/; HttpOnly; SameSite=Lax`; `Content-Type: application/json`                                                                             |
| Respuestas de error      | `404 Not Found` (usuario no encontrado), `400 Bad Request` (credenciales inválidas)                                                                                         |

<br>

### Estructura del cuerpo de solicitud

| Campo        | Tipo   | Obligatorio | Descripción               |
| ------------ | ------ | ----------- | ------------------------- |
| `correo`     | string | Sí          | Correo del usuario        |
| `contrasena` | string | Sí          | Contraseña en texto plano |

<br>

### Ejemplo de solicitud

```http
POST /usuarios/login
Content-Type: application/json
```

```json
{
  "correo": "ana@example.com",
  "contrasena": "Ejemplo!123"
}
```

<br>

### Ejemplo de respuesta exitosa

```http
201 Created
Set-Cookie: clase08.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax
```

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana@example.com",
  "contrasena": "$2a$10$abcdef...",
  "tipo": "Cliente",
  "telefono": "+5492911234567",
  "reportes": [],
  "activo": true
}
```

<br>

### Ejemplo de error (credenciales inválidas)

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

<br>

### Notas

- **Deuda crítica:** `201` en lugar de `200`, y devuelve el modelo crudo con `contrasena` (hash). Debería aplicar `toPublic`.
- El servicio lanza `ValidationError` para credenciales inválidas (traducido a `400`). Lo ideal sería `401 Unauthorized`.
- El servicio lanza `NotFoundError` si el usuario no existe (traducido a `404`).
- El servicio llama a `regenerate(req)` antes de asignar `req.session.userId`, previniendo fijación de sesión.

---

<br>

## 3.6 Cerrar sesión — POST /usuarios/logout

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Recurso                  | Sesión de usuario                                                                                                  |
| Propósito                | Destruir la sesión actual                                                                                          |
| Método HTTP              | POST                                                                                                               |
| Endpoint                 | `/usuarios/logout`                                                                                                 |
| Parámetros de ruta       | No utiliza                                                                                                         |
| Query string             | No utiliza                                                                                                         |
| Encabezados de solicitud | Cookie `clase08.sid`                                                                                               |
| Cuerpo JSON              | No utiliza                                                                                                         |
| Reglas de validación     | Debe existir una sesión activa (`req.session.userId`)                                                              |
| Autenticación            | `requireAuth`                                                                                                      |
| Respuesta exitosa        | `204 No Content` — ⚠️ el controlador hace `res.status(204).json({...})` (incorrecto; un 204 no debe llevar cuerpo) |
| Encabezados de respuesta | —                                                                                                                  |
| Respuestas de error      | `401 Unauthorized` si no hay sesión                                                                                |

<br>

### Ejemplo de solicitud

```http
POST /usuarios/logout
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```http
204 No Content
```

<br>

### Ejemplo de error

```json
{ "status": "error", "message": "No estás autenticado" }
```

<br>

### Notas

- El servicio marca `usuario.activo = false` y destruye la sesión.
- ⚠️ El controlador responde `204` con `res.json(...)` en lugar de `res.end()`. Express ignora el cuerpo en 204, pero es conceptualmente incorrecto.
- ⚠️ Puede lanzar `TypeError` si el usuario ya no existe en memoria (al reiniciar el servidor con una cookie vieja).

---

<br>

## 3.7 Obtener perfil propio — GET /me

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                      |
| ------------------------ | ------------------------------------------------- |
| Recurso                  | Perfil del usuario autenticado                    |
| Propósito                | Devolver los datos del usuario en sesión          |
| Método HTTP              | GET                                               |
| Endpoint                 | `/me`                                             |
| Parámetros de ruta       | No utiliza                                        |
| Query string             | No utiliza                                        |
| Encabezados de solicitud | Cookie `clase08.sid`                              |
| Cuerpo JSON              | No utiliza                                        |
| Reglas de validación     | Requiere sesión válida (middleware `requireAuth`) |
| Autenticación            | `requireAuth`                                     |
| Respuesta exitosa        | `200 OK` con proyección `toPublic`                |
| Encabezados de respuesta | `Content-Type: application/json`                  |
| Respuestas de error      | `401 Unauthorized` si no hay sesión               |

<br>

### Estructura del cuerpo de respuesta

| Campo      | Tipo   | Descripción          |
| ---------- | ------ | -------------------- |
| `nombre`   | string | Nombre del usuario   |
| `apellido` | string | Apellido del usuario |
| `correo`   | string | Correo del usuario   |
| `tipo`     | string | Rol del usuario      |
| `telefono` | string | Teléfono del usuario |

<br>

### Ejemplo de solicitud

```http
GET /me
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana@example.com",
  "tipo": "Cliente",
  "telefono": "+5492911234567"
}
```

<br>

### Ejemplo de error

```json
{ "status": "error", "message": "No estás autenticado" }
```

<br>

### Notas

- `toPublic` proyecta correctamente los campos (`nombre`, `apellido`, `correo`, `tipo`, `telefono`). El bug de `id`/`role` del Sprint 02 fue corregido.
- `GET /me` está montado directamente en `app.js` con `requireAuth`. También existe `GET /usuarios/me` en el router que apunta a `buscarLogueado` (duplicación).
- La ruta `GET /usuarios/me` debe registrarse **antes** de `GET /usuarios/correo/:correo` para que Express no la interprete como un correo (en la implementación actual, `:correo` matchearía `"me"`; conviene revisar el orden).

---

<br>
<br>

# 4. Sección Publicaciones

<br>

**Descripción.** Módulo de publicaciones de propiedades, habitaciones y vehículos. Actualmente implementado con persistencia en archivo JSON (`Publicaciones.json`).

<br>

## 4.1 Resumen de endpoints

| Operación             | Método y ruta                               | Autenticación                                | Entrada                                                  | Cuerpo de respuesta                | Códigos                    |
| --------------------- | ------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- | ---------------------------------- | -------------------------- |
| Listar publicaciones  | `GET /api/publicaciones`                    | Público                                      | —                                                        | `{ publicaciones }`                | `200`, `500`               |
| Crear publicación     | `POST /api/publicaciones`                   | ⚠️ Pública (sin `requireAuth` ni `rol`)      | `titulo`, `descripcion`, `direccion`, `precio`, `imagen` | Publicación creada                 | `201`, `400`, `503`, `500` |
| Validar dirección     | `POST /api/publicaciones/validar-direccion` | Pública                                      | `direccion`                                              | `{ valido, direccion, ubicacion }` | `200`, `400`, `503`, `500` |
| Consultar publicación | `GET /api/publicaciones/:id`                | Público                                      | Path: `id`                                               | Publicación                        | ⏳ Pendiente               |
| Editar publicación    | `PATCH /api/publicaciones/:id`              | `requireAuth` + `rol('Propietario')` + autor | Path: `id`; JSON parcial                                 | Publicación actualizada            | ⏳ Pendiente               |
| Eliminar publicación  | `DELETE /api/publicaciones/:id`             | `requireAuth` + `rol('Propietario')` + autor | Path: `id`                                               | Sin cuerpo (soft delete)           | ⏳ Pendiente               |

---

<br>

## 4.2 Listar publicaciones — GET /api/publicaciones

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                |
| ------------------------ | ----------------------------------------------------------- |
| Recurso                  | Colección de publicaciones                                  |
| Propósito                | Listar todas las publicaciones desde el archivo JSON        |
| Método HTTP              | GET                                                         |
| Endpoint                 | `/api/publicaciones`                                        |
| Parámetros de ruta       | No utiliza                                                  |
| Query string             | No utiliza actualmente (⏳ pendiente: filtros y paginación) |
| Encabezados de solicitud | `Accept: application/json` (opcional)                       |
| Cuerpo JSON              | No utiliza                                                  |
| Reglas de validación     | Ninguna                                                     |
| Autenticación            | Pública                                                     |
| Respuesta exitosa        | `200 OK` con `{ publicaciones }`                            |
| Encabezados de respuesta | `Content-Type: application/json`                            |
| Respuestas de error      | `500 Internal Server Error` (error de lectura del archivo)  |

<br>

### Estructura del cuerpo de respuesta

| Campo                  | Tipo    | Descripción                                     |
| ---------------------- | ------- | ----------------------------------------------- |
| `id`                   | number  | Identificador de la publicación                 |
| `titulo`               | string  | Título de la publicación                        |
| `descripcion`          | string  | Descripción                                     |
| `direccion`            | string  | Dirección                                       |
| `precio`               | number  | Precio                                          |
| `autor`                | string  | Correo del propietario (o `null` si es anónimo) |
| `imagen`               | string  | URL o ruta de la imagen                         |
| `ubicacion`            | string  | Dirección completa geocodificada                |
| `calificacion`         | number  | Calificación promedio                           |
| `cantidadValoraciones` | number  | Cantidad de valoraciones                        |
| `detalle`              | string  | Detalle adicional                               |
| `disponibilidad`       | boolean | Si está disponible                              |
| `fechaCreacion`        | string  | Fecha de creación (ISO)                         |

<br>

### Ejemplo de solicitud

```http
GET /api/publicaciones
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "publicaciones": [
    {
      "id": 42,
      "titulo": "Departamento céntrico",
      "descripcion": "2 ambientes, luminoso",
      "direccion": "Av. Siempre Viva 123",
      "precio": 50000,
      "autor": "ana@example.com",
      "imagen": "/img/depto.jpg",
      "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
      "calificacion": 0,
      "cantidadValoraciones": 0,
      "detalle": "Departamento céntrico",
      "disponibilidad": true,
      "fechaCreacion": "2026-11-12T10:00:00.000Z"
    }
  ]
}
```

<br>

### Notas

- **⏳ Pendiente:** soportar query params `tipo`, `precioMin`, `precioMax`, `pagina`, `limite`, `propietarioId`, `disponibilidad`. Debería devolver `{ total, pagina, limite, publicaciones }`.
- **⏳ Pendiente:** aplicar proyección que excluya campos internos (hoy se devuelve el objeto tal cual del archivo JSON).

---

<br>

## 4.3 Crear publicación — POST /api/publicaciones

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Colección de publicaciones                                                                                             |
| Propósito                | Crear una nueva publicación                                                                                            |
| Método HTTP              | POST                                                                                                                   |
| Endpoint                 | `/api/publicaciones`                                                                                                   |
| Parámetros de ruta       | No utiliza                                                                                                             |
| Query string             | No utiliza                                                                                                             |
| Encabezados de solicitud | `Content-Type: application/json`                                                                                       |
| Cuerpo JSON              | `titulo`, `descripcion`, `direccion`, `precio`, `imagen`                                                               |
| Reglas de validación     | `titulo`, `imagen`, `descripcion` y `direccion` obligatorios (strings no vacíos); `precio` numérico positivo           |
| Autenticación            | ❌ **Pública** (no se aplica `requireAuth` ni `rol('Propietario')`)                                                    |
| Respuesta exitosa        | `201 Created` con la publicación creada                                                                                |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                       |
| Respuestas de error      | `400 Bad Request` (datos inválidos), `503 Service Unavailable` (fallo de geocodificación), `500 Internal Server Error` |

<br>

### Estructura del cuerpo de solicitud

| Campo         | Tipo   | Obligatorio | Descripción              |
| ------------- | ------ | ----------- | ------------------------ |
| `titulo`      | string | Sí          | Título de la publicación |
| `descripcion` | string | Sí          | Descripción              |
| `direccion`   | string | Sí          | Dirección                |
| `precio`      | number | Sí          | Precio positivo          |
| `imagen`      | string | Sí          | URL o ruta de la imagen  |

<br>

### Ejemplo de solicitud

```http
POST /api/publicaciones
Content-Type: application/json
```

```json
{
  "titulo": "Departamento céntrico",
  "descripcion": "2 ambientes, luminoso",
  "direccion": "Av. Siempre Viva 123",
  "precio": 50000,
  "imagen": "/img/depto.jpg"
}
```

<br>

### Ejemplo de respuesta exitosa

```http
201 Created
```

```json
{
  "id": 42,
  "titulo": "Departamento céntrico",
  "descripcion": "2 ambientes, luminoso",
  "direccion": "Av. Siempre Viva 123",
  "precio": 50000,
  "autor": null,
  "imagen": "/img/depto.jpg",
  "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
  "calificacion": 0,
  "cantidadValoraciones": 0,
  "detalle": "Departamento céntrico",
  "disponibilidad": true,
  "fechaCreacion": "2026-11-12T10:00:00.000Z"
}
```

<br>

### Ejemplo de error (datos inválidos)

```json
{ "error": "El título es obligatorio." }
```

<br>

### Ejemplo de error (geocodificación fallida)

```json
{ "error": "No se pudo validar la dirección." }
```

<br>

### Notas

- **❌ Deuda crítica:** la ruta no está protegida. Cualquier usuario (incluso anónimo) puede crear publicaciones. Debería aplicar `requireAuth` y `rol('Propietario')`.
- `autor` se asigna desde `req.user?.correo ?? null`. Si no hay sesión, queda `null`.
- El controlador habla directamente con el sistema de archivos (`readFile`/`writeFile`), salteando la capa de servicio. La validación de dirección sí se delega a `publicacionesService.js`.
- **⏳ Pendiente:** agregar header `Location: /api/publicaciones/{id}`.
- **⏳ Pendiente:** que el controlador delegue a `publicacionesService.js` en lugar de leer/escribir el archivo directamente.

---

<br>

## 4.4 Validar dirección — POST /api/publicaciones/validar-direccion

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Recurso                  | Validación de dirección                                                                                |
| Propósito                | Geocodificar una dirección contra Google Maps                                                          |
| Método HTTP              | POST                                                                                                   |
| Endpoint                 | `/api/publicaciones/validar-direccion`                                                                 |
| Parámetros de ruta       | No utiliza                                                                                             |
| Query string             | `direccion` (alternativo)                                                                              |
| Encabezados de solicitud | `Content-Type: application/json`                                                                       |
| Cuerpo JSON              | `direccion`                                                                                            |
| Reglas de validación     | `direccion` obligatoria (string no vacío)                                                              |
| Autenticación            | Pública                                                                                                |
| Respuesta exitosa        | `200 OK` con `{ valido: true, direccion, ubicacion }`                                                  |
| Encabezados de respuesta | `Content-Type: application/json`                                                                       |
| Respuestas de error      | `400 Bad Request` (dirección inválida o no encontrada), `503 Service Unavailable` (fallo del servicio) |

<br>

### Estructura del cuerpo de solicitud

| Campo       | Tipo   | Obligatorio | Descripción         |
| ----------- | ------ | ----------- | ------------------- |
| `direccion` | string | Sí          | Dirección a validar |

<br>

### Ejemplo de solicitud

```http
POST /api/publicaciones/validar-direccion
Content-Type: application/json
```

```json
{
  "direccion": "Av. Siempre Viva 123"
}
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "valido": true,
  "direccion": "Av. Siempre Viva 123",
  "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina"
}
```

<br>

### Notas

- Internamente usa `validarDireccionPublicacion` de `publicacionesService.js`, que a su vez llama a `buscarUbicacionPorTexto` de `ubicacionService.js`.
- Si la dirección no contiene "Bahía Blanca", se le agrega automáticamente para acotar la búsqueda.

---

<br>

## 4.5 Consultar publicación — GET /api/publicaciones/:id

<br>

### Tabla de estado actual

| Campo               | Valor actual                                               |
| ------------------- | ---------------------------------------------------------- |
| Recurso             | Una publicación                                            |
| Propósito           | Obtener el detalle de una publicación por su identificador |
| Método HTTP         | GET                                                        |
| Endpoint            | `/api/publicaciones/:id`                                   |
| Parámetros de ruta  | `id`: entero autoincremental                               |
| Query string        | No utiliza                                                 |
| Autenticación       | Pública                                                    |
| Respuesta exitosa   | `200 OK` con la publicación                                |
| Respuestas de error | `404 Not Found` (no existe), `500 Internal Server Error`   |

<br>

### ⏳ Estado pendiente

**Este endpoint no está implementado.** Debería construirse así:

1. Leer el archivo `Publicaciones.json`.
2. Buscar la publicación cuyo `id` coincida con el parámetro de ruta.
3. Si no existe, lanzar `NotFoundError` (el `errorHandler` lo traduce a `404`).
4. Si existe, devolver `200 OK` con el objeto de la publicación.
5. Opcionalmente, aplicar una proyección para excluir campos internos.

<br>

### Ejemplo de solicitud (esperado)

```http
GET /api/publicaciones/42
```

<br>

### Ejemplo de respuesta exitosa (esperada)

```json
{
  "id": 42,
  "titulo": "Departamento céntrico",
  "descripcion": "2 ambientes, luminoso",
  "direccion": "Av. Siempre Viva 123",
  "precio": 50000,
  "autor": "ana@example.com",
  "imagen": "/img/depto.jpg",
  "disponibilidad": true,
  "fechaCreacion": "2026-11-12T10:00:00.000Z"
}
```

<br>

### Ejemplo de error (esperado)

```json
{ "status": "error", "message": "Publicación no encontrada" }
```

---

<br>

## 4.6 Editar publicación — PATCH /api/publicaciones/:id

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Recurso                  | Una publicación                                                                                      |
| Propósito                | Actualizar parcialmente una publicación existente                                                    |
| Método HTTP              | PATCH                                                                                                |
| Endpoint                 | `/api/publicaciones/:id`                                                                             |
| Parámetros de ruta       | `id`: entero autoincremental                                                                         |
| Encabezados de solicitud | `Content-Type: application/json`; Cookie `clase08.sid`                                               |
| Cuerpo JSON              | Campos parciales: `titulo`, `descripcion`, `direccion`, `precio`, `imagen`, `disponibilidad`         |
| Autenticación            | `requireAuth` + `rol('Propietario')` + verificación de autoría                                       |
| Respuesta exitosa        | `200 OK` con la publicación actualizada                                                              |
| Respuestas de error      | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error` |

<br>

### ⏳ Estado pendiente

**Este endpoint no está implementado.** Debería construirse así:

1. Aplicar `requireAuth` y `rol('Propietario')` en la ruta.
2. Leer el archivo JSON y buscar la publicación por `id`.
3. Si no existe → `404 Not Found`.
4. Comparar `publicacion.autor` con `req.user.correo`. Si no coinciden → `403 Forbidden`.
5. Validar los campos enviados (si se envía `precio`, debe ser positivo; si se envía `direccion`, geocodificarla).
6. Actualizar los campos permitidos y persistir en el archivo.
7. Devolver `200 OK` con la publicación actualizada.
8. El controlador debe delegar a `publicacionesService.js` en lugar de operar sobre el archivo directamente.

<br>

### Ejemplo de solicitud (esperado)

```http
PATCH /api/publicaciones/42
Content-Type: application/json
Cookie: clase08.sid=s%3A...
```

```json
{
  "precio": 55000,
  "disponibilidad": false
}
```

<br>

### Ejemplo de respuesta exitosa (esperada)

```json
{
  "id": 42,
  "titulo": "Departamento céntrico",
  "descripcion": "2 ambientes, luminoso",
  "direccion": "Av. Siempre Viva 123",
  "precio": 55000,
  "autor": "ana@example.com",
  "imagen": "/img/depto.jpg",
  "disponibilidad": false,
  "fechaCreacion": "2026-11-12T10:00:00.000Z"
}
```

<br>

### Ejemplo de error (no es el autor)

```json
{
  "status": "error",
  "message": "No tenés permisos para modificar esta publicación"
}
```

---

<br>

## 4.7 Eliminar publicación — DELETE /api/publicaciones/:id

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                      |
| ------------------------ | --------------------------------------------------------------------------------- |
| Recurso                  | Una publicación                                                                   |
| Propósito                | Eliminar (soft delete) una publicación existente                                  |
| Método HTTP              | DELETE                                                                            |
| Endpoint                 | `/api/publicaciones/:id`                                                          |
| Parámetros de ruta       | `id`: entero autoincremental                                                      |
| Encabezados de solicitud | Cookie `clase08.sid`                                                              |
| Autenticación            | `requireAuth` + `rol('Propietario')` + verificación de autoría                    |
| Respuesta exitosa        | `204 No Content` sin cuerpo                                                       |
| Respuestas de error      | `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error` |

<br>

### ⏳ Estado pendiente

**Este endpoint no está implementado.** Debería construirse así:

1. Aplicar `requireAuth` y `rol('Propietario')`.
2. Buscar la publicación por `id`. Si no existe → `404 Not Found`.
3. Verificar que `publicacion.autor === req.user.correo`. Si no → `403 Forbidden`.
4. Realizar un **soft delete**: agregar un campo `eliminada: true` (o `activa: false`) y persistir el cambio en el archivo JSON.
5. Devolver `204 No Content` **sin cuerpo** (usar `res.status(204).end()`).

<br>

### Ejemplo de solicitud (esperado)

```http
DELETE /api/publicaciones/42
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa (esperado)

```http
204 No Content
```

<br>

### Ejemplo de error (no existe)

```json
{ "status": "error", "message": "Publicación no encontrada" }
```

---

<br>
<br>

# 5. Sección Alquileres y Reportes

<br>

**Descripción.** Los alquileres y reportes se gestionan como sub-recursos de `usuarios` y `publicaciones`. La rama `feature/implementacion-de-alquileres` contiene trabajo en progreso (WIP) para alquileres, pero **aún no está mergeada a `dev/sprint03`**.

<br>

## 5.1 Resumen de endpoints

| Operación                      | Método y ruta                             | Autenticación                        | Entrada                 | Cuerpo de respuesta   | Estado       |
| ------------------------------ | ----------------------------------------- | ------------------------------------ | ----------------------- | --------------------- | ------------ |
| Listar alquileres de usuario   | `GET /usuarios/:correo/alquileres`        | `requireAuth` + autor                | Path: `correo`          | Arreglo de alquileres | ⏳ WIP       |
| Aceptar alquiler               | `PATCH /usuarios/:correo/alquileres/:id`  | `requireAuth` + `rol('Propietario')` | Path: `correo`, `id`    | Alquiler actualizado  | ⏳ WIP       |
| Cancelar alquiler              | `DELETE /usuarios/:correo/alquileres/:id` | `requireAuth` + autor                | Path: `correo`, `id`    | `204 No Content`      | ⏳ WIP       |
| Listar reportes de publicación | `GET /api/publicaciones/:id/reportes`     | `requireAuth` + `rol('Propietario')` | Path: `id`              | Arreglo de reportes   | ⏳ Pendiente |
| Crear reporte                  | `POST /api/publicaciones/:id/reportes`    | `requireAuth`                        | `motivo`, `descripcion` | Reporte creado        | ⏳ Pendiente |
| Listar reportes de usuario     | `GET /usuarios/:correo/reportes`          | `requireAuth` + autor                | Path: `correo`          | Arreglo de reportes   | ⏳ Pendiente |

<br>

### 5.2 Estado de Alquileres (rama `feature/implementacion-de-alquileres`)

La rama WIP incluye controladores y rutas para:

- Aceptar y cancelar peticiones de alquiler por parte del propietario.
- Listar alquileres de un usuario.

**Cómo debería construirse:**

1. **Modelo `Alquiler`:** debe tener `id`, `publicacionId`, `clienteCorreo`, `propietarioCorreo`, `fechaInicio`, `fechaFin`, `precioTotal`, `estado` (`pendiente`, `aceptado`, `cancelado`, `finalizado`).
2. **Rutas:**
   - `GET /usuarios/:correo/alquileres` → `requireAuth` + autoría (solo el propio usuario puede ver sus alquileres).
   - `POST /api/publicaciones/:id/alquileres` → `requireAuth` (un `Cliente` solicita alquilar).
   - `PATCH /usuarios/:correo/alquileres/:id` → `requireAuth` + `rol('Propietario')` (el propietario acepta/cancela).
3. **Servicio:** `alquileresService.js` con reglas como "no se puede alquilar una publicación no disponible", "no se puede aceptar un alquiler ya cancelado".
4. **Persistencia:** archivo JSON `Alquileres.json` o en memoria (consistente con usuarios).

> ⚠️ **Nota:** la rama aún no está mergeada. Una vez mergeada, los endpoints deben documentarse con el mismo nivel de detalle que los de usuarios y publicaciones (tabla de estado actual + ejemplos de solicitud/respuesta). Los paths definitivos pueden diferir de los propuestos.

<br>

### 5.3 Estado de Reportes

**No implementado.** Debería construirse como sub-recurso de publicaciones y usuarios:

- `POST /api/publicaciones/:id/reportes` → `requireAuth` (cualquier usuario autenticado puede reportar).
- `GET /api/publicaciones/:id/reportes` → `requireAuth` + `rol('Propietario')` (solo el dueño ve los reportes de su publicación).
- `GET /usuarios/:correo/reportes` → `requireAuth` + autoría (el usuario ve los reportes que ha creado).
- Modelo `Reporte` con `id`, `motivo`, `descripcion`, `fecha`, `reportadorCorreo`, `publicacionId`.

---

<br>
<br>

# 6. Resumen de deudas y próximos pasos

| Área                    | Deuda                                                                   | Prioridad |
| ----------------------- | ----------------------------------------------------------------------- | --------- |
| **Autenticación**       | `POST /api/publicaciones` no está protegido                             | 🔴 Alta   |
| **Autorización**        | El middleware `rol(tipo)` existe pero no se usa en ninguna ruta         | 🔴 Alta   |
| **Exposición de datos** | `POST /usuarios/login` devuelve el hash `contrasena`                    | 🔴 Alta   |
| **Códigos HTTP**        | `POST /usuarios/login` devuelve `201` (debería ser `200`)               | 🟡 Media  |
| **Códigos HTTP**        | Credenciales inválidas devuelven `400` (debería ser `401`)              | 🟡 Media  |
| **Códigos HTTP**        | `POST /usuarios/logout` responde `204` con cuerpo (`res.json`)          | 🟡 Media  |
| **Capa de servicio**    | `publicacionController` habla directo con el sistema de archivos        | 🟡 Media  |
| **Endpoints faltantes** | `GET`, `PATCH`, `DELETE` de publicaciones                               | 🟡 Media  |
| **Proyección**          | Publicaciones se devuelven sin proyección (campos internos expuestos)   | 🟡 Media  |
| **Errores**             | Controladores de publicaciones usan `{ error }` en vez de `next(error)` | 🟡 Media  |
| **Validación**          | `POST /usuarios` falla en silencio si `tipo` es inválido                | 🟡 Media  |
| **Capa de servicio**    | `agregarUsuario` no retorna el usuario creado                           | 🟡 Media  |
| **Persistencia**        | Usuarios en memoria (se pierden al reiniciar)                           | 🟢 Baja   |
| **Alquileres**          | WIP en rama `feature/implementacion-de-alquileres`                      | 🟢 Baja   |
