const { Model } = require("objection");

class DetalleTicket extends Model {
  static get tableName() {
    return "detalle_ticket";
  }

  static relationMappings() {
    const Paquete = require("./Paquete");
    const Terapeuta = require("./Terapeuta");
    const Ticket = require("./Ticket");
    return {
      ticket: {
        relation: Model.BelongsToOneRelation,
        modelClass: Ticket,
        join: {
          from: "detalle_ticket.id_ticket",
          to: "tickets.id",
        },
      },
      terapeuta: {
        relation: Model.BelongsToOneRelation,
        modelClass: Terapeuta,
        join: {
          from: "detalle_ticket.id_terapeuta",
          to: "terapeutas.id",
        },
      },
      paquete: {
        relation: Model.BelongsToOneRelation,
        modelClass: Paquete,
        join: {
          from: "detalle_ticket.id_paquete",
          to: "paquetes.id",
        },
      },
    };
  }
}

module.exports = DetalleTicket;
