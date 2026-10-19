#!/usr/bin/env node
/**
 * Comprueba que las rutas del proyecto coinciden con las del diseño de
 * Figma: nombre, barrios en orden de parada, salidas y precio.
 *
 * Uso:  node scripts/ver-rutas.js
 */
"use strict";

const db = require("../src/models");
const { Ruta, RutaBarrio, Barrio, Comuna, Horario, sequelize } = db;

(async () => {
  const rutas = await Ruta.findAll({
    include: [
      { model: Comuna, as: "origen", attributes: ["nombre"] },
      { model: Comuna, as: "destino", attributes: ["nombre"] },
      { model: Horario, as: "horarios", attributes: ["horaSalida"] },
    ],
    order: [["id", "ASC"]],
  });

  // Se trae el orden por separado: el `orden` vive en RutaBarrio, y así
  // no hay que pelear con cómo Sequelize expone los atributos del "through".
  const enlaces = await RutaBarrio.findAll({
    include: [
      { model: Barrio, as: "barrio", include: [{ model: Comuna, as: "comuna" }] },
    ],
    order: [["rutaId", "ASC"], ["orden", "ASC"]],
  });

  const porRuta = {};
  for (const e of enlaces) {
    (porRuta[e.rutaId] = porRuta[e.rutaId] || []).push(e);
  }

  console.log("── Rutas del bus universitario ──\n");
  for (const r of rutas) {
    console.log(`${r.nombre}  (${r.origen.nombre} → ${r.destino.nombre})`);
    console.log(`  ${r.distanciaKm} km · ${r.tiempoEstimadoMinutos} min · $${r.costo}`);

    const lista = porRuta[r.id] || [];
    console.log("  barrios: " + (lista.length
      ? lista.map((e) => `${e.orden}. ${e.barrio.nombre} (comuna ${e.barrio.comuna.nombre})`).join("  ·  ")
      : "—"));

    const horas = (r.horarios || []).map((h) => h.horaSalida.slice(0, 5)).sort();
    console.log("  salidas: " + (horas.length ? horas.join(" · ") : "—") + "\n");
  }

  console.log(`Total: ${rutas.length} rutas · ${enlaces.length} enlaces ruta-barrio`);

  await sequelize.close();
})().catch(async (e) => {
  console.error("✖ " + e.message);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
