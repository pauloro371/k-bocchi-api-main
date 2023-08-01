const express = require("express");
const { crearMensaje, borrarMensaje, modificarMensaje, verMensajes, verChat, verChats } = require("../Controllers/Mensajes");
const { crearRegistrationToken, eliminarRegistrationToken, verRegistrationTokens, verTokensUsuario, verRegistrationTokensUsuario } = require("../Controllers/RegistrationTokens");
var router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    RegistrationToken:
 *      type: object
 *      properties:
 *        token:
 *          type: string
 *          description: Es un identificador unico generado en fcm
 *        id_usuario:
 *          type: string
 *          description: Es la id del usuario a la que pertenece el token
 *      example:
 *          token: edMiWfmNSNJSqXqaDoCzpq:APA91bFGRyE_BHHFbGvbSBL9YPCpqvos-o1zfVepqQPa5tDUn_OB0FrruvSfK2UpYpZ-mdA6D3oXDHoAX3C-jhtNjTnJcRSHzAHReqhhS3hOyA_DIdQoo79Dj2ifKwxGQPDkXlClgcx8
 *          id_usuario: 16473224-ba24-4c60-9508-24b5e885fcdamock
 *
 *
 */

/**
 * @swagger
 * /fcmtokens:
 *  post:
 *    summary: Permite crear un token
 *    tags: [fcmtokens]
 *    requestBody:
 *      required: true
 *      content:
 *          application/json:
 *              schema:
 *                  type: object
 *                  $ref: "#/components/schemas/RegistrationToken"
 *    responses:
 *      "200":
 *        description: Devuelve el token creado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/RegistrationToken'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.post("/", crearRegistrationToken);
/**
 * @swagger
 * /fcmtokens/{token}:
 *  delete:
 *    summary: Permite eliminar un token
 *    tags: [fcmtokens]
 *    responses:
 *      "200":
 *        description: Devuelve la cantidad de tokens eliminados
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
 *      - name: token
 *        in: path
 *        required: true
 */
router.delete("/:token", eliminarRegistrationToken);
/**
 * @swagger
 * /fcmtokens/{id_usuario}:
 *  get:
 *    summary: Permite ver los tokens de un usuario
 *    tags: [fcmtokens]
 *    responses:
 *      "200":
 *        description: Devuelve un array de tokens
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: "#/components/schemas/RegistrationToken"
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - name: id_usuario
 *        in: path
 *        required: true
 */
router.get("/:id_usuario", verRegistrationTokensUsuario);
// /**
//  * @swagger
//  * /fcmtokens:
//  *  patch:
//  *    summary: Permite modificar un token
//  *    tags: [fcmtokens]
//  *    requestBody:
//  *      required: true
//  *      content:
//  *          application/json:
//  *              schema:
//  *                  type: object
//  *                  $ref: "#/components/schemas/RegistrationToken"
//  *    responses:
//  *      "200":
//  *        description: Devuelve el token con los datos modificados
//  *        content:
//  *          application/json:
//  *            schema:
//  *              type: object
//  *              $ref: '#/components/schemas/RegistrationToken'
//  *      "500":
//  *         description: Devuelve un mensaje indicando que algo salió mal
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: string
//  */
// router.patch("/", actua);
/**
 * @swagger
 * /fcmtokens:
 *  get:
 *    summary: Permite ver todos los tokens del sistema
 *    tags: [fcmtokens]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo de tokens
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/RegistrationTokens'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verRegistrationTokens);
module.exports = router;
