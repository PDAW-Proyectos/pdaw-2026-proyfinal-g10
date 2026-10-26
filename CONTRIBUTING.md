# Acuerdos de trabajo y convenciones

## Acuerdos del equipo

- **Comunicación:** canal [Whatsapp]; respondemos dentro de las [10am-16pm] horas en días hábiles.
- **Decisiones técnicas:** se toman por consenso; si no hay acuerdo en 30 minutos, decide el
  referente de producto del sprint y se registra el motivo.
- **Bloqueos:** quien está bloqueado más de 30 minutos lo informa en el canal del equipo.
- **Ausencias:** se avisan con anticipación y se reasignan los issues en curso.
- **Desacuerdos:** se tratan en la retrospectiva, sobre hechos y no sobre personas.

## Flujo de trabajo (GitHub Flow)

1. Nadie trabaja directamente sobre `main`.
2. Cada issue se resuelve en una rama: `tipo/número-descripción-breve`.
   - Tipos: `feature`, `fix`, `refactor`, `test`, `docs`, `chore`.
   - Ejemplo: `feature/12-pedir-prestamo`.
3. Commits con formato convencional: `tipo(alcance): resumen en imperativo`.
   - Ejemplo: `feat(prestamos): validar límite de préstamos por rol`.
4. Todo cambio entra a `dev-sprint##` mediante un pull request con al menos **una aprobación**.
5. Las ramas se borran después de integrarse.
6. Al final de cada sprint todos los cambios en `dev` entran a `main` mediante un pull request.

## Definición de terminado

Una historia está terminada cuando:

- [ ] Cumple todos sus criterios de aceptación.
- [ ] El código fue revisado y aprobado en un pull request por otra persona.
- [ ] Las pruebas automatizadas pasan (localmente y en integración continua).
- [ ] Está integrada en `main` sin romper funcionalidades existentes.
- [ ] La documentación (README, API) está actualizada si corresponde.

## Revisión de código

- Revisar primero el diseño (responsabilidades, capas, nombres) y luego el detalle.
- Etiquetar los comentarios: `pregunta`, `sugerencia`, `bloqueante`, `elogio`, `detalle`.
- Comentar el código, no a la persona; explicar el porqué de cada observación.

## Código de terceros

Todo fragmento no trivial tomado de otra fuente (documentación, foros, herramientas de IA) se
acompaña de un comentario con su origen y licencia.
