var express = require("express");
const {
  verSalas,
  crearSala,
  modificarSala,
  eliminarSalasInactivas,
  eliminarSala,
  revisarAcceso,
} = require("../Controllers/Sala");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Sala:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        codigo_acceso:
 *          type: string
 *          description: El codigo de acceso a la sala
 *        id_terapeuta:
 *          type: string
 *          description: id el terapeuta que creo la sala
 *        id_paciente:
 *          type: string
 *          description: id del paciente que se puede unir
 *        fecha_inicio:
 *          type: string
 *          description: la fecha de inicio de la sesion
 *        fecha_ultima_desconexion:
 *          type: string
 *          description: es la ultima fecha de desconexión de un usuario en la sala
 *        isEmpty:
 *          type: integer
 *          description: Es una bandera para saber si la sala esta vacía
 *      example:
 *          id: 10
 *          codigo_acceso: kdkgcd35
 *          id_terapeuta: 218
 *          id_paciente: 81
 *          fecha_inicio: 2023-07-21T10:26:00Z
 *          fecha_ultima_desconexion: 2023-07-21T10:31:00Z
 *          isEmpty: 1
 *
 */

/**
 * @swagger
 * /salas/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener todas las notas de un terapeuta
 *    tags: [Salas]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con todas las salas
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Sala'
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
router.get("/:id_terapeuta", verSalas);
/**
 * @swagger
 * /salas:
 *  post:
 *    summary: Permite crear una sala en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/Sala"
 *    tags: [Salas]
 *    responses:
 *      "201":
 *        description: Devuelve la sala recien creada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Sala'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.post("/", crearSala);
/**
 * @swagger
 * /salas:
 *  patch:
 *    summary: Permite modificar una sala en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/Sala"
 *    tags: [Salas]
 *    responses:
 *      "201":
 *        description: Devuelve la sala con las modificaciones
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Sala'
 *      "404":
 *         description: Devuelve un mensaje indicando que no se encontro la sala
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.patch("/", modificarSala);

/**
 * @swagger
 * /salas/inactivas:
 *  delete:
 *    summary: Permite eliminar las salas inactivas del sistema
 *    tags: [Salas]
 *    responses:
 *      "200":
 *        description: Devuelve la cantidad de salas eliminadas
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
router.delete("/inactivas", eliminarSalasInactivas);
/**
 * @swagger
 * /salas/{id_sala}:
 *  delete:
 *    summary: Permite eliminar una sala del sistema
 *    tags: [Salas]
 *    responses:
 *      "201":
 *        description: Devuelve la cantidad de salas eliminadas
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "404":
 *         description: Devuelve un mensaje indicando que no se encontro la sala
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: path
 *        name: id_sala
 *        required: true
 *        schema:
 *          type: integer
 */
router.delete("/:id_sala", eliminarSala);
/**
 * @swagger
 * /salas/acceso/{codigo_acceso}/{id_usuario}:
 *  get:
 *    summary: Permite revisar si un usuario puede acceder a una sala
 *    tags: [Salas]
 *    responses:
 *      "200":
 *        description: Devuelve un mensaje indicando que el usuario puede acceder a la sala
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *         description: Devuelve un mensaje indicando que no se encontro la sala
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *      "401":
 *         description: Devuelve un mensaje indicando que el usuario no tiene acceso a la sala
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *      "403":
 *         description: Devuelve un mensaje indicando que aun no se puede acceder a la sala
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: path
 *        name: codigo_acceso
 *        required: true
 *        schema:
 *          type: string
 *      - in: path
 *        name: id_usuario
 *        required: true
 *        schema:
 *          type: string
 */
router.get("/acceso/:codigo_acceso/:id_usuario", revisarAcceso);

module.exports = router;
