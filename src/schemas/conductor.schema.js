const { z } = require("zod");

const crear = z.object({
  usuarioId: z.coerce
    .number({ required_error: "El usuario es obligatorio" })
    .int()
    .positive("El usuario debe ser un número entero positivo"),
  licenciaConducir: z
    .string()
    .trim()
    .max(50, "La licencia no debe exceder 50 caracteres")
    .optional(),
  estadoId: z.coerce.number().int().positive().optional(),
});

const actualizar = z.object({
  licenciaConducir: z.string().trim().max(50).optional(),
  estadoId: z.coerce.number().int().positive().optional(),
});

// El conductor sólo edita su licencia desde /me/perfil. El estado se cambia
// por /:id/estado, que valida reglas de negocio (viajes activos).
const actualizarPerfilConductor = z.object({
  licenciaConducir: z.string().trim().max(50).optional(),
});

const crearConUsuario = z
  .object({
    nombres: z
      .string({ required_error: "El nombre es obligatorio" })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre no puede exceder 50 caracteres"),
    apellidos: z
      .string({ required_error: "Los apellidos son obligatorios" })
      .trim()
      .min(2, "Los apellidos deben tener al menos 2 caracteres")
      .max(50, "Los apellidos no pueden exceder 50 caracteres"),
    correo: z
      .string({ required_error: "El correo es obligatorio" })
      .trim()
      .email("Debe proporcionar un correo electrónico válido")
      .transform((v) => v.toLowerCase()),
    contrasena: z
      .string({ required_error: "La contraseña es obligatoria" })
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Za-z]/, "Debe contener al menos una letra")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    licenciaConducir: z.string().trim().max(50).optional(),
    estadoId: z.coerce.number().int().positive().optional(),
  })
  .transform(({ nombres, apellidos, correo, contrasena, ...rest }) => ({
    datosUsuario: { nombres, apellidos, correo, contrasena },
    datosPerfil: { ...rest },
  }));

const cambiarEstado = z.object({
  estadoId: z.coerce
    .number({ required_error: "El estado es obligatorio" })
    .int()
    .positive("El estado debe ser un número entero positivo"),
});

module.exports = {
  crear,
  actualizar,
  actualizarPerfilConductor,
  crearConUsuario,
  cambiarEstado,
};
