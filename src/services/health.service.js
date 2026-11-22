"use strict";

const { sequelize, Usuario, Ruta } = require("../models");

/**
 * Diagnóstico de sólo lectura para saber si el backend ve la base correcta.
 * Nunca devuelve credenciales, cadenas de conexión ni datos de usuarios.
 */
exports.verificarBase = async () => {
  const resultado = {
    conectada: false,
    tablas: { Usuarios: false, Rutas: false },
    usuarios: null,
    codigo: null,
  };

  try {
    await sequelize.authenticate();
    resultado.conectada = true;
  } catch (error) {
    resultado.codigo = "DB_SIN_CONEXION";
    return resultado;
  }

  const queryInterface = sequelize.getQueryInterface();
  const revisarTabla = async (modelo, clave) => {
    try {
      await queryInterface.describeTable(modelo.tableName);
      resultado.tablas[clave] = true;
    } catch (error) {
      resultado.tablas[clave] = false;
    }
  };

  await revisarTabla(Usuario, "Usuarios");
  await revisarTabla(Ruta, "Rutas");

  if (!resultado.tablas.Usuarios) {
    resultado.codigo = "TABLA_USUARIOS_AUSENTE";
    return resultado;
  }

  try {
    resultado.usuarios = await Usuario.count();
  } catch (error) {
    resultado.codigo = "CONSULTA_USUARIOS_FALLIDA";
  }

  if (!resultado.codigo && !resultado.tablas.Rutas) {
    resultado.codigo = "TABLA_RUTAS_AUSENTE";
  }

  return resultado;
};
