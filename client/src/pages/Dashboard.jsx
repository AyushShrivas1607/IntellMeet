import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
FaPlusCircle,
FaSignOutAlt,
FaVideo,
FaUsers,
} from "react-icons/fa";

function Dashboard() {
const navigate = useNavigate();

const [meetings, setMeetings] = useState([]);
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [meetingCode, setMeetingCode] = useState("");

const userName =
localStorage.getItem("userName") || "Ayush";

useEffect(() => {
loadMeetings();
}, []);

const loadMeetings = async () => {
try {
const token = localStorage.getItem("token");

  const res = await axios.get(
    "http://localhost:5000/api/meetings/all",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setMeetings(res.data);
} catch (error) {
  console.error(error);
}


};

const createMeeting = async () => {
if (!title.trim()) return;

try {
  const token = localStorage.getItem("token");

  await axios.post(
    "http://localhost:5000/api/meetings/create",
    {
      title,
      description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
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
<div
style={{
minHeight: "100vh",
background: "#f4f6f8",
padding: "30px",
}}
>
{/* HEADER */}
<div
style={{
background: "#fff",
padding: "20px",
borderRadius: "12px",
display: "flex",
justifyContent: "space-between",
alignItems: "center",
boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
marginBottom: "25px",
}}
> <div> <h1>🚀 IntellMeet</h1> <p>Welcome, {userName}</p> </div>

    <button
      onClick={logout}
      style={{
        background: "#dc3545",
        color: "#fff",
        border: "none",
        padding: "10px 15px",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      <FaSignOutAlt /> Logout
    </button>
  </div>

  {/* TOP CARDS */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "30px",
    }}
  >
    {/* CREATE */}
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2>
        <FaPlusCircle /> Create Meeting
      </h2>

      <input
        type="text"
        placeholder="Meeting Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={createMeeting}
        style={{
          background: "#0d6efd",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Create
      </button>
    </div>

    {/* JOIN */}
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2>
        <FaVideo /> Join Meeting
      </h2>

      <input
        type="text"
        placeholder="Meeting Code"
        value={meetingCode}
        onChange={(e) =>
          setMeetingCode(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={joinMeetingByCode}
        style={{
          background: "#198754",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Join
      </button>
    </div>
  </div>

  {/* MEETINGS */}
  <h2>
    <FaUsers /> My Meetings
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fill,minmax(300px,1fr))",
      gap: "20px",
    }}
  >
    {meetings.map((meeting) => (
     <div
  key={meeting._id}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-5px)";
    e.currentTarget.style.boxShadow =
      "0 10px 25px rgba(0,0,0,0.15)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow =
      "0 2px 10px rgba(0,0,0,0.1)";
  }}
  style={{
    background: "white",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  }}
>
        <h3>{meeting.title}</h3>

        <p>{meeting.description}</p>

       <span
  style={{
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  }}
>
  🟢 Active
</span>

<p style={{ marginTop: "10px" }}>
  Code: {meeting.meetingCode}
</p>

<Link
  to={`/meeting/${meeting.meetingCode}`}
  style={{
    textDecoration: "none",
    color: "#2563eb",
    fontWeight: "bold",
  }}
>
          Join Meeting
        </Link>
      </div>
    ))}
  </div>
</div>

);
}

export default Dashboard;
