"use strict";

const notificacionService = require("../services/notificacion.service");

exports.listar = async (req, res) => {
  try {
    const soloNoLeidas = String(req.query.soloNoLeidas) === "true";
    const data = await notificacionService.listar(req.usuario.id, soloNoLeidas);
    res.json({ success: true, data });
  } catch (error) {
    console.error("[notificaciones]", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.contarNoLeidas = async (req, res) => {
  try {
    const total = await notificacionService.contarNoLeidas(req.usuario.id);
    res.json({ success: true, data: { total } });
  } catch (error) {
    console.error("[notificaciones]", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    const data = await notificacionService.marcarLeida(
      req.params.id,
      req.usuario.id,
    );
    res.json({ success: true, message: "Notificación marcada como leída", data });
  } catch (error) {
    if (error.message === "NOTIFICACION_NO_ENCONTRADA") {
      return res
        .status(404)
        .json({ success: false, message: "Notificación no encontrada" });
    }
    console.error("[notificaciones]", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/** Creación real por administrador; no genera datos de ejemplo automáticos. */
exports.crear = async (req, res) => {
  try {
    const data = await notificacionService.crear(req.body);
    res.status(201).json({
      success: true,
      message: "Notificación creada",
      data,
    });
  } catch (error) {
    console.error("[notificaciones]", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
