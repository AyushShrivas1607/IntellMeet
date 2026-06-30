import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaThumbtack, FaHandPaper, FaCrown } from "react-icons/fa";

function VideoPlayer({ stream, peer, muted = false, name = "Participant",
  videoEnabled = true, isPinned = false, onPin, isStrip = false,
  handRaised = false, isHost = false }) {

  const videoRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [needsClick, setNeedsClick] = useState(false);
  const animRef = useRef(null);

  const activeSrc = stream ?? remoteStream;

  const attach = (src) => {
    const el = videoRef.current;
    if (!el || !src) return;

    if (el.srcObject !== src) {
      el.srcObject = src;
    }

    el.muted = true;

    const tryPlay = () => {
      el.play()
        .then(() => {
          setNeedsClick(false);
          if (!muted) {
            setTimeout(() => {
              if (videoRef.current) videoRef.current.muted = false;
            }, 150);
          }
        })
        .catch(() => setNeedsClick(true));
    };

    if (el.readyState >= 1) tryPlay();
    else el.onloadedmetadata = tryPlay;
  };

  useEffect(() => {
    if (stream) attach(stream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  useEffect(() => {
    if (!peer) return;

    const onStream = (s) => setRemoteStream(s);
    peer.on("stream", onStream);

    const already = peer.streams?.[0] ?? peer._remoteStreams?.[0] ?? null;
    if (already) setRemoteStream(already);

    return () => peer.removeListener("stream", onStream);
  }, [peer]);

  useEffect(() => {
    if (activeSrc) attach(activeSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSrc]);

  const refCallback = (el) => {
    videoRef.current = el;
    if (el && activeSrc) attach(activeSrc);
  };

  useEffect(() => {
    if (!activeSrc) return;
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(activeSrc).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setSpeaking(data.reduce((a, b) => a + b, 0) / data.length > 12);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) {}
    return () => {
      cancelAnimationFrame(animRef.current);
      ctx?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSrc]);

  const initials = (name || "?")[0].toUpperCase();

  const handleManualPlay = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play()
      .then(() => {
        setNeedsClick(false);
        if (!muted) {
          setTimeout(() => {
            if (videoRef.current) videoRef.current.muted = false;
          }, 150);
        }
      })
      .catch(() => {});
  };

  return (
    <div
      className={["video-card", speaking && !muted ? "speaking" : "",
        isPinned ? "pinned" : "", isStrip ? "strip-tile" : "",
        handRaised ? "hand-raised-tile" : ""].filter(Boolean).join(" ")}
      onClick={needsClick ? handleManualPlay : onPin}
      title={needsClick ? "Click to play" : onPin ? (isPinned ? "Unpin" : "Pin to focus") : undefined}
    >
      {videoEnabled ? (
        <>
          <video
            ref={refCallback}
            autoPlay
            playsInline
            muted={muted}
            className="meeting-video"
          />
          {needsClick && (
            <div className="autoplay-overlay">
              <div className="autoplay-btn">▶ Click to play</div>
            </div>
          )}
        </>
      ) : (
        <div className="video-placeholder">
          <div className="avatar">{initials}</div>
          {!isStrip && <span>Camera off</span>}
        </div>
      )}

      {/* Top-left badges: host crown + raised hand */}
      <div className="tile-badges">
        {isHost && (
          <span className="tile-badge host-tile-badge" title="Host">
            <FaCrown />
          </span>
        )}
        {handRaised && (
          <span className="tile-badge hand-tile-badge" title="Hand raised">
            <FaHandPaper />
          </span>
        )}
      </div>

      <div className="video-name">
        <span className="name-text">{muted ? `${name} (You)` : name}</span>
        <span className="mic-icon">
          {muted ? <FaMicrophoneSlash style={{ color: "#ef4444" }} /> : <FaMicrophone />}
        </span>
      </div>

      {isPinned && <div className="pin-badge"><FaThumbtack /></div>}
    </div>
  );
}

export default VideoPlayer;