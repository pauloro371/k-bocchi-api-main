let options = {
  timeZone: "America/Mexico_City",
};
let formatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
exports.formatearFechaMx = (fecha) => {
  let x = formatter.formatToParts(fecha);
  let p = `${x[4].value} ${Number(x[2].value) - 1} ${x[0].value} ${x[6].value} ${x[8].value} ${x[10].value}`;

  console.log(p);
};
