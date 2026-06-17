import { useEffect } from "react";
import { io } from "socket.io-client";

function SocketTest() {
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected:", socket.id);

      socket.emit("joinRoom", "meeting123");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Socket Connected</h2>
    </div>
  );
}

export default SocketTest;