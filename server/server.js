require("dotenv").config();

const express = require("express");

const app = express();
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));

const connectDB = require("./config/db");
console.log("URI:", process.env.MONGO_URI);

connectDB();

app.get("/", (req, res) => {
  res.send("IntellMeet Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});