import { useEffect, useState } from "react";
import { FaComments, FaUsers, FaCopy, FaCrown, FaCircle, FaStop } from "react-icons/fa";

function formatElapsed(startedAt) {
  if (!startedAt) return "00:00";
  const secs = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function TopBar({
  roomId,
  participants = [],
  isHost = false,
  isRecording = false,
  recordingStartedAt = null,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
}) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (!isRecording) return;
    setElapsed(formatElapsed(recordingStartedAt));
    const id = setInterval(() => setElapsed(formatElapsed(recordingStartedAt)), 1000);
    return () => clearInterval(id);
  }, [isRecording, recordingStartedAt]);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert("Meeting code copied!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="top-bar">

      <div className="top-left">
        <div className="logo">IntellMeet</div>
        <div className="room-code">Room: {roomId}</div>
        {isHost && (
          <div className="host-pill" title="You are the host">
            <FaCrown /> Host
          </div>
        )}
        {isRecording && (
          <div className="rec-badge" title="This meeting is being recorded">
            <span className="rec-dot" /> REC {elapsed}
          </div>
        )}
      </div>

      <div className="top-right">
        {isHost && (
          <button
            className={`rec-toggle-btn ${isRecording ? "is-recording" : ""}`}
            onClick={onToggleRecording}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <FaStop /> : <FaCircle />}
            {isRecording ? "Stop" : "Record"}
          </button>
        )}

        <div className="top-icon" onClick={copyRoomCode} title="Copy meeting code">
          <FaCopy />
        </div>

        <div className="top-icon" onClick={onToggleParticipants} title="Participants">
          <FaUsers />
          <span style={{ marginLeft: 8, fontSize: 13 }}>
            {participants?.length || 0}
          </span>
        </div>

        <div className="top-icon" onClick={onToggleChat} title="Chat">
          <FaComments />
        </div>
      </div>
    </header>
  );
}

export default TopBar;