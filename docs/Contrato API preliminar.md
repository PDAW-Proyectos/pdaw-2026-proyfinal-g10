# Contrato de API preliminar

> Borrador derivado del código y de los requisitos funcionales de AlquiYA!. Los endpoints de este documento son una propuesta de contrato: no implican que ya estén implementados o disponibles.

## Estado actual del backend

- `src/app.js` y `src/server.js` están vacíos; no hay una aplicación HTTP configurada ni rutas montadas.
- `src/routes/usuariosRoutes.js` declara un `POST` con una ruta relativa `./`, pero no se encontró un montaje de ese router.
- El controlador y el servicio de usuarios no coinciden en los nombres exportados/importados. Por eso, el alta de usuario tampoco constituye hoy un endpoint funcional.
- Los modelos describen usuarios, publicaciones, alquileres, reportes y valoraciones, pero no existe persistencia conectada a una API.

En consecuencia, las rutas y respuestas siguientes son una base para acordar e implementar.

## Convenciones propuestas

- Base URL: `/api/v1`.
- Formato de intercambio: JSON (`Content-Type: application/json`).
- Nombres de campos en español, siguiendo el código existente.
- Fechas: En formato UTC (`2026-10-28T15:00:00Z`); fechas de alquiler con fecha y hora.
- Errores con una forma común:

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "El correo no es válido",
    "detalles": []
  }
}
```

- Rutas privadas: autenticación requerida. El mecanismo de sesión/token y su transporte quedan pendientes de decisión.
- No devolver `contrasena` ni hashes en ninguna respuesta.
- Roles previstos: `Cliente` y `Propietario`. Las operaciones administrativas requieren definir un rol adicional.

## Endpoints propuestos

### Autenticación y cuenta

| Método   | Ruta             | Acceso      | Propósito                           |
| -------- | ---------------- | ----------- | ----------------------------------- |
| `POST`   | `/auth/registro` | Público     | Registrar un cliente o propietario. |
| `POST`   | `/auth/sesion`   | Público     | Iniciar sesión.                     |
| `DELETE` | `/auth/sesion`   | Autenticado | Cerrar la sesión actual.            |
| `GET`    | `/usuarios/me`   | Autenticado | Consultar el perfil propio.         |
| `PATCH`  | `/usuarios/me`   | Autenticado | Actualizar datos del perfil.        |

`POST /auth/registro`

```json
{
  "nombre": "Ana Pérez",
  "correo": "ana@example.com",
  "contrasena": "Ejemplo!123",
  "tipo": "Cliente"
}
```

`tipo` acepta `Cliente` o `Propietario`. El código valida nombre de 3 a 30 caracteres, correo electrónico y contraseña segura. La validación de unicidad del correo también está prevista en el repositorio.

Respuesta propuesta: `201 Created`, con el perfil creado sin contraseña. Usar `409 Conflict` si el correo ya está registrado y `422 Unprocessable Content` si los datos no son válidos.

`POST /auth/sesion` recibe `correo` y `contrasena`. Respuesta propuesta: `200 OK`, con perfil y credencial/sesión según el mecanismo de autenticación que se acuerde. Credenciales incorrectas: `401 Unauthorized`.

### Publicaciones

| Método   | Ruta                             | Acceso            | Propósito                                          |
| -------- | -------------------------------- | ----------------- | -------------------------------------------------- |
| `GET`    | `/publicaciones`                 | Público           | Listar publicaciones activas y filtrar resultados. |
| `POST`   | `/publicaciones`                 | Propietario       | Crear una publicación.                             |
| `GET`    | `/publicaciones/{publicacionId}` | Público           | Consultar el detalle de una publicación activa.    |
| `PATCH`  | `/publicaciones/{publicacionId}` | Propietario autor | Editar una publicación propia.                     |
| `DELETE` | `/publicaciones/{publicacionId}` | Propietario autor | Desactivar una publicación propia.                 |

Filtros sugeridos para `GET /publicaciones`:

| Parámetro                | Uso                                                                 |
| ------------------------ | ------------------------------------------------------------------- |
| `disponibilidad`         | Filtrar por disponibilidad.                                         |
| `propietarioId`          | Filtrar por propietario.                                            |
| `tipo`                   | Filtrar por tipo de producto, por ejemplo `Propiedad` o `Vehiculo`. |
| `precioMin`, `precioMax` | Filtrar por rango de precio.                                        |

La lista debe excluir publicaciones inactivas por defecto. Paginación (`limite` y `cursor` o `pagina`) queda pendiente de acordar.

Ejemplo de creación:

```json
{
  "titulo": "Departamento céntrico",
  "descripcion": "Dos ambientes, amoblado",
  "direccion": {
    "calle": "Sarmiento",
    "altura": 250,
    "piso": "2",
    "departamento": "A"
  },
  "precio": 45000,
  "tipo": "Propiedad"
}
```

El modelo `Publicacion` define `titulo`, `descripcion`, `direccion`, `precio`, `disponibilidad`, `estado`, `activa` y `fechaCreacion`. El servidor debe asignar el identificador, propietario, estado inicial y fecha; el cliente no debería poder establecerlos al crear.

### Alquileres

| Método | Ruta                                        | Acceso                  | Propósito                                                 |
| ------ | ------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| `POST` | `/publicaciones/{publicacionId}/alquileres` | Cliente                 | Solicitar un alquiler indicando fechas.                   |
| `GET`  | `/alquileres`                               | Autenticado             | Consultar el historial propio y solicitudes relacionadas. |
| `GET`  | `/alquileres/{alquilerId}`                  | Participante            | Consultar el detalle y estado de un alquiler propio.      |
| `POST` | `/alquileres/{alquilerId}/decision`         | Propietario autor       | Aceptar o rechazar una solicitud.                         |
| `POST` | `/alquileres/{alquilerId}/cancelacion`      | Participante autorizado | Cancelar una solicitud/reserva cuando corresponda.        |

Solicitud de alquiler:

```json
{
  "fechaInicio": "2026-11-10T12:00:00Z",
  "fechaFin": "2026-11-13T12:00:00Z"
}
```

Decisión del propietario:

```json
{
  "decision": "aceptar"
}
```

Estados sugeridos: `pendiente`, `aceptado`, `rechazado`, `cancelado` y `finalizado`. El modelo actual solo define `pendiente`, `cancelado` y `finalizado`; aceptación y rechazo requieren ampliar el modelo y acordar reglas de transición.

### Reportes y valoraciones

| Método  | Ruta                                      | Acceso                       | Propósito                                        |
| ------- | ----------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `POST`  | `/publicaciones/{publicacionId}/reportes` | Autenticado                  | Reportar una publicación.                        |
| `GET`   | `/reportes`                               | Moderación (rol por definir) | Listar reportes y filtrar por estado.            |
| `PATCH` | `/reportes/{reporteId}`                   | Moderación (rol por definir) | Actualizar el estado de un reporte.              |
| `POST`  | `/alquileres/{alquilerId}/valoracion`     | Participante                 | Valorar al otro participante luego del alquiler. |

Reporte:

```json
{
  "motivo": "Información incorrecta",
  "descripcion": "La descripción no coincide con la publicación."
}
```

Valoración:

```json
{
  "puntuacion": 5,
  "comentario": "Buena experiencia",
  "destinatarioId": "identificador-del-usuario"
}
```

El servidor debe comprobar que quien valora participó del alquiler y que `destinatarioId` es el otro participante. La puntuación y los estados válidos de reportes deben definirse antes de implementar. Los modelos contemplan reportes con estado inicial `pendiente` y valoraciones con puntuación, comentario y emisor.

## Respuestas HTTP sugeridas

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

## Decisiones pendientes antes de implementar

1. Mecanismo de autenticación, duración de sesión y almacenamiento de credenciales; el requisito exige almacenamiento seguro de contraseñas.
2. Campos definitivos del perfil, incluyendo teléfono y si el nombre se divide en nombre/apellido.
3. Estructura común de publicación para propiedades y vehículos. Hoy `Propiedad` y `Vehiculo` heredan de `Producto`, mientras `Publicacion` es un modelo separado.
4. Moneda, precisión, reglas de disponibilidad y detección de solapamiento de reservas.
5. Máquina de estados y permisos exactos para alquileres y reportes.
6. Rol de moderación/administración y formato de paginación.
