require("dotenv").config();

const express = require("express");
const cors = require("cors");
const messageRoutes = require("./routes/messageRoutes");
const summaryRoutes = require("./routes/summaryRoutes"); // ← NEW
const http = require("http");
const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/meetings", require("./routes/meetingRoutes"));
app.use("/api/messages", messageRoutes);
app.use("/api/summary", summaryRoutes); // ← NEW: AI meeting summaries

const connectDB = require("./config/db");
console.log("URI:", process.env.MONGO_URI);

connectDB();

app.get("/", (req, res) => {
  res.send("IntellMeet Backend Running");
});

initSocket(server);

server.listen(5000, () => {
  console.log("Server running on port 5000");
});