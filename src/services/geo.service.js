"use strict";

const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");
const rutaRepository = require("../repositories/ruta.repository");

const RADIO_MAXIMO = 50000;
let postgisDetectado = null;

/** Sólo para pruebas: fuerza una nueva detección de la extensión. */
exports.reiniciarDeteccion = () => {
  postgisDetectado = null;
};

async function tienePostgis() {
  if (postgisDetectado !== null) return postgisDetectado;
  if (sequelize.getDialect() !== "postgres") {
    postgisDetectado = false;
    return false;
  }

  try {
    const filas = await sequelize.query(
      "SELECT 1 AS existe FROM pg_extension WHERE extname = 'postgis'",
      { type: QueryTypes.SELECT },
    );
    postgisDetectado = filas.length > 0;
  } catch (error) {
    console.warn("[geo] no se pudo comprobar PostGIS:", error.message);
    postgisDetectado = false;
  }
  return postgisDetectado;
}

const aNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

function extraerPuntos(geojson) {
  const puntos = [];
  const visitar = (nodo) => {
    if (!nodo || typeof nodo !== "object") return;
    switch (nodo.type) {
      case "Point":
        puntos.push(nodo.coordinates);
        break;
      case "MultiPoint":
      case "LineString":
        if (Array.isArray(nodo.coordinates)) puntos.push(...nodo.coordinates);
        break;
      case "MultiLineString":
      case "Polygon":
        if (Array.isArray(nodo.coordinates)) {
          nodo.coordinates.forEach((linea) => {
            if (Array.isArray(linea)) puntos.push(...linea);
          });
        }
        break;
      case "MultiPolygon":
        if (Array.isArray(nodo.coordinates)) {
          nodo.coordinates.forEach((poligono) => {
            if (Array.isArray(poligono)) {
              poligono.forEach((linea) => {
                if (Array.isArray(linea)) puntos.push(...linea);
              });
            }
          });
        }
        break;
      case "GeometryCollection":
        if (Array.isArray(nodo.geometries)) nodo.geometries.forEach(visitar);
        break;
      case "Feature":
        visitar(nodo.geometry);
        break;
      case "FeatureCollection":
        if (Array.isArray(nodo.features)) nodo.features.forEach(visitar);
        break;
      default:
        break;
    }
  };

  visitar(geojson);
  return puntos
    .map((punto) => (Array.isArray(punto) ? punto : []))
    .filter((punto) => punto.length >= 2)
    .map((punto) => [aNumero(punto[0]), aNumero(punto[1])])
    .filter(([lon, lat]) => lon !== null && lat !== null);
}

function distanciaMetros(lat1, lon1, lat2, lon2) {
  const radioTierra = 6371008.8;
  const aRadianes = Math.PI / 180;
  const dLat = (lat2 - lat1) * aRadianes;
  const dLon = (lon2 - lon1) * aRadianes;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * aRadianes) *
      Math.cos(lat2 * aRadianes) *
      Math.sin(dLon / 2) ** 2;
  return 2 * radioTierra * Math.asin(Math.sqrt(a));
}

function validarCoordenadas({ latitud, longitud, radioMetros, limite }) {
  const lat = aNumero(latitud);
  const lon = aNumero(longitud);
  let radio = radioMetros === undefined ? 3000 : aNumero(radioMetros);
  let maximo = limite === undefined ? 20 : aNumero(limite);

  if (lat === null || lat < -90 || lat > 90) {
    throw new Error("LATITUD_INVALIDA");
  }
  if (lon === null || lon < -180 || lon > 180) {
    throw new Error("LONGITUD_INVALIDA");
  }
  if (radio === null || radio <= 0 || radio > RADIO_MAXIMO) {
    throw new Error("RADIO_INVALIDO");
  }
  if (maximo === null || maximo < 1 || maximo > 100) {
    throw new Error("LIMITE_INVALIDO");
  }

  return { lat, lon, radio, maximo };
}

const formatearRuta = (ruta, distancia) => ({
  id: ruta.id,
  nombre: ruta.nombre,
  origen: ruta.origen ? { id: ruta.origen.id, nombre: ruta.origen.nombre } : null,
  destino: ruta.destino ? { id: ruta.destino.id, nombre: ruta.destino.nombre } : null,
  distanciaKm: aNumero(ruta.distanciaKm),
  tiempoEstimadoMinutos: ruta.tiempoEstimadoMinutos,
  costo: aNumero(ruta.costo),
  distanciaMetros: Math.round(distancia),
});

async function buscarConPostgis({ lat, lon, radio, maximo }) {
  const filas = await sequelize.query(
    `SELECT r."id", r."nombre", r."distanciaKm", r."tiempoEstimadoMinutos", r."costo",
            o."id" AS "origenId", o."nombre" AS "origenNombre",
            d."id" AS "destinoId", d."nombre" AS "destinoNombre",
            ST_Distance(
              ST_SetSRID(ST_GeomFromGeoJSON(r."rutaGeometria"), 4326)::geography,
              ST_SetSRID(ST_MakePoint(:longitud, :latitud), 4326)::geography
            ) AS "distanciaMetros"
     FROM "Rutas" r
     LEFT JOIN "Comunas" o ON o."id" = r."origenId"
     LEFT JOIN "Comunas" d ON d."id" = r."destinoId"
     WHERE r."rutaGeometria" IS NOT NULL
       AND ST_DWithin(
         ST_SetSRID(ST_GeomFromGeoJSON(r."rutaGeometria"), 4326)::geography,
         ST_SetSRID(ST_MakePoint(:longitud, :latitud), 4326)::geography,
         :radioMetros
       )
     ORDER BY "distanciaMetros" ASC
     LIMIT :limite`,
    {
      replacements: { latitud: lat, longitud: lon, radioMetros: radio, limite: maximo },
      type: QueryTypes.SELECT,
    },
  );

  return filas.map((fila) =>
    formatearRuta(
      {
        id: fila.id,
        nombre: fila.nombre,
        distanciaKm: fila.distanciaKm,
        tiempoEstimadoMinutos: fila.tiempoEstimadoMinutos,
        costo: fila.costo,
        origen: fila.origenId ? { id: fila.origenId, nombre: fila.origenNombre } : null,
        destino: fila.destinoId ? { id: fila.destinoId, nombre: fila.destinoNombre } : null,
      },
      Number(fila.distanciaMetros) || 0,
    ),
  );
}

async function buscarConJavascript({ lat, lon, radio, maximo }) {
  const rutas = await rutaRepository.obtenerConGeometria();
  const resultados = [];

  for (const ruta of rutas) {
    let geojson;
    try {
      geojson = JSON.parse(ruta.rutaGeometria);
    } catch {
      continue;
    }
    const puntos = extraerPuntos(geojson);
    if (puntos.length === 0) continue;

    const menorDistancia = Math.min(
      ...puntos.map(([puntoLon, puntoLat]) =>
        distanciaMetros(lat, lon, puntoLat, puntoLon),
      ),
    );
    if (menorDistancia <= radio) {
      resultados.push(formatearRuta(ruta, menorDistancia));
    }
  }

  return resultados
    .sort((a, b) => a.distanciaMetros - b.distanciaMetros)
    .slice(0, maximo);
}

/**
 * Devuelve rutas reales cercanas a una coordenada.
 * motor=postgis cuando la extensión está instalada; motor=javascript cuando
 * no lo está, pero el cálculo de distancia y el filtro siguen siendo reales.
 */
exports.obtenerRutasCercanas = async (filtros) => {
  const parametros = validarCoordenadas(filtros || {});

  if (await tienePostgis()) {
    try {
      return {
        motor: "postgis",
        rutas: await buscarConPostgis(parametros),
      };
    } catch (error) {
      // Una geometría inválida no debe tumbar la búsqueda: se recalcula
      // con el mismo criterio en JavaScript y se reporta el motor usado.
      console.warn("[geo] PostGIS falló, se usa cálculo local:", error.message);
    }
  }

  return {
    motor: "javascript",
    rutas: await buscarConJavascript(parametros),
  };
};

exports.validarCoordenadas = validarCoordenadas;
exports.extraerPuntos = extraerPuntos;
exports.distanciaMetros = distanciaMetros;
