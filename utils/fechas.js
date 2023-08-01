const date = require("date-and-time");
const patternFecha = date.compile("YYYY-MM-DD"); //Formateador que permite convertir un objeto Date a un string con el formato indicado de fecha
const patternFechaCompleta = date.compile("YYYY-MM-DD HH:mm:ss"); //Formateador que permite convertir un objeto Date a un string con el formato indicado de horas
const patternFechaDisplay = date.compile("dddd D de MMMM de YYYY"); //Formateador que permite convertir un objeto Date a un string con el formato indicado de horas. Formato más amigable
const patternHora = date.compile("HH:mm:ss"); //Formateador que permite convertir un objeto Date a un string con el formato indicado de fecha
/**
 *  Función que permite obtener la fecha actual en America/Mexico_City
 * @returns {Date} Fecha actual en GMT-6 (Huso horario en America/Mexico_City)
 */

const obtenerFechaActualMexico = () => {
  return date.addHours(new Date(), -6, true);
};

/**
 * Función que permite obtener un string representando la fecha con tiempo 00:00:00. Si no se provee una fecha
 * se devuelve la fecha actual en GMT-6
 * @param {Date} fecha Objeto Date del cual queremos obtener únicamente su fecha
 * @returns
 */
//2003-04-08 22:00:22
const obtenerFechaTiempoComponent = (fecha = obtenerFechaActualMexico()) => {
  let f = `${fecha.toISOString().split("T")[0]} 00:00:00`;
  return f;
};
/**
 * Función que permite obtener un string representando la fecha. Si no se provee una fecha
 * se devuelve la fecha actual en GMT-6
 * @param {Date} fecha Objeto Date del cual queremos obtener únicamente su fecha
 * @returns
 */
const obtenerFechaComponent = (fecha = obtenerFechaActualMexico()) => {
  return fecha.toISOString().split("T")[0];
};
/**
 * Función que permite obtener un string representando la hora. Si no se provee una fecha
 * se devuelve la fecha actual en GMT-6
 * @param {Date} fecha Objeto Date del cual queremos obtener únicamente su fecha
 * @returns
 */
const obtenerHoraComponent = (fecha = obtenerFechaActualMexico()) => {
  return fecha.toISOString().split("T")[1].substring(0, 8);
};
/**
 * Función que permite obtener un string representando la fecha y hora. Si no se provee una fecha
 * se devuelve la fecha y hora actual en GMT-6
 * @param {Date} fecha Objeto Date del cual queremos obtener únicamente su fecha
 * @returns
 */
const obtenerFechaHoraComponent = (fecha = obtenerFechaActualMexico()) => {
  let f = obtenerFechaComponent(fecha);
  let h = obtenerHoraComponent(fecha);
  return `${f} ${h}`;
};
const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
function getMes(index) {
  if (index == -2) {
    let anio = new Date().getFullYear() - 1;
    let mes = meses[meses.length - 2];
    return `${mes} (${anio})`;
  }
  if (index == -1) {
    let anio = new Date().getFullYear() - 1;
    let mes = meses[meses.length - 1];
    return `${mes} (${anio})`;
  }
  return meses[index];
}
module.exports = {
  obtenerFechaActualMexico,
  patternFecha,
  patternFechaCompleta,
  patternHora,
  obtenerFechaComponent,
  obtenerFechaTiempoComponent,
  obtenerHoraComponent,
  obtenerFechaHoraComponent,
  meses,
  getMes,
  patternFechaDisplay
};
