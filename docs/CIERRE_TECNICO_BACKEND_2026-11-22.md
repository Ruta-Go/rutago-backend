# RutaGo backend · Cierre técnico autónomo del 22 de noviembre de 2026

Registro por tarea del trabajo ejecutado sin tocar producción, Render ni la base de datos real. El plan sigue siendo el original de 5 Sprints y 43 tareas.

## Auditoría inicial

- Rama `main` limpia en `16d2211`, sin PRs abiertos.
- `npm test`: 44/44.
- E2E de staging: 23/23 (fuera del repositorio, contra `rutago_staging_20261122`).
- Sin endpoint de registro de token push; sin `ST_Within`; sin prueba específica de cupo.

## Sprint 2

### Tarea 13 — Inscripción de pasajeros y control de capacidad

- **Estado anterior:** IMPLEMENTADO.
- **Trabajo de esta jornada:** se añadió `test/viaje.capacidad.test.js` con tres casos reales sobre `unirseAViaje`: rechazo con cupo agotado, alta con cupo disponible y rechazo cuando el vehículo no declara capacidad.
- **Archivos:** `test/viaje.capacidad.test.js`, este documento.
- **Pruebas:** `npm test` → 47/47 (44 anteriores + 3 nuevas).
- **Commit / PR:** se registrará al publicar este bloque.
- **Falta:** nada para la evidencia automatizada; la validación visual sigue en móvil.

## Estado consolidado

Este documento se actualiza después de cada bloque integrado.
