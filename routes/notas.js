var express = require("express");
const {
  verNotas,
  crearNota,
  eliminarNota,
  validarAutoridad,
  modificarNota,
  verNotasTerapeuta,
  verNotasPaciente,
  compartirNotas,
  verNotasPacienteCompartidas,
} = require("../Controllers/Notas");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Nota:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        diagnostico:
 *          type: string
 *          description: El diagnostico realizado por el terapeuta
 *        observaciones:
 *          type: string
 *          description: Son las observaciones realizadas por el terapeuta
 *        tratamiento:
 *          type: string
 *          description: Es el tratamiento provisto por el terapeuta
 *        evolucion:
 *          type: string
 *          description: Es la evolución del paciente, provista por el terapeuta
 *        titulo:
 *          type: string
 *          description: Es un título para poder identificar más fácilmente la nota
 *        id_cita:
 *          type: integer
 *          description: Es el identificador que asocia la nota con una cita
 *        cita_nota:
 *          type: object
 *          $ref: "#/components/schemas/Cita"
 *          description: Es el objeto con los datos de la cita asociada a la nota
 *
 *      example:
 *          id: 10
 *          diagnostico: Un esguince de rodilla
 *          observaciones: Cuidado con las actividades desgastantes
 *          tratamiento: 10 repeticiones de tal ejercicio
 *          evolucion: Mejorando, podría jugar futbol de vuelta en 2 meses
 *          titulo: Caso de paciente
 *          id_cita: 20
 *
 */

/**
 * @swagger
 * /notas:
 *  get:
 *    summary: Permite obtener todas las notas del sistema
 *    tags: [Notas]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con todas las citas
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Nota'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verNotas);
/**
 * @swagger
 * /notas:
 *  post:
 *    summary: Permite crear una nota en el sistema
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                    nota:
 *                      type: object
 *                      $ref: "#/components/schemas/Nota"
 *                    id_terapeuta:
 *                      type: integer
 *                    id_address:
 *                      type: string
 *    tags: [Notas]
 *    responses:
 *      "201":
 *        description: Devuelve un la nota recien creada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Nota'
 *      "401":
 *        description: Devuelve un mensaje indicando que el terapeuta en cuestión no tiene permiso para crear la cita
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "403":
 *        description: Devuelve un mensaje indicando que la cita asociada a la nota ya tiene una nota creada
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
router.post("/", crearNota);
/**
 * @swagger
 * /notas:
 *  delete:
 *    summary: Permite eliminar una nota en el sistema
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
 *                      id_terapeuta:
 *                          type: integer
 *                          description: La id del terapeuta que desea eliminar la nota
 *    tags: [Notas]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "401":
 *        description: Devuelve un mensaje indicando que el usuario no tiene acceso a esta cita
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "403":
 *        description: Devuelve un mensaje indicando que la nota no se ha podido crear por algún motivo
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
router.delete("/", validarAutoridad, eliminarNota);
/**
 * @swagger
 * /notas:
 *  patch:
 *    summary: Permite modificar una nota en el sistema
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
 *                      id_terapeuta:
 *                          type: integer
 *                          description: La id del terapeuta que desea eliminar la nota
 *                      nota:
 *                          type: object
 *                          $ref: '#/components/schemas/Nota'
 *    tags: [Notas]
 *    responses:
 *      "201":
 *        description: Devuelve 1 como caso exitoso
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      "403":
 *        description: Devuelve un mensaje indicando que el usuario no tiene acceso a esta cita
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
router.patch("/", validarAutoridad, modificarNota);

/**
 * @swagger
 * /notas/terapeuta/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener las notas de un terapeuta
 *    description: Permite obtener todas las notas de un terapeuta, y si se provee un id de paciente, se obtienen todas las notas del terapeuta con ese paciente (incluyendo las compartidas con el terapeuta)
 *    tags: [Notas]
 *    responses:
 *      "201":
 *        description: Devuelve un arreglo con las notas del terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Nota'
 *      "403":
 *          description: Devuelve un mensaje indicando que el terapeuta no tiene relación con ese paciente
 *          content:
 *              application/json:
 *                  schema:
 *                      type: string
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *  parameters:
 *      - in: query
 *        name: id_paciente
 *        required: false
 *        schema:
 *          type: integer
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 */
router.get("/terapeuta/:id_terapeuta", verNotasTerapeuta);
/**
 * @swagger
 * /notas/paciente/{id_paciente}:
 *  get:
 *    summary: Permite obtener las notas de un paciente
 *    description: Permite obtener todas las notas de un paciente.
 *    tags: [Notas]
 *    responses:
 *      "201":
 *        description: Devuelve un arreglo con las notas del paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Nota'
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
router.get("/paciente/:id_paciente", verNotasPaciente);
/**
 * @swagger
 * /notas/paciente/{id_paciente}/permisos/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener las notas de un paciente y un campo para indicar si esta compartida con el terapeuta
 *    description: Permite obtener todas las notas de un paciente.
 *    tags: [Notas]
 *    responses:
 *      "201":
 *        description: Devuelve un arreglo con las notas del paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Nota'
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
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 */
router.get(
  "/paciente/:id_paciente/permisos/:id_terapeuta",
  verNotasPacienteCompartidas
);
/**
 * @swagger
 * /notas/compartir:
 *  patch:
 *    summary: Permite compartir las notas de un paciente con sus terapeutas
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: integer
 *                terapeutas:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      id:
 *                        type: integer
 *                      notas_compartidas:
 *                        type: array
 *                        items:
 *                          type: object
 *                          properties:
 *                            id:
 *                              type: integer
 *
 *    description: Las relaciones que se reciben son las creadas, las que no se encuentren seran ELIMINADAS.
 *    tags: [Notas]
 *
 *    responses:
 *      "201":
 *        description: Devuelve un arreglo de las relaciones creadas
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.patch("/compartir", compartirNotas);

module.exports = router;
