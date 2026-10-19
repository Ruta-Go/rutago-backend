
require("dotenv").config();

/* El SSL es obligatorio en bases de datos alojadas (AWS RDS, Neon,
   Supabase...) pero no existe en un PostgreSQL local.
   Por defecto el SSL queda ACTIVADO para no romper producción (Neon
   rechaza las conexiones sin SSL). Para desarrollo local se desactiva
   declarando DB_SSL=false en el archivo .env */
const opcionesConexion =
  process.env.DB_SSL === "false"
    ? {}
    : { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } };

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
