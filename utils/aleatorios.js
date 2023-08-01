const crypto = require('crypto');

function generarNumeroAleatorio(min, max) {
  const byteArray = crypto.randomBytes(4);
  const randomNumber = Math.abs(byteArray.readUInt32BE(0));
  return min + (randomNumber % (max - min + 1));
}

module.exports={
    generarNumeroAleatorio
}