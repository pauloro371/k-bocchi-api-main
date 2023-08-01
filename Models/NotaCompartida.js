const { Model } = require("objection");
class NotaCompartida extends Model {
  static get tableName() {
    return "nota_compartida";
  }
  static get idColumn() {
    return ["id_nota", "id_terapeuta"];
  }
  static get relationMappings() {
    const Nota = require("./Nota");
    const Terapeuta = require("./Terapeuta");
    return {
      nota: {
        relation: Model.BelongsToOneRelation,
        modelClass: Nota,
        join: {
          from: "nota_compartida.id_nota",
          to: "notas.id",
        },
      },
      terapeuta: {
        relation: Model.BelongsToOneRelation,
        modelClass: Terapeuta,
        join: {
          from: "nota_compartida.id_terapeuta",
          to: "terapeutas.id",
        },
      },
    };
  }
}

module.exports = NotaCompartida;
