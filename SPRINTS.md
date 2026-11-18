# RutaGo · Sprints y cierre de integración

## Alcance

Cierre integral de RutaGo **sin reconstruir** el proyecto: se auditaron los tres repositorios, se alinearon estados Git, se corrigió seguridad de autenticación y permisos, se ajustaron los clientes web y móvil al contrato real del backend y se dejó documentación reproducible para la demostración académica.

## Tabla de cierre

| Sprint / Tarea | Repositorio | Resultado | Commit | Push |
| --- | --- | --- | --- | --- |
| Sprint 0 · Auditoría y alineación | `rutago-frontend` | `git merge --ff-only origin/main`: `ebb3e6e` → `acfbd5c` | Sin commit propio | No requerido |
| Sprint 0 · Backend / móvil | `rutago-backend`, `rutago-mobile` | Ramas alineadas con remoto; stash móvil `stash@{0}` revisado y **no aplicado** | — | No requerido |
| Sprint 1 / T1 · Seguridad de auth | `rutago-backend` | Rol forzado a `PASAJERO` en registro, contraseñas 8+letra+número, reset hasheado, refresh rechazado como access, rate limit, CORS/HSTS, `.env.example` | `9c6f292` | Sí |
| Sprint 1 / T3 · Propiedad y permisos | `rutago-backend` | Middleware `ownership` para conductores, vehículos, viajes y pasajeros; 6 pruebas nuevas | `e9dd736` | Sí (`0e0a7a9..e9dd736`) |
| Sprint 2 · Frontend | `rutago-frontend` | Recuperación/reset, cambio de contraseña, logout completo, guard reforzado, lint sin errores | `8d511f7` | Sí (`acfbd5c..8d511f7`) |
| Sprint 3 · Móvil | `rutago-mobile` | `EXPO_PUBLIC_API_URL`, envelope `{ success, data }`, sesión reactiva, roles reales, logout, deep link y contrato de `horarios` | `75c20e9` | Sí (`5fc2e97..75c20e9`) |
| Sprint 4 · Documentación y verificación | Los tres | READMEs, `SPRINTS.md`, `.env.example` y evidencia de pruebas | Docs finales | Sí |
| Sprint 5 · Auditoría final | Los tres | Sólo `.env.example` versionado, deploy sin generar `JWT_SECRET`, `npm ci` en CI web, CI móvil de tipos/lint | Auditoría final | Sí |
| Sprint 6 · Continuación | Los tres | Verificación en vivo: backend 200, dominio VPS vencido; chequeo de entorno sin secretos y configuración EAS preparada | Verificación final | Sí |
| Sprint 7 / T1 · Tiempo real y geoespacial | `rutago-backend` | WebSocket autenticado con salas autorizadas, GPS en tiempo real sobre REST existente, `POST /rutas/cercanas` con PostGIS/fallback JS | `46c5f1a` | No (restricción vigente) |
| Sprint 7 / T2 · Notificaciones internas | `rutago-backend` | Tabla aditiva, endpoints propios, eventos reales de viaje y difusión WebSocket | `b6e9512` | No (restricción vigente) |
| Sprint 7 / T3 · Móvil funcional | `rutago-mobile` | Mis viajes, Mis solicitudes, Mi perfil y Notificaciones conectados a API real + WebSocket; dashboard sin placeholders en esas opciones | `908eec5` | No (restricción vigente) |
| Sprint 7 / T4 · Mapa web en vivo | `rutago-frontend` | Posición inicial por REST y actualización por WebSocket en `/viajes/:id/mapa` | `d63db00` | No (restricción vigente) |

## Verificación ejecutada

| Repositorio | Comando | Resultado |
| --- | --- | --- |
| `rutago-backend` | `npm test` | 35/35 pruebas correctas (18 originales + 17 de tiempo real, GPS, geobúsqueda y notificaciones) |
| `rutago-frontend` | `npm run lint` | 0 errores; warnings no bloqueantes de `exhaustive-deps` |
| `rutago-frontend` | `npx vite build --outDir <ruta-temporal>` | 1995 módulos transformados, sin errores |
| `rutago-mobile` | `npx tsc --noEmit` | Sin errores |
| `rutago-mobile` | `npm run lint` | Sin errores (equivale a `npx expo lint`) |
| `rutago-mobile` | `npx expo export --platform web --output-dir <ruta-temporal>` | 14 bundles y 11 rutas estáticas exportadas, sin errores |
| Backend en vivo | `GET https://rutago-backend-a303.onrender.com/api/ping` | 200 |
| Frontend en vivo | `GET https://rutago.seminario1.eleueleo.com/` | Dominio vencido (Hostinger): los 4 checks de Fase 2 están bloqueados |
| Backend | `npm run check:env` | Valida variables sin imprimir valores |
| Los tres | `git ls-files` filtrado por `.env` | Sólo `.env.example` está versionado |
| Los tres | `git grep` de patrones de credenciales | Sin coincidencias reales |

No se generaron artefactos (`dist`, `web-build`) dentro de los repositorios.

## Decisiones técnicas

1. **Roles válidos:** `Administrador` (1), `Conductor` (2), `Pasajero` (3), `Entidad Externa` (4). El backend verifica siempre; el cliente nunca decide el rol en registro ni puede escalar.
2. **Contrato de respuesta:** las listas y detalles usan `{ success, data, message? }`. El móvil hace `unwrap` con `extraerDatos` / `extraerLista`.
3. **Recuperación:** token de un solo uso guardado como hash SHA-256. Resend vía `fetch`; sin `EMAIL_API_KEY` el modo desarrollo imprime el enlace en consola y producción responde 503. No se enviaron correos reales.
4. **Deep link móvil:** `rutagomobile://recuperar-password?token=...`, configurable con `PASSWORD_RESET_URL` en el backend.
5. **Horarios reales:** `GET /api/rutas/destino/:destino` devuelve `horarios: string[]`. El móvil muestra horas reales y **no inventa** placa, empresa ni estado de vehículo porque el DTO no los incluye.
6. **Sin secretos:** `.env` nunca se publicó ni se incluyó en commits. Las variables públicas son sólo `VITE_API_URL` y `EXPO_PUBLIC_API_URL`.
7. **CI/CD:** deploy web con `npm ci`; el script de producción ya **no genera** `JWT_SECRET` automáticamente (falla con mensaje si falta). El móvil tiene CI de `tsc`/lint; EAS build/submit sigue pendiente de credenciales.
8. **Tiempo real implementado:** se reutiliza el REST de GPS existente; `/ws` sólo difunde eventos, y `rutaGeometria` ya existente evita migraciones espaciales. PostGIS se usa si la extensión está disponible; si no, se calcula haversine y se reporta el motor. Las notificaciones son internas (BD + WebSocket), no push del SO. Siguen diferidos EAS, push real y pantallas móviles de gestión avanzada.
9. **Estado del dominio:** `rutago.seminario1.eleueleo.com` responde con la página de dominio vencido de Hostinger; por eso no se pueden ejecutar los 4 checks de Fase 2 en vivo. El backend de Render sigue en 200. Renovar el dominio o publicar el frontend en otra URL antes de la demo.

## Restricciones respetadas

- Sin `force push`, sin cambio de rama, sin borrado de ramas/archivos, sin `git reset --hard`, `git clean` ni stashes automáticos.
- Sin migraciones destructivas, `sync({ force: true })`, truncado de tablas ni seeds en producción.
- Sin modificar credenciales de producción ni infraestructura irreversible.
- Sin datos ficticios presentados como reales.

## Pendiente para el equipo / docente

1. **Rotar credenciales** del `.env` real revisado: deben considerarse expuestas. No se muestran valores en esta documentación.
2. **Renovar el dominio** `rutago.seminario1.eleueleo.com` o definir otra URL del frontend; hoy responde "domain expired" y bloquea los checks en vivo.
3. **Configurar proveedor de correo** (`EMAIL_API_KEY`, `EMAIL_FROM`, `PASSWORD_RESET_URL`) para el envío real; hoy el flujo está integrado pero no probado con correo.
4. **Ejecutar los 4 checks de Fase 2** una vez el frontend esté accesible (requiere credenciales de prueba).
5. **EAS build/submit** cuando se disponga de cuenta Expo y credenciales.
6. **Ejecutar** `npx eas-cli init` **y configurar la cuenta Expo** antes de usar `eas.json`.

## Comandos de push

```bash
# Backend (rama main)
cd C:\Users\Usuario\OneDrive\Escritorio\RUTAGO\rutago-backend
git push origin main

# Frontend (rama main)
cd C:\Users\Usuario\OneDrive\Escritorio\RUTAGO\rutago-frontend
git push origin main

# Móvil (rama feature-ASEG1999)
cd C:\Users\Usuario\OneDrive\Escritorio\RUTAGO\rutago-mobile
git push origin feature-ASEG1999
```
