const EasyPost = require("@easypost/api");
const Paquete = require("../Models/Paquete");
const { ESTADO_ENTREGADO } = require("../utils/estadoPaquete");

exports.verPaquetesPaciente = async (req, res, next) => {
  let { id_paciente } = req.params;
  try {
    let paquetes = await Paquete.query()
      .withGraphJoined("[ticket,terapeuta.usuario]")
      .modifyGraph("ticket", (builder) => {
        builder.select(["id", "id_paciente"]);
      })
      .modifyGraph("terapeuta", (builder) => {
        builder.select(["id", "id_usuario"]);
      })
      .modifyGraph("terapeuta.usuario", (builder) => {
        builder.select(["id", "nombre"]);
      })
      .where("ticket.id_paciente", "=", id_paciente)
      .orderBy("paquetes.fecha_creacion", "DESC");
    let { conteo: entregados, resto: sinEntregar } = contarPaquetesStatus(
      paquetes,
      ESTADO_ENTREGADO
    );
    let total = paquetes.length;
    return res.status(200).json({ paquetes, entregados, sinEntregar, total });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

exports.verPaquete = async (req, res, next) => {
  let { id_paquete } = req.params;
  const client = new EasyPost(process.env.EASYPOST_API_KEY);
  try {
    let paquete = await Paquete.query()
      .withGraphJoined("[ticket.paciente.usuario,terapeuta.usuario]")
      .modifyGraph("ticket", (builder) => {
        builder.select("id");
      })
      .modifyGraph("terapeuta", (builder) => {
        builder.select("id","id_usuario");
      })
      .modifyGraph("terapeuta.usuario", (builder) => {
        builder.select("id","nombre");
      })
      .modifyGraph("ticket.paciente", (builder) => {
        builder.select("id","id_usuario");
      })
      .modifyGraph("ticket.paciente.usuario", (builder) => {
        builder.select("id","nombre");
      })
      .findById(id_paquete);
    if (!paquete) return res.status(404).json("No se enontro el paquete");
    let { codigo_rastreo } = paquete;
    let { public_url } = await client.Tracker.retrieve(codigo_rastreo);

    return res.status(200).json({ paquete, public_url });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verPaquetesTerapeuta = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let paquetes = await Paquete.query()
      .withGraphJoined("ticket.paciente.usuario")
      .joinRelated("contenido")
      .modifyGraph("ticket", (builder) => {
        builder.select(["id", "id_paciente"]);
      })
      .modifyGraph("ticket.paciente", (builder) => {
        builder.select(["id", "id_usuario"]);
      })
      .modifyGraph("ticket.paciente.usuario", (builder) => {
        builder.select(["id", "nombre"]);
      })
      .where("contenido.id_terapeuta", "=", id_terapeuta)
      .orderBy("paquetes.fecha_creacion", "DESC");
    let { conteo: entregados, resto: sinEntregar } = contarPaquetesStatus(
      paquetes,
      ESTADO_ENTREGADO
    );
    let total = paquetes.length;
    return res.status(200).json({ paquetes, entregados, sinEntregar, total });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};

function contarPaquetesStatus(paquetes, estado) {
  let conteo = 0;
  let resto = 0;
  paquetes.forEach(({ estatus }) => {
    if (estatus === estado) conteo++;
    else resto++;
  });
  return { conteo, resto };
}
