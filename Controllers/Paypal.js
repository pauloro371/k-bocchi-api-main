const { default: axios } = require("axios");
const {
  PAYPAL_URL,
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
  PAYPAL_PARTNER_MERCHANT_ID,
} = require("../config");
const { param } = require("../routes");
const Carrito = require("../Models/Carrito");
const Usuario = require("../Models/Usuario");
const Terapeuta = require("../Models/Terapeuta");
const { generarNotificacion } = require("../utils/notificaciones");
const Producto = require("../Models/Productos");

//Permite crear una orden a partir del carrito de un pacinete
exports.crearOrden = async (req, res, next) => {
  let { access_token } = res;
  let { id_paciente } = req.params;
  let { addressId, costoEnvio } = req.body;
  console.log({ addressId, costoEnvio });

  let carrito = await Carrito.query()
    .withGraphFetched("producto.terapeuta.usuario")
    .where("id_paciente", "=", id_paciente);

  if (carrito.length === 0)
    return res.status(404).json("No hay items en el carrito");
  let purchase_units = [];
  let paquetes = 0;
  carrito.forEach(
    ({
      producto: {
        terapeuta: { usuario, ...itemTerapeuta },
        ...itemProducto
      },
      ...itemCarrito
    }) => {
      let index = purchase_units.findIndex(
        ({ payee: { merchant_id } }) => merchant_id === itemTerapeuta.merchantId
      );
      console.log("ID", itemTerapeuta.merchantId);
      let item = {
        name: itemProducto.nombre,
        quantity: itemCarrito.cantidad,
        unit_amount: {
          currency_code: "MXN",
          value: itemProducto.precio,
        },
      };
      let amount = {
        currency_code: "MXN",
        value: itemProducto.precio * itemCarrito.cantidad,
        breakdown: {
          item_total: {
            currency_code: "MXN",
            value: itemProducto.precio * itemCarrito.cantidad,
          },
          // shipping: {
          //   currency_code: "MXN",
          //   value: 100,
          // },
        },
      };
      if (index != -1) {
        purchase_units[index].items.push(item);
        let amountFound = purchase_units[index].amount;
        let { item_total, shipping } = amountFound.breakdown;
        purchase_units[index].amount = {
          ...amountFound,
          value: amountFound.value + itemProducto.precio * itemCarrito.cantidad,
          // + 100,
          breakdown: {
            item_total: {
              currency_code: "MXN",
              value:
                item_total.value + itemProducto.precio * itemCarrito.cantidad,
            },
            // shipping: {
            //   currency_code: "MXN",
            //   value: shipping.value + 100,
            // },
          },
        };
      } else {
        paquetes++;
        let payee = {
          merchant_id: itemTerapeuta.merchantId,
        };
        purchase_units.push({
          reference_id: itemTerapeuta.id,
          payee,
          amount,
          items: [item],
        });
      }
    }
  );
  let splitted = costoEnvio / paquetes;
  purchase_units = purchase_units.map((value) => {
    console.log(value);
    return {
      ...value,
      amount: {
        currency_code: "MXN",
        value: value.amount.value + splitted,
        breakdown: {
          ...value.amount.breakdown,
          shipping: {
            currency_code: "MXN",
            value: splitted,
          },
        },
      },
    };
  });
  console.log({ purchase_units });
  const order = {
    intent: "CAPTURE",
    purchase_units,
    application_context: {
      brand_name: "Kbocchi",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `http://localhost:4000/capture-order`,
      cancel_url: `http://localhost:4000/cancel-payment`,
    },
    // payment_instruction: {
    //   platform_fees: [
    //     {
    //       amount: { value: `${100}`, currency_code: "MX" },
    //       payee: { merchant_id: process.env.PAYPAL_PARTNER_MERCHANT_ID },
    //     },
    //   ],
    // },
  };
  // console.log({ d: order.payment_instruction.platform_fees });
  try {
    const response = await axios.post(
      `${PAYPAL_URL}/v2/checkout/orders`,
      order,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return res.json(response.data);
  } catch (err) {
    console.error(err);
    return res.json("Algo ha salido mal generando la orden");
  }
};
exports.obtenerVendedores = async (req, res, next) => {
  let { id_paciente } = req.params;
  let carrito = await obtenerMerchants(id_paciente);
  if (carrito.length === 0)
    return res.status(404).json("No hay items en el carrito");
  return res.status(200).json(carrito);
};
//Esta funcion de middleware permite obtener el token de autenticación de paypal
//y lo anexa en res.access_token
exports.getToken = async (req, res, next) => {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    let {
      data: { access_token },
    } = await axios.post(`${PAYPAL_URL}/v1/oauth2/token`, params, {
      auth: {
        username: PAYPAL_CLIENT_ID,
        password: PAYPAL_SECRET,
      },
    });
    res.access_token = access_token;
    console.log(res.access_token);
    // return res.json("tokenizado");
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal obteniendo el token");
  }
};

exports.capturarOrden = async (req, res, next) => {
  return;
};
exports.cancelarOrden = async (req, res, next) => {
  return;
};

exports.crearVinculacionLink = async (req, res, next) => {
  //Obtenemos el id del terapeuta de los parametros de la request

  let { id_terapeuta } = req.params;
  try {
    //Obtenemos el usuario vinculado al id del terapeuta

    let usuario = await Usuario.query()
      .withGraphJoined("terapeuta")
      .findOne({ "terapeuta.id": id_terapeuta });
    //Si no existe retornamos un 404

    if (!usuario) return res.status(404).json("No se encontro el vendedor");

    //Creamos el objeto para generar el link de vinculación
    let onboardBody = {
      tracking_id: `${id_terapeuta}`,
      //Este tracking_id lo usamos para posteriores funcionamientos

      operations: [
        {
          operation: "API_INTEGRATION",
          api_integration_preference: {
            rest_api_integration: {
              integration_method: "PAYPAL",
              integration_type: "THIRD_PARTY",
              third_party_details: {
                features: ["PAYMENT", "REFUND", "PARTNER_FEE"],
              },
            },
          },
        },
      ],
      partner_config_override: {
        return_url: `${process.env.FRONT_END_HOST}/app/perfil`,
      },
      products: ["EXPRESS_CHECKOUT"],
      legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
    };
    //Hacemos la petición para crear el link de referido/vinculación

    let onboardResponse = await axios.post(
      `${PAYPAL_URL}/v2/customer/partner-referrals`,
      onboardBody,
      {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_SECRET,
        },
      }
    );
    //Una vez se generan los links, lo devolvemos al usuario
    return res.status(200).json(onboardResponse.data);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal generando el onboarding");
  }
};

exports.getVinculacionStatus = async (req, res, next) => {
  //Obtenemos el id del terapeuta
  let { id_terapeuta } = req.params;
  let { access_token } = res;
  try {
    // PAYPAL_PARTNER_MERCHANT_ID
    //Obtenemos el merchantIdInPayPal del usuario mediante el tracking id
    let { data: merchant_integration } = await axios.get(
      `${PAYPAL_URL}/v1/customer/partners/${PAYPAL_PARTNER_MERCHANT_ID}/merchant-integrations?tracking_id=${id_terapeuta}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    //obtenemos el merchant_id de merchant_integration
    let { merchant_id } = merchant_integration;
    //Ahora obtenemos el status de la vinculación mediante la api de paypal
    let { data: onboard_status } = await axios.get(
      `${PAYPAL_URL}/v1/customer/partners/${PAYPAL_PARTNER_MERCHANT_ID}/merchant-integrations/${merchant_id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    //posteriormente revisamos si los permisos son adecuados
    //primary_email_confirmed indica si el usuario ha validado su correo
    //payments_receivable indica si la cuenta puede recibir pagos
    //oauth_third_party indica si el usuario ha permitido a la aplicación actuar en su nombre (realizar pagos)
    let { primary_email_confirmed, payments_receivable, oauth_integrations } =
      onboard_status;
    console.log({
      onboard_status,
    });
    if (
      !(primary_email_confirmed && payments_receivable && oauth_integrations)
    ) {
      return res.status(400).json({
        primary_email_confirmed,
        payments_receivable,
        oauth_integrations,
      });
    }
    return res.status(200).json({ merchant_id });
  } catch (err) {
    console.log(err);
    if (err.response && err.response.status === 404) {
      //no esta vinculado porque el proceso no ha iniciado
      return res
        .status(404)
        .json("No esta vinculado, no ha empezado el proceso");
    }
    return res.status(500).json("Algo ha salido mal obteniendo el status");
  }
};

exports.agregarMerchantId = async (req, res, next) => {
  //Obtenemos tracking_id (que es el mismo id del terapeuta)
  //Obtenemos el merchant_id (que es el identificador de paypal para el terapeuta dentro de nuestra plataforma)
  let {
    resource: { tracking_id, merchant_id },
  } = req.body;
  try {
    //Primero obtenemos el usuario
    let terapeuta = await Terapeuta.query().withGraphJoined("usuario").findOne({
      "terapeutas.id": tracking_id,
    });
    //Si el usuario no existe retornamos un 200 directamente (esto porque sino paypal sigue intentando mandar la notificacion)
    if (!terapeuta) return res.status(200).json("correct");
    //Una vez obteneido el usuario agregamos su merchant_id a la bd
    await terapeuta.$query().patchAndFetch({
      "terapeutas.merchantId": merchant_id,
    });
    //Y generamos una notificacion apropiada para el usuario
    await generarNotificacion({
      id_usuario: terapeuta.usuario.id,
      descripcion: "¡Se ha vinculado tu cuenta de paypal con tu cuenta!",
      contexto_web: "/app/perfil",
      contexto_movil: "intent",
      titulo: "Vinculación de cuenta",
    });
    //Retornamos un 200 para indicar que todo bien
    return res.status(200).json("recibido");
  } catch (err) {
    console.log(err);
    //Si algo sale mal se retorna un 500. De esta forma paypal sigue tratando de mandar la notificacion
    return res.status(500).json("Algo ha salido mal");
  }
};

const obtenerMerchants = async (id_paciente) => {
  return await Terapeuta.query()
    .joinRelated("productos.carritos") //si llegaramos a necesitar más datos quitar esto y poner withGraphJoined
    .distinct("merchantId as merchant_id") //con withGraphJoined ya no es necesario el distinc
    .distinct("terapeutas.id_usuario") //con withGraphJoined ya no es necesario el distinc
    .where("productos:carritos.id", "=", id_paciente);
};

exports.obtenerMerchants = obtenerMerchants;
