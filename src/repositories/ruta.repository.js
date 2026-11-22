const { Op } = require("sequelize");
const { Ruta, Comuna, Barrio, Horario } = require("../models");

exports.obtenerTodasConPaginacion = async (
  limit,
  offset,
  q,
  sortBy = "id",
  sortOrder = "ASC",
) => {
  const where = {};
  if (q) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${q}%` } },
      { "$origen.nombre$": { [Op.like]: `%${q}%` } },
      { "$destino.nombre$": { [Op.like]: `%${q}%` } },
    ];
  }
  return await Ruta.findAndCountAll({
    where,
    include: [
      { model: Comuna, as: "origen" },
      { model: Comuna, as: "destino" },
      {
        model: Barrio,
        as: "barrios",
        through: { attributes: ["orden"] },
      },
    ],
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    distinct: true,
  });
};

exports.obtenerPorId = async (id) => {
  const ruta = await Ruta.findByPk(id, {
    include: [
      { model: Comuna, as: "origen" },
      { model: Comuna, as: "destino" },
      {
        model: Barrio,
        as: "barrios",
        through: { attributes: ["orden"] },
      },
      {
        model: Horario,
        as: "horarios",
      },
    ],
  });
  if (!ruta) throw new Error("RUTA_NO_ENCONTRADA");
  return ruta;
};

/** Todas las rutas con sus paradas reales, horarios y comunas. */
exports.obtenerTodasConParadas = async () => {
  return await Ruta.findAll({
    include: [
      { model: Comuna, as: "origen", attributes: ["id", "nombre"] },
      { model: Comuna, as: "destino", attributes: ["id", "nombre"] },
      {
        model: Barrio,
        as: "barrios",
        attributes: ["id", "nombre", "comunaId"],
        through: { attributes: ["orden"] },
      },
      { model: Horario, as: "horarios" },
    ],
    order: [["id", "ASC"]],
    distinct: true,
  });
};

exports.buscarPorDestino = async (destino) => {
  return await Ruta.findAll({
    include: [
      { model: Comuna, as: "origen" },
      { model: Comuna, as: "destino" },
      {
        model: Horario,
        as: "horarios",
      },
    ],
    where: {
      "$destino.nombre$": {
        [Op.like]: `%${destino}%`,
      },
    },
  });
};

/** Rutas con geometría GeoJSON guardada; se usa para búsqueda por proximidad. */
exports.obtenerConGeometria = async () => {
  return await Ruta.findAll({
    attributes: [
      "id",
      "nombre",
      "rutaGeometria",
      "distanciaKm",
      "tiempoEstimadoMinutos",
      "costo",
    ],
    where: { rutaGeometria: { [Op.not]: null } },
    include: [
      { model: Comuna, as: "origen", attributes: ["id", "nombre"] },
      { model: Comuna, as: "destino", attributes: ["id", "nombre"] },
    ],
  });
};

exports.crearRuta = async (datos) => {
  return await Ruta.create(datos);
};

exports.actualizarRuta = async (id, datos) => {
  const ruta = await Ruta.findByPk(id);
  if (!ruta) throw new Error("RUTA_NO_ENCONTRADA");
  return await ruta.update(datos);
};

exports.eliminarRuta = async (id) => {
  const ruta = await Ruta.findByPk(id);
  if (!ruta) throw new Error("RUTA_NO_ENCONTRADA");
  await ruta.destroy();
  return true;
};
