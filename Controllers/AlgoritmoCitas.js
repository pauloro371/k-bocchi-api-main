const { getDiaFromFecha } = require("../utils/algoritmo_cita/getDiaFromFecha");
const date = require("date-and-time");
const {
  obtenerFechaActualMexico,
  patternFecha,
  obtenerFechaComponent,
  patternHora,
  patternFechaCompleta,
  obtenerFechaHoraComponent,
} = require("../utils/fechas");
const {
  obtenerCitasFechasExcluyente,
} = require("../utils/algoritmo_cita/excluirFecha");

const duracionCita = 60; //minutos
/**
 * Esta función permite revisar si una fecha esta dentro de los días hábiles de un fisioterapeuta
 * @param {*} horario_terapeuta Es el horario del terapeuta
 * @param {*} fecha Es la fecha la cual se va a revisar
 * @returns {Promise<any|{razon:string}>} Una promesa que: se resuelve con el día del horario del terapeuta obtenido o que se rechaza si es que la fecha provista no esta disponible para citas.
 */
const checkDentroHorario = (horario_terapeuta, fecha) => {
  return new Promise((resolve, reject) => {
    let dia = getDiaFromFecha(fecha);
    console.log(`Checando por ${fecha}/${dia}`);
    horario_terapeuta.forEach((h) => {
      if (h.dia === dia) {
        console.log(`${h.dia}->${fecha}`);
        resolve(h);
      }
      console.log(h.dia);
    });
    reject({ razon: "Este día no trabaja el fisioterapeuta" });
  });
};

/**
 * Esta función permite obtener
 * @param {*} horario_dia Es un día del horario de un fisioterapeuta
 * @param {*} citas Es el arreglo de citas correspondientes al día horario_dia
 * @returns {Promise<string|{razon:string}>} Una promesa, que se resuelve correctamente si hay posibilidad de agendar una cita ese día y que se rechaza si no hay cupo
 */
const checkCitasDisponibles = (horario_dia, citas) => {
  return new Promise((resolve, reject) => {
    let { hora_inicio } = horario_dia;
    let { hora_fin } = horario_dia;
    let hI = date.parse(hora_inicio, "HH:mm:ss");
    let hF = date.parse(hora_fin, "HH:mm:ss");
    console.log(hI, hF);
    let citasPosibles = calcularCitasPosibles(hF, hI);
    console.log(`Citas posibles el ${horario_dia.dia}: ${citasPosibles}`);
    console.log(`# Citas actuales:  ${citas.length}`);
    if (citas.length >= citasPosibles) {
      console.log("No hay cupo");
      reject({ razon: "No hay cupo este día" });
    }
    if (citas.length < citasPosibles) {
      console.log("Hay cupo");
      //muestra las horas posibles
      resolve("Citas disponibles");
    }
  });
};

const checkFechaPosterior = (fecha) => {
  return new Promise((resolve, reject) => {
    if (
      date.parse(fecha, patternFecha) <=
      date.parse(obtenerFechaComponent(), patternFecha)
    ) {
      reject({ razon: "La fecha ingresada es hoy o anterior a hoy" });
    } else {
      resolve("Fecha posterior");
    }
  });
};
const checkFechaHoraPosterior = (fecha) => {
  return new Promise((resolve, reject) => {
    if (
      date.parse(fecha, patternFechaCompleta) <=
      date.parse(obtenerFechaHoraComponent(), patternFechaCompleta)
    ) {
      reject({ razon: "La fecha o la hora ingresada es anterior a hoy" });
    } else {
      resolve("Fecha posterior");
    }
  });
};

async function call() {
  let fecha = "2023-06-05";
  try {
    let resultado = await checkDentroHorario(horario, fecha);
    await checkCitasDisponibles(resultado, citas);
    obtenerHorariosDisponibles(resultado, citas, fecha);
  } catch (err) {
    console.log(err);
  }
}
/**
 *
 * @param {*} hF Es un objeto Date que indica la hora a la que termina de laborar un fisioterapeuta en un determinado día
 * @param {*} hI Es un objeto Date que indica la hora a la que inicia labores un fisioterapeuta
 * @returns {Integer} Un entero indicando cuantas citas se pueden agendar un determinado día de su horario.
 */
function calcularCitasPosibles(hF, hI) {
  /**
   * Mediante la función "substract" de la librería date-and-time se obtiene la diferencia entre dos fechas,
   *  y mediante la función "toMinutes" se obtienen los minutos de diferencia, al dividir entre la duración
   * de una cita podemos obtener cuantas citas son posibles de agendar en un determinado rango de tiempo*/
  return Math.floor(
    Math.floor(date.subtract(hF, hI).toMinutes()) / duracionCita
  );
}

/**
 * Esta función permite obtener los horarios posibles de un arreglo de citas
 * @param {*} horario_dia Es el objeto que contiene un objeto que representa un día del horario del terapeuta
 * @param {*} citas Es un array que contiene las citas asociadas a la fecha y el horario_dia
 * @param {*} fecha La fecha en la que se desea obtener los horarios disponibles
 * @returns {Array<{horario_formatted:string,fecha:Date}} Un objeto que contiene los horarios disponibles
 */
function obtenerHorariosDisponibles(horario_dia, citas, fecha) {
  //se obtiene las horas de inicio y final laboral del día elegido
  let { hora_inicio, hora_fin } = horario_dia;
  //Se generan objetos Date para poder trabajar con la libreria date-and-time
  let hI = date.parse(hora_inicio, "HH:mm:ss");
  let hF = date.parse(hora_fin, "HH:mm:ss");
  //Se calcula el numero posible de citas entre el rango de tiempo habil
  let numeroCitas = calcularCitasPosibles(hF, hI);
  let i = 1;
  //Se inicializa un objeto tipo Date para iterar sobre las fechas posibles
  let hora_acc = new Date(hI);
  let horariosDisponibles = [];
  //Se itera sobre las posibles citas que puede haber en el día
  while (i <= numeroCitas) {
    //Mediante el método "find" revisamos si hay una cita que inicie en la hora que tenga el objeto "hora_acc"
    let citaEncontrada = checkHorarioDisponible(citas, hora_acc);
    //Si el método find devolvió undefined entonces se agrega la hora actual a las citas disponibles
    if (!citaEncontrada) {
      //Se calcula el fin de la cita.
      let next = date.addMinutes(hora_acc, duracionCita);
      //Se obtiene la fecha de inicio y fin de la cita usando el objeto para formatear creado anteriormente
      let fecha_inicio_formatted = date.format(hora_acc, patternHora);
      let fecha_fin_formatted = date.format(next, patternHora);
      //Se crea un string para representar la cita disponible
      let horario_formatted = `${fecha_inicio_formatted}-${fecha_fin_formatted}`;
      console.log("Cita disponible: ", horario_formatted);
      /**
       * Se añade a "horariosDisponibles" un objeto, que tiene dos propiedades:
       * "horario_formattted" que es la string que representa el horario disponible
       * "fecha" que es un objeto tipo Date que contiene la fecha de inicio de la cita
       * */
      horariosDisponibles.push({
        horario_formatted,
        fecha: date.parse(
          `${fecha} ${fecha_inicio_formatted}`,
          patternFechaCompleta
        ),
      });
    }
    //Una vez evaluado la condición previa, actualizamos el valor de "hora_acc" con el siguiente horario a revisar
    i++;
    hora_acc = date.addMinutes(hora_acc, duracionCita);
  }
  console.log(horariosDisponibles);
  return horariosDisponibles;
}
/**
 * Esta función permite obtener la cita que esta en determinada hora de un array de citas
 * @param {*} citas Es un array que contiene las citas asociadas a la fecha y el horario_dia
 * @param {*} fecha La fecha en la que se desea obtener la cita
 * @returns {Array<{horario_formatted:string,fecha:Date}} Un objeto que contiene los horarios disponibles
 */
function checkHorarioDisponible(citas, fecha_horario) {
  let cintaEncontrada = citas.find((cita) => {
    //Se obtiene un string en el formato HH:mm:ss mediante el formateador creado previamente
    let dateString1 = date.format(fecha_horario, patternHora);
    //Se crea un objeto tipo Date, lo convertimos a string y obtenemos su parte que indica el tiempo
    let fechaCita = new Date(cita.fecha)
      .toISOString()
      .split("T")[1]
      .substring(0, 8);
    /**
     * Se usa el método parse para obtener un objeto Date usando únicamente el tiempo/hora de "fechaCita"
     * para posteriormente obtener la representación en string del tiempo/hora de "fechaCitaFormatoFecha"
     */
    let fechaCitaFormatoFecha = date.parse(fechaCita, patternHora);
    let dateString2 = date.format(fechaCitaFormatoFecha, patternHora);
    /**
     * Finalmente se evalúa si dateString1 y dateString2 son iguales,
     * si es así entonces quiere decir que la cita a la que corresponde
     * este horario no esta disponible. El método find devuelve la instancia de "cita" en este caso
     *
     * Si no es así quiere decir que no hay una cita que inicie a la hora asignada en "hora_acc" y el método find devuelve undefined
     */
    return dateString1 === dateString2;
  });
  return cintaEncontrada;
}

async function buscarFechasDisponibles(
  id_terapeuta,
  horario,
  fecha,
  hora = null
) {
  let citas_excluidas = await obtenerCitasFechasExcluyente(id_terapeuta, fecha);
  console.log({ citas_excluidas });
  fecha = date.parse(fecha, patternFecha);
  let fecha_actual = date.parse(obtenerFechaComponent(), patternFecha);
  if (fecha <= fecha_actual) {
    fecha = date.addDays(fecha_actual, 1);
  }
  let fecha_anterior = date.addDays(fecha, -1);
  let fechas_disponibles_encontradas = 0;
  let fechas_disponibles = [];
  while (
    !date.isSameDay(fecha_anterior, fecha_actual) &&
    fechas_disponibles_encontradas < 2 &&
    !date.isSameDay(fecha, fecha_actual)
  ) {
    fecha_anterior;
    citas = [];
    citas_excluidas.find((cita) => {
      if (date.isSameDay(cita.fecha, fecha_anterior)) {
        citas.push(cita);
      }
    });
    let horario_seleccionado;
    try {
      horario_seleccionado = await checkDentroHorario(horario, fecha_anterior);
      await checkCitasDisponibles(horario_seleccionado, citas);
      if (hora !== null && checkHorarioDisponible(citas, hora)) {
        throw new Error("Horario ocupado este día");
      }
      console.log(`${fecha_anterior} aplica como día disponible`);
      fechas_disponibles.push(fecha_anterior);
      fechas_disponibles_encontradas++;
    } catch (err) {
      console.log(`${fecha_anterior} no aplica como dia disponible`);
    }
    fecha_anterior = date.addDays(fecha_anterior, -1);
  }
  console.log("object");
  let fecha_siguiente = date.addDays(fecha, 1);
  while (fechas_disponibles_encontradas < 4) {
    fecha_siguiente;
    citas = [];
    citas_excluidas.find((cita) => {
      if (date.isSameDay(cita.fecha, fecha_siguiente)) {
        citas.push(cita);
      }
    });
    let horario_seleccionado;
    try {
      horario_seleccionado = await checkDentroHorario(horario, fecha_siguiente);
      await checkCitasDisponibles(horario_seleccionado, citas);
      // let horarios_disponibles = obtenerHorariosDisponibles(
      //   horario_seleccionado,
      //   citas,
      //   fecha_anterior
      // );
      if (hora !== null && checkHorarioDisponible(citas, hora)) {
        throw new Error("Horario ocupado este día");
      }
      console.log(`${fecha_siguiente} aplica como día disponible`);
      fechas_disponibles.push(fecha_siguiente);
      fechas_disponibles_encontradas++;
    } catch (err) {
      console.log(`${fecha_siguiente} no aplica como dia disponible`);
    }
    fecha_siguiente = date.addDays(fecha_siguiente, 1);
  }
  return fechas_disponibles;
}

module.exports = {
  checkDentroHorario,
  checkCitasDisponibles,
  obtenerHorariosDisponibles,
  buscarFechasDisponibles,
  checkFechaPosterior,
  checkHorarioDisponible,
  checkFechaHoraPosterior,
};
