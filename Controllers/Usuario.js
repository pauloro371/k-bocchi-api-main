const { body } = require("express-validator");
const Usuario = require("../Models/Usuario");

exports.validarUsuario = () => {
  return [
    body("email", "El correo es obligatorio").exists(),
    body("email", "Correo en formato incorrecto").isEmail(),
    body("email", "Este correo ya esta registrado").custom(async (email) => {
      let usuario = await Usuario.query().findOne("correo", "=", email);
      if (usuario) return false;
    }),
    body(
      "contrasena",
      "La contraseña debe de tener por lo menos 8 caracteres"
    ).isLength({ min: 8 }),
    body(
      "contrasena",
      "La contraseña debe de tener por lo menos una mayúscula"
    ).custom(async (email) => {
      return /[A-Z]/.test(email);
    }),
  ];
};

exports.getUsuarios = async () =>
  Usuario.query().withGraphFetched(["paciente,terapeuta"]);

exports.getUsuario = async (uid) =>
  Usuario.query().findById(uid).withGraphFetched(["paciente,terapeuta"]);

exports.postUsuario = async (usuario) => Usuario.query().insertGraphAndFetch(usuario);

exports.putUsuario = async (usuario) => Usuario.query().upsertGraphAndFetch(usuario)
