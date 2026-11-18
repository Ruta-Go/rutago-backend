require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");
const { ROLES } = require("../src/config/roles");

const datos = {
  conductor: { id: 3, usuarioId: 7 },
  entidad: { id: 5, usuarioId: 9 },
  vehiculo: { id: 11, entidadId: 5 },
  viaje: { id: 21, conductorId: 3, estadoId: 2 },
  hayInscripcion: true,
};

const falsoModelo = (valor) => ({
  findOne: async () => valor,
  findByPk: async () => valor,
});

const rutaModelos = require.resolve("../src/models");
require.cache[rutaModelos] = {
  id: rutaModelos,
  filename: rutaModelos,
  loaded: true,
  exports: {
    Conductor: {
      findOne: async (opciones) => {
        const usuarioId = opciones?.where?.usuarioId;
        return Number(usuarioId) === datos.conductor.usuarioId
          ? datos.conductor
          : null;
      },
      findByPk: async () => datos.conductor,
    },
    Entidad: falsoModelo(datos.entidad),
    Pasajero: falsoModelo({ id: 4, usuarioId: 7 }),
    Viaje: falsoModelo(datos.viaje),
    ViajePasajero: falsoModelo(datos.hayInscripcion),
    Vehiculo: falsoModelo(datos.vehiculo),
  },
};

const ownership = require("../src/middlewares/ownership.middleware");

const crearContexto = (req) => {
  const resultado = { codigo: 200, cuerpo: null, siguiente: false };
  const res = {
    status(codigo) {
      resultado.codigo = codigo;
      return this;
    },
    json(cuerpo) {
      resultado.cuerpo = cuerpo;
      return this;
    },
  };
  return {
    resultado,
    req,
    res,
    next: () => {
      resultado.siguiente = true;
    },
  };
};

test("un conductor no puede cambiar el estado de otro conductor", async () => {
  const ctx = crearContexto({
    params: { id: "99" },
    usuario: { id: 7, rolId: ROLES.CONDUCTOR },
  });
  await ownership.conductorPropio(ctx.req, ctx.res, ctx.next);
  assert.equal(ctx.resultado.codigo, 403);
  assert.equal(ctx.resultado.siguiente, false);
});

test("un conductor sí puede cambiar su propio estado", async () => {
  const ctx = crearContexto({
    params: { id: "3" },
    usuario: { id: 7, rolId: ROLES.CONDUCTOR },
  });
  await ownership.conductorPropio(ctx.req, ctx.res, ctx.next);
  assert.equal(ctx.resultado.siguiente, true);
});

test("el administrador no está limitado por propiedad", async () => {
  const ctx = crearContexto({
    params: { id: "99" },
    usuario: { id: 1, rolId: ROLES.ADMIN },
  });
  await ownership.conductorPropio(ctx.req, ctx.res, ctx.next);
  assert.equal(ctx.resultado.siguiente, true);
});

test("una entidad no puede crear vehículos para otra entidad", async () => {
  const ctx = crearContexto({
    body: { entidadId: 999, placa: "ABC123" },
    usuario: { id: 9, rolId: ROLES.ENTIDAD },
  });
  await ownership.vehiculoEntidadCreacion(ctx.req, ctx.res, ctx.next);
  assert.equal(ctx.resultado.siguiente, true);
  assert.equal(ctx.req.body.entidadId, 5);
});

test("un pasajero no puede consultar el perfil de otro usuario", async () => {
  const ctx = crearContexto({
    params: { usuarioId: "8" },
    usuario: { id: 7, rolId: ROLES.PASAJERO },
  });
  await ownership.pasajeroPropio(ctx.req, ctx.res, ctx.next);
  assert.equal(ctx.resultado.codigo, 403);
});

test("sólo el conductor asignado puede iniciar un viaje", async () => {
  const ctx = crearContexto({
    params: { id: "21" },
    usuario: { id: 8, rolId: ROLES.CONDUCTOR },
  });
  await ownership.viajeDelConductor(ctx.req, ctx.res, ctx.next);
  assert.equal(ctx.resultado.codigo, 403);
});
