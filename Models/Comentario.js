const { Model } = require("objection");
const { obtenerFechaActualMexico } = require("../utils/fechas");
class Comentario extends Model {
  static get tableName() {
    return "comentarios";
  }

  $beforeInsert() {
    this.fecha_creacion = obtenerFechaActualMexico().toISOString();
    this.fecha_edicion = null;
  }

  $beforeUpdate() {
    this.fecha_edicion = obtenerFechaActualMexico().toISOString();
    delete this.fecha_creacion;
    delete this.id_terapeuta;
    delete this.id;
    delete this.id_paciente;
  }
  static relationMappings() {
    const Paciente = require("./Paciente");
    const Terapeuta = require("./Terapeuta");
    return {
      comentario_paciente: {
        relation: Model.HasOneRelation,
        modelClass: Paciente,
        join: {
          to: "pacientes.id",
          from: "comentarios.id_paciente",
        },
      },
      comentario_terapeuta: {
        relation: Model.HasOneRelation,
        modelClass: Terapeuta,
        join: {
          to: "terapeutas.id",
          from: "comentarios.id_terapeuta",
        },
      },
    };
  }
}
module.exports = Comentario;
