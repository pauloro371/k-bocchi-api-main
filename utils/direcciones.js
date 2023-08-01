exports.obtenerComponentesDireccion = (direccion) => {
  const componentes = direccion.split(",");
  let calleNumero = componentes[0].trim();
  let { calle, numero } = descomponerCalleNumero(calleNumero);
  //   let colonia = componentes[1]?.trim();
  let { codigoPostal, ciudad } = descomponerCodigoPostalCiudad(
    componentes[2]?.trim()
  );
  let estado = componentes[3]?.trim();
  let pais = componentes[4]?.trim();

  return {
    calle,
    numero,
    // colonia,
    codigoPostal,
    ciudad,
    estado,
    pais,
  };
};

function descomponerCalleNumero(calleNumero) {
  const separador = " ";
  const ultimoEspacio = calleNumero.lastIndexOf(separador);
  const nombreCalle = calleNumero.substring(0, ultimoEspacio);
  const numero = calleNumero.substring(ultimoEspacio + 1);
  return { calle: nombreCalle, numero };
}
function descomponerCodigoPostalCiudad(cp) {
  if (cp === undefined) return;
  const separador = " ";
  const [codigoPostal, ciudad] = cp.split(separador);
  return { codigoPostal, ciudad };
}
