import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function MeetingRoom() {
  const roomId = "6HZN0J";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket.emit("joinRoom", roomId);

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data.message]);
    };

    const handleParticipants = (count) => {
      setParticipants(count);
    };

    const handleNotification = (data) => {
      setNotifications((prev) => [
        ...prev,
        data.message,
      ]);
    };

    socket.on("receiveMessage", handleMessage);
    socket.on("participantsUpdate", handleParticipants);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.off("participantsUpdate", handleParticipants);
      socket.off("notification", handleNotification);
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      message,
    });

    setMessage("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Meeting Room</h1>

      <h3>Meeting Code: {roomId}</h3>

      <h3>
        Participants Online: {participants}
      </h3>

      <input
        type="text"
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>
        Send
      </button>

      <hr />

      <h3>Notifications</h3>

      <ul>
        {notifications.map((note, index) => (
          <li key={index}>{note}</li>
        ))}
      </ul>

      <hr />

      <h3>Chat Messages</h3>

      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default MeetingRoom;