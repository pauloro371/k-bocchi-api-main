var express = require("express");
const {
  verResenas,
  crearResena,
  validarResena,
  eliminarResena,
  editarResena,
  verResena,
  verResenasPaciente,
  verResenasTerapeuta,
} = require("../Controllers/Resenas");
const { validarComentario } = require("../Controllers/Comentario");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Resena:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        id_paciente:
 *          type: integer
 *          description: Es el id del paciente que crea la resena
 *        id_terapeuta:
 *          type: integer
 *          description: Es la id del terapeuta al cual esta dirigida la resena
 *        estrellas:
 *          type: integer
 *          description: Es la cantidad de estrellas (1-10)
 *      example:
 *          id: 2
 *          id_paciente: 81
 *          id_terapeuta: 219
 *          estrellas: 2
 */

/**
 * @swagger
 * /resenas:
 *  get:
 *    summary: Permite obtener todas las resenas del sistema
 *    tags: [Resenas]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con todas las resenas
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Resena'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verResenas);
/**
 * @swagger
 * /resenas:
 *  post:
 *    summary: Permite crear una resena en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/Resena"
 *    tags: [Resenas]
 *    responses:
 *      "201":
 *        description: Devuelve la resena recien creada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Resena'
 *      "403":
 *        description: Devuelve un mensaje indicando que el terapeuta en cuestión no tiene relación con el paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "405":
 *        description: Devuelve un mensaje indicando que ya el paciente ya ha dejado su resena
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
router.post("/", validarComentario, validarResena, crearResena);
/**
 * @swagger
 * /resenas:
 *  delete:
 *    summary: Permite eliminar una resena en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: integer
 *                          description: La id de la resena a eliminar
 *                      id_paciente:
 *                          type: integer
 *                          description: La id del paciente que desea eliminar la resena
 *    tags: [Resenas]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "404":
 *        description: Devuelve un mensaje indicando que la resena no se ha encontrado
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
router.delete("/", eliminarResena);
/**
 * @swagger
 * /resenas:
 *  patch:
 *    summary: Permite modificar una resena en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: '#/components/schemas/Resena'
 *    tags: [Resenas]
 *    responses:
 *      "201":
 *        description: Devuelve la resena editada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Resena"
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro la resena
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
router.patch("/", validarComentario, editarResena);
/**
 * @swagger
 * /resenas/{id}:
 *  get:
 *    summary: Permite obtener una resena en base a su id
 *    tags: [Resenas]
 *    responses:
 *      "201":
 *        description: Devuelve la resena encontrada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Resena"
 *      "400":
 *        description: Devuelve un mensaje indicando que no se encontro la resena
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
router.get("/:id", verResena);
/**
 * @swagger
 * /resenas/paciente/{id_paciente}:
 *  get:
 *    summary: Permite obtener todas las resenas creadas de un paciente
 *    tags: [Resenas]
 *    responses:
 *      "201":
 *        description: Devuelve las resenas encontradas
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: "#/components/schemas/Resena"
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
router.get("/paciente/:id_paciente", verResenasPaciente);
/**
 * @swagger
 * /resenas/terapeuta/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener todos las resenas de un terapeuta
 *    tags: [Resenas]
 *    responses:
 *      "201":
 *        description: Devuelve las resenas encotradas
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: "#/components/schemas/Resena"
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el terapeuta
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
router.get("/terapeuta/:id_terapeuta", verResenasTerapeuta);

module.exports = router;
