"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

require("./setup-env");
const rutaRepository = require("../src/repositories/ruta.repository");
const rutaService = require("../src/services/ruta.service");

const rutasDePrueba = [
  {
    id: 1,
    nombre: "Ruta 1 · La Marina",
    descripcion: "Universidad - Barrio La Marina",
    origen: { id: 7, nombre: "Comuna 7" },
    destino: { id: 6, nombre: "Comuna 6" },
    distanciaKm: "8.4",
    tiempoEstimadoMinutos: 26,
    costo: "2800.00",
    barrios: [
      { nombre: "El Triunfo", rutaBarrio: { orden: 1 } },
      { nombre: "La Marina", rutaBarrio: { orden: 2 } },
    ],
    horarios: [{ horaSalida: "13:30:00" }],
  },
  {
    id: 2,
    nombre: "Ruta sin horario",
    descripcion: "Sin salidas publicadas",
    barrios: [
      { nombre: "El Triunfo", rutaBarrio: { orden: 1 } },
      { nombre: "Bolívar", rutaBarrio: { orden: 2 } },
    ],
    horarios: [],
  },
];

const conRepositorioSimulado = async (fn) => {
  const original = rutaRepository.obtenerTodasConParadas;
  rutaRepository.obtenerTodasConParadas = async () => rutasDePrueba;
  try {
    return await fn();
  } finally {
    rutaRepository.obtenerTodasConParadas = original;
  }
};

test("la Universidad del Pacífico se reconoce como origen real de la ruta", async () => {
  await conRepositorioSimulado(async () => {
    const rutas = await rutaService.buscarPorParadas(
      "Universidad del Pacífico",
      "La Marina",
    );

    assert.equal(rutas.length, 1);
    assert.equal(rutas[0].id, 1);
    assert.deepEqual(rutas[0].paradas, ["El Triunfo", "La Marina"]);
    assert.deepEqual(rutas[0].horarios, ["13:30:00"]);
  });
});

test("el recorrido inverso funciona con la misma ruta configurada", async () => {
  await conRepositorioSimulado(async () => {
    const rutas = await rutaService.buscarPorParadas("la marina", "EL TRIUNFO");
    assert.equal(rutas.length, 1);
    assert.equal(rutas[0].id, 1);
  });
});

test("no devuelve rutas sin horario ni inventa recorridos", async () => {
  await conRepositorioSimulado(async () => {
    const rutas = await rutaService.buscarPorParadas("Universidad", "Bolívar");
    assert.equal(rutas.length, 0);
  });
});

test("rechaza paradas iguales o vacías", async () => {
  await conRepositorioSimulado(async () => {
    await assert.rejects(
      () => rutaService.buscarPorParadas("", "La Marina"),
      /ORIGEN_Y_DESTINO_SON_OBLIGATORIOS/,
    );
    await assert.rejects(
      () => rutaService.buscarPorParadas("El Triunfo", "el triunfo"),
      /ORIGEN_Y_DESTINO_NO_PUEDEN_SER_IGUALES/,
    );
  });
});
