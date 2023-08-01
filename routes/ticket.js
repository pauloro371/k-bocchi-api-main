const express = require("express");
const {
  crearProducto,
  eliminarProducto,
  verProductosTerapeuta,
  verProductos,
  actualizar,
  editarProducto,
  verProducto,
} = require("../Controllers/Productos");
const {
  crearOrden,
  getToken,
  crearVinculacionLink,
  agregarMerchantId,
  getVinculacionStatus,
  obtenerVendedores,
} = require("../Controllers/Paypal");
const { crearTicket } = require("../Controllers/Ticket");
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
 *        fecha:
 *          type: string
 *          description: La fecha de creación del ticket
 *        id_paciente:
 *          type: integer
 *          description: El id del paciente que pertenece el ticket
 *        costo_envio:
 *          type: number
 *          description: Es el costo del envio total del paquete
 *        subtotal:
 *          type: number
 *          description: Es el precio total de los productos
 *        id_order:
 *          type: string
 *          description: Es el id de la orden de paypal relacionada a esta venta
 *        total:
 *          type: number
 *          description: Es el costo total de la orden (subtotal+costo_envio)
 *
 *      example:
 *          id: 10
 *          fecha: 14/07/2023
 *          id_paciente: 81
 *          costo_envio: 100
 *          subtotal: 102
 *          id_order: CH_1FKAGPEPQWTFFCV
 *          total: 202
 */

/**
 * @swagger
 * /ticket/{id_paciente}:
 *  post:
 *    summary: Ruta que permite crear un ticket
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                    costo_envio:
 *                      type: number
 *                    id_address:
 *                      type: string
 *                    order_id:
 *                      type: string
 *    tags: [ticket]
 *    responses:
 *      200:
 *        description: Devuelve el ticket creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Ticket"
 *      404:
 *        description: Devuelve un mensaje de error indicando que no existen productos en el carrito
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
 *      - name: id_paciente
 *        in: path
 *        required: true
 */
router.post("/:id_paciente", crearTicket);

module.exports = router;
