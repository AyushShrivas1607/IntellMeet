const socketio = require("socket.io");

let io;

const initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);

      console.log(
        `User ${socket.id} joined room ${roomId}`
      );
    });

    socket.on("sendMessage", (data) => {
      io.to(data.roomId).emit(
        "receiveMessage",
        data
      );
    });

    socket.on("disconnect", () => {
      console.log(
        "User Disconnected:",
        socket.id
      );
    });
  });
};

module.exports = {
  initSocket,
};