const RegistrationToken = require("../Models/RegistrationToken");

exports.verRegistrationTokens = async (req, res, next) => {
  try {
    return res.status(200).json(await RegistrationToken.query());
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
exports.verRegistrationTokensUsuario = async (req, res, next) => {
  let { id_usuario } = req.params;
  try {
    let tokens = await verTokensUsuario(id_usuario);
    return res.status(200).json(tokens);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
exports.crearRegistrationToken = async (req, res, next) => {
  try {
    let { id_usuario, token } = req.body;
    let tokenRepetido = await ver(token);
    if (tokenRepetido) return res.status(200).json(tokenRepetido);
    let tokenCreado = await crear(token, id_usuario);
    return res.status(200).json(tokenCreado);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
exports.eliminarRegistrationToken = async (req, res, next) => {
  try {
    let { token } = req.params;
    let tokens = await eliminar(token);
    return res.status(200).json(tokens);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
const crear = async (token, id_usuario) => {
  try {
    let tokenCreado = await RegistrationToken.query().insertAndFetch({
      token,
      id_usuario,
    });
    return tokenCreado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const eliminar = async (token) => {
  try {
    let tokenEliminado = await RegistrationToken.query().deleteById(token);
    return tokenEliminado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const ver = async (token) => {
  try {
    let tokenEncontrado = await RegistrationToken.query().findById(token);
    return tokenEncontrado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const verTokensUsuario = async (id_usuario) => {
  try {
    let tokenEncontrado = await RegistrationToken.query().where(
      "id_usuario",
      "=",
      id_usuario
    );
    return tokenEncontrado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const actualizar = async (token, id_usuario) => {
  try {
    let tokenActualizado = await RegistrationToken.query().updateAndFetchById(
      token,
      {
        id_usuario,
      }
    );
    return tokenActualizado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const eliminarVarios = async (tokens) => {
  try {
    let tokensBorrados = await RegistrationToken.query()
      .whereIn("token", tokens)
      .delete()
      .debug();
    return tokensBorrados;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
exports.crear = crear;
exports.eliminar = eliminar;
exports.eliminarVarios = eliminarVarios;
exports.ver = ver;
exports.verTokensUsuario = verTokensUsuario;
exports.actualizar = actualizar;
