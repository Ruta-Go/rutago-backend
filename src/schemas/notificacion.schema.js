const { z } = require("zod");

const crear = z.object({
  usuarioId: z.coerce.number().int().positive("El usuario es obligatorio"),
  viajeId: z.coerce.number().int().positive().optional(),
  tipo: z
    .string()
    .trim()
    .min(2, "El tipo debe tener al menos 2 caracteres")
    .max(50, "El tipo no debe exceder 50 caracteres"),
  titulo: z
    .string()
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(150, "El título no debe exceder 150 caracteres"),
  mensaje: z
    .string()
    .trim()
    .min(2, "El mensaje debe tener al menos 2 caracteres")
    .max(1000, "El mensaje no debe exceder 1000 caracteres"),
  datos: z.record(z.string(), z.unknown()).optional(),
});

const registrarPushToken = z.object({
  token: z
    .string()
    .trim()
    .min(1, "El token push es obligatorio")
    .max(255, "El token push no debe exceder 255 caracteres"),
  plataforma: z.enum(["ios", "android", "web", "desconocida"]).optional(),
});

module.exports = { crear, registrarPushToken };
