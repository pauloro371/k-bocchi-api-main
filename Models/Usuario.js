/**
 * Para poder conectar y manipular la base de datos se uso un ORM (object relation mapping)
 * Este orm se llama "objection"
 * Los orm necesitan definir clases que asemejen a las tablas de la base de datos para poder
 * interactuar con las tablas. A estas clases se les llama "modelos" y definen varias cosas:
 *  - El nombre de la tabla a la que pertenece el modelo
 *  - El nombre de la columna con la pk (objection por defecto asume que la columna con la pk es id)
 *  - Las relaciones del modelo con otros modelos (Para poder hacer joins)
 *  - Las columnas que tiene la tabla (En objection no es necesario hacer este paso)
 */
const { Model } = require("objection");
const Mensaje = require("./Mensaje");

/**
 * Primeramente creamos la clase mediante la palabra reservada class y mediante extends
 * heredamos de Model. Model es una clase que ya nos da objection que permite definir
 * que esta clase (Usuario en este caso) va a ser un modelo
 * */
class Usuario extends Model {
  //Primero mediante tableName establecemos que este modelo va a ser de la tabla usuarios
  static get tableName() {
    return "usuarios";
  }

  //Ahora definimos las relaciones de este modelo con otros modelos
  static relationMappings() {
    const Terapeuta = require("./Terapeuta");
    const Paciente = require("./Paciente");
    return {
      //Primero definimos una relacion llamada paciente (el nombre es indistinto, no importa cual elijas)
      //Para todas las relaciones es exactamente lo mismo
      paciente: {
        /**
         * Mediante la propiedad relation asignamos que tipo de relacion tiene el modelo Usuario
         * con el modelo Paciente. En este caso es una relacion 1:1
         */
        relation: Model.HasOneRelation,
        /**
         * Medainte modelClass definimos que modelo estamos usando para esta relacion
         */
        modelClass: Paciente,
        /**
         * Mediante el objeto join definimos que columnas se encargan de vincular las tablas
         * Es decir, aquí definimos la PK y la FK
         */
        join: {
          from: "usuarios.id",
          to: "pacientes.id_usuario",
        },
      },
      terapeuta: {
        relation: Model.HasOneRelation,
        modelClass: Terapeuta,
        join: {
          from: "usuarios.id",
          to: "terapeutas.id_usuario",
        },
      },
      mensajes_enviados: {
        relation: Model.HasManyRelation,
        modelClass: Mensaje,
        join: {
          from: "usuarios.id",
          to: "mensajes.id_from",
        },
      },
      mensajes_recibidos: {
        relation: Model.HasManyRelation,
        modelClass: Mensaje,
        join: {
          from: "usuarios.id",
          to: "mensajes.id_to",
        },
      },
      /**
       * Si tenemos una relacion de M:N (muchos a muchos)
       */
      chats: {
        //Especificamos que tipo de relacion hay
        relation: Model.ManyToManyRelation,
        //El modelo el cual se quiere relacionar
        modelClass: Usuario,
        //Y mediante el join establecemos cuales columnas se encargan de hacer la relación
        join: {
          from: "usuarios.id",
          /**
           * La única diferencia es la propiedad "through" que se encarga de definir cual es
           * la tabla de unión que permite hacer una relación de muchos a muchos entre los modelos
           * */
          through: {
            //En este caso el modelo que se encarga de hacer dicha relación es Mensajes
            modelClass: Mensaje,
            //Y definimos cuales dos columnas son las que relacionan
            from: "mensajes.id_from",
            to: "mensajes.id_to",
          },
          to: "usuarios.id",
        },
      },
    };
  }
  static crearUsuarioBaseDatos = async (usuario) => {
    let newUsuario = await Usuario.query().insertGraphAndFetch(usuario);
    return newUsuario;
  };
  static crearUsuarioFirebase = async (usuario) => {
    let newUsuario = await Usuario.query().insertGraphAndFetch(usuario);

    return newUsuario;
  };
}

module.exports = Usuario;
