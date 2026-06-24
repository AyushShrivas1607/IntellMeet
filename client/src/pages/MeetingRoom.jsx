import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Peer from "simple-peer";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

function MeetingRoom() {
  const { meetingCode } = useParams();
  const roomId = meetingCode;

  // ================= CHAT =================
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);

  // ================= VIDEO =================
  const myVideo = useRef(null);
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);

  // ================= CONTROLS =================
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // ================= JOIN ROOM =================
  useEffect(() => {
    if (!roomId) return;

    socket.emit("joinRoom", {
      roomId,
      user: {
        id: localStorage.getItem("userId"),
        name: localStorage.getItem("userName") || "Anonymous",
      },
    });

    axios
      .get(`http://localhost:5000/api/messages/${roomId}`)
      .then((res) => setMessages(res.data))
      .catch(console.error);

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("participantsUpdate", (users) => {
      setParticipants(users);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("participantsUpdate");
    };
  }, [roomId]);

  // ================= CAMERA =================
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch(console.error);
  }, []);

  // ================= WEBRTC =================
  useEffect(() => {
    if (!stream) return;

    socket.on("all-users", (users) => {
      const peersArray = [];

      users.forEach((userId) => {
        const peer = createPeer(userId, stream);

        peersRef.current.push({ peerID: userId, peer });
        peersArray.push(peer);
      });

      setPeers(peersArray);
    });

    socket.on("user-joined", ({ signal, callerId }) => {
      const peer = addPeer(signal, callerId, stream);

      peersRef.current.push({ peerID: callerId, peer });
      setPeers((prev) => [...prev, peer]);
    });

    socket.on("receivingReturnedSignal", ({ signal, id }) => {
      const item = peersRef.current.find((p) => p.peerID === id);
      if (item) item.peer.signal(signal);
    });

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receivingReturnedSignal");

      peersRef.current = [];
      setPeers([]);
    };
  }, [stream]);

  // ================= PEER HELPERS =================
  const createPeer = (userToSignal, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sendingSignal", { userToSignal, signal });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returningSignal", { signal, callerId });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  // ================= CHAT =================
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      sender: localStorage.getItem("userName") || "Anonymous",
      message,
    });

    setMessage("");
  };

  // ================= CONTROLS =================
  const toggleAudio = () => {
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setAudioEnabled((p) => !p);
  };

  const toggleVideo = () => {
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setVideoEnabled((p) => !p);
  };

  const shareScreen = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    peersRef.current.forEach(({ peer }) => {
      const sender = peer._pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
    });

    screenTrack.onended = () => window.location.reload();
  };

  const endMeeting = () => {
    socket.emit("leaveRoom", { roomId });
    window.location.href = "/";
  };

  // ================= VIDEO =================
  const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
      peer.on("stream", (stream) => {
        ref.current.srcObject = stream;
      });
    }, [peer]);

    return (
      <video
        playsInline
        autoPlay
        ref={ref}
        style={{ width: "250px", margin: "5px" }}
      />
    );
  };

  // ================= UI =================
  return (
    <div style={{ padding: "20px" }}>
      <h1>Meeting Room</h1>
      <h3>Code: {roomId}</h3>

      <h3>Participants: {participants.length}</h3>

      {/* VIDEO */}
      <video
        muted
        ref={myVideo}
        autoPlay
        playsInline
        style={{ width: "250px" }}
      />

      {/* CONTROLS */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={toggleAudio}>
          {audioEnabled ? "Mute 🎤" : "Unmute 🔊"}
        </button>

        <button onClick={toggleVideo}>
          {videoEnabled ? "Stop Camera 📷" : "Start Camera 📷"}
        </button>

        <button onClick={shareScreen}>Share Screen 🖥️</button>

        <button onClick={endMeeting} style={{ background: "red", color: "white" }}>
          End Meeting ❌
        </button>
      </div>

      {/* PEERS */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {peers.map((peer, i) => (
          <Video key={i} peer={peer} />
        ))}
      </div>

      {/* CHAT */}
      <hr />

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>

      <h3>Messages</h3>
      {messages.map((m) => (
        <p key={m._id}>
          <b>{m.sender}</b>: {m.message}
        </p>
      ))}
    </div>
  );
}

export default MeetingRoom;