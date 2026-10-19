/**
 * Forma en que una ruta sale por la API.
 *
 * `barrios` y `horarios` solo vienen en el detalle: en el listado no se
 * incluyen para no disparar consultas de más por cada página.
 */
exports.RespuestaRutasDto = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    nombre: model.nombre,
    origen: model.origen
      ? { id: model.origen.id, nombre: model.origen.nombre }
      : { id: model.origenId },
    destino: model.destino
      ? { id: model.destino.id, nombre: model.destino.nombre }
      : { id: model.destinoId },
    descripcion: model.descripcion,
    distanciaKm: model.distanciaKm ? parseFloat(model.distanciaKm) : null,
    tiempoEstimadoMinutos: model.tiempoEstimadoMinutos,
    costo: model.costo === null || model.costo === undefined
      ? null
      : parseFloat(model.costo),
    barrios: Array.isArray(model.barrios)
      ? model.barrios
          .map((b) => ({
            id: b.id,
            nombre: b.nombre,
            // El orden de parada vive en RutaBarrio (la tabla intermedia).
            orden: ordenDeBarrio(b),
          }))
          .sort((a, b) => a.orden - b.orden)
      : null,
    horarios: Array.isArray(model.horarios)
      ? model.horarios.map((h) => h.horaSalida).sort()
      : null,
    rutaGeometria: model.rutaGeometria || null,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};

/** Orden de parada de un barrio dentro de su ruta. */
function ordenDeBarrio(barrio) {
  // Sequelize expone la tabla intermedia como `RutaBarrio` (nombre del
  // modelo); solo si la consulta define otra alias cambia de nombre.
  const aTraves =
    barrio.RutaBarrio ||
    barrio.rutaBarrio ||
    (Array.isArray(barrio.rutaBarrios) ? barrio.rutaBarrios[0] : null);

  if (aTraves && aTraves.orden) return aTraves.orden;
  return barrio.orden || 0;
}
