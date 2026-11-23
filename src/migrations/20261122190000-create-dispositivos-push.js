"use strict";

/**
 * Migración ADITIVA: registra los tokens de dispositivo obtenidos por la app.
 * No modifica ni elimina datos existentes. No se ejecuta contra producción
 * desde esta jornada; debe aplicarse con el pipeline habitual.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    let existente = false;
    try {
      await queryInterface.describeTable("DispositivosPush");
      existente = true;
    } catch {
      existente = false;
    }
    if (existente) return;

    await queryInterface.createTable("DispositivosPush", {
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
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      plataforma: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "desconocida",
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("DispositivosPush", ["usuarioId"], {
      name: "dispositivos_push_usuario_id",
    });
  },

  /** Rollback intencionalmente inactivo: no borrar tokens reales en automático. */
  async down() {
    console.warn(
      "[migration] down de DispositivosPush omitido a propósito (migración aditiva no destructiva).",
    );
  },
};
