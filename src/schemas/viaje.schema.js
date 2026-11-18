const { z } = require("zod");

const crear = z.object({
  rutaId: z.coerce
    .number({ required_error: "La ruta es obligatoria" })
    .int()
    .positive("La ruta debe ser un número entero positivo"),
  horarioId: z.coerce
    .number({ required_error: "El horario es obligatorio" })
    .int()
    .positive("El horario debe ser un número entero positivo"),
  precioEstimado: z.coerce
    .number()
    .positive("El precio debe ser un número positivo")
    .optional(),
});

const aceptar = z.object({
  vehiculoId: z.coerce
    .number()
    .int()
    .positive("El vehículo debe ser un número entero positivo")
    .optional(),
});

module.exports = { crear, aceptar };
