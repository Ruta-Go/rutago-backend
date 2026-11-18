const rutaService = require("../services/ruta.service");
const geoService = require("../services/geo.service");
const rutaDto = require("../dtos/ruta.dto");

const manejarError = (res, error) => {
  if (error.message?.includes("_NO_ENCONTRADO")) {
    return res
      .status(404)
      .json({ success: false, message: "Recurso no encontrado" });
  }
  res.status(400).json({ success: false, message: error.message });
};

exports.obtenerTodas = async (req, res) => {
  try {
    const { paginaActual, registrosPorPagina, q, sortBy, sortOrder } =
      req.query;
    const resultado = await rutaService.obtenerTodas(
      paginaActual,
      registrosPorPagina,
      q,
      sortBy,
      sortOrder,
    );
    res.json({
      success: true,
      data: resultado.data.map(rutaDto.RespuestaRutasDto),
      paginacion: resultado.paginacion,
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.obtenerCercanas = async (req, res) => {
  try {
    const resultado = await geoService.obtenerRutasCercanas(req.body);
    res.json({
      success: true,
      motor: resultado.motor,
      data: resultado.rutas,
    });
  } catch (error) {
    const mensajes = {
      LATITUD_INVALIDA: "La latitud no es válida",
      LONGITUD_INVALIDA: "La longitud no es válida",
      RADIO_INVALIDO: "El radio de búsqueda no es válido",
      LIMITE_INVALIDO: "El límite de resultados no es válido",
    };
    res.status(400).json({
      success: false,
      message: mensajes[error.message] || error.message,
    });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const ruta = await rutaService.obtenerPorId(req.params.id);
    res.json({ success: true, data: rutaDto.RespuestaRutasDto(ruta) });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.crearRuta = async (req, res) => {
  try {
    const datos = req.body;
    const ruta = await rutaService.crearRuta(datos);
    res.status(201).json({
      success: true,
      message: "Ruta creada",
      data: rutaDto.RespuestaRutasDto(ruta),
    });
  } catch (error) {
    if (error.message === "RUTA_YA_EXISTE") {
      return res
        .status(400)
        .json({ success: false, message: "Ya existe una ruta con ese nombre" });
    }
    manejarError(res, error);
  }
};

exports.actualizarRuta = async (req, res) => {
  try {
    const datos = req.body;
    const ruta = await rutaService.actualizarRuta(req.params.id, datos);
    res.json({
      success: true,
      message: "Ruta actualizada",
      data: rutaDto.RespuestaRutasDto(ruta),
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.buscarPorDestino = async (req, res) => {
  try {
    const rutas = await rutaService.buscarPorDestino(req.params.destino);
    res.json({ success: true, data: rutas.map(rutaDto.RespuestaRutasDto) });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.eliminarRuta = async (req, res) => {
  try {
    await rutaService.eliminarRuta(req.params.id);
    res.json({ success: true, message: "Ruta eliminada" });
  } catch (error) {
    manejarError(res, error);
  }
};
