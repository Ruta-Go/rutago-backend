const express = require("express");
const router = express.Router();
const vehiculoController = require("../controllers/vehiculo.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ownership = require("../middlewares/ownership.middleware");
const { validarSchema } = require("../middlewares/validator.middleware");
const vehiculoSchema = require("../schemas/vehiculo.schema");

/**
 * @swagger
 * /api/vehiculos:
 *   get:
 *     summary: Obtener todos los vehículos (paginado)
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paginaActual
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: registrosPorPagina
 *         schema:
 *           type: integer
 *         description: Registros por página
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: estadoId
 *         schema:
 *           type: integer
 *         description: Filtrar por estado del vehículo
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Campo de ordenamiento
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Dirección del ordenamiento
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *       401:
 *         description: No autenticado
 */
router.get(
  "/",
  authMiddleware.verificarToken,
  roleMiddleware.esAdminOEntidadOConductor,
  validarSchema(require("../schemas/paginacion.schema").paginacion, "query"),
  vehiculoController.obtenerTodos,
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   get:
 *     summary: Obtener un vehículo por ID
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Datos del vehículo
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vehículo no encontrado
 */
router.get(
  "/:id",
  authMiddleware.verificarToken,
  roleMiddleware.esAdminOEntidadOConductor,
  vehiculoController.obtenerPorId,
);

/**
 * @swagger
 * /api/vehiculos/{id}/ubicacion:
 *   get:
 *     summary: Obtener ubicación de un vehículo
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Ubicación del vehículo
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vehículo no encontrado
 */
router.get(
  "/:id/ubicacion",
  authMiddleware.verificarToken,
  vehiculoController.obtenerUbicacion,
);

/**
 * @swagger
 * /api/vehiculos/{id}/ubicacion:
 *   put:
 *     summary: Actualizar ubicación de un vehículo (conductor)
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitud
 *               - longitud
 *               - estadoId
 *             properties:
 *               latitud:
 *                 type: number
 *                 format: float
 *               longitud:
 *                 type: number
 *                 format: float
 *               estadoId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ubicación actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */
router.put(
  "/:id/ubicacion",
  authMiddleware.verificarToken,
  roleMiddleware.esConductor,
  ownership.vehiculoAsignadoAConductor,
  validarSchema(vehiculoSchema.actualizarUbicacion),
  vehiculoController.actualizarUbicacion,
);

/**
 * @swagger
 * /api/vehiculos:
 *   post:
 *     summary: Crear un nuevo vehículo
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - marca
 *               - modelo
 *               - color
 *               - capacidadPasajeros
 *               - entidadId
 *               - estadoId
 *             properties:
 *               placa:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               color:
 *                 type: string
 *               capacidadPasajeros:
 *                 type: integer
 *               entidadId:
 *                 type: integer
 *               estadoId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post(
  "/",
  authMiddleware.verificarToken,
  roleMiddleware.esAdminOEntidad,
  ownership.vehiculoEntidadCreacion,
  validarSchema(vehiculoSchema.crear),
  vehiculoController.crearVehiculo,
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   put:
 *     summary: Actualizar un vehículo por ID
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               placa:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               color:
 *                 type: string
 *               capacidadPasajeros:
 *                 type: integer
 *               entidadId:
 *                 type: integer
 *               estadoId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vehículo actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */
router.put(
  "/:id",
  authMiddleware.verificarToken,
  roleMiddleware.esAdminOEntidad,
  ownership.vehiculoDeMiEntidad,
  validarSchema(vehiculoSchema.actualizar),
  vehiculoController.actualizarVehiculo,
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   delete:
 *     summary: Eliminar un vehículo por ID
 *     tags: [Vehículos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Vehículo no encontrado
 */
router.delete(
  "/:id",
  authMiddleware.verificarToken,
  roleMiddleware.esAdminOEntidad,
  ownership.vehiculoDeMiEntidad,
  vehiculoController.eliminarVehiculo,
);

module.exports = router;
