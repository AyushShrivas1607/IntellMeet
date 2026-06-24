import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [meetingCode, setMeetingCode] = useState("");

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjkzNWJjNzE0ZjkwNjA5YzYxMTU3ZiIsImlhdCI6MTc4MjIwNzMyOCwiZXhwIjoxNzgyODEyMTI4fQ.293iGLuJ27bv-Go--tJWWDYoh7GdsSCF3GYfjxNpoCQ";

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

    loadMeetings();
  }, []);
  const createMeeting = async () => {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjkzNWJjNzE0ZjkwNjA5YzYxMTU3ZiIsImlhdCI6MTc4MjIwNzMyOCwiZXhwIjoxNzgyODEyMTI4fQ.293iGLuJ27bv-Go--tJWWDYoh7GdsSCF3GYfjxNpoCQ";

    const res = await axios.post(
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

    console.log("Meeting Created:", res.data);

    window.location.reload();
  } catch (error) {
    console.error(error);
  }
};
const joinMeetingByCode = () => {
  if (!meetingCode.trim()) return;

  window.location.href = `/meeting/${meetingCode}`;
};
  return (
    <div style={{ padding: "20px" }}>
      <h1>IntellMeet Dashboard</h1>
      <h2>Create Meeting</h2>

<input
  type="text"
  placeholder="Meeting Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

<br />
<br />

<input
  type="text"
  placeholder="Meeting Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>

<br />
<br />

<button onClick={createMeeting}>
  Create Meeting
</button>

<hr />
<h2>Join Meeting</h2>

<input
  type="text"
  placeholder="Enter Meeting Code"
  value={meetingCode}
  onChange={(e) => setMeetingCode(e.target.value)}
/>

<br />
<br />

<button onClick={joinMeetingByCode}>
  Join Meeting
</button>

<hr />
      <h2>My Meetings</h2>

      {meetings.length === 0 ? (
        <p>No meetings found</p>
      ) : (
        meetings.map((meeting) => (
          <div
            key={meeting._id}
            style={{
              border: "1px solid black",
              padding: "15px",
              marginBottom: "10px",
            }}
          >
            <h3>{meeting.title}</h3>

            <p>
              Meeting Code: {meeting.meetingCode}
            </p>

            <Link
              to={`/meeting/${meeting.meetingCode}`}
            >
              Join Meeting
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;