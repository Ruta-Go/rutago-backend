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

injectar("../src/models", {
  sequelize: {
    getDialect: () => "mysql",
    query: async () => {
      throw new Error("No debería consultar PostGIS en este proveedor");
    },
  },
});

injectar("../src/repositories/ruta.repository", {
  obtenerConGeometria: async () => [
    {
      id: 1,
      nombre: "Ruta cercana",
      distanciaKm: 3,
      tiempoEstimadoMinutos: 12,
      costo: 2.5,
      origen: { id: 1, nombre: "Centro" },
      destino: { id: 2, nombre: "Norte" },
      rutaGeometria: JSON.stringify({
        type: "LineString",
        coordinates: [
          [-77.045, -12.048],
          [-77.0428, -12.055],
        ],
      }),
    },
    {
      id: 2,
      nombre: "Ruta lejana",
      distanciaKm: 20,
      tiempoEstimadoMinutos: 45,
      costo: 6,
      origen: { id: 1, nombre: "Centro" },
      destino: { id: 3, nombre: "Sur" },
      rutaGeometria: JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-78.5, -12.5] },
          },
        ],
      }),
    },
    {
      id: 3,
      nombre: "Geometría inválida",
      rutaGeometria: "esto-no-es-json",
    },
  ],
});

const geoService = require("../src/services/geo.service");

test("extrae coordenadas de LineString, Point y FeatureCollection", () => {
  assert.deepEqual(
    geoService.extraerPuntos({
      type: "LineString",
      coordinates: [
        [-77.1, -12.1],
        [-77.2, -12.2],
      ],
    }),
    [
      [-77.1, -12.1],
      [-77.2, -12.2],
    ],
  );
  assert.equal(
    geoService.extraerPuntos({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [-77, -12] } },
      ],
    }).length,
    1,
  );
});

test("la distancia calculada es real y simétrica", () => {
  assert.equal(geoService.distanciaMetros(-12.0464, -77.0428, -12.0464, -77.0428), 0);
  const norte = geoService.distanciaMetros(-12.0464, -77.0428, -12.055, -77.0428);
  const inversa = geoService.distanciaMetros(-12.055, -77.0428, -12.0464, -77.0428);
  assert.ok(norte > 900 && norte < 1000, `distancia inesperada: ${norte}`);
  assert.ok(Math.abs(norte - inversa) < 0.001);
});

test("la búsqueda devuelve sólo rutas dentro del radio, ordenadas y con motor real", async () => {
  const resultado = await geoService.obtenerRutasCercanas({
    latitud: -12.0464,
    longitud: -77.0428,
    radioMetros: 2000,
  });

  assert.equal(resultado.motor, "javascript");
  assert.equal(resultado.rutas.length, 1);
  assert.equal(resultado.rutas[0].id, 1);
  assert.ok(resultado.rutas[0].distanciaMetros > 0);
  assert.ok(resultado.rutas[0].distanciaMetros < 2000);
});

test("coordenadas fuera de rango se rechazan en vez de fingir un resultado", async () => {
  await assert.rejects(
    () => geoService.obtenerRutasCercanas({ latitud: 91, longitud: -77 }),
    /LATITUD_INVALIDA/,
  );
  await assert.rejects(
    () =>
      geoService.obtenerRutasCercanas({
        latitud: -12,
        longitud: -77,
        radioMetros: 0,
      }),
    /RADIO_INVALIDO/,
  );
});
