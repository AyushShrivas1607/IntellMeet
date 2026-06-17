const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createMeeting,
  joinMeeting,
  getMeetings,
  getMeetingById,
  leaveMeeting,
} = require("../controllers/meetingController");

router.post(
  "/create",
  authMiddleware,
  createMeeting
);

router.post(
  "/join",
  authMiddleware,
  joinMeeting
);
module.exports = router;

router.get(
  "/all",
  authMiddleware,
  getMeetings
);

router.get(
  "/:id",
  authMiddleware,
  getMeetingById
);

router.post(
  "/leave",
  authMiddleware,
  leaveMeeting
);
