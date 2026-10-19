"use strict";

/**
 * Las migraciones de creación cargan los catálogos (Comunas, Barrios,
 * Roles, TiposDocumento y los Estados…) con `bulkInsert` y ids
 * explícitos. Eso no recorre la secuencia del id, así que el siguiente
 * INSERT vuelve a pedir el 1 y muere con «llave duplicada viola
 * restricción de unicidad».
 *
 * Este cambio avanza cada secuencia hasta el último id real. Mover una
 * secuencia no toca datos, así que no hay nada que revertir.
 */

const TABLAS = [
  "Comunas",
  "Barrios",
  "Roles",
  "TiposDocumento",
  "EstadosConductor",
  "EstadosVehiculo",
  "EstadosViaje",
];

/** Recorre la secuencia `id` de una tabla hasta su último id cargado. */
async function recorrerSecuencia(queryInterface, tabla) {
  // Se consulta pg_get_serial_sequence porque el nombre real de la
  // secuencia no está escrito en ninguna parte del esquema.
  await queryInterface.sequelize.query(`
    DO $$
    DECLARE seq text;
    BEGIN
      seq := pg_get_serial_sequence('"${tabla}"', 'id');
      IF seq IS NOT NULL THEN
        PERFORM setval(
          seq,
          GREATEST((SELECT COALESCE(MAX(id), 1) FROM "${tabla}"), 1)
        );
      END IF;
    END $$;
  `);
}

module.exports = {
  async up(queryInterface) {
    for (const tabla of TABLAS) {
      await recorrerSecuencia(queryInterface, tabla);
    }
  },

  async down() {
    // Mover una secuencia no cambia ni borra datos: no hay nada que revertir.
  },
};
