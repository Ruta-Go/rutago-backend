const viajeRepository = require("../repositories/viaje.repository");
const rutaRepository = require("../repositories/ruta.repository");
const horarioRepository = require("../repositories/horario.repository");
const conductorRepository = require("../repositories/conductor.repository");
const pasajeroRepository = require("../repositories/pasajero.repository");
const vehiculoRepository = require("../repositories/vehiculo.repository");
const { ROLES } = require("../config/roles");
const {
  formatearRespuestaPaginada,
  calcularOffset,
} = require("../helpers/paginacion.helper");
const {
  ESTADOS_VIAJE,
  ESTADOS_CONDUCTOR,
  ESTADOS_VEHICULO,
  TRANSICIONES_VIAJE,
} = require("../config/estados");

const ESTADOS_VALIDOS = Object.values(ESTADOS_VIAJE);

const MAPA_VEHICULO = {
  [ESTADOS_VIAJE.BUSCANDO]: ESTADOS_VEHICULO.EN_TERMINAL,
  [ESTADOS_VIAJE.ACEPTADO]: ESTADOS_VEHICULO.PROXIMO,
  [ESTADOS_VIAJE.EN_CURSO]: ESTADOS_VEHICULO.EN_RUTA,
  [ESTADOS_VIAJE.FINALIZADO]: ESTADOS_VEHICULO.EN_TERMINAL,
  [ESTADOS_VIAJE.CANCELADO]: ESTADOS_VEHICULO.EN_TERMINAL,
};

const actualizarEstadoVehiculo = async (viaje, nuevoEstadoViaje) => {
  if (!viaje.vehiculoId) return;
  const estadoVehiculo = MAPA_VEHICULO[nuevoEstadoViaje];
  if (estadoVehiculo) {
    await vehiculoRepository.actualizarVehiculo(viaje.vehiculoId, {
      estadoId: estadoVehiculo,
    });
  }
};

exports.obtenerTodos = async (
  paginaActual = 1,
  registrosPorPagina = 10,
  q,
  sortBy = "createdAt",
  sortOrder = "DESC",
  estadoId,
) => {
  const offset = calcularOffset(paginaActual, registrosPorPagina);
  const limit = parseInt(registrosPorPagina);

  const { count, rows } = await viajeRepository.obtenerTodosConPaginacion(
    limit,
    offset,
    q,
    sortBy,
    sortOrder,
    estadoId,
  );

  return formatearRespuestaPaginada(
    rows,
    count,
    paginaActual,
    registrosPorPagina,
  );
};

exports.obtenerDisponibles = async () => {
  return await viajeRepository.obtenerDisponibles();
};

exports.obtenerDisponiblesPasajero = async (usuarioId) => {
  const pasajero = await pasajeroRepository.obtenerPorUsuario(usuarioId);
  if (!pasajero) return [];
  return await viajeRepository.obtenerDisponiblesPasajero(pasajero.id);
};

exports.unirseAViaje = async (viajeId, usuarioId) => {
  const pasajero = await pasajeroRepository.obtenerPorUsuario(usuarioId);
  if (!pasajero) throw new Error("PASAJERO_SIN_PERFIL");
  const pasajeroId = pasajero.id;

  const viaje = await viajeRepository.obtenerPorId(viajeId);
  if (!viaje) throw new Error("VIAJE_NO_ENCONTRADO");
  if (
    viaje.estadoId !== ESTADOS_VIAJE.BUSCANDO &&
    viaje.estadoId !== ESTADOS_VIAJE.ACEPTADO
  ) {
    throw new Error("VIAJE_NO_DISPONIBLE");
  }

  const yaEsPasajero = (viaje.pasajeros || []).some(
    (vp) => vp.pasajeroId === pasajeroId,
  );
  if (yaEsPasajero) throw new Error("YA_ES_PASAJERO");

  const enCurso = await viajeRepository.obtenerEnCursoPorPasajero(pasajeroId);
  if (enCurso) throw new Error("PASAJERO_EN_VIAJE");

  const capacidad = viaje.vehiculo?.capacidadPasajeros || 0;
  const ocupados = (viaje.pasajeros || []).length;
  if (ocupados >= capacidad) throw new Error("VIAJE_SIN_CUPO");

  await viajeRepository.agregarPasajero(viajeId, pasajeroId);
  return await viajeRepository.obtenerPorId(viajeId);
};

exports.bajarseDeViaje = async (viajeId, usuarioId) => {
  const pasajero = await pasajeroRepository.obtenerPorUsuario(usuarioId);
  if (!pasajero) throw new Error("PASAJERO_SIN_PERFIL");
  const pasajeroId = pasajero.id;

  const viaje = await viajeRepository.obtenerPorId(viajeId);
  if (!viaje) throw new Error("VIAJE_NO_ENCONTRADO");

  const yaEsPasajero = (viaje.pasajeros || []).some(
    (vp) => vp.pasajeroId === pasajeroId,
  );
  if (!yaEsPasajero) throw new Error("NO_ES_PASAJERO");

  await viajeRepository.eliminarPasajero(viajeId, pasajeroId);
  return await viajeRepository.obtenerPorId(viajeId);
};

exports.obtenerPorId = async (id) => {
  return await viajeRepository.obtenerPorId(id);
};

exports.obtenerMisViajes = async (usuarioId, rolId) => {
  const esConductor = rolId === ROLES.CONDUCTOR;
  return await viajeRepository.obtenerMisViajes(usuarioId, esConductor);
};

exports.crearViaje = async (datos) => {
  const usuarioIdPasajero = datos.pasajeroId;
  delete datos.pasajeroId;
  let pasajeroId = null;
  if (usuarioIdPasajero) {
    const pasajero = await pasajeroRepository.obtenerPorUsuario(usuarioIdPasajero);
    pasajeroId = pasajero ? pasajero.id : null;
  }

  if (datos.precioEstimado !== undefined && datos.precioEstimado !== null) {
    const precio = parseFloat(datos.precioEstimado);
    if (isNaN(precio) || precio < 0) {
      throw new Error("PRECIO_INVALIDO");
    }
    datos.precioEstimado = precio;
  }

  if (datos.horarioId) {
    const horario = await horarioRepository.obtenerPorId(datos.horarioId);
    if (!horario) throw new Error("HORARIO_NO_ENCONTRADO");
  }

  const viaje = await viajeRepository.crearViaje(datos);

  if (pasajeroId) {
    await viajeRepository.agregarPasajero(viaje.id, pasajeroId);
  }

  return await viajeRepository.obtenerPorId(viaje.id);
};

exports.actualizarViaje = async (id, datos) => {
  const viaje = await viajeRepository.obtenerPorIdSimple(id);
  if (!viaje) throw new Error("VIAJE_NO_ENCONTRADO");

  if (datos.horarioId) {
    const horario = await horarioRepository.obtenerPorId(datos.horarioId);
    if (!horario) throw new Error("HORARIO_NO_ENCONTRADO");
  }

  if (
    viaje.estadoId === ESTADOS_VIAJE.FINALIZADO ||
    viaje.estadoId === ESTADOS_VIAJE.CANCELADO
  ) {
    datos.estadoId = ESTADOS_VIAJE.BUSCANDO;
    datos.conductorId = null;
    await actualizarEstadoVehiculo(viaje, ESTADOS_VIAJE.BUSCANDO);
    return await viajeRepository.actualizarViaje(id, datos);
  }

  if ("conductorId" in datos) {
    const nuevoCondUsuarioId = datos.conductorId;
    delete datos.conductorId;
    let nuevoCondId = null;

    if (nuevoCondUsuarioId) {
      const conductor = await conductorRepository.obtenerPorUsuario(nuevoCondUsuarioId);
      if (!conductor) throw new Error("CONDUCTOR_SIN_PERFIL");
      nuevoCondId = conductor.id;
    }

    const viejoCondId = viaje.conductorId;

    if (nuevoCondId && nuevoCondId !== viejoCondId) {
      datos.conductorId = nuevoCondId;
      datos.estadoId = ESTADOS_VIAJE.ACEPTADO;
      await actualizarEstadoVehiculo(viaje, ESTADOS_VIAJE.ACEPTADO);

      if (viaje.horarioId) {
        const existente = await viajeRepository.obtenerPorConductorYHorario(
          nuevoCondId, viaje.horarioId, id,
        );
        if (existente) throw new Error("CONDUCTOR_OCUPADO_EN_HORARIO");
      }
    } else if (!nuevoCondUsuarioId && viejoCondId) {
      datos.conductorId = null;
      datos.estadoId = ESTADOS_VIAJE.BUSCANDO;
      await actualizarEstadoVehiculo(viaje, ESTADOS_VIAJE.BUSCANDO);
    }

    if (viejoCondId && viejoCondId !== nuevoCondId) {
      const viejoConductor = await conductorRepository.obtenerPorId(viejoCondId);
      if (viejoConductor) {
        await conductorRepository.actualizarEstado(viejoConductor.id, ESTADOS_CONDUCTOR.DISPONIBLE);
      }
    }
  }

  return await viajeRepository.actualizarViaje(id, datos);
};

exports.actualizarEstado = async (
  id,
  nuevoEstadoId,
  conductorId = null,
  vehiculoId = null,
) => {
  const viaje = await viajeRepository.obtenerPorIdSimple(id);
  if (!viaje) throw new Error("VIAJE_NO_ENCONTRADO");

  nuevoEstadoId = Number(nuevoEstadoId);
  if (!ESTADOS_VALIDOS.includes(nuevoEstadoId)) {
    throw new Error("ESTADO_NO_VALIDO");
  }

  const transicionesPermitidas = TRANSICIONES_VIAJE[viaje.estadoId] || [];
  if (!transicionesPermitidas.includes(nuevoEstadoId)) {
    throw new Error("TRANSICION_ESTADO_NO_VALIDA");
  }

  if (nuevoEstadoId === ESTADOS_VIAJE.ACEPTADO) {
    if (!conductorId) throw new Error("SE_REQUIERE_CONDUCTOR");
    const conductor =
      await conductorRepository.obtenerPorUsuario(conductorId);
    if (!conductor) throw new Error("CONDUCTOR_SIN_PERFIL");
    if (viaje.horarioId) {
      const existente = await viajeRepository.obtenerPorConductorYHorario(
        conductor.id,
        viaje.horarioId,
        viaje.id,
      );
      if (existente) throw new Error("CONDUCTOR_OCUPADO_EN_HORARIO");
    }
    const datosActualizar = {
      estadoId: nuevoEstadoId,
      conductorId: conductor.id,
    };

    if (vehiculoId) {
      const vehiculo = await vehiculoRepository.obtenerPorId(vehiculoId);
      datosActualizar.vehiculoId = vehiculo.id;
      const estadoVehiculo = MAPA_VEHICULO[nuevoEstadoId];
      if (estadoVehiculo) {
        await vehiculoRepository.actualizarVehiculo(vehiculo.id, {
          estadoId: estadoVehiculo,
        });
      }
    } else {
      await actualizarEstadoVehiculo(viaje, nuevoEstadoId);
    }

    return await viajeRepository.actualizarViaje(id, datosActualizar);
  }

  const datosActualizar = { estadoId: nuevoEstadoId };

  if (nuevoEstadoId === ESTADOS_VIAJE.CANCELADO || nuevoEstadoId === ESTADOS_VIAJE.FINALIZADO) {
    datosActualizar.conductorId = null;
  }

  const resultado = await viajeRepository.actualizarViaje(id, datosActualizar);
  await actualizarEstadoVehiculo(viaje, nuevoEstadoId);

  if (
    viaje.conductorId &&
    (nuevoEstadoId === ESTADOS_VIAJE.FINALIZADO ||
      nuevoEstadoId === ESTADOS_VIAJE.CANCELADO)
  ) {
    const conductor = await conductorRepository.obtenerPorId(
      viaje.conductorId,
    );
    if (conductor) {
      await conductorRepository.actualizarEstado(
        conductor.id,
        ESTADOS_CONDUCTOR.DISPONIBLE,
      );
    }
  }

  return resultado;
};

exports.eliminarViaje = async (id) => {
  return await viajeRepository.eliminarViaje(id);
};
