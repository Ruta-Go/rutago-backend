"use strict";

const parsearDatos = (datos) => {
  if (!datos) return null;
  if (typeof datos === "object") return datos;
  try {
    return JSON.parse(datos);
  } catch {
    return null;
  }
};

exports.RespuestaNotificacionDto = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    usuarioId: model.usuarioId,
    viajeId: model.viajeId ?? null,
    tipo: model.tipo,
    titulo: model.titulo,
    mensaje: model.mensaje,
    datos: parsearDatos(model.datos),
    leida: Boolean(model.leida),
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};
