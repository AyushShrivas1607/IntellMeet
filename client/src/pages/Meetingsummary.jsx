import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaArrowLeft, FaSpinner, FaUserCircle } from "react-icons/fa";
import { API_BASE_URL } from "../config";

function MeetingSummary() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();

  // Optional state passed from MeetingRoom on navigate() — speeds up generation
  const passedState = location.state || {};

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    generateOrFetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const generateOrFetchSummary = async () => {
    setLoading(true);
    setError("");

    try {
      // Generate a fresh summary using whatever chat transcript exists for this room
      const res = await axios.post(`${API_BASE_URL}/api/summary/generate`, {
        roomId,
        meetingTitle: passedState.meetingTitle || "Untitled Meeting",
        createdBy: localStorage.getItem("userName") || "Guest",
        participants: passedState.participants || [],
      });

      setSummary(res.data);
    } catch (err) {
      console.error(err);
      setError("Could not generate the meeting summary. You can still return to your dashboard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h1 style={styles.title}>🤖 AI Meeting Summary</h1>
        <p style={styles.sub}>Room: {roomId}</p>

        {loading && (
          <div style={styles.loadingBox}>
            <FaSpinner className="spin" style={styles.spinner} />
            <p>Generating summary with AI…</p>
          </div>
        )}

        {!loading && error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
            <button style={styles.retryBtn} onClick={generateOrFetchSummary}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && summary && (
          <>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Summary</h2>
              <p style={styles.summaryText}>{summary.summary}</p>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Action Items{" "}
                <span style={styles.countBadge}>{summary.actionItems?.length || 0}</span>
              </h2>

              {summary.actionItems?.length === 0 ? (
                <p style={styles.emptyText}>No specific action items were identified.</p>
              ) : (
                <ul style={styles.actionList}>
                  {summary.actionItems.map((item, i) => (
                    <li key={i} style={styles.actionItem}>
                      <FaCheckCircle style={styles.checkIcon} />
                      <div>
                        <div style={styles.actionText}>{item.text}</div>
                        <div style={styles.assignee}>
                          <FaUserCircle style={{ marginRight: 4 }} />
                          {item.assignee || "Unassigned"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p style={styles.timestamp}>
              Generated {new Date(summary.createdAt).toLocaleString()}
            </p>
          </>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 15% 0%, rgba(99,102,241,0.16), transparent 45%), radial-gradient(circle at 100% 20%, rgba(56,189,248,0.12), transparent 45%), #0a0e1a",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  card: {
    background: "rgba(17, 24, 39, 0.72)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 40,
    width: "100%",
    maxWidth: 700,
    border: "1px solid #1f2937",
    color: "#f1f5f9",
    height: "fit-content",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "none",
    border: "none",
    color: "#38bdf8",
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 24,
    padding: 0,
  },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" },
  sub: { color: "#94a3b8", fontSize: 13, marginBottom: 28 },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "50px 0",
    color: "#94a3b8",
  },
  spinner: { fontSize: 28, color: "#38bdf8" },
  errorBox: {
    background: "#1e293b",
    border: "1px solid #dc2626",
    borderRadius: 10,
    padding: 20,
    color: "#fca5a5",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    background: "#2563eb",
    fontSize: 12,
    padding: "2px 9px",
    borderRadius: 999,
  },
  summaryText: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 10,
    lineHeight: 1.6,
    fontSize: 14.5,
    color: "#cbd5e1",
  },
  emptyText: { color: "#64748b", fontSize: 14, fontStyle: "italic" },
  actionList: { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  actionItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    background: "#1e293b",
    padding: "12px 16px",
    borderRadius: 10,
  },
  checkIcon: { color: "#22c55e", marginTop: 3, flexShrink: 0 },
  actionText: { fontSize: 14.5, fontWeight: 500 },
  assignee: {
    display: "flex",
    alignItems: "center",
    fontSize: 12.5,
    color: "#94a3b8",
    marginTop: 4,
  },
  timestamp: { fontSize: 12, color: "#64748b", marginTop: 20, textAlign: "right" },
};

export default MeetingSummary;