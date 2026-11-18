const { z } = require("zod");

const crear = z.object({
  placa: z
    .string({ required_error: "La placa es obligatoria" })
    .trim()
    .min(5, "La placa debe tener entre 5 y 20 caracteres")
    .max(20, "La placa debe tener entre 5 y 20 caracteres"),
  marca: z
    .string({ required_error: "La marca es obligatoria" })
    .trim()
    .min(2, "La marca debe tener entre 2 y 100 caracteres")
    .max(100, "La marca debe tener entre 2 y 100 caracteres"),
  modelo: z
    .string({ required_error: "El modelo es obligatorio" })
    .trim()
    .min(1, "El modelo debe tener entre 1 y 50 caracteres")
    .max(50, "El modelo debe tener entre 1 y 50 caracteres"),
  color: z
    .string({ required_error: "El color es obligatorio" })
    .trim()
    .min(3, "El color debe tener entre 3 y 50 caracteres")
    .max(50, "El color debe tener entre 3 y 50 caracteres"),
  capacidadPasajeros: z.coerce
    .number({ required_error: "La capacidad de pasajeros es obligatoria" })
    .int()
    .positive("La capacidad debe ser un número entero positivo"),
  entidadId: z.coerce
    .number({ required_error: "La entidad es obligatoria" })
    .int()
    .positive("La entidad debe ser un número entero positivo"),
  estadoId: z.coerce
    .number({ required_error: "El estado es obligatorio" })
    .int()
    .positive("El estado debe ser un número entero positivo"),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
});

const actualizar = z.object({
  placa: z.string().trim().min(5).max(20).optional(),
  marca: z.string().trim().min(2).max(100).optional(),
  modelo: z.string().trim().min(1).max(50).optional(),
  color: z.string().trim().min(3).max(50).optional(),
  capacidadPasajeros: z.coerce.number().int().positive().optional(),
  entidadId: z.coerce.number().int().positive().optional(),
  estadoId: z.coerce.number().int().positive().optional(),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
});

const actualizarUbicacion = z.object({
  latitud: z.coerce
    .number({ required_error: "La latitud es obligatoria" })
    .min(-90, "La latitud debe estar entre -90 y 90")
    .max(90, "La latitud debe estar entre -90 y 90"),
  longitud: z.coerce
    .number({ required_error: "La longitud es obligatoria" })
    .min(-180, "La longitud debe estar entre -180 y 180")
    .max(180, "La longitud debe estar entre -180 y 180"),
  estadoId: z.coerce
    .number({ required_error: "El estado es obligatorio" })
    .int()
    .positive("El estado debe ser un número entero positivo"),
  velocidadActual: z.coerce
    .number()
    .min(0, "La velocidad no puede ser negativa")
    .optional(),
});

module.exports = { crear, actualizar, actualizarUbicacion };
