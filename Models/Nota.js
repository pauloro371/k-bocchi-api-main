const { Model } = require("objection");
const Terapeuta = require("./Terapeuta");
const NotaCompartida = require("./NotaCompartida");
const { obtenerFechaActualMexico } = require("../utils/fechas");
class Nota extends Model {
  static get tableName() {
    return "notas";
  }
  $beforeInsert() {
    this.fecha_creacion = obtenerFechaActualMexico().toISOString();
    this.fecha_edicion = obtenerFechaActualMexico().toISOString();
  }

  $beforeUpdate() {
    this.fecha_edicion = obtenerFechaActualMexico().toISOString();
  }
  static get relationMappings() {
    const Cita = require("./Cita");
    return {
      cita_nota: {
        relation: Model.BelongsToOneRelation,
        modelClass: Cita,
        join: {
          from: "notas.id_cita",
          to: "citas.id",
        },
      },
      terapeuta_compartida:{
        relation: Model.ManyToManyRelation,
        modelClass: Terapeuta,
        join:{
            from: "notas.id",
            through:{
                modelClass: NotaCompartida,
                from:"nota_compartida.id_nota",
                to:"nota_compartida.id_terapeuta"
            },
            to: "terapeutas.id"
        }
      }
    };
  }
}

module.exports = Nota;
