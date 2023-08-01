const Producto = require("../Models/Productos");
const saltedMd5 = require("salted-md5");
const path = require("path");
const { generarNumeroAleatorio } = require("../utils/aleatorios");
const { raw, ref } = require("objection");
const { obtenerFechaComponent } = require("../utils/fechas");
const Carrito = require("../Models/Carrito");
exports.verProductos = async (req, res, next) => {
  let { palabra, categoria, rango_inferior, rango_superior, nuevo } = req.query;
  try {
    let fechaActual = obtenerFechaComponent();
    console.log({ nuevo });
    let productos = await Producto.query()
      .select([
        "productos.*",
        raw(
          `FN_PRODUCTO_NUEVO(productos.fecha_publicacion,"${fechaActual}")`
        ).as("isNuevo"),
        raw(`FN_HAS_STOCK(productos.stock)`).as("hasStock"),
      ])
      .withGraphJoined("terapeuta.usuario")
      .modify((builder) => {
        if (palabra) {
          builder.where((b) => {
            b.where("productos.nombre", "like", `%${palabra}%`).orWhere(
              "productos.caracteristicas",
              "like",
              `%${palabra}%`
            );
          });
        }
        if (categoria) {
          builder.where((b) => {
            b.where("productos.categoria", "=", categoria);
          });
        }
        if (!rango_inferior) rango_inferior = 0;
        if (!rango_superior) rango_superior = Number.MAX_SAFE_INTEGER;
        builder.where((b) => {
          b.where("productos.precio", ">=", rango_inferior).andWhere(
            "productos.precio",
            "<=",
            rango_superior
          );
        });
      })
      .modify((builder) => {
        if (nuevo == 1) {
          builder.where((b) => {
            b.whereRaw(
              `FN_PRODUCTO_NUEVO(productos.fecha_publicacion,"${fechaActual}") = 1`
            );
          });
        }
      })
      .modifyGraph("terapeuta", (builder) => {
        builder.select("id", "id_usuario", "numero_cedula");
      })
      .modifyGraph("terapeuta.usuario", (builder) => {
        builder.select("id", "nombre", "foto_perfil");
      })
      .orderBy("productos.fecha_publicacion", "DESC")
      .debug();
    return res.status(200).json(productos);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
exports.verProductosTerapeuta = async (req, res, next) => {
  let { id_terapeuta } = req.params;
  try {
    let productos = await verProductosTerapeuta(id_terapeuta);
    return res.status(200).json(productos);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
async function crearArchivo(imagen, bucket) {
  const name = saltedMd5(
    `${imagen.name}${generarNumeroAleatorio(0, Number.MAX_SAFE_INTEGER)}`,
    "SUPER-S@LT!"
  );
  const fileName = `productos/${name}${path.extname(imagen.name)}`;
  const file = bucket.file(fileName);
  await file.save(imagen.data);
  return fileName;
}
async function eliminarArchivo(imagen, bucket) {
  await bucket.file(imagen).delete();
  return true;
}
exports.crearProducto = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No se subió ninguna imagen");
    }
    let { imagen } = req.files;
    let { producto } = req.body;
    producto = JSON.parse(producto);
    producto.imagen = await crearArchivo(imagen, req.app.locals.bucket);
    console.log({ producto });
    let productoCreado;
    try {
      productoCreado = await crear(producto);
    } catch (err) {
      console.log(err);
      await eliminarArchivo(producto.imagen, req.app.locals.bucket);
      return res.status(501).json("No se pudo crear el producto");
    }
    return res.status(200).json(productoCreado);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
exports.editarProducto = async (req, res, next) => {
  //unableEdit permite hacer un "rollback" de las imagenes subidas a firebase
  let unableEdit = false;
  //Permite saber si se tiene que editar la imagen o no
  let editImagen = true;
  //La referencia al bucket de firebase
  let bucket = req.app.locals.bucket;
  try {
    //Si no existe un archivo subido entonces asignamos editImagen a false
    if (!req.files || Object.keys(req.files).length === 0) {
      editImagen = false;
    }
    let imagen;
    //Si hay que editar la imagen obtenemos el buffer de la imagen
    if (editImagen) {
      imagen = req.files.imagen;
    }
    let { producto } = req.body;
    //Parseamos a un objeto de javascript la propiedad producto del body de la request
    producto = JSON.parse(producto);
    //Buscamos el producto en la bd
    let productoEncontrado = await ver(producto.id);
    //Si no existe se lo hacemos saber al usuario
    if (!productoEncontrado)
      return res.status(404).json("No se encontro producto");
    //Si la imagen se tiene que editar, creamos el archivo en el bucket de firebase
    if (editImagen) {
      producto.imagen = await crearArchivo(imagen, bucket);
    }
    console.log({ producto });
    //Obtenemos la imagenPrevia del producto y lo guardamos en imagenPrevia
    let { imagen: imagenPrevia } = productoEncontrado;
    let productoEditado;
    //En este trycatch actualizamos el stock de producto
    try {
      /**
       * Si se trata de modificar el stock, hay que revisar si el nuevo stock satisface las cantidades
       * en el carrito de los clientes
       */
      if (productoEncontrado.stock !== producto.stock) {
        //Obtenemos la cantidad de producto que hay distribuida en los diferentes carritos
        let [{ cantidad }] = await Carrito.query()
          .where("id_producto", "=", producto.id)
          .sum("cantidad as cantidad");
        //Si la cantidad es mayor que el nuevo stock
        if (cantidad > producto.stock || cantidad === undefined) {
          //Eliminamos el producto de los carritos de los clientes (Esto para evitar "sobrevender")
          await Carrito.query().where("id_producto", "=", producto.id).delete();
          //Posteriormente asignamos la cantidad posible de stock para distribuir en los carritos al nuevo stock
          producto.stock_carrito = producto.stock;
          //Si la cantidad es menor que el nuevo stock
        } else if (cantidad < producto.stock) {
          /**
           * Si la cantidad es menor, entonces se puede satisfacer
           * sin problemas la cantidad de producto distribuida en los carritos de los clientes
           * Lo unico que hacemos es calcular el stock disponible para distribuir en los carritos de los clientes, en base a la
           * cantidad de stock actual en los carritos y el nuevo stock del producto
           * */
          let stock_carrito = producto.stock - cantidad;
          producto.stock_carrito = stock_carrito;
        }
      }
      //Una vez evaluado todo lo anterior, actualizamos el producto
      productoEditado = await actualizar(producto);
    } catch (err) {
      //Si algo sale mal quiere decir que no se pudo editar el producto
      unableEdit = true;
      console.log(err);
    }
    //Si el producto no se edito, entonces hacemos "rollback"
    if (unableEdit) {
      //Eliminamos la imagen que el usuario subio para la edición
      if (editImagen) await eliminarArchivo(producto.imagen, bucket);
      //Si el producto se edito
    } else {
      //Eliminamos la imagen previa
      if (editImagen) await eliminarArchivo(imagenPrevia, bucket);
    }
    //Retornamos el producto recien creado
    return res.status(200).json(productoEditado);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
exports.eliminarProducto = async (req, res, next) => {
  try {
    //Obtenemos la id del producto de los parametros
    let { id_producto } = req.params;
    //Obtenemos la imagen del producto en cuestion
    let { imagen } = await ver(id_producto);
    //Eliminamos el producto
    let productos = await eliminar(id_producto);
    //Eliminamos la imagen del bucket asociada al producto
    await req.app.locals.bucket.file(imagen).delete();
    return res.status(200).json(productos);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Hay un error");
  }
};
//Esta funcion middleware agrega una propiedad producto a res
exports.verProducto = async (req, res, next) => {
  try {
    let { id_producto } = req.params;
    if (!id_producto) id_producto = req.body.id_producto;
    let fechaActual = obtenerFechaComponent();

    let producto = await Producto.query()
      .withGraphJoined("terapeuta.usuario")

      .findById(id_producto)
      .select([
        "productos.*",
        raw(
          `FN_PRODUCTO_NUEVO(productos.fecha_publicacion,"${fechaActual}")`
        ).as("isNuevo"),
        raw(`FN_HAS_STOCK(productos.stock)`).as("hasStock"),
      ])
      .modifyGraph("terapeuta", (builder) => {
        builder.select("id", "id_usuario", "numero_cedula");
      })
      .modifyGraph("terapeuta.usuario", (builder) => {
        builder.select("id", "nombre", "foto_perfil");
      });
    if (!producto) return res.status(404).json("No se encontro el producto");
    res.producto = producto;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json("Algo ha salido mal");
  }
};
const crear = async (productoInsert) => {
  try {
    let producto = await Producto.query().insertAndFetch(productoInsert);
    return producto;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const eliminar = async (id) => {
  try {
    let productoEliminado = await Producto.query().deleteById(id);
    return productoEliminado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const ver = async (id) => {
  try {
    let productoEncontrado = await Producto.query().findById(id);
    return productoEncontrado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const verProductosTerapeuta = async (id_terapeuta) => {
  try {
    let producto = await Producto.query()
      .where("id_terapeuta", "=", id_terapeuta)
      .orderBy("fecha_publicacion", "DESC");
    return producto;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
const actualizar = async (producto) => {
  try {
    let productoEncontrado = await ver(producto.id);
    // if (producto.stock < productoEncontrado.stock) {
    //   await Producto.query().where("id", "=", producto.id).delete();
    //   producto.stock_carrito = producto.stock;
    // } else {
    //   let c = await Carrito.query()
    //     .where("id_producto", "=", producto.id)
    //     .sum("cantidad as");
    // }
    let productoActualizado = await productoEncontrado
      .$query()
      .patchAndFetch(producto);
    return productoActualizado;
  } catch (error) {
    console.log(error);
    throw new Error("Algo ha salido mal");
  }
};
exports.crear = crear;
exports.eliminar = eliminar;
// exports.eliminarVarios = eliminarVarios;
exports.ver = ver;
exports.actualizar = actualizar;
