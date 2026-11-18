require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const config = require("../src/config");

const usuario = { id: 7, rolId: 3, nombres: "Pasajero", activo: true };

const injectar = (ruta, exports) => {
  const absolute = require.resolve(ruta);
  require.cache[absolute] = {
    id: absolute,
    filename: absolute,
    loaded: true,
    exports,
  };
};

injectar("../src/repositories/usuario.repository", {
  buscarPorId: async (id) => (Number(id) === usuario.id ? usuario : null),
});

injectar("../src/models", {
  Conductor: { findOne: async () => null },
  Entidad: { findOne: async () => null },
  Pasajero: { findOne: async () => ({ id: 11 }) },
  Viaje: {
    findOne: async () => ({ id: 5 }),
    findByPk: async (id) =>
      Number(id) === 5 ? { id: 5, conductorId: null, vehiculoId: 9 } : null,
  },
  ViajePasajero: {
    findOne: async (args) =>
      args.where.pasajeroId === 11 ? { id: 1, viajeId: 5, pasajeroId: 11 } : null,
  },
  Vehiculo: {
    findByPk: async (id) => (Number(id) === 9 ? { id: 9, entidadId: 2 } : null),
  },
});

const tiempoReal = require("../src/services/tiempo-real.service");

test("el WebSocket acepta un access token vigente y usa el rol de la BD", async () => {
  const token = jwt.sign(
    { id: usuario.id, rolId: 1 },
    config.jwt.secreto,
    { expiresIn: "8h" },
  );
  const autenticado = await tiempoReal.autenticar(token);
  assert.equal(autenticado.id, 7);
  assert.equal(autenticado.rolId, 3);
  assert.equal(autenticado.nombreRol, "Pasajero");
});

test("el WebSocket rechaza refresh tokens y usuarios inexistentes", async () => {
  const refresh = jwt.sign(
    { id: usuario.id, type: "refresh" },
    config.jwt.secreto,
    { expiresIn: "7d" },
  );
  await assert.rejects(() => tiempoReal.autenticar(refresh), /TOKEN_INVALIDO/);

  const otro = jwt.sign({ id: 999 }, config.jwt.secreto, { expiresIn: "8h" });
  await assert.rejects(() => tiempoReal.autenticar(otro), /USUARIO_INACTIVO/);
});

test("un pasajero sólo puede suscribirse a su usuario y a sus viajes", async () => {
  assert.equal(await tiempoReal.puedeSuscribirse(usuario, "usuario:7"), true);
  assert.equal(await tiempoReal.puedeSuscribirse(usuario, "usuario:8"), false);
  assert.equal(await tiempoReal.puedeSuscribirse(usuario, "viaje:5"), true);
  assert.equal(await tiempoReal.puedeSuscribirse(usuario, "viaje:6"), false);
  assert.equal(await tiempoReal.puedeSuscribirse(usuario, "rol:3"), true);
  assert.equal(await tiempoReal.puedeSuscribirse(usuario, "vehiculo:abc"), false);
});

test("publicar sin servidor adjunto no inventa receptores", () => {
  assert.equal(tiempoReal.publicarUbicacion(9, { latitud: -12.04 }, 5), 0);
  assert.equal(tiempoReal.publicarAUsuario(7, "prueba", {}), 0);
});
