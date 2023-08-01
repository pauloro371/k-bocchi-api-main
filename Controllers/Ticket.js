const Carrito = require("../Models/Carrito");
const Paciente = require("../Models/Paciente");
const Paquete = require("../Models/Paquete");
const Ticket = require("../Models/Ticket");
const Usuario = require("../Models/Usuario");
const { obtenerFechaActualMexico } = require("../utils/fechas");
const { generarNotificacion } = require("../utils/notificaciones");
const { getCarritoPaciente } = require("./Carrito");
const { obtenerEnvio, obtenerDomicilio } = require("./Envios");
const { obtenerMerchants } = require("./Paypal");
const { actualizar } = require("./Productos");

exports.crearTicket = async (req, res, next) => {
  let { id_paciente } = req.params;
  let { costo_envio, id_address, order_id } = req.body;
  let address = await obtenerDomicilio(id_address);
  let { carrito, shipments } = await obtenerEnvio(address, id_paciente);
  let terapeutas = await obtenerMerchants(id_paciente);
  let detalle_ticket = [];
  let subtotalTicket = 0;
  let notificaciones = [];
  //etapa de creacion de detalles del ticket
  carrito.forEach(
    ({ cantidad, id_producto, producto: { nombre, precio, id_terapeuta } }) => {
      let subtotal = precio * cantidad;
      subtotalTicket += subtotal;
      let {
        shipment: { id },
      } = shipments.find(({ id_terapeuta: id }) => id_terapeuta === id);
      detalle_ticket.push({
        id_producto,
        id_paquete: id,
        id_terapeuta,
        cantidad,
        subtotal,
        nombre,
      });
    }
  );
  //etapa de generación de notificaciones para indicar al terapeuta una venta
  terapeutas.map(({ id_usuario }) => {
    notificaciones.push({
      id_usuario,
      titulo: "¡Haz realizado una venta!",
      descripcion: "Revisa tus pedidos por enviar en el apartado 'Mis pedidos'",
      contexto_web: "/app/marketplace/terapeuta/pedidos",
    });
  });
  //fase de actualización de stock
  try {
    for (const {
      cantidad,
      producto: {
        terapeuta: { id_usuario },
        ...producto
      },
    } of carrito) {
      let { stock, cantidad_vendida, id, nombre } = producto;
      cantidad_vendida += cantidad;
      stock -= cantidad;
      if (stock < 0) stock = 0;
      await actualizar({ id, cantidad_vendida, stock });

      //Generacion de notificaciones para stock agotado
      if (stock === 0)
        notificaciones.push({
          id_usuario,
          titulo: `¡Tu producto ${nombre} se ha agotado!`,
          descripcion: "Visita tu catalogo para agregar más stock",
          contexto_web: "/app/marketplace/terapeuta/catalogo",
        });
    }
  } catch (err) {
    console.log(obtenerFechaActualMexico(), ":", err);
    return res.status(500).json("Algo ha salido mal actualizando el stock");
  }
  //fase de generacion de notificaciones para comprador
  try {
    let { id: id_comprador } = await Usuario.query()
      .joinRelated("paciente")
      .findOne({ "paciente.id": id_paciente });
    notificaciones.push({
      id_usuario: id_comprador,
      titulo: `¡Gracias por comprar en K-Bocchi!`,
      descripcion:
        "Revisa el apartado de pedidos para mantenerte al tanto de tu envio",
      contexto_web: "/app/marketplace/envios/paciente",
    });
  } catch (err) {
    console.log(obtenerFechaActualMexico(), ":", err);
    return res
      .status(500)
      .json("Algo ha salido mal generando la notificacion de comprador");
  }
  //fase de inserción de paquetes
  try {
    let paquetesInsert = shipments.map(({ shipment: { id } }) => ({ id }));
    for (const p of paquetesInsert) {
      let { numero_exterior, calle } = descomponerNumeroCalle(address.street1);

      await Paquete.query().insert({
        ...p,
        ciudad_destino: address.city,
        numero_telefono_destino: address.phone,
        numero_exterior_destino: numero_exterior,
        direccion_destino: calle,
        codigo_postal_destino: address.zip,
        estado_destino: address.state,
      });
    }
  } catch (err) {
    console.log(obtenerFechaActualMexico(), ":", err);
    return res.status(500).json("Algo ha salido mal ingresando los paquetes");
  }
  let ticketCreado;
  try {
    //creamos el ticket
    let ticket = {
      fecha: obtenerFechaActualMexico(),
      id_paciente,
      costo_envio,
      subtotal: subtotalTicket,
      id_order: order_id,
      total: subtotalTicket + costo_envio,
      detalles: detalle_ticket,
    };
    ticketCreado = await Ticket.query().insertGraphAndFetch(ticket);
    console.log({ ticketCreado });
    //guardamos el ticket
  } catch (err) {
    console.log(obtenerFechaActualMexico(), ":", err);
    return res.status(500).json("Algo ha salido mal generando el ticket");
  }
  //fase de vaciado de carrito
  try {
    let eliminados = await Carrito.query()
      .where("id_paciente", "=", id_paciente)
      .delete();
    console.log({ eliminados });
    //retornamos una respuesta al cliente, pues no queremos que espere a que mande las notificaciones
    res.status(200).json(ticketCreado);
  } catch (err) {
    console.log(obtenerFechaActualMexico(), ":", err);
    return res.status(500).json("Algo ha salido mal vaciando el carrito");
  }
  //fase de mandar notificaciones
  for (const n of notificaciones) {
    await generarNotificacion({ ...n });
  }
};

function descomponerNumeroCalle(calleNumero) {
  // Dividir el domicilio en número y nombre de calle
  const partes = calleNumero.split(" ");

  // Verificar si el primer elemento es un número
  let numero = "";
  if (!isNaN(parseInt(partes[0]))) {
    numero = partes.shift();
  }

  // Obtener el nombre de la calle
  const nombreCalle = partes.join(" ");
  return {
    numero_exterior: numero,
    calle: nombreCalle,
  };
}
