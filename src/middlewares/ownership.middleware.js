const {
  Conductor,
  Entidad,
  Pasajero,
  Viaje,
  ViajePasajero,
  Vehiculo,
} = require("../models");
const { ROLES } = require("../config/roles");
const { ESTADOS_VIAJE } = require("../config/estados");

const esAdmin = (req) => req.usuario?.rolId === ROLES.ADMIN;

const denegar = (res, mensaje = "No tienes permiso sobre este recurso.") =>
  res.status(403).json({ success: false, message: mensaje });

const noEncontrado = (res, mensaje = "Recurso no encontrado.") =>
  res.status(404).json({ success: false, message: mensaje });

const conductorDe = (usuarioId) => Conductor.findOne({ where: { usuarioId } });
const entidadDe = (usuarioId) => Entidad.findOne({ where: { usuarioId } });
const pasajeroDe = (usuarioId) => Pasajero.findOne({ where: { usuarioId } });

// --- Conductores -----------------------------------------------------------

exports.conductorPropio = async (req, res, next) => {
  if (esAdmin(req)) return next();
  if (req.usuario?.rolId !== ROLES.CONDUCTOR) return denegar(res);

  const conductor = await conductorDe(req.usuario.id);
  if (!conductor) return noEncontrado(res, "No tienes perfil de conductor.");
  if (Number(conductor.id) !== Number(req.params.id)) return denegar(res);

  req.conductor = conductor;
  return next();
};

exports.conductorVisible = async (req, res, next) => {
  if (esAdmin(req) || req.usuario?.rolId === ROLES.ENTIDAD) return next();
  return exports.conductorPropio(req, res, next);
};

// --- Vehículos -------------------------------------------------------------

// Al crear, una entidad sólo puede crear vehículos asociados a su propia
// entidad. El valor del cuerpo se sobrescribe, no se confía en el cliente.
exports.vehiculoEntidadCreacion = async (req, res, next) => {
  if (esAdmin(req)) return next();
  if (req.usuario?.rolId !== ROLES.ENTIDAD) return denegar(res);

  const entidad = await entidadDe(req.usuario.id);
  if (!entidad) return noEncontrado(res, "No tienes perfil de entidad.");
  req.body = { ...req.body, entidadId: entidad.id };
  return next();
};

exports.vehiculoDeMiEntidad = async (req, res, next) => {
  if (esAdmin(req)) return next();
  if (req.usuario?.rolId !== ROLES.ENTIDAD) return denegar(res);

  const vehiculoEncontrado = await Vehiculo.findByPk(req.params.id);
  if (!vehiculoEncontrado) return noEncontrado(res, "Vehículo no encontrado.");

  const entidad = await entidadDe(req.usuario.id);
  if (!entidad) return noEncontrado(res, "No tienes perfil de entidad.");
  if (Number(vehiculoEncontrado.entidadId) !== Number(entidad.id)) {
    return denegar(res);
  }
  // No puede "regalar" el vehículo a otra entidad cambiando entidadId.
  req.body = { ...req.body, entidadId: entidad.id };
  return next();
};

// Un conductor sólo puede reportar ubicación/estado del vehículo que tiene
// asignado en un viaje aceptado o en curso.
exports.vehiculoAsignadoAConductor = async (req, res, next) => {
  if (esAdmin(req)) return next();
  if (req.usuario?.rolId !== ROLES.CONDUCTOR) return denegar(res);

  const conductor = await conductorDe(req.usuario.id);
  if (!conductor) return noEncontrado(res, "No tienes perfil de conductor.");

  const viaje = await Viaje.findOne({
    where: {
      conductorId: conductor.id,
      vehiculoId: req.params.id,
      estadoId: [ESTADOS_VIAJE.ACEPTADO, ESTADOS_VIAJE.EN_CURSO],
    },
  });
  if (!viaje) {
    return denegar(res, "Ese vehículo no está asignado a un viaje tuyo.");
  }
  return next();
};

// --- Viajes ----------------------------------------------------------------

const viajeAsignadoAlUsuario = async (req) => {
  const conductor = await conductorDe(req.usuario.id);
  if (!conductor) return null;
  return Viaje.findOne({
    where: { id: req.params.id, conductorId: conductor.id },
  });
};

exports.viajeDelConductor = async (req, res, next) => {
  if (esAdmin(req)) return next();
  if (req.usuario?.rolId !== ROLES.CONDUCTOR) return denegar(res);

  const viaje = await viajeAsignadoAlUsuario(req);
  if (!viaje) return denegar(res, "Ese viaje no está asignado a ti.");
  req.viaje = viaje;
  return next();
};

exports.viajeCancelable = async (req, res, next) => {
  if (esAdmin(req)) return next();

  if (req.usuario?.rolId === ROLES.CONDUCTOR) {
    const viaje = await viajeAsignadoAlUsuario(req);
    if (!viaje) return denegar(res, "Ese viaje no está asignado a ti.");
    req.viaje = viaje;
    return next();
  }

  if (req.usuario?.rolId === ROLES.PASAJERO) {
    const pasajero = await pasajeroDe(req.usuario.id);
    if (!pasajero) return noEncontrado(res, "No tienes perfil de pasajero.");
    const inscripcion = await ViajePasajero.findOne({
      where: { viajeId: req.params.id, pasajeroId: pasajero.id },
    });
    if (!inscripcion) {
      return denegar(res, "No estás inscrito en ese viaje.");
    }
    return next();
  }

  return denegar(res);
};

// --- Pasajeros -------------------------------------------------------------

exports.pasajeroPropio = async (req, res, next) => {
  if (esAdmin(req)) return next();
  if (Number(req.params.usuarioId) !== Number(req.usuario?.id)) {
    return denegar(res, "Sólo puedes consultar tu propio perfil.");
  }
  return next();
};
