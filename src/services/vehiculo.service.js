const vehiculoRepository = require("../repositories/vehiculo.repository");
const {
  formatearRespuestaPaginada,
  calcularOffset,
} = require("../helpers/paginacion.helper");
const { ESTADOS_VEHICULO } = require("../config/estados");

const ESTADOS_VALIDOS_VEHICULO = Object.values(ESTADOS_VEHICULO);

const validarVehiculoPayload = async (datos) => {
  const {
    placa,
    marca,
    modelo,
    color,
    capacidadPasajeros,
    entidadId,
    estadoId,
  } = datos;

  if (!placa || !marca || !modelo || !color) {
    throw new Error("PLACA_MARCA_MODELO_Y_COLOR_SON_OBLIGATORIOS");
  }

  if (capacidadPasajeros == null || Number(capacidadPasajeros) <= 0) {
    throw new Error("CAPACIDAD_INVALIDA");
  }

  if (estadoId && !ESTADOS_VALIDOS_VEHICULO.includes(Number(estadoId))) {
    throw new Error("ESTADO_VEHICULO_INVALIDO");
  }

  if (entidadId) {
    const entidad = await vehiculoRepository.obtenerEntidadPorId(entidadId);
    if (!entidad) throw new Error("ENTIDAD_NO_ENCONTRADA");
  }
};

exports.obtenerTodos = async (
  paginaActual = 1,
  registrosPorPagina = 10,
  q,
  estadoId,
  sortBy = "id",
  sortOrder = "ASC",
) => {
  const offset = calcularOffset(paginaActual, registrosPorPagina);
  const limit = parseInt(registrosPorPagina);

  const { count, rows } = await vehiculoRepository.obtenerTodosConPaginacion(
    limit,
    offset,
    q,
    estadoId,
    sortBy,
    sortOrder,
  );

  return formatearRespuestaPaginada(
    rows,
    count,
    paginaActual,
    registrosPorPagina,
  );
};

exports.obtenerPorId = async (id) => {
  const vehiculo = await vehiculoRepository.obtenerPorId(id);
  if (!vehiculo) {
    throw new Error("VEHICULO_NO_ENCONTRADO");
  }
  return vehiculo;
};

exports.obtenerUbicacion = async (id) => {
  const vehiculo = await vehiculoRepository.obtenerPorId(id);
  return {
    id: vehiculo.id,
    placa: vehiculo.placa,
    estadoId: vehiculo.estadoId,
    latitud: vehiculo.latitud ? parseFloat(vehiculo.latitud) : null,
    longitud: vehiculo.longitud ? parseFloat(vehiculo.longitud) : null,
    ultimaActualizacion: vehiculo.ultimaActualizacion,
  };
};

exports.actualizarUbicacion = async (id, datos) => {
  const { latitud, longitud, estadoId, velocidadActual } = datos;
  const cambios = {
    latitud,
    longitud,
    estadoId,
    ultimaActualizacion: new Date(),
  };
  if (velocidadActual !== undefined) cambios.velocidadActual = velocidadActual;
  return await vehiculoRepository.actualizarVehiculo(id, cambios);
};

exports.crearVehiculo = async (datos) => {
  const datosPermitidos = {
    placa: datos.placa,
    marca: datos.marca,
    modelo: datos.modelo,
    color: datos.color,
    capacidadPasajeros: datos.capacidadPasajeros,
    entidadId: datos.entidadId,
    estadoId: datos.estadoId,
    latitud: datos.latitud,
    longitud: datos.longitud,
  };
  await validarVehiculoPayload(datosPermitidos);
  return await vehiculoRepository.crearVehiculo(datosPermitidos);
};

exports.actualizarVehiculo = async (id, datos) => {
  const datosPermitidos = {
    placa: datos.placa,
    marca: datos.marca,
    modelo: datos.modelo,
    color: datos.color,
    capacidadPasajeros: datos.capacidadPasajeros,
    entidadId: datos.entidadId,
    estadoId: datos.estadoId,
    latitud: datos.latitud,
    longitud: datos.longitud,
  };
  await validarVehiculoPayload(datosPermitidos);
  return await vehiculoRepository.actualizarVehiculo(id, datosPermitidos);
};

exports.eliminarVehiculo = async (id) => {
  return await vehiculoRepository.eliminarVehiculo(id);
};
