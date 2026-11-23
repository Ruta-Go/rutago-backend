"use strict";

const { DispositivoPush } = require("../models");

/** Un token pertenece a un usuario; si ya existía se reasigna y reactiva. */
exports.registrar = async ({ usuarioId, token, plataforma }) => {
  const existente = await DispositivoPush.findOne({ where: { token } });

  if (existente) {
    await existente.update({
      usuarioId,
      plataforma,
      activo: true,
    });
    return existente;
  }

  return await DispositivoPush.create({
    usuarioId,
    token,
    plataforma,
    activo: true,
  });
};
