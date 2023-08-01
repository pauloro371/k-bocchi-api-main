const { Model } = require("objection");
const DetalleTicket = require("./DetalleTicket");
const { obtenerFechaActualMexico } = require("../utils/fechas");
const Paciente = require("./Paciente");
const Carrito = require("./Carrito");

class Producto extends Model {
  static get tableName() {
    return "productos";
  }
  $beforeInsert() {
    this.fecha_publicacion = obtenerFechaActualMexico().toISOString();
    this.stock_carrito = this.stock;
    this.cantidad_vendida = 0;
  }
  $beforeUpdate() {
    // delete this.cantidad_vendida;
    delete this.fecha_publicacion;
  }
  static relationMappings() {
    const Ticket = require("./Ticket");
    const Terapeuta = require("./Terapeuta");
    return {
      terapeuta: {
        relation: Model.BelongsToOneRelation,
        modelClass: Terapeuta,
        join: {
          from: "productos.id_terapeuta",
          to: "terapeutas.id",
        },
      },
      ticket_producto: {
        relation: Model.ManyToManyRelation,
        modelClass: Ticket,
        join: {
          from: "productos.id",
          through: {
            modelClass: DetalleTicket,
            from: "detalle_ticket.id_producto",
            to: "detalle_ticket.id_ticket",
          },
          to: "tickets.id",
        },
      },
      carritos: {
        relation: Model.ManyToManyRelation,
        modelClass: Paciente,
        join: {
          from: "productos.id",
          through: {
            modelClass: Carrito,
            from: "carrito.id_producto",
            to: "carrito.id_paciente",
          },
          to: "pacientes.id",
        },
      },
    };
  }
}

module.exports = Producto;
