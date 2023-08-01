const {
  crearCita,
  borrarCita,
  modificarCita,
  verCita,
  verTodasCitas,
  verCitasTerapeuta,
  verAgendaTerapeuta,
  notificarCita,
  obtenerCitasPorFecha,
  verAgendaPaciente,
} = require("../Controllers/Citas");
const express = require("express");
const { verHorario } = require("../Controllers/Horario");
const {
  existeTerapeuta,
  verTerapeutaDetalles,
  buscarTerapeutas,
} = require("../Controllers/Terapeuta");
const {
  obtenerHorariosDisponibles,
  checkCitasDisponibles,
  checkDentroHorario,
  buscarFechasDisponibles,
  checkFechaPosterior,
  checkHorarioDisponible,
  checkFechaHoraPosterior,
} = require("../Controllers/AlgoritmoCitas");
const date = require("date-and-time");
const {
  patternFecha,
  obtenerFechaComponent,
  patternHora,
  obtenerFechaActualMexico,
  obtenerHoraComponent,
  patternFechaCompleta,
} = require("../utils/fechas");
const Terapeuta = require("../Models/Terapeuta");
const { calcularDistancia } = require("../utils/geo");
const Cita = require("../Models/Cita");
const {
  obtenerCitasFechasExcluyente,
} = require("../utils/algoritmo_cita/excluirFecha");
var router = express.Router();

/**
 * @swagger
 * /citas/emergencia:
 *  get:
 *    summary: Permite obtener citas disponibles en base a un criterio
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con las citas posibles junto con sus terapeutas
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
 *        - in: query
 *          name: fecha
 *          description: filtro para obtener la cita en determinada fecha
 *          schema:
 *            type: string
 *
 *
 *
 */
router.get(
  "/emergencia",
  async (req, res, next) => {
    try {
      let { fecha } = req.query;
      //Primero revisamos si la fecha y hora solicitadas no son anteriores a la fecha y hora actual
      await checkFechaHoraPosterior(fecha);
      next();
    } catch (error) {
      console.log(error);
      if (error.razon) return res.status(400).json(error.razon);
      return res.status(500).json("Algo ha salido mal");
    }
  },
  buscarTerapeutas,
  obtenerCitasPorFecha
);
/**
 * @swagger
 * components:
 *  schemas:
 *    Cita:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          description: Es un identificador unico generado en la base de datos
 *        lng:
 *          type: string
 *          description: Es la longitud (ubicacion) de la cita
 *        lat:
 *          type: string
 *          description: Es la latitud (ubicacion) de la cita
 *        id_paciente:
 *          type: integer
 *          description: El id del paciente al que pertenece la cita
 *        id_terapeuta:
 *          type: integer
 *          description: El id del terapeuta al que pertenece la cita
 *        fecha:
 *          type: string
 *          description: La fecha de la cita
 *          format: date-time
 *        modalidad:
 *          type: string
 *          enum: [domicilio,consultorio]
 *          description: La modalidad de la cita (domicilio o consultorio)
 *          format: date-time
 *        domicilio:
 *          type: string
 *          description: El domicilio donde se llevará a cabo la cita
 *      example:
 *          id: 10
 *          lng: -103.4574
 *          lat: 20.456545334
 *          id_paciente: 3
 *          id_terapeuta: 10
 *          fecha: '1985-04-12T23:20:50.52Z'
 *          modalidad: "domicilio"
 *          domicilio: "Una calle, un numero, una colonia"
 *
 */

/**
 * @swagger
 * /citas:
 *  post:
 *    summary: Permite crear una cita
 *    tags: [Citas]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            $ref: '#/components/schemas/Cita'
 *    responses:
 *      "200":
 *        description: Devuelve la cita creada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Cita'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.post("/", crearCita);

/**
 * @swagger
 * /citas/{id}:
 *  delete:
 *    summary: Permite borrar una cita
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve la cita borrada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje que la cita no fue encontrada
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
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 */
router.delete("/:id", borrarCita);

/**
 * @swagger
 * /citas:
 *  patch:
 *    summary: Permite editar una cita
 *    tags: [Citas]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            $ref: '#/components/schemas/Cita'
 *    responses:
 *      "200":
 *        description: Devuelve la cita modificada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje indicando que la cita no fue encontrada
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
router.patch("/", modificarCita);

/**
 * @swagger
 * /citas/notificar:
 *  get:
 *    summary: Permite notificar de sus citas a los terapeutas mediante sms
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve la respuesta de twilio
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/notificar", notificarCita);
/**
 * @swagger
 * /citas/{id}:
 *  get:
 *    summary: Permite obtener una cita
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve la cita encontrada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje indicando que no se encontro la cita
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
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 */
router.get("/:id", verCita);

/**
 * @swagger
 * /citas:
 *  get:
 *    summary: Permite obtener todas las citas de la base de datos
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve todas las citas de la base de datos
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Cita'
 *      "500":
 *         description: Devuelve un mensaje indicando que algo salió mal
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", verTodasCitas);

/**
 * @swagger
 * /citas/validarFecha/{id_terapeuta}:
 *  get:
 *    summary: Permite validar si la fecha ingresada esta disponible
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve las horas disponibles para agendar cita
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: string
 *                  example: "20:00:00"
 *      "420":
 *        description: Devuelve fechas cercanas para agendar una cita
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: string
 *                  format: date
 *      "400":
 *        description: Devuelve un mensaje indicando que la fecha esta en un formato incorrecto
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
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
 *    parameters:
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 *      - in: query
 *        name: fecha
 *        required: true
 *        schema:
 *          type: string
 *          format: date
 *
 */
router.get(
  "/validarFecha/:id_terapeuta",
  existeTerapeuta,
  verHorario,
  verCitasTerapeuta,
  async (req, res, next) => {
    let { fecha } = req.query;
    let { horario, citas } = res.body;
    let horario_seleccionado;
    let { id_terapeuta } = req.params;
    if (
      !date.isValid(fecha, patternFecha) ||
      !/\d{4}-\d{2}-\d{2}/g.test(fecha)
    ) {
      return res.status(400).json("La fecha esta en un formato incorrecto");
    }

    try {
      horario_seleccionado = await checkDentroHorario(horario, fecha);
      await checkFechaPosterior(fecha);
      await checkCitasDisponibles(horario_seleccionado, citas);
      let horarios_disponibles = obtenerHorariosDisponibles(
        horario_seleccionado,
        citas,
        fecha
      );
      return res.status(200).json({ horarios_disponibles });
    } catch (err) {
      if (err.razon) {
        let diasDisponibles = await buscarFechasDisponibles(
          id_terapeuta,
          horario,
          fecha
        );
        return res.status(420).json(diasDisponibles);
      }
      console.log(err);
    }
    return res.status(500).json("Algo ha salido mal");
  }
);
/**
 * @swagger
 * /citas/validarCambioFecha/{id_terapeuta}:
 *  get:
 *    summary: Permite validar si un horario esta disponible en una fecha
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve una
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: string
 *                  example: "20:00:00"
 *      "420":
 *        description: Devuelve fechas cercanas para agendar una cita
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: string
 *                  format: date
 *      "400":
 *        description: Devuelve un mensaje indicando que la fecha esta en un formato incorrecto
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
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
 *    parameters:
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 *      - in: query
 *        name: fecha
 *        required: true
 *        schema:
 *          type: string
 *          format: date
 *      - in: query
 *        name: hora
 *        required: true
 *        schema:
 *          type: string
 *          format: time
 *
 */
router.get(
  "/validarCambioFecha/:id_terapeuta",
  existeTerapeuta,
  verHorario,
  verCitasTerapeuta,
  async (req, res, next) => {
    let { fecha, hora } = req.query;
    let { horario, citas } = res.body;
    let horario_seleccionado;
    let { id_terapeuta } = req.params;
    try {
      hora = date.parse(hora, patternHora);
      if (
        !date.isValid(fecha, patternFecha) ||
        !/\d{4}-\d{2}-\d{2}/g.test(fecha)
      ) {
        return res.status(400).json("La fecha esta en un formato incorrecto");
      }
      horario_seleccionado = await checkDentroHorario(horario, fecha);
      await checkFechaPosterior(fecha);
      await checkCitasDisponibles(horario_seleccionado, citas);
      if (checkHorarioDisponible(citas, hora))
        throw { razon: "Esta ocupado el horario solicitado" };

      return res.status(200).json("OK");
    } catch (err) {
      if (err.razon) {
        let diasDisponibles = await buscarFechasDisponibles(
          id_terapeuta,
          horario,
          fecha,
          hora
        );
        console.log(citas);
        return res.status(420).json(diasDisponibles);
      }
      console.log(err);
    }
    return res.status(500).json("Algo ha salido mal");
  }
);

/**
 * @swagger
 * /citas/obtenerCitas/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener las citas de un terapeuta
 *    description: El parametro "fecha" no es obligatorio, si se deja vacío simplemente obtiene TODAS las citas del terapeuta
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve las citas de un terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
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
 *    parameters:
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 *      - in: query
 *        name: fecha
 *        required: false
 *        schema:
 *          type: string
 *          format: date
 *
 */
router.get(
  "/obtenerCitas/:id_terapeuta",
  verCitasTerapeuta,
  (req, res, next) => {
    console.log(res.body);
    res.status(200).json(res.body);
  }
);
/**
 * @swagger
 * /citas/agenda/{id_terapeuta}:
 *  get:
 *    summary: Permite obtener las citas de un terapeuta
 *    description: Permite obtener todas las citas del terapeuta a partir del día de hoy
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve las citas de un terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
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
 *    parameters:
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        schema:
 *          type: integer
 *
 */
router.get("/agenda/:id_terapeuta", verAgendaTerapeuta, (req, res, next) => {
  console.log(res.body);
  res.status(200).json(res.body);
});
/**
 * @swagger
 * /citas/agendaPaciente/{id_paciente}:
 *  get:
 *    summary: Permite obtener las citas de un pacinete
 *    description: Permite obtener todas las citas del paciente a partir del día de hoy
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve las citas de un paciente
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                  type: object
 *                  $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el paciente
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
 *    parameters:
 *      - in: path
 *        name: id_paciente
 *        required: true
 *        schema:
 *          type: integer
 *
 */
router.get("/agendaPaciente/:id_paciente", verAgendaPaciente, (req, res, next) => {
  console.log(res.body);
  res.status(200).json(res.body);
});

/**
 * @swagger
 * /citas/sinNota/{id_terapeuta}/{id_paciente}:
 *  get:
 *    summary: Permite obtener las citas que no tengan una nota asociada dado un paciente y un terapeuta
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve un arreglo con las citas que no tienen nota
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                $ref: '#/components/schemas/Cita'
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
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
 *    parameters:
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        description: ID del terapeuta del cual se desean obtener las citas
 *      - in: path
 *        name: id_paciente
 *        required: true
 *        description: ID del paciente del cual se desean obtener las citas
 */
router.get("/sinNota/:id_terapeuta/:id_paciente", async (req, res, next) => {
  let { id_terapeuta, id_paciente } = req.params;
  let fechaActual = obtenerFechaActualMexico();
  let fecha = obtenerFechaComponent(fechaActual);
  let hora = obtenerHoraComponent(fechaActual);
  let fechaActualString = `${fecha} ${hora}`;
  try {
    let citasSinNota = await Cita.query()
      .where((builder) => {
        builder
          .where("id_paciente", "=", id_paciente)
          .andWhere("id_terapeuta", "=", id_terapeuta)
          .andWhere("fecha", "<=", fechaActualString);
      })
      .whereNotExists(Cita.relatedQuery("nota"))
      .orderBy("fecha", "DESC")
      .debug();
    return res.status(200).json(citasSinNota);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
});
/**
 * @swagger
 * /citas/validarDomicilio/{id_terapeuta}:
 *  get:
 *    summary: Permite validar su un domicilio esta dentro de el rango de atención de un terapeuta
 *    tags: [Citas]
 *    responses:
 *      "200":
 *        description: Devuelve la distancia obtenida
 *        content:
 *          application/json:
 *            schema:
 *              type: number
 *      "404":
 *        description: Devuelve un mensaje indicando que no existe el terapeuta
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "400":
 *        description: Devuelve un mensaje indicando que el domicilio esta fuera del rango de servicio del terapeuta
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
 *    parameters:
 *      - in: query
 *        name: latA
 *        required: true
 *        description: Latitud de la coordenada A
 *        schema:
 *          type: number
 *      - in: query
 *        name: lngA
 *        required: true
 *        description: Longitud de la coordenada A
 *        schema:
 *          type: number
 *      - in: path
 *        name: id_terapeuta
 *        required: true
 *        description: ID del terapeuta para validar el domicilio ingresado
 */
router.get("/validarDomicilio/:id_terapeuta", async (req, res, next) => {
  let { id_terapeuta } = req.params;
  let { latA, lngA } = req.query;
  try {
    let terapeuta = await Terapeuta.query().findById(id_terapeuta);
    if (!terapeuta) return res.status(404).json("No se encontro el terapeuta");
    let { rango_servicio, lat: latB, lng: lngB } = terapeuta;
    let distancia = calcularDistancia(latA, lngA, latB, lngB);
    if (distancia > rango_servicio) {
      return res
        .status(400)
        .json("Este domicilio esta fuera del rango de servicio del terapeuta");
    }
    return res.status(200).json(distancia);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
});

module.exports = router;
