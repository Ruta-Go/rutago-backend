const express = require("express");
const router = express.Router();
const conductorController = require("../controllers/conductor.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ownership = require("../middlewares/ownership.middleware");
const { validarSchema } = require("../middlewares/validator.middleware");
const conductorSchema = require("../schemas/conductor.schema");

/**
 * @swagger
 * /api/conductores:
 *   get:
 *     summary: Obtener todos los conductores (paginado)
 *     tags: [Conductores]
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
 *         description: Lista de conductores
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get(
  "/",
  authMiddleware.verificarToken,
  roleMiddleware.esAdminOEntidad,
  validarSchema(require("../schemas/paginacion.schema").paginacion, "query"),
  conductorController.obtenerTodos,
);

/**
 * @swagger
 * /api/conductores/me/perfil:
 *   get:
 *     summary: Obtener mi conductor
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del conductor
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.get(
  "/me/perfil",
  authMiddleware.verificarToken,
  roleMiddleware.esConductor,
  conductorController.obtenerMiPerfil,
);

/**
 * @swagger
 * /api/conductores/me/perfil:
 *   put:
 *     summary: Actualizar mi conductor
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenciaConducir:
 *                 type: string
 *               estadoId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.put(
  "/me/perfil",
  authMiddleware.verificarToken,
  roleMiddleware.esConductor,
  validarSchema(conductorSchema.actualizarPerfilConductor),
  conductorController.actualizarMiPerfil,
);

/**
 * @swagger
 * /api/conductores/{id}:
 *   get:
 *     summary: Obtener un conductor por ID
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Datos del conductor
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.get(
  "/:id",
  authMiddleware.verificarToken,
  ownership.conductorVisible,
  conductorController.obtenerPorId,
);

/**
 * @swagger
 * /api/conductores:
 *   post:
 *     summary: Crear un nuevo conductor
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioId:
 *                 type: integer
 *               licenciaConducir:
 *                 type: string
 *               estadoId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Perfil de conductor creado exitosamente
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
  roleMiddleware.esAdministrador,
  validarSchema(conductorSchema.crear),
  conductorController.crear,
);

/**
 * @swagger
 * /api/conductores/{id}:
 *   put:
 *     summary: Actualizar un conductor por ID
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioId:
 *                 type: integer
 *               licenciaConducir:
 *                 type: string
 *               estadoId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.put(
  "/:id",
  authMiddleware.verificarToken,
  roleMiddleware.esAdministrador,
  validarSchema(conductorSchema.actualizar),
  conductorController.actualizar,
);

/**
 * @swagger
 * /api/conductores/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un conductor
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estadoId
 *             properties:
 *               estadoId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.patch(
  "/:id/estado",
  authMiddleware.verificarToken,
  roleMiddleware.esConductor,
  ownership.conductorPropio,
  validarSchema(conductorSchema.cambiarEstado),
  conductorController.cambiarEstado,
);

/**
 * @swagger
 * /api/conductores/crear-usuario:
 *   post:
 *     summary: Crear usuario + conductor en una sola llamada
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombres
 *               - apellidos
 *               - correo
 *               - contrasena
 *             properties:
 *               nombres:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *               vehiculoId:
 *                 type: integer
 *               licenciaConducir:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conductor creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post(
  "/crear-usuario",
  authMiddleware.verificarToken,
  roleMiddleware.esAdministrador,
  validarSchema(conductorSchema.crearConUsuario),
  conductorController.crearConUsuario,
);

/**
 * @swagger
 * /api/conductores/{id}:
 *   delete:
 *     summary: Eliminar un conductor por ID
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Perfil eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.delete(
  "/:id",
  authMiddleware.verificarToken,
  roleMiddleware.esAdministrador,
  conductorController.eliminar,
);

module.exports = router;
