const socketio = require("socket.io");
const Message = require("./models/Message");

const roomUsers = {};
const recordingState = {}; // roomId -> { isRecording, startedAt }
let io;

const initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Connected: ${socket.id}`);

    // =========================
    // JOIN ROOM
    // =========================
    socket.on("joinRoom", ({ roomId, user }) => {
      if (!roomId || !user) return;

      socket.join(roomId);

      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }

      const existing = roomUsers[roomId].find(
        (u) => u.socketId === socket.id
      );

      if (!existing) {
        // First person to join a room becomes the host
        const isHost = roomUsers[roomId].length === 0;

        roomUsers[roomId].push({
          id: user.id,
          name: user.name,
          socketId: socket.id,
          isHost,
          handRaised: false,
        });
      }

      const otherUsers = roomUsers[roomId]
        .filter((u) => u.socketId !== socket.id)
        .map((u) => u.socketId);

      socket.emit("all-users", otherUsers);

      // Sync new joiner with current recording state, if any
      if (recordingState[roomId]) {
        socket.emit("recordingStateChanged", recordingState[roomId]);
      }

      io.to(roomId).emit("participantsUpdate", roomUsers[roomId]);
    });

    // =========================
    // CHAT
    // =========================
    socket.on("sendMessage", async (data) => {
      if (!data.roomId || !data.message) return;

      const message = await Message.create({
        roomId: data.roomId,
        sender: data.sender,
        message: data.message,
      });

      io.to(data.roomId).emit("receiveMessage", message);
    });

    // =========================
    // WEBRTC SIGNALING
    // =========================
    socket.on("sendingSignal", (payload) => {
      io.to(payload.userToSignal).emit("user-joined", {
        signal: payload.signal,
        callerId: socket.id,
      });
    });

    socket.on("returningSignal", (payload) => {
      io.to(payload.callerId).emit("receivingReturnedSignal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    // =========================
    // RAISE / LOWER HAND
    // =========================
    socket.on("toggleHand", ({ roomId }) => {
      const room = roomUsers[roomId];
      if (!room) return;

      const u = room.find((u) => u.socketId === socket.id);
      if (!u) return;

      u.handRaised = !u.handRaised;
      io.to(roomId).emit("participantsUpdate", room);
    });

    // =========================
    // HOST: MUTE ALL
    // =========================
    socket.on("muteAll", ({ roomId }) => {
      const room = roomUsers[roomId];
      if (!room) return;

      const requester = room.find((u) => u.socketId === socket.id);
      if (!requester?.isHost) return; // only the host can do this

      room.forEach((u) => {
        if (u.socketId !== socket.id) {
          io.to(u.socketId).emit("forceMute");
        }
      });
    });

    // =========================
    // HOST: MUTE ONE PARTICIPANT
    // =========================
    socket.on("muteParticipant", ({ roomId, targetSocketId }) => {
      const room = roomUsers[roomId];
      if (!room) return;

      const requester = room.find((u) => u.socketId === socket.id);
      if (!requester?.isHost) return;

      io.to(targetSocketId).emit("forceMute");
    });

    // =========================
    // HOST: TOGGLE RECORDING (UI-only signal, broadcast to room)
    // =========================
    socket.on("toggleRecording", ({ roomId }) => {
      const room = roomUsers[roomId];
      if (!room) return;

      const requester = room.find((u) => u.socketId === socket.id);
      if (!requester?.isHost) return; // only the host can start/stop

      if (!recordingState[roomId]) {
        recordingState[roomId] = { isRecording: false, startedAt: null };
      }

      const state = recordingState[roomId];
      state.isRecording = !state.isRecording;
      state.startedAt = state.isRecording ? Date.now() : null;

      io.to(roomId).emit("recordingStateChanged", state);
    });

    // =========================
    // LEAVE ROOM
    // =========================
    socket.on("leaveRoom", ({ roomId }) => {
      handleLeave(roomId, socket.id);
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.id}`);

      Object.keys(roomUsers).forEach((roomId) => {
        const wasInRoom = roomUsers[roomId].some(
          (u) => u.socketId === socket.id
        );
        if (wasInRoom) handleLeave(roomId, socket.id);
      });
    });

    // Shared leave logic — removes user, reassigns host if needed
    const handleLeave = (roomId, socketId) => {
      if (!roomUsers[roomId]) return;

      const wasHost = roomUsers[roomId].find(
        (u) => u.socketId === socketId
      )?.isHost;

      roomUsers[roomId] = roomUsers[roomId].filter(
        (u) => u.socketId !== socketId
      );

      // If the host left and people remain, promote the next-oldest participant
      if (wasHost && roomUsers[roomId].length > 0) {
        roomUsers[roomId][0].isHost = true;
      }

      socket.leave(roomId);
      io.to(roomId).emit("userLeft", socketId);
      io.to(roomId).emit("participantsUpdate", roomUsers[roomId]);

      if (roomUsers[roomId].length === 0) {
        delete roomUsers[roomId];
        delete recordingState[roomId];
      }
    };
  });
};

module.exports = { initSocket };