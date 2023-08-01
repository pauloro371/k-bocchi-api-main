const express = require("express");
const {
  verPaquetesPaciente,
  verPaquetesTerapeuta,
  verPaquete,
} = require("../Controllers/Paquetes");

var router = express.Router();

/**
 * @swagger
 * /paquetes/paciente/{id_paciente}:
 *  get:
 *    summary: Ruta que permite obtener los paquetes del paciente
 *    tags: [Paquetes]
 *    responses:
 *      200:
 *        description: Devuelve un arreglo de paquetes
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      404:
 *        description: Devuelve un mensaje de error indicando que no existe el paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      500:
 *        description: Devuelve un mensaje de error del servidor
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *  parameters:
 *      - in: path
 *        name: id_paciente
 *        required: true
 *        schema:
 *          type: string
 *      - in: query
 *        name: id_terapeuta
 *        schema:
 *          type: string
 */
router.get("/paciente/:id_paciente", verPaquetesPaciente);
/**
 * @swagger
 * /paquetes/terapeuta/{id_terapeuta}:
 *  get:
 *    summary: Ruta que permite obtener los paquetes por terapeuta
 *    tags: [Paquetes]
 *    responses:
 *      200:
 *        description: Devuelve un arreglo con los paquetes
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      404:
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      500:
 *        description: Devuelve un mensaje de error del servidor
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *          - in: path
 *            name: id_terapeuta
 *            required: true
 *            schema:
 *              type: string   
 */
router.get("/terapeuta/:id_terapeuta", verPaquetesTerapeuta);
/**
 * @swagger
 * /paquetes/{id_paquete}:
 *  get:
 *    summary: Ruta que permite obtener los paquetes por terapeuta
 *    tags: [Paquetes]
 *    responses:
 *      200:
 *        description: Devuelve el paquete encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      404:
 *        description: Devuelve un mensaje indicando que no existe el paquete
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      500:
 *        description: Devuelve un mensaje de error del servidor
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *          - in: path
 *            name: id_paquete
 *            required: true
 *            schema:
 *              type: string   
 */
router.get("/:id_paquete", verPaquete);

module.exports = router;
