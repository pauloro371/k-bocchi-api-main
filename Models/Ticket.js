const { Model } = require("objection");
const DetalleTicket = require("./DetalleTicket");

class Ticket extends Model {
  static get tableName() {
    return "tickets";
  }

  static relationMappings() {
    const Paciente = require("./Paciente");
    return {
      paciente: {
        relation: Model.BelongsToOneRelation,
        modelClass: Paciente,
        join: {
          from: "tickets.id_paciente",
          to: "pacientes.id",
        },
      },
      detalles: {
        relation: Model.HasManyRelation,
        modelClass: DetalleTicket,
        join: {
          from: "tickets.id",
          to: "detalle_ticket.id_ticket",
        },
      },
    };
  }
}

module.exports = Ticket;
