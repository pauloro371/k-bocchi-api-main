const firebase = require("firebase-admin");
const {
  verTokensUsuario,
  eliminarVarios,
} = require("../Controllers/RegistrationTokens");
const Notificacion = require("../Models/Notificacion");

const NOT_REGISTERED = "messaging/registration-token-not-registered";
const NOT_VALID = "messaging/invalid-registration-token";
exports.generarNotificacion = async ({
  id_usuario,
  descripcion,
  contexto_web,
  contexto_movil,
  titulo,
  payload,
  android = undefined,
  webpush = undefined,
}) => {
  try {
    let tokens = await verTokensUsuario(id_usuario);
    console.log({ tokens });
    let notificacion = await Notificacion.query().insertAndFetch({
      id_usuario,
      descripcion,
      titulo,
      contexto_web,
      contexto_movil,
    });
    if (tokens.length === 0) return null;
    let results = await firebase.messaging().sendEachForMulticast({
      notification: {
        body: descripcion,
        title: titulo,
      },
      android: android,
      webpush: webpush,
      data: payload,
      tokens: tokens.map(({ token }) => token),
    });
    console.log({ ...results, responses: [...results.responses] });
    //aquí va fcm
    let tokensToDelete = [];
    if (results.failureCount != 0) {
      let { responses } = results;
      responses.forEach(({ success, error }, index) => {
        if (
          error &&
          (error.code === NOT_REGISTERED || error.code === NOT_VALID)
        ) {
          tokensToDelete.push(tokens[index].token);
        }
      });
      await eliminarVarios(tokensToDelete);
    }

    return notificacion;
  } catch (err) {
    throw err;
  }
};
