var express = require("express");
const { compartirNotas, eliminarNota } = require("../Controllers/Notas");
const {
  verNotificaciones,
  crearNotificacion,
  eliminarNotificacion,
  editarNotificacion,
  verNotificacionesUsuario,
  eliminarTodasNotificaciones,
  marcarComoLeidas,
} = require("../Controllers/Notificaciones");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Notificacion:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        id_usuario:
 *          type: string
 *          description: El identificador de usuario asociado a la notificacion
 *        descripcion:
 *          type: string
 *          description: Es el cuerpo de la notificacion
 *        contexto_movil:
 *          type: string
 *          description: Es el contexto asociado a la notificacion
 *        contexto_web:
 *          type: string
 *          description: Es el contexto asociado a la notificacion
 *        fecha:
 *          type: string
 *          description: Fecha de creación de la notificación
 *        titulo:
 *          type: string
 *          description: Es el título de la notificación
 *      example:
 *          id: 10
 *          id_usuario: "16473224-ba24-4c60-9508-24b5e885fcdamock"
 *          descripcion: ¡Hola! ¿Como estas?
 *          contexto_web: /texto
 *          contexto_movil: activity
 *          fecha: 2023-06-03T20:30:33.000Z
 *          titulo: Guillermo te ha mandado un mensaje
 */

/**
 * @swagger
 * /notificaciones:
 *  get:
 *    summary: Permite obtener todas las notas del sistema
 *    tags: [Notificaciones]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con todas las notificaciones
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Notificacion'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verNotificaciones);
/**
 * @swagger
 * /notificaciones:
 *  post:
 *    summary: Permite crear una notificacion en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/Notificacion"
 *    tags: [Notificaciones]
 *    responses:
 *      "201":
 *        description: Devuelve un la notificacion recien creada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Notificacion'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.post("/", crearNotificacion);
/**
 * @swagger
 * /notificaciones:
 *  delete:
 *    summary: Permite eliminar una notificacion en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: integer
 *                          description: La id de la notificación a eliminar
 *    tags: [Notificaciones]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.delete("/", eliminarNotificacion);
/**
 * @swagger
 * /notificaciones/todas/{id_usuario}:
 *  delete:
 *    summary: Permite eliminar todas las notificaciones de un usuario en el sistema
 *    tags: [Notificaciones]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - in: path
 *        name: id_usuario
 *        type: string
 *        required: true
 */
router.delete("/todas/:id_usuario", eliminarTodasNotificaciones);
/**
 * @swagger
 * /notificaciones/todas/{id_usuario}:
 *  patch:
 *    summary: Permite marcar todas las notificaciones de un usuario como leidas en el sistema
 *    tags: [Notificaciones]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - in: path
 *        name: id_usuario
 *        type: string
 *        required: true
 */
router.patch("/todas/:id_usuario", marcarComoLeidas);
/**
 * @swagger
 * /notificaciones:
 *  patch:
 *    summary: Permite modificar una notificacion en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/Notificacion"
 *    tags: [Notificaciones]
 *    responses:
 *      "201":
 *        description: Devuelve la notificacion modificada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Notificacion"
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.patch("/", editarNotificacion);

/**
 * @swagger
 * /notificaciones/usuario/{id}:
 *  get:
 *    summary: Permite obtener las notificaciones de un usuario
 *    description: Permite obtener todas las notificaciones de un usuario
 *    tags: [Notificaciones]
 *    responses:
 *      "201":
 *        description: Devuelve un arreglo con las notas del terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Notificacion'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: path
 *        name: id
 *        required: false
 *        schema:
 *          type: string
 */
router.get("/usuario/:id", verNotificacionesUsuario);

module.exports = router;
