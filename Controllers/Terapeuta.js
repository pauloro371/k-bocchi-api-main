const Paciente = require("../Models/Paciente");
const Terapeuta = require("../Models/Terapeuta");
const Usuario = require("../Models/Usuario");
const { ROLES } = require("../roles");
const { desencriptar } = require("../utils/encryption");
const date = require("date-and-time");
const {
  patternFecha,
  patternFechaCompleta,
  obtenerFechaActualMexico,
  obtenerFechaComponent,
  patternHora,
  obtenerFechaTiempoComponent,
  obtenerHoraComponent,
} = require("../utils/fechas");
const Cita = require("../Models/Cita");
const { ref, raw } = require("objection");
exports.verTerapeutaDetalles = async (req, res, next) => {
  try {
    let { id_terapeuta } = req.params;
    // console.log(id_terapeuta);
    let terapeuta = await Terapeuta.query()
      .findOne({
        "terapeutas.id": id_terapeuta,
      })
      .withGraphFetched(
        "[comentarios.[comentario_paciente.[resenas,usuario]],resenas,usuario]"
      )
      .modifyGraph("comentarios.[comentario_paciente.resenas]", (builder) => {
        builder.where("id_terapeuta", "=", id_terapeuta);
      })
      .modifyGraph("resenas", (builder) => {
        builder.avg("estrellas as promedio");
        builder.groupBy("id_terapeuta");
      })
      .modifyGraph("comentarios", (builder) => {
        builder.select("comentarios.*");
        builder
          .select(
            raw(
              `FN_SELEC_FECHA(comentarios.fecha_edicion,comentarios.fecha_creacion)`
            ).as("fecha_ordenacion")
          )
          .orderBy("fecha_ordenacion", "DESC");
      });
    if (!terapeuta) return res.status(404).json("No existe ese terapeuta");

    return res.status(200).json(terapeuta);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Ha ocurrido un error");
  }
};

exports.buscarTerapeutas = async (req, res, next) => {
  let {
    nombre,
    servicio_domicilio,
    pago_minimo,
    pago_maximo,
    estrellas,
    lng,
    lat,
    con_consultorio,
    distancia,
  } = req.query;
  console.log(nombre);
  try {
    let usuarios = await Usuario.query()
      .where("rol", "=", ROLES.FISIOTERAPEUTA)
      .withGraphJoined("terapeuta.[resenas]")
      .modify((builder) => {
        if (lng && lat) {
          builder
            .select(
              raw(
                `FN_DIST_HAVERSINE(terapeuta.lat, terapeuta.lng, ${lat}, ${lng}) as dist`
              )
            )
            .andWhereRaw(
              `FN_DIST_HAVERSINE(terapeuta.lat, terapeuta.lng, ${lat}, ${lng}) <= ${
                distancia || 15
              }`
            ); //default 15km
        }
      })
      .modify((q) => {
        if (nombre) {
          q.whereRaw(
            `(usuarios.nombre like "%${nombre}%" OR terapeuta.nombre_del_consultorio like "%${nombre}%")`
          );
        }

        if (servicio_domicilio) {
          q.andWhere(
            "terapeuta.servicio_domicilio",
            "=",
            servicio_domicilio === "true" ? 1 : 0
          );
        }
        if (con_consultorio === "false") {
          q.andWhere("terapeuta.nombre_del_consultorio", "=", "");
        }
        if (con_consultorio === "true") {
          q.andWhere("terapeuta.nombre_del_consultorio", "<>", "");
        }
        //t 550 - 700
        //p 5 - 500
        q.andWhere(
          "terapeuta.pago_minimo",
          "<=",
          Number(pago_maximo || Number.MAX_SAFE_INTEGER)
        ).andWhere(
          "terapeuta.pago_maximo",
          ">=",
          Number(pago_minimo || Number.MIN_SAFE_INTEGER)
        );
      })
      .modifyGraph("terapeuta.resenas", (builder) => {
        builder.avg("estrellas as promedio");
        builder.groupBy("id_terapeuta");
        // builder.where("promedio",">=",5)
      })
      .modify((q) => {
        q.orderBy("terapeuta:resenas.promedio", "DESC");
        if (estrellas) q.where("terapeuta:resenas.promedio", ">=", estrellas);
      })

      // .avg("terapeuta:resenas.id_terapeuta")
      // .debug();
    res.count = usuarios.length;
    res.resultados = usuarios;
    next()
  } catch (err) {
    res.status(500).json("Algo ha salido mal");
  }
};

exports.loginTerapeuta = async (req, res, next) => {
  console.log(req.body);
  try {
    let usuarioFisio = await Usuario.query()
      .withGraphJoined("[terapeuta]")
      .findOne({ email: req.body.email });
    if (!usuarioFisio) {
      return res
        .status(404)
        .json("Usuario no encontrado en nuestra base de datos");
    }
    if (usuarioFisio.rol == "paciente") {
      return res.status(401).json("Usuario no es de tipo fisioterapeuta");
    }
    if (usuarioFisio.email && !usuarioFisio.contrasena) {
      return res.status(451).json("Usuario registrado con google");
    }
    let contrasena = desencriptar(usuarioFisio.contrasena);
    if (usuarioFisio.email && contrasena != req.body.contrasena)
      return res.status(401).json("Contraseña incorrecta");
    return res.json(usuarioFisio);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Ha habido un error");
  }
};

exports.existeTerapeuta = async (req, res, next) => {
  try {
    let { id_terapeuta } = req.params;
    let terapeuta = await Terapeuta.query().findById(id_terapeuta);
    if (!terapeuta) return res.status(404).json("No se encontro el terapeuta");
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verEstrellas = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let estrellas = await Terapeuta.query()
      .findById(id_terapeuta)
      .withGraphJoined("resenas")
      .modifyGraph("resenas", (builder) => {
        builder.avg("estrellas as promedio");
        builder.groupBy("id_terapeuta");
        // builder.where("promedio",">=",5)
      })
      .select("promedio")
      // .avg("terapeuta:resenas.id_terapeuta")
      .debug();
    let { promedio } = estrellas;
    return res.json({
      promedio,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verPacientes = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let pacientes = await Paciente.query()
      .withGraphFetched("usuario")
      .modifyGraph("usuario", (builder) => {
        builder.select("email", "nombre", "telefono", "foto_perfil");
      })
      .whereExists(
        Paciente.relatedQuery("terapeutas").where(
          "terapeutas.id",
          "=",
          id_terapeuta
        )
      )
      .select("id", "id_usuario");
    pacientes = pacientes.map((p) => {
      let usuario = p.usuario;
      delete p.usuario;
      return { ...p, ...usuario, id_paciente: p.id };
    });
    return res.status(200).json(pacientes);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verPacientesBitacora = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  let { nombre } = req.query;
  try {
    console.log({ x: obtenerFechaComponent() });
    let f = obtenerFechaActualMexico();
    let fechaActual = date.parse(
      obtenerFechaTiempoComponent(f),
      patternFechaCompleta
    );
    let fechaLimite = date.addDays(fechaActual, 1);
    fechaLimite = date.addSeconds(fechaLimite, -1);
    let hora_consultada = obtenerHoraComponent(f);
    // let FechaFinalFormateada = date.format(fechaLimite, patternFecha);
    // console.log({ fecha1 });
    let p = await Paciente.query()
      .withGraphJoined("[citas as ultima_cita,usuario]")
      .where("ultima_cita.id_terapeuta", "=", id_terapeuta)
      .select("pacientes.id", "pacientes.id_usuario")
      .select(
        raw(
          `FN_TIENE_CITA(pacientes.id,${id_terapeuta},"${date.format(
            fechaActual,
            patternFecha
          )} 00:00:00","${date.format(
            fechaLimite,
            patternFechaCompleta
          )}","${hora_consultada}")`
        ).as("has_cita_hoy")
      )
      // .orWhere("ultima_cita.fecha", "<=", fecha1)
      // .orWhere("ultima_cita.fecha",">",)
      .andWhere(
        "ultima_cita.fecha",
        "=",
        Cita.query()
          .where("id_paciente", "=", ref("ultima_cita.id_paciente"))
          .andWhere("id_terapeuta", "=", id_terapeuta)
          .max("fecha")
      )
      .modify((builder) => {
        if (nombre) builder.andWhereRaw(`(usuario.nombre like "%${nombre}%")`);
      })
      .modifyGraph("usuario", (builder) => {
        builder.select("nombre", "foto_perfil", "telefono");
      })
      .modifyGraph("ultima_cita", (builder) => {
        builder.select("domicilio", "fecha", "id_terapeuta");
      })
      .orderBy([
        {
          column: "has_cita_hoy",
          order: "desc",
        },
        {
          column: "ultima_cita.fecha",
          order: "desc",
        },
      ])
      .debug();
    p = p.map((p) => {
      let { usuario } = { ...p };
      delete p.usuario;
      return {
        ...p,
        ...usuario,
      };
    });
    return res.status(200).json(p);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.insertarHorarios = async (req, res, next) => {
  const days = {
    domingo: 0,
    lunes: 0,
    martes: 0,
    miercoles: 0,
    jueves: 0,
    viernes: 0,
    sabado: 0,
  };
  console.log(req.body);
  let { id_terapeuta, horario: grafo } = req.body;
  try {
    if (grafo.length <= 0 || grafo.length > 7)
      throw "Horario no cumple con las validaciones: Cantidad imposible de días";
    grafo.forEach((g) => {
      if (days[g.dia] >= 1) {
        throw "Horario no cumple con las validaciones: Día repetido";
      }
      days[g.dia]++;
    });
    let { horario } = await Terapeuta.query().upsertGraphAndFetch({
      id: id_terapeuta,
      horario: grafo,
    });
    return res.status(201).json({ horario });
  } catch (error) {
    console.log(error);
    if (typeof error === "string") return res.status(500).json(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
