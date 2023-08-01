const { raw } = require("objection");
const Paquete = require("../Models/Paquete");
const Ticket = require("../Models/Ticket");
const date = require("date-and-time");
const {
  patternFecha,
  obtenerFechaActualMexico,
  patternFechaCompleta,
  meses,
  getMes,
} = require("../utils/fechas");
const DetalleTicket = require("../Models/DetalleTicket");
const Usuario = require("../Models/Usuario");
const { generarNotificacion } = require("../utils/notificaciones");
const { ConsoleMessage } = require("puppeteer");

exports.verComprasPaciente = async (req, res, next) => {
  let { id_paciente } = req.params;
  try {
    let compras = await Ticket.query()
      .where("id_paciente", "=", id_paciente)
      .orderBy("fecha", "DESC");
    return res.status(200).json(compras);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verTicket = async (req, res, next) => {
  let { id_ticket } = req.params;
  let { id_terapeuta } = req.query;
  try {
    let ticket = await Ticket.query()
      .withGraphJoined("[detalles.terapeuta.usuario,paciente.usuario]")
      .modifyGraph("detalles", (builder) => {
        builder.select(["*", raw("FN_SELEC_IMAGEN(id_producto)").as("imagen")]);
        if (id_terapeuta) {
          builder.where("id_terapeuta", "=", id_terapeuta);
        }
      })
      .modifyGraph("detalles.terapeuta", (builder) => {
        builder.select(["id", "id_usuario"]);
      })
      .modifyGraph("detalles.terapeuta.usuario", (builder) => {
        builder.select(["id", "nombre", "foto_perfil"]);
      })
      .modifyGraph("paciente", (builder) => {
        builder.select(["id", "id_usuario"]);
      })
      .modifyGraph("paciente.usuario", (builder) => {
        builder.select(["id", "nombre", "foto_perfil"]);
      })

      .findById(id_ticket);
    if (!ticket) return res.status(404).json("No se enontro el ticket");
    return res.status(200).json(ticket);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verReporteTerapeuta = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  let { mes } = req.query;
  let anio;
  if (mes === "0") {
    //0 es el caso para obtener el de diciembre del año pasado
    anio = date.addYears(obtenerFechaActualMexico(), -1).getFullYear();
    mes = "12";
  } else {
    anio = obtenerFechaActualMexico().getFullYear();
  }
  console.log({ mes, anio });
  let f1 = date.parse(`${mes} ${anio}`, "M YYYY"); //fecha de inicio del mes solicitado / fecha final del mes pasado
  let f2 = date.addMonths(f1, 1); //fecha final del mes solicitado
  let f3 = date.addMonths(f1, -1); //fecha de inicio del mes pasado
  console.log({ f1, f2, f3 });
  try {
    //las ventas del mes solicitado
    let ventas_actual = await DetalleTicket.query()
      .joinRelated("ticket")
      .select(["id_producto", "nombre", "id_ticket"])
      .sum("cantidad as cantidad_vendida")
      .where("id_terapeuta", "=", id_terapeuta)
      .groupBy("id_producto")
      .where((builder) => {
        builder
          .where("ticket.fecha", ">=", date.format(f1, patternFechaCompleta))
          .andWhere("ticket.fecha", "<", date.format(f2, patternFechaCompleta));
      })
      .debug()
      .orderBy("cantidad_vendida", "DESC");
    //las ventas del mes anterior al solicitado
    let ventas_anterior;

    ventas_anterior = await DetalleTicket.query()
      .joinRelated("ticket")
      .select(["id_producto", "nombre", "id_ticket"])
      .sum("cantidad as cantidad_vendida")
      .where("id_terapeuta", "=", id_terapeuta)
      .groupBy("id_producto")
      .where((builder) => {
        builder
          .where("ticket.fecha", ">=", date.format(f3, patternFechaCompleta))
          .andWhere("ticket.fecha", "<", date.format(f1, patternFechaCompleta));
      })
      .debug()
      .orderBy("cantidad_vendida", "DESC");
    // .orderBy("fecha", "DESC");
    return res.status(200).json({ ventas_anterior, ventas_actual });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verVentasTerapeuta = async (req, res, next) => {
  //Obtenemos la id del terapeuta que deseamos obtener sus ventas
  let { id_terapeuta } = req.params;
  //El mes del cual queremos obtener las ventas
  let { mes } = req.query;
  let anio;
  //Si el mes es 0, queremos obtener las ventas de Diciembre del año pasado
  if (mes === "0") {
    //Quitamos un año
    anio = date.addYears(obtenerFechaActualMexico(), -1).getFullYear();
    //Decimos que mes es 12 para indicar que queremos las ventas de diciembre
    mes = "12";
  } else {
    //Si es cualquier otro mes, estamos obteniendo las ventas de un mes del año en curso
    anio = obtenerFechaActualMexico().getFullYear();
  }
  let f1 = date.parse(`${mes} ${anio}`, "M YYYY"); //fecha de inicio del mes actual / fecha final del mes pasado
  let f2 = date.addMonths(f1, 1); //fecha final del mes actual
  let f3 = date.addMonths(f1, -1); //fecha de inicio del mes pasado
  console.log({ f1, f2, f3 });
  try {
    //obtenemos las ventas que ha realizado el terapeuta en el mes solicitado
    let ventas = await DetalleTicket.query()
      .select(["*", raw("FN_SELEC_IMAGEN(id_producto)").as("imagen")])
      .joinRelated("ticket")
      .where("id_terapeuta", "=", id_terapeuta)
      .where((builder) => {
        builder
          .where("ticket.fecha", ">=", date.format(f1, patternFechaCompleta))
          .andWhere("ticket.fecha", "<", date.format(f2, patternFechaCompleta));
      })
      .orderBy("fecha", "DESC");
    return res.status(200).json(ventas);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.notificarNuevoReporte = async (req, res, next) => {
  try {
    /**
     * - Esta funcion notifica a los usuarios que un reporte de x periodo de meses se ha terminado
     * - Esto se ejecuta mediante google schedule cada primero del mes a las 00:00:00 hr Ciudad de México mediante
     * una petición GET
     * -----------------------------------------------------------------------------------------------------------
     * Por lo tanto todos los calculos consideran "mes pasado" y restan 1 mes a la fecha actual,
     * pues ese es el mes del que deseamos notificar que ha terminado el reporte. Por ejemplo:
     * - La funcion se ejecuta (01/02/2023 -> 1ro de febrero de 2023)
     * - Entonces notifica a los usuarios que hayan hecho una venta entre 01/01/2023 - 01/02/2023 que se ha terminado el reporte
     * -----------------------------------------------------------------------------------------------------------
     * mesPrueba es una variable para poder debuggear o mostrar funcionamiento. Si se provee esta variable
     * tendrá prioridad sobre el mes actual de ejecución de la función. Como nota, google schedule no agrega
     * esta variable.
     * Además mesPrueba tiene que ser en base 0
     * Si se ingresa x mes prueba se genera x reporte:
     * mesPrueba   | genera
     * -------------------------------------------
     *         0   | Reporte Diciembre año pasado
     *         1   | Reporte Enero año en curso
     *         2   | Reporte Febrero año en curso
     *         3   | Reporte Marzo año en curso
     *         4   | Reporte Abril año en curso
     *         5   | Reporte Mayo año en curso
     *         6   | Reporte Junio año en curso
     *         7   | Reporte Julio año en curso
     *         8   | Reporte Agosto año en curso
     *         9   | Reporte Septiembre año en curso
     *        10   | Reporte Octubre año en curso
     *        11   | Reporte Noviembre año en curso
     *
     * - 31/11/2022 23:59:00 -> 01/12/2022 00:00:00 -> reporte noviembre
     * - 31/12/2022 23:59:00 -> 01/01/2023 00:00:00 -> reporte diciembre
     * - 31/01/2023 23:59:00 -> 01/02/2023 00:00:00 -> reporte enero
     */
    let { mesPrueba } = req.query;
    if (mesPrueba !== undefined) mesPrueba = Number(mesPrueba);
    let fechaActual;

    //Si se provee mesPrueba y este es 0 quiere decir que estamos notificando del reporte de diciembre del año pasado
    fechaActual = obtenerFechaActualMexico();
    //getMonth nos devuelve el mes en base 0 (0:Enero, 1: Febrero...)
    let mes = fechaActual.getMonth();
    //Si se provee mesPrueba entonces usaremos ese mes en vez del que tiene "fechaActual"
    let anio = fechaActual.getFullYear();
    if (mesPrueba !== undefined) mes = mesPrueba;
    /**
     * Le sumamos 1 al mes porque date.parse toma los meses en base 1 (1: Enero, 2:Febrero...).
     * Nota: date parse usa un string "M YYYY" que indica que formato que tiene la fecha que deseamos generar
     * Como se omitio dia (DD) automaticamente asume que nos referimos al primer día del mes
     */

    let f1 = date.parse(`${mes + 1} ${anio}`, "M YYYY"); //fecha de inicio del mes actual / fecha final del mes pasado
    let f3 = date.addMonths(f1, -1); //fecha de inicio del mes pasado
    // if (mes === 0) {
    //   f3 = date.parse(`12 ${anio - 1}`, "M YYYY");
    // } else {

    // }
    console.log({ f1, f3 });
    //Obtenemos todos los usuarios que hayan hecho una venta en el rango f1 - f3
    let terapeutas = await Usuario.query()
      .withGraphJoined("terapeuta.tickets")
      .where((builder) => {
        builder
          .where(
            "terapeuta:tickets.fecha",
            ">=",
            date.format(f3, patternFechaCompleta)
          )
          .andWhere(
            "terapeuta:tickets.fecha",
            "<",
            date.format(f1, patternFechaCompleta)
          );
      });
    //Si no encontramos ningun usuario al que notificarle, terminamos
    if (terapeutas.length === 0)
      return res.status(200).json("No hay ventas en el periodo");
    //Si hay usuarios entonces generamos notificaciones
    let notificaciones = [];
    //rango_mes indica los meses que abarca el reporte
    let rango_mes;
    //Si mes es 0 quiere decir que estamos notificando del reporte de diciembre
    if (mes === 0) {
      rango_mes = `${getMes(mes - 2)}-${getMes(mes - 1)}`;
      //Si es cualquier otro valor, estamos notificando de cualquier reporte del año en curso
    } else {
      rango_mes = `${getMes(mes - 1)}-${getMes(mes)}`;
    }
    //Creamos objetos de notificación
    terapeutas.map(({ id }) => {
      notificaciones.push({
        id_usuario: id,
        titulo: "Nuevo reporte de ventas completado",
        descripcion: `Revisa el reporte de ventas: ${rango_mes}`,
        contexto_web: "/app/marketplace/terapeuta/reportes",
      });
    });
    console.log({ notificaciones });
    //Mandamos las notificaciones
    res.status(200).json(terapeutas);
    for (const n of notificaciones) {
      try {
        await generarNotificacion({ ...n });
      } catch (err) {
        console.log({ id: n.id_usuario, msg: "No se pudo mandar" });
      }
    }
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal :c");
  }
};

exports.eliminarVentasAntiguas = async (req, res, next) => {
  try {
    /**
     *
     */

    let fechaActual;
    fechaActual = obtenerFechaActualMexico();
    let f1 = date.format(fechaActual, patternFechaCompleta); //fecha actual
    //Obtenemos todos los tickets con un año de antiguedad
    let ticketsBorrados = await Ticket.query()
      .whereRaw(`fecha <= DATE_SUB("${f1}",INTERVAL 1 YEAR)`)
      .delete()
      .debug();

    return res.status(200).json({ ticketsBorrados });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal :c");
  }
};
