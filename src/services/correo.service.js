const config = require("../config");

const construirEnlace = (token) => {
  const base =
    config.correo.resetUrl ||
    (config.frontendUrl
      ? `${config.frontendUrl.replace(/\/$/, "")}/recuperar-password`
      : null);

  if (!base) return null;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
};

/**
 * Envía el enlace de recuperación usando la API REST de Resend.
 * No añade dependencias: usa fetch (Node 18+).
 * En desarrollo, sin EMAIL_API_KEY, imprime el enlace en la consola del
 * servidor para poder probar el flujo sin correo real. Nunca se devuelve
 * el token en la respuesta HTTP.
 */
exports.enviarRecuperacion = async (correo, token) => {
  const enlace = construirEnlace(token);
  const apiKey = config.correo.apiKey;

  if (!apiKey) {
    if (config.entorno === "production") {
      throw new Error("CORREO_NO_CONFIGURADO");
    }
    if (!enlace) {
      throw new Error("PASSWORD_RESET_URL_NO_CONFIGURADA");
    }
    console.warn(
      "[DEV] Correo de recuperación no configurado. Enlace local:",
      enlace,
    );
    return { modo: "consola" };
  }

  if (!enlace || !config.correo.from) {
    throw new Error("CORREO_NO_CONFIGURADO");
  }

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.correo.from,
      to: [correo],
      subject: "Recupera tu contraseña de RutaGo",
      html: `<p>Hola,</p><p>Recibimos una solicitud para restablecer tu contraseña en RutaGo.</p><p><a href="${enlace}">Restablecer contraseña</a></p><p>Si no fuiste tú, ignora este mensaje. El enlace vence en 1 hora.</p>`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!respuesta.ok) {
    console.error("Error del proveedor de correo:", respuesta.status);
    throw new Error("ERROR_ENVIO_CORREO");
  }

  return { modo: "resend" };
};
