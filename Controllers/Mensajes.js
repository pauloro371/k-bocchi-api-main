const { ref } = require("objection");
const Mensaje = require("../Models/Mensaje");
const Usuario = require("../Models/Usuario");

exports.crearMensaje = async (req, res, next) => {
  let { mensaje: mensajeNuevo } = req.body;
  try {
    let mensaje = await Mensaje.query().insertAndFetch(mensajeNuevo);
    return res.status(200).json(mensaje);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.borrarMensaje = async (req, res, next) => {
  let { id } = req.params;
  try {
    let resultado = await Mensaje.query().findById(id).delete();
    return res.status(200).json(resultado);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.modificarMensaje = async (req, res, next) => {
  let { mensaje: mensajeModificar } = req.body;
  try {
    let { id } = mensajeModificar;
    let mensaje = await Mensaje.query().findById(id);
    if (!mensaje) return res.status(404).json("No se encontro el mensaje");
    let mensajeResult = await mensaje.$query().patchAndFetch(mensajeModificar);
    return res.status(200).json(mensajeResult);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verMensajes = async (req, res, next) => {
  try {
    let mensajes = await Mensaje.query();
    return res.status(200).json(mensajes);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verChat = async (req, res, next) => {
  let { id_from, id_to } = req.params;
  try {
    let mensajesChat = await Mensaje.query()
      .withGraphJoined("usuario_from.[paciente,terapeuta]")
      .where((builder) => {
        builder
          .where("mensajes.id_from", "=", id_from)
          .andWhere("mensajes.id_to", "=", id_to);
      })
      .modifyGraph("usuario_from", (builder) => {
        builder.select("nombre", "foto_perfil", "rol", "id");
      })
      .modifyGraph("usuario_from.[terapeuta,paciente]", (builder) => {
        builder.select("id");
      })
      .modifyGraph("usuario_from.[terapeuta]", (builder) => {
        builder.select(
          "nombre_del_consultorio",
          "numero_cedula",
          "servicio_domicilio"
        );
      })
      .orWhere((builder) => {
        builder
          .where("mensajes.id_to", "=", id_from)
          .andWhere("mensajes.id_from", "=", id_to);
      })
      .orderBy("fecha", "ASC");
    return res.status(200).json(mensajesChat);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verChats = async (req, res, next) => {
  let { id_usuario } = req.params;
  try {
    let usuarios = await Usuario.query()
      .distinct([
        "usuarios.nombre",
        "usuarios.foto_perfil",
        "usuarios.id",
        Mensaje.query()
          .where((builder) => {
            builder
              .where("id_from", "=", id_usuario)
              .andWhere("id_to", "=", ref("usuarios.id"));
          })
          .orWhere((builder) => {
            builder
              .where("id_to", "=", id_usuario)
              .andWhere("id_from", "=", ref("usuarios.id"));
          })
          .orderBy("fecha", "DESC")
          .select("fecha")
          .as("fecha")
          .limit(1),
        Mensaje.query()
          .where((builder) => {
            builder
              .where("id_from", "=", id_usuario)
              .andWhere("id_to", "=", ref("usuarios.id"));
          })
          .orWhere((builder) => {
            builder
              .where("id_to", "=", id_usuario)
              .andWhere("id_from", "=", ref("usuarios.id"));
          })
          .orderBy("fecha", "DESC")
          .select("mensajes.id")
          .as("id_mensaje")
          .limit(1),
        Mensaje.query()
          .where((builder) => {
            builder
              .where("id_from", "=", id_usuario)
              .andWhere("id_to", "=", ref("usuarios.id"));
          })
          .orWhere((builder) => {
            builder
              .where("id_to", "=", id_usuario)
              .andWhere("id_from", "=", ref("usuarios.id"));
          })
          .orderBy("fecha", "DESC")
          .select("contenido")
          .as("contenido")
          .limit(1),
      ])
      .leftJoinRelated("mensajes_enviados")
      .leftJoinRelated("mensajes_recibidos")
      .where("mensajes_recibidos.id_from", "=", id_usuario)
      .orWhere("mensajes_enviados.id_to", "=", id_usuario)
      .orderBy("fecha", "DESC")
      .debug();
    // .findById(id_usuario)
    // .modifyGraph("mensajes",builder=>{
    //   builder.wh
    // });
    // console.log({ usuarios });
    return res.status(200).json(usuarios);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
