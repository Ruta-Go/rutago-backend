const jwt = require("jsonwebtoken");
const config = require("../config");
const usuarioRepository = require("../repositories/usuario.repository");

const sinToken = (res, message, code = "AUTENTICACION_REQUERIDA") =>
  res.status(401).json({ success: false, code, message });

exports.verificarToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sinToken(res, "Acceso denegado. No hay token.");
  }

  let verificado;
  try {
    verificado = jwt.verify(token, config.jwt.secreto);
  } catch (error) {
    // Token ausente, inválido o expirado son 401 (no 403): 403 queda
    // reservado para usuarios autenticados sin permisos suficientes.
    return sinToken(
      res,
      error.name === "TokenExpiredError"
        ? "La sesión ha expirado."
        : "Token inválido.",
      "TOKEN_INVALIDO_O_EXPIRADO",
    );
  }

  // Un refresh token nunca debe servir como token de acceso.
  if (verificado.type === "refresh") {
    return sinToken(res, "Token inválido para esta operación.", "TOKEN_INVALIDO_O_EXPIRADO");
  }

  try {
    // Se consulta el rol vigente en la BD: un cambio de rol o una baja
    // deben surtir efecto aunque el JWT todavía no haya expirado.
    const usuario = await usuarioRepository.buscarPorId(verificado.id);
    if (!usuario || usuario.activo === false) {
      return sinToken(res, "Usuario no encontrado o inactivo.", "USUARIO_INACTIVO");
    }

    req.usuario = {
      id: usuario.id,
      rolId: usuario.rolId,
      nombres: usuario.nombres,
      correo: usuario.correo,
      activo: usuario.activo,
    };
    return next();
  } catch (error) {
    console.error("Error al validar la sesión:", error.message);
    return sinToken(res, "No se pudo validar la sesión.", "AUTENTICACION_REQUERIDA");
  }
};
