import { useState, useMemo } from "react";
import VideoPlayer from "./VideoPlayer";

function getGridCols(count) {
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  if (count <= 9) return 3;
  return 4;
}

function VideoGrid({
  stream,
  peers,
  participants = [],
  mySocketId,
  userName = "You",
  videoEnabled = true,
}) {
  const [pinnedId, setPinnedId] = useState(null);

  const getParticipant = (socketId) =>
    participants.find((p) => p.socketId === socketId);

  const myInfo = getParticipant(mySocketId);

  const tiles = useMemo(() => {
    const local = { id: "local", isLocal: true };
    const remote = peers.map(({ peerID, peer }, i) => ({
      id: peerID || `peer-${i}`,
      peerID,
      peer,
      index: i,
      isLocal: false,
    }));
    return [local, ...remote];
  }, [peers]);

  const totalCount = tiles.length;
  const hasPinned = pinnedId !== null;

  const togglePin = (id) => {
    setPinnedId((prev) => (prev === id ? null : id));
  };

  const remoteName = (peerID, index) => {
    const p = getParticipant(peerID);
    return p?.name || `Participant ${index + 1}`;
  };

  const remoteHandRaised = (peerID) => !!getParticipant(peerID)?.handRaised;

  if (hasPinned) {
    const pinnedTile = tiles.find((t) => t.id === pinnedId);
    const stripTiles = tiles.filter((t) => t.id !== pinnedId);

    return (
      <div className="video-grid-spotlight">
        <div className="spotlight-main">
          {pinnedTile?.isLocal ? (
            <VideoPlayer
              stream={stream}
              muted
              name={userName}
              videoEnabled={videoEnabled}
              isPinned
              handRaised={!!myInfo?.handRaised}
              isHost={!!myInfo?.isHost}
              onPin={() => togglePin("local")}
            />
          ) : (
            <VideoPlayer
              peer={pinnedTile?.peer}
              name={remoteName(pinnedTile?.peerID, pinnedTile?.index)}
              videoEnabled
              isPinned
              handRaised={remoteHandRaised(pinnedTile?.peerID)}
              isHost={!!getParticipant(pinnedTile?.peerID)?.isHost}
              onPin={() => togglePin(pinnedTile?.id)}
            />
          )}
        </div>

        {stripTiles.length > 0 && (
          <div className="spotlight-strip">
            {stripTiles.map((tile) =>
              tile.isLocal ? (
                <VideoPlayer
                  key="local"
                  stream={stream}
                  muted
                  name={userName}
                  videoEnabled={videoEnabled}
                  isStrip
                  handRaised={!!myInfo?.handRaised}
                  isHost={!!myInfo?.isHost}
                  onPin={() => togglePin("local")}
                />
              ) : (
                <VideoPlayer
                  key={tile.id}
                  peer={tile.peer}
                  name={remoteName(tile.peerID, tile.index)}
                  videoEnabled
                  isStrip
                  handRaised={remoteHandRaised(tile.peerID)}
                  isHost={!!getParticipant(tile.peerID)?.isHost}
                  onPin={() => togglePin(tile.id)}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  const cols = getGridCols(totalCount);

  return (
    <div className="video-grid" style={{ "--grid-cols": cols }}>
      <VideoPlayer
        stream={stream}
        muted
        name={userName}
        videoEnabled={videoEnabled}
        handRaised={!!myInfo?.handRaised}
        isHost={!!myInfo?.isHost}
        onPin={() => togglePin("local")}
      />

      {peers.map(({ peerID, peer }, index) => (
        <VideoPlayer
          key={peerID || index}
          peer={peer}
          name={remoteName(peerID, index)}
          videoEnabled
          handRaised={remoteHandRaised(peerID)}
          isHost={!!getParticipant(peerID)?.isHost}
          onPin={() => togglePin(peerID || `peer-${index}`)}
        />
      ))}
    </div>
  );
}

export default VideoGrid;