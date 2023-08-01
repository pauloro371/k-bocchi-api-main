const { Server } = require("socket.io");
const {
  obtenerFechaActualMexico,
  obtenerFechaComponent,
  obtenerFechaHoraComponent,
} = require("../utils/fechas");
const Mensaje = require("../Models/Mensaje");
const Usuario = require("../Models/Usuario");
const { generarNotificacion } = require("../utils/notificaciones");
const Sala = require("../Models/Sala");
const { ROLES } = require("../roles");
let connectedUsers = [];
let salasActivas = {};
const addUsuarioConectado = (usuario) => {
  let x = connectedUsers.find((u) => usuario.id == u.id);
  if (!x) connectedUsers.push(usuario);
};
const removeUsuario = (usuario) => {
  let u = connectedUsers.filter((u) => usuario.id != u.id);
  connectedUsers = [...u];
};
function initServer(httpServer) {
  // console.log(httpServer);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });
  io.of("/").adapter.on("create-room", (room) => {
    console.log(`\n\rLa sala ${room} fue creada\n\r`);
  });
  //Cuando una sala de socketio queda vacía o se destruye se ejecuta este evento (puede ser no solo al salir de la videollamada, también cuando un usuario sale de la webapp)
  io.of("/").adapter.on("delete-room", async (room) => {
    console.log(`\n\rLa sala: ${room} fue borrada\n\r`);
    //Cuando una sala queda vac
    //Buscamos en las salasActivas de videollamada si la sala que se destuyo existe
    let sala = salasActivas[room];
    //si existe, entonces la eliminamos del objeto salasActivas y en la base de datos indicamos que la sala esta vacía
    if (sala) {
      console.log("La sala de videochat: ", room, " fue vaciada");
      delete salasActivas[room];
      console.log({ salasActivas });
      await Sala.query().findOne({ codigo_acceso: room }).patch({ isEmpty: 1 });
    }
  });
  io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`\n\rSocket con ${id} ha entrado a la sala ${room}\n\r`);
  });
  io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`\n\rSocket con ${id} ha salido de la sala ${room}\n\r`);
  });
  io.on("connection", (socket) => {
    //Cuando la conexión del usuario al server de websockets es correcta, se emite un evento para indicarle que puede mandar sus datos
    socket.emit("connected", "ok");
    //El server escucha por un evento "send_data" que contenga los datos id y nombre del usuario.
    socket.on("send_data", ({ id, nombre }) => {
      socket.data = {
        ...socket.data,
        id,
        nombre,
      };
      // connectedUsers.add(`${socket.data.id}|${socket.data.nombre}`);
      addUsuarioConectado({ ...socket.data });

      console.log(
        `CONECTADO:\n\rSOCKET_ID: ${socket.id}\n\rSOCKET_UID(ID_USUARIO):${socket.data.id}`
      );
      socket.broadcast.emit("usuario:conectado", { ...socket.data });
      console.log("\n\rUSUARIOS CONECTADOS: \n\r", connectedUsers);
      socket.join(id);
    });
    socket.on("chat:entrar", async () => {
      socket.emit("usuario:lista", [...connectedUsers]);
    });
    socket.on("mensajes:enviar", async ({ to, contenido }) => {
      //hacer algo para guardar mensaje
      //enviarlo al destinatario
      console.log({ to, contenido });
      let mensaje = {
        id_from: socket.data.id,
        id_to: to,
        contenido: contenido,
      };

      let { id, fecha, id_to } = await Mensaje.query().insertAndFetch(mensaje);
      let { foto_perfil } = await Usuario.query().findById(socket.data.id);
      generarNotificacion({
        contexto_movil: "chat",
        contexto_web: "/app/chat",
        descripcion: `${socket.data.nombre} dice: ${contenido}`,
        titulo: "Nuevo mensaje",
        id_usuario: id_to,
      });
      io.to([to, socket.data.id]).emit("mensajes:recibido", {
        id,
        id_from: socket.data.id,
        id_to: id_to,
        nombre: socket.data.nombre,
        contenido,
        fecha,
        foto_perfil,
        // from: socket.data.id,
      });
    });

    //Este evento se ejecuta cada vez que un usuario entra a una sala para videollamada
    socket.on("videochat:entrar", async ({ peer_id, codigo_acceso, rol }) => {
      //Metemos el socket a la sala. Como identificador de sala en socketio usamos el codigo_acceso
      socket.join(codigo_acceso);
      /**
       * Posteriormente, en el objeto de salasActivas actualizamos para incluir el usuario recién conectado
       * ej de como se ve el objeto
       * salasActivas:{
       *  DqtiKedD:{
       *    paciente: "78220c95-2a32-4851-91e8-360de450d5c9"
       *    fisioterapeuta: undefined
       *  }
       *  X4doHTwX:{
       *    fisioterapeuta: "acb632b9-b34a-4762-abe6-ec644f6a4134"
       *    paciente: undefined
       *  }
       * }
       * Como se ve, cada propiedad del objeto salasActivas es un codigo de acceso
       * meintras que las propiedes paciente y fisioterapeuta cada una guarda respectivamente
       * el peer_id de cada participante de la videollamada. Si aún no se conecta, aparece como undefined
       *
       * Nota: peer_id es el identificador que la sesion del usuario recibe en peerjs, este id se usa
       * para poder enlazar a los usuarios para la videollamada
       *
       * Mediante el spread operator (...) nos aseguramos que a la hora de realizar la asignación,
       * se mantengan los valores previos del objeto en cuestión
       */
      salasActivas[codigo_acceso] = {
        ...salasActivas[codigo_acceso],
        [rol]: peer_id,
      };
      console.log(salasActivas);
      //connectedPeerId es el peer id del otro usuario conectado en la videollamada
      let connectedPeerId;
      //connectedPeerRol es el rol del otro usuario conectado en la videollamada
      let connectedPeerRol;
      //Si el usuario es igual a paciente, entonces el connectedPeerRol será fisioterapeuta
      if (rol === ROLES.PACIENTE) {
        connectedPeerRol = ROLES.FISIOTERAPEUTA;
        //y viceversa
      } else {
        connectedPeerRol = ROLES.PACIENTE;
      }
      //Con el connectedPeerRol podemos obtener el peer_id del otro usuario conectado en la sala
      connectedPeerId = salasActivas[codigo_acceso][connectedPeerRol];
      //Una vez obtenido el peer_id del otro usuario se lo mandamos al usuario que recien se conecto
      socket.emit("videochat:nuevaConexion", {
        peer_id: connectedPeerId,
        rol: connectedPeerRol,
      });
      //Y para el usuario que ya estaba conectado, hacemos lo mismo.
      socket.broadcast
        .to(codigo_acceso)
        .emit("videochat:nuevaConexion", { peer_id, rol });
      //En la base de datos indicamos que la sala en cuestión ya no esta vacía
      await Sala.query().findOne({ codigo_acceso }).patch({ isEmpty: 0 });
    });

    //Este evento se ejecuta cada vez que un usuario desea salir de la videollamada
    socket.on("videochat:salir", async ({ codigo_acceso, rol }) => {
      console.log(`El ${rol} de la sala ${codigo_acceso} ha salido`);

      //Sacamos al usuario de la sala
      socket.leave(codigo_acceso);
      //Modificamos las salas activas para indicar que el usuario ya no esta
      salasActivas[codigo_acceso] = {
        ...salasActivas[codigo_acceso],
        [rol]: undefined,
      };
      // console.log(salasActivas);
      //A los demás usuarios de la sala les hacemos saber que ha salido el usuario
      io.to(codigo_acceso).emit("videochat:salir", { rol });
      //Actualizamos la última hora de desconexión de la sala en la base de datos
      await Sala.query()
        .findOne({ codigo_acceso })
        .patch({ fecha_ultima_desconexion: obtenerFechaActualMexico() });
    });
    socket.on("disconnecting", async () => {
      let sockets = await io.in("room").fetchSockets();
      // connectedUsers.forEach((user) => {
      //   if (user.id === socket.data.id) connectedUsers.delete(user);
      // });
      removeUsuario({ ...socket.data });
      socket.broadcast.emit("usuario:desconectado", { ...socket.data });
      console.log("\n\rUSUARIOS CONECTADOS: \n\r", connectedUsers);
      console.log(sockets);
    });
  });
}

module.exports = {
  initServer,
};
