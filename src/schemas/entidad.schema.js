const { z } = require("zod");

const crear = z.object({
  usuarioId: z.coerce
    .number({ required_error: "El usuario es obligatorio" })
    .int()
    .positive("El usuario debe ser un número entero positivo"),
  razonSocial: z
    .string({ required_error: "La razón social es obligatoria" })
    .trim()
    .min(3, "La razón social debe tener entre 3 y 200 caracteres")
    .max(200, "La razón social debe tener entre 3 y 200 caracteres"),
  nit: z
    .string()
    .trim()
    .max(50, "El NIT no debe exceder 50 caracteres")
    .optional(),
  telefonoContacto: z
    .string()
    .trim()
    .max(30, "El teléfono no debe exceder 30 caracteres")
    .optional(),
});

const actualizar = z.object({
  razonSocial: z.string().trim().min(3).max(200).optional(),
  nit: z.string().trim().max(50).optional(),
  telefonoContacto: z.string().trim().max(30).optional(),
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
    razonSocial: z
      .string({ required_error: "La razón social es obligatoria" })
      .trim()
      .min(3, "La razón social debe tener entre 3 y 200 caracteres")
      .max(200, "La razón social debe tener entre 3 y 200 caracteres"),
    nit: z.string().trim().max(50).optional(),
    telefonoContacto: z.string().trim().max(30).optional(),
  })
  .transform(({ nombres, apellidos, correo, contrasena, ...rest }) => ({
    datosUsuario: { nombres, apellidos, correo, contrasena },
    datosPerfil: { ...rest },
  }));

module.exports = { crear, actualizar, crearConUsuario };
