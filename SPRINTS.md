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

## Verificación ejecutada

| Repositorio | Comando | Resultado |
| --- | --- | --- |
| `rutago-backend` | `npm test` | 18/18 pruebas correctas |
| `rutago-frontend` | `npm run lint` | 0 errores; warnings no bloqueantes de `exhaustive-deps` |
| `rutago-frontend` | `npx vite build --outDir <ruta-temporal>` | 1995 módulos transformados, sin errores |
| `rutago-mobile` | `npx tsc --noEmit` | Sin errores |
| `rutago-mobile` | `npx expo lint` | Sin errores |
| `rutago-mobile` | `npx expo export --platform web --output-dir <ruta-temporal>` | 7 rutas estáticas exportadas |
| Backend en vivo | `GET https://rutago-backend-a303.onrender.com/api/ping` | 200 |
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
8. **Diferidos:** GPS/WebSocket/PostGIS, notificaciones push, CI/CD con EAS y pantallas móviles de gestión avanzada (se indica que están en la web, sin simular éxito).

## Restricciones respetadas

- Sin `force push`, sin cambio de rama, sin borrado de ramas/archivos, sin `git reset --hard`, `git clean` ni stashes automáticos.
- Sin migraciones destructivas, `sync({ force: true })`, truncado de tablas ni seeds en producción.
- Sin modificar credenciales de producción ni infraestructura irreversible.
- Sin datos ficticios presentados como reales.

## Pendiente para el equipo / docente

1. **Rotar credenciales** del `.env` real revisado: deben considerarse expuestas. No se muestran valores en esta documentación.
2. **Definir URL backend definitiva** (Render vs VPS/dominio) y validar TLS del dominio `rutago.seminario1.eleueleo.com` desde el entorno de demo.
3. **Configurar proveedor de correo** (`EMAIL_API_KEY`, `EMAIL_FROM`, `PASSWORD_RESET_URL`) para el envío real; hoy el flujo está integrado pero no probado con correo.
4. **Ejecutar manualmente** los 4 checks de Fase 2 en el entorno desplegado.
5. **EAS build/submit** cuando se disponga de cuenta Expo y credenciales.

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
