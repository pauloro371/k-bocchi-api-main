const { Model } = require("objection");
const Usuario = require("./Usuario");
const { obtenerFechaActualMexico } = require("../utils/fechas");

class Notificacion extends Model {
  static get tableName() {
    return "notificaciones";
  }
  $beforeInsert() {
    this.fecha = obtenerFechaActualMexico().toISOString();
  }
  static get relationMappings() {
    return {
      usuario: {
        relation: Model.BelongsToOneRelation,
        modelClass: Usuario,
        join: {
          from: "notificaciones.id_usuario",
          to: "usuarios.id",
        },
      },
    };
  }
}

module.exports = Notificacion;
