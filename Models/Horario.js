const { Model } = require("objection");
class Horario extends Model {
  static get tableName() {
    return "horarios";
  }

  static relationMappings() {
    const Terapeuta = require("./Terapeuta");

    return {
      terapeuta_horario: {
        relation: Model.BelongsToOneRelation,
        modelClass: Terapeuta,
        join: {
          from: "horarios.id_terapeuta",
          to: "terapeutas.id",
        },
      },
    };
  }
}
module.exports = Horario;
