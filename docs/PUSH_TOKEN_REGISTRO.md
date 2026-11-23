# Registro de tokens push · Sprint 3 / Tarea 18

Este documento describe la parte backend de la Tarea 18 del plan original. No implica que las notificaciones push reales estén funcionando de extremo a extremo: el proveedor remoto y la prueba en dispositivo siguen siendo externos.

## Implementación

- Migración aditiva `20261122190000-create-dispositivos-push.js`: tabla `DispositivosPush` con `usuarioId`, `token` único, `plataforma`, `activo` y timestamps. El `down()` no borra tokens reales.
- Modelo `src/models/dispositivoPush.js`, repositorio `src/repositories/pushToken.repository.js` y servicio `src/services/pushToken.service.js`.
- Endpoint autenticado `POST /api/notificaciones/push-token` con validación Zod de `token` y `plataforma`.
- La respuesta no devuelve el token y los logs no lo imprimen.
- Una plataforma no reconocida se normaliza a `desconocida`; no se inventa plataforma.

## Pruebas

- `test/pushToken.service.test.js`: registro con normalización, plataforma desconocida y token vacío rechazado.
- `test/pushToken.migration.test.js`: creación guardada, no recreación y rollback no destructivo.
- `npm test`: 50/50 (44 iniciales + 3 de servicio push + 3 de migración push). La suite de capacidad se integra en un PR independiente.

## Pendiente externo

- La app móvil debe enviar el token obtenido de Expo a este endpoint.
- El envío real de push requiere proveedor/configuración remota y un dispositivo; no se simuló.
