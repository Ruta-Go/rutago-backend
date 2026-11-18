const express = require("express");
const router = express.Router();
const pasajeroController = require("../controllers/pasajero.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ownership = require("../middlewares/ownership.middleware");
const { validarSchema } = require("../middlewares/validator.middleware");
const pasajeroSchema = require("../schemas/pasajero.schema");

/**
 * @swagger
 * /api/pasajeros:
 *   get:
 *     summary: Obtener todos los pasajeros (paginado)
 *     tags: [Pasajeros]
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
 *         description: Lista de pasajeros
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get(
  "/",
  authMiddleware.verificarToken,
  roleMiddleware.esAdministrador,
  validarSchema(require("../schemas/paginacion.schema").paginacion, "query"),
  pasajeroController.obtenerTodos,
);

/**
 * @swagger
 * /api/pasajeros/me/perfil:
 *   get:
 *     summary: Obtener mi pasajero
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del pasajero
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
  roleMiddleware.esPasajero,
  pasajeroController.obtenerMiPerfil,
);

/**
 * @swagger
 * /api/pasajeros/me/perfil:
 *   put:
 *     summary: Actualizar mi pasajero
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
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
  roleMiddleware.esPasajero,
  validarSchema(pasajeroSchema.actualizar),
  pasajeroController.actualizarMiPerfil,
);

/**
 * @swagger
 * /api/pasajeros/usuario/{usuarioId}:
 *   get:
 *     summary: Obtener pasajero por ID de usuario
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del pasajero
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Perfil no encontrado
 */
router.get(
  "/usuario/:usuarioId",
  authMiddleware.verificarToken,
  ownership.pasajeroPropio,
  pasajeroController.obtenerPorUsuarioId,
);

/**
 * @swagger
 * /api/pasajeros/{id}:
 *   get:
 *     summary: Obtener un pasajero por ID
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pasajero
 *     responses:
 *       200:
 *         description: Datos del pasajero
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
  roleMiddleware.esAdministrador,
  pasajeroController.obtenerPorId,
);

/**
 * @swagger
 * /api/pasajeros:
 *   post:
 *     summary: Crear un nuevo pasajero
 *     tags: [Pasajeros]
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
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Perfil de pasajero creado exitosamente
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
  validarSchema(pasajeroSchema.crear),
  pasajeroController.crear,
);

/**
 * @swagger
 * /api/pasajeros/{id}:
 *   put:
 *     summary: Actualizar un pasajero por ID
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pasajero
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioId:
 *                 type: integer
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
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
  validarSchema(pasajeroSchema.actualizar),
  pasajeroController.actualizar,
);

/**
 * @swagger
 * /api/pasajeros/{id}:
 *   delete:
 *     summary: Eliminar un pasajero por ID
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pasajero
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
  pasajeroController.eliminar,
);

/**
 * @swagger
 * /api/pasajeros/crear-usuario:
 *   post:
 *     summary: Crear usuario pasajero + perfil simultáneamente (admin)
 *     tags: [Pasajeros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               datosUsuario:
 *                 type: object
 *                 properties:
 *                   nombres:
 *                     type: string
 *                   apellidos:
 *                     type: string
 *                   correo:
 *                     type: string
 *                   contrasena:
 *                     type: string
 *               datosPerfil:
 *                 type: object
 *                 properties:
 *                   telefono:
 *                     type: string
 *                   direccion:
 *                     type: string
 *                   tipoDocumentoId:
 *                     type: integer
 *                   numeroDocumento:
 *                     type: string
 *                   fechaNacimiento:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: Usuario y perfil creados exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post(
  "/crear-usuario",
  authMiddleware.verificarToken,
  roleMiddleware.esAdministrador,
  validarSchema(pasajeroSchema.crearConUsuario),
  pasajeroController.crearConUsuario,
);

module.exports = router;
