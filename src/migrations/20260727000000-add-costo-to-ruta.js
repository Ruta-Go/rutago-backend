"use strict";

/**
 * El bus cobra pasaje por recorrido, pero `Rutas` no tenía dónde
 * guardarlo: el diseño de Figma y el seed traían el precio y la base lo
 * descartaba en silencio al insertar.
 *
 * Se agrega como columna opcional para no romper las filas existentes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Rutas", "costo", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Rutas", "costo");
  },
};
