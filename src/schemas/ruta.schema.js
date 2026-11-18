const { z } = require("zod");

const crear = z.object({
  nombre: z
    .string({ required_error: "El nombre de la ruta es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener entre 2 y 200 caracteres")
    .max(200, "El nombre debe tener entre 2 y 200 caracteres"),
  origenId: z.coerce
    .number({ required_error: "La comuna de origen es obligatoria" })
    .int()
    .positive("La comuna de origen debe ser un número entero positivo"),
  destinoId: z.coerce
    .number({ required_error: "La comuna de destino es obligatoria" })
    .int()
    .positive("La comuna de destino debe ser un número entero positivo"),
  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no debe exceder 500 caracteres")
    .optional(),
  distanciaKm: z.coerce
    .number()
    .positive("La distancia debe ser un número positivo")
    .optional(),
  tiempoEstimadoMinutos: z.coerce
    .number()
    .int()
    .positive("El tiempo estimado debe ser un número entero positivo")
    .optional(),
  rutaGeometria: z.string().optional(),
});

const cercanas = z.object({
  latitud: z.coerce
    .number({ required_error: "La latitud es obligatoria" })
    .min(-90, "La latitud debe estar entre -90 y 90")
    .max(90, "La latitud debe estar entre -90 y 90"),
  longitud: z.coerce
    .number({ required_error: "La longitud es obligatoria" })
    .min(-180, "La longitud debe estar entre -180 y 180")
    .max(180, "La longitud debe estar entre -180 y 180"),
  radioMetros: z.coerce
    .number()
    .positive("El radio debe ser mayor a 0")
    .max(50000, "El radio máximo es 50000 metros")
    .optional(),
  limite: z.coerce.number().int().min(1).max(100).optional(),
});

const actualizar = z.object({
  nombre: z.string().trim().min(2).max(200).optional(),
  origenId: z.coerce.number().int().positive().optional(),
  destinoId: z.coerce.number().int().positive().optional(),
  descripcion: z.string().trim().max(500).optional(),
  distanciaKm: z.coerce.number().positive().optional(),
  tiempoEstimadoMinutos: z.coerce.number().int().positive().optional(),
  rutaGeometria: z.string().optional(),
});

module.exports = { crear, actualizar, cercanas };
