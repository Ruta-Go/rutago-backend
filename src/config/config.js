
require("dotenv").config();

/* El SSL es obligatorio en bases de datos alojadas (AWS RDS, Neon,
   Supabase...) pero no existe en un PostgreSQL local.

   Se decide SOLO segun el HOST, para que nadie tenga que configurar
   nada ni rompa su entorno al hacer pull:
     - HOST local (localhost / 127.0.0.1 / ::1) -> sin SSL
     - cualquier otro HOST (la nube)             -> con SSL

   DB_SSL=true / DB_SSL=false en el .env sirve como override explicito
   para los casos especiales (por ejemplo un Postgres local con SSL). */
const HOST_LOCAL = /^(localhost|127\.0\.0\.1|::1)$/i;

const esHostLocal = HOST_LOCAL.test(String(process.env.HOST || "").trim());

const usarSSL =
  process.env.DB_SSL === "true"
    ? true
    : process.env.DB_SSL === "false"
      ? false
      : !esHostLocal;

const opcionesConexion = usarSSL
  ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
  : {};

module.exports = {
  development: {
    username: process.env.USER_DB,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.HOST,
    port: parseInt(process.env.PORT_DB),
    dialect: "postgres",
    ...opcionesConexion,
    logging: false,
  },

  test: {
    username: process.env.USER_DB,
    password: process.env.DB_PASSWORD,
    database: "database_test",
    host: process.env.HOST,
    port: parseInt(process.env.PORT_DB),
    dialect: "postgres",
    ...opcionesConexion,
    logging: false,
  },

  production: {
    username: process.env.USER_DB,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.HOST,
    port: parseInt(process.env.PORT_DB),
    dialect: "postgres",
    ...opcionesConexion,
    logging: false,
  },
};
