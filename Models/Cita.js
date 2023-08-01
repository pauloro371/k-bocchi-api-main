const { Model } = require("objection");
class Cita extends Model {
  static get tableName() {
    return "citas";
  }
  $parseDatabaseJson(json) {
    // Remember to call the super class's implementation.

    json = super.$parseDatabaseJson(json);

    // Do your conversion here.
    // console.log(x,x1);
    return json;
  }
  static relationMappings() {
    const Paciente = require("./Paciente");
    const Nota = require("./Nota");
    const Terapeuta = require("./Terapeuta");
    // const Usuario = require("./Usuario");
    // const Resena = require("./Resenas");
    // const Comentario = require("./Comentario");
    return {
      terapeuta_datos: {
        relation: Model.BelongsToOneRelation,
        modelClass: Terapeuta,
        join: {
          from: "citas.id_terapeuta",
          to: "terapeutas.id",
        },
      },
      paciente_datos: {
        relation: Model.BelongsToOneRelation,
        modelClass: Paciente,
        join: {
          from: "citas.id_paciente",
          to: "pacientes.id",
        },
      },
      nota: {
        relation: Model.HasOneRelation,
        modelClass: Nota,
        join:{
          from: "citas.id",
          to: "notas.id_cita"
        }
      },
    };
  }
}
module.exports = Cita;
