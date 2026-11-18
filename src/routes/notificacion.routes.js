const express = require("express");
const router = express.Router();
const notificacionController = require("../controllers/notificacion.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const { validarSchema } = require("../middlewares/validator.middleware");
const notificacionSchema = require("../schemas/notificacion.schema");

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     summary: Notificaciones del usuario autenticado
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soloNoLeidas
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de notificaciones propias
 *       401:
 *         description: No autenticado
 */
router.get("/", authMiddleware.verificarToken, notificacionController.listar);

/**
 * @swagger
 * /api/notificaciones/no-leidas:
 *   get:
 *     summary: Cantidad de notificaciones no leídas del usuario autenticado
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: { total }
 */
router.get(
  "/no-leidas",
  authMiddleware.verificarToken,
  notificacionController.contarNoLeidas,
);

/**
 * @swagger
 * /api/notificaciones/{id}/leida:
 *   patch:
 *     summary: Marcar como leída una notificación propia
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       404:
 *         description: Notificación ajena o inexistente
 */
router.patch(
  "/:id/leida",
  authMiddleware.verificarToken,
  notificacionController.marcarLeida,
);

/**
 * @swagger
 * /api/notificaciones:
 *   post:
 *     summary: Crear una notificación real para un usuario (administrador)
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Notificación creada y difundida por WebSocket
 *       403:
 *         description: No autorizado
 */
router.post(
  "/",
  authMiddleware.verificarToken,
  roleMiddleware.esAdministrador,
  validarSchema(notificacionSchema.crear),
  notificacionController.crear,
);

module.exports = router;
