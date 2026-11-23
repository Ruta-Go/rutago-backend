require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");

const injectar = (ruta, exports) => {
  const absolute = require.resolve(ruta);
  require.cache[absolute] = {
    id: absolute,
    filename: absolute,
    loaded: true,
    exports,
  };
};

const STATE = {
  viajes: {},
  agregados: [],
};

injectar("../src/repositories/pasajero.repository", {
  obtenerPorUsuario: async (usuarioId) => ({ id: Number(usuarioId) + 10 }),
});

injectar("../src/repositories/viaje.repository", {
  obtenerPorId: async (viajeId) => STATE.viajes[viajeId] ?? null,
  obtenerEnCursoPorPasajero: async () => null,
  agregarPasajero: async (viajeId, pasajeroId) => {
    STATE.agregados.push({ viajeId, pasajeroId });
  },
});

const viajeService = require("../src/services/viaje.service");
const { ESTADOS_VIAJE } = require("../src/config/estados");

function viajeCon(capacidad, ocupados) {
  return {
    id: 77,
    estadoId: ESTADOS_VIAJE.BUSCANDO,
    vehiculo: { capacidadPasajeros: capacidad },
    pasajeros: Array.from({ length: ocupados }, (_, indice) => ({
      pasajeroId: 500 + indice,
    })),
  };
}

test("un viaje sin cupos disponibles rechaza la inscripción", async () => {
  STATE.viajes[77] = viajeCon(1, 1);
  STATE.agregados = [];

  await assert.rejects(
    () => viajeService.unirseAViaje(77, 90),
    /VIAJE_SIN_CUPO/,
  );
  assert.equal(STATE.agregados.length, 0);
});

test("un viaje con cupo disponible permite la inscripción", async () => {
  STATE.viajes[77] = viajeCon(2, 1);
  STATE.agregados = [];

  const resultado = await viajeService.unirseAViaje(77, 90);

  assert.equal(STATE.agregados.length, 1);
  assert.deepEqual(STATE.agregados[0], { viajeId: 77, pasajeroId: 100 });
  assert.equal(resultado.id, 77);
});

test("un vehículo sin capacidad declarada no acepta pasajeros", async () => {
  STATE.viajes[77] = viajeCon(0, 0);
  STATE.agregados = [];

  await assert.rejects(
    () => viajeService.unirseAViaje(77, 90),
    /VIAJE_SIN_CUPO/,
  );
  assert.equal(STATE.agregados.length, 0);
});
