const usuarioParaRespuesta = (u) =>
  u
    ? {
        id: u.id,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo: u.correo,
        rol: u.rol
          ? { id: u.rol.id, nombreRol: u.rol.nombreRol }
          : { id: u.rolId },
      }
    : undefined;

const usuarioDelPerfil = (p) =>
  p?.usuario
    ? {
        ...usuarioParaRespuesta(p.usuario),
        usuarioId: p.usuarioId ?? p.usuario?.id ?? p.usuario?.usuarioId,
      }
    : undefined;

exports.RespuestaViajesDto = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    pasajeros: (model.pasajeros || []).map((vp) =>
      usuarioDelPerfil(vp.pasajero),
    ),
    conductor: usuarioDelPerfil(model.conductor),
    ruta: model.horario?.ruta
      ? {
          id: model.horario.ruta.id,
          nombre: model.horario.ruta.nombre,
          distanciaKm: model.horario.ruta.distanciaKm
            ? parseFloat(model.horario.ruta.distanciaKm)
            : null,
          tiempoEstimadoMinutos: model.horario.ruta.tiempoEstimadoMinutos,
          rutaGeometria: model.horario.ruta.rutaGeometria || null,
          origen: model.horario.ruta.origen
            ? { id: model.horario.ruta.origen.id, nombre: model.horario.ruta.origen.nombre }
            : undefined,
          destino: model.horario.ruta.destino
            ? { id: model.horario.ruta.destino.id, nombre: model.horario.ruta.destino.nombre }
            : undefined,
        }
      : undefined,
    horario: model.horario
      ? {
          id: model.horario.id,
          horaSalida: model.horario.horaSalida,
          frecuenciaMinutos: model.horario.frecuenciaMinutos,
        }
      : undefined,
    vehiculo: model.vehiculo
      ? {
          id: model.vehiculo.id,
          placa: model.vehiculo.placa,
          capacidadPasajeros: model.vehiculo.capacidadPasajeros,
        }
      : undefined,
    estado: model.estadoViaje
      ? { id: model.estadoViaje.id, nombre: model.estadoViaje.nombre }
      : undefined,
    precioEstimado: model.precioEstimado
      ? parseFloat(model.precioEstimado)
      : null,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};
