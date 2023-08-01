const Comentario = require("../Models/Comentario");
const Paciente = require("../Models/Paciente");
const Terapeuta = require("../Models/Terapeuta");

exports.validarComentario = async (req, res, next) => {
  let id_terapeuta, id_paciente;
  if (req.body.comentario) {
    id_paciente = req.body.comentario.id_paciente;
    id_terapeuta = req.body.comentario.id_terapeuta;
  } else {
    id_paciente = req.body.id_paciente;
    id_terapeuta = req.body.id_terapeuta;
  }

  try {
    let paciente = await Paciente.query()
      .findById(id_paciente)
      .joinRelated("terapeutas")
      .where("terapeutas.id", "=", id_terapeuta);
    if (!paciente) {
      return res.status(403).json("No tiene relación con el paciente");
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.crearComentario = async (req, res, next) => {
  let comentario = req.body;
  try {
    let comentarioCreado = await Comentario.query().insertAndFetch(comentario);
    return res.status(200).json(comentarioCreado);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.editarComentario = async (req, res, next) => {
  let { id, comentario } = req.body;
  let { id_terapeuta, id_paciente } = comentario;
  try {
    let comentarioEncontrado = await Comentario.query()
      .findById(id)
      .andWhere("id_terapeuta", "=", id_terapeuta)
      .andWhere("id_paciente", "=", id_paciente);
    if (!comentarioEncontrado)
      return res.status(404).json("No se encontro el comentario a editar");
    let comentarioEditado = await comentarioEncontrado
      .$query()
      .patchAndFetch(comentario);
    return res.status(200).json(comentarioEditado);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.eliminarComentario = async (req, res, next) => {
  let { id } = req.body;
  try {
    let comentarioEncontrado = await Comentario.query().findById(id);
    if (!comentarioEncontrado)
      return res.status(404).json("No se encontro el comentario a eliminar");
    return res.status(200).json(await comentarioEncontrado.$query().delete());
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verComentarios = async (req, res, next) => {
  try {
    return res.status(200).json(await Comentario.query());
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verComentario = async (req, res, next) => {
  let { id } = req.params;
  try {
    let comentario = await Comentario.query().findById(id);
    if (!comentario)
      return res.status(404).json("No se encontro el comentario");
    return res.status(200).json(comentario);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verComentariosPaciente = async (req, res, next) => {
  let { id_paciente } = req.params;
  try {
    let paciente = await Paciente.query().findById(id_paciente);
    if (!paciente) return res.status(404).json("No se encontro el paciente");
    return res
      .status(200)
      .json(await Comentario.query().where("id_paciente", "=", id_paciente));
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verComentariosTerapeuta = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let terapeuta = await Terapeuta.query().findById(id_terapeuta);
    if (!terapeuta) return res.status(404).json("No se encontro el terapeuta");
    return res
      .status(200)
      .json(await Comentario.query().where("id_terapeuta", "=", id_terapeuta));
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
