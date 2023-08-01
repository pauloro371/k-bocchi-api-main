const { Model } = require("objection");
const DetalleTicket = require("./DetalleTicket");
const { obtenerFechaActualMexico } = require("../utils/fechas");
const Ticket = require("./Ticket");
const Terapeuta = require("./Terapeuta");

class Paquete extends Model {
  static get tableName() {
    return "paquetes";
  }
  $beforeInsert() {
    this.fecha_creacion = obtenerFechaActualMexico().toISOString();
  }
  static relationMappings() {
    return {
      contenido: {
        relation: Model.HasManyRelation,
        modelClass: DetalleTicket,
        join: {
          from: "paquetes.id",
          to: "detalle_ticket.id_paquete",
        },
      },
      ticket: {
        relation: Model.HasOneThroughRelation,
        modelClass: Ticket,
        join: {
          from: "paquetes.id",
          through: {
            modelClass: DetalleTicket,
            to: "detalle_ticket.id_ticket",
            from: "detalle_ticket.id_paquete",
          },
          to: "tickets.id",
        },
      },
      terapeuta: {
        relation: Model.HasOneThroughRelation,
        modelClass: Terapeuta,
        join: {
          from: "paquetes.id",
          through: {
            modelClass: DetalleTicket,
            to: "detalle_ticket.id_terapeuta",
            from: "detalle_ticket.id_paquete",
          },
          to: "terapeutas.id",
        },
      },
    };
  }
}

module.exports = Paquete;
