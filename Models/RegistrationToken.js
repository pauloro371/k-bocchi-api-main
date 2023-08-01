const { Model } = require("objection");
class RegistrationToken extends Model {
  static get tableName() {
    return "fcm_registration_tokens";
  }
  static idColumn() {
    return "token";
  }

  static relationMappings() {
    const Usuario = require("./Usuario");
    return {
      usuario: {
        relation: Model.BelongsToOneRelation,
        modelClass: Usuario,
        join: {
          from: "fcm_registration_tokens.id_usuario",
          to: "usuarios.id",
        },
      },
    };
  }
}

module.exports = RegistrationToken;