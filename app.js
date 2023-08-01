
require("dotenv").config();
const fs = require("fs");

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var indexRouter = require("./routes/index");
var usuario = require("./routes/usuario");
var utilidadesRouter = require("./routes/utilidades");
var citasRouter = require("./routes/citas");
var notasRouter = require("./routes/notas");
var mensajesRouter = require("./routes/mensajes");
var notificacionesRouter = require("./routes/notificaciones");
var comentariosRouter = require("./routes/comentario");
var resenasRouter = require("./routes/resenas");
var registrationTokens = require("./routes/registrationTokens");
var productosRouter = require("./routes/productos");
var carritoRouter = require("./routes/carrito");
var pagosRouter = require("./routes/pagos");
var ticketRouter = require("./routes/ticket");
var enviosRouter = require("./routes/envios");
var paquetesRouter = require("./routes/paquetes");
var ventasRouter = require("./routes/ventas");
var salasRouter = require("./routes/sala");
var fileUpload = require("express-fileupload");
var { knex } = require("./setup/knexfile");

var { Model } = require("objection");
Model.knex(knex);
const swaggerUI = require("swagger-ui-express");
const swaggerJSDOC = require("swagger-jsdoc");
const swaggerSpec = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "K-Bocchi API",
      description:
        "API para interactuar con la base de datos y sistemas relacionados",
      version: "1.0.0",
    },
  },
  apis: [`${path.join(__dirname, "./routes/*.js")}`],
};
var app = express();

const admin = require("firebase-admin");
const serviceAccount = require("./kbocchi-1254b-firebase-adminsdk-9ltt9-16cf6fa56d.json");
const { validateCedula } = require("./modules/vision/cloudVision");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL
});

app.locals.bucket = admin.storage().bucket();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(fileUpload());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use("/utilidades", utilidadesRouter);
app.use("/usuarios", usuario);
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDOC(swaggerSpec)));
app.use("/citas", citasRouter);
app.use("/notas", notasRouter);
app.use("/mensajes", mensajesRouter);
app.use("/notificaciones", notificacionesRouter);
app.use("/comentarios", comentariosRouter);
app.use("/resenas", resenasRouter);
app.use("/productos", productosRouter);
app.use("/fcmtokens", registrationTokens);
app.use("/carrito", carritoRouter);
app.use("/pagos", pagosRouter);
app.use("/envios", enviosRouter);
app.use("/ticket", ticketRouter);
app.use("/paquetes", paquetesRouter);
app.use("/ventas", ventasRouter);
app.use("/salas", salasRouter);
app.use("/", indexRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
