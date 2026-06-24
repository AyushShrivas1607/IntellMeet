import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import axios from "axios";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

function MeetingRoom() {
  const { meetingCode } = useParams();

  const roomId = meetingCode;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const myVideo = useRef();
  const peersRef = useRef([]);

  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((currentStream) => {
        setStream(currentStream);

        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("joinRoom", {
      roomId,
      user: {
        id:
          localStorage.getItem("userId") ||
          `demo-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
        name:
          localStorage.getItem("userName") ||
          "Ayush",
      },
    });

    axios
      .get(
        `http://localhost:5000/api/messages/${roomId}`
      )
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

  useEffect(() => {
    if (!stream) return;

    socket.on("all-users", (users) => {
      const peersArray = [];

      users.forEach((userId) => {
        const peer = createPeer(
          userId,
          stream
        );

        peersRef.current.push({
          peerID: userId,
          peer,
        });

        peersArray.push(peer);
      });

      setPeers(peersArray);
    });

    socket.on(
      "user-joined",
      ({ signal, callerId }) => {
        const peer = addPeer(
          signal,
          callerId,
          stream
        );

        peersRef.current.push({
          peerID: callerId,
          peer,
        });

        setPeers((prev) => [
          ...prev,
          peer,
        ]);
      }
    );

    socket.on(
      "receivingReturnedSignal",
      ({ signal, id }) => {
        const item =
          peersRef.current.find(
            (p) => p.peerID === id
          );

        if (item) {
          item.peer.signal(signal);
        }
      }
    );

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off(
        "receivingReturnedSignal"
      );
    };
  }, [stream]);

  const createPeer = (
    userToSignal,
    stream
  ) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sendingSignal", {
        userToSignal,
        signal,
      });
    });

    return peer;
  };

  const addPeer = (
    incomingSignal,
    callerId,
    stream
  ) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returningSignal", {
        signal,
        callerId,
      });
    });

    peer.signal(incomingSignal);

    return peer;
  };
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      sender:
        localStorage.getItem("userName") ||
        "Anonymous",
      message,
    });

    setMessage("");
  };

  const toggleAudio = () => {
    if (!stream) return;

    stream
      .getAudioTracks()
      .forEach((track) => {
        track.enabled = !track.enabled;
      });

    setAudioEnabled((prev) => !prev);
  };

  const toggleVideo = () => {
    if (!stream) return;

    stream
      .getVideoTracks()
      .forEach((track) => {
        track.enabled = !track.enabled;
      });

    setVideoEnabled((prev) => !prev);
  };

  const shareScreen = async () => {
    try {
      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

      const screenTrack =
        screenStream.getVideoTracks()[0];

      peersRef.current.forEach(
        ({ peer }) => {
          const sender =
            peer._pc
              ?.getSenders()
              ?.find(
                (s) =>
                  s.track?.kind === "video"
              );

          if (sender) {
            sender.replaceTrack(
              screenTrack
            );
          }
        }
      );

      screenTrack.onended = () => {
        window.location.reload();
      };
    } catch (error) {
      console.error(error);
    }
  };

  const endMeeting = () => {
    socket.emit("leaveRoom", {
      roomId,
      userId:
        localStorage.getItem("userId") ||
        "demo-user",
    });

    window.location.href = "/";
  };

  const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
      peer.on("stream", (stream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      });
    }, [peer]);

    return (
      <video
        playsInline
        autoPlay
        ref={ref}
        style={{
          width: "280px",
          borderRadius: "12px",
          background: "#000",
        }}
      />
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to right,#eef2ff,#f8fafc)",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h1>🎥 IntellMeet</h1>

        <h3>
          Meeting Code: {roomId}
        </h3>

        <h3>
          Participants:
          {" "}
          {participants.length}
        </h3>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={toggleAudio}>
          {audioEnabled
            ? "Mute 🎤"
            : "Unmute 🔊"}
        </button>

        <button onClick={toggleVideo}>
          {videoEnabled
            ? "Stop Camera 📷"
            : "Start Camera 📷"}
        </button>

        <button onClick={shareScreen}>
          Share Screen 🖥️
        </button>

        <button
          onClick={endMeeting}
          style={{
            background: "red",
            color: "white",
          }}
        >
          End Meeting ❌
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <video
          muted
          ref={myVideo}
          autoPlay
          playsInline
          style={{
            width: "280px",
            borderRadius: "12px",
            background: "#000",
          }}
        />

        {peers.map((peer, index) => (
          <Video
            key={index}
            peer={peer}
          />
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "16px",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2>💬 Team Chat</h2>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <input
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            placeholder="Type message..."
            style={{
              flex: 1,
              padding: "10px",
            }}
          />

          <button
            onClick={sendMessage}
          >
            Send
          </button>
        </div>

        {messages.map((msg) => (
          <div
            key={
              msg._id ||
              Math.random()
            }
            style={{
              background:
                "#f3f4f6",
              padding: "10px",
              borderRadius:
                "8px",
              marginBottom:
                "10px",
            }}
          >
            <strong>
              {msg.sender}
            </strong>

            <p>
              {msg.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MeetingRoom;
