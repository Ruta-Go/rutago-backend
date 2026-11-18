"use strict";

const { Op } = require("sequelize");
const { Notificacion } = require("../models");

exports.crear = async (datos) => Notificacion.create(datos);

exports.obtenerPorId = async (id) => Notificacion.findByPk(id);

exports.listarPorUsuario = async (usuarioId, soloNoLeidas = false) => {
  const where = { usuarioId: Number(usuarioId) };
  if (soloNoLeidas) where.leida = false;
  return await Notificacion.findAll({
    where,
    order: [
      ["leida", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
};

exports.contarNoLeidas = async (usuarioId) =>
  await Notificacion.count({
    where: { usuarioId: Number(usuarioId), leida: false },
  });

/** El filtro por usuario va en el UPDATE: nadie puede marcar la de otro. */
exports.marcarLeida = async (id, usuarioId) => {
  const [afectadas] = await Notificacion.update(
    { leida: true },
    { where: { id: Number(id), usuarioId: Number(usuarioId) } },
  );
  if (!afectadas) return null;
  return await Notificacion.findByPk(id);
};
