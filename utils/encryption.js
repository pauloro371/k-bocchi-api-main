const crypto = require("crypto");

const secret = process.env.SECRET_KEY;
const iv = process.env.SECRET_IV;
const method = process.env.ENCRYPTION_METHOD;

if (!secret || !iv || !method) {
  throw new Error("Se requiere: secret key, iv y method");
}

const key = crypto
  .createHash("sha512")
  .update(secret)
  .digest("hex")
  .substring(0, 32);

const encryptionIV = crypto
  .createHash("sha512")
  .update(iv)
  .digest("hex")
  .substring(0, 16);

//Para la función de encriptar se usa la librería crypto.
/**
 * El método de encriptación usado aes necesita dos cosas:
 *  key: Es la llave privada que permite encriptar y desencriptar los datos
 *  iv: Es una "semilla" que permite agregar otra capa de seguridad a la encriptación
 * */
const encriptar = (dato) => {
  /**
   * Primero se crea un objeto cipher, que es un objeto que permite encriptar los datos
   * usando la llave y la iv proporcionados
   * */
  const cipher = crypto.createCipheriv(method, key, encryptionIV);
  //Luego se crea un objeto Buffer a partir de lo que retorna la función update de cipher
  //update retorna un string con una representación hexadecimal de los datos cifrados
  //Luego se llama a la función toString y ahora se crea una representación en base64 del string
  return Buffer.from(
    cipher.update(dato, "utf8", "hex") + cipher.final("hex")
  ).toString("base64");
};
const desencriptar = (dato) => {
  /**
   * Para desencriptar, primero se crea un buffer con los datos recibidos, y se indica
   * que "dato" esta en formato base64
   * */
  const buffer = Buffer.from(dato, "base64");
  /**
   * Luego se desencripta con la llave e iv
   *
   * */
  const decipher = crypto.createDecipheriv(method, key, encryptionIV);
  /**
   * Finalmente, mediante la función update de decipher se obtiene los datos desencriptados
   * Aquí también se usa la función toString, para indicar que se requieren los datos en
   * formato utf8, que es el sistema original en el que "dato" estaba
   */
  return (
    decipher.update(buffer.toString("utf8"), "hex", "utf8") +
    decipher.final("utf8")
  );
};

module.exports = {
  encriptar,
  desencriptar,
};
