const Carrito = require("../Models/Carrito");
const Paciente = require("../Models/Paciente");
const Producto = require("../Models/Productos");
const { actualizar } = require("./Productos");

exports.addProducto = async (req, res, next) => {
  //Obtenemos el producto encontrado
  let { producto } = res;
  //Obtenemos el item de carrito que queremos agregar
  let { cantidad, id_producto, id_paciente } = req.body;
  try {
    //Si el producto encontrado ya no tiene stock devolvemos mensajes apropiados
    if (producto.stock === 0 || producto.stock_carrito === 0) {
      res.status(420).json(producto);
      return;
    }
    //Si el producto encontrado no tiene stock suficiente para satisfacer la cantidad requerida por el cliente devolvemos mensaje apropiado
    if (producto.stock_carrito < cantidad) {
      res.status(421).json(producto);
      return;
    }
    //Obtenemos la cantidad de stock actualizada, restando la cantidad requerida por el cliente
    let newStock = producto.stock_carrito - cantidad;
    //Actualizamos el stock del producto
    let actualizado;
    try {
      console.log("FASE DE ACTUALIZACION DE STOCK");
      actualizado = await actualizar({
        id: id_producto,
        stock_carrito: newStock,
      });
    } catch (err) {
      throw err;
    }
    //Buscamos si el producto ya esta en el carrito del usuario
    let carritoEncontrado;
    let carrito;
    try {
      carritoEncontrado = await verCarritoItem({ id_producto, id_paciente });
      //Si ya esta entonces
      if (carritoEncontrado) {
        //actualizamos la cantidad
        let newCantidad = carritoEncontrado.cantidad + cantidad;
        carrito = await modifyProductoCarrito({
          id_producto,
          id_paciente,
          cantidad: newCantidad,
        });
        //Si no esta entonces
      } else {
        //insertamos el producto y la cantidad al carrito del usuario
        carrito = await addProductoCarrito({
          id_producto,
          id_paciente,
          cantidad,
        });
      }
    } catch (err) {
      throw err;
    }
    return res.status(200).json({
      ...carrito,
      stock_carrito: actualizado.stock_carrito,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.deleteProducto = async (req, res, next) => {
  //Obtenemos el producto encontrado
  let { producto } = res;
  //Obtenemos el item de carrito que queremos agregar
  let { id_paciente, id_producto } = req.params;
  let { cantidad } = req.query;
  //Si no se provee una cantidad, se eliminara todo el producto
  if (!cantidad) cantidad = Number.MAX_SAFE_INTEGER;
  //Parseamos a Number porque props en req.query siempre son string
  cantidad = Number.parseInt(cantidad);
  try {
    //Obtenemos el producto en el carrito
    let carritoItem = await verCarritoItem({ id_paciente, id_producto });
    //Si no existe, se lo hacemos saber al cliente
    if (!carritoItem)
      return res
        .status(404)
        .json("Este producto no esta en el carrito del paciente");
    //Si la cantidad del producto en el carrito es menor a la que se quiere eliminar
    //hacemos que cantidad sea igual a la cantidad de producto en el carrito
    if (carritoItem.cantidad < cantidad) cantidad = carritoItem.cantidad;

    //Obtenemos el stock actualizado
    let newStock = producto.stock_carrito + cantidad;
    if (newStock > producto.stock) newStock = producto.stock;
    //Actualizamos el stock del producto
    let actualizado;
    try {
      console.log("FASE DE ACTUALIZACION DE STOCK");
      actualizado = await actualizar({
        id: id_producto,
        stock_carrito: newStock,
      });
    } catch (err) {
      throw err;
    }
    //Actualizamos la canitdad en el carrito el usuario
    let carrito;
    try {
      //Obtenemos la nueva cantidad
      let newCantidad = carritoItem.cantidad - cantidad;
      //Si la nueva cantidad es igual a 0, eliminamos el producto del carrito
      if (newCantidad === 0) {
        carrito = await deleteCarritoItem({ id_paciente, id_producto });
      } else {
        //Si no es igual, actualizamos la cantidad de producto en el carrito
        carrito = await modifyProductoCarrito({
          id_producto,
          id_paciente,
          cantidad: newCantidad,
        });
      }
    } catch (err) {
      throw err;
    }
    //Una vez actualizado el carrito, retornamos los datos nuevos del carrito, así como el stock nuevo del producto
    return res.status(200).json({
      ...carrito,
      stock_carrito: actualizado.stock_carrito,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.verCarrito = async (req, res, next) => {
  let { id_paciente } = req.params;
  try {
    let carrito = await verCarritoPaciente(id_paciente)
    return res.status(200).json(carrito);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
exports.setCarritoItem = async (req, res, next) => {
  let { producto } = res;
  //Obtenemos el item de carrito que queremos agregar
  let { cantidad, id_producto, id_paciente } = req.body;
  try {
    let carritoEncontrado;
    //buscamos si ya existe el producto en el carrito
    carritoEncontrado = await verCarritoItem({ id_producto, id_paciente });
    //stock actual representa el stock disponible para distribuir en los carritos
    let stock_actual = 0;
    //cantidad_actual representa la cantidad de producto en el carrito
    let cantidad_actual = 0;
    //Si ya existe el producto en el carrito, lo asignamos a cantidad_actual
    if (carritoEncontrado) {
      cantidad_actual = carritoEncontrado.cantidad;
    }
    stock_actual = producto.stock_carrito;

    //Obtenemos el stock resultante de "devolver" la cantidad de producto actual en el carrito al stock carrito del producto
    let stock_res = stock_actual + cantidad_actual;
    //Si el producto encontrado ya no tiene stock devolvemos mensajes apropiados
    if (producto.stock === 0 || stock_res === 0) {
      res.status(420).json(producto);
      return;
    }
    //Si la cantidad de producto solicitada es mayor a la cantidad de stock calculado previamente, devolvemos un 421
    if (cantidad > stock_res) {
      res.status(421).json(producto);
      return;
    }
    //Obtenemos la cantidad de stock actualizada, restando la cantidad requerida por el cliente
    let newStock = stock_res - cantidad;
    //Si por algún motivo la cantidad de stock actualizada es mayor que el stock disponible para venta, igualamos ambas cantidades
    if (newStock > producto.stock) newStock = producto.stock;
    //Actualizamos el stock del producto
    let actualizado;
    try {
      console.log("FASE DE ACTUALIZACION DE STOCK");
      actualizado = await actualizar({
        id: id_producto,
        stock_carrito: newStock,
      });
    } catch (err) {
      throw err;
    }
    //Buscamos si el producto ya esta en el carrito del usuario
    let carrito;
    try {
      //Si ya esta entonces
      if (carritoEncontrado) {
        //actualizamos la cantidad
        carrito = await modifyProductoCarrito({
          id_producto,
          id_paciente,
          cantidad: cantidad,
        });
        //Si no esta entonces
      } else {
        //insertamos el producto y la cantidad al carrito del usuario
        carrito = await addProductoCarrito({
          id_producto,
          id_paciente,
          cantidad,
        });
      }
    } catch (err) {
      throw err;
    }
    return res.status(200).json({
      ...carrito,
      stock_carrito: actualizado.stock_carrito,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json("Algo ha salido mal");
  }
};

const addProductoCarrito = async (carrito) => {
  try {
    let carritoCreado = await Carrito.query().insertAndFetch(carrito);
    return carritoCreado;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const modifyProductoCarrito = async (carrito) => {
  try {
    let carritoModificado = await Carrito.query().patchAndFetchById(
      [carrito.id_paciente, carrito.id_producto],
      { cantidad: carrito.cantidad }
    );
    return carritoModificado;
  } catch (err) {
    throw err;
  }
};

const deleteCarritoItem = async (carrito) => {
  try {
    let eliminado = await Carrito.query().deleteById([
      carrito.id_paciente,
      carrito.id_producto,
    ]);
    return eliminado;
  } catch (err) {
    throw err;
  }
};
const verCarritoItem = async (carrito) => {
  try {
    let carritoCreado = await Carrito.query().findById([
      carrito.id_paciente,
      carrito.id_producto,
    ]);
    return carritoCreado;
  } catch (err) {
    throw err;
  }
};
const verCarritoPaciente = async (id_paciente) => {
  try {
    let carrito = await Carrito.query()
      .joinRelated("paciente")
      .withGraphJoined("producto.terapeuta.usuario")
      .where("paciente.id", "=", id_paciente);
    return carrito;
  } catch (error) {
    throw error;
  }
};
exports.getCarritoPaciente = verCarritoPaciente;
