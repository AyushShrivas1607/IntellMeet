import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlusCircle,
  FaSignOutAlt,
  FaVideo,
  FaUsers,
  FaRobot,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import { API_BASE_URL } from "../config";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [summaries, setSummaries] = useState([]);

  const userName = localStorage.getItem("userName") || "Guest";

  useEffect(() => {
    loadMeetings();
    loadSummaries();
  }, []);

  const loadMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/meetings/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSummaries = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/summary/history/all?createdBy=${encodeURIComponent(userName)}`
      );
      setSummaries(res.data);
    } catch (error) {
      console.error("Failed to load summaries:", error);
    }
  };

  const createMeeting = async () => {
    if (!title.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/meetings/create`,
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle("");
      setDescription("");
      loadMeetings();
    } catch (error) {
      console.error(error);
    }
  };

  const joinMeetingByCode = () => {
    if (!meetingCode.trim()) return;
    navigate(`/meeting/${meetingCode}`);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dash-page">
      {/* HEADER */}
      <div className="dash-header">
        <div>
          <div className="logo"><span className="dot" />IntellMeet</div>
          <p className="welcome">Welcome back, {userName}</p>
        </div>

        <button onClick={logout} className="dash-logout">
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* CREATE / JOIN */}
      <div className="dash-top-grid">
        <div className="dash-panel">
          <h3><FaPlusCircle /> Create Meeting</h3>

          <input
            type="text"
            placeholder="Meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="dash-input"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="dash-input"
          />

          <button onClick={createMeeting} className="dash-btn dash-btn-primary">
            Create
          </button>
        </div>

        <div className="dash-panel">
          <h3><FaVideo /> Join Meeting</h3>

          <input
            type="text"
            placeholder="Enter meeting code"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            className="dash-input"
          />

          <button onClick={joinMeetingByCode} className="dash-btn dash-btn-join">
            Join
          </button>
        </div>
      </div>

      {/* MEETINGS */}
      <h2 className="dash-section-title"><FaUsers /> My Meetings</h2>

      {meetings.length === 0 ? (
        <div className="dash-panel dash-empty">
          No meetings yet — create one above to get started.
        </div>
      ) : (
        <div className="dash-grid">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="meeting-card">
              <h4>{meeting.title}</h4>
              <p>{meeting.description || "No description"}</p>

              <span className="status-pill">
                <span className="pulse-dot" /> Active
              </span>

              <p className="meeting-code">CODE: {meeting.meetingCode}</p>

              <Link to={`/meeting/${meeting.meetingCode}`} className="meeting-join-link">
                Join Meeting <FaArrowRight size={11} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* AI SUMMARIES */}
      <h2 className="dash-section-title"><FaRobot /> Recent AI Meeting Summaries</h2>

      {summaries.length === 0 ? (
        <div className="dash-panel dash-empty">
          No meeting summaries yet. End a meeting to generate one automatically.
        </div>
      ) : (
        <div className="dash-grid">
          {summaries.map((s) => (
            <div key={s._id} className="summary-card">
              <div className="summary-head">
                <h4>{s.meetingTitle}</h4>
                <span className="summary-date">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="summary-text">{s.summary}</p>

              {s.actionItems?.length > 0 && (
                <div className="summary-action-count">
                  <FaCheckCircle />
                  {s.actionItems.length} action item{s.actionItems.length > 1 ? "s" : ""}
                </div>
              )}

              <Link to={`/summary/${s.roomId}`} className="summary-link">
                View Full Summary →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;