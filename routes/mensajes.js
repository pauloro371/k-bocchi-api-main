const express = require("express");
const { crearMensaje, borrarMensaje, modificarMensaje, verMensajes, verChat, verChats } = require("../Controllers/Mensajes");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Mensaje:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        id_from:
 *          type: string
 *          description: Es la longitud (ubicacion) de la cita
 *        id_to:
 *          type: string
 *          description: Es la latitud (ubicacion) de la cita
 *        fecha:
 *          type: string
 *          description: El id del paciente al que pertenece la cita
 *          format: date-time
 *        contenido:
 *          type: string
 *          description: El id del terapeuta al que pertenece la cita
 *      example:
 *          id: 10
 *          id_from: 0caaade1-694d-4af3-ad19-bce4d9e839d0
 *          id_to: 4213dec2-1fa7-4518-ad63-cd6bd97915eb
 *          fecha: "2023-06-05T20:08:00.000Z"
 *          contenido: Hola, ¿Cómo estas?
 *
 *
 */

/**
 * @swagger
 * /mensajes:
 *  post:
 *    summary: Permite crear un mensaje
 *    tags: [Mensajes]
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      mensaje:
 *                          type: object
 *                          $ref: "#/components/schemas/Mensaje"
 *    responses:
 *      "200":
 *        description: Devuelve el mensaje creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Mensaje'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.post("/", crearMensaje);
/**
 * @swagger
 * /mensajes/{id}:
 *  delete:
 *    summary: Permite eliminar una mensaje
 *    tags: [Mensajes]
 *    responses:
 *      "200":
 *        description: Devuelve la cantidad de mensajes eliminados
 *        content:
 *          application/json:
 *            schema:
 *              type: number
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 */
router.delete("/:id", borrarMensaje);
/**
 * @swagger
 * /mensajes:
 *  patch:
 *    summary: Permite modificar una cita
 *    tags: [Mensajes]
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      mensaje:
 *                          type: object
 *                          $ref: "#/components/schemas/Mensaje"
 *    responses:
 *      "200":
 *        description: Devuelve el mensaje con los datos modificados
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Mensaje'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.patch("/", modificarMensaje);
/**
 * @swagger
 * /mensajes:
 *  get:
 *    summary: Permite ver todos los mensajes del sistema (privacidad XD)
 *    tags: [Mensajes]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo de mensajes
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Mensaje'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verMensajes);
/**
 * @swagger
 * /mensajes/chat/{id_to}/{id_from}:
 *  get:
 *    summary: Permite obtener los mensajes de un determinado chat entre dos usuarios
 *    tags: [Mensajes]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con los mensajes del chat en cuestión
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Mensaje'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *        - in: path
 *          name: id_to
 *          required: true
 *        - in: path
 *          name: id_from
 *          required: true
 */
router.get("/chat/:id_to/:id_from", verChat);
/**
 * @swagger
 * /mensajes/chats/{id_usuario}:
 *  get:
 *    summary: Permite obtener los chats del usuario
 *    tags: [Mensajes]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con los chats del usuario
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Usuario'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *        - in: path
 *          name: id_usuario
 *          required: true
 */
router.get("/chats/:id_usuario", verChats);
module.exports = router;
