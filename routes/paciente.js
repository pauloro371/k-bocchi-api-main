const express = require("express");
const {
  verCitasPaciente,
  verTerapeutasPaciente,
  verPermisosTerapeuta,
} = require("../Controllers/Paciente");
const router = express.Router();
/**
 * @swagger
 * /usuarios/pacientes/{id}/citas:
 *  get:
 *    summary: Permite obtener las citas de un paciente
 *    tags: [Paciente]
 *    responses:
 *      404:
 *        description: Devuelve un mensaje de error indicando que el paciente no existe
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      200:
 *        description: Devuelve un array de citas
 *        content:
 *          application/json:
 *              schema:
 *                type: array
 *                items:
 *                    type: object
 *                    $ref: '#/components/schemas/Cita'
 *    parameters:
 *      - name: id
 *        description: Es la id el paciente
 *        in: path
 *        required: true
 *      - name: fecha
 *        description: Es la fecha a partir de la cual se mostrarán las citas
 *        in: query
 *
 */
router.get("/:id/citas", verCitasPaciente);
/**
 * @swagger
 * /usuarios/pacientes/{id}/terapeutas:
 *  get:
 *    summary: Permite obtener los terapeutas de un paciente
 *    tags: [Paciente]
 *    responses:
 *      404:
 *        description: Devuelve un mensaje de error indicando que el paciente no existe
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      200:
 *        description: Devuelve un array de terapeutas
 *        content:
 *          application/json:
 *              schema:
 *                type: array
 *                items:
 *                    type: object
 *                    $ref: '#/components/schemas/Fisioterapeuta'
 *    parameters:
 *      - name: id
 *        description: Es la id el paciente
 *        in: path
 *        required: true
 *      - name: busqueda
 *        description: Es el valor del criterio de búsqueda, nombre ya sea del terapeuta, nombre del consultorio o su numero de cédula
 *        in: query
 *        required: false
 *
 */
router.get("/:id/terapeutas", verTerapeutasPaciente);
/**
 * @swagger
 * /usuarios/pacientes/{id_paciente}/permisos/terapeutas/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener los permisos que tiene un paciente para dejar reseñas y comentarios
 *    tags: [Paciente]
 *    responses:
 *      404:
 *        description: Devuelve un mensaje de error indicando que el paciente no existe
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      200:
 *        description: Devuelve un objeto con los permisos
 *        content:
 *          application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  crearResena:
 *                    type: number
 *                  editarResena:
 *                    type: number
 *                  crearComentario:
 *                    type: number
 *      403:
 *        description: Devuelve un mensaje de error indicando que el paciente no tiene relacion con el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *      - name: id_paciente
 *        description: Es la id el paciente
 *        in: path
 *        required: true
 *      - name: id_terapeuta
 *        description: Es el id del terapeuta
 *        in: path
 *        required: true
 *
 */
router.get("/:id_paciente/permisos/terapeutas/:id_terapeuta", verPermisosTerapeuta);

module.exports = router;
