
require("dotenv").config();

const configuracionSSL = {
  require: true,
  rejectUnauthorized: false,
};

module.exports = {
  development: {
    username: process.env.USER_DB,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.HOST,
    port: parseInt(process.env.PORT_DB),
    dialect: "postgres",
    dialectOptions: { ssl: configuracionSSL },
    logging: false,
  },

  test: {
    username: process.env.USER_DB,
    password: process.env.DB_PASSWORD,
    database: "database_test",
    host: process.env.HOST,
    port: parseInt(process.env.PORT_DB),
    dialect: "postgres",
    dialectOptions: { ssl: configuracionSSL },
    logging: false,
  },

  production: {
    username: process.env.USER_DB,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.HOST,
    port: parseInt(process.env.PORT_DB),
    dialect: "postgres",
    dialectOptions: { ssl: configuracionSSL },
    logging: false,
  },
};
