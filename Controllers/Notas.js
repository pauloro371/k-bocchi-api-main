const { raw } = require("objection");
const Nota = require("../Models/Nota");
const Paciente = require("../Models/Paciente");
const Terapeuta = require("../Models/Terapeuta");
const { obtenerFechaComponent } = require("../utils/fechas");
const { generarNotificacion } = require("../utils/notificaciones");

exports.verNotas = async (req, res, next) => {
  try {
    let notas = await Nota.query();
    return res.status(200).json(notas);
  } catch (err) {
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.crearNota = async (req, res, next) => {
  let { nota: notaContent, id_terapeuta } = req.body;
  try {
    let { id_cita } = notaContent;
    let nota = await Nota.query()
      .where("id_cita", "=", id_cita)
      .limit(1)
      .first();
    if (nota) {
      return res
        .status(403)
        .json(
          "No puedes crear una nota, pues la cita asociada ya cuenta con una nota creada"
        );
    }
    let paciente = await Terapeuta.query()
      .withGraphJoined("pacientes.[citas]")
      .where("pacientes:citas.id", "=", id_cita)
      .andWhere("pacientes:citas.id_terapeuta", "=", id_terapeuta)
      .limit(1)
      .first()
      .debug();
    console.log({ paciente });
    if (!paciente) {
      return res
        .status(401)
        .json("Este paciente no tiene relación alguna con el terapeuta");
    }

    let notaCreada = await Nota.query().insertAndFetch(notaContent);
    notaCreada = await fetchNota(notaCreada);
    return res.status(201).json(notaCreada);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.validarAutoridad = async (req, res, next) => {
  let { id_terapeuta, id } = req.body;
  try {
    let nota = await Nota.query().findById(id);

    if (!nota)
      return res.status(404).json("No se encontro la nota que deseas eliminar");
    let cita = await nota.$relatedQuery("cita_nota");

    if (cita.id_terapeuta !== Number(id_terapeuta))
      return res.status(403).json("No tienes acceso para manipular esta nota");
    res.nota = nota;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.eliminarNota = async (req, res, next) => {
  let { nota } = res;
  try {
    if (!nota) {
      throw new Error("Falta property 'nota' en 'res'");
    }
    let resultado = await nota.$query().delete();
    return res.status(200).json(resultado);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.compartirNotas = async (req, res, next) => {
  let grafo = req.body;

  try {
    let {
      id: id_paciente,
      terapeutas: [{ id: id_terapeuta, notas_compartidas }],
    } = grafo;
    let terapeutas_notificar = {};
    let notificaciones = [];
    let paciente = await Paciente.query()
      .findById(id_paciente)
      .withGraphJoined("[terapeutas,usuario]")
      .where("terapeutas.id", "=", id_terapeuta);
    if (!paciente) {
      return res
        .status(403)
        .json("Este paciente no tiene relación con dicho terapeuta");
    }
    let terapeutas_notas = await Nota.query()
      .withGraphJoined("cita_nota.[terapeuta_datos]")
      .whereIn(
        "notas.id",
        notas_compartidas.map(({ id }) => id)
      );
    terapeutas_notas.forEach(({ cita_nota: { terapeuta_datos } }) => {
      if (terapeutas_notificar[terapeuta_datos.id_usuario]) {
        terapeutas_notificar[terapeuta_datos.id_usuario] += 1;
      } else {
        terapeutas_notificar[terapeuta_datos.id_usuario] = 1;
      }
    });
    for (const id_usuario in terapeutas_notificar) {
      if (Object.hasOwnProperty.call(terapeutas_notificar, id_usuario)) {
        const element = terapeutas_notificar[id_usuario];
        notificaciones.push({
          id_usuario,
          descripcion: `${paciente.usuario.nombre} ha compartido ${element} notas tuyas`,
          contexto_web: "/app/terapeuta/bitacora",
          titulo: "Notas compartidas",
        });
      }
    }

    let resultado = await Paciente.query().upsertGraphAndFetch(grafo, {
      noDelete: ["terapeutas", "terapeutas.notas_compartidas"],
      unrelate: ["terapeutas.notas_compartidas"],
      noUnrelate: ["terapeutas"],
      relate: ["terapeutas.notas_compartidas"],
    });
    for (const notificacion of notificaciones) {
      try {
        await generarNotificacion({...notificacion});
      } catch (error) {
        console.log(error);
      }
    }
    return res.status(200).json(resultado);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

async function fetchNota(nota) {
  try {
    return await nota
      .$query()
      .withGraphJoined("[cita_nota as cita.[terapeuta_datos.usuario]]")
      .modifyGraph("cita", (builder) => {
        builder.select("id", "id_terapeuta", "fecha", "id_paciente");
      })
      .modifyGraph("cita.terapeuta_datos", (builder) => {
        builder.select("id", "id_usuario");
      })
      .modifyGraph("cita.terapeuta_datos.usuario", (builder) => {
        builder.select("id", "rol", "nombre", "foto_perfil");
      });
  } catch (err) {
    console.log(err);
    throw err;
  }
}

exports.modificarNota = async (req, res, next) => {
  let { nota: partialNota } = req.body;
  let { nota } = res;
  try {
    if (!nota) {
      throw new Error("Falta property 'nota' en 'res'");
    }
    if (partialNota.id_cita !== nota.id_cita)
      return res.status(400).json("No se puede modificar la cita de una nota");
    await nota.$query().patchAndFetch(partialNota);
    let modificado = await fetchNota(nota);
    return res.status(200).json(modificado);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verNotasPaciente = async (req, res, next) => {
  let { id_paciente } = req.params;
  try {
    let notas = await Nota.query()
      .withGraphJoined("[cita_nota as cita.[terapeuta_datos.usuario]]")
      // .where((builder) => {
      //   builder
      //     .where("cita.id_terapeuta", "=", id_terapeuta)
      //     .orWhereIn(
      //       "notas.id",
      //       Nota.query()
      //         .joinRelated("terapeuta_compartida as terapeuta")
      //         .where("terapeuta.id", "=", id_terapeuta)
      //         .select("notas.id")
      //     );
      // })
      .andWhere("cita.id_paciente", "=", id_paciente)
      .modifyGraph("cita", (builder) => {
        builder.select("id", "id_terapeuta", "fecha", "id_paciente");
      })
      .modifyGraph("cita.terapeuta_datos", (builder) => {
        builder.select("id", "id_usuario");
      })
      .modifyGraph("cita.terapeuta_datos.usuario", (builder) => {
        builder.select("id", "rol", "nombre", "foto_perfil");
      })
      .orderBy("fecha_edicion", "DESC");
    notas = agruparPorFechas(notas);
    return res.status(200).json(notas);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verNotasPacienteCompartidas = async (req, res, next) => {
  let { id_paciente, id_terapeuta } = req.params;
  try {
    let notas = await Nota.query()
      .select("notas.*")
      .select(
        raw(`FN_TERAPEUTA_NOTA_COMPARTIDA(notas.id, ${id_terapeuta})`).as(
          "isCompartida"
        )
      )
      .withGraphJoined("[cita_nota as cita.[terapeuta_datos.usuario]]")
      // .where((builder) => {
      //   builder
      //     .where("cita.id_terapeuta", "=", id_terapeuta)
      //     .orWhereIn(
      //       "notas.id",
      //       Nota.query()
      //         .joinRelated("terapeuta_compartida as terapeuta")
      //         .where("terapeuta.id", "=", id_terapeuta)
      //         .select("notas.id")
      //     );
      // })
      .andWhere("cita.id_paciente", "=", id_paciente)
      .modifyGraph("cita", (builder) => {
        builder.select("id", "id_terapeuta", "fecha", "id_paciente");
      })
      .modifyGraph("cita.terapeuta_datos", (builder) => {
        builder.select("id", "id_usuario");
      })
      .modifyGraph("cita.terapeuta_datos.usuario", (builder) => {
        builder.select("id", "rol", "nombre", "foto_perfil");
      })
      .orderBy("fecha_edicion", "DESC")
      .debug();
    notas = agruparPorFechas(notas);
    return res.status(200).json(notas);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verNotasTerapeuta = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  let { id_paciente } = req.query;
  try {
    let notas = await Nota.query()
      .withGraphJoined("[cita_nota as cita.[terapeuta_datos.usuario]]")
      .where((builder) => {
        builder
          .where("cita.id_terapeuta", "=", id_terapeuta)
          .orWhereIn(
            "notas.id",
            Nota.query()
              .joinRelated("terapeuta_compartida as terapeuta")
              .where("terapeuta.id", "=", id_terapeuta)
              .select("notas.id")
          );
      })
      .modify((builder) => {
        if (id_paciente) {
          console.log({ id_paciente });
          builder.andWhere("cita.id_paciente", "=", id_paciente);
        }
      })
      .modifyGraph("cita", (builder) => {
        builder.select("id", "id_terapeuta", "fecha", "id_paciente");
      })
      .modifyGraph("cita.terapeuta_datos", (builder) => {
        builder.select("id", "id_usuario");
      })
      .modifyGraph("cita.terapeuta_datos.usuario", (builder) => {
        builder.select("id", "rol", "nombre", "foto_perfil");
      })
      .orderBy("fecha_edicion", "DESC");
    notas = agruparPorFechas(notas);
    return res.status(200).json(notas);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

function agruparPorFechas(notas) {
  let fechas = {};
  notas.forEach((nota) => {
    let fecha = obtenerFechaComponent(nota.fecha_edicion);
    if (!fechas[fecha]) {
      fechas[fecha] = [];
    }
    fechas[fecha].push(nota);
  });
  fechas = Object.keys(fechas).map((f) => ({ header: f, notas: fechas[f] }));
  return fechas;
}
