"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DispositivoPush extends Model {
    static associate(models) {
      DispositivoPush.belongsTo(models.Usuario, {
        foreignKey: "usuarioId",
        as: "usuario",
      });
    }
  }

  DispositivoPush.init(
    {
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      plataforma: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "desconocida",
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "DispositivoPush",
      tableName: "DispositivosPush",
    },
  );

  return DispositivoPush;
};
