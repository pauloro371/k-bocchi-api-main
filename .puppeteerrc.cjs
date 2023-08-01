const {join} = require('path');
//ESTE ARCHIVO TIENE QUE IR EN LA RAIZ
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};