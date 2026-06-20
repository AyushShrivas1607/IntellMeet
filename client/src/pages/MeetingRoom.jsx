import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

function MeetingRoom() {
  const roomId = "6HZN0J";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket.emit("joinRoom", roomId);

    const loadMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${roomId}`
        );

        console.log("Loaded Messages:", res.data);

        setMessages(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    loadMessages();

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
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
      sender: "Abc",
      message,
    });

    setMessage("");
  };
  console.log("Current messages state:", messages);
  console.log("First message:", messages[0]);

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

<p>Total Messages: {messages.length}</p>

{messages.length === 0 ? (
  <p>No messages found</p>
) : (
  <ul>
    {messages.map((msg) => (
      <li key={msg._id}>
        <strong>{msg.sender}</strong>: {msg.message}
      </li>
    ))}
  </ul>
)}
    </div>
  );
}

export default MeetingRoom;