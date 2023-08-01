let days = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};
exports.getDiaFromFecha = (f) => {
  let fecha = new Date(f);
  let dia = fecha.getUTCDay();
  // let dia2 = fecha.getDay();
  // console.log(`${dia}-${days[dia]}`)
  // console.log("POPO: ",dia,dia2);
  return days[dia];
};
