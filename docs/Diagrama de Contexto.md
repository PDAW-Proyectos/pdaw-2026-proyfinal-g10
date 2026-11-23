# `Diagrama de Contexto`

Este diagrama muestra los límites del sistema de alquileres y sus principales actores, sistemas externos y almacenes de datos.

Para visualizar el preview del archivo en VSCode se puede usar una extensión Mermaid como: https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart.

```mermaid
---
config:
  layout: elk
  flowchart:
    htmlLabels: false
---

flowchart TB

classDef system fill:#FFFFFF,stroke:#111111,stroke-width:3px,color:#111111;
classDef actor fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#111111;
classDef external fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px,color:#111111;
classDef data fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px,color:#111111;

system["Sistema de alquileres AlquiYA"]:::system

clientes["Clientes"]:::actor
propietarios["Propietarios"]:::actor
ubicacion["Servicio externo Nominatim"]:::external
usuariosDb["Repositorio de usuarios en memoria"]:::data
publicacionesJson["src/repositories/Publicaciones.json"]:::data

clientes -->|"se registran, inician sesión y solicitan alquileres"| system
clientes -->|"reportan y valoran publicaciones"| system
propietarios -->|"publican y consultan sus publicaciones"| system
propietarios -->|"gestionan reportes y solicitudes de alquiler"| system
system -->|"envía direcciones para geocodificar"| ubicacion
ubicacion -->|"devuelve coordenadas y dirección normalizada"| system
system -->|"busca, crea y autentica usuarios"| usuariosDb
system -->|"lee y persiste publicaciones, reportes y valoraciones"| publicacionesJson
```

## Alcance

- Los clientes pueden consultar publicaciones, solicitar alquileres y crear valoraciones.
- Los propietarios pueden publicar propiedades, gestionar reportes y responder solicitudes de alquiler.
- El repositorio de usuarios mantiene los datos en memoria durante la ejecución.
- Las publicaciones se almacenan en `src/repositories/Publicaciones.json`.
- La ubicación se consulta mediante el servicio externo Nominatim.
- El sistema no implementa edición ni eliminación de publicaciones.
- No existe un sistema externo separado de manejo de usuarios, valoraciones o creación de publicaciones; esas capacidades forman parte de la aplicación.
