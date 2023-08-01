const express = require("express");
const { verProducto } = require("../Controllers/Productos");
const { deleteProducto, addProducto, verCarrito, setCarritoItem } = require("../Controllers/Carrito");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Carrito:
 *      type: object
 *      properties:
 *        id_paciente:
 *          type: string
 *          description: Es un identificador unico generado en la base de datos
 *        id_producto:
 *          type: string
 *          description: Es el nombre del producto
 *        cantidad:
 *          type: string
 *          description: Es una descripción del producto
 *      example:
 *          id_producto: 22
 *          id_paciente: 81
 *          cantidad: 5
 */

/**
 * @swagger
 * /carrito:
 *  post:
 *    summary: Ruta que permite añadir un producto al carrito
 *    tags: [Carrito]
 *    consumes:
 *      - application/json
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            $ref: "#/components/schemas/Carrito"
 *    responses:
 *      200:
 *        description: Devuelve el item recién creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Carrito"
 *      420:
 *        description: Devuelve un mensaje indicando que el producto ya no tiene stock
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      421:
 *        description: Devuelve un mensaje indicando que el producto no tiene stock suficiente
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
 */
router.post("/", verProducto, addProducto);
/**
 * @swagger
 * /carrito/set:
 *  post:
 *    summary: Ruta que permite añadir productos al carrito de un usuario. Si ya existe el producto cambia la cantidad a la requerida en la request. Si no esta se agrega
 *    tags: [Carrito]
 *    consumes:
 *      - application/json
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            $ref: "#/components/schemas/Carrito"
 *    responses:
 *      200:
 *        description: Devuelve el item recién creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Carrito"
 *      420:
 *        description: Devuelve un mensaje indicando que el producto ya no tiene stock
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      421:
 *        description: Devuelve un mensaje indicando que el producto no tiene stock suficiente
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
 */
router.post("/set", verProducto, setCarritoItem);
/**
 * @swagger
 * /carrito/{id_paciente}:
 *  get:
 *    summary: Ruta que permite obtener los productos de un carrito
 *    tags: [Carrito]
 *    consumes:
 *      - application/json
 *    responses:
 *      200:
 *        description: Devuelve el item recién creado
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: "#/components/schemas/Producto"
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
router.get("/:id_paciente", verCarrito);
/**
 * @swagger
 * /carrito/{id_paciente}/{id_producto}:
 *  delete:
 *    summary: Permite eliminar un item del carrito
 *    tags: [Carrito]
 *    responses:
 *      "200":
 *        description: Devuelve la cantidad de productos eliminados
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
 *      - name: id_paciente
 *        in: path
 *        required: true
 *      - name: id_producto
 *        in: path
 *        required: true
 *      - name: cantidad
 *        in: query
 */
router.delete("/:id_paciente/:id_producto", verProducto, deleteProducto);
module.exports = router;
