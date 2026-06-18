import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function MeetingRoom() {
  const roomId = "6HZN0J";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
  socket.emit("joinRoom", roomId);

  socket.on("receiveMessage", (data) => {
    setMessages((prev) => [...prev, data.message]);
  });

  socket.on("participantsUpdate", (count) => {
    setParticipants(count);
  });

  return () => {
    socket.off("receiveMessage");
  };
}, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      message,
    });

    setMessage("");
  };

  return (
    <div>
      <h1>Meeting Room</h1>

      <h3>Meeting Code: {roomId}</h3>
      <h3>Participants Online: {participants}</h3>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>
        Send
      </button>

      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default MeetingRoom;