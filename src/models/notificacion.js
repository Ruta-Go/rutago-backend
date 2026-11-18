"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notificacion extends Model {
    static associate(models) {
      Notificacion.belongsTo(models.Usuario, {
        foreignKey: "usuarioId",
        as: "usuario",
      });
      Notificacion.belongsTo(models.Viaje, {
        foreignKey: "viajeId",
        as: "viaje",
      });
    }
  }

  Notificacion.init(
    {
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      viajeId: { type: DataTypes.INTEGER, allowNull: true },
      tipo: { type: DataTypes.STRING(50), allowNull: false },
      titulo: { type: DataTypes.STRING(150), allowNull: false },
      mensaje: { type: DataTypes.TEXT, allowNull: false },
      datos: { type: DataTypes.TEXT, allowNull: true },
      leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Notificacion",
      tableName: "Notificaciones",
    },
  );

  return Notificacion;
};
