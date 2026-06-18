const socketio = require("socket.io");

const roomUsers = {};

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

      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }

      if (!roomUsers[roomId].includes(socket.id)) {
  roomUsers[roomId].push(socket.id);
}

      io.to(roomId).emit(
        "participantsUpdate",
        roomUsers[roomId].length
      );

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
      Object.keys(roomUsers).forEach((roomId) => {
        roomUsers[roomId] = roomUsers[roomId].filter(
          (id) => id !== socket.id
        );

        io.to(roomId).emit(
          "participantsUpdate",
          roomUsers[roomId].length
        );
      });

      console.log("User Disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket };