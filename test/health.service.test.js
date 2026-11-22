"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

require("./setup-env");
const { sequelize, Usuario } = require("../src/models");
const healthService = require("../src/services/health.service");

test("el diagnóstico reporta conexión y tablas sin exponer secretos", async () => {
  const autenticarOriginal = sequelize.authenticate;
  const interfazOriginal = sequelize.getQueryInterface;
  const contarOriginal = Usuario.count;

  sequelize.authenticate = async () => undefined;
  Usuario.count = async () => 10;
  sequelize.getQueryInterface = () => ({
    describeTable: async (nombre) => {
      if (!["Usuarios", "Rutas"].includes(nombre)) {
        throw new Error("tabla inexistente");
      }
      return {};
    },
  });

  try {
    const estado = await healthService.verificarBase();

    assert.equal(estado.conectada, true);
    assert.equal(estado.tablas.Usuarios, true);
    assert.equal(estado.tablas.Rutas, true);
    assert.equal(estado.usuarios, 10);

    const texto = JSON.stringify(estado);
    for (const clave of ["password", "DB_PASSWORD", "JWT_SECRET", "HOST"]) {
      assert.equal(texto.includes(clave), false);
    }
  } finally {
    sequelize.authenticate = autenticarOriginal;
    sequelize.getQueryInterface = interfazOriginal;
    Usuario.count = contarOriginal;
  }
});

test("el diagnóstico marca código cuando no hay conexión", async () => {
  const autenticarOriginal = sequelize.authenticate;
  sequelize.authenticate = async () => {
    throw new Error("sin conexión");
  };

  try {
    const estado = await healthService.verificarBase();
    assert.equal(estado.conectada, false);
    assert.equal(estado.codigo, "DB_SIN_CONEXION");
    assert.equal(estado.tablas.Usuarios, false);
  } finally {
    sequelize.authenticate = autenticarOriginal;
  }
});
