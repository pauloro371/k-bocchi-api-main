const Comentario = require("../Models/Comentario");
const Paciente = require("../Models/Paciente");
const Resena = require("../Models/Resenas");
const Terapeuta = require("../Models/Terapeuta");

exports.validarResena = async (req, res, next) => {
    let {id_terapeuta, id_paciente} = req.body;
    try {
      let paciente = await Paciente.query()
        .findById(id_paciente)
        .joinRelated("terapeutas_resenados")
        .where("terapeutas_resenados.id", "=", id_terapeuta);
      if (paciente) {
        return res.status(405).json("Este paciente ya ha reseñado a este terapeuta");
      }
      next();
    } catch (error) {
      console.log(error);
      return res.status(500).json("Algo ha salido mal");
    }
//   next();
};
exports.crearResena = async (req, res, next) => {
  let resena = req.body;
  try {
    let resenaCreada = await Resena.query().insertAndFetch(resena);
    return res.status(200).json(resenaCreada);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.editarResena = async (req, res, next) => {
  let resena = req.body;
  let { id, id_terapeuta, id_paciente } = resena;
  try {
    let resenaEncontrada = await Resena.query()
      .findById(id)
      .andWhere("id_terapeuta", "=", id_terapeuta)
      .andWhere("id_paciente", "=", id_paciente);
    if (!resenaEncontrada)
      return res.status(404).json("No se encontro la reseña a editar");
    let resenaEditada = await resenaEncontrada.$query().patchAndFetch(resena);
    return res.status(200).json(resenaEditada);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.eliminarResena = async (req, res, next) => {
  let { id } = req.body;
  try {
    let resenaEncontrada = await Resena.query().findById(id);
    if (!resenaEncontrada)
      return res.status(404).json("No se encontro la reseña a eliminar");
    return res.status(200).json(await resenaEncontrada.$query().delete());
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verResenas = async (req, res, next) => {
  try {
    return res.status(200).json(await Resena.query());
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verResena = async (req, res, next) => {
  let { id } = req.params;
  try {
    let resena = await Resena.query().findById(id);
    if (!resena)
      return res.status(404).json("No se encontro la reseña");
    return res.status(200).json(resena);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verResenasPaciente = async (req, res, next) => {
  let { id_paciente } = req.params;
  try {
    let paciente = await Paciente.query().findById(id_paciente);
    if (!paciente) return res.status(404).json("No se encontro el paciente");
    return res
      .status(200)
      .json(await Resena.query().where("id_paciente", "=", id_paciente));
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verResenasTerapeuta = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let terapeuta = await Terapeuta.query().findById(id_terapeuta);
    if (!terapeuta) return res.status(404).json("No se encontro el terapeuta");
    return res
      .status(200)
      .json(await Resena.query().where("id_terapeuta", "=", id_terapeuta));
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
