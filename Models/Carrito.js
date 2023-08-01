const { Model } = require("objection");

class Carrito extends Model {
  static get tableName() {
    return "carrito";
  }
  static get idColumn(){
    return ["id_paciente","id_producto"]
  }
  static relationMappings() {
    const Producto = require("./Productos");
    const Paciente = require("./Paciente");
    return {
      producto: {
        relation: Model.BelongsToOneRelation,
        modelClass: Producto,
        join: {
          from: "carrito.id_producto",
          to: "productos.id",
        },
      },
      paciente: {
        relation: Model.BelongsToOneRelation,
        modelClass: Paciente,
        join: {
          from: "carrito.id_paciente",
          to: "pacientes.id",
        },
      },
    };
  }
}

module.exports = Carrito;
