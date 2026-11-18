"use strict";

const notificacionRepository = require("../repositories/notificacion.repository");
const notificacionDto = require("../dtos/notificacion.dto");
const tiempoReal = require("../services/tiempo-real.service");
const { ESTADOS_VIAJE } = require("../config/estados");

const MENSAJES_ESTADO = {
  [ESTADOS_VIAJE.BUSCANDO]: "El viaje vuelve a estar disponible.",
  [ESTADOS_VIAJE.ACEPTADO]: "Un conductor aceptó el viaje.",
  [ESTADOS_VIAJE.EN_CURSO]: "El viaje está en curso.",
  [ESTADOS_VIAJE.FINALIZADO]: "El viaje finalizó correctamente.",
  [ESTADOS_VIAJE.CANCELADO]: "El viaje fue cancelado.",
};

const difundir = (usuarioId, tipo, payload) => {
  try {
    tiempoReal.publicarAUsuario(usuarioId, tipo, payload);
  } catch (error) {
    console.warn("[notificaciones] no se pudo difundir por WebSocket:", error.message);
  }
};

const serializarDatos = (datos) =>
  datos === undefined || datos === null ? null : JSON.stringify(datos);

exports.crear = async (datos) => {
  const notificacion = await notificacionRepository.crear({
    usuarioId: Number(datos.usuarioId),
    viajeId: datos.viajeId ? Number(datos.viajeId) : null,
    tipo: datos.tipo,
    titulo: datos.titulo,
    mensaje: datos.mensaje,
    datos: serializarDatos(datos.datos),
    leida: false,
  });
  const dto = notificacionDto.RespuestaNotificacionDto(notificacion);
  difundir(notificacion.usuarioId, "notificacion", dto);
  return dto;
};

exports.listar = async (usuarioId, soloNoLeidas = false) => {
  const notificaciones = await notificacionRepository.listarPorUsuario(
    usuarioId,
    soloNoLeidas,
  );
  return notificaciones.map(notificacionDto.RespuestaNotificacionDto);
};

exports.contarNoLeidas = async (usuarioId) =>
  await notificacionRepository.contarNoLeidas(usuarioId);

exports.marcarLeida = async (id, usuarioId) => {
  const notificacion = await notificacionRepository.marcarLeida(id, usuarioId);
  if (!notificacion) throw new Error("NOTIFICACION_NO_ENCONTRADA");
  const dto = notificacionDto.RespuestaNotificacionDto(notificacion);
  difundir(usuarioId, "notificacion_leida", { id: dto.id });
  return dto;
};

const destinatariosDelViaje = (viaje) => {
  const ids = new Set();
  const delConductor = viaje?.conductor?.usuario?.id;
  if (delConductor) ids.add(Number(delConductor));

  for (const inscripcion of viaje?.pasajeros || []) {
    const delPasajero =
      inscripcion?.pasajero?.usuario?.id ?? inscripcion?.usuarioId;
    if (delPasajero) ids.add(Number(delPasajero));
  }
  return [...ids];
};

/**
 * Notifica a los participantes reales del viaje. Quien ejecuta la acción
 * queda excluido: no se auto-notifica de su propio cambio.
 */
exports.notificarCambioEstadoViaje = async (
  viaje,
  estadoId,
  actorUsuarioId = null,
) => {
  const mensaje = MENSAJES_ESTADO[Number(estadoId)];
  if (!mensaje || !viaje?.id) return [];

  const creadas = [];
  for (const usuarioId of destinatariosDelViaje(viaje)) {
    if (actorUsuarioId && usuarioId === Number(actorUsuarioId)) continue;
    creadas.push(
      await exports.crear({
        usuarioId,
        viajeId: viaje.id,
        tipo: "viaje_estado",
        titulo: "Actualización de tu viaje",
        mensaje,
        datos: { estadoId: Number(estadoId), viajeId: viaje.id },
      }),
    );
  }
  return creadas;
};

/** Avisa al conductor cuando un pasajero se une a su viaje. */
exports.notificarNuevoPasajero = async (viaje, actorUsuarioId) => {
  const conductorId = viaje?.conductor?.usuario?.id;
  if (!conductorId || Number(conductorId) === Number(actorUsuarioId)) return [];

  return [
    await exports.crear({
      usuarioId: Number(conductorId),
      viajeId: viaje.id,
      tipo: "viaje_pasajero",
      titulo: "Nuevo pasajero en tu viaje",
      mensaje: "Un pasajero se unió a tu viaje.",
      datos: { viajeId: viaje.id },
    }),
  ];
};
