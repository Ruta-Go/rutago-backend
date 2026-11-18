# [**RutaGo**](https://rutago.seminario1.eleueleo.com/) - Backend

![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?style=flat&logo=sequelize)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=jsonwebtoken)
![Zod](https://img.shields.io/badge/Zod-3.23-3E67B1?style=flat&logo=zod)

Backend del proyecto RutaGo

## 📑 Tabla de Contenido

- [Integrantes](#integrantes)
- [Tecnologías](#tecnologias)
- [Requisitos previos](#requisitos-previos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Scripts disponibles](#scripts-disponibles)
- [Arquitectura](#arquitectura)
- [URLs activas](#urls-activas)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Roles del sistema](#roles-del-sistema)
- [Instalación](#instalación)
- [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
- [Base de datos con Sequelize](#base-de-datos-con-sequelize)
- [API Endpoints](#api-endpoints)
- [Ejecución](#ejecución)
- [Estado del Proyecto](#estado-del-proyecto)
- [Checklist de Evaluación](#checklist-de-evaluación--fase-2)
- [Enlaces](#enlaces)

---

## Integrantes:

Cristian David Garcia Valderrama.<br>
Jhon Edwar Suarez Quiñonez.<br>
Sebastian Guapi Andrade<br>
Stefany Potosi Reyes<br>
Angel Santiago Estupiñan Gomez<br>

---

<a id="tecnologias"></a>

## 🛠️ Tecnologías

- ⚙️ **Node.js 18** + **Express 4.21** — Framework backend
- 🗄️ **Sequelize 6** + **PostgreSQL 16** — ORM y persistencia
- 🔐 **JWT** + **bcrypt** — Autenticación y hash
- ✅ **Zod** — Validación de schemas
- 🛡️ **express-rate-limit** — Seguridad y rate limiting

---

<a id="requisitos-previos"></a>

## 📋 Requisitos previos

- Node.js >= 18
- PostgreSQL >= 16
- npm o yarn

---

<a id="estructura-del-proyecto"></a>

## 📁 Estructura del proyecto

```
rutago-backend/
├── .github/
│   ├── workflows/          # GitHub Actions (blank.yml)
│   └── scripts/            # Scripts de deploy
├── scripts/                # Scripts auxiliares (migrate-mysql-to-pg.js)
├── src/
│   ├── config/             # Configuración (DB, Zod, estados)
│   ├── controllers/        # Controladores por módulo
│   ├── dtos/               # DTOs de respuesta
│   ├── helpers/            # Utilidades (paginación)
│   ├── middlewares/        # Auth, role y validación Zod
│   ├── migrations/         # Migraciones Sequelize (estructura + catálogos)
│   ├── models/             # Modelos Sequelize
│   ├── repositories/       # Capa de acceso a datos
│   ├── routes/             # Definición de rutas
│   ├── schemas/            # Schemas de validación Zod
│   ├── services/           # Lógica de negocio
│   └── index.js            # Punto de entrada
├── .env                    # Variables de entorno
├── .env.example            # Plantilla de variables de entorno
├── .gitignore
├── .sequelizerc            # Configuración Sequelize CLI
├── package.json
└── README.md
```

---

<a id="scripts-disponibles"></a>

## 📦 Scripts disponibles

```bash
npm start          # Iniciar servidor (producción)
npm run dev        # Iniciar con nodemon (desarrollo)
npm test           # Pruebas unitarias con Jest (18/18)
```

---

<a id="arquitectura"></a>

## 🏗️ Arquitectura

```
Cliente (Navegador)
      │
      ▼
Frontend (React + Vite)
  ─── https://rutago.seminario1.eleueleo.com/
      │
      ▼  (proxy /api)
Backend (Express.js + Sequelize)
  ─── https://rutago.seminario1.eleueleo.com/api
      │
      ▼
PostgreSQL 16
```

El frontend se sirve desde el mismo dominio VPS. Las peticiones a `/api` son redirigidas al backend mediante un proxy reverso (Nginx/systemd). El backend gestiona autenticación JWT, roles y operaciones CRUD con paginación, búsqueda y ordenamiento.

---

<a id="urls-activas"></a>

## 🔗 URLs activas

| Servicio            | URL                                                  | Verificación                 |
| ------------------- | ---------------------------------------------------- | ---------------------------- |
| Frontend (VPS)      | https://rutago.seminario1.eleueleo.com/              | Dominio vencido (Hostinger) — no disponible |
| Backend (Render)    | https://rutago-backend-a303.onrender.com/api         | `GET /api/ping` → 200          |
| Backend (VPS, proxy)| https://rutago.seminario1.eleueleo.com/api           | Dominio vencido (Hostinger) — no disponible |
| Swagger             | http://localhost:8082/api/docs (solo local)          | —                            |

Verificación local: npm run check:env valida las variables obligatorias sin imprimir valores.

La URL definitiva de producción debe acordarse entre Render y el VPS/dominio. El móvil usa `EXPO_PUBLIC_API_URL` para apuntar al backend elegido.

---

<a id="usuarios-de-prueba"></a>

## 👥 Usuarios de prueba

| Rol             | Correo               | Contraseña           |
| --------------- | -------------------- | -------------------- |
| Administrador   | admin@rutago.com     | admin123456          |
| Conductor       | conductor@rutago.com | conductor123456      |
| Pasajero        | pasajero@rutago.com  | pasajero123456       |
| Entidad Externa | entidad@rutago.com   | entidadExterna123456 |

---

<a id="roles-del-sistema"></a>

## 👥 Roles del sistema

| ID  | Nombre          | Descripción                         |
| --- | --------------- | ----------------------------------- |
| 1   | Administrador   | Acceso completo a todos los módulos |
| 2   | Conductor       | Gestiona viajes, ve perfil          |
| 3   | Pasajero        | Consulta rutas y horarios           |
| 4   | Entidad Externa | Gestiona vehículos de su entidad    |

<a id="instalacion"></a>

## ⚙️ Instalación

```bash
# Instalar dependencias
npm install
```

<a id="configuracion-de-variables-de-entorno"></a>

## 🔧 Configuración de variables de entorno

El archivo `.env` debe estar en la raíz del backend. Ejemplo mínimo (ver `.env.example`):

```env
PORT=8082
API_URL=http://localhost:8082
HOST=localhost
PORT_DB=5432
USER_DB=postgres
DB_PASSWORD=tu_contrasena_segura
DB_NAME=rutago_db
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu_clave_super_secreta
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Recuperación de contraseña (producción requiere proveedor)
EMAIL_API_KEY=tu_api_key_de_resend
EMAIL_FROM=RutaGo <no-responder@tu-dominio.com>
PASSWORD_RESET_URL=http://localhost:5173/recuperar-password
# Para deep link móvil: rutagomobile://recuperar-password
```

Opcional — solo si se migrarán datos históricos desde una base MySQL previa:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=usuario_mysql
MYSQL_PASSWORD=clave_mysql
MYSQL_DB=nombre_bd_mysql
```

<a id="base-de-datos-con-sequelize"></a>

## 🗄️ Base de datos con Sequelize

Las migraciones crean las tablas **y** los catálogos (roles, comunas, barrios, estados, tipos de documento) en una sola corrida.

### Migraciones

```bash
# Ejecutar todas las migraciones pendientes
npx sequelize-cli db:migrate

# Deshacer la ultima migracion
npx sequelize-cli db:migrate:undo

# Deshacer una migracion especifica
npx sequelize-cli db:migrate:undo --name 20260704000001-create-estados-vehiculo.js
```

> `20261118000001-create-notificaciones.js` es **aditiva**: crea `Notificaciones` sólo si no existe,
> no altera tablas con datos y su `down` está deliberadamente inactivo para no borrar historial.
> No se ejecutó contra producción durante este desarrollo.

### Migración de datos históricos (opcional)

Si existe una base MySQL previa, el script `scripts/migrate-mysql-to-pg.js` copia los datos históricos a PostgreSQL de forma idempotente (no duplica registros).

```bash
node scripts/migrate-mysql-to-pg.js
```

### Orden recomendado al clonar el proyecto por primera vez

```bash
npm install
npx sequelize-cli db:migrate
node scripts/migrate-mysql-to-pg.js   # opcional, solo si hay MySQL previo
npm start
```

<a id="api-endpoints"></a>

## 🌐 API Endpoints

### Autenticación

| Método | Ruta                               | Descripción                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| POST   | /api/auth/login                    | Iniciar sesión                                |
| POST   | /api/auth/refresh                  | Renovar access token con refresh token        |
| GET    | /api/auth/verificar-token          | Verificar validez del access token            |
| POST   | /api/usuarios/registro             | Registrar usuario (siempre rol `PASAJERO`)    |
| POST   | /api/usuarios/recuperar-contrasena | Solicitar enlace de recuperación              |
| POST   | /api/usuarios/cambiar-contrasena   | Restablecer contraseña con token de un solo uso |

Todas las respuestas usan el sobre `{ "success": boolean, "data"?: ..., "message"?: string }`. El token de recuperación se guarda hasheado (SHA-256) y el enlace se construye con `PASSWORD_RESET_URL` o `FRONTEND_URL`.

### Usuarios

| Método | Ruta                          | Roles | Descripción                               |
| ------ | ----------------------------- | ----- | ----------------------------------------- |
| GET    | /api/usuarios                 | Admin | Listar usuarios                           |
| GET    | /api/usuarios/:id             | Admin | Obtener usuario por ID                    |
| POST   | /api/usuarios                 | Admin | Crear usuario                             |
| PUT    | /api/usuarios/:id             | Admin | Actualizar usuario                        |
| DELETE | /api/usuarios/:id             | Admin | Eliminar usuario                          |
| GET    | /api/usuarios/me/perfil       | Auth  | Obtener perfil del usuario autenticado    |
| PUT    | /api/usuarios/me/perfil       | Auth  | Actualizar perfil del usuario autenticado |
| PUT    | /api/usuarios/me/contrasena   | Auth  | Cambiar contraseña autenticado            |
| PUT    | /api/usuarios/:id/rol         | Admin | Cambiar rol de un usuario                 |

### Vehículos

| Método | Ruta                         | Roles         | Descripción                  |
| ------ | ---------------------------- | ------------- | ---------------------------- |
| GET    | /api/vehiculos               | Auth          | Listar (filtro por estadoId) |
| GET    | /api/vehiculos/:id           | Auth          | Obtener vehículo             |
| GET    | /api/vehiculos/:id/ubicacion | Auth          | Obtener ubicación            |
| POST   | /api/vehiculos               | Admin/Entidad | Crear vehículo               |
| PUT    | /api/vehiculos/:id           | Admin/Entidad | Actualizar vehículo          |
| PUT    | /api/vehiculos/:id/ubicacion | Conductor     | Actualizar ubicación         |
| DELETE | /api/vehiculos/:id           | Admin/Entidad | Eliminar vehículo            |

### Conductores, Pasajeros, Entidades

| Método | Ruta                                  | Roles | Descripción                          |
| ------ | ------------------------------------- | ----- | ------------------------------------ |
| GET    | /api/conductores                      | Admin | Listar conductores                   |
| GET    | /api/conductores/me/perfil            | Cond. | Obtener mi perfil de conductor       |
| PUT    | /api/conductores/me/perfil            | Cond. | Actualizar mi perfil de conductor    |
| PATCH  | /api/conductores/:id/estado           | Admin | Cambiar estado del conductor         |
| POST   | /api/conductores/crear-con-usuario    | Admin | Crear conductor con usuario nuevo    |
| GET    | /api/pasajeros                        | Admin | Listar pasajeros                     |
| GET    | /api/pasajeros/me/perfil              | Pasaj. | Obtener mi perfil de pasajero        |
| PUT    | /api/pasajeros/me/perfil              | Pasaj. | Actualizar mi perfil de pasajero     |
| POST   | /api/pasajeros/crear-con-usuario      | Admin | Crear pasajero con usuario nuevo     |
| GET    | /api/entidades                        | Admin | Listar entidades                     |
| GET    | /api/entidades/me/perfil              | Entid. | Obtener mi perfil de entidad         |
| PUT    | /api/entidades/me/perfil              | Entid. | Actualizar mi perfil de entidad      |
| POST   | /api/entidades/crear-con-usuario      | Admin | Crear entidad con usuario nuevo      |

### Catálogos

| Método | Ruta                   | Roles | Descripción                 |
| ------ | ---------------------- | ----- | --------------------------- |
| GET    | /api/estados-vehiculo  | Auth  | Listar estados de vehículo  |
| GET    | /api/estados-conductor | Auth  | Listar estados de conductor |
| GET    | /api/estados-viaje     | Auth  | Listar estados de viaje     |
| GET    | /api/tipos-documento   | Auth  | Listar tipos de documento   |

### Rutas, Horarios, Barrios, Comunas

Siguen el mismo patrón CRUD con paginación, búsqueda (`q`) y ordenamiento (`sortBy`, `sortOrder`).

| Recurso  | Ruta base     | Roles permitidos |
| -------- | ------------- | ---------------- |
| Rutas    | /api/rutas    | Admin            |
| Horarios | /api/horarios | Admin            |
| Barrios  | /api/barrios  | Admin            |
| Comunas  | /api/comunas  | Admin            |

Endpoints destacados adicionales:

| Método | Ruta                               | Roles | Descripción              |
| ------ | ---------------------------------- | ----- | ------------------------ |
| GET    | /api/rutas/destino/:destino        | Auth  | Buscar rutas por destino |
| POST   | /api/rutas/cercanas                | Auth  | Rutas por distancia real a una coordenada |
| GET    | /api/horarios/ruta/:rutaId         | Auth  | Horarios de una ruta     |
| GET    | /api/horarios/vehiculo/:vehiculoId | Auth  | Horarios de un vehículo  |

### Viajes

| Método | Ruta                   | Roles      | Descripción                       |
| ------ | ---------------------- | ---------- | --------------------------------- |
| GET    | /api/viajes            | Admin      | Listar viajes                     |
| GET    | /api/viajes/:id        | Auth       | Obtener viaje por ID              |
| POST   | /api/viajes            | Auth       | Crear viaje                       |
| PUT    | /api/viajes/:id        | Admin      | Actualizar viaje                  |
| DELETE | /api/viajes/:id        | Admin      | Eliminar viaje                    |
| PATCH  | /api/viajes/:id/estado | Admin/Cond | Cambiar estado del viaje          |
| POST   | /api/viajes/:id/unirse | Pasajero   | Unirse a un viaje como pasajero   |
| GET    | /api/viajes/me/mis-viajes | Auth     | Obtener viajes del usuario actual |

### Notificaciones internas

| Método | Ruta                          | Roles  | Descripción                                  |
| ------ | ----------------------------- | ------ | -------------------------------------------- |
| GET    | /api/notificaciones           | Auth   | Notificaciones propias (`?soloNoLeidas=true`) |
| GET    | /api/notificaciones/no-leidas | Auth   | Cantidad de no leídas                        |
| PATCH  | /api/notificaciones/:id/leida | Auth   | Marcar como leída (sólo la propia)           |
| POST   | /api/notificaciones           | Admin  | Crear una notificación real para un usuario  |

Se generan automáticamente, a partir de hechos reales del sistema: al aceptarse/iniciarse/finalizarse/cancelarse un viaje se avisa a los participantes (excluyendo a quien ejecuta la acción), y al unirse un pasajero se avisa al conductor. Cada alta se persiste y además se difunde por WebSocket como `notificacion`. No hay correos ni push del sistema operativo: eso seguiría dependiendo de credenciales externas.

### Tiempo real y geoespacial

El seguimiento no duplica el REST de GPS ya existente (`GET/PUT /api/vehiculos/:id/ubicacion`).
Sólo agrega difusión en tiempo real y búsqueda por proximidad sobre `Rutas.rutaGeometria`
(columna `TEXT` con GeoJSON que ya existe, sin migraciones nuevas):

- **WebSocket autenticado:** `ws(s)://<host>/ws?token=<accessToken>`. Se rechaza refresh token,
  token inválido y usuario inactivo. El rol se vuelve a leer de la BD en el handshake.
- **Salas autorizadas:** `usuario:<id>` (sólo el propio), `rol:<id>` (sólo el propio),
  `vehiculo:<id>` y `viaje:<id>` (según propiedad real en BD: conductor asignado,
  pasajero inscrito, entidad propietaria o administrador).
- **Mensajes del cliente:** `{ "tipo": "suscribirse", "sala": "viaje:12" }` y
  `{ "tipo": "desuscribirse", "sala": "viaje:12" }`.
- **Eventos del servidor:** `conectado`, `suscrito`, `desuscrito`, `error`,
  `ubicacion`, `notificacion` y `notificacion_leida`.
- **GPS real:** cada `PUT /api/vehiculos/:id/ubicacion` persiste latitud, longitud,
  velocidad y fecha, y publica el evento `ubicacion` a la sala del vehículo y del viaje activo.
  Si no hay viaje activo, no se inventa receptor: el evento queda sólo en la sala del vehículo.
- **`POST /api/rutas/cercanas`:** body `{ latitud, longitud, radioMetros?, limite? }`.
  Usa PostGIS (`ST_DWithin` + `ST_Distance`) cuando la extensión está instalada; si no, calcula
  distancia haversine sobre el GeoJSON guardado. La respuesta indica `motor: "postgis"` o
  `"javascript"` para no confundir al cliente. No se ejecuta `CREATE EXTENSION` automáticamente:
  si se quiere PostGIS, el administrador de BD debe habilitarlo fuera de la aplicación.

---

<a id="ejecucion"></a>

## 🚀 Ejecución

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

---

<a id="cicd-y-deploy"></a>

## 🚀 CI/CD y Deploy

### Workflow

`.github/workflows/blank.yml`

### Flujo de despliegue automático

```
Push a main
     ↓
Checkout código
     ↓
Conexión SSH al VPS
     ↓
git pull --ff-only origin main
     ↓
npm ci --include=dev
     ↓
Ejecutar migraciones (npx sequelize-cli db:migrate)
     ↓
Migrar datos históricos desde MySQL (scripts/migrate-mysql-to-pg.js)
     ↓
npm prune --omit=dev
     ↓
sudo systemctl restart rutago.service
```

El pipeline ejecuta migraciones (estructura + catálogos) automáticamente antes de reiniciar el servicio, garantizando que la base de datos esté siempre actualizada en producción. Los datos históricos se copian desde la base MySQL previa si está disponible.

---

<a id="estado-del-proyecto"></a>

## 📊 Estado del Proyecto

### ✅ Completado

- Sistema de autenticación con JWT (login, registro, verificación de token, refresh).
- Seguridad reforzada: rol asignado por servidor en registro, contraseñas 8+letra+número,
  tokens de recuperación hasheados, refresh rechazado como access, rate limit en `/auth/refresh`,
  CORS con trim y HSTS en producción.
- Verificación de propiedad en conductores, vehículos, viajes y pasajeros (middleware `ownership`).
- Roles: Administrador, Conductor, Pasajero, Entidad Externa.
- Validación de entrada con Zod (schemas + middleware).
- Catálogos dinámicos desde BD: estados de vehículo, conductor, viaje y tipos de documento.
- CRUD completo con paginación, búsqueda (`q`) y ordenamiento (`sortBy`/`sortOrder`) en 10 módulos: Usuarios, Vehículos, Rutas, Horarios, Conductores, Pasajeros, Entidades, Barrios, Comunas, Viajes.
- Datos reales de Buenaventura (12 comunas, 104 barrios).
- Migraciones con Sequelize (estructura + catálogos), ejecutadas automáticamente en el pipeline de deploy.
- Migración de datos históricos de MySQL a PostgreSQL (scripts/migrate-mysql-to-pg.js).
- CI/CD con GitHub Actions: despliegue automático al hacer push a `main`.
- Actualización y reinicio automático del servicio (systemctl) en el VPS.
- Protección de rutas por rol (middleware `roleMiddleware`).
- Página 403 (Acceso Denegado) para usuarios sin rol permitido.
- Logout con reemplazo de historial (evita volver atrás con el navegador).
- Dashboard modular con componentes separados por rol.
- API REST documentada con todos los endpoints.
- WebSocket autenticado en `/ws` con salas autorizadas por propiedad real en BD.
- Difusión en tiempo real de la ubicación reportada por conductores (`evento ubicacion`).
- Búsqueda de rutas cercanas con PostGIS cuando está disponible y fallback real en JavaScript.
- Notificaciones internas persistentes con eventos reales de viajes y difusión por WebSocket.

### 🚧 En desarrollo

- Geometrías espaciales de comunas/barrios y puntos de vehículos en PostGIS (requiere decisión de infraestructura; no se ejecuta contra producción).

### 📌 Pendiente

- Push del sistema operativo / correo de notificaciones: requiere proveedor y credenciales externas; no se simula.
- Habilitar PostGIS en la BD de destino si se quiere el motor `postgis`; sin él funciona el motor `javascript`.

---

<a id="checklist-de-evaluacion--fase-2"></a>

## ✅ Checklist de Evaluación — Fase 2

### Pruebas Funcionales en Vivo

- [ ] **Verificación de Rutas**: Al ingresar directamente a `/admin` sin autenticar, el sistema redirige al Login.
- [ ] **Prueba de Roles**: Al loguearse con un usuario no-admin, el sistema bloquea el acceso a `/admin` mostrando error 403.
- [ ] **Lectura Transaccional**: El panel administrativo carga datos dinámicos de al menos dos tablas transaccionales.
- [ ] **Cierre de Sesión Efectivo**: Al cerrar sesión, el token se destruye en cliente y no se puede volver atrás con el navegador.

### Pruebas de Despliegue y Automatización

- [ ] **Despliegue por Git**: Último cambio en producción realizado mediante GitHub Actions.
- [ ] **Consistencia de Base de Datos**: Migraciones ejecutadas exitosamente en el pipeline de deploy.
- [ ] **Validación de Documentación**: README con arquitectura, URLs activas y usuarios de prueba.

---

## 🧪 Evidencia de cierre (Sprint 4)

- [x] `npm test` → 35 pruebas, 35 correctas (incluye WebSocket, GPS, geobúsqueda y notificaciones).
- [x] Commits locales de tiempo real/geoespacial y notificaciones sin push (restricción vigente).
- [x] `git push origin main` desde `rutago-backend` (commits `9c6f292`, `e9dd736`, docs finales).
- [x] `GET https://rutago-backend-a303.onrender.com/api/ping` → 200.
- [ ] Verificación manual en vivo de los 4 checks de Fase 2: bloqueada porque el dominio del frontend está vencido.

> Seguridad operativa: el `.env` real revisado contiene credenciales que deben considerarse
> expuestas. Rotarlas de forma coordinada sin publicar valores.

---

<a id="enlaces"></a>

## 🔗 Enlaces

[SPRINTS.md](SPRINTS.md) · [Frontend](https://github.com/Ruta-Go/rutago-frontend) · [Móvil](https://github.com/Ruta-Go/rutago-mobile) · [Trello](https://trello.com/b/zR4MFcBH)


