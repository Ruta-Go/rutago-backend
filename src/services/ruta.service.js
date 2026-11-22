const rutaRepository = require("../repositories/ruta.repository");
const comunaRepository = require("../repositories/comuna.repository");
const {
  formatearRespuestaPaginada,
  calcularOffset,
} = require("../helpers/paginacion.helper");

exports.obtenerTodas = async (
  paginaActual = 1,
  registrosPorPagina = 10,
  q,
  sortBy = "id",
  sortOrder = "ASC",
) => {
  const offset = calcularOffset(paginaActual, registrosPorPagina);
  const limit = parseInt(registrosPorPagina);

  const { count, rows } = await rutaRepository.obtenerTodasConPaginacion(
    limit,
    offset,
    q,
    sortBy,
    sortOrder,
  );

  return formatearRespuestaPaginada(
    rows,
    count,
    paginaActual,
    registrosPorPagina,
  );
};

exports.obtenerPorId = async (id) => {
  return await rutaRepository.obtenerPorId(id);
};

exports.buscarPorDestino = async (destino) => {
  return await rutaRepository.buscarPorDestino(destino);
};

/**
 * La sede de la Universidad del Pacífico está en el barrio El Triunfo
 * (Kilómetro 13, vía al Aeropuerto). Se usa ese barrio real como parada de la
 * universidad para no inventar ubicaciones ni desplazamientos.
 */
const ALIAS_UNIVERSIDAD = [
  "universidad del pacifico",
  "universidad del pacífico",
  "universidad",
  "unipacifico",
  "up buenaventura",
];

const normalizar = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const esUniversidad = (texto) => {
  const limpio = normalizar(texto);
  return Boolean(limpio) && ALIAS_UNIVERSIDAD.includes(limpio);
};

const coincideConParada = (ruta, texto) => {
  const limpio = normalizar(texto);
  const paradas = (ruta.barrios ?? []).map((barrio) =>
    normalizar(barrio.nombre),
  );

  if (esUniversidad(texto)) {
    const descripcion = normalizar(ruta.descripcion);
    return (
      Number(ruta.origen?.id) === 7 ||
      descripcion.includes("universidad") ||
      paradas.includes("el triunfo")
    );
  }

  return paradas.includes(limpio);
};

exports.buscarPorParadas = async (origen, destino) => {
  if (!normalizar(origen) || !normalizar(destino)) {
    throw new Error("ORIGEN_Y_DESTINO_SON_OBLIGATORIOS");
  }

  if (normalizar(origen) === normalizar(destino)) {
    throw new Error("ORIGEN_Y_DESTINO_NO_PUEDEN_SER_IGUALES");
  }

  const rutas = await rutaRepository.obtenerTodasConParadas();

  return rutas
    .filter((ruta) => {
      const coincide =
        coincideConParada(ruta, origen) && coincideConParada(ruta, destino);
      const conHorario = (ruta.horarios ?? []).length > 0;
      return coincide && conHorario;
    })
    .map((ruta) => ({
      id: ruta.id,
      nombre: ruta.nombre,
      descripcion: ruta.descripcion,
      origen: ruta.origen ? { id: ruta.origen.id, nombre: ruta.origen.nombre } : null,
      destino: ruta.destino
        ? { id: ruta.destino.id, nombre: ruta.destino.nombre }
        : null,
      distanciaKm: ruta.distanciaKm,
      tiempoEstimadoMinutos: ruta.tiempoEstimadoMinutos,
      costo: ruta.costo,
      horarios: (ruta.horarios ?? []).map((horario) => horario.horaSalida),
      paradas: (ruta.barrios ?? [])
        .slice()
        .sort(
          (a, b) =>
            (a.rutaBarrio?.orden ?? 0) - (b.rutaBarrio?.orden ?? 0),
        )
        .map((barrio) => barrio.nombre),
    }));
};

exports.crearRuta = async (datos) => {
  const { nombre, origenId, destinoId } = datos;

  if (!nombre || !origenId || !destinoId) {
    throw new Error("NOMBRE_ORIGEN_Y_DESTINO_SON_OBLIGATORIOS");
  }

  if (Number(origenId) === Number(destinoId)) {
    throw new Error("ORIGEN_Y_DESTINO_NO_PUEDEN_SER_IGUALES");
  }

  const origen = await comunaRepository.obtenerPorId(origenId);
  if (!origen) {
    throw new Error("COMUNA_ORIGEN_NO_ENCONTRADA");
  }

  const destino = await comunaRepository.obtenerPorId(destinoId);
  if (!destino) {
    throw new Error("COMUNA_DESTINO_NO_ENCONTRADA");
  }

  return await rutaRepository.crearRuta(datos);
};

exports.actualizarRuta = async (id, datos) => {
  const { nombre, origenId, destinoId } = datos;

  if (!nombre || !origenId || !destinoId) {
    throw new Error("NOMBRE_ORIGEN_Y_DESTINO_SON_OBLIGATORIOS");
  }

  if (Number(origenId) === Number(destinoId)) {
    throw new Error("ORIGEN_Y_DESTINO_NO_PUEDEN_SER_IGUALES");
  }

  const origen = await comunaRepository.obtenerPorId(origenId);
  if (!origen) {
    throw new Error("COMUNA_ORIGEN_NO_ENCONTRADA");
  }

  const destino = await comunaRepository.obtenerPorId(destinoId);
  if (!destino) {
    throw new Error("COMUNA_DESTINO_NO_ENCONTRADA");
  }

  return await rutaRepository.actualizarRuta(id, datos);
};

exports.eliminarRuta = async (id) => {
  return await rutaRepository.eliminarRuta(id);
};
