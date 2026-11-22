# Diagnóstico de autenticación en Render

## Hallazgo real (22 de noviembre de 2026)

- `GET https://rutago-backend-a303.onrender.com/api/ping` responde `200`.
- `POST /api/auth/login` responde `500 {"success":false,"message":"Error interno del servidor"}` para **todos** los roles probados: pasajero, conductor, administrador, entidad, correo inexistente y contraseña incorrecta.
- El mismo código ejecutado contra la base local autentica correctamente a `conductor1@rutago.com` y `pasajero1@rutago.com`; un correo inexistente devuelve `CREDENCIALES_INVALIDAS`.
- La configuración local usa un host de base de datos local, por lo que **no es la misma base que consulta Render**.
- No hay token de Render ni credenciales del servicio en el entorno disponible; por eso no es posible leer logs, variables ni ejecutar migraciones allí sin acceso.

## Causa más probable

Como `/api/ping` funciona, el proceso arranca y la validación de variables de entorno pasa. El error `500` en todas las variantes de login indica que falla la consulta a la base antes de comparar contraseñas. Las causas candidatas son:

1. La base PostgreSQL de Render no tiene las tablas `Usuarios`/`Rutas` (migraciones no ejecutadas).
2. Las variables `HOST`, `PORT_DB`, `USER_DB`, `DB_PASSWORD` o `DB_NAME` apuntan a otra base o son inválidas.
3. La base está dormida o rechaza conexiones en el momento del login.

La app móvil no está usando una URL antigua: `src/services/api.ts` tiene como fallback exactamente `https://rutago-backend-a303.onrender.com` y agrega `/api`.

## Endpoint de diagnóstico agregado

`GET /api/health/db` es público y de sólo lectura. No devuelve secretos, cadenas de conexión ni datos personales.

Respuesta esperada cuando la base es correcta:

```json
{
  "success": true,
  "conectada": true,
  "tablas": { "Usuarios": true, "Rutas": true },
  "usuarios": 10,
  "codigo": null
}
```

Códigos posibles cuando falla:

- `DB_SIN_CONEXION`
- `TABLA_USUARIOS_AUSENTE`
- `TABLA_RUTAS_AUSENTE`
- `CONSULTA_USUARIOS_FALLIDA`

## Procedimiento pendiente (requiere acceso a Render)

1. Confirmar qué repositorio y rama tiene conectados el servicio: `Ruta-Go/rutago-backend`, rama `main`.
2. Confirmar el commit desplegado y la fecha del último deploy.
3. Revisar las variables de entorno del servicio sin copiar sus valores.
4. Verificar el servicio PostgreSQL asociado y que esté activo.
5. Ejecutar migraciones en Render:

   ```bash
   npm run migrate
   ```

6. Repetir `GET /api/health/db` y `POST /api/auth/login` con `conductor1@rutago.com`.
7. Sólo si es un entorno de staging o pruebas autorizado, ejecutar `npm run seed`. **No cargar usuarios de prueba en producción sin autorización expresa.**

## Evidencia de despliegue posterior al PR #36

- `origin/main` está en `75cf9d90493888bc83bf62035868fc65839f5a88` e incluye `/api/health/db` y `/api/rutas/por-paradas`.
- El workflow de deploy `45056075852` terminó en `failure`; el paso fallido fue **Verificar conexión SSH**, por lo que **Ejecutar despliegue** ni siquiera corrió. El workflow usa `secrets.PASSWORD_SSH`, `secrets.HOST`, `secrets.USER_NAME_RUTA_GO` y `secrets.SSH_PORT`; sin acceso a esos secretos no es posible distinguir entre clave vencida, host inalcanzable o puerto cambiado.
- `GET https://rutago-backend-a303.onrender.com/api/health/db` devuelve `404`, así que Render todavía no está sirviendo el código del PR #36. `/api/ping` sí responde `200`, pero corresponde a la versión anterior.
- En consecuencia, el `500` del login en Render sigue sin poder diagnosticarse con el endpoint nuevo hasta que el equipo corrija el despliegue o confirme el repositorio/rama conectados al servicio de Render.

## Actualización: Render sí desplegó el código nuevo

- Poco después, `GET https://rutago-backend-a303.onrender.com/api/health/db` pasó a responder `200`:
  `{"success":true,"conectada":true,"tablas":{"Usuarios":true,"Rutas":true},"usuarios":1,"codigo":null}`.
- El workflow fallido `45060658869`/`45056075852` pertenece al despliegue por SSH a un VPS; Render tiene su propio auto-deploy desde GitHub y ese sí incorporó el PR #36.
- `POST /api/auth/login` con un correo inexistente ahora devuelve `401 {"success":false,"message":"Correo o contraseña incorrectos."}` en lugar del `500` anterior. El error interno del login quedó resuelto por el despliegue del código diagnóstico/corregido.
- La base de producción informa **1 solo usuario** y las tablas requeridas existen. Por eso las credenciales del seed local no pueden funcionar allí: **no se cargaron usuarios de prueba en producción**. Si el equipo necesita una cuenta de demostración, debe autorizar explícitamente su creación o un seed controlado en un entorno de staging.

## Estado de seed y migraciones

- Existe la migración formal `src/migrations/20260727000000-add-costo-to-ruta.js`, que agrega `costo DECIMAL(10,2)` a `Rutas` de forma aditiva.
- Existe `src/migrations/20260726000000-reset-secuencias-catalogos.js` para las secuencias corregidas.
- `scripts/seed.js` usa `findOrCreate`: repetirlo no duplica registros. No actualiza contraseñas de usuarios ya existentes, así que nunca debe usarse para "arreglar" un login.

## Rutas barrio ↔ Universidad

- La sede de la Universidad del Pacífico está documentada en Wikimedia Commons en el barrio El Triunfo, Kilómetro 13, vía al Aeropuerto.
- El seed registra las cuatro rutas con origen en la universidad y descripción `Universidad - Barrio ...`.
- `GET /api/rutas/por-paradas?origen=...&destino=...` usa las paradas reales de `RutaBarrio` y reconoce alias de la Universidad del Pacífico, sin inventar recorridos ni coordenadas.
