#!/usr/bin/env node
/**
 * Quita las rutas y viajes de prueba que ya no corresponden al proyecto,
 * para que `npm run seed` vuelva a crearlos desde cero con los barrios
 * de Buenaventura.
 *
 * Se respeta el orden de las llaves foráneas:
 *   ViajePasajero → Viaje → Horario → RutaBarrio → Ruta
 *
 * Uso:  npm run limpiar
 */
"use strict";

const db = require("../src/models");
const {
  ViajePasajero,
  Viaje,
  Horario,
  RutaBarrio,
  Ruta,
  Conductor,
  sequelize,
} = db;

const ESTADO_CONDUCTOR_DISPONIBLE = 1;

(async () => {
  const base = sequelize.getDatabaseName();
  if (base !== "rutago_db") {
    throw new Error("Esta base no es rutago_db (es «" + base + "»). No se borra nada.");
  }

  const borrados = {};
  borrados["Pasajeros en viaje"] = await ViajePasajero.destroy({ where: {} });
  borrados["Viajes"] = await Viaje.destroy({ where: {} });
  borrados["Horarios"] = await Horario.destroy({ where: {} });
  borrados["Ruta-barrio"] = await RutaBarrio.destroy({ where: {} });
  borrados["Rutas"] = await Ruta.destroy({ where: {} });

  await Conductor.update({ estadoId: ESTADO_CONDUCTOR_DISPONIBLE }, { where: {} });

  console.log("── Rutas y viajes eliminados ──");
  for (const [k, v] of Object.entries(borrados)) {
    console.log("  " + k.padEnd(20) + v);
  }
  console.log("  Conductores".padEnd(22) + "disponibles");

  await sequelize.close();
})().catch(async (e) => {
  console.error("\n✖ Error al limpiar: " + e.message);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
