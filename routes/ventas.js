const express = require("express");
const {
  verComprasPaciente,
  verTicket,
  verReporteTerapeuta,
  verVentasTerapeuta,
  notificarNuevoReporte,
  eliminarVentasAntiguas,
} = require("../Controllers/Ventas");

var router = express.Router();

/**
 * @swagger
 * /ventas/{id_ticket}:
 *  get:
 *    summary: Ruta que permite obtener los paquetes por terapeuta
 *    tags: [Ventas]
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
 *            name: id_ticket
 *            required: true
 *            schema:
 *              type: string
 *          - in: query
 *            name: id_terapeuta
 *            schema:
 *              type: string
 */
router.get("/:id_ticket", verTicket);
/**
 * @swagger
 * /ventas/paciente/{id_paciente}:
 *  get:
 *    summary: Ruta que permite obtener las compras del paciente
 *    tags: [Ventas]
 *    responses:
 *      200:
 *        description: Devuelve un arreglo de compras
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
 */
router.get("/paciente/:id_paciente", verComprasPaciente);
/**
 * @swagger
 * /ventas/terapeuta/{id_terapeuta}:
 *  get:
 *    summary: Ruta que permite obtener las ventas del terapeuta
 *    tags: [Ventas]
 *    responses:
 *      200:
 *        description: Devuelve un arreglo con las ventas
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
 *          - in: query
 *            name: mes
 *            required: true
 *            schema:
 *              type: integer
 */
router.get("/terapeuta/:id_terapeuta", verVentasTerapeuta);
/**
 * @swagger
 * /ventas/terapeuta/reporte/{id_terapeuta}:
 *  get:
 *    summary: Ruta que permite obtener las ventas del terapeuta para generar un reporte
 *    tags: [Ventas]
 *    responses:
 *      200:
 *        description: Devuelve un arreglo con las ventas ordenadas por cantidad vendida
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
 *          - in: query
 *            name: mes
 *            required: true
 *            schema:
 *              type: number
 */
router.get("/terapeuta/reporte/:id_terapeuta", verReporteTerapeuta);
/**
 * @swagger
 * /ventas/terapeuta/antiguas:
 *  delete:
 *    summary: Ruta que permite eliminar las ventas con más de un año de antiguedad
 *    tags: [Ventas]
 *    responses:
 *      200:
 *        description: Devuelve cuantos tickets se eliminaron
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *      500:
 *        description: Devuelve un mensaje de error del servidor
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 */
router.delete("/terapeuta/antiguas", eliminarVentasAntiguas);
/**
 * @swagger
 * /ventas/terapeuta/reportes/notificar:
 *  get:
 *    summary: Ruta que permite notificar a los terapeutas que hay un nuevo reporte de ventas
 *    tags: [Ventas]
 *    responses:
 *      200:
 *        description: Devuelve un mensaje de ok
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Devuelve un mensaje de error del servidor
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *  parameters:
 *      - in: query
 *        name: mesPrueba
 *        description: Es el numero del mes (en base 0) que deseamos probar.
 *        schema:
 *          type: integer
 */
router.get("/terapeuta/reportes/notificar", notificarNuevoReporte);

module.exports = router;
