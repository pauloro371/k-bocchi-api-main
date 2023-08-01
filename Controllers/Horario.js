const Terapeuta = require("../Models/Terapeuta");

exports.crearHorario = async () => {};
exports.editarHorario = async () => {};
exports.verHorario = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  let terapeuta = await Terapeuta.query()
    .withGraphJoined("horario")
    .findById(id_terapeuta);
  if (!terapeuta) return res.status(404).json("No se encontro el terapeuta");
  res.body = { ...res.body, horario: terapeuta.horario };
  console.log(res.body);
  next();
};
exports.verHorarios = async () => {};
