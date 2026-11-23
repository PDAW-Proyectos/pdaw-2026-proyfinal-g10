# Contrato de la API — AlquiYA!

> El documento describe **qué endpoints expone el servidor**, **qué recibe y devuelve cada uno**, y **cuáles son sus convenciones**.
>
> **Estructura del documento.** Para cada endpoint se presentan dos bloques:
>
> 1. **Tabla de estado:** describe el comportamiento del endpoint
> 2. **Ejemplos:** solicitud y respuesta

---

<br>

# 1. Información general

| Campo                        | Definición                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre de la API             | API de AlquiYA!                                                                                                                                                                               |
| URL base                     | `http://localhost:3000` — salud en `/api/salud`, usuarios en `/usuarios`, publicaciones en `/api/publicaciones`, ubicación en `/api/ubicacion`, alquileres en `/api/alquileres` (sin versión) |
| Formato principal            | `application/json`                                                                                                                                                                            |
| Recursos                     | `salud`, `usuarios`, `publicaciones`, `ubicacion`, `alquileres`, `reportes`, `valoraciones`                                                                                                   |
| Autenticación                | Sesión con cookie `Alquiya.sid` gestionada por `express-session`. `requireAuth` protege las rutas que lo requieren.                                                                           |
| Identificador de usuario     | El **correo electrónico** es el identificador de negocio (no hay `idUsuario` en el modelo).                                                                                                   |
| Identificador de publicación | Entero autoincremental. Se calcula a partir del archivo JSON.                                                                                                                                 |
| Identificador de alquiler    | UUID generado con `randomUUID()` al crear el alquiler.                                                                                                                                        |
| Identificador de reporte     | Entero asignado al crear un reporte.                                                                                                                                                          |
| Roles                        | `Cliente` y `Propietario` (campo `tipo` del modelo).                                                                                                                                          |
| Persistencia                 | Usuarios y alquileres en memoria; publicaciones, reportes y valoraciones en `src/repositories/Publicaciones.json`.                                                                            |

<br>

La mayoría de los endpoints reciben y responden JSON. `POST /usuarios/logout` usa `204 No Content` y no devuelve cuerpo.

Los ejemplos usan `http://localhost:3000` como origen base. Los correos actúan como identificadores de usuario (ej. `ana@example.com` en `/usuarios/correo/ana@example.com`). Los identificadores de publicaciones son enteros (ej. `42`). Los identificadores de alquileres son UUID (ej. `550e8400-e29b-41d4-a716-446655440000`).

<br>

### 1.1 Formato de error

El proyecto define un **error handler central** (`src/middleware/errorHandler.js`) que responde con el siguiente formato cuando recibe un error delegado:

```json
{ "status": "error", "message": "mensaje legible" }
```

`UserController` y algunas operaciones de publicaciones delegan errores con `next(error)`. `requireAuth` y `rol(tipo)` también pasan sus errores a este handler. Los errores de dominio (`ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`) heredan de `AppError` en `src/models/errores.js`.

Varios controladores responden directamente con `{ "error": "mensaje legible" }`; por eso conviven dos formatos de error.

<br>

## 1.2 Glosario rápido

| Término              | Qué significa                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**         | Combinación de método HTTP + ruta. Ej: `POST /usuarios/login`.                                                                                          |
| **Path param**       | Parámetro que forma parte de la URL, marcado con `:`. Ej: `:correo`.                                                                                    |
| **Query param**      | Parámetro que va en la URL después de `?`. Ej: `?pagina=1`.                                                                                             |
| **Status code**      | Código numérico de 3 dígitos (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `500`, `503`).                                                    |
| **Hash**             | Transformación irreversible. Se aplica a contraseñas (`bcryptjs`, 10 rounds).                                                                           |
| **Cookie de sesión** | Dato que el servidor envía al cliente y el cliente devuelve automáticamente.                                                                            |
| **Middleware**       | Función que procesa la petición antes del controlador. `requireAuth` puede producir `401`; `rol(tipo)`, `403`; ambos delegan el error a `errorHandler`. |
| **Error de dominio** | Error que representa una regla de negocio violada (ej. `ConflictError`, `NotFoundError`).                                                               |
| **UUID**             | Identificador único universal (v4). Se usa para los alquileres.                                                                                         |

<br>

## 1.3 Respuestas HTTP utilizadas

| Estado                      | Uso                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `200 OK`                    | Consulta o actualización exitosa con respuesta.                                        |
| `201 Created`               | Recurso creado; también se usa en el inicio de sesión.                                 |
| `204 No Content`            | Operación exitosa sin cuerpo (cierre de sesión).                                       |
| `400 Bad Request`           | Parámetros inválidos, JSON mal formado o validación de negocio fallida.                |
| `401 Unauthorized`          | Falta sesión en una ruta protegida (`requireAuth`) o el rol no está autenticado.       |
| `403 Forbidden`             | Usuario autenticado sin permisos para la operación (por ejemplo, rol incorrecto).      |
| `404 Not Found`             | Recurso inexistente (usuario, publicación, alquiler, reporte).                         |
| `409 Conflict`              | Alquiler activo/pendiente, publicación no disponible, reporte o valoración duplicados. |
| `500 Internal Server Error` | Error inesperado del servidor, sin exponer detalles internos.                          |
| `503 Service Unavailable`   | Falla en un servicio externo (geocodificación / Nominatim).                            |

<br>

## 1.4 Convenciones generales

| Campo                       | Definición                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exposición de usuarios      | `toPublic()` proyecta `{ nombre, apellido, correo, tipo, telefono }` dentro de `usuario` en `GET /usuarios/me`. El registro, login y búsqueda por correo devuelven el objeto de usuario completo, incluido el hash de `contrasena`.                                                                                                                                                                                       |
| Exposición de publicaciones | El listado y el detalle público por id devuelven las propiedades del objeto persistido excepto `reportes`, y añaden `nombreAutor`. Si existe `valoraciones`, también se expone el arreglo con el correo de cada emisor.                                                                                                                                                                                                   |
| Formato de error            | `errorHandler` responde `{ "status": "error", "message": "..." }`; varios errores validados directamente responden `{ "error": "..." }`.                                                                                                                                                                                                                                                                                  |
| Identidad pública           | El correo es el identificador de usuario.                                                                                                                                                                                                                                                                                                                                                                                 |
| Normalización de correo     | La búsqueda y el login normalizan con `trim().toLowerCase()`. El constructor de `usuario.js` **no** normaliza al almacenar.                                                                                                                                                                                                                                                                                               |
| Autenticación               | `requireAuth` protege `GET /usuarios/correo/:correo`, `POST /usuarios/logout`, todos los endpoints de alquileres y las rutas de reportes/valoraciones. `POST /api/publicaciones`, `PATCH /api/publicaciones/:id` y `DELETE /api/publicaciones/:id` requieren además el rol `Propietario`; PATCH y DELETE verifican que el usuario autenticado sea el autor. `GET /usuarios/me` es público y consulta el estado de sesión. |
| Autorización por rol        | `rol('Cliente')` protege crear reportes/valoraciones; `rol('Propietario')` protege listarlos. Los controladores de alquileres verifican el rol manualmente.                                                                                                                                                                                                                                                               |
| Sesión                      | Cookie `Alquiya.sid`, secreto `SESSION_SECRET` (obligatorio en producción; `solo-para-desarrollo` por defecto), TTL 1 hora, `httpOnly`, `sameSite=lax`; `secure` en producción.                                                                                                                                                                                                                                           |
| Persistencia                | Usuarios y alquileres en memoria; publicaciones, reportes y valoraciones en archivo JSON.                                                                                                                                                                                                                                                                                                                                 |
| Proveedor externo           | Integración con **Nominatim (OpenStreetMap)** para geocodificación, a través de `/api/publicaciones/validar-direccion` y `/api/ubicacion`.                                                                                                                                                                                                                                                                                |

---

<br>
<br>

# 2. Resumen general

| Sección                                    | Endpoints expuestos |
| ------------------------------------------ | ------------------- |
| **Salud**                                  | 1                   |
| **Usuarios y sesión**                      | 5                   |
| **Publicaciones, reportes y valoraciones** | 10                  |
| **Ubicación**                              | 1                   |
| **Alquileres**                             | 5                   |

**Endpoint de salud:**

- `GET /api/salud`

<br>

**Endpoints de Usuarios:**

- `POST /usuarios`
- `GET /usuarios/correo/:correo`
- `POST /usuarios/login`
- `POST /usuarios/logout`
- `GET /usuarios/me` (consulta pública del estado de sesión)

**Endpoints de Publicaciones (implementados):**

- `GET /api/publicaciones`
- `POST /api/publicaciones`
- `POST /api/publicaciones/validar-direccion`
- `GET /api/publicaciones/:id`
- `PATCH /api/publicaciones/:id`
- `DELETE /api/publicaciones/:id`
- `GET /api/publicaciones/:id/reportes`
- `POST /api/publicaciones/:id/reportes`
- `GET /api/publicaciones/:id/valoraciones`
- `POST /api/publicaciones/:id/valoraciones`

**Endpoints de Ubicación (implementados):**

- `GET /api/ubicacion?q=texto`

**Endpoints de Alquileres:**

- `GET /api/alquileres`
- `POST /api/alquileres`
- `PATCH /api/alquileres/:id/cancelar`
- `GET /api/alquileres/propietario`
- `PATCH /api/alquileres/:id/estado`

---

<br>
<br>

## 2.1 Estado del servidor — GET /api/salud

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| Recurso                  | Estado del proceso del servidor                                   |
| Propósito                | Informar que el servidor está activo y mostrar datos de ejecución |
| Método HTTP              | GET                                                               |
| Endpoint                 | `/api/salud`                                                      |
| Parámetros de ruta       | No utiliza                                                        |
| Query string             | No utiliza                                                        |
| Encabezados de solicitud | `Accept: application/json` (opcional)                             |
| Cuerpo JSON              | No utiliza                                                        |
| Autenticación            | Pública                                                           |
| Respuesta exitosa        | `200 OK` con `estado`, `version`, `entorno` y `uptime`            |
| Respuestas de error      | No define respuestas de error propias                             |

<br>

### Ejemplo de solicitud

```http
GET /api/salud
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "estado": "ok",
  "version": "1.0.0",
  "entorno": "development",
  "uptime": 12
}
```

`uptime` indica los segundos transcurridos desde que se inició el proceso.

---

<br>
<br>

# 3. Sección Usuarios

<br>

**Descripción.** Este módulo gestiona el alta, la autenticación y la consulta de usuarios (`Cliente` o `Propietario`).

<br>

## 3.1 Resumen de endpoints

| Operación                  | Método y ruta                  | Cuerpo de entrada                                                | Cuerpo de respuesta                      | Autenticación |
| -------------------------- | ------------------------------ | ---------------------------------------------------------------- | ---------------------------------------- | ------------- |
| Crear usuario              | `POST /usuarios`               | `nombre`, `apellido`, `telefono`, `correo`, `contrasena`, `tipo` | Modelo de usuario creado                 | Pública       |
| Buscar por correo          | `GET /usuarios/correo/:correo` | Path: `correo`                                                   | Modelo de usuario, si existe             | `requireAuth` |
| Iniciar sesión             | `POST /usuarios/login`         | `correo`, `contrasena`                                           | Modelo de usuario + cookie `Alquiya.sid` | Pública       |
| Cerrar sesión              | `POST /usuarios/logout`        | Cookie `Alquiya.sid`                                             | Sin cuerpo (`204`)                       | `requireAuth` |
| Consultar estado de sesión | `GET /usuarios/me`             | Cookie `Alquiya.sid` (opcional)                                  | `{ autenticado, usuario }`               | Pública       |

---

<br>

## 3.2 Crear usuario — POST /usuarios

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Colección de usuarios                                                                                                                                                                                                                                                              |
| Propósito                | Registrar un nuevo `Cliente` o `Propietario`                                                                                                                                                                                                                                       |
| Método HTTP              | POST                                                                                                                                                                                                                                                                               |
| Endpoint                 | `/usuarios`                                                                                                                                                                                                                                                                        |
| Parámetros de ruta       | No utiliza                                                                                                                                                                                                                                                                         |
| Query string             | No utiliza                                                                                                                                                                                                                                                                         |
| Encabezados de solicitud | `Content-Type: application/json` o `application/x-www-form-urlencoded`                                                                                                                                                                                                             |
| Cuerpo JSON              | `nombre`, `apellido`, `telefono`, `correo`, `contrasena`, `tipo`                                                                                                                                                                                                                   |
| Reglas de validación     | Modelo `usuario.js`: `nombre` 3–30 caracteres; `apellido` 3–15 caracteres; `correo` válido (`Validator.isEmail`); `telefono` formato argentino (`549` + número); `contrasena` fuerte (`Validator.isStrongPassword`); `tipo` debe ser `"Cliente"` o `"Propietario"` (casing exacto) |
| Autenticación            | Pública                                                                                                                                                                                                                                                                            |
| Respuesta exitosa        | `201 Created` con el modelo creado, incluido el hash de `contrasena`                                                                                                                                                                                                               |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                                                                                                                                                                                   |
| Respuestas de error      | `400 Bad Request` (datos inválidos o correo duplicado), `500 Internal Server Error`                                                                                                                                                                                                |

<br>

### Estructura del cuerpo de solicitud

| Campo        | Tipo   | Obligatorio | Descripción                              |
| ------------ | ------ | ----------- | ---------------------------------------- |
| `nombre`     | string | Sí          | Nombre del usuario (3–30 caracteres)     |
| `apellido`   | string | Sí          | Apellido del usuario (3–15 caracteres)   |
| `telefono`   | string | Sí          | Teléfono de contacto (sin código país)   |
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
  "telefono": "2911234567",
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
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana@example.com",
  "telefono": "5492911234567",
  "contrasena": "$2a$10$<hash>",
  "reportes": [],
  "activo": false,
  "tipo": "Cliente",
  "historial": []
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

- El controlador pasa `nombre` y `apellido` por separado al repositorio de usuarios.
- La respuesta es el modelo completo; el valor de `contrasena` ya está almacenado como hash.
- **Deuda:** no se envía el header `Location: /usuarios/{correo}`.
- Si `tipo` no es `"Cliente"` ni `"Propietario"`, el repositorio lanza `ValidationError` y `errorHandler` responde `400`.

---

<br>

## 3.3 Buscar usuario por correo — GET /usuarios/correo/:correo

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| Recurso                  | Un usuario                                                                    |
| Propósito                | Buscar un usuario por su correo electrónico                                   |
| Método HTTP              | GET                                                                           |
| Endpoint                 | `/usuarios/correo/:correo`                                                    |
| Parámetros de ruta       | `correo`: string (correo electrónico)                                         |
| Query string             | No utiliza                                                                    |
| Encabezados de solicitud | `Accept: application/json` (opcional)                                         |
| Cuerpo JSON              | No utiliza                                                                    |
| Reglas de validación     | La búsqueda normaliza el correo con `trim().toLowerCase()`                    |
| Autenticación            | `requireAuth`                                                                 |
| Respuesta exitosa        | `200 OK` con el modelo completo si se encuentra                               |
| Encabezados de respuesta | `Content-Type: application/json`                                              |
| Respuestas de error      | `401 Unauthorized` sin sesión; no hay manejo explícito de usuario inexistente |

<br>

### Estructura del cuerpo de respuesta

| Campo      | Tipo   | Descripción                   |
| ---------- | ------ | ----------------------------- |
| `nombre`   | string | Nombre del usuario            |
| `apellido` | string | Apellido del usuario          |
| `correo`   | string | Correo del usuario            |
| `tipo`     | string | `"Cliente"` o `"Propietario"` |
| `telefono` | string | Teléfono del usuario          |

La respuesta también incluye el hash `contrasena` y las propiedades del modelo (`reportes`, `activo` y `historial` o `publicaciones`).

<br>

### Ejemplo de solicitud

```http
GET /usuarios/correo/ana@example.com
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana@example.com",
  "tipo": "Cliente",
  "telefono": "5492911234567",
  "contrasena": "$2a$10$<hash>",
  "reportes": [],
  "activo": true,
  "historial": []
}
```

<br>

### Notas

- La búsqueda normaliza el correo con `trim().toLowerCase()` antes de comparar.
- El controlador envía el resultado de la búsqueda directamente y no convierte un resultado ausente en `NotFoundError`.
- La respuesta devuelve el modelo completo, incluido el hash de `contrasena`.

---

<br>

## 3.4 Iniciar sesión — POST /usuarios/login

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Sesión de usuario                                                                                                                  |
| Propósito                | Autenticar al usuario y crear una sesión                                                                                           |
| Método HTTP              | POST                                                                                                                               |
| Endpoint                 | `/usuarios/login`                                                                                                                  |
| Parámetros de ruta       | No utiliza                                                                                                                         |
| Query string             | No utiliza                                                                                                                         |
| Encabezados de solicitud | `Content-Type: application/json` o `application/x-www-form-urlencoded`                                                             |
| Cuerpo JSON              | `correo`, `contrasena`                                                                                                             |
| Reglas de validación     | El usuario debe existir; `bcrypt.compare` debe confirmar la contraseña. El correo se normaliza con `trim().toLowerCase()`          |
| Autenticación            | Pública (no requiere sesión previa)                                                                                                |
| Respuesta exitosa        | `201 Created` con el modelo completo (incluye hash). Marca `activo = true`, regenera sesión y guarda `req.session.userId = correo` |
| Encabezados de respuesta | `Set-Cookie: Alquiya.sid=...; Path=/; HttpOnly; SameSite=Lax`; `Content-Type: application/json`                                    |
| Respuestas de error      | `404 Not Found` (usuario no encontrado), `400 Bad Request` (credenciales inválidas)                                                |

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
Set-Cookie: Alquiya.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax
```

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana@example.com",
  "contrasena": "$2a$10$abcdef...",
  "tipo": "Cliente",
  "telefono": "5492911234567",
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

- La respuesta es `201 Created` y devuelve el modelo completo, incluido el hash de `contrasena`; `toPublic` no se aplica.
- El servicio lanza `ValidationError` para credenciales inválidas (traducido a `400`).
- El servicio lanza `NotFoundError` si el usuario no existe (traducido a `404`).
- El servicio llama a `regenerate(req)` antes de asignar `req.session.userId`, previniendo fijación de sesión.

---

<br>

## 3.5 Cerrar sesión — POST /usuarios/logout

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                          |
| ------------------------ | ----------------------------------------------------- |
| Recurso                  | Sesión de usuario                                     |
| Propósito                | Destruir la sesión actual                             |
| Método HTTP              | POST                                                  |
| Endpoint                 | `/usuarios/logout`                                    |
| Parámetros de ruta       | No utiliza                                            |
| Query string             | No utiliza                                            |
| Encabezados de solicitud | Cookie `Alquiya.sid`                                  |
| Cuerpo JSON              | No utiliza                                            |
| Reglas de validación     | Debe existir una sesión activa (`req.session.userId`) |
| Autenticación            | `requireAuth`                                         |
| Respuesta exitosa        | `204 No Content` sin cuerpo                           |
| Encabezados de respuesta | —                                                     |
| Respuestas de error      | `401 Unauthorized` si no hay sesión                   |

<br>

### Ejemplo de solicitud

```http
POST /usuarios/logout
Cookie: Alquiya.sid=s%3A...
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

## 3.6 Consultar estado de sesión — GET /usuarios/me

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| Recurso                  | Estado de autenticación y perfil actual                                       |
| Propósito                | Informar si la petición pertenece a un usuario autenticado                    |
| Método HTTP              | GET                                                                           |
| Endpoint                 | `/usuarios/me`                                                                |
| Parámetros de ruta       | No utiliza                                                                    |
| Query string             | No utiliza                                                                    |
| Encabezados de solicitud | Cookie `Alquiya.sid` (opcional)                                               |
| Cuerpo JSON              | No utiliza                                                                    |
| Reglas de validación     | No requiere sesión                                                            |
| Autenticación            | Pública                                                                       |
| Respuesta exitosa        | `200 OK` con `{ autenticado, usuario }`; `usuario` es `null` si no hay sesión |
| Encabezados de respuesta | `Content-Type: application/json`                                              |
| Respuestas de error      | `500 Internal Server Error` ante un error inesperado                          |

<br>

### Estructura del cuerpo de respuesta

| Campo         | Tipo            | Descripción                                                       |
| ------------- | --------------- | ----------------------------------------------------------------- |
| `autenticado` | boolean         | Indica si se encontró un usuario asociado a la sesión             |
| `usuario`     | object o `null` | Proyección `toPublic` cuando hay sesión; `null` en caso contrario |

El objeto `usuario` contiene `nombre`, `apellido`, `correo`, `tipo` y `telefono`.

<br>

### Ejemplo de solicitud

```http
GET /usuarios/me
Cookie: Alquiya.sid=s%3A...
```

La cookie puede omitirse. Sin una sesión reconocida, la respuesta exitosa informa `autenticado: false`.

<br>

### Ejemplo de respuesta exitosa

```json
{
  "autenticado": true,
  "usuario": {
    "nombre": "Ana",
    "apellido": "Pérez",
    "correo": "ana@example.com",
    "tipo": "Cliente",
    "telefono": "5492911234567"
  }
}
```

<br>

### Ejemplo de respuesta sin sesión

```json
{
  "autenticado": false,
  "usuario": null
}
```

<br>

### Notas

- Está montado en `src/routes/usuariosRoutes.js` y no usa `requireAuth`.
- El cliente usa esta respuesta para obtener el perfil y decidir la vista según `tipo`.

---

<br>
<br>

# 4. Sección Publicaciones

<br>

**Descripción.** Módulo de publicaciones de propiedades y habitaciones, con persistencia en `src/repositories/Publicaciones.json`. También incluye los sub-recursos de reportes y valoraciones.

<br>

## 4.1 Resumen de endpoints

| Operación             | Método y ruta                               | Autenticación                                                  | Entrada                                                               | Cuerpo de respuesta                                       | Códigos                                         |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| Listar publicaciones  | `GET /api/publicaciones`                    | Pública                                                        | —                                                                     | Arreglo (+ `nombreAutor`)                                 | `200`, `500`                                    |
| Crear publicación     | `POST /api/publicaciones`                   | `requireAuth` + `rol('Propietario')`                           | `titulo`, `descripcion`, `direccion`, `precio`, `imagen`              | Publicación creada (+ `nombreAutor`)                      | `201`, `400`, `401`, `403`, `503`, `500`        |
| Validar dirección     | `POST /api/publicaciones/validar-direccion` | Pública                                                        | `direccion` en body o query                                           | `{ valido, direccion, ubicacion }`                        | `200`, `400`, `503`, `500`                      |
| Consultar publicación | `GET /api/publicaciones/:id`                | Pública                                                        | Path: `id`                                                            | Publicación (+ `nombreAutor`, sin `reportes`)             | `200`, `404`, `500`                             |
| Editar publicación    | `PATCH /api/publicaciones/:id`              | `requireAuth` + `rol('Propietario')` + verificación de autoría | Path: `id`; JSON parcial: `titulo`, `descripcion`, `imagen`, `precio` | Publicación actualizada (+ `nombreAutor`, sin `reportes`) | `200`, `400`, `401`, `403`, `404`, `500`        |
| Eliminar publicación  | `DELETE /api/publicaciones/:id`             | `requireAuth` + `rol('Propietario')` + verificación de autoría | Path: `id`                                                            | Sin cuerpo (`204`); borrado lógico                        | `204`, `401`, `403`, `404`, `500`               |
| Listar reportes       | `GET /api/publicaciones/:id/reportes`       | `requireAuth` + `rol('Propietario')`                           | Path: `id`                                                            | Arreglo de reportes                                       | `200`, `401`, `403`, `404`, `500`               |
| Crear reporte         | `POST /api/publicaciones/:id/reportes`      | `requireAuth` + `rol('Cliente')`                               | `motivo`, `descripcion`                                               | `{ mensaje }`                                             | `201`, `400`, `401`, `403`, `404`, `409`, `500` |
| Listar valoraciones   | `GET /api/publicaciones/:id/valoraciones`   | `requireAuth` + `rol('Propietario')`                           | Path: `id`                                                            | Arreglo de valoraciones                                   | `200`, `401`, `403`, `404`, `500`               |
| Crear valoración      | `POST /api/publicaciones/:id/valoraciones`  | `requireAuth` + `rol('Cliente')`                               | `puntuacion`, `comentario`                                            | `{ mensaje, calificacion, cantidadValoraciones }`         | `201`, `400`, `401`, `403`, `404`, `409`, `500` |

---

<br>

## 4.2 Listar publicaciones — GET /api/publicaciones

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                  |
| ------------------------ | ------------------------------------------------------------- |
| Recurso                  | Colección de publicaciones                                    |
| Propósito                | Listar todas las publicaciones desde el archivo JSON          |
| Método HTTP              | GET                                                           |
| Endpoint                 | `/api/publicaciones`                                          |
| Parámetros de ruta       | No utiliza                                                    |
| Query string             | No utiliza; los filtros se aplican en el frontend             |
| Encabezados de solicitud | `Accept: application/json` (opcional)                         |
| Cuerpo JSON              | No utiliza                                                    |
| Reglas de validación     | Ninguna                                                       |
| Autenticación            | Pública                                                       |
| Respuesta exitosa        | `200 OK` con arreglo de publicaciones (incluye `nombreAutor`) |
| Encabezados de respuesta | `Content-Type: application/json`                              |
| Respuestas de error      | `500 Internal Server Error` (error de lectura del archivo)    |

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
| `alt`                  | string  | Texto alternativo de la imagen                  |
| `tipo`                 | string  | Tipo asociado a la publicación                  |
| `disponibilidad`       | string  | `"disponible"` u otro estado                    |
| `estado`               | string  | Estado interno de la publicación                |
| `activa`               | boolean | Si está activa                                  |
| `fechaCreacion`        | string  | Fecha de creación (ISO)                         |
| `nombreAutor`          | string  | Nombre del autor (calculado)                    |
| `valoraciones`         | array   | Valoraciones asociadas, cuando existen          |

<br>

### Ejemplo de solicitud

```http
GET /api/publicaciones
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "id": 42,
    "titulo": "Departamento céntrico",
    "descripcion": "2 ambientes, luminoso",
    "direccion": "Av. Siempre Viva 123",
    "precio": 50000,
    "autor": "ana@example.com",
    "imagen": "/img/depto.jpg",
    "alt": "Publicación de alquiler",
    "tipo": "",
    "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
    "calificacion": 0,
    "cantidadValoraciones": 0,
    "detalle": "Departamento céntrico",
    "disponibilidad": "disponible",
    "estado": "pendiente",
    "activa": true,
    "fechaCreacion": "2026-11-12T10:00:00.000Z",
    "nombreAutor": "Ana",
    "valoraciones": []
  }
]
```

<br>

### Notas

- El frontend ya permite filtrar y ordenar el arreglo recibido. En `public/js/filtrosPublicaciones.js` se implementan límite de precio máximo, menor/mayor precio, mayor calificación y cantidad de valoraciones.
- El controlador agrega `nombreAutor` y elimina `reportes` de cada objeto antes de responder.
- Las propiedades persistidas que no se filtran, incluidas `valoraciones` y su campo `emisor`, forman parte de la respuesta actual.
- El frontend aplica los filtros de precio y calificación; el endpoint no implementa filtros ni paginación por query params.

---

<br>

## 4.3 Crear publicación — POST /api/publicaciones

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Colección de publicaciones                                                                                                                                                            |
| Propósito                | Crear una nueva publicación                                                                                                                                                           |
| Método HTTP              | POST                                                                                                                                                                                  |
| Endpoint                 | `/api/publicaciones`                                                                                                                                                                  |
| Parámetros de ruta       | No utiliza                                                                                                                                                                            |
| Query string             | No utiliza                                                                                                                                                                            |
| Encabezados de solicitud | `Content-Type: application/json` o `application/x-www-form-urlencoded`                                                                                                                |
| Cuerpo JSON              | `titulo`, `descripcion`, `direccion`, `precio`, `imagen`                                                                                                                              |
| Reglas de validación     | `titulo`, `imagen`, `descripcion` y `direccion` obligatorios (strings no vacíos); `precio` numérico positivo                                                                          |
| Autenticación            | `requireAuth` + `rol('Propietario')`                                                                                                                                                  |
| Respuesta exitosa        | `201 Created` con la publicación creada (incluye `nombreAutor`)                                                                                                                       |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                                                                                      |
| Respuestas de error      | `400 Bad Request` (datos inválidos o dirección no encontrada), `401 Unauthorized`, `403 Forbidden`, `503 Service Unavailable` (fallo de geocodificación), `500 Internal Server Error` |

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
Cookie: Alquiya.sid=s%3A...
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
  "autor": "ana@example.com",
  "imagen": "/img/depto.jpg",
  "alt": "Publicación de alquiler",
  "tipo": "",
  "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
  "calificacion": 0,
  "cantidadValoraciones": 0,
  "detalle": "Departamento céntrico",
  "valoraciones": [],
  "disponibilidad": "disponible",
  "estado": "pendiente",
  "activa": true,
  "fechaCreacion": "2026-11-12T10:00:00.000Z",
  "nombreAutor": "Ana"
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
{
  "error": "No se pudo verificar la dirección en este momento. Intentá nuevamente."
}
```

<br>

### Notas

- La ruta requiere una sesión de un usuario `Propietario`; `autor` toma el correo de `req.user`.
- El controlador habla directamente con el sistema de archivos (`readFile`/`writeFile`), salteando la capa de servicio. La validación de dirección sí se delega a `publicacionesService.js`.

---

<br>

## 4.4 Validar dirección — POST /api/publicaciones/validar-direccion

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Validación de dirección                                                                                                                                     |
| Propósito                | Geocodificar una dirección contra Nominatim (OpenStreetMap)                                                                                                 |
| Método HTTP              | POST                                                                                                                                                        |
| Endpoint                 | `/api/publicaciones/validar-direccion`                                                                                                                      |
| Parámetros de ruta       | No utiliza                                                                                                                                                  |
| Query string             | `direccion` (alternativo)                                                                                                                                   |
| Encabezados de solicitud | `Content-Type: application/json`                                                                                                                            |
| Cuerpo JSON              | `direccion`                                                                                                                                                 |
| Reglas de validación     | `direccion` obligatoria (string no vacío)                                                                                                                   |
| Autenticación            | Pública                                                                                                                                                     |
| Respuesta exitosa        | `200 OK` con `{ valido: true, direccion, ubicacion }`                                                                                                       |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                                                            |
| Respuestas de error      | `400 Bad Request` (dirección obligatoria/no encontrada), `503 Service Unavailable` (fallo de búsqueda), `500 Internal Server Error` (otro error inesperado) |

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
  "ubicacion": {
    "direccionCompleta": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
    "lat": -38.7177,
    "lon": -62.2681,
    "direccion": {
      "city": "Bahía Blanca",
      "state": "Buenos Aires",
      "country": "Argentina"
    }
  }
}
```

<br>

### Notas

- Internamente usa `validarDireccionPublicacion` de `publicacionesService.js`, que a su vez llama a `buscarUbicacionPorTexto` de `ubicacionService.js`.
- Si la dirección no contiene "Bahía Blanca", se le agrega automáticamente para acotar la búsqueda.
- El controlador acepta `direccion` en `req.body` o en `req.query`.

---

<br>

## 4.5 Consultar publicación — GET /api/publicaciones/:id

<br>

### Tabla de estado actual

| Campo               | Valor actual                                                  |
| ------------------- | ------------------------------------------------------------- |
| Recurso             | Una publicación                                               |
| Propósito           | Obtener el detalle de una publicación por su identificador    |
| Método HTTP         | GET                                                           |
| Endpoint            | `/api/publicaciones/:id`                                      |
| Parámetros de ruta  | `id`: entero autoincremental                                  |
| Query string        | No utiliza                                                    |
| Autenticación       | Pública                                                       |
| Respuesta exitosa   | `200 OK` con la publicación (+ `nombreAutor`, sin `reportes`) |
| Respuestas de error | `404 Not Found` (no existe), `500 Internal Server Error`      |

<br>

El endpoint es público y devuelve la publicación persistida cuyo `id` coincide con el parámetro. La respuesta aplica la misma proyección que el listado: omite `reportes` y añade `nombreAutor` (o `null` si no se encuentra el autor en el repositorio de usuarios). Si el id no existe, responde `404 Not Found`. Un registro con `activa: false` también se devuelve mientras exista en el archivo.

<br>

### Ejemplo de solicitud

```http
GET /api/publicaciones/42
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "id": 42,
  "titulo": "Departamento céntrico",
  "descripcion": "2 ambientes, luminoso",
  "direccion": "Av. Siempre Viva 123",
  "precio": 50000,
  "autor": "ana@example.com",
  "imagen": "/img/depto.jpg",
  "alt": "Publicación de alquiler",
  "tipo": "",
  "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
  "calificacion": 4.5,
  "cantidadValoraciones": 2,
  "detalle": "Departamento céntrico",
  "disponibilidad": "disponible",
  "estado": "pendiente",
  "activa": true,
  "fechaCreacion": "2026-11-12T10:00:00.000Z",
  "nombreAutor": "Ana",
  "valoraciones": [
    {
      "puntuacion": 5,
      "comentario": "Todo correcto.",
      "emisor": "cliente@example.com"
    }
  ]
}
```

<br>

### Ejemplo de error (id inexistente)

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
| Encabezados de solicitud | `Content-Type: application/json`; Cookie `Alquiya.sid`                                               |
| Cuerpo JSON              | Objeto no vacío con uno o más de estos campos: `titulo`, `descripcion`, `imagen`, `precio`           |
| Autenticación            | `requireAuth` + `rol('Propietario')` + verificación de autoría                                       |
| Respuesta exitosa        | `200 OK` con la publicación actualizada (+ `nombreAutor`, sin `reportes`)                            |
| Respuestas de error      | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error` |

<br>

Solo el propietario autenticado que figure como autor puede actualizar la publicación. La comparación de correos ignora espacios al principio/final y diferencias entre mayúsculas y minúsculas. Los campos omitidos conservan sus valores actuales; `direccion`, `disponibilidad` y cualquier otro campo no listado no se pueden modificar.

| Campo         | Tipo   | Obligatorio en cada PATCH | Regla si se incluye                     |
| ------------- | ------ | ------------------------- | --------------------------------------- |
| `titulo`      | string | No                        | No vacío; se eliminan espacios externos |
| `descripcion` | string | No                        | No vacío; se eliminan espacios externos |
| `imagen`      | string | No                        | No vacío; se eliminan espacios externos |
| `precio`      | number | No                        | Número finito y mayor que cero          |

El cuerpo debe ser un objeto JSON no vacío e incluir al menos uno de estos campos. `precio` debe enviarse como número JSON, no como texto numérico. Un cuerpo vacío, un valor inválido o cualquier propiedad no permitida —incluidos `direccion` y `disponibilidad`— responde `400 Bad Request`. PATCH no consulta Nominatim ni modifica la dirección.

| Código                      | Cuándo ocurre                                                | Respuesta                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | Cuerpo vacío/no objeto, campo no permitido o valor inválido. | `{ "status": "error", "message": "<detalle de validación>" }`                                                                                                                                  |
| `401 Unauthorized`          | No hay una sesión autenticada.                               | `{ "status": "error", "message": "No estás autenticado" }`                                                                                                                                     |
| `403 Forbidden`             | El usuario no tiene rol Propietario o no es el autor.        | `{ "status": "error", "message": "<motivo>" }`; rol incorrecto: `"Usuario autenticado sin permisos para la operacion"`; autor distinto: `"No tenés permisos para modificar esta publicación"`. |
| `404 Not Found`             | No existe una publicación con ese id.                        | `{ "status": "error", "message": "Publicación no encontrada" }`                                                                                                                                |
| `500 Internal Server Error` | Error inesperado al leer, interpretar o persistir los datos. | `{ "status": "error", "message": "Error interno del servidor" }`                                                                                                                               |

<br>

### Ejemplo de solicitud

```http
PATCH /api/publicaciones/42
Content-Type: application/json
Cookie: Alquiya.sid=s%3A...
```

```json
{
  "precio": 55000,
  "descripcion": "2 ambientes, luminoso y renovado"
}
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "id": 42,
  "titulo": "Departamento céntrico",
  "descripcion": "2 ambientes, luminoso y renovado",
  "direccion": "Av. Siempre Viva 123",
  "precio": 55000,
  "autor": "ana@example.com",
  "imagen": "/img/depto.jpg",
  "alt": "Publicación de alquiler",
  "tipo": "",
  "ubicacion": "Av. Siempre Viva 123, Bahía Blanca, Buenos Aires, Argentina",
  "calificacion": 4.5,
  "cantidadValoraciones": 2,
  "detalle": "Departamento céntrico",
  "disponibilidad": "disponible",
  "estado": "pendiente",
  "activa": true,
  "fechaCreacion": "2026-11-12T10:00:00.000Z",
  "nombreAutor": "Ana",
  "valoraciones": [
    {
      "puntuacion": 5,
      "comentario": "Todo correcto.",
      "emisor": "cliente@example.com"
    }
  ]
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
| Propósito                | Desactivar lógicamente una publicación existente                                  |
| Método HTTP              | DELETE                                                                            |
| Endpoint                 | `/api/publicaciones/:id`                                                          |
| Parámetros de ruta       | `id`: entero autoincremental                                                      |
| Encabezados de solicitud | Cookie `Alquiya.sid`                                                              |
| Autenticación            | `requireAuth` + `rol('Propietario')` + verificación de autoría                    |
| Respuesta exitosa        | `204 No Content` sin cuerpo                                                       |
| Respuestas de error      | `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error` |

<br>

Solo el propietario autenticado que figure como autor puede eliminar la publicación. La comparación de correos ignora espacios al principio/final y diferencias entre mayúsculas y minúsculas. La eliminación es lógica: conserva el registro y sus datos asociados, cambiando únicamente `activa` a `false`. Si la publicación ya está desactivada, repetir la solicitud responde igualmente `204 No Content` sin modificarla. El listado existente no filtra las publicaciones inactivas y `GET /api/publicaciones/:id` sigue devolviéndolas mientras el registro exista.

Los errores `401`, `403`, `404` y `500` usan el formato `{ "status": "error", "message": "..." }` del `errorHandler`; los mensajes identifican la falta de autenticación, permisos, publicación o un error interno, respectivamente.

<br>

### Ejemplo de solicitud

```http
DELETE /api/publicaciones/42
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

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

# 4.8 Sección Ubicación

<br>

**Descripción.** Módulo de geocodificación usado para convertir texto de una dirección en coordenadas y datos estructurados mediante Nominatim (OpenStreetMap).

<br>

## 4.8.1 Consultar ubicación — GET /api/ubicacion

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Ubicación geocodificada                                                                                          |
| Propósito                | Buscar una dirección mediante el proveedor Nominatim                                                             |
| Método HTTP              | GET                                                                                                              |
| Endpoint                 | `/api/ubicacion`                                                                                                 |
| Parámetros de ruta       | No utiliza                                                                                                       |
| Query string             | `q`: texto de la dirección                                                                                       |
| Encabezados de solicitud | `Accept: application/json` (opcional)                                                                            |
| Cuerpo JSON              | No utiliza                                                                                                       |
| Reglas de validación     | `q` es obligatorio y debe contener texto                                                                         |
| Autenticación            | Pública                                                                                                          |
| Respuesta exitosa        | `200 OK` con el objeto `Direccion`                                                                               |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                 |
| Respuestas de error      | `400 Bad Request` si falta `q`; `500 Internal Server Error` si no se encuentra la dirección o falla el proveedor |

<br>

### Estructura del cuerpo de respuesta

| Campo               | Tipo   | Descripción                               |
| ------------------- | ------ | ----------------------------------------- |
| `direccionCompleta` | string | Nombre completo devuelto por Nominatim    |
| `lat`               | number | Latitud                                   |
| `lon`               | number | Longitud                                  |
| `direccion`         | object | Componentes estructurados de la dirección |

<br>

### Ejemplo de solicitud

```http
GET /api/ubicacion?q=Avenida%20Colon%20123
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "direccionCompleta": "Avenida Colón 123, Bahía Blanca, Buenos Aires, Argentina",
  "lat": -38.7177,
  "lon": -62.2681,
  "direccion": {
    "city": "Bahía Blanca",
    "state": "Buenos Aires",
    "country": "Argentina"
  }
}
```

<br>

### Ejemplo de error

```json
{ "error": "Debe enviar un texto de búsqueda en q." }
```

<br>

### Notas

- El controlador delega la llamada a `buscarUbicacionPorTexto` en `src/service/ubicacionService.js`.
- Nominatim se consulta con `format=jsonv2`, `limit=1` y `addressdetails=1`.
- El controlador responde `400` si falta `q`. La respuesta del servicio para una dirección inexistente no coincide con la condición de error del controlador y actualmente termina como `500`; los fallos de red también terminan como `500`.

---

<br>
<br>

# 5. Sección Alquileres

<br>

**Descripción.** Módulo de alquileres de publicaciones. Sus endpoints están implementados y protegidos por `requireAuth`; la lógica de negocio reside en el controlador y la persistencia es en memoria, dentro de cada objeto `Usuario` (propiedad `historial`).

<br>

## 5.1 Resumen de endpoints

| Operación                         | Método y ruta                        | Autenticación                                                  | Entrada                                    | Cuerpo de respuesta   |
| --------------------------------- | ------------------------------------ | -------------------------------------------------------------- | ------------------------------------------ | --------------------- |
| Listar alquileres del cliente     | `GET /api/alquileres`                | `requireAuth`; rol `Cliente` comprobado por el controlador     | —                                          | Arreglo de alquileres |
| Crear alquiler                    | `POST /api/alquileres`               | `requireAuth`; rol `Cliente` comprobado por el controlador     | `publicacionId`, `fechaInicio`, `fechaFin` | Alquiler creado       |
| Cancelar alquiler                 | `PATCH /api/alquileres/:id/cancelar` | `requireAuth`; rol `Cliente` comprobado por el controlador     | Path: `id`                                 | Alquiler actualizado  |
| Listar alquileres del propietario | `GET /api/alquileres/propietario`    | `requireAuth`; rol `Propietario` comprobado por el controlador | —                                          | Arreglo de alquileres |
| Actualizar estado                 | `PATCH /api/alquileres/:id/estado`   | `requireAuth`; rol `Propietario` comprobado por el controlador | Path: `id`; body: `{ estado }`             | Alquiler actualizado  |

<br>

### 5.2 Listar alquileres del cliente — GET /api/alquileres

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                          |
| ------------------------ | --------------------------------------------------------------------- |
| Recurso                  | Colección de alquileres del cliente autenticado                       |
| Propósito                | Listar el historial de alquileres del cliente                         |
| Método HTTP              | GET                                                                   |
| Endpoint                 | `/api/alquileres`                                                     |
| Parámetros de ruta       | No utiliza                                                            |
| Query string             | No utiliza                                                            |
| Encabezados de solicitud | Cookie `Alquiya.sid`                                                  |
| Cuerpo JSON              | No utiliza                                                            |
| Reglas de validación     | El usuario debe ser de tipo `Cliente` (`req.user.tipo === 'Cliente'`) |
| Autenticación            | `requireAuth`                                                         |
| Respuesta exitosa        | `200 OK` con arreglo de alquileres                                    |
| Encabezados de respuesta | `Content-Type: application/json`                                      |
| Respuestas de error      | `403 Forbidden` (no es Cliente), `401 Unauthorized` (sin sesión)      |

<br>

### Estructura del cuerpo de respuesta

| Campo            | Tipo   | Descripción                                              |
| ---------------- | ------ | -------------------------------------------------------- |
| `id`             | string | UUID del alquiler                                        |
| `producto`       | object | Objeto de la publicación alquilada                       |
| `fechaInicio`    | string | Fecha de inicio (YYYY-MM-DD)                             |
| `fechaFin`       | string | Fecha de fin (YYYY-MM-DD)                                |
| `estado`         | string | `"pendiente"`, `"activo"`, `"cancelado"`, `"finalizado"` |
| `fechaSolicitud` | string | Fecha de solicitud (ISO)                                 |

<br>

### Ejemplo de solicitud

```http
GET /api/alquileres
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "producto": {
      "id": 42,
      "titulo": "Departamento céntrico",
      "precio": 50000
    },
    "fechaInicio": "2026-12-01",
    "fechaFin": "2026-12-31",
    "estado": "pendiente",
    "fechaSolicitud": "2026-11-16T10:00:00.000Z"
  }
]
```

<br>

### Ejemplo de error (no es Cliente)

```json
{ "error": "Solo los clientes pueden consultar alquileres." }
```

<br>

### Notas

- El controlador lee `req.user` y accede a su propiedad `historial` (arreglo de alquileres) directamente.
- No hay capa de servicio: la lógica de filtrado y finalización de alquileres vencidos está en el controlador.

---

<br>

### 5.3 Crear alquiler — POST /api/alquileres

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Colección de alquileres                                                                                                                                                                                                                                 |
| Propósito                | Crear una solicitud de alquiler                                                                                                                                                                                                                         |
| Método HTTP              | POST                                                                                                                                                                                                                                                    |
| Endpoint                 | `/api/alquileres`                                                                                                                                                                                                                                       |
| Parámetros de ruta       | No utiliza                                                                                                                                                                                                                                              |
| Query string             | No utiliza                                                                                                                                                                                                                                              |
| Encabezados de solicitud | `Content-Type: application/json`; Cookie `Alquiya.sid`                                                                                                                                                                                                  |
| Cuerpo JSON              | `publicacionId`, `fechaInicio`, `fechaFin`                                                                                                                                                                                                              |
| Reglas de validación     | El usuario debe ser `Cliente`; `publicacionId` obligatorio; `fechaInicio` y `fechaFin` válidas (inicio hoy o futuro, fin posterior a inicio); la publicación debe existir y estar disponible; el cliente no debe tener otro alquiler activo o pendiente |
| Autenticación            | `requireAuth`                                                                                                                                                                                                                                           |
| Respuesta exitosa        | `201 Created` con el alquiler creado                                                                                                                                                                                                                    |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                                                                                                                                                        |
| Respuestas de error      | `400 Bad Request`, `403 Forbidden` (no es Cliente), `404 Not Found` (publicación), `409 Conflict` (no disponible o alquiler activo), `500 Internal Server Error`                                                                                        |

<br>

### Estructura del cuerpo de solicitud

| Campo           | Tipo   | Obligatorio | Descripción                     |
| --------------- | ------ | ----------- | ------------------------------- |
| `publicacionId` | number | Sí          | ID de la publicación a alquilar |
| `fechaInicio`   | string | Sí          | Fecha de inicio (YYYY-MM-DD)    |
| `fechaFin`      | string | Sí          | Fecha de fin (YYYY-MM-DD)       |

<br>

### Ejemplo de solicitud

```http
POST /api/alquileres
Content-Type: application/json
Cookie: Alquiya.sid=s%3A...
```

```json
{
  "publicacionId": 42,
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-31"
}
```

<br>

### Ejemplo de respuesta exitosa

```http
201 Created
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "producto": { "id": 42, "titulo": "Departamento céntrico", "precio": 50000 },
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-31",
  "estado": "pendiente",
  "fechaSolicitud": "2026-11-16T10:00:00.000Z"
}
```

<br>

### Ejemplo de error (publicación no disponible)

```json
{ "error": "La publicación no está disponible para alquilar." }
```

<br>

### Notas

- El controlador lee el archivo `Publicaciones.json` directamente para verificar la publicación.
- La creación del alquiler se persiste en `req.user.historial` (en memoria).
- La lógica de negocio y el acceso al estado de los alquileres están actualmente en el controlador.

---

<br>

### 5.4 Cancelar alquiler — PATCH /api/alquileres/:id/cancelar

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Recurso                  | Un alquiler                                                                                                  |
| Propósito                | Cancelar un alquiler existente                                                                               |
| Método HTTP              | PATCH                                                                                                        |
| Endpoint                 | `/api/alquileres/:id/cancelar`                                                                               |
| Parámetros de ruta       | `id`: UUID del alquiler                                                                                      |
| Query string             | No utiliza                                                                                                   |
| Encabezados de solicitud | Cookie `Alquiya.sid`                                                                                         |
| Cuerpo JSON              | No utiliza                                                                                                   |
| Reglas de validación     | El alquiler debe existir; el usuario debe ser el cliente; el estado debe permitir cancelación                |
| Autenticación            | `requireAuth`                                                                                                |
| Respuesta exitosa        | `200 OK` con el alquiler actualizado (estado `"cancelado"`)                                                  |
| Encabezados de respuesta | `Content-Type: application/json`                                                                             |
| Respuestas de error      | `401 Unauthorized`, `403 Forbidden` (rol incorrecto), `404 Not Found`, `409 Conflict` (estado no cancelable) |

<br>

### Ejemplo de solicitud

```http
PATCH /api/alquileres/550e8400-e29b-41d4-a716-446655440000/cancelar
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "estado": "cancelado",
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-31"
}
```

<br>

### Notas

- El controlador busca el alquiler en el historial del cliente autenticado.

---

<br>

### 5.5 Listar alquileres del propietario — GET /api/alquileres/propietario

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| Recurso                  | Colección de alquileres de las publicaciones del propietario                  |
| Propósito                | Listar las solicitudes de alquiler recibidas por el propietario               |
| Método HTTP              | GET                                                                           |
| Endpoint                 | `/api/alquileres/propietario`                                                 |
| Parámetros de ruta       | No utiliza                                                                    |
| Query string             | No utiliza                                                                    |
| Encabezados de solicitud | Cookie `Alquiya.sid`                                                          |
| Cuerpo JSON              | No utiliza                                                                    |
| Reglas de validación     | El usuario debe ser de tipo `Propietario` (`req.user.tipo === 'Propietario'`) |
| Autenticación            | `requireAuth`                                                                 |
| Respuesta exitosa        | `200 OK` con arreglo de alquileres                                            |
| Encabezados de respuesta | `Content-Type: application/json`                                              |
| Respuestas de error      | `403 Forbidden` (no es Propietario), `401 Unauthorized`                       |

<br>

### Ejemplo de solicitud

```http
GET /api/alquileres/propietario
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "producto": { "id": 42, "titulo": "Departamento céntrico" },
    "solicitante": "Cliente",
    "fechaInicio": "2026-12-01",
    "fechaFin": "2026-12-31",
    "estado": "pendiente"
  }
]
```

<br>

### Notas

- El controlador filtra los alquileres de todos los clientes cuyas publicaciones pertenecen al propietario autenticado.

---

<br>

### 5.6 Actualizar estado de alquiler — PATCH /api/alquileres/:id/estado

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Un alquiler                                                                                                               |
| Propósito                | Aceptar o rechazar una solicitud de alquiler                                                                              |
| Método HTTP              | PATCH                                                                                                                     |
| Endpoint                 | `/api/alquileres/:id/estado`                                                                                              |
| Parámetros de ruta       | `id`: UUID del alquiler                                                                                                   |
| Query string             | No utiliza                                                                                                                |
| Encabezados de solicitud | `Content-Type: application/json`; Cookie `Alquiya.sid`                                                                    |
| Cuerpo JSON              | `{ "estado": "activo" }` (o `"rechazado"`)                                                                                |
| Reglas de validación     | El rol debe ser `Propietario`; el estado debe ser `activo` o `rechazado`; la solicitud debe existir y continuar pendiente |
| Autenticación            | `requireAuth`                                                                                                             |
| Respuesta exitosa        | `200 OK` con el alquiler actualizado                                                                                      |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                          |
| Respuestas de error      | `400 Bad Request` (estado inválido), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`                 |

<br>

### Ejemplo de solicitud

```http
PATCH /api/alquileres/550e8400-e29b-41d4-a716-446655440000/estado
Content-Type: application/json
Cookie: Alquiya.sid=s%3A...
```

```json
{ "estado": "activo" }
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "estado": "activo",
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-31"
}
```

<br>

### Notas

- El controlador valida el rol del propietario y busca el alquiler en los historiales de los clientes.
- El controlador valida el rol, el estado permitido y que la solicitud siga pendiente.
- Los errores responden directamente con `{ "error": "..." }`, salvo errores inesperados que pueden propagarse desde Express.

---

<br>
<br>

# 6. Sección Reportes y valoraciones

<br>

**Descripción.** Los clientes autenticados pueden reportar y valorar publicaciones. El propietario autenticado puede consultar los reportes y las valoraciones de sus propias publicaciones.

<br>

## 6.1 Resumen de endpoints

| Operación           | Método y ruta                              | Autenticación y autorización                   | Entrada                                | Cuerpo de respuesta                               |
| ------------------- | ------------------------------------------ | ---------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Crear reporte       | `POST /api/publicaciones/:id/reportes`     | `requireAuth` + `rol('Cliente')`               | Path: `id`; `motivo`, `descripcion`    | `{ mensaje }`                                     |
| Listar reportes     | `GET /api/publicaciones/:id/reportes`      | `requireAuth` + `rol('Propietario')` + autoría | Path: `id`                             | Arreglo de reportes                               |
| Crear valoración    | `POST /api/publicaciones/:id/valoraciones` | `requireAuth` + `rol('Cliente')`               | Path: `id`; `puntuacion`, `comentario` | `{ mensaje, calificacion, cantidadValoraciones }` |
| Listar valoraciones | `GET /api/publicaciones/:id/valoraciones`  | `requireAuth` + `rol('Propietario')` + autoría | Path: `id`                             | Arreglo de valoraciones                           |

<br>

## 6.2 Crear reporte — POST /api/publicaciones/:id/reportes

<br>

### Tabla de estado actual

| Campo                        | Valor actual                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                      | Reporte asociado a una publicación                                                                                                        |
| Propósito                    | Registrar un reporte enviado por un cliente                                                                                               |
| Método HTTP                  | POST                                                                                                                                      |
| Endpoint                     | `/api/publicaciones/:id/reportes`                                                                                                         |
| Parámetros de ruta           | `id`: identificador de publicación                                                                                                        |
| Query string                 | No utiliza                                                                                                                                |
| Encabezados de solicitud     | `Content-Type: application/json`; Cookie `Alquiya.sid`                                                                                    |
| Cuerpo JSON                  | `motivo`, `descripcion` opcional                                                                                                          |
| Reglas de validación         | `motivo` debe ser texto no vacío; `descripcion`, si se envía, debe ser texto; el cliente no puede reportar dos veces la misma publicación |
| Autenticación y autorización | `requireAuth` + `rol('Cliente')`                                                                                                          |
| Respuesta exitosa            | `201 Created` con `{ "mensaje": "Reporte creado." }`                                                                                      |
| Encabezados de respuesta     | `Content-Type: application/json`                                                                                                          |
| Respuestas de error          | `400`, `401`, `403`, `404`, `409`, `500`                                                                                                  |

<br>

### Estructura del cuerpo de solicitud

| Campo         | Tipo   | Obligatorio | Descripción                                       |
| ------------- | ------ | ----------- | ------------------------------------------------- |
| `motivo`      | string | Sí          | Motivo del reporte                                |
| `descripcion` | string | No          | Descripción adicional; por defecto es texto vacío |

<br>

### Ejemplo de solicitud

```http
POST /api/publicaciones/42/reportes
Content-Type: application/json
Cookie: Alquiya.sid=s%3A...
```

```json
{
  "motivo": "La información no coincide",
  "descripcion": "El anuncio muestra datos diferentes."
}
```

<br>

### Ejemplo de respuesta exitosa

```http
201 Created
```

```json
{ "mensaje": "Reporte creado." }
```

<br>

### Ejemplo de error (reporte duplicado)

```json
{ "status": "error", "message": "Ya reportaste esta publicación." }
```

<br>

### Notas

- Si la publicación no existe, el controlador responde `404` con `{ "error": "No se encontró la publicación." }`.
- Si la publicación no tiene un autor registrado, responde `400`.
- La instancia del modelo `Reporte` incluye `id`, `motivo`, `descripcion`, `reportante`, `fecha` y `estado`. El endpoint de listado no expone el correo de quien reportó.

---

<br>

## 6.3 Listar reportes — GET /api/publicaciones/:id/reportes

<br>

### Tabla de estado actual

| Campo                        | Valor actual                                                               |
| ---------------------------- | -------------------------------------------------------------------------- |
| Recurso                      | Colección de reportes de una publicación                                   |
| Propósito                    | Permitir que el propietario consulte reportes recibidos por su publicación |
| Método HTTP                  | GET                                                                        |
| Endpoint                     | `/api/publicaciones/:id/reportes`                                          |
| Parámetros de ruta           | `id`: identificador de publicación                                         |
| Query string                 | No utiliza                                                                 |
| Encabezados de solicitud     | Cookie `Alquiya.sid`                                                       |
| Cuerpo JSON                  | No utiliza                                                                 |
| Reglas de validación         | La publicación debe pertenecer al propietario autenticado                  |
| Autenticación y autorización | `requireAuth` + `rol('Propietario')`                                       |
| Respuesta exitosa            | `200 OK` con arreglo de reportes; puede estar vacío                        |
| Encabezados de respuesta     | `Content-Type: application/json`                                           |
| Respuestas de error          | `401`, `403`, `404`, `500`                                                 |

<br>

### Estructura del cuerpo de respuesta

| Campo         | Tipo   | Descripción                      |
| ------------- | ------ | -------------------------------- |
| `id`          | number | Identificador del reporte        |
| `motivo`      | string | Motivo del reporte               |
| `descripcion` | string | Descripción del reporte          |
| `fecha`       | string | Fecha de creación en formato ISO |
| `estado`      | string | Estado actual del reporte        |

<br>

### Ejemplo de solicitud

```http
GET /api/publicaciones/42/reportes
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "id": 1,
    "motivo": "La información no coincide",
    "descripcion": "El anuncio muestra datos diferentes.",
    "fecha": "2026-11-19T11:30:42.091Z",
    "estado": "pendiente"
  }
]
```

<br>

### Notas

- Si no existe la publicación o no pertenece al propietario autenticado, responde `404` con `{ "error": "No se encontró la publicación." }`.
- El controlador selecciona explícitamente los campos de salida y omite `reportante`.

---

<br>

## 6.4 Crear valoración — POST /api/publicaciones/:id/valoraciones

<br>

### Tabla de estado actual

| Campo                        | Valor actual                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Recurso                      | Valoración asociada a una publicación                                                            |
| Propósito                    | Registrar una puntuación y un comentario opcional de un cliente                                  |
| Método HTTP                  | POST                                                                                             |
| Endpoint                     | `/api/publicaciones/:id/valoraciones`                                                            |
| Parámetros de ruta           | `id`: identificador de publicación                                                               |
| Query string                 | No utiliza                                                                                       |
| Encabezados de solicitud     | `Content-Type: application/json`; Cookie `Alquiya.sid`                                           |
| Cuerpo JSON                  | `puntuacion`, `comentario` opcional                                                              |
| Reglas de validación         | `puntuacion` debe ser un entero entre 1 y 5; cada cliente puede valorar una vez cada publicación |
| Autenticación y autorización | `requireAuth` + `rol('Cliente')`                                                                 |
| Respuesta exitosa            | `201 Created` con mensaje y promedio actualizado                                                 |
| Encabezados de respuesta     | `Content-Type: application/json`                                                                 |
| Respuestas de error          | `400`, `401`, `403`, `404`, `409`, `500`                                                         |

<br>

### Estructura del cuerpo de solicitud

| Campo        | Tipo   | Obligatorio | Descripción                            |
| ------------ | ------ | ----------- | -------------------------------------- |
| `puntuacion` | number | Sí          | Entero entre 1 y 5                     |
| `comentario` | string | No          | Comentario; por defecto es texto vacío |

<br>

### Ejemplo de solicitud

```http
POST /api/publicaciones/42/valoraciones
Content-Type: application/json
Cookie: Alquiya.sid=s%3A...
```

```json
{
  "puntuacion": 5,
  "comentario": "La publicación coincide con lo ofrecido."
}
```

<br>

### Ejemplo de respuesta exitosa

```http
201 Created
```

```json
{
  "mensaje": "Valoración creada.",
  "calificacion": 4.5,
  "cantidadValoraciones": 3
}
```

<br>

### Ejemplo de error (puntuación inválida)

```json
{ "error": "La puntuación debe ser un número entero entre 1 y 5." }
```

<br>

### Notas

- Si la publicación no existe, responde `404`. Si el cliente ya la valoró, el modelo lanza `ConflictError` y `errorHandler` responde `409`.
- El promedio y la cantidad total se recalculan a partir de las valoraciones guardadas.

---

<br>

## 6.5 Listar valoraciones — GET /api/publicaciones/:id/valoraciones

<br>

### Tabla de estado actual

| Campo                        | Valor actual                                                        |
| ---------------------------- | ------------------------------------------------------------------- |
| Recurso                      | Colección de valoraciones de una publicación                        |
| Propósito                    | Permitir que el propietario consulte valoraciones de su publicación |
| Método HTTP                  | GET                                                                 |
| Endpoint                     | `/api/publicaciones/:id/valoraciones`                               |
| Parámetros de ruta           | `id`: identificador de publicación                                  |
| Query string                 | No utiliza                                                          |
| Encabezados de solicitud     | Cookie `Alquiya.sid`                                                |
| Cuerpo JSON                  | No utiliza                                                          |
| Reglas de validación         | La publicación debe pertenecer al propietario autenticado           |
| Autenticación y autorización | `requireAuth` + `rol('Propietario')`                                |
| Respuesta exitosa            | `200 OK` con arreglo de valoraciones; puede estar vacío             |
| Encabezados de respuesta     | `Content-Type: application/json`                                    |
| Respuestas de error          | `401`, `403`, `404`, `500`                                          |

<br>

### Estructura del cuerpo de respuesta

| Campo           | Tipo   | Descripción                                                              |
| --------------- | ------ | ------------------------------------------------------------------------ |
| `puntuacion`    | number | Puntuación entre 1 y 5                                                   |
| `comentario`    | string | Comentario o texto vacío                                                 |
| `nombreUsuario` | string | Nombre y apellido; si el usuario ya no está disponible, se usa su correo |

<br>

### Ejemplo de solicitud

```http
GET /api/publicaciones/42/valoraciones
Cookie: Alquiya.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "puntuacion": 5,
    "comentario": "La publicación coincide con lo ofrecido.",
    "nombreUsuario": "Ana Pérez"
  }
]
```

<br>

### Notas

- Si no existe la publicación o no pertenece al propietario autenticado, responde `404`.
- La salida no incluye el correo `emisor` guardado en cada valoración.

---

<br>
<br>
