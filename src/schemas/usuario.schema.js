const { z } = require("zod");

// Una sola definición para registro y restablecimiento: evita que un flujo
// acepte contraseñas más débiles que el otro.
const contrasenaSegura = z
  .string({ required_error: "La contraseña es obligatoria" })
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Za-z]/, "La contraseña debe contener al menos una letra")
  .regex(/[0-9]/, "La contraseña debe contener al menos un número");

const registro = z.object({
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
  contrasena: contrasenaSegura,
  // El registro público SIEMPRE crea pasajeros. El rol se asigna
  // únicamente desde el endpoint administrativo /:id/rol.
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  tipoDocumentoId: z.coerce.number().int().positive().optional(),
  numeroDocumento: z.string().optional(),
  fechaNacimiento: z.string().optional(),
});

// Campos que el propio usuario puede cambiar de su perfil.
// Nunca rolId, activo, contrasena ni cualquier otro campo sensible.
const actualizarPerfil = z.object({
  nombres: z.string().trim().min(2).max(50).optional(),
  apellidos: z.string().trim().min(2).max(50).optional(),
  correo: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase())
    .optional(),
});

const actualizarAdministrador = actualizarPerfil.extend({
  activo: z.boolean().optional(),
});

const cambiarContrasenaPerfil = z.object({
  contrasenaActual: z.string().min(1, "La contraseña actual es obligatoria"),
  nuevaContrasena: contrasenaSegura,
});

const recuperarContrasena = z.object({
  correo: z
    .string({ required_error: "El correo es obligatorio" })
    .trim()
    .email("Debe proporcionar un correo electrónico válido")
    .transform((v) => v.toLowerCase()),
});

const verificarTokenRecuperacion = z.object({
  token: z
    .string({ required_error: "El token es obligatorio" })
    .trim()
    .min(1, "El token es obligatorio"),
});

const cambiarContrasena = z.object({
  token: z
    .string({ required_error: "El token es obligatorio" })
    .min(1, "El token es obligatorio"),
  nuevaContrasena: contrasenaSegura,
});

const cambiarRol = z.object({
  rolId: z.coerce
    .number({ required_error: "El rol es obligatorio" })
    .int("El rol debe ser un número entero")
    .positive("El rol debe ser un número positivo"),
});

module.exports = {
  registro,
  actualizarPerfil,
  actualizarAdministrador,
  cambiarContrasenaPerfil,
  recuperarContrasena,
  cambiarContrasena,
  cambiarRol,
  verificarTokenRecuperacion,
};
