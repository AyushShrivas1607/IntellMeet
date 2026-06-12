const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMeeting,
} = require("../controllers/meetingController");

router.post(
  "/create",
  authMiddleware,
  createMeeting
);

module.exports = router;