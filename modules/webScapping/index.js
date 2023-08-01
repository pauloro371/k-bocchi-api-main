/**
 * Para el web scrapper se uso puppeteer.
 * Puppeteer es una librería para hacer web scrapping y testing de páginas web
 * Lo más importante de entender de puppeteer es:
 *  - Usa un "navegador virtual", que es una version de testing de google chrome
 *  - El código se puede dividir en dos partes:
 *    - El código que se corre en el servidor
 *    - El código que se ejecuta en la consola del navegador virtual
 *  - Ambos códigos se pueden pasar información entre sí
 */
const puppeteer = require("puppeteer");
const fs = require("fs/promises");
async function scrapCedula(numero_cedula) {
  let browser;
  let page;
  try {
    //Primero se "lanza" el navegador virtual. headless significa que se lanza sin interfaz gráfica
    //Esta instancia del navegador se guarda en browser
    browser = await puppeteer.launch({ headless: true });
    //Luego se crea una nueva página/pestaña en el navegador
    page = await browser.newPage();
    //En esa página creada se navega a la url de donde se sacan las cedulas
    //El timeout es la cantidad de tiempo máxima que el navegador puede tardar en navegar a la página sin que tire error
    await page.goto(
      "https://www.cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action",
      { timeout: 180000 }
    );

    //La función evaluate recibe un script que se va a ejecutar en la consola del navegador virtual
    //En este caso mediante querySelector se obtiene el elemento html que permite mostrar el menu para buscar una cedula, y se le da click
    await page.evaluate(() =>
      document
        .querySelector(
          "#subenlaces > ul > li:nth-child(2) > ul > li:nth-child(2) > a"
        )
        .click()
    );
    //Una vez se le da click, selecciona el elemento html con la id "idCedula". Este elemento es un input del formulario del buscador de cedulas
    //Lo selecciona y escribe el numero de cedula
    await page.type("#idCedula", `${numero_cedula}`);
    //Una vez escrito, de vuelta en la consola se obtiene el elemento con la id "dijit_form_Button_1_label" y se le da click
    //Este elemento, es el boton de buscar
    await page.evaluate(() =>
      document.querySelector("#dijit_form_Button_1_label").click()
    );
  } catch (err) {
    //Si cualquier parte de esta porción del script falla, se cierra la página y el navegador, a la par de que se retorna una respuesta apropiada
    let response = {
      error: "Hemos fallado al intentar validar tu cedula, intenta más tarde",
    };
    console.log(err);
    if (page) page.close();
    if (browser) browser.close();
    return response;
  }
  //3339300
  //3339201
  try {
    //Una vez se realizo la busqueda se selecciona el elemento html con la id "custom_MyDialog_0"
    //Este elemento html solo aparece cuando no se ha encontrado la cedula ingresada
    await page.waitForSelector("#custom_MyDialog_0", { timeout: 5000 });
    console.log("No se encontro nada");
    let response = {
      mensaje: "No se encontro la cedula",
    };
    //Por lo tanto regresa una respuesta apropiada y cierra los recursos creados.
    page.close();
    browser.close();
    return response;
  } catch (err) {
    //Si el elemento con el id "custom_MyDialog_0" no se encontro, quiere decir que la cedula si existe
    console.log("Se encontro algo");
    //Se busca los datos obtenidos en la página y se guardan en data
    let data = await page.evaluate(() => {
      //Para esto, la consola del navegador virtual obtiene la fila con los datos de la cedula
      let dataCols = document.querySelector(
        "#dojox_grid__View_1 > div > div > div > div.dojoxGridRow.dojoxGridRow > table > tbody > tr"
      );
      //Se crea un array con los datos de la fila
      let childNodes = Array.from(dataCols.childNodes);
      //Y se obtiene la propiedad innerText de cada elemento del array. innerText son los datos de cada columna de la fila
      let array = childNodes.map((col) => col.innerText);
      //Retornamos los datos obtenidos
      return array;
    });

    console.log("SCRAPPED DATA: ", data);
    let response = {
      numero_cedula: data[0],
      nombre: data[1],
      apellido_paterno: data[2],
      apellido_materno: data[3],
      tipo: data[4],
    };
    //Una vez realizado todo esto, se cierran los recursos y se retornan los datos obtenidos
    console.log("RESPONSE: ", response);
    page.close();
    browser.close();
    return response;
  }
}

module.exports = {
  scrapCedula,
};
