const { ROLES } = require("../config/roles");

exports.esAdministrador = (req, res, next) => {
  if (req.usuario && req.usuario.rolId === ROLES.ADMIN) {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Requiere permisos de administrador." });
  }
};

exports.esConductor = (req, res, next) => {
  if (req.usuario && req.usuario.rolId === ROLES.CONDUCTOR) {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Requiere permisos de conductor." });
  }
};

exports.esPasajero = (req, res, next) => {
  if (req.usuario && req.usuario.rolId === ROLES.PASAJERO) {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Requiere permisos de pasajero." });
  }
};

exports.esEntidad = (req, res, next) => {
  if (req.usuario && req.usuario.rolId === ROLES.ENTIDAD) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Requiere permisos de entidad externa.",
    });
  }
};

exports.esConductorOAdmin = (req, res, next) => {
  if (
    req.usuario &&
    (req.usuario.rolId === ROLES.ADMIN || req.usuario.rolId === ROLES.CONDUCTOR)
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Requiere permisos de conductor o administrador.",
    });
  }
};

exports.esAdminOEntidad = (req, res, next) => {
  if (
    req.usuario &&
    (req.usuario.rolId === ROLES.ADMIN || req.usuario.rolId === ROLES.ENTIDAD)
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Requiere permisos de administrador o entidad externa.",
    });
  }
};

exports.esPasajeroOAdmin = (req, res, next) => {
  if (
    req.usuario &&
    (req.usuario.rolId === ROLES.ADMIN || req.usuario.rolId === ROLES.PASAJERO)
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Requiere permisos de pasajero o administrador.",
    });
  }
};

exports.esAdminOEntidadOConductor = (req, res, next) => {
  if (
    req.usuario &&
    (req.usuario.rolId === ROLES.ADMIN ||
      req.usuario.rolId === ROLES.ENTIDAD ||
      req.usuario.rolId === ROLES.CONDUCTOR)
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Requiere permisos de administrador, entidad o conductor.",
    });
  }
};

exports.esPasajeroOConductorOAdmin = (req, res, next) => {
  if (
    req.usuario &&
    (req.usuario.rolId === ROLES.ADMIN ||
      req.usuario.rolId === ROLES.CONDUCTOR ||
      req.usuario.rolId === ROLES.PASAJERO)
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Requiere permisos de pasajero, conductor o administrador.",
    });
  }
};
