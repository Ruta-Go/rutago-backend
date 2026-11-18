const {
  Usuario,
  Rol,
  Conductor,
  Entidad,
  Pasajero,
} = require("../models");
const { Op } = require("sequelize");

exports.buscarPorCorreo = async (correo) => {
  return await Usuario.findOne({ where: { correo } });
};

exports.buscarPorId = async (id) => {
  return await Usuario.findByPk(id, {
    include: [
      { model: Rol, as: "rol" },
      { model: Conductor, as: "conductor" },
      { model: Entidad, as: "entidad" },
      { model: Pasajero, as: "pasajero" },
    ],
  });
};

exports.buscarTodosConPaginacion = async (
  limit,
  offset,
  filtros = {},
  sortBy = "id",
  sortOrder = "ASC",
) => {
  const where = {};

  if (filtros.rolId) {
    where.rolId = Number(filtros.rolId);
  }

  if (filtros.correo) {
    where.correo = { [Op.like]: `%${filtros.correo}%` };
  }

  if (filtros.q) {
    where[Op.or] = [
      { nombres: { [Op.like]: `%${filtros.q}%` } },
      { apellidos: { [Op.like]: `%${filtros.q}%` } },
      { correo: { [Op.like]: `%${filtros.q}%` } },
    ];
  }

  return await Usuario.findAndCountAll({
    where,
    include: [
      { model: Rol, as: "rol" },
      { model: Conductor, as: "conductor" },
      { model: Entidad, as: "entidad" },
      { model: Pasajero, as: "pasajero" },
    ],
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    distinct: true,
  });
};

exports.guardarUsuario = async (datosUsuario) => {
  return await Usuario.create(datosUsuario);
};

const CAMPOS_ACTUALIZABLES = new Set([
  "nombres",
  "apellidos",
  "correo",
  "activo",
]);

exports.actualizarDatos = async (id, datos) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error("USUARIO_NO_ENCONTRADO");

  const cambios = Object.fromEntries(
    Object.entries(datos || {}).filter(([campo]) =>
      CAMPOS_ACTUALIZABLES.has(campo),
    ),
  );
  return await usuario.update(cambios);
};

exports.actualizarRol = async (id, rolId) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error("USUARIO_NO_ENCONTRADO");
  return await usuario.update({ rolId });
};

exports.eliminarUsuario = async (id) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error("USUARIO_NO_ENCONTRADO");
  await usuario.destroy();
  return true;
};

exports.actualizarTokenRecuperacion = async (id, token, expira) => {
  return await Usuario.update(
    { resetPasswordToken: token, resetPasswordExpires: expira },
    { where: { id } },
  );
};

exports.buscarPorToken = async (token) => {
  return await Usuario.findOne({ where: { resetPasswordToken: token } });
};

exports.actualizarContrasena = async (id, nuevaContrasena) => {
  return await Usuario.update(
    {
      contrasena: nuevaContrasena,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
    { where: { id } },
  );
};
