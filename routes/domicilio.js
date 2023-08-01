const express = require("express");
const Fisioterapeuta = require("../Models/Terapeuta");
const router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *      Domicilio:
 *          type: object
 *          properties:
 *              id:
 *                  type: string
 *              calle:
 *                  type: string
 *              colonia:
 *                  type: string
 *              numero_exterior:
 *                  type: integer
 * */

module.exports = router;