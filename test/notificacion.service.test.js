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

const publicaciones = [];
const guardadas = [];

injectar("../src/services/tiempo-real.service", {
  publicarAUsuario: (usuarioId, tipo, payload) => {
    publicaciones.push({ usuarioId, tipo, payload });
    return 1;
  },
});

injectar("../src/repositories/notificacion.repository", {
  crear: async (datos) => {
    const fecha = new Date("2026-11-18T12:00:00.000Z");
    const notificacion = {
      id: guardadas.length + 1,
      leida: false,
      createdAt: fecha,
      updatedAt: fecha,
      ...datos,
    };
    guardadas.push(notificacion);
    return notificacion;
  },
  listarPorUsuario: async (usuarioId, soloNoLeidas) =>
    guardadas.filter(
      (n) => n.usuarioId === Number(usuarioId) && (!soloNoLeidas || !n.leida),
    ),
  contarNoLeidas: async (usuarioId) =>
    guardadas.filter((n) => n.usuarioId === Number(usuarioId) && !n.leida).length,
  marcarLeida: async (id, usuarioId) => {
    const notificacion = guardadas.find(
      (n) => n.id === Number(id) && n.usuarioId === Number(usuarioId),
    );
    if (!notificacion) return null;
    notificacion.leida = true;
    return notificacion;
  },
});

const notificacionService = require("../src/services/notificacion.service");

test("crear persiste la notificación y la difunde al usuario correcto", async () => {
  const creada = await notificacionService.crear({
    usuarioId: 7,
    viajeId: 12,
    tipo: "viaje_estado",
    titulo: "Actualización de tu viaje",
    mensaje: "El viaje está en curso.",
    datos: { estadoId: 3 },
  });

  assert.equal(creada.usuarioId, 7);
  assert.deepEqual(creada.datos, { estadoId: 3 });
  assert.equal(creada.leida, false);
  assert.equal(publicaciones.at(-1).usuarioId, 7);
  assert.equal(publicaciones.at(-1).tipo, "notificacion");
});

test("listar convierte datos serializados y respeta el filtro de no leídas", async () => {
  await notificacionService.crear({
    usuarioId: 8,
    tipo: "viaje_estado",
    titulo: "Aviso",
    mensaje: "Mensaje de prueba",
    datos: { origen: "backend" },
  });

  const todas = await notificacionService.listar(8);
  assert.ok(todas.length >= 1);
  assert.deepEqual(todas.at(-1).datos, { origen: "backend" });

  const noLeidas = await notificacionService.listar(8, true);
  assert.equal(noLeidas.length, todas.filter((n) => !n.leida).length);
});

test("marcarLeida no permite modificar una notificación de otro usuario", async () => {
  const propia = await notificacionService.crear({
    usuarioId: 9,
    tipo: "viaje_estado",
    titulo: "Aviso",
    mensaje: "Sólo para el usuario 9",
  });

  await assert.rejects(
    () => notificacionService.marcarLeida(propia.id, 10),
    /NOTIFICACION_NO_ENCONTRADA/,
  );

  const marcada = await notificacionService.marcarLeida(propia.id, 9);
  assert.equal(marcada.leida, true);
});

test("un cambio de estado avisa a participantes, nunca al actor", async () => {
  const antes = guardadas.length;
  const viaje = {
    id: 12,
    conductor: { usuario: { id: 2 } },
    pasajeros: [
      { pasajero: { usuario: { id: 7 } } },
      { pasajero: { usuario: { id: 8 } } },
    ],
  };

  const creadas = await notificacionService.notificarCambioEstadoViaje(
    viaje,
    3,
    7,
  );

  assert.equal(creadas.length, 2);
  assert.deepEqual(
    creadas.map((n) => n.usuarioId).sort(),
    [2, 8],
  );
  assert.equal(guardadas.length, antes + 2);
  assert.ok(creadas.every((n) => n.viajeId === 12 && n.tipo === "viaje_estado"));
});

test("un pasajero nuevo avisa únicamente al conductor del viaje", async () => {
  const viaje = {
    id: 13,
    conductor: { usuario: { id: 2 } },
    pasajeros: [{ pasajero: { usuario: { id: 7 } } }],
  };

  const creadas = await notificacionService.notificarNuevoPasajero(viaje, 7);
  assert.equal(creadas.length, 1);
  assert.equal(creadas[0].usuarioId, 2);
  assert.equal(creadas[0].tipo, "viaje_pasajero");
});
