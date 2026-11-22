# Staging local aislado de RutaGo

Este entorno existe para probar la app sin tocar la base de producción de Render, que tiene un único usuario real.

## Garantías de aislamiento

- Base dedicada: `rutago_staging_20261122` en el PostgreSQL local.
- Role dedicado: `rutago_staging_20261122`, sin permisos sobre `rutago_db`.
- Password de base y password demo generados localmente y guardados **fuera de los repositorios**, en `%LOCALAPPDATA%\Temp\opencode\rutago-staging\config.json`.
- El backend corre en `http://localhost:8083`; Render sigue en su URL y base originales.
- `scripts/seed-staging.js` rechaza ejecutarse si `NODE_ENV` no es `development` o si `DB_NAME` no contiene `staging`.
- Sólo se crean dos cuentas de demostración: **Conductor** y **Pasajero**. No se crea un usuario con rol Entidad ni Administrador.

## Preparación (ya ejecutada en este entorno)

1. Crear base y role con `setup-db.js` (fuera del repo). El script genera credenciales nuevas y no las imprime.
2. Generar `backend.env` con `make-env.js` (fuera del repo).
3. Cargar variables con `staging-env.ps1` y ejecutar:

```powershell
. 'C:\Users\Usuario\AppData\Local\Temp\opencode\rutago-staging\staging-env.ps1'
npx sequelize-cli db:migrate --env development
npm run seed:staging
```

4. Levantar el backend:

```powershell
. 'C:\Users\Usuario\AppData\Local\Temp\opencode\rutago-staging\staging-env.ps1'
npm start
```

## Cuentas demo

| Correo | Rol | Uso |
| --- | --- | --- |
| `demo.conductor@rutago.staging` | Conductor (2) | Panel del conductor, viajes asignados, GPS |
| `demo.pasajero@rutago.staging` | Pasajero (3) | Búsqueda de rutas, inscripción, notificaciones |

La contraseña se lee de `STAGING_DEMO_PASSWORD` en el archivo local; **no se versiona ni se muestra en logs**.

## Datos de prueba incluidos

- 106 barrios del catálogo migrado, más `La Marina` y `La 69` si faltaban.
- Dos rutas verificables con paradas reales del proyecto:
  - `Ruta 1 · La Marina`: Universidad → La Marina, con paradas La Marina, Miraflores, Juan 23 y El Porvenir.
  - `Ruta 2 · El Triunfo`: Universidad → El Triunfo, con paradas El Triunfo, La 69, Gran Colombiana y Nueva Granada.
- Horarios reales: `13:30`, `17:00`, `14:00` y `17:30`.
- Un vehículo `STG-001` con coordenadas tomadas del seed histórico del proyecto (no inventadas).
- Tres viajes: `BUSCANDO`, `ACEPTADO` y `EN_CURSO`, los dos últimos asignados al conductor demo.
- Inscripción del pasajero demo en el viaje en curso y dos notificaciones internas.

El seed es idempotente: repetirlo no duplica usuarios, rutas, horarios ni inscripciones.

## Verificación mínima

```powershell
. 'C:\Users\Usuario\AppData\Local\Temp\opencode\rutago-staging\staging-env.ps1'
node -e "require('./src/config'); console.log(process.env.DB_NAME)"
curl http://localhost:8083/api/health/db
```

`DB_NAME` debe ser `rutago_staging_20261122`. La llamada a `/api/health/db` debe devolver `conectada: true`.

## Reglas

1. Nunca ejecutar `npm run seed` ni `npm run seed:staging` con variables de Render o de `rutago_db`.
2. Nunca modificar el único usuario real de Render ni cargar datos de prueba allí.
3. Para apuntar el móvil a este entorno: `EXPO_PUBLIC_API_URL=http://<IP-LAN>:8083`.
4. Para restaurar el entorno, recrear sólo la base `rutago_staging_20261122`. No existe ningún comando de restauración que apunte a producción.
