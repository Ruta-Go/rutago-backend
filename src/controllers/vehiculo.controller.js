const vehiculoService = require("../services/vehiculo.service");
const entidadRepository = require("../repositories/entidad.repository");
const vehiculoRepository = require("../repositories/vehiculo.repository");
const tiempoReal = require("../services/tiempo-real.service");
const { Viaje } = require("../models");
const { ROLES } = require("../config/roles");
const { ESTADOS_VIAJE } = require("../config/estados");
const vehiculoDto = require("../dtos/vehiculo.dto");

const manejarError = (res, error) => {
  if (error.message?.includes("_NO_ENCONTRADO")) {
    return res
      .status(404)
      .json({ success: false, message: "Recurso no encontrado" });
  }
  res.status(400).json({ success: false, message: error.message });
};

exports.obtenerTodos = async (req, res) => {
  try {
    const { paginaActual, registrosPorPagina, q, estadoId, sortBy, sortOrder } =
      req.query;
    const resultado = await vehiculoService.obtenerTodos(
      paginaActual,
      registrosPorPagina,
      q,
      estadoId,
      sortBy,
      sortOrder,
    );
    res.json({
      success: true,
      data: resultado.data.map(vehiculoDto.RespuestaVehiculosDto),
      paginacion: resultado.paginacion,
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const vehiculo = await vehiculoService.obtenerPorId(req.params.id);
    res.json({
      success: true,
      data: vehiculoDto.RespuestaVehiculosDto(vehiculo),
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.obtenerUbicacion = async (req, res) => {
  try {
    const ubicacion = await vehiculoService.obtenerUbicacion(req.params.id);
    res.json({ success: true, data: ubicacion });
  } catch (error) {
    if (error.message === "VEHICULO_NO_ENCONTRADO") {
      return res
        .status(404)
        .json({ success: false, message: "Vehículo no encontrado" });
    }
    manejarError(res, error);
  }
};

exports.actualizarUbicacion = async (req, res) => {
  try {
    const vehiculo = await vehiculoService.actualizarUbicacion(
      req.params.id,
      req.body,
    );
    // El viaje activo se busca sólo para saber a qué sala de pasajeros
    // notificar. La propiedad y el permiso ya los validó el middleware.
    let viajeActivo = null;
    try {
      viajeActivo = await Viaje.findOne({
        where: {
          vehiculoId: req.params.id,
          estadoId: [ESTADOS_VIAJE.ACEPTADO, ESTADOS_VIAJE.EN_CURSO],
        },
        attributes: ["id"],
        order: [["createdAt", "DESC"]],
      });
      tiempoReal.publicarUbicacion(
        req.params.id,
        {
          latitud: Number(req.body.latitud),
          longitud: Number(req.body.longitud),
          estadoId: Number(req.body.estadoId),
          velocidadActual:
            req.body.velocidadActual === undefined
              ? null
              : Number(req.body.velocidadActual),
          ultimaActualizacion: vehiculo.ultimaActualizacion,
        },
        viajeActivo?.id || null,
      );
    } catch (error) {
      console.warn("[vehiculos] no se pudo difundir la ubicación:", error.message);
    }

    res.json({
      success: true,
      message: "Ubicación actualizada",
      data: vehiculo,
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.crearVehiculo = async (req, res) => {
  try {
    const datos = req.body;
    if (req.usuario.rolId === ROLES.ENTIDAD) {
      const entidad = await entidadRepository.obtenerPorUsuario(req.usuario.id);
      if (!entidad) {
        return res
          .status(400)
          .json({ success: false, message: "No tienes un perfil de entidad." });
      }
      datos.entidadId = entidad.id;
    }
    const vehiculo = await vehiculoService.crearVehiculo(datos);
    res.status(201).json({
      success: true,
      message: "Vehículo creado",
      data: vehiculoDto.RespuestaVehiculosDto(vehiculo),
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.actualizarVehiculo = async (req, res) => {
  try {
    if (req.usuario.rolId === ROLES.ENTIDAD) {
      const entidad = await entidadRepository.obtenerPorUsuario(req.usuario.id);
      if (!entidad) {
        return res
          .status(400)
          .json({ success: false, message: "No tienes un perfil de entidad." });
      }
      const vehiculo = await vehiculoRepository.obtenerPorId(req.params.id);
      if (vehiculo.entidadId !== entidad.id) {
        return res.status(403).json({
          success: false,
          message: "No puedes modificar vehículos de otra entidad.",
        });
      }
    }
    const datos = req.body;
    const vehiculo = await vehiculoService.actualizarVehiculo(
      req.params.id,
      datos,
    );
    res.json({
      success: true,
      message: "Vehículo actualizado",
      data: vehiculoDto.RespuestaVehiculosDto(vehiculo),
    });
  } catch (error) {
    manejarError(res, error);
  }
};

exports.eliminarVehiculo = async (req, res) => {
  try {
    if (req.usuario.rolId === ROLES.ENTIDAD) {
      const entidad = await entidadRepository.obtenerPorUsuario(req.usuario.id);
      if (!entidad) {
        return res
          .status(400)
          .json({ success: false, message: "No tienes un perfil de entidad." });
      }
      const vehiculo = await vehiculoRepository.obtenerPorId(req.params.id);
      if (vehiculo.entidadId !== entidad.id) {
        return res.status(403).json({
          success: false,
          message: "No puedes eliminar vehículos de otra entidad.",
        });
      }
    }
    await vehiculoService.eliminarVehiculo(req.params.id);
    res.json({ success: true, message: "Vehículo eliminado" });
  } catch (error) {
    manejarError(res, error);
  }
};
