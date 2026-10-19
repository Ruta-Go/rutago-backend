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
