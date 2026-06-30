import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Peer from "simple-peer";
import axios from "axios";

import socket from "../services/socket";

import TopBar from "../components/TopBar";
import VideoGrid from "../components/VideoGrid";
import ParticipantsPanel from "../components/ParticipantsPanel";
import ChatPanel from "../components/ChatPanel";
import BottomControls from "../components/BottomControls";

import "./MeetingRoom.css";

function MeetingRoom() {
  const navigate = useNavigate();
  const { meetingCode } = useParams();
  const roomId = meetingCode;

  const userNameRef = useRef(localStorage.getItem("userName") || "Guest");

  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [camError, setCamError] = useState(null);

  // ── Host controls state ────────────────────────────────────────
  const [isHost, setIsHost] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [toast, setToast] = useState(null); // { text } | null

  // ── Recording state (UI-only signal, synced across the room) ───
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);

  const showChat = activePanel === "chat";
  const showParticipants = activePanel === "participants";
  const toggleChat = () => setActivePanel((p) => (p === "chat" ? null : "chat"));
  const toggleParticipants = () => setActivePanel((p) => (p === "participants" ? null : "participants"));

  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const joinedRef = useRef(false);

  const showToast = (text) => {
    setToast({ text });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 3000);
  };

  // ── Chat history ─────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    axios.get(`http://localhost:5000/api/messages/${roomId}`)
      .then((res) => setMessages(res.data || []))
      .catch(console.error);
  }, [roomId]);

  // ── Peer helpers ─────────────────────────────────────────────────
  const isPeerAlreadyAdded = (id) => peersRef.current.some((p) => p.peerID === id);

  const removePeer = (socketId) => {
    const peerObj = peersRef.current.find((p) => p.peerID === socketId);
    if (peerObj) peerObj.peer.destroy();
    peersRef.current = peersRef.current.filter((p) => p.peerID !== socketId);
    setPeers((prev) => prev.filter((p) => p.peerID !== socketId));
  };

  const createPeer = (userToSignal, s) => {
    const peer = new Peer({ initiator: true, trickle: true, stream: s });
    peer.on("signal", (sig) => socket.emit("sendingSignal", { userToSignal, signal: sig }));
    peer.on("error", (e) => console.warn("[PEER] error", e.message));
    return peer;
  };

  const addPeer = (incomingSignal, callerId, s) => {
    const peer = new Peer({ initiator: false, trickle: true, stream: s });
    peer.on("signal", (sig) => socket.emit("returningSignal", { signal: sig, callerId }));
    peer.on("error", (e) => console.warn("[PEER] error", e.message));
    peer.signal(incomingSignal);
    return peer;
  };

  // ── Socket listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    socket.on("participantsUpdate", (users) => {
      const list = Array.isArray(users) ? [...users] : [];
      setParticipants(list);

      // Derive my own host / hand-raised status from the authoritative list
      const me = list.find((u) => u.socketId === socket.id);
      if (me) {
        setIsHost(!!me.isHost);
        setHandRaised(!!me.handRaised);
      }
    });

    socket.on("receiveMessage", (chat) => {
      if (chat.sender !== userNameRef.current)
        setMessages((prev) => [...prev, chat]);
    });

    // Host force-muted me
    socket.on("forceMute", () => {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) => { t.enabled = false; });
      }
      setAudioEnabled(false);
      showToast("🔇 You were muted by the host");
    });

    // Recording started/stopped (broadcast to whole room)
    socket.on("recordingStateChanged", (state) => {
      setIsRecording(!!state.isRecording);
      setRecordingStartedAt(state.startedAt || null);
      showToast(state.isRecording ? "⏺ Recording started" : "⏹ Recording stopped");
    });

    socket.on("all-users", (users) => {
      users.forEach((socketId) => {
        if (isPeerAlreadyAdded(socketId)) return;
        const peer = createPeer(socketId, streamRef.current);
        peersRef.current.push({ peerID: socketId, peer });
        setPeers((prev) => [...prev, { peerID: socketId, peer }]);
      });
    });

    socket.on("user-joined", ({ signal, callerId }) => {
      if (isPeerAlreadyAdded(callerId)) return;
      const peer = addPeer(signal, callerId, streamRef.current);
      peersRef.current.push({ peerID: callerId, peer });
      setPeers((prev) => [...prev, { peerID: callerId, peer }]);
    });

    socket.on("receivingReturnedSignal", ({ signal, id }) => {
      const item = peersRef.current.find((p) => p.peerID === id);
      if (item) item.peer.signal(signal);
    });

    socket.on("userLeft", (socketId) => removePeer(socketId));

    return () => {
      socket.off("participantsUpdate");
      socket.off("receiveMessage");
      socket.off("forceMute");
      socket.off("recordingStateChanged");
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receivingReturnedSignal");
      socket.off("userLeft");
    };
  }, [roomId]);

  // ── INIT: camera → then join room ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { media.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = media;
        setStream(media);
        setCamError(null);
      } catch (err) {
        setCamError(err.message);
      }

      if (cancelled) return;

      if (!socket.connected) socket.connect();

      const doJoin = () => {
        if (joinedRef.current) return;
        joinedRef.current = true;
        socket.emit("joinRoom", {
          roomId,
          user: { id: socket.id, name: userNameRef.current },
        });
      };

      if (socket.connected) doJoin();
      else socket.once("connect", doJoin);
    };

    init();

    return () => {
      cancelled = true;
      socket.off("connect");
    };
  }, [roomId]);

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, []);

  // ── Toggle audio ─────────────────────────────────────────────────
  const toggleAudio = () => {
    if (!streamRef.current) return;
    const enabled = !audioEnabled;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    setAudioEnabled(enabled);
  };

  // ── Toggle video ─────────────────────────────────────────────────
  const toggleVideo = async () => {
    const s = streamRef.current;
    if (!s) return;

    if (videoEnabled) {
      s.getVideoTracks().forEach((t) => { t.enabled = false; });
      setVideoEnabled(false);
      return;
    }

    const existing = s.getVideoTracks()[0];

    if (existing && existing.readyState === "live") {
      existing.enabled = true;
      setVideoEnabled(true);
      setStream(new MediaStream(s.getTracks()));
      return;
    }

    try {
      const newMedia = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newTrack = newMedia.getVideoTracks()[0];
      existing?.stop();

      for (const { peer } of peersRef.current) {
        try {
          const senders = peer._pc?.getSenders?.() || [];
          const vs = senders.find((sv) => sv.track?.kind === "video");
          if (vs) await vs.replaceTrack(newTrack);
        } catch (e) {}
      }

      s.getVideoTracks().forEach((t) => s.removeTrack(t));
      s.addTrack(newTrack);

      const updated = new MediaStream(s.getTracks());
      streamRef.current = updated;
      setStream(updated);
      setVideoEnabled(true);
    } catch (err) {
      setCamError("Cannot access camera: " + err.message);
    }
  };

  // ── Share screen ─────────────────────────────────────────────────
  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const s = streamRef.current;
      const cameraTrack = s?.getVideoTracks()[0];

      for (const { peer } of peersRef.current) {
        try {
          const senders = peer._pc?.getSenders?.() || [];
          const vs = senders.find((sv) => sv.track?.kind === "video");
          if (vs) await vs.replaceTrack(screenTrack);
        } catch (e) {}
      }

      if (s && cameraTrack) { s.removeTrack(cameraTrack); s.addTrack(screenTrack); }
      const updated = new MediaStream(s?.getTracks() || [screenTrack]);
      streamRef.current = updated;
      setStream(updated);

      screenTrack.onended = async () => {
        try {
          const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const camTrack = cam.getVideoTracks()[0];
          const cur = streamRef.current;
          for (const { peer } of peersRef.current) {
            try {
              const senders = peer._pc?.getSenders?.() || [];
              const vs = senders.find((sv) => sv.track?.kind === "video");
              if (vs) await vs.replaceTrack(camTrack);
            } catch (e) {}
          }
          cur?.removeTrack(screenTrack); cur?.addTrack(camTrack);
          const restored = new MediaStream(cur?.getTracks() || [camTrack]);
          streamRef.current = restored;
          setStream(restored);
        } catch (e) {}
      };
    } catch (err) {}
  };

  // ── Send message ─────────────────────────────────────────────────
  const sendMessage = () => {
    if (!message.trim()) return;
    const chatData = { roomId, sender: userNameRef.current, message, createdAt: new Date() };
    socket.emit("sendMessage", chatData);
    setMessages((prev) => [...prev, chatData]);
    setMessage("");
  };

  // ── Raise / lower hand ───────────────────────────────────────────
  const toggleHand = () => {
    socket.emit("toggleHand", { roomId });
  };

  // ── Host: mute everyone ──────────────────────────────────────────
  const muteAll = () => {
    socket.emit("muteAll", { roomId });
    showToast("🔇 Muted all participants");
  };

  // ── Host: mute one participant ───────────────────────────────────
  const muteParticipant = (targetSocketId) => {
    socket.emit("muteParticipant", { roomId, targetSocketId });
  };

  // ── Host: start/stop recording indicator ─────────────────────────
  const toggleRecording = () => {
    socket.emit("toggleRecording", { roomId });
  };

  // ── End meeting ──────────────────────────────────────────────────
  const endMeeting = () => {
    socket.emit("leaveRoom", { roomId });
    peersRef.current.forEach(({ peer }) => peer.destroy());
    peersRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    socket.disconnect();

    navigate(`/summary/${roomId}`, {
      state: {
        meetingTitle: `Meeting ${roomId}`,
        participants: participants.map((p) => p.name),
      },
    });
  };

  return (
    <div className="meeting-layout">
      <TopBar
        roomId={roomId}
        participants={participants}
        isHost={isHost}
        isRecording={isRecording}
        recordingStartedAt={recordingStartedAt}
        onToggleRecording={toggleRecording}
        onToggleChat={toggleChat}
        onToggleParticipants={toggleParticipants}
      />

      <div className="meeting-body">
        <VideoGrid
          stream={stream}
          peers={peers}
          participants={participants}
          mySocketId={socket.id}
          userName={userNameRef.current}
          videoEnabled={videoEnabled}
        />
        {isRecording && <div className="rec-corner-badge"><span className="rec-dot" /> Recording</div>}
        <ChatPanel showChat={showChat} messages={messages} message={message} setMessage={setMessage} sendMessage={sendMessage} />
        <ParticipantsPanel
          showParticipants={showParticipants}
          participants={participants}
          isHost={isHost}
          mySocketId={socket.id}
          onMuteAll={muteAll}
          onMuteParticipant={muteParticipant}
        />
      </div>

      {camError && (
        <div style={{ position:"fixed", top:70, left:"50%", transform:"translateX(-50%)",
          background:"#dc2626", color:"#fff", padding:"10px 20px", borderRadius:8,
          fontSize:13, zIndex:9999 }}>
          ⚠️ Camera: {camError}
        </div>
      )}

      {toast && (
        <div className="meeting-toast">{toast.text}</div>
      )}

      <BottomControls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        shareScreen={shareScreen}
        endMeeting={endMeeting}
        toggleChat={toggleChat}
        toggleParticipants={toggleParticipants}
        handRaised={handRaised}
        toggleHand={toggleHand}
      />
    </div>
  );
}

export default MeetingRoom;