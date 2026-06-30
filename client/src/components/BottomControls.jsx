import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaComments,
  FaUsers,
  FaPhoneSlash,
  FaHandPaper,
} from "react-icons/fa";

function BottomControls({
  audioEnabled,
  videoEnabled,
  toggleAudio,
  toggleVideo,
  shareScreen,
  endMeeting,
  toggleChat,
  toggleParticipants,
  handRaised,
  toggleHand,
}) {
  return (
    <div className="control-bar">

      {/* Microphone */}
      <button
        className={`control-btn ${!audioEnabled ? "danger" : ""}`}
        onClick={toggleAudio}
        title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
      >
        {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
      </button>

      {/* Camera */}
      <button
        className={`control-btn ${!videoEnabled ? "danger" : ""}`}
        onClick={toggleVideo}
        title={videoEnabled ? "Turn Camera Off" : "Turn Camera On"}
      >
        {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
      </button>

      {/* Raise Hand */}
      <button
        className={`control-btn ${handRaised ? "active-gold" : ""}`}
        onClick={toggleHand}
        title={handRaised ? "Lower Hand" : "Raise Hand"}
      >
        <FaHandPaper />
      </button>

      {/* Screen Share */}
      <button className="control-btn" onClick={shareScreen} title="Share Screen">
        <FaDesktop />
      </button>

      {/* Chat */}
      <button className="control-btn" onClick={toggleChat} title="Chat">
        <FaComments />
      </button>

      {/* Participants */}
      <button className="control-btn" onClick={toggleParticipants} title="Participants">
        <FaUsers />
      </button>

      {/* Leave Meeting */}
      <button className="control-btn end-btn" onClick={endMeeting} title="Leave Meeting">
        <FaPhoneSlash />
      </button>

    </div>
  );
}

export default BottomControls;