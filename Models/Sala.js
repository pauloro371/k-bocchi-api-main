const { Model } = require("objection");

class Sala extends Model {
  static get tableName() {
    return "salas";
  }
  $beforeInsert() {
    this.fecha_ultima_desconexion = this.fecha_inicio;
  }
  $beforeUpdate() {
    delete this.codigo_acceso;
    if (this.fecha_inicio) this.fecha_ultima_desconexion = this.fecha_inicio;
  }
  static get relationMappings() {
    const Terapeuta = require("./Terapeuta");
    const Paciente = require("./Paciente");
    return {
      terapeuta: {
        modelClass: Terapeuta,
        relation: Model.HasOneRelation,
        join: { from: "salas.id_terapeuta", to: "terapeutas.id" },
      },
      paciente: {
        modelClass: Paciente,
        relation: Model.HasOneRelation,
        join: { from: "salas.id_paciente", to: "pacientes.id" },
      },
    };
  }
}

module.exports = Sala;
