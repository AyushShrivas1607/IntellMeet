const socketio = require("socket.io");
const Message = require("./models/Message");

const roomUsers = {}; // { roomId: [{id, name, socketId}] }

let io;

const initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // =========================
    // JOIN ROOM
    // =========================
    socket.on("joinRoom", ({ roomId, user }) => {
      if (!roomId || !user?.id) return;

      socket.join(roomId);

      if (!roomUsers[roomId]) roomUsers[roomId] = [];

      const exists = roomUsers[roomId].some((u) => u.id === user.id);

      if (!exists) {
        roomUsers[roomId].push({
          id: user.id,
          name: user.name || "Anonymous",
          socketId: socket.id,
        });
      }

      // send list for WebRTC
      const otherSockets = roomUsers[roomId]
        .filter((u) => u.socketId !== socket.id)
        .map((u) => u.socketId);

      socket.emit("all-users", otherSockets);

      io.to(roomId).emit("participantsUpdate", roomUsers[roomId]);

      io.to(roomId).emit("notification", {
        message: `${user.name} joined the meeting`,
      });
    });

    // =========================
    // CHAT
    // =========================
    socket.on("sendMessage", async (data) => {
      if (!data?.roomId || !data?.message) return;

      const msg = await Message.create({
        roomId: data.roomId,
        sender: data.sender || "Anonymous",
        message: data.message,
      });

      io.to(data.roomId).emit("receiveMessage", msg);
    });

    // =========================
    // WEBRTC SIGNALING
    // =========================
    socket.on("sendingSignal", ({ userToSignal, signal }) => {
      io.to(userToSignal).emit("user-joined", {
        signal,
        callerId: socket.id,
      });
    });

    socket.on("returningSignal", ({ signal, callerId }) => {
      io.to(callerId).emit("receivingReturnedSignal", {
        signal,
        id: socket.id,
      });
    });

    // =========================
    // LEAVE ROOM (CLEAN)
    // =========================
    socket.on("leaveRoom", ({ roomId, userId }) => {
      if (!roomUsers[roomId]) return;

      roomUsers[roomId] = roomUsers[roomId].filter(
        (u) => u.id !== userId
      );

      io.to(roomId).emit(
        "participantsUpdate",
        roomUsers[roomId]
      );

      io.to(roomId).emit("notification", {
        message: `User left the meeting`,
      });

      if (roomUsers[roomId].length === 0) {
        delete roomUsers[roomId];
      }
    });

    // =========================
    // DISCONNECT SAFE CLEANUP
    // =========================
    socket.on("disconnect", () => {
      for (const roomId in roomUsers) {
        roomUsers[roomId] = roomUsers[roomId].filter(
          (u) => u.socketId !== socket.id
        );

        io.to(roomId).emit(
          "participantsUpdate",
          roomUsers[roomId]
        );

        if (roomUsers[roomId].length === 0) {
          delete roomUsers[roomId];
        }
      }

      console.log("User Disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket };