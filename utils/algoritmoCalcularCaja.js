const MAX_SIZE = 130;
exports.obtenerTamanoCajas = (carrito) => {
  try {
    let cajas = [];

    let terapeutaProductos = {};

    carrito.forEach((item) => {
      let { id_terapeuta } = item.producto;
      if (terapeutaProductos[id_terapeuta]) {
        terapeutaProductos[id_terapeuta].push({
          producto: item.producto,
          cantidad: item.cantidad,
          terapeuta: item.producto.terapeuta,
        });
      } else {
        terapeutaProductos[id_terapeuta] = [
          {
            producto: item.producto,
            cantidad: item.cantidad,
            terapeuta: item.producto.terapeuta,
          },
        ];
      }
    });

    for (const id_terapeuta in terapeutaProductos) {
      let anchoTotal = 0;
      let alturaTotal = 0;
      let largoTotal = 0;
      let pesoTotal = 0;
      terapeutaProductos[id_terapeuta].forEach((terapeutaProducto) => {
        let { producto: p, cantidad } = terapeutaProducto;
        anchoTotal = anchoTotal + p.ancho * cantidad;
        alturaTotal = alturaTotal + p.altura * cantidad;
        largoTotal = largoTotal + p.largo * cantidad;
        pesoTotal = pesoTotal + p.peso;
      });
      let girth = 2 * anchoTotal + 2 * alturaTotal;
      let size = largoTotal + girth;
      if (size > MAX_SIZE) {
        anchoTotal /= 2;
        alturaTotal /= 2;
      }
      if (anchoTotal <= 0) anchoTotal = 5;
      if (alturaTotal <= 0) alturaTotal = 5;
      cajas.push({
        anchoTotal,
        alturaTotal,
        largoTotal,
        pesoTotal,
        terapeuta: terapeutaProductos[id_terapeuta][0].terapeuta,
      });
    }
    return cajas;
  } catch (error) {
    console.log(error);
  }
};
