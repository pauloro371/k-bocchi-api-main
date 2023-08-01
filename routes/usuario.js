const express = require("express");
var Usuario = require("../Models/Usuario");
const { v4: uuidv4, v4 } = require("uuid");
const { encriptar, desencriptar } = require("../utils/encryption");
var router = express.Router();
var terapeutas = require("./terapeuta");
var pacientes = require("./paciente");
const date = require("date-and-time");
const {
  enviarEmailPrueba,
  renderEmailMiddleware,
  enviarEmail,
} = require("../modules/email/emailModule");

/**
 * @swagger
 * components:
 *  schemas:
 *    Usuario:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: Es un identificador unico generado ya sea por firebase (uid) o por nosotros
 *        correo:
 *          type: string
 *          description: Es el correo del usuario en cuestion
 *        contrasena:
 *          type: string
 *          description: Es la contraseña del usuario, en la base de datos esta encriptada, sin embargo las peticiones tienen que ser con la contraseña sin encriptar
 *        rol:
 *          type: string
 *          description: El rol del usuario, tiene que ser "fisioterapeuta" o "paciente"
 *        terapeuta:
 *          type: object
 *          $ref: '#/components/schemas/Fisioterapeuta'
 *        foto_perfil:
 *          type: string
 *          description: La ubicación de la foto de perfil
 *      example:
 *          id: 1bcac0e9-5682-4fe2-a92f-55b0c552551f
 *          correo: bidenBlast@gmail.com
 *          contrasena: contrasenaS
 *          rol: paciente
 *          foto_perfil: 1bcac0e9-5682-4fe2-a92f-55b0c552551f.jpg
 *
 */

/**
 * @swagger
 * /usuarios/datos/{uid}:
 *  get:
 *    summary: Permite obtener un usuario mediante su id
 *    tags: [Usuario]
 *    responses:
 *      "200":
 *        description: Devuelve el usuario con la id asociada
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *      "404":
 *         description: Devuelve un mensaje para indicar que el usuario no existe
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *    parameters:
 *      - name: uid
 *        in: path
 *        required: true
 */
router.get("/datos/:uid", async (req, res, next) => {
  // console.log(req.body);
  console.log(process.env.TZ);
  let x = date.parse("11:14:05", "hh:mm:ss"); // => Jan 1 1970 23:14:05 GMT-0800
  let x1 = date.parse("11:14:05", "hh:mm:ss", true); // => Jan 1 1970 23:14:05 GMT+0000 (Jan 1 1970 15:14:05 GMT-0800)
  console.log(x, x1);
  let usuario = await Usuario.query()
    .withGraphJoined("[paciente,terapeuta]")
    .findById(req.params.uid);
  if (!usuario) {
    return res
      .status(404)
      .json("Usuario no encontrado en nuestra base de datos");
  }
  return res.json(usuario);
});

/**
 * @swagger
 * /usuarios/datos/log:
 *  post:
 *    summary: Permite validar las credenciales de un usuario
 *    description: Es necesario pasar el valor 'contrasena', aunque el usuario se haya identificado con google. Se puede poner vacio ("")
 *    tags: [Usuario]
 *    responses:
 *      "200":
 *        description: Devuelve los datos completos del usuario con el correo y contraseña asociados
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *      "404":
 *        description: Devuelve un mensaje indicando que el usuario no se encontro en la base de datos. (No esta registrado el email)
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "451":
 *        description: Devuelve un mensaje para indicar que un usuario esta registrado con google (En la bd el usuario existe pero no esta registrada su contraseña)
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      "401":
 *        description: Devuelve un mensaje para indicar que la contraseña del usuario esta incorrecta
 *        content:
 *         application/json:
 *           schema:
 *             type: string
 *      "403":
 *        description: Devuelve un mensaje para indicar que la cuent esta bloqueada por un numero de intentos fallidos
 *        content:
 *         application/json:
 *           schema:
 *             type: string
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                contrasena:
 *                  type: string
 */
router.post("/datos/log", async (req, res, next) => {
  console.log(req.body);
  try {
    let usuario = await Usuario.query()
      .withGraphJoined("[paciente,terapeuta]")
      .findOne({ email: req.body.email });

    if (!usuario) {
      return res.status(404).json("El correo ingresado no esta registrado");
    }
    if (usuario.email && !usuario.contrasena) {
      return res.status(451).json("Usuario registrado con google");
    }
    if (usuario.cuenta_bloqueada == 1) {
      return res
        .status(403)
        .json("La cuenta ha sido bloqueada por demasiados intentos fallidos");
    }
    let contrasena = desencriptar(usuario.contrasena);
    if (usuario.email && contrasena != req.body.contrasena) {
      let intentos = usuario.intentos_fallidos + 1;
      if (intentos >= 10) {
        await usuario.$query().patch({
          intentos_fallidos: intentos,
          cuenta_bloqueada: 1,
        });
        return res
          .status(403)
          .json("La cuenta ha alcanzado 10 intentos incorrectos");
      }
      await usuario.$query().patch({ intentos_fallidos: intentos });
      return res.status(401).json("Contraseña incorrecta");
    }
    if (usuario.intentos_fallidos > 0)
      await usuario.$query().patch({ intentos_fallidos: 0 });
    return res.status(200).json(usuario);
  } catch (err) {
    console.log(err);
    res.status(500).json("Ha ocurrido un error, intenta más tarde");
  }
});

/**
 * @swagger
 * /usuarios/datos/email:
 *  post:
 *    summary: Permite saber si un correo ya esta registrado
 *    tags: [Usuario]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *    responses:
 *      400:
 *        description: Devuelve un mensaje para indicar que el correo ya esta registrado
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      200:
 *        description: Devuelve un mensaje de 'ok'
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 */
router.post("/datos/email", async (req, res, next) => {
  console.log(req.body);
  //Mediante el modelo de Usuario, se realiza una query para revisar si el email solicitado ya existe
  let usuario = await Usuario.query().findOne({ email: req.body.email });
  //Si así es, se retorna un 400
  if (usuario)
    return res.status(400).json("Este correo ya se encuentra registrado");
  return res.status(200).json("ok");
});

/**
 * Como nota. Todos los comentarios que empiezan con @swagger, son los que se encargan de generar
 * la documentación que se puede ver en la api.
 * */
/**
 * @swagger
 * /usuarios/registrar:
 *  post:
 *    summary: Permite crear un usuario
 *    tags: [Usuario]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            $ref: '#/components/schemas/Usuario'
 */
router.post("/registrar", async (req, res, next) => {
  /**
   * Para realizar la api se utilizo un framework llamado "express"
   * Los dos conceptos más importantes que hay que entender son dos:
   *  - Middleware: Middleware es una función que se ejecuta en cadena
   *                donde si una sola de las funciones de la cadena falla
   *                se corta el flujo y se acaba el proceso
   *
   *  - Router: Es un objeto del framework "express" que permite vincular
   *            una ruta (en este caso "/usuarios/registrar") con una serie
   *            de funciones middleware.
   * Las rutas definidas en los router reciben peticiones http de los clientes, y ejecutan
   * las funciones middleware
   *
   * Ahora, las funciones middleware en express tienen 3 parametros:
   *  req: Es un objeto que representa la petición del cliente. Aquí se suele
   *       tener los datos que el usuario mando, como lo es el body de la petición,
   *       los parametros que mando etc.
   *  res: Es un objeto que representa lo que se le va a regresar como respuesta al usuario.
   *       Las funciones más importantes de res son:
   *          status: Permite definir un código de status que devuelve la petición. Estos códigos
   *                  son un estándar web. En pocas palabras permiten saber si una petición se resolvio
   *                  correctamente, si fallo por un problema en el servidor, o un problema en los datos
   *                  que envío el cliente etc. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
   *          json: Esta función permite serializar un objeto en json y devolverlo al cliente como respuesta
   *  next: Es una función que permite llamar a la siguiente función middleware en la cadena
   */
  try {
    //Primero revisamos si el body que mando el cliente contiene una id.
    /**
     * Si no lo contiene lo generemos mediante la función uuidv4. Esta función permite
     * generar codigos únicos
     */
    if (!req.body.id) req.body.id = uuidv4();
    /**
     * Estas cosas se revisan, porque:
     *  - En la base de datos del sistema, los usuarios registrados con google no guardan
     *    su contraseña, porque de eso se encarga los servicios de autenticación de google.
     *  - Al registrarse con google, google ya genera un id de autenticación por lo tanto,
     *    no hay necesidad de generar otro si ya esta generado.
     * El flujo que sigue es algo así:
     *    Usuario le da a continuar con google
     *                    |
     *                    v
     *    Google crea la cuenta en firebase auth
     *                    |
     *                    v
     *    El usuario sigue con el proceso de registro
     *      en la página, considerando que la página
     *    guarda su id de manera local para luego mandarla
     *                a esta ruta
     *
     * Para los usuarios que se registran sin google el flujo es el mismo, solo omitiendo la parte
     * de google y la id de google
     */

    /**
     * Ahora también revisamos si el body contiene una contraseña, si la tiene la encriptamos
     * antes de meterla en la base de datos
     */
    if (req.body.contrasena)
      req.body.contrasena = encriptar(req.body.contrasena);
    //Una vez encriptada, creamos el usuario en la base de datos
    await Usuario.crearUsuarioBaseDatos(req.body);
    //Y si todo sale bien, regresamos un status 200
    return res.status(200).json("ok");
  } catch (error) {
    return res
      .status(500)
      .send(`<p>Ha ocurrido un error:</p> \n <code>${error}</code>`);
  }
});

/**
 * @swagger
 * /usuarios/solicitarReestablecerContrasena:
 *  post:
 *    summary: Permite mandar un correo a un usuario para restablecer su contraseña
 *    tags: [Usuario]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *    responses:
 *      200:
 *        description: Devuelve un mensaje de ok indicando que se mando el correo
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Devuelve un mensaje de error indicando que no se pudo mandar el correo
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 */
router.post(
  "/solicitarReestablecerContrasena",
  async (req, res, next) => {
    //melkorgodo@gmail.com
    let usuario = await Usuario.query()
      .findOne({ email: req.body.email })
      .withGraphFetched("[paciente,terapeuta]");
    console.log(process.env.FRONT_END_HOST);
    if (!usuario)
      return res.status(400).json("Este correo no se encuentra registrado");
    res.emailContent = {
      usuario: usuario.nombre,
    };
    res.emailContent = {
      usuario: usuario.nombre,
    };

    let fechaExpiracion = Date.now() + 600000; //Sumale 600000 milisegs / 10 minutos
    let stringEncoded = encriptar(`${fechaExpiracion}/${usuario.id}`);
    console.log(req.headers.host);

    try {
      let contrasena = desencriptar(usuario.contrasena);
      res.emailContent = {
        ...res.emailContent,
        urlReestablecer: `${process.env.FRONT_END_HOST}/reestablecerContrasena/${stringEncoded}`,
        urlReactivar: `${req.protocol}://${req.headers.host}/usuarios/reactivarCuenta/${stringEncoded}`,
        urlBase: process.env.FRONT_END_HOST,
        contrasena: contrasena,
      };
    } catch (err) {
      return res.status(500).json("Algo ha salido mal, intenta más tarde");
    }
    try {
      await Usuario.query().findById(usuario.id).patch({ cambioContrasena: 1 });
    } catch (err) {
      console.log(err);
      return res.status(500).json("Algo ha salido mal, intenta más tarde");
    }
    res.emailTo = req.body.email;
    res.subject = "¡Hola! Reestablecer contraseña";
    res.htmlTemplate = "templates/email_reestablecer.ejs";
    return next();
  },
  renderEmailMiddleware,
  async (req, res, next) => {
    try {
      await Usuario;
      await enviarEmail(
        res.htmlRendered,
        res.emailTo,
        "¡Hola! Reestablecer contraseña"
      );
      return res.status(200).json("Se ha mandado el correo");
    } catch (err) {
      return res
        .status(500)
        .json("Ha ocurrido un error, no hemos podido mandar el correo");
    }
  }
);

/**
 * @swagger
 * /usuarios/reestablecerContrasena:
 *  post:
 *    summary: Permite reestablecer la contraseña de un usuario y reactivar su cuenta en dado caso
 *    tags: [Usuario]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              contrasena:
 *                type: string
 *              stringEncoded:
 *                type: string
 *    responses:
 *      200:
 *        description: Devuelve un mensaje indicando que la contraseña se ha cambiado correctamente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      400:
 *        description: Devuelve un mensaje de indicando que falta un campo
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      401:
 *        description: Devuelve un mensaje de el link para reestablecer contraseña caduco
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      409:
 *        description: Devuelve un mensaje indicando que la contraseña actual es la misma que la ingresada
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Devuelve un mensaje de error
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 */
router.post("/reestablecerContrasena", async (req, res, next) => {
  //melkorgodo@gmail.com
  let { contrasena, stringEncoded } = req.body;
  if (!contrasena) {
    return res.status(400).json("Falta la contraseña");
  }
  if (!stringEncoded) {
    return res.status(400).json("Falta el stringEncoded");
  }
  let fechaExpiracion;
  let idUsuario;
  try {
    let stringDecoded = desencriptar(stringEncoded);
    fechaExpiracion = stringDecoded.split("/")[0]; //fecha/usuarioID
    idUsuario = stringDecoded.split("/")[1];
  } catch (error) {
    return res.status(400).json("Dato encriptado no coincide con parametros");
  }
  try {
    console.log(fechaExpiracion, ">", Date.now());
    if (fechaExpiracion < Date.now()) {
      await Usuario.query().findById(idUsuario).patch({ cambioContrasena: 0 });
      return res.status(401).json("El link expiro");
    }
    let usuario = await Usuario.query().findById(idUsuario);
    if (usuario.cambioContrasena === 0) {
      return res.status(401).json("El link expiro");
    }
    let contrasenaEncriptada = encriptar(contrasena);
    if (usuario.contrasena == contrasenaEncriptada)
      return res
        .status(409)
        .json(
          "La contraseña ingresada tiene que ser diferente a la contraseña actual de la cuenta"
        );
    let result = await Usuario.query().patchAndFetchById(idUsuario, {
      contrasena: contrasenaEncriptada,
      cambioContrasena: 0,
      intentos_fallidos: 0,
      cuenta_bloqueada: 0,
    });
    console.log(result);
    return res.status(200).json("Se ha cambiado correctamente la contraseña");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
});

/**
 * @swagger
 * /usuarios/reactivarCuenta/{stringEncoded}:
 *  get:
 *    summary: Permite reactivar una cuenta tras su bloqueo por intentos fallidos
 *    tags: [Usuario]
 *    responses:
 *      302:
 *        description: Redirecciona al login de la PWA
 *      400:
 *        description: Devuelve un mensaje de indicando que falta un campo o el stringEncoded no esta codificado correctamente
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      401:
 *        description: Devuelve un mensaje de el link para reestablecer contraseña caduco
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Devuelve un mensaje de error
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 *    parameters:
 *      - name: stringEncoded
 *        description: stringEncoded es una string codificada en aes 256. La string previo al codificado tiene este formato "fechaExpiracion/usuarioID" Sin las comillas y fechaExpiracion viene dado por la funcion Date.now() de javascript. Se puede encriptar la string en la ruta de "encriptar" en "Utilidades"
 *        in: path
 *        required: true
 *
 */
router.get("/reactivarCuenta/:stringEncoded", async (req, res, next) => {
  //melkorgodo@gmail.com
  let { stringEncoded } = req.params;
  console.log(req.params);
  try {
    if (!stringEncoded) {
      return res.status(400).json("El link utilizado no es valido");
    }
    let fechaExpiracion;
    let idUsuario;
    try {
      let stringDecoded = desencriptar(stringEncoded);
      fechaExpiracion = stringDecoded.split("/")[0]; //fecha/usuarioID
      idUsuario = stringDecoded.split("/")[1];
    } catch (err) {
      return res
        .status(400)
        .json("El link utilizado tiene un formato incorrecto");
    }
    let usuario = await Usuario.query().findById(idUsuario);
    console.log(usuario);
    if (fechaExpiracion < Date.now() || usuario.cuenta_bloqueada == 0) {
      return res.status(401).json("El link que se esta usando ha expirado");
    }
    await usuario.$query().patch({
      intentos_fallidos: 0,
      cambioContrasena: 0,
      cuenta_bloqueada: 0,
    });
    return res.redirect(process.env.FRONT_END_HOST);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
});

/**
 * @swagger
 * /usuarios/datos:
 *  patch:
 *    summary: Permite editar los datos de un usuario
 *    tags: [Usuario]
 *    responses:
 *      200:
 *        description: Devuelve los los datos actualizados del usuario
 *        content:
 *        application/json:
 *          schema:
 *            type: object
 *            $ref: '#/components/schemas/Usuario'
 *      400:
 *        description: Devuelve un error indicando que los campos estan incorrectas
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      404:
 *        description: Devuelve un mensaje de error indicando que no existe el terapeuta
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 *      500:
 *        description: Devuelve un mensaje que algo salió mal
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/Usuario'
 *
 */

router.patch("/datos", async (req, res, next) => {
  let usuario;
  let { id, ...resto } = req.body;
  try {
    if (resto.rol !== undefined)
      return res.status(400).json("No se puede modificar el rol");
    if (id === undefined) {
      return res.status(400).json("No esta específicada la id");
    }
    usuario = await Usuario.query().patchAndFetchById(id, { ...resto });
    console.log(usuario);
    return res.status(200).json(usuario);
  } catch (err) {
    return res.status(500).json("Algo ha salido mal");
  }
});
/**
 * @swagger
 * /usuarios/validarLink/{stringEncoded}:
 *  get:
 *    summary: Permite validar un link para validacion de contraseña
 *    tags: [Usuario]
 *    responses:
 *      401:
 *        description: Devuelve un mensaje de el link para reestablecer contraseña caduco
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      400:
 *        description: Devuelve un mensaje de error indicando que el link no esta encriptado correctamente
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 *      200:
 *        description: Devuelve un mensaje de error indicando que el link es valido
 *        content:
 *        application/json:
 *          schema:
 *            type: string
 *    parameters:
 *      - name: stringEncoded
 *        description: stringEncoded es una string codificada en aes 256. La string previo al codificado tiene este formato "fechaExpiracion/usuarioID" Sin las comillas y fechaExpiracion viene dado por la funcion Date.now() de javascript. Se puede encriptar la string en la ruta de "encriptar" en "Utilidades"
 *        in: path
 *        required: true
 *
 */

router.get("/validarLink/:stringEncoded", async (req, res, next) => {
  let usuario;
  let { stringEncoded } = req.params;
  try {
    let stringDecoded = desencriptar(stringEncoded);
    fechaExpiracion = stringDecoded.split("/")[0]; //fecha/usuarioID
    idUsuario = stringDecoded.split("/")[1];
    usuario = await Usuario.query().findById(idUsuario);
    console.log(usuario);
  } catch (err) {
    return res
      .status(400)
      .json("Dato encriptado no coincide con los parametros");
  }
  if (fechaExpiracion < Date.now() || usuario.cambioContrasena == 0) {
    return res.status(401).json("El link expiro");
  }
  return res.status(200).json("Link valido");
});

router.use("/fisioterapeutas", terapeutas);
router.use("/pacientes", pacientes);

module.exports = router;
