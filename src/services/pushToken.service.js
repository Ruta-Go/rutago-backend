"use strict";

const pushTokenRepository = require("../repositories/pushToken.repository");

const PLATAFORMAS_PERMITIDAS = new Set([
  "ios",
  "android",
  "web",
  "desconocida",
]);

/**
 * Guarda el token real devuelto por Expo. Nunca se devuelve el token en la
 * respuesta ni se escribe en logs: sólo se confirma el registro.
 */
exports.registrar = async (usuarioId, datos = {}) => {
  const token = String(datos.token ?? "").trim();
  if (!token) throw new Error("TOKEN_PUSH_OBLIGATORIO");

  const plataformaSolicitada = String(datos.plataforma ?? "desconocida")
    .trim()
    .toLowerCase();
  const plataforma = PLATAFORMAS_PERMITIDAS.has(plataformaSolicitada)
    ? plataformaSolicitada
    : "desconocida";

  const registrado = await pushTokenRepository.registrar({
    usuarioId: Number(usuarioId),
    token,
    plataforma,
  });

  return {
    id: registrado.id,
    plataforma: registrado.plataforma,
    activo: registrado.activo,
  };
};
