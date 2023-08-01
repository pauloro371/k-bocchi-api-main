const express = require("express");
const Usuario = require("../Models/Usuario");
const { desencriptar } = require("../utils/encryption");
const { ROLES } = require("../roles");
const { Model, raw } = require("objection");
const Terapeuta = require("../Models/Terapeuta");
const knex = require("../setup/knexfile");
const { verHorario } = require("../Controllers/Horario");
const {
  verTerapeutaDetalles,
  buscarTerapeutas,
  loginTerapeuta,
  existeTerapeuta,
  verEstrellas,
  verPacientes,
  insertarHorarios,
  verPacientesBitacora,
} = require("../Controllers/Terapeuta");
const router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    Fisioterapeuta:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        nombre:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        apellidos:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        especialidad:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        nombre_del_consultorio:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        telefono:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        pago_minimo:
 *          type: number
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        pago_max:
 *          type: number
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        servicioDomicilio:
 *          type: boolean
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        domicilio:
 *          type: object
 *          $ref: '#/components/schemas/Domicilio'
 *      example:
 *          id: 1bcac0e9-5682-4fe2-a92f-55b0c552551f
 *          nombre: bidenBlast@gmail.com
 *          apellidos: contrasenaS
 *          especialidad: paciente
 *          nombre_del_consultorio: deportiva
 *          telefono: 3310428909
 *          pago_minimo: 0
 *          pago_max: 0
 *          servicioDomicilio: true
 *
 */

/**
 * @swagger
 * components:
 *  schemas:
 *    Horario:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es el identificador del horario
 *        id_terapeuta:
 *          type: string
 *          description: Es el identificador del terapeuta
 *        dia:
 *          type: string
 *          enum: [lunes,martes,miercoles,jueves,viernes,sabado,domingo]
 *          description: Es el día de la semana
 *        horario_inicio:
 *          type: string
 *          description: Es la hora de inicio de trabajo
 *          pattern: '^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])'
 *        horario_fin:
 *          type: string
 *          description: Es la hora de fin de trabajo
 *          pattern: '^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])'
 *      example:
 *          id: 3
 *          id_terapeuta: 6
 *          dia: "lunes"
 *          horario_inicio: 07:00:00
 *          horario_fin: 17:00:00
 *
 */

//Ruta para validación de terapeutas

/**
 * @swagger
 * /usuarios/fisioterapeutas/login:
 *  post:
 *    summary: Permite validar las credenciales de un usuario y que además sea del tipo fisioterapeuta
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "404":
 *        description: Devuelve un mensaje indicando que el usuario no se encontro en la base de datos. (No esta registrado el email)
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "401":
 *        description: Devuelve un mensaje indicando ya sea que el usuario no es tipo fisioterapeuta o tiene contraseña incorrecta
 *        content:
 *         application/json:
 *           schema:
 *             type: string
 *      "451":
 *        description: Devuelve un mensaje para indicar que un usuario esta registrado con google (En la bd el usuario existe pero no esta registrada su contraseña)
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "200":
 *        description: Devuelve los datos completos del usuario con el correo y contraseña asociados
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                contrasena:
 *                  type: string
 */
router.post("/login", loginTerapeuta);

/**
 * @swagger
 * /usuarios/fisioterapeutas/buscar:
 *  get:
 *    summary: Permite obtener los fisioterapeutas de la base de datos usando un criterio de busqueda (Nombre) y filtros
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve los datos completos del usuario con el correo y contraseña asociados
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                count:
 *                  type: number
 *                resultados:
 *                  type: Array
 *                  $ref: '#/components/schemas/Usuario'
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontraron fisioterapeutas con esas caracteristicas
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *    parameters:
 *        - in: query
 *          description: Filtro para nombre
 *          name: nombre
 *          schema:
 *            type: string
 *        - in: query
 *          name: servicio_domicilio
 *          description: Filtro para terapeutas con servicio a domicilio
 *          schema:
 *            type: boolean
 *        - in: query
 *          name: pago_minimo
 *          description: Filtro para terapeutas a partir de un pago minimo
 *          schema:
 *            type: number
 *        - in: query
 *          name: pago_maximo
 *          description: Filtro para terapeutas a partir de un pago maximo
 *          schema:
 *            type: number
 *        - in: query
 *          name: estrellas
 *          description: Filtro para terapeutas a partir de una cierta cantidad de promedio de estrellas
 *          schema:
 *            type: number
 *        - in: query
 *          name: lat
 *          description: Filtro para la ubicacion, indica la latitud (son necesarios ambos para la distancia, lat y lng)
 *          schema:
 *            type: number
 *        - in: query
 *          name: lng
 *          description: Filtro para la ubicacion, indica la longitud (son necesarios ambos para la distancia, lat y lng)
 *          schema:
 *            type: number
 *        - in: query
 *          name: distancia
 *          description: Filtro para la ubicacion, indica la distancia máxima (son necesarios ambos para la distancia, lat y lng)
 *          schema:
 *            type: number
 *        - in: query
 *          name: con_consultorio
 *          description: filtro para terapeutas con consultorio
 *          schema:
 *            type: boolean
 *
 *
 *
 */
router.get("/buscar", buscarTerapeutas, (req, res, next) => {
  return res.json({
    count: res.count,
    resultados: res.resultados,
  });
});
/**
 * @swagger
 * /usuarios/fisioterapeutas/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener un fisioterapeuta en base a su id de usuario
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve los datos completos del terapeuta encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                count:
 *                  type: number
 *                resultados:
 *                  type: object
 *                  $ref: '#/components/schemas/Usuario'
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el fisioterapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *    parameters:
 *        - in: path
 *          description: ID del usuario terapeuta
 *          name: id_terapeuta
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get("/:id_terapeuta", verTerapeutaDetalles);
/**
 * @swagger
 * /usuarios/fisioterapeutas/buscarNombre/{nombre}:
 *  get:
 *    summary: Permite obtener un fisioterapeuta en base a su nombre completo
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve los datos completos del terapeuta encontrado
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                count:
 *                  type: number
 *                resultados:
 *                  type: array
 *                  items:
 *                    type: object
 *                    $ref: '#/components/schemas/Usuario'
 *      "500":
 *        description: Devuelve un mensaje indicando que algo salio mal
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *    parameters:
 *        - in: path
 *          description: Nombre completo del terapeuta
 *          name: nombre
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get("/buscarNombre/:nombre", async (req, res, next) => {
  try {
    let { nombre } = req.params;
    let terapeutas = await Terapeuta.query()
      .withGraphJoined("[usuario,horario]")
      .whereRaw(`(usuario.nombre like "%${nombre}%")`);
    terapeutas = terapeutas.map((t) => ({
      ...t,
      dias_habiles: t.horario.length,
    }));
    return res.status(200).json(terapeutas);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Ha ocurrido un error");
  }
});

/**
 * @swagger
 * /usuarios/fisioterapeutas/horario/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener el horario de un fisioterapeuta
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve un objeto con el horario del terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                horario:
 *                  type: array
 *                  items:
 *                    type: object
 *                    $ref: '#/components/schemas/Horario'
 *      "500":
 *        description: Devuelve un mensaje indicando que algo salio mal
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *        - in: path
 *          description: id del terapeuta
 *          name: id_terapeuta
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get(
  "/horario/:id_terapeuta",
  existeTerapeuta,
  verHorario,
  (req, res, next) => {
    res.status(200).json(res.body);
  }
);
/**
 * @swagger
 * /usuarios/fisioterapeutas/resenas/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener las estrellas de un fisioterapeuta
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve un objeto con las estrellas del terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                horario:
 *                  type: array
 *                  items:
 *                    type: object
 *                    $ref: '#/components/schemas/Horario'
 *      "500":
 *        description: Devuelve un mensaje indicando que algo salio mal
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *        - in: path
 *          description: id del terapeuta
 *          name: id_terapeuta
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get("/resenas/:id_terapeuta", existeTerapeuta, verEstrellas);
/**
 * @swagger
 * /usuarios/fisioterapeutas/pacientes/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener los pacientes de un terapeuta
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve un array con los pacientes
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                $ref: '#/components/schemas/Usuario'
 *      "500":
 *        description: Devuelve un mensaje indicando que algo salio mal
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *        - in: path
 *          description: id del terapeuta
 *          name: id_terapeuta
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get("/pacientes/:id_terapeuta", existeTerapeuta, verPacientes);
/**
 * @swagger
 * /usuarios/fisioterapeutas/bitacora/pacientes/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener los pacientes de la bitacora de un terapeuta
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve un array con los pacientes
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                $ref: '#/components/schemas/Usuario'
 *      "500":
 *        description: Devuelve un mensaje indicando que algo salio mal
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    parameters:
 *        - in: path
 *          description: id del terapeuta
 *          name: id_terapeuta
 *          schema:
 *            type: string
 *        - in: query
 *          description: nombre del paciente
 *          name: nombre
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get(
  "/bitacora/pacientes/:id_terapeuta",
  existeTerapeuta,
  verPacientesBitacora
);
/**
 * @swagger
 * /usuarios/fisioterapeutas/horario:
 *  patch:
 *    description: Esta ruta permite modificar el horario del terapeuta. Se usa un método "upsert graph" (UPdate,inSERT). Esto quiere decir que aquellos items que tengan su propiedad id serán modificados/insertados, los items que no tengan id se insertaran y los items que no existan se eliminaran
 *    summary: Permite modificar el horario del terapeuta
 *    tags: [Fisioterapeuta]
 *    responses:
 *      "200":
 *        description: Devuelve el nuevo horario del terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                horario:
 *                  type: array
 *                  items:
 *                    type: object
 *                    $ref: '#/components/schemas/Horario'
 *      "500":
 *        description: Devuelve un mensaje indicando que algo salio mal
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                $ref : "#/components/schemas/Horario"
 */
router.patch("/horario", insertarHorarios);

module.exports = router;
