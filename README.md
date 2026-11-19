# AlquiYA!

AlquiYA! es una plataforma web para publicar y encontrar propiedades y habitaciones en alquiler en Bahía Blanca. Conecta a clientes con propietarios y facilita la búsqueda y gestión de alquileres.

Proyecto del equipo **Grupo-10** para _7513 · Proyecto de Desarrollo de Aplicaciones Web_
(Tecnicatura Universitaria en Programación Web y Móvil — DCIC — UNS).

## Ficha del proyecto

| Aspecto           | Descripción                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Propósito         | Facilitar la búsqueda y gestión de alquileres de propiedades y habitaciones en Bahía Blanca. |
| Usuarios          | Clientes que buscan alquiler y propietarios que publican sus propiedades.                    |
| Funcionalidades   | Publicaciones, filtros por precio y valoración, alquileres, reportes y valoraciones.         |
| Reglas de negocio | Perfiles de Cliente y Propietario, con acceso a operaciones según sesión y rol.              |
| Servicio externo  | Nominatim para validar y geocodificar direcciones.                                           |

## Equipo y roles

| Integrante | Usuario de GitHub | Rol                   |
| ---------- | ----------------- | --------------------- |
| Gabriel    | `G_comellas`      | Referente de producto |
| Maxi       | `Maxi-rv`         | Repositorio           |
| Andres     | `andresressia0`   | Desarrollo            |

## Tecnologías

Node.js, Express y JavaScript (ES modules) en el servidor; HTML, CSS y JavaScript en el navegador.

## Ejecutar localmente

Requiere Node.js.

```bash
npm install
npm run dev
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

## Pruebas

```bash
npm test
```

## Documentación Adicional

- [Contrato de la API](docs/Contrato%20API.md)
- [Diagrama de clases](docs/Diagrama%20de%20Clases%20-%20Layers.md)
- [Diagrama de clases (.SVG)](docs/Diagrama%20de%20Clases%20-%20Layers.svg)
- [Carpeta de Diagramas y material del proyecto (docs/)](docs/)
- [Acuerdos de trabajo y convenciones](CONTRIBUTING.md)
