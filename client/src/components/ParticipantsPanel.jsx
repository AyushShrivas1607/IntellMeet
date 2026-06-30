import { FaCrown, FaHandPaper, FaMicrophoneSlash, FaVolumeMute } from "react-icons/fa";

function ParticipantsPanel({
  showParticipants,
  participants = [],
  isHost = false,
  mySocketId,
  onMuteAll,
  onMuteParticipant,
}) {
  if (!showParticipants) return null;

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <h2>Participants</h2>
        <span className="participant-count">{participants?.length || 0}</span>
      </div>

      {/* Host-only bulk action */}
      {isHost && participants.length > 1 && (
        <div className="host-actions">
          <button className="host-action-btn" onClick={onMuteAll}>
            <FaVolumeMute /> Mute All
          </button>
        </div>
      )}

      <div className="participants-list">

        {!participants?.length ? (
          <div className="empty-chat">No participants</div>
        ) : (
          participants.map((p) => {
            const isMe = p.socketId === mySocketId;
            return (
              <div key={p.socketId || p.id} className="participant">
                <div className="participant-avatar">
                  {(p.name?.[0] || "U").toUpperCase()}
                </div>

                <div className="participant-info">
                  <div className="participant-name">
                    {p.name || "Unknown"} {isMe && "(You)"}
                    {p.isHost && (
                      <span className="host-badge" title="Host">
                        <FaCrown />
                      </span>
                    )}
                    {p.handRaised && (
                      <span className="hand-badge" title="Hand raised">
                        <FaHandPaper />
                      </span>
                    )}
                  </div>

                  <div className="participant-status">🟢 Connected</div>
                </div>

                {/* Host can mute any non-host, non-self participant */}
                {isHost && !isMe && !p.isHost && (
                  <button
                    className="mute-one-btn"
                    title={`Mute ${p.name}`}
                    onClick={() => onMuteParticipant(p.socketId)}
                  >
                    <FaMicrophoneSlash />
                  </button>
                )}
              </div>
            );
          })
        )}

      </div>

    </aside>
  );
}

export default ParticipantsPanel;