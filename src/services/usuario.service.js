const usuarioRepository = require("../repositories/usuario.repository");
const rolRepository = require("../repositories/rol.repository");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/roles");
const correoService = require("./correo.service");
const { encriptar } = require("../helpers/encriptarPassword");
const {
  formatearRespuestaPaginada,
  calcularOffset,
} = require("../helpers/paginacion.helper");

const CAMPOS_PERFIL = ["nombres", "apellidos", "correo"];
const CAMPOS_ADMINISTRADOR = [...CAMPOS_PERFIL, "activo"];

// Defensa en profundidad: aunque un controlador pase req.body completo,
// sólo estos campos llegan al modelo.
const soloCamposPermitidos = (datos, permitidos) =>
  Object.fromEntries(
    permitidos
      .filter((campo) => Object.prototype.hasOwnProperty.call(datos, campo))
      .map((campo) => [campo, datos[campo]]),
  );

const hashTokenRecuperacion = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

exports.crearUsuario = async (datosUsuario) => {
  const { nombres, apellidos, correo, contrasena } = datosUsuario;
  // El servicio también fuerza el rol, incluso si se llama desde otro módulo.
  const rolId = ROLES.PASAJERO;

  const usuarioExiste = await usuarioRepository.buscarPorCorreo(correo);
  if (usuarioExiste) {
    throw new Error("EL_CORREO_YA_EXISTE");
  }

  const rolExiste = await rolRepository.obtenerPorId(rolId);
  if (!rolExiste) {
    throw new Error("ROL_NO_EXISTE");
  }

  const contrasenaEncriptada = await encriptar(contrasena);

  return await usuarioRepository.guardarUsuario({
    nombres,
    apellidos,
    correo,
    contrasena: contrasenaEncriptada,
    rolId,
  });
};

exports.obtenerTodos = async (
  paginaActual = 1,
  registrosPorPagina = 10,
  filtros = {},
  sortBy = "id",
  sortOrder = "ASC",
) => {
  const offset = calcularOffset(paginaActual, registrosPorPagina);
  const limit = parseInt(registrosPorPagina);

  const { count, rows } = await usuarioRepository.buscarTodosConPaginacion(
    limit,
    offset,
    filtros,
    sortBy,
    sortOrder,
  );

  return formatearRespuestaPaginada(
    rows,
    count,
    paginaActual,
    registrosPorPagina,
  );
};

exports.obtenerPorId = async (id) => {
  return await usuarioRepository.buscarPorId(id);
};

exports.obtenerMiPerfil = async (id) => {
  return await usuarioRepository.buscarPorId(id);
};

exports.actualizarDatos = async (id, datos, esAdministrador = false) => {
  const permitidos = esAdministrador
    ? CAMPOS_ADMINISTRADOR
    : CAMPOS_PERFIL;
  const cambios = soloCamposPermitidos(datos || {}, permitidos);

  if (Object.keys(cambios).length === 0) {
    throw new Error("NO_HAY_CAMBIOS_VALIDOS");
  }

  if (cambios.correo) {
    const otro = await usuarioRepository.buscarPorCorreo(cambios.correo);
    if (otro && Number(otro.id) !== Number(id)) {
      throw new Error("EL_CORREO_YA_EXISTE");
    }
  }

  return await usuarioRepository.actualizarDatos(id, cambios);
};

exports.cambiarContrasenaAutenticado = async (
  id,
  contrasenaActual,
  nuevaContrasena,
) => {
  const usuario = await usuarioRepository.buscarPorId(id);
  if (!usuario) throw new Error("USUARIO_NO_ENCONTRADO");

  const coincide = await bcrypt.compare(contrasenaActual, usuario.contrasena);
  if (!coincide) throw new Error("CONTRASENA_ACTUAL_INCORRECTA");

  const hash = await encriptar(nuevaContrasena);
  await usuarioRepository.actualizarContrasena(id, hash);
  return true;
};

exports.actualizarRol = async (id, rolId) => {
  const rolExiste = await rolRepository.obtenerPorId(rolId);
  if (!rolExiste) throw new Error("ROL_NO_EXISTE");
  return await usuarioRepository.actualizarRol(id, rolId);
};

exports.eliminarUsuario = async (id) => {
  return await usuarioRepository.eliminarUsuario(id);
};

exports.solicitarRecuperacion = async (correo) => {
  const usuario = await usuarioRepository.buscarPorCorreo(correo);
  if (!usuario) return;

  const token = crypto.randomBytes(20).toString("hex");
  const expira = new Date(Date.now() + 3600000);

  // En la BD se guarda el hash, nunca el token en claro.
  await usuarioRepository.actualizarTokenRecuperacion(
    usuario.id,
    hashTokenRecuperacion(token),
    expira,
  );

  // Si el proveedor no está configurado, el error se propaga: nunca se
  // reporta éxito cuando el correo no se envió realmente.
  return await correoService.enviarRecuperacion(usuario.correo, token);
};

/** Valida un enlace sin consumirlo, para avisar antes de pedir la contraseña. */
exports.verificarTokenRecuperacion = async (token) => {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("TOKEN_INVALIDO_O_EXPIRADO");
  }

  const usuario = await usuarioRepository.buscarPorToken(
    hashTokenRecuperacion(token.trim()),
  );
  const expira = usuario?.resetPasswordExpires
    ? new Date(usuario.resetPasswordExpires)
    : null;
  if (!usuario || !expira || Number.isNaN(expira.getTime()) || expira < new Date()) {
    throw new Error("TOKEN_INVALIDO_O_EXPIRADO");
  }

  return { valido: true, expira };
};

exports.cambiarContrasena = async (token, nuevaContrasena) => {
  const usuario = await usuarioRepository.buscarPorToken(
    hashTokenRecuperacion(token),
  );
  if (!usuario || usuario.resetPasswordExpires < new Date()) {
    throw new Error("TOKEN_INVALIDO_O_EXPIRADO");
  }

  const hash = await encriptar(nuevaContrasena);

  await usuarioRepository.actualizarContrasena(usuario.id, hash);
  return true;
};
