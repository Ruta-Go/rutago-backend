# Evidencia de QA en staging local

Fecha: 2026-11-22. Entorno: base `rutago_staging_20261122`, backend `http://localhost:8083`. No se usó Render ni la base de producción.

## Resultado global

- `npm test`: **44/44 pruebas OK**, 0 fallos.
- E2E de API con las dos cuentas demo: **23/23 verificaciones OK**.
- Guard antiproducción del seed: **rechazado correctamente** con `NODE_ENV=production` y `DB_NAME=rutago_db` (`EXIT_CODE=1`).
- Seed idempotente: ejecutado dos veces; la segunda no duplicó usuarios ni viajes.

## Cuentas demo usadas

| Correo | Rol | Resultado de login |
| --- | --- | --- |
| `demo.conductor@rutago.staging` | Conductor (`rol.id = 2`) | `200`, token recibido |
| `demo.pasajero@rutago.staging` | Pasajero (`rol.id = 3`) | `200`, token recibido |

La contraseña se leyó de `STAGING_DEMO_PASSWORD` en un archivo local fuera de los repositorios; no se imprimió ni se versionó.

## Endpoints verificados

| Endpoint | Resultado |
| --- | --- |
| `GET /api/health/db` | `200`, `conectada=true`, `usuarios=2` |
| `POST /api/auth/login` (Conductor) | `200`, rol=Conductor |
| `POST /api/auth/login` (Pasajero) | `200`, rol=Pasajero |
| `GET /api/barrios` (páginas 1 y 2, 100 por página) | `200`, 106 barrios; 8/8 barrios esperados presentes |
| `GET /api/rutas/por-paradas?origen=Universidad del Pacífico&destino=La Marina` | `200`, 1 ruta: `Ruta 1 · La Marina`; horarios `13:30:00`, `17:00:00`; 4 paradas |
| `GET /api/rutas/por-paradas?origen=La Marina&destino=Universidad del Pacífico` | `200`, misma ruta y horarios |
| `GET /api/rutas/por-paradas?origen=Universidad del Pacífico&destino=El Triunfo` | `200`, 1 ruta: `Ruta 2 · El Triunfo`; horarios `14:00:00`, `17:30:00`; 4 paradas |
| `GET /api/rutas/por-paradas?origen=El Triunfo&destino=La 69` | `200`, misma ruta y horarios |
| `GET /api/viajes/disponibles` (Conductor) | `200`, 1 viaje disponible |
| `GET /api/viajes/me/mis-viajes` (Conductor) | `200`, 2 viajes asignados |
| `GET /api/viajes/disponibles-pasajero` (Pasajero) | `200`, 1 viaje disponible |
| `GET /api/notificaciones` (Pasajero) | `200`, 1 notificación |
| `GET /api/notificaciones/no-leidas` (Pasajero) | `200`, `total=1` |
| `GET /api/vehiculos` (Conductor) | `200`, placa `STG-001`, id `1` |
| `GET /api/vehiculos/1/ubicacion` (Conductor) | `200`, campos `id,placa,estadoId,latitud,longitud,ultimaActualizacion` |

## Notas

- El parsing del verificador se ajustó a la forma real de las respuestas (`data` como array y `data.total` en el contador de no leídas). No se modificó ningún endpoint de producción para adaptar la prueba.
- La validación de rol en el verificador usa `usuario.rol.id`, que es como el backend serializa el rol. El móvil ya normalizaba `usuario.rolId` y `usuario.rol.id`.
- GPS y notificaciones quedan verificados a nivel de API. La verificación en dispositivo sigue bloqueada por falta de dispositivo/cuenta Expo, y se documenta por separado.
- Offline: las 59 pruebas del suite móvil son evidencia anterior a esta ventana; no se re-ejecutaron aquí.
