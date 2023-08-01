var express = require("express");
const {
  verComentarios,
  crearComentario,
  eliminarComentario,
  editarComentario,
  verComentario,
  verComentariosPaciente,
  verComentariosTerapeuta,
  validarComentario,
} = require("../Controllers/Comentario");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Comentario:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        contenido:
 *          type: string
 *          description: Es el contenido del comentario
 *        fecha_creacion:
 *          type: string
 *          description: Es la fecha de creacion del comentario
 *        fecha_edicion:
 *          type: string
 *          description: Es la fecha de ultima edición del comentario (si no se ha editado es null)
 *        id_paciente:
 *          type: integer
 *          description: id del paciente que creo el comentario
 *        id_terapeuta:
 *          type: integer
 *          description: id del terapeuta que recibe el comentario
 *      example:
 *          id: 5
 *          contenido: Muy buen terapeuta, me ayudo mucho
 *          fecha_creacion: 2023-06-23T23:00:34.000Z
 *          fecha_edicion: 2023-06-23T23:00:34.000Z
 *          id_paciente: 12
 *          id_terapeuta: 20
 */

/**
 * @swagger
 * /comentarios:
 *  get:
 *    summary: Permite obtener todas los comentarios del sistema
 *    tags: [Comentarios]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con todas los comentarios
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Comentario'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verComentarios);
/**
 * @swagger
 * /comentarios:
 *  post:
 *    summary: Permite crear un comentario en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/Comentario"
 *    tags: [Comentarios]
 *    responses:
 *      "201":
 *        description: Devuelve el comentario recien creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Comentario'
 *      "403":
 *        description: Devuelve un mensaje indicando que el terapeuta en cuestión no tiene relación con el paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.post("/", validarComentario, crearComentario);
/**
 * @swagger
 * /comentarios:
 *  delete:
 *    summary: Permite eliminar un comentario en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: integer
 *                          description: La id de la nota a eliminar
 *                      id_paciente:
 *                          type: integer
 *                          description: La id del paciente que desea eliminar el comentario
 *    tags: [Comentarios]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "404":
 *        description: Devuelve un mensaje indicando que el comentario no se ha encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.delete("/", eliminarComentario);
/**
 * @swagger
 * /comentarios:
 *  patch:
 *    summary: Permite modificar un comentario en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: integer
 *                          description: La id del comentario a modificar
 *                      comentario:
 *                          type: object
 *                          $ref: '#/components/schemas/Comentario'
 *    tags: [Comentarios]
 *    responses:
 *      "201":
 *        description: Devuelve el comentario editado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Comentario"
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el comentario
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "403":
 *        description: Devuelve un mensaje indicando que el terapeuta no tiene relación con el paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.patch("/", validarComentario, editarComentario);
/**
 * @swagger
 * /comentarios/{id}:
 *  get:
 *    summary: Permite obtener un comentario en base a su id
 *    tags: [Comentarios]
 *    responses:
 *      "201":
 *        description: Devuelve el comentario encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Comentario"
 *      "400":
 *        description: Devuelve un mensaje indicando que no se encontro el comentario
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 */
router.get("/:id", verComentario);
/**
 * @swagger
 * /comentarios/paciente/{id_paciente}:
 *  get:
 *    summary: Permite obtener todos los comentarios de un paciente
 *    tags: [Comentarios]
 *    responses:
 *      "201":
 *        description: Devuelve los comentarios encontrados
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: "#/components/schemas/Comentario"
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: path
 *        name: id_paciente
 *        required: true
 *        schema:
 *          type: integer
 */
router.get("/paciente/:id_paciente", verComentariosPaciente);
/**
 * @swagger
 * /comentarios/terapeuta/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener todos los comentarios de un terapeuta
 *    tags: [Comentarios]
 *    responses:
 *      "201":
 *        description: Devuelve los comentarios encotrados
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: "#/components/schemas/Comentario"
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 */
router.get("/terapeuta/:id_terapeuta", verComentariosTerapeuta);

module.exports = router;
