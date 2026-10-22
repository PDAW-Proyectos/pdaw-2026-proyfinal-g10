# Requisitos del sistema

## Requisitos funcionales

- Registrarse como usuario.
- Iniciar sesión como usuario o propietario.
- Cerrar sesión.

- Crear publicaciones.
- Editar publicaciones.
- Eliminar publicaciones.
- Reportar publicaciones.
- Valorar publicaciones.
- Valorar al cliente.

- Solicitar o reservar un alquiler.
- Aceptar o rechazar solicitudes de alquiler.
- Buscar publicaciones por disponibilidad o propietario.
- Listar publicaciones activas.
- Cancelar una reserva.
- Consultar el estado de una solicitud.
- Gestionar reportes de publicaciones.
- Listar un historial de alquileres.
- Tener un perfil de usuario.

## Requisitos no funcionales

### RNF01 · Seguridad

- El sistema debe proteger las cuentas de los usuarios mediante autenticación y almacenamiento seguro de las contraseñas.

**Control de acceso:** el sistema debe permitir que cada usuario acceda únicamente a las funciones y los datos para los que tenga autorización.

### RNF03 · Rendimiento

El sistema debe responder a las consultas y operaciones habituales en un tiempo máximo de 3 segundos en condiciones normales de uso.

### RNF04 · Disponibilidad

El sistema debe estar disponible al menos el 99 % del tiempo mensual, excluyendo los períodos de mantenimiento programado.

### RNF05 · Usabilidad

La interfaz debe ser clara e intuitiva para facilitar el inicio de sesión, la gestión de publicaciones y la consulta de alquileres.

### RNF06 · Compatibilidad

El sistema debe funcionar correctamente en las versiones recientes de los principales navegadores web, como Chrome, Firefox y Edge.

### RNF07 · Integridad de los datos

El sistema debe garantizar que la información de los usuarios, las publicaciones, las valoraciones y los alquileres se almacene de manera consistente.

### RNF08 · Privacidad

El sistema debe proteger los datos personales de los usuarios y permitir el acceso a ellos únicamente según los permisos establecidos.

### RNF09 · Mantenibilidad

El código fuente debe estar organizado y documentado para facilitar futuras modificaciones y correcciones.

### RNF10 · Recuperación de datos

El sistema debe realizar copias de seguridad periódicas para permitir la recuperación de la información ante fallos.

### RNF11 · Validación de datos

El sistema debe validar los datos ingresados en formularios para evitar información incompleta o con formatos incorrectos.

### RNF12 · Accesibilidad

La interfaz debe utilizar textos legibles, etiquetas claras y controles que faciliten la navegación a personas con distintas necesidades.
