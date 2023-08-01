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
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Producto:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: Es un identificador unico generado en la base de datos
 *        nombre:
 *          type: string
 *          description: Es el nombre del producto
 *        caracteristicas:
 *          type: string
 *          description: Es una descripción del producto
 *        precio:
 *          type: number
 *          description: Es el precio unitario del producto
 *        stock:
 *          type: integer
 *          description: Es la cantidad/stock que hay de producto
 *        imagen:
 *          type: string
 *          description: Es la url de la imagen del producto
 *        categoria:
 *          type: string
 *          description: Es la categoria del producto (puede ser dispositivo o medicamento)
 *        id_terapeuta:
 *          type: string
 *          description: Es la id del terapeuta que vende el producto
 *        fecha_publicacion:
 *          type: string
 *          description: Es la fecha en la que se creo
 *        cantidad_vendida:
 *          type: integer
 *          description: La cantidad de producto vendida
 *      example:
 *          id: 1
 *          nombre: "Medicamento para el dolor"
 *          caracteristicas: "100 gr, vendido solo sobre receta"
 *          precio: 102.90
 *          stock: 10
 *          imagen: "https://localhost:3000"
 *          categoria: "medicamento"
 *          id_terapeuta: 218
 *          fecha_publicacion: 2013-06-20 23:00:20
 *          cantidad_vendida: 2
 *
 *
 */

/**
 * @swagger
 * /productos:
 *  post:
 *    summary: Ruta que permite crear un producto con su imagen en firebase
 *    tags: [productos]
 *    consumes:
 *      - multipart/form-data
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              producto:
 *                  type: object
 *                  $ref: "#/components/schemas/Producto"
 *              imagen:
 *                type: string
 *                format: binary
 *    responses:
 *      200:
 *        description: Devuelve el producto recién creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Producto"
 *      500:
 *        description: Devuelve un mensaje de error del servidor
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 */
router.post("/", crearProducto);
/**
 * @swagger
 * /productos/{id_producto}:
 *  delete:
 *    summary: Permite eliminar un producto
 *    tags: [productos]
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
 *      - name: id_producto
 *        in: path
 *        required: true
 */
router.delete("/:id_producto", verProducto, eliminarProducto);
/**
 * @swagger
 * /productos/{id_producto}:
 *  get:
 *    summary: Permite obtener un producto
 *    tags: [productos]
 *    responses:
 *      "200":
 *        description: Devuelve el producto encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: "#/components/schemas/Producto"
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - name: id_producto
 *        in: path
 *        required: true
 */
router.get("/:id_producto", verProducto, (req, res, next) => {
  return res.status(200).json(res.producto);
});
/**
 * @swagger
 * /productos/terapeuta/{id_terapeuta}:
 *  get:
 *    summary: Permite ver los productos de un terapeuta
 *    tags: [productos]
 *    responses:
 *      "200":
 *        description: Devuelve un array de productos
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: "#/components/schemas/Producto"
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - name: id_terapeuta
 *        in: path
 *        required: true
 */
router.get("/terapeuta/:id_terapeuta", verProductosTerapeuta);
/**
 * @swagger
 * /productos:
 *  patch:
 *    summary: Permite modificar un producto
 *    tags: [productos]
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              producto:
 *                  type: object
 *                  $ref: "#/components/schemas/Producto"
 *              imagen:
 *                type: string
 *                format: binary
 *    responses:
 *      "200":
 *        description: Devuelve el token con los datos modificados
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Producto'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.patch("/", editarProducto);
/**
 * @swagger
 * /productos:
 *  get:
 *    summary: Permite ver todos los productos del sistema
 *    tags: [productos]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo de productos
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/Productos'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *        - in: query
 *          description: palabra clave que se usara para buscar productos relacionados
 *          name: palabra
 *          schema:
 *            type: string
 *        - in: query
 *          name: categoria
 *          description: Filtro obtener los productos por categoría
 *          schema:
 *            type: string
 *        - in: query
 *          name: rango_inferior
 *          description: Filtro para obtener productos con precio mayor al indicado
 *          schema:
 *            type: number
 *        - in: query
 *          name: rango_superior
 *          description: Filtro para obtener productos con precio menor al indicado
 *          schema:
 *            type: number
 *        - in: query
 *          name: nuevo
 *          description: Filtro para obtener productos publicados recientemente (1 semana)
 *          schema:
 *            type: number
 */
router.get("/", verProductos);
module.exports = router;
