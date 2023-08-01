const Notificacion = require("../Models/Notificacion");
const { generarNotificacion } = require("../utils/notificaciones");

exports.crearNotificacion = async (req, res, next) => {
  try {
    let notificacion = await generarNotificacion({
      ...req.body,
      payload: {
        extras: "123",
      },
    });
    return res.status(200).json(notificacion);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.eliminarNotificacion = async (req, res, next) => {
  let { id } = req.body;
  try {
    return res
      .status(200)
      .json(await Notificacion.query().findById(id).delete());
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.editarNotificacion = async (req, res, next) => {
  let { id } = req.body;
  try {
    return res
      .status(200)
      .json(await Notificacion.query().patchAndFetchById(id, req.body));
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.marcarComoLeidas = async (req, res, next) => {
  let { id_usuario } = req.params;
  try {
    let notificaciones = await Notificacion.query().where(
      "id_usuario",
      "=",
      id_usuario
    ).patch({leida:1});
    
    return res.status(200).json(notificaciones);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.eliminarTodasNotificaciones = async (req, res, next) => {
  let { id_usuario } = req.params;
  try {
    return res
      .status(200)
      .json(
        await Notificacion.query().where("id_usuario", "=", id_usuario).delete()
      );
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verNotificacionesUsuario = async (req, res, next) => {
  let { id } = req.params;
  try {
    return res
      .status(200)
      .json(
        await Notificacion.query()
          .joinRelated("usuario")
          .where("usuario.id", "=", id)
      );
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verNotificaciones = async (req, res, next) => {
  try {
    return res.status(200).json(await Notificacion.query());
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
