const usuarioService = require("../services/usuario.service");
const usuarioDto = require("../dtos/usuario.dto");
const pasajeroService = require("../services/pasajero.service");
const { ROLES } = require("../config/roles");

const manejarError = (res, error) => {
  if (error.message?.includes("_NO_ENCONTRADO")) {
    return res.status(404).json({ success: false, message: error.message });
  }
  res.status(400).json({ success: false, message: error.message });
};

exports.registrarUsuario = async (req, res) => {
  try {
    // El cliente nunca decide el rol: el registro público crea pasajeros.
    // Los demás roles se asignan sólo desde /api/usuarios/:id/rol (admin).
    const datos = { ...req.body, rolId: ROLES.PASAJERO };

    const nuevoUsuario = await usuarioService.crearUsuario(datos);

    if (nuevoUsuario.rolId === ROLES.PASAJERO) {
      const existente = await pasajeroService
        .obtenerPorUsuario(nuevoUsuario.id)
        .catch(() => null);
      if (!existente) {
        await pasajeroService.crear({
          usuarioId: nuevoUsuario.id,
          telefono: datos.telefono,
          direccion: datos.direccion,
          tipoDocumentoId: datos.tipoDocumentoId,
          numeroDocumento: datos.numeroDocumento,
          fechaNacimiento: datos.fechaNacimiento,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "¡Usuario registrado con éxito en RutaGo!",
      usuario: {
        id: nuevoUsuario.id,
        nombres: nuevoUsuario.nombres,
        correo: nuevoUsuario.correo,
      },
    });
  } catch (error) {
    if (error.message === "EL_CORREO_YA_EXISTE") {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico ya está registrado.",
      });
    }

    if (error.message === "ROL_NO_EXISTE") {
      return res.status(400).json({
        success: false,
        message: "El rol seleccionado no existe.",
      });
    }

    console.error("Error en el controlador de registro:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
};

exports.recuperarContrasena = async (req, res) => {
  try {
    const { correo } = req.body;
    await usuarioService.solicitarRecuperacion(correo);
    res.json({
      success: true,
      message:
        "Si el correo está registrado, recibirás un enlace de recuperación",
    });
  } catch (error) {
    if (
      ["CORREO_NO_CONFIGURADO", "PASSWORD_RESET_URL_NO_CONFIGURADA", "ERROR_ENVIO_CORREO"].includes(
        error.message,
      )
    ) {
      console.error("No se pudo entregar el correo de recuperación:", error.message);
      return res.status(503).json({
        success: false,
        message: "No se pudo enviar el correo. Intente nuevamente más tarde.",
      });
    }
    // Respuesta uniforme para no revelar si el correo existe.
    res.json({
      success: true,
      message:
        "Si el correo está registrado, recibirás un enlace de recuperación",
    });
  }
};

exports.verificarTokenRecuperacion = async (req, res) => {
  try {
    const resultado = await usuarioService.verificarTokenRecuperacion(
      req.body.token,
    );
    res.json({
      success: true,
      valido: true,
      expira: resultado.expira,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      valido: false,
      message: "El enlace no es válido o ya expiró.",
    });
  }
};

exports.cambiarContrasena = async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;
    await usuarioService.cambiarContrasena(token, nuevaContrasena);
    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.obtenerTodos = async (req, res) => {
  try {
    const {
      paginaActual,
      registrosPorPagina,
      q,
      rolId,
      correo,
      sortBy,
      sortOrder,
    } = req.query;
    const filtrosAplicados = { rolId, correo, q };
    const resultado = await usuarioService.obtenerTodos(
      paginaActual,
      registrosPorPagina,
      filtrosAplicados,
      sortBy,
      sortOrder,
    );
    res.json({
      success: true,
      data: resultado.data.map(usuarioDto.RespuestaUsuariosDto),
      paginacion: resultado.paginacion,
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const usuario = await usuarioService.obtenerPorId(req.params.id);
    res.json({ success: true, data: usuarioDto.RespuestaUsuariosDto(usuario) });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.obtenerMiPerfil = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res
        .status(401)
        .json({ success: false, message: "Usuario no autenticado" });
    }
    const usuario = await usuarioService.obtenerMiPerfil(req.usuario.id);
    res.json({ success: true, data: usuarioDto.RespuestaUsuariosDto(usuario) });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.actualizarMiPerfil = async (req, res) => {
  try {
    const usuario = await usuarioService.actualizarDatos(
      req.usuario.id,
      req.body,
    );
    res.json({
      success: true,
      message: "Perfil actualizado",
      data: usuarioDto.RespuestaUsuariosDto(usuario),
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.cambiarContrasenaPerfil = async (req, res) => {
  try {
    await usuarioService.cambiarContrasenaAutenticado(
      req.usuario.id,
      req.body.contrasenaActual,
      req.body.nuevaContrasena,
    );
    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    if (
      error.message === "CONTRASENA_ACTUAL_INCORRECTA" ||
      error.message === "USUARIO_NO_ENCONTRADO"
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    manejarError(res, error);
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const usuario = await usuarioService.actualizarDatos(
      req.params.id,
      req.body,
      true,
    );
    res.json({
      success: true,
      message: "Usuario actualizado",
      data: usuarioDto.RespuestaUsuariosDto(usuario),
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.cambiarRol = async (req, res) => {
  try {
    const usuario = await usuarioService.actualizarRol(
      req.params.id,
      req.body.rolId,
    );
    res.json({ success: true, message: "Rol actualizado", data: usuario });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    await usuarioService.eliminarUsuario(req.params.id);
    res.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    manejarError(res, error);
  }
};
