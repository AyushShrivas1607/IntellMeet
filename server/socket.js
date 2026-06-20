const socketio = require("socket.io");
const Message = require("./models/Message");

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
      console.log("joinRoom event:", socket.id, roomId);

      socket.join(roomId);

      if (!roomUsers[roomId]) {
        roomUsers[roomId] = new Set();
      }

      roomUsers[roomId].add(socket.id);

      io.to(roomId).emit(
        "participantsUpdate",
        roomUsers[roomId].size
      );

      console.log(
        `User ${socket.id} joined room ${roomId}`
      );

      io.to(roomId).emit("notification", {
        message: `User ${socket.id} joined the meeting`,
      });
    });

   socket.on("sendMessage", async (data) => {
  try {
    const newMessage = await Message.create({
      roomId: data.roomId,
      sender: data.sender || "Anonymous",
      message: data.message,
    });

    io.to(data.roomId).emit(
      "receiveMessage",
      newMessage
    );
  } catch (error) {
    console.error(
      "Message Save Error:",
      error
    );
  }
});

    socket.on("disconnect", () => {
      Object.keys(roomUsers).forEach((roomId) => {
        if (roomUsers[roomId]) {
          roomUsers[roomId].delete(socket.id);

          io.to(roomId).emit(
            "participantsUpdate",
            roomUsers[roomId].size
          );

          io.to(roomId).emit("notification", {
            message: `User ${socket.id} left the meeting`,
          });

          if (roomUsers[roomId].size === 0) {
            delete roomUsers[roomId];
          }
        }
      });

      console.log(
        "User Disconnected:",
        socket.id
      );
    });
  });
};

module.exports = { initSocket };