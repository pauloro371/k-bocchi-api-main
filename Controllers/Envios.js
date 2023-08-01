const EasyPost = require("@easypost/api");
const { Address } = require("@easypost/api");
const Terapeuta = require("../Models/Terapeuta");
const { getCarritoPaciente } = require("./Carrito");
const {
  calculateBoxSizeForTerapeuta,
  obtenerTamanoCajas,
} = require("../utils/algoritmoCalcularCaja");
const { obtenerComponentesDireccion } = require("../utils/direcciones");
const { generarNumeroAleatorio } = require("../utils/aleatorios");
const {
  PAQUETERIA,
  CAMINO,
  PUNTO,
  ESTADO_PAQUETERIA,
  ESTADO_PREPARADO,
  ESTADO_CAMINO,
  ESTADO_PUNTO,
  ESTADO_ENTREGADO,
} = require("../utils/estadoPaquete");
const Paquete = require("../Models/Paquete");
const { obtenerFechaActualMexico } = require("../utils/fechas");
const { generarNotificacion } = require("../utils/notificaciones");
const EN_PAQUETERIA = "unknown";
const PREPARADO_ENVIO = "pre_transit";
const EN_CAMINO = "in_transit";
const EN_PUNTO = "out_for_delivery";
const ENTREGADO = "delivered";
const WEBHOOK_CREADO = "tracker.created";
const WEBHOOK_ACTUALIZADO = "tracker.updated";
exports.webhook = async (req, res, next) => {
  // try {
  //   return res.json({ id_ut, id_up });
  // } catch (err) {
  //   console.log(err);
  //   res.json("x");
  // }
  let {
    description, //description indica la acción que activo nuestro webook
    result: { status, shipment_id }, //status indica en que fase del envío se encuentra el paquete
  } = req.body;
  res.status(200).json("Ok");
  let estado;

  console.log(`ESTADO PARA: ${shipment_id}`);
  if (description === WEBHOOK_CREADO) {
    estado = ESTADO_PAQUETERIA;
  }
  if (description === WEBHOOK_ACTUALIZADO) {
    estado = obtenerEstado(status);
  }
  try {
    let {
      contenido: [
        {
          terapeuta: { id_usuario: id_ut },
          ticket: {
            paciente: { id_usuario: id_up },
          },
        },
      ],
    } = await Paquete.query()
      .withGraphJoined("contenido.[terapeuta,ticket.[paciente]]")
      .findOne({ "paquetes.id": shipment_id });
    let patch = {
      estatus: estado,
    };
    if (estado === ESTADO_ENTREGADO) {
      patch = {
        ...patch,
        fecha_entrega: obtenerFechaActualMexico().toISOString(),
      };

      await generarNotificacion({
        id_usuario: id_ut,
        contexto_web: `/app/marketplace/envios/${shipment_id}`,
        descripcion: "Se ha entregado un producto a tu comprador",
        titulo: "¡Paquete entregado!",
      });
      await generarNotificacion({
        id_usuario: id_up,
        contexto_web: `/app/marketplace/envios/${shipment_id}`,
        descripcion: "Se ha entregado tu paquete",
        titulo: "¡Paquete entregado!",
      });
    }
    await Paquete.query().findById(shipment_id).patch(patch);
  } catch (err) {
    console.log(err);
  }
  console.log(estado);
};

function obtenerEstado(status) {
  switch (status) {
    case PREPARADO_ENVIO:
      return ESTADO_PREPARADO;
    case EN_CAMINO:
      return ESTADO_CAMINO;
    case EN_PUNTO:
      return ESTADO_PUNTO;
    case ENTREGADO:
      return ESTADO_ENTREGADO;
  }
}
exports.crearEnvio = async (req, res, next) => {
  const client = new EasyPost(process.env.EASYPOST_API_KEY);
  const shipment = await client.Shipment.create({
    from_address: {
      street1: "417 MONTGOMERY ST",
      street2: "FLOOR 5",
      city: "SAN FRANCISCO",
      state: "CA",
      zip: "94104",
      country: "US",
      company: "EasyPost",
      phone: "415-123-4567",
    },
    to_address: {
      name: "Dr. Steve Brule",
      street1: "179 N Harbor Dr",
      city: "Redondo Beach",
      state: "CA",
      zip: "90277",
      country: "US",
      phone: "4155559999",
    },
    parcel: {
      length: 8,
      width: 5,
      height: 5,
      weight: 5,
    },
  });
  // shipment.save();
  shipment.rates.forEach((rate) => {
    console.log(rate.carrier);
    console.log(rate.service);
    console.log(rate.rate);
    console.log(rate.id);
  });

  // const boughtShipment = await Shipment.buy(
  //   shipment.id,
  //   shipment.lowestRate()
  // );

  console.log({ shipment });
  res.status(200).json("Ok");
};

exports.calcularEnvio = async (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal obteniendo los costos");
  }
};

exports.obtenerDomicilio = async (id_address) => {
  try {
    const client = new EasyPost(process.env.EASYPOST_API_KEY);
    const fromAddress = await client.Address.retrieve(id_address);
    return fromAddress;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.verificarDomicilio = async (req, res, next) => {
  try {
    const client = new EasyPost(process.env.EASYPOST_API_KEY);
    // console.log({ body: req.body });
    let { direccion, id_paciente } = req.body;
    const fromAddress = await client.Address.create({
      verify: true,
      ...direccion,
    });
    let { verifications } = fromAddress;
    if (verifications.zip4.success === false)
      return res.status(400).json(verifications);
    if (verifications.delivery.success === false)
      return res.status(401).json(verifications);

    let precio = await calcularPrecioEnvio(fromAddress, id_paciente);
    console.log({ precio });
    return res.status(200).json({ fromAddress, precio });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal obteniendo los costos");
  }
};

const calcularPrecioEnvio = async (address, id_paciente) => {
  let carrito = await getCarritoPaciente(id_paciente);

  let cajas = obtenerTamanoCajas(carrito);
  console.log(cajas);
  let shipments = [];
  for (let index = 0; index < cajas.length; index++) {
    const caja = cajas[index];
    let direccion = obtenerComponentesDireccion(caja.terapeuta.domicilio);
    let { nombre, telefono } = caja.terapeuta.usuario;
    const client = new EasyPost(process.env.EASYPOST_API_KEY);
    const shipment = await client.Shipment.create({
      // from_address: address,
      // to_address: {
      //   name: nombre,
      //   street1: direccion.calle,
      //   city: direccion.ciudad,
      //   state: direccion.estado,
      //   zip: direccion.codigoPostal,
      //   country: "MX",
      //   phone: telefono,
      // },
      from_address: {
        street1: "417 MONTGOMERY ST",
        street2: "FLOOR 5",
        city: "SAN FRANCISCO",
        state: "CA",
        zip: "94104",
        country: "US",
        name: nombre,
        phone: telefono,
      },
      to_address: {
        name: address.name,
        street1: "179 N Harbor Dr",
        city: "Redondo Beach",
        state: "CA",
        zip: "90277",
        country: "US",
        phone: address.phone,
      },
      parcel: {
        length: caja.largoTotal,
        width: caja.anchoTotal,
        height: caja.alturaTotal,
        weight: caja.pesoTotal,
      },
    });
    shipments.push({ id_terapeuta: caja.terapeuta.id, shipment });
  }
  cajas = cajas.map((caja) => ({
    ...caja,
    pago_envio: generarNumeroAleatorio(50, 120),
  }));
  cajas = {
    ...cajas,
    pago_total: cajas.reduce((acc, { pago_envio }) => acc + pago_envio, 0),
  };
  return { cajas, shipments, carrito };
};

exports.realizarEnvio = async (req, res, next) => {
  let { id_paquete } = req.params;
  try {
    let client = new EasyPost(process.env.EASYPOST_API_KEY);
    const paquete = await Paquete.query().findById(id_paquete);
    if (!paquete)
      return res.status(500).json("No se ha podido enviar el paquete");
    const shipment = await client.Shipment.retrieve(id_paquete);
    const boughtShipment = await client.Shipment.buy(
      id_paquete,
      shipment.lowestRate()
    );
    let {
      tracker: { id },
    } = boughtShipment;
    let paqueteEditado = await paquete
      .$query()
      .patchAndFetch({ codigo_rastreo: id });
    console.log({ paqueteEditado });
    return res.json(boughtShipment);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal enviando el producto");
  }
};
exports.verEnvio = async (req, res, next) => {
  let { id_paquete } = req.params;
  try {
    let client = new EasyPost(process.env.EASYPOST_API_KEY);
    const paquete = await Paquete.query().findById(id_paquete);
    if (!paquete)
      return res.status(500).json("No se ha podido enviar el paquete");
    const shipment = await client.Shipment.retrieve(id_paquete);
    console.log({ shipment });
    return res.json(shipment);
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal enviando el producto");
  }
};
exports.obtenerEnvio = calcularPrecioEnvio;
