const { z } = require("zod");

const crear = z.object({
  usuarioId: z.coerce
    .number({ required_error: "El usuario es obligatorio" })
    .int()
    .positive("El usuario debe ser un número entero positivo"),
  telefono: z
    .string()
    .trim()
    .max(30, "El teléfono no debe exceder 30 caracteres")
    .optional(),
  direccion: z
    .string()
    .trim()
    .max(300, "La dirección no debe exceder 300 caracteres")
    .optional(),
  tipoDocumentoId: z.coerce.number().int().positive().optional(),
  numeroDocumento: z
    .string()
    .trim()
    .max(50, "El número de documento no debe exceder 50 caracteres")
    .optional(),
  fechaNacimiento: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La fecha de nacimiento debe tener formato YYYY-MM-DD",
    )
    .optional(),
});

const actualizar = z.object({
  telefono: z.string().trim().max(30).optional(),
  direccion: z.string().trim().max(300).optional(),
  tipoDocumentoId: z.coerce.number().int().positive().optional(),
  numeroDocumento: z.string().trim().max(50).optional(),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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
    telefono: z.string().trim().max(30).optional(),
    direccion: z.string().trim().max(300).optional(),
    tipoDocumentoId: z.coerce.number().int().positive().optional(),
    numeroDocumento: z.string().trim().max(50).optional(),
    fechaNacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Debe tener formato YYYY-MM-DD")
      .optional(),
  })
  .transform(({ nombres, apellidos, correo, contrasena, ...rest }) => ({
    datosUsuario: { nombres, apellidos, correo, contrasena },
    datosPerfil: { ...rest },
  }));

module.exports = { crear, actualizar, crearConUsuario };
