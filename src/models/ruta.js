"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Ruta extends Model {
    static associate(models) {
      Ruta.belongsTo(models.Comuna, { foreignKey: "origenId", as: "origen" });
      Ruta.belongsTo(models.Comuna, { foreignKey: "destinoId", as: "destino" });
      Ruta.belongsToMany(models.Barrio, {
        through: models.RutaBarrio,
        foreignKey: "rutaId",
        otherKey: "barrioId",
        as: "barrios",
      });

      Ruta.hasMany(models.RutaBarrio, {
        foreignKey: "rutaId",
        as: "rutaBarrios",
      });
      Ruta.hasMany(models.Horario, { foreignKey: "rutaId", as: "horarios" });
    }
  }
  Ruta.init(
    {
      nombre: { type: DataTypes.STRING, allowNull: false },
      origenId: { type: DataTypes.INTEGER, allowNull: false },
      destinoId: { type: DataTypes.INTEGER, allowNull: false },
      descripcion: DataTypes.TEXT,
      distanciaKm: DataTypes.DECIMAL,
      tiempoEstimadoMinutos: DataTypes.INTEGER,
      costo: DataTypes.DECIMAL(10, 2),
      rutaGeometria: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Ruta",
      tableName: "Rutas",
    },
  );
  return Ruta;
};
