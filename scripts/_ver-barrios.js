"use strict";
const db = require("../src/models");
const { Barrio, Comuna, sequelize } = db;

(async () => {
  const comuna = await Comuna.findAll({ order: [["id", "ASC"]] });
  console.log("COMUNAS: " + comuna.length);
  console.log(comuna.map((c) => c.id + " " + c.nombre).join(" | "));

  const barrios = await Barrio.findAll({
    include: [{ model: Comuna, as: "comuna" }],
    order: [["comunaId", "ASC"], ["id", "ASC"]],
  });

  console.log("\nBARRIOS: " + barrios.length);
  let actual = null;
  const lineas = [];
  for (const b of barrios) {
    if (b.comunaId !== actual) {
      actual = b.comunaId;
      lineas.push("\n-- Comuna " + actual + " " +
        (b.comuna ? b.comuna.nombre : "?") + " --");
    }
    lineas.push(String(b.id).padStart(4) + " " + b.nombre);
  }
  // 5 por línea para que no sea muy largo
  let buf = [];
  for (const l of lineas) {
    if (l.startsWith("\n--")) {
      if (buf.length) console.log("  " + buf.join(" | "));
      console.log(l);
      buf = [];
    } else {
      buf.push(l);
      if (buf.length === 5) { console.log("  " + buf.join(" | ")); buf = []; }
    }
  }
  if (buf.length) console.log("  " + buf.join(" | "));

  await sequelize.close();
})().catch(async (e) => {
  console.error("ERROR: " + e.message);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
