# Contrato de la API — AlquiYA!

> El documento describe **qué endpoints expone hoy el servidor**, **qué recibe y devuelve cada uno**, y **qué debería cambiar** para cumplir con un contrato REST estándar.
>
> **Estructura del documento.** Para cada endpoint implementado se presentan tres bloques:
>
> 1. **Tabla de estado actual:** describe lo que el código hace **hoy** (sin opiniones ni propuestas).
> 2. **Ejemplos:** solicitud y respuesta tal cual las devuelve el servidor actual.
> 3. **Observaciones y propuestas:** los bugs, inconsistencias y mejoras sugeridas, **separados de la tabla** para que la descripción del estado actual quede limpia.

---

<br>

## 1. Información general

| Campo                                         | Definición                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Nombre de la API                              | API de AlquiYA!                                                                                                      |
| URL base actual                               | `http://localhost:3000` (rutas de usuarios montadas en `/usuarios`, sin `/api` ni versión)                           |
| URL base propuesta                            | `http://localhost:3000/api/v1`                                                                                       |
| Formato principal                             | `application/json`                                                                                                   |
| Recursos                                      | `usuarios`, `publicaciones`, `alquileres`, `reportes`                                                                |
| Autenticación                                 | Sesión con cookie `clase08.sid` gestionada por `express-session`. Actualmente **ninguna ruta aplica `requireAuth`**. |
| Identificador de usuario                      | El **correo electrónico** es el identificador de negocio (no hay `idUsuario` en el modelo).                          |
| Identificador de publicación/alquiler/reporte | Entero autoincremental en memoria (propuesto).                                                                       |
| Roles                                         | `Cliente` y `Propietario` (campo `tipo` del modelo). Sin rol de moderación definido.                                 |
| Persistencia                                  | En memoria (`this.usuarios = []`). Se pierde al reiniciar el servidor.                                               |

<br>

La API recibe y responde JSON, salvo en los casos en que la operación devuelve `204 No Content` y no hay cuerpo.

Los ejemplos usan `http://localhost:3000` como origen base. Los correos actúan como identificadores de usuario (ej. `ana@example.com` en `/usuarios/correo/ana@example.com`). Los identificadores de publicaciones, alquileres y reportes son enteros (ej. `42`).

<br>

### 1.1 Formato de error

El código actual usa `{ "error": "mensaje legible" }` en todos los controladores. El contrato propuesto mantiene ese formato simple; lo que cambia es el **código HTTP** (hoy usa `420`, `418`, `403`, `404` donde debería usar `409`, `422`, `401`, `204`, `500`).

<br>

### 1.2 Glosario rápido

| Término              | Qué significa                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Endpoint**         | Combinación de método HTTP + ruta. Ej: `POST /usuarios/login`.                                       |
| **Path param**       | Parámetro que forma parte de la URL, marcado con `:`. Ej: `:correo`.                                 |
| **Query param**      | Parámetro que va en la URL después de `?`. Ej: `?pagina=1`.                                          |
| **Status code**      | Código numérico de 3 dígitos (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `500`). |
| **Hash**             | Transformación irreversible. Se aplica a contraseñas (`bcryptjs`, 10 rounds).                        |
| **Cookie de sesión** | Dato que el servidor envía al cliente y el cliente devuelve automáticamente.                         |
| **Middleware**       | Función entre la petición y el controlador. Puede cortar el flujo (`401`) o pasar con `next()`.      |
| **Pendiente**        | Endpoint o funcionalidad con contrato definido pero sin implementar todavía.                         |

### 1.3 Respuestas HTTP estandarizadas sugeridas

| Estado                      | Uso                                                           |
| --------------------------- | ------------------------------------------------------------- |
| `200 OK`                    | Consulta o actualización exitosa con respuesta.               |
| `201 Created`               | Recurso creado.                                               |
| `204 No Content`            | Operación exitosa sin cuerpo, por ejemplo cierre de sesión.   |
| `400 Bad Request`           | JSON mal formado o parámetros inválidos.                      |
| `401 Unauthorized`          | Falta autenticación o las credenciales no son válidas.        |
| `403 Forbidden`             | Usuario autenticado sin permisos para la operación.           |
| `404 Not Found`             | Recurso inexistente o no visible para quien consulta.         |
| `409 Conflict`              | Conflicto con el estado actual o recurso duplicado.           |
| `422 Unprocessable Content` | Datos bien formados que incumplen validaciones de negocio.    |
| `500 Internal Server Error` | Error inesperado del servidor, sin exponer detalles internos. |

---

---

<br>
<br>

## 2. Resumen general

| Sección           | Estado             | Autenticación actual              | Endpoints implementados | Endpoints pendientes |
| ----------------- | ------------------ | --------------------------------- | ----------------------- | -------------------- |
| **Usuarios**      | Parcial (con bugs) | Ninguna ruta aplica `requireAuth` | 5                       | 1                    |
| **Publicaciones** | No implementado    | —                                 | 0                       | 5                    |
| **Alquileres**    | No implementado    | —                                 | 0                       | 5                    |
| **Reportes**      | No implementado    | —                                 | 0                       | 3                    |

<br>

**Endpoints implementados en detalle:**

- `GET /usuarios`
- `POST /usuarios`
- `GET /usuarios/correo/:correo`
- `POST /usuarios/login`
- `POST /usuarios/logout`

**Endpoints pendientes:**

- `GET /api/me` (documentado abajo como pendiente con el contrato que debería cumplir).
- Todos los endpoints de publicaciones, alquileres y reportes.

---

<br>
<br>

# 3. Sección Usuarios

<br>

**Descripción.** Este módulo gestiona el alta, la autenticación y la consulta de usuarios (`Cliente` o `Propietario`). Es el único módulo con endpoints implementados hoy. Todos los endpoints funcionan, pero tienen problemas de seguridad (hash expuesto, sin `requireAuth`) y de contrato (códigos HTTP no estándar, respuesta de alta vacía).

<br>

## 3.1 Resumen de endpoints

| Operación         | Método y ruta                  | Autenticación actual | Estado       | Cuerpo de entrada                        | Cuerpo de respuesta actual                       |
| ----------------- | ------------------------------ | -------------------- | ------------ | ---------------------------------------- | ------------------------------------------------ |
| Listar usuarios   | `GET /usuarios`                | Ninguna              | Implementado | —                                        | Arreglo de modelos crudos (incluye `contrasena`) |
| Crear usuario     | `POST /usuarios`               | Pública              | Implementado | `nombre`, `correo`, `contrasena`, `tipo` | `undefined` (body vacío)                         |
| Buscar por correo | `GET /usuarios/correo/:correo` | Ninguna              | Implementado | Path: `correo`                           | Modelo crudo (incluye `contrasena`)              |
| Iniciar sesión    | `POST /usuarios/login`         | Pública              | Implementado | `correo`, `contrasena`                   | Modelo crudo + cookie `clase08.sid`              |
| Cerrar sesión     | `POST /usuarios/logout`        | Sesión activa        | Implementado | Cookie `clase08.sid`                     | `{ "message": "..." }`                           |
| Perfil propio     | `GET /api/me`                  | —                    | Pendiente    | —                                        | —                                                |

---

<br>

## 3.2 Listar usuarios — GET /usuarios

<br>

### Tabla de estado actual

| Campo                    | Valor actual                            |
| ------------------------ | --------------------------------------- |
| Recurso                  | Colección de usuarios                   |
| Propósito                | Listar todos los usuarios registrados   |
| Método HTTP              | GET                                     |
| Endpoint                 | `/usuarios`                             |
| Parámetros de ruta       | No utiliza                              |
| Query string             | No utiliza                              |
| Encabezados de solicitud | `Accept: application/json` (opcional)   |
| Cuerpo JSON              | No utiliza                              |
| Reglas de validación     | Ninguna                                 |
| Autenticación            | Ninguna (`requireAuth` no se aplica)    |
| Respuesta exitosa        | `200 OK` con arreglo de modelos crudos  |
| Encabezados de respuesta | `Content-Type: application/json`        |
| Respuestas de error      | `418 I'm a teapot` (código no estándar) |

<br>

### Estructura del cuerpo de respuesta actual

| Campo        | Tipo    | Descripción                            |
| ------------ | ------- | -------------------------------------- |
| `nombre`     | string  | Nombre del usuario                     |
| `correo`     | string  | Correo del usuario (identificador)     |
| `contrasena` | string  | Hash bcrypt de la contraseña           |
| `tipo`       | string  | `"Cliente"` o `"Propietario"`          |
| `reportes`   | array   | Lista de reportes asociados al usuario |
| `activo`     | boolean | `true` si tiene sesión iniciada        |

<br>

### Ejemplo de solicitud

```http
GET /usuarios
```

<br>

### Ejemplo de respuesta exitosa

```json
[
  {
    "nombre": "Ana",
    "correo": "ana@example.com",
    "contrasena": "$2a$10$abcdef...",
    "tipo": "Cliente",
    "reportes": [],
    "activo": false
  }
]
```

<br>

### Ejemplo de error

```json
{ "error": "Error inesperado" }
```

<br>

### Observaciones y propuestas

- **Bug (seguridad):** la respuesta incluye `contrasena` con el hash bcrypt. Debería aplicarse una proyección pública (`{ nombre, correo, tipo }`) antes de responder.
- **Bug (seguridad):** el endpoint no requiere sesión. Debería aplicar `requireAuth` (idealmente con rol de moderación).
- **Contrato:** `418 I'm a teapot` no es un código estándar. Propuesto: `401` sin sesión, `500` error interno.
- **Propuesta:** agregar paginación (`pagina`, `limite`) y filtro por `tipo`.

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
| Cuerpo JSON              | `nombre`, `correo`, `contrasena`, `tipo`                                                                                                                                                                |
| Reglas de validación     | Modelo `usuario.js`: `nombre` 3–30 caracteres; `correo` válido (`Validator.isEmail`); `contrasena` fuerte (`Validator.isStrongPassword`); `tipo` debe ser `"Cliente"` o `"Propietario"` (casing exacto) |
| Autenticación            | Pública                                                                                                                                                                                                 |
| Respuesta exitosa        | `201 Created` con cuerpo `undefined`                                                                                                                                                                    |
| Encabezados de respuesta | `Content-Type: application/json`                                                                                                                                                                        |
| Respuestas de error      | `420 Enhance Your Calm` (código no estándar)                                                                                                                                                            |

<br>

### Estructura del cuerpo de solicitud

| Campo        | Tipo   | Obligatorio | Descripción                              |
| ------------ | ------ | ----------- | ---------------------------------------- |
| `nombre`     | string | Sí          | Nombre del usuario (3–30 caracteres)     |
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
  "nombre": "Ana Pérez",
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

```
(empty body)
```

<br>

### Ejemplo de error (correo duplicado)

```json
{ "error": "El correo ana@example.com ya está registrado" }
```

<br>

### Ejemplo de error (datos inválidos)

```json
{ "error": "El nombre debe tener entre 3 y 30 caracteres" }
```

<br>

### Observaciones y propuestas

- **Bug (contrato):** `agregarUsuario` en `repositorioUsuarios.js` crea el usuario pero **no lo retorna**. El controlador hace `res.status(201).json(usuario)` con `usuario === undefined` → body vacío.
- **Bug (contrato):** si `tipo` no es exactamente `"Cliente"` ni `"Propietario"`, el método no crea nada y **no lanza error**. El cliente recibe `201` con body vacío sin saber por qué.
- **Contrato:** `420` no es estándar. Propuesto: `409 Conflict` (correo duplicado), `422 Unprocessable Content` (datos inválidos).
- **Propuesta:** agregar header `Location: /usuarios/{correo}` en la respuesta `201`.
- **Propuesta:** que `agregarUsuario` retorne el objeto creado (o que el controlador lo busque por correo después de crearlo).

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
| Autenticación            | Ninguna (`requireAuth` no se aplica)                                     |
| Respuesta exitosa        | `200 OK` con modelo crudo                                                |
| Encabezados de respuesta | `Content-Type: application/json`                                         |
| Respuestas de error      | `400 Bad Request` si no se encuentra                                     |

<br>

### Estructura del cuerpo de respuesta actual

| Campo        | Tipo    | Descripción                   |
| ------------ | ------- | ----------------------------- |
| `nombre`     | string  | Nombre del usuario            |
| `correo`     | string  | Correo del usuario            |
| `contrasena` | string  | Hash bcrypt                   |
| `tipo`       | string  | `"Cliente"` o `"Propietario"` |
| `reportes`   | array   | Lista de reportes del usuario |
| `activo`     | boolean | Si tiene sesión activa        |

<br>

### Ejemplo de solicitud

```http
GET /usuarios/correo/ana@example.com
```

<br>

### Ejemplo de respuesta exitosa

```json
{
  "nombre": "Ana",
  "correo": "ana@example.com",
  "contrasena": "$2a$10$abcdef...",
  "tipo": "Cliente",
  "reportes": [],
  "activo": false
}
```

<br>

### Ejemplo de error

```json
{ "error": "Usuario no encontrado" }
```

<br>

### Observaciones y propuestas

- **Corrección aplicada:** la ruta ya tiene el parámetro `:correo`. Antes era `/correo` sin parámetro y `req.params.correo` era siempre `undefined`.
- **Bug (seguridad):** devuelve el modelo crudo con el hash `contrasena`. Debería proyectar solo `{ nombre, correo, tipo }`.
- **Bug (seguridad):** no requiere sesión. Debería aplicar `requireAuth`.
- **Contrato:** `400` cuando el usuario no existe. Propuesto: `404 Not Found`.

---

<br>

## 3.5 Iniciar sesión — POST /usuarios/login

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Sesión de usuario                                                                                                          |
| Propósito                | Autenticar al usuario y crear una sesión                                                                                   |
| Método HTTP              | POST                                                                                                                       |
| Endpoint                 | `/usuarios/login`                                                                                                          |
| Parámetros de ruta       | No utiliza                                                                                                                 |
| Query string             | No utiliza                                                                                                                 |
| Encabezados de solicitud | `Content-Type: application/json`                                                                                           |
| Cuerpo JSON              | `correo`, `contrasena`                                                                                                     |
| Reglas de validación     | El usuario debe existir; `bcrypt.compare` debe confirmar la contraseña. El correo se normaliza con `trim().toLowerCase()`  |
| Autenticación            | Pública (no requiere sesión previa)                                                                                        |
| Respuesta exitosa        | `200 OK` con modelo crudo. Se establece cookie `clase08.sid`. Marca `activo = true` y guarda `req.session.userId = correo` |
| Encabezados de respuesta | `Set-Cookie: clase08.sid=...; Path=/; HttpOnly; SameSite=Lax`; `Content-Type: application/json`                            |
| Respuestas de error      | `403 Forbidden` si credenciales inválidas                                                                                  |

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
200 OK
Set-Cookie: clase08.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax
```

```json
{
  "nombre": "Ana",
  "correo": "ana@example.com",
  "contrasena": "$2a$10$abcdef...",
  "tipo": "Cliente",
  "reportes": [],
  "activo": true
}
```

<br>

### Ejemplo de error

```json
{ "error": "Credenciales inválidas" }
```

<br>

### Observaciones y propuestas

- **Bug (seguridad):** devuelve el modelo crudo con el hash `contrasena`. Debería proyectar solo `{ nombre, correo, tipo }`.
- **Contrato:** `403` para credenciales inválidas. Propuesto: `401 Unauthorized` (el 403 es para usuarios autenticados sin permiso).
- **Nota:** el servicio marca `usuario.activo = true` al iniciar sesión. Ese flag de "activo" no distingue entre "tiene sesión ahora" y "su cuenta está habilitada"; conviene renombrarlo o separarlo.

---

<br>

## 3.6 Cerrar sesión — POST /usuarios/logout

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                 |
| ------------------------ | ------------------------------------------------------------ |
| Recurso                  | Sesión de usuario                                            |
| Propósito                | Destruir la sesión actual                                    |
| Método HTTP              | POST                                                         |
| Endpoint                 | `/usuarios/logout`                                           |
| Parámetros de ruta       | No utiliza                                                   |
| Query string             | No utiliza                                                   |
| Encabezados de solicitud | Cookie `clase08.sid`                                         |
| Cuerpo JSON              | No utiliza                                                   |
| Reglas de validación     | Debe existir una sesión activa (`req.session.userId`)        |
| Autenticación            | Requiere sesión activa                                       |
| Respuesta exitosa        | `200 OK` con `{ "message": "Sesión cerrada correctamente" }` |
| Encabezados de respuesta | `Content-Type: application/json`                             |
| Respuestas de error      | `404 Not Found` si no hay sesión                             |

<br>

### Estructura del cuerpo de respuesta actual

| Campo     | Tipo   | Descripción                                                |
| --------- | ------ | ---------------------------------------------------------- |
| `message` | string | Mensaje de confirmación (`"Sesión cerrada correctamente"`) |

<br>

### Ejemplo de solicitud

```http
POST /usuarios/logout
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa

```json
{ "message": "Sesión cerrada correctamente" }
```

<br>

### Ejemplo de error

```json
{ "error": "No hay sesión iniciada" }
```

<br>

### Observaciones y propuestas

- **Bug (runtime):** si la sesión existe pero el usuario ya no está en memoria (porque se reinició el servidor), `this.buscarUsuarioPorCorreo(req.session.userId).activo = false` lanza `TypeError` y el servidor puede caer. La sesión queda sin destruir.
  - Fix propuesto: verificar `const usuario = this.buscarUsuarioPorCorreo(...); if (usuario) usuario.activo = false; req.session.destroy();`.
- **Contrato:** `404` cuando no hay sesión. Propuesto: `204 No Content` idempotente (cerrar sesión sin sesión no es un error).
- **Propuesta:** `204 No Content` sin cuerpo en vez de `200` con `message`.

---

<br>

## 3.7 Obtener perfil propio — GET /api/me (Pendiente)

<br>

### Tabla de estado actual

| Campo                    | Valor actual                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Recurso                  | Perfil del usuario autenticado                                                                                                      |
| Propósito                | Devolver los datos del usuario en sesión                                                                                            |
| Método HTTP              | GET                                                                                                                                 |
| Endpoint                 | `/api/me`                                                                                                                           |
| Parámetros de ruta       | No utiliza                                                                                                                          |
| Query string             | No utiliza                                                                                                                          |
| Encabezados de solicitud | Cookie `clase08.sid`                                                                                                                |
| Cuerpo JSON              | No utiliza                                                                                                                          |
| Reglas de validación     | —                                                                                                                                   |
| Autenticación            | —                                                                                                                                   |
| Respuesta exitosa        | —                                                                                                                                   |
| Respuestas de error      | —                                                                                                                                   |
| Estado                   | **Pendiente.** El endpoint **no existe** en el código actual. `app.js` importa `requireAuth` pero nunca define una ruta que lo use. |

<br>

### Contrato que debería cumplir

| Campo                    | Valor propuesto                                        |
| ------------------------ | ------------------------------------------------------ |
| Recurso                  | Perfil del usuario autenticado                         |
| Propósito                | Devolver los datos del usuario en sesión               |
| Método HTTP              | GET                                                    |
| Endpoint                 | `/api/me`                                              |
| Parámetros de ruta       | No utiliza                                             |
| Query string             | No utiliza                                             |
| Encabezados de solicitud | Cookie `clase08.sid`                                   |
| Cuerpo JSON              | No utiliza                                             |
| Reglas de validación     | Requiere sesión válida (middleware `requireAuth`)      |
| Autenticación            | `requireAuth`                                          |
| Respuesta exitosa        | `200 OK` con perfil público `{ nombre, correo, tipo }` |
| Encabezados de respuesta | `Content-Type: application/json`                       |
| Respuestas de error      | `401 Unauthorized` si no hay sesión                    |

<br>

### Ejemplo de solicitud (propuesto)

```http
GET /api/me
Cookie: clase08.sid=s%3A...
```

<br>

### Ejemplo de respuesta exitosa (propuesto)

```json
{
  "nombre": "Ana",
  "correo": "ana@example.com",
  "tipo": "Cliente"
}
```

<br>

### Ejemplo de error (propuesto)

```json
{ "error": "Es necesario iniciar sesión" }
```

<br>

### Observaciones y propuestas

- **Estado:** pendiente de implementación. El middleware `requireAuth` ya existe en `src/middleware/autentificacion.js`, solo falta montar la ruta en `app.js`.
- **Bug relacionado:** existe un método `toPublic()` en el repositorio que proyecta `{ id, nombre, correo, role }`, pero `id` y `role` no existen en el modelo (salen `undefined`). Antes de usar `toPublic()` en `/api/me`, corregir la proyección a `{ nombre, correo, tipo }`.
- **Propuesta de implementación:**

```javascript
import { requireAuth } from "./middleware/autentificacion.js";

app.get("/api/me", requireAuth, (req, res) => {
  const { nombre, correo, tipo } = req.user;
  res.json({ nombre, correo, tipo });
});
```

---

<br>
<br>

# 4. Sección Publicaciones

<br>

**Descripción.** Módulo de publicaciones de propiedades, habitaciones y vehículos. Existe `repositorioPublicaciones.js` (con código en memoria) y los modelos `Publicacion`, `Producto`, `Propiedad`, `Vehiculo`, pero **no hay ruta, controlador ni servicio implementado**. Ningún endpoint de esta sección está implementado todavía; se listan a continuación como guía para próximos sprints.

<br>

## 4.1 Resumen de endpoints

| Operación             | Método y ruta               | Autenticación propuesta              | Estado    | Entrada                                                                                        | Cuerpo de respuesta propuesto                         | Códigos propuestos                |
| --------------------- | --------------------------- | ------------------------------------ | --------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Listar publicaciones  | `GET /publicaciones`        | Público                              | Pendiente | Query: `disponibilidad`, `propietarioId`, `tipo`, `precioMin`, `precioMax`, `pagina`, `limite` | `total`, `pagina`, `limite`, arreglo de publicaciones | `200`, `400`                      |
| Consultar publicación | `GET /publicaciones/:id`    | Público                              | Pendiente | Path: `id`                                                                                     | Publicación                                           | `200`, `404`                      |
| Crear publicación     | `POST /publicaciones`       | `requireRole('Propietario')`         | Pendiente | `titulo`, `descripcion`, `direccion`, `precio`, `tipo`                                         | Publicación creada                                    | `201`, `400`, `401`, `403`, `422` |
| Editar publicación    | `PATCH /publicaciones/:id`  | `requireRole('Propietario')` + autor | Pendiente | Path: `id`; JSON parcial                                                                       | Publicación actualizada                               | `200`, `400`, `401`, `403`, `404` |
| Eliminar publicación  | `DELETE /publicaciones/:id` | `requireRole('Propietario')` + autor | Pendiente | Path: `id`                                                                                     | Sin cuerpo (soft delete)                              | `204`, `401`, `403`, `404`        |

---

<br>
<br>

# 5. Sección Alquileres

<br>

**Descripción.** Módulo de alquileres de publicaciones. Solo existe el modelo `Alquiler` (que referencia `producto`, no `publicacion`, y no tiene `precioTotal`). Ningún endpoint está implementado todavía.

<br>

## 5.1 Resumen de endpoints

| Operación          | Método y ruta                                   | Autenticación propuesta                 | Estado    | Entrada                                                | Cuerpo de respuesta propuesto                      | Códigos propuestos                              |
| ------------------ | ----------------------------------------------- | --------------------------------------- | --------- | ------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| Solicitar alquiler | `POST /publicaciones/:publicacionId/alquileres` | `requireRole('Cliente')`                | Pendiente | Path: `publicacionId`; JSON: `fechaInicio`, `fechaFin` | Alquiler en estado `pendiente`                     | `201`, `400`, `401`, `403`, `404`, `409`, `422` |
| Listar historial   | `GET /alquileres`                               | `requireAuth`                           | Pendiente | Query: `estado`, `pagina`, `limite`                    | `total`, `pagina`, `limite`, arreglo de alquileres | `200`, `401`                                    |
| Consultar alquiler | `GET /alquileres/:alquilerId`                   | `requireAuth` + participante            | Pendiente | Path: `alquilerId`                                     | Alquiler                                           | `200`, `401`, `403`, `404`                      |
| Decidir            | `POST /alquileres/:alquilerId/decision`         | `requireRole('Propietario')` + autor    | Pendiente | Path: `alquilerId`; JSON: `decision`                   | Alquiler actualizado                               | `200`, `401`, `403`, `404`, `409`, `422`        |
| Cancelar           | `POST /alquileres/:alquilerId/cancelacion`      | `requireAuth` + participante autorizado | Pendiente | Path: `alquilerId`                                     | Alquiler actualizado                               | `200`, `401`, `403`, `404`, `409`, `422`        |

---

<br>
<br>

# 6. Sección Reportes

<br>

**Descripción.** Módulo de reportes sobre publicaciones. Solo existe el modelo `Reporte` (estado inicial `pendiente`, sin transiciones) y `usuario.js` tiene un arreglo `reportes` con método `Reportar()`. Ningún endpoint está implementado todavía.

<br>

## 6.1 Resumen de endpoints

| Operación                 | Método y ruta                                 | Autenticación propuesta | Estado    | Entrada                                              | Cuerpo de respuesta propuesto                    | Códigos propuestos                       |
| ------------------------- | --------------------------------------------- | ----------------------- | --------- | ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Reportar publicación      | `POST /publicaciones/:publicacionId/reportes` | `requireAuth`           | Pendiente | Path: `publicacionId`; JSON: `motivo`, `descripcion` | `publicacionId`, `requiereRevision`              | `201`, `400`, `401`, `404`, `409`, `422` |
| Listar reportes           | `GET /reportes`                               | Rol de moderación       | Pendiente | Query: `estado`, `pagina`, `limite`                  | `total`, `pagina`, `limite`, arreglo de reportes | `200`, `401`, `403`                      |
| Cambiar estado de reporte | `PATCH /reportes/:reporteId`                  | Rol de moderación       | Pendiente | Path: `reporteId`; JSON: `estado`                    | Reporte actualizado                              | `200`, `401`, `403`, `404`, `422`        |

---

<br>
<br>

# 7. Convenciones generales

<br>

| Campo                               | Definición                                                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exposición de usuarios              | Se deben exponer exclusivamente mediante una función de proyección (`toPublic()` o similar) que excluya `contrasena`. Hoy **no se aplica** en ningún endpoint: login, alta, listado y búsqueda devuelven el modelo crudo con hash. |
| Exposición de publicaciones         | Se deben exponer mediante una función de proyección que excluya la lista de reportes. Los reportes se consultarán por endpoint aparte (Pendiente).                                                                                 |
| Formato de error                    | Todo error responde en JSON con `{ "error": "mensaje legible" }`. El formato se mantiene; lo que cambia es el **código HTTP**.                                                                                                     |
| Códigos HTTP actuales (no estándar) | `200` en alta, `420` en errores de alta/listado, `418` en listado, `403` en login, `404` en logout.                                                                                                                                |
| Códigos HTTP propuestos             | `201` en alta, `204` en logout, `401` sin sesión, `403` sin permiso, `404` recurso inexistente, `409` conflicto, `422` regla de negocio, `500` falla interna.                                                                      |
| Identidad pública                   | El correo es el identificador de usuario. El modelo no tiene `idUsuario`. Pendiente de decidir si se agrega.                                                                                                                       |
| Normalización de correo             | La búsqueda y el login normalizan con `trim().toLowerCase()`. El **almacenamiento** no normaliza (el constructor de `usuario.js` guarda el correo tal cual). Pendiente: normalizar en el constructor.                              |
| Autenticación                       | El middleware `requireAuth` existe pero **no se aplica en ninguna ruta**. Pendiente: aplicarlo en `GET /usuarios`, `POST /usuarios`, `GET /usuarios/correo/:correo` y en todos los endpoints futuros.                              |
| Autorización por rol                | No existe hoy. Pendiente: crear un middleware `requireRole('Propietario')` para la creación de publicaciones.                                                                                                                      |
| Sesión                              | Cookie `clase08.sid`, secret hardcodeado `'secret'` (inseguro), TTL 1 hora, `httpOnly`, `sameSite=lax`. Pendiente: mover secret a variable de entorno.                                                                             |
| Persistencia                        | En memoria (`this.usuarios = []`). Se pierde al reiniciar. Pendiente: base de datos real.                                                                                                                                          |
| Base URL                            | Actual: `/usuarios`. Propuesto: `/api/usuarios` con versión `/api/v1`.                                                                                                                                                             |
| Proveedor externo                   | Sin integración. Google Maps mencionado en requisitos pero no implementado.                                                                                                                                                        |

---

<br>
<br>

# 8. Issues priorizados

<br>

| #   | Issue                                                                                                                                                                                                    | Impacto       | Ubicación                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------- |
| 1   | **Casing inconsistente de archivos de modelos.** En disco: `usuario.js` / `propietario.js` (minúscula). En imports: `Usuario.js` / `Propietario.js` (mayúscula). En Linux/CI el servidor **no arranca**. | Bloqueante    | `src/models/` vs `src/service/repositorioUsuarios.js` |
| 2   | **Hash de contraseña expuesto.** `GET /usuarios`, `POST /usuarios`, `GET /usuarios/correo/:correo` y `POST /usuarios/login` devuelven el modelo crudo con `contrasena`.                                  | Seguridad     | `src/controllers/usuariosController.js`               |
| 3   | **Sin `requireAuth` en ninguna ruta.** El middleware existe pero no se aplica. Todos los endpoints son públicos.                                                                                         | Seguridad     | `src/routes/usuariosRoutes.js` y `src/app.js`         |
| 4   | **Alta devuelve `201` con cuerpo vacío.** `agregarUsuario` no retorna el usuario creado.                                                                                                                 | Contrato      | `src/service/repositorioUsuarios.js`                  |
| 5   | **Códigos HTTP no estándar.** `420`, `418`, `403` (debería `401`), `404` (debería `204`).                                                                                                                | Contrato      | `src/controllers/usuariosController.js`               |
| 6   | **`agregarUsuario` silencioso.** Si `tipo` no es `"Cliente"` ni `"Propietario"`, no crea nada ni lanza error.                                                                                            | Contrato      | `src/service/repositorioUsuarios.js`                  |
| 7   | **`cerrarSesion` puede crashear.** Si el usuario no existe en memoria, `.activo = false` lanza `TypeError`.                                                                                              | Runtime       | `src/service/repositorioUsuarios.js`                  |
| 8   | **`await` de nivel superior** con `password` no usado en `repositorioUsuarios.js`.                                                                                                                       | Código suelto | `src/service/repositorioUsuarios.js`                  |
| 9   | **Secret de sesión hardcodeado** (`'secret'`) y credenciales demo impresas por consola.                                                                                                                  | Seguridad     | `src/app.js`, `server.js`                             |
| 10  | **`container.js` es código muerto.** Referencia módulos sin importar, no está conectado a `app.js`.                                                                                                      | Arquitectura  | `src/container.js`                                    |
| 11  | **`publicacionesService.js`, `historialService.js`, `historial.js`, `config.js` vacíos.**                                                                                                                | Pendiente     | `src/service/`, `src/repositories/`, `src/config.js`  |
| 12  | **Modelos desalineados con el diagrama.** `Usuario` sin `idUsuario`, `telefono`, `fechaRegistro`; `Valoracion` sin `fecha`; `Alquiler` sin `precioTotal`; `Direccion` sin `export`.                      | Modelos       | `src/models/`                                         |
