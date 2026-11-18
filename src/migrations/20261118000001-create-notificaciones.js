"use strict";

/**
 * Migración ADITIVA: crea la tabla de notificaciones internas.
 * No modifica ni elimina datos existentes. No se ejecutó contra producción
 * durante este desarrollo; debe aplicarse con el pipeline habitual.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    let existente = false;
    try {
      await queryInterface.describeTable("Notificaciones");
      existente = true;
    } catch {
      existente = false;
    }
    if (existente) return;

    await queryInterface.createTable("Notificaciones", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Usuarios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      viajeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Viajes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      tipo: { type: Sequelize.STRING(50), allowNull: false },
      titulo: { type: Sequelize.STRING(150), allowNull: false },
      mensaje: { type: Sequelize.TEXT, allowNull: false },
      datos: { type: Sequelize.TEXT, allowNull: true },
      leida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  /**
   * Rollback intencionalmente inactivo: borrar una tabla de notificaciones
   * eliminaría historial real. Si algún día se requiere reversión, debe
   * hacerse de forma explícita y coordinada, no desde un pipeline automático.
   */
  async down() {
    console.warn(
      "[migration] down de Notificaciones omitido a propósito (migración aditiva no destructiva).",
    );
  },
};
