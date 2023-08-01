const date = require("date-and-time");
const Sala = require("../Models/Sala");
const crypto = require("crypto");
const {
  obtenerFechaActualMexico,
  patternFechaCompleta,
} = require("../utils/fechas");
exports.verSalas = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let salas = await Sala.query()
      .withGraphJoined("paciente.usuario")
      .modifyGraph("paciente", (builder) => {
        builder.select(["id", "id_usuario"]);
      })
      .modifyGraph("paciente.usuario", (builder) => {
        builder.select(["id", "nombre", "foto_perfil"]);
      })
      .where("id_terapeuta", "=", id_terapeuta)
      .orderBy("fecha_inicio","DESC");
    return res.status(200).json(salas);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.crearSala = async (req, res, next) => {
  let sala = req.body;
  try {
    let codigoInvitacion = await generarCodigoInvitacion();
    let salaCreada = await Sala.query().insertAndFetch({
      ...sala,
      codigo_acceso: codigoInvitacion,
    });
    salaCreada = await salaCreada.$query().withGraphJoined("paciente.usuario");
    return res.status(200).json(salaCreada);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.modificarSala = async (req, res, next) => {
  let sala = req.body;
  try {
    let { id } = sala;
    let salaEncontrada = await Sala.query().findById(id);
    if (!salaEncontrada) return res.status(404).json("No existe la sala");
    let salaModificada = await salaEncontrada
      .$query()
      .patchAndFetch({ ...sala });
    salaModificada = await salaModificada
      .$query()
      .withGraphJoined("paciente.usuario");
    return res.status(200).json(salaModificada);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.eliminarSala = async (req, res, next) => {
  let { id_sala } = req.params;
  try {
    let salaEliminada = await Sala.query().findById(id_sala).delete();
    return res.status(200).json(salaEliminada);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
//Esta funcion se va a ejecutar con el webhook
//Elimina que esten vacías y hayan tenido su última desconexión hace 5 minutos
exports.eliminarSalasInactivas = async (req, res, next) => {
  try {
    res.status(200).json("ok");
    //Obtenemos la fecha limite para eliminar salas, restandole 5 minutos a la fecha actual
    let fechaLimite = date.addMinutes(obtenerFechaActualMexico(), -5);
    //Formateamos en string la fecha limite
    let f1 = date.format(fechaLimite, patternFechaCompleta);
    //Obtenemos las salas eliminadas
    let salasEliminadas = await Sala.query()
      .whereRaw(`fecha_ultima_desconexion <= "${f1}" AND isEmpty = 1`)
      .delete()
      .debug();
    console.log({ salasEliminadas });
    return;
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.revisarAcceso = async (req, res, next) => {
  let { id_usuario, codigo_acceso } = req.params;
  try {
    //Primero buscamos la sala con el código de acceso solicitado
    let acceso = await Sala.query()
      .withGraphJoined("[terapeuta.usuario,paciente.usuario]")
      .findOne({ codigo_acceso });
    let fechaActual = obtenerFechaActualMexico();
    //Si no encontramos una sala con ese codigo de acceso lo hacemos saber
    if (!acceso) return res.status(404).json("No se encontro la sala");
    //Obtenemos la id de los usuarios participantes de la sala
    let {
      terapeuta: {
        usuario: { id: id_ut },
      },
    } = acceso;
    let {
      paciente: {
        usuario: { id: id_up },
      },
    } = acceso;
    //Checamos si el usuario que solicita acceso es igual a alguno de los participantes de la sala

    //Si no es asi, regresamos un 401
    if (!(id_usuario == id_ut || id_usuario == id_up))
      return res.status(401).json("No tienes acceso a esta sala");

    //revisamos si ya se puede acceder a la sala
    if (acceso.fecha_inicio > fechaActual)
      return res.status(403).json("Aún no puedes entrar a la sala");
    //si es así devolvemos un status 200
    return res.status(200).json(acceso);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

async function generarCodigoInvitacion() {
  //Definimos que caracteres pueden componer el código de invitación
  const caracteresPermitidos =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  //Definimos cuantos caracteres puede tener
  const longitudCadena = 8;
  //cadenaAleatoria almacena el código de invitación
  let cadenaAleatoria = "";
  try {
    //Iteramos infinitamente hasta que se genere una cadena que no se este utilizando
    while (true) {
      //Iteramos la cantidad de caracteres necesarios para obtener la cadena aleatoria
      for (let i = 0; i < longitudCadena; i++) {
        //Generamos un numero aleatorio con la librería crypto
        const indiceCaracter = crypto.randomInt(0, caracteresPermitidos.length);
        //Y obtenemos del string de caracteresPermitidos el caracter asociado la posición de indiceCaracter
        cadenaAleatoria += caracteresPermitidos[indiceCaracter];
      }
      //Ahora revisamos si el codigo ya existe en la base de datos
      //Si no es así rompemos el ciclo y retornamos la cadenaAleatoria
      if (!(await getSalaByCodigoInvitacion(cadenaAleatoria))) break;
      //Si existe, entonces regresamos cadenaAleatoria a un string vacío y repetimos
      cadenaAleatoria = "";
    }
  } catch (error) {
    throw error;
  }
  return cadenaAleatoria;
}

async function getSalaByCodigoInvitacion(cadenaAleatoria) {
  try {
    let sala = await Sala.query().findOne({
      codigo_acceso: cadenaAleatoria,
    });
    return sala;
  } catch (error) {
    throw error;
  }
}
