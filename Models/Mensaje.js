const { Model } = require("objection");
const { obtenerFechaActualMexico } = require("../utils/fechas");
class Mensaje extends Model {
  static get tableName() {
    return "mensajes";
  }
  $beforeInsert() {
    this.fecha = obtenerFechaActualMexico().toISOString();
  }
  static get relationMappings() {
    const Usuario = require("./Usuario");
    return {
      usuario_from: {
        relation: Model.BelongsToOneRelation,
        modelClass: Usuario,
        join: {
          from: "mensajes.id_from",
          to: "usuarios.id",
        },
      },
      usuario_to: {
        relation: Model.BelongsToOneRelation,
        modelClass: Usuario,
        join: {
          from: "mensajes.id_to",
          to: "usuarios.id",
        },
      },
    };
  }
}

module.exports = Mensaje;
