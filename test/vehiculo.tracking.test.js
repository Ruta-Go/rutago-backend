require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");

let captura = null;
const injectar = (ruta, exports) => {
  const absolute = require.resolve(ruta);
  require.cache[absolute] = {
    id: absolute,
    filename: absolute,
    loaded: true,
    exports,
  };
};

injectar("../src/repositories/vehiculo.repository", {
  actualizarVehiculo: async (id, datos) => {
    captura = { id, datos };
    return { id, ...datos };
  },
});

const vehiculoService = require("../src/services/vehiculo.service");

test("actualizarUbicacion persiste velocidad y marca la hora real del reporte", async () => {
  const antes = Date.now();
  const resultado = await vehiculoService.actualizarUbicacion(9, {
    latitud: -12.0464,
    longitud: -77.0428,
    estadoId: 2,
    velocidadActual: 35.5,
  });

  assert.equal(resultado.id, 9);
  assert.equal(captura.datos.velocidadActual, 35.5);
  assert.equal(captura.datos.estadoId, 2);
  assert.ok(captura.datos.ultimaActualizacion.getTime() >= antes);
});
