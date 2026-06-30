const express = require("express");
const router = express.Router();

const Summary = require("../models/Summary");
const Message = require("../models/Message");
const { generateMeetingSummary } = require("../utils/aiSummary");

/**
 * POST /api/summary/generate
 * Body: { roomId, meetingTitle, createdBy, participants: [string] }
 *
 * Pulls the full chat transcript for the room from MongoDB,
 * sends it to OpenAI, stores the result, and returns it.
 */
router.post("/generate", async (req, res) => {
  try {
    const { roomId, meetingTitle, createdBy, participants = [] } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    // Pull the chat transcript already saved for this meeting
    const chatMessages = await Message.find({ roomId }).sort({ createdAt: 1 });

    const { summary, actionItems } = await generateMeetingSummary(
      chatMessages.map((m) => ({ sender: m.sender, message: m.message })),
      meetingTitle
    );

    const saved = await Summary.create({
      roomId,
      meetingTitle: meetingTitle || "Untitled Meeting",
      summary,
      actionItems,
      participants,
      createdBy,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Summary generation error:", err);
    res.status(500).json({ message: "Failed to generate summary" });
  }
});

/**
 * GET /api/summary/:roomId
 * Fetch the most recent summary for a given room (used right after a meeting ends)
 */
router.get("/:roomId", async (req, res) => {
  try {
    const summary = await Summary.findOne({ roomId: req.params.roomId }).sort({
      createdAt: -1,
    });

    if (!summary) {
      return res.status(404).json({ message: "No summary found for this meeting" });
    }

    res.json(summary);
  } catch (err) {
    console.error("Fetch summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});

/**
 * GET /api/summary/history/all
 * Fetch all past meeting summaries (for the dashboard)
 * Optional query: ?createdBy=username to filter by user
 */
router.get("/history/all", async (req, res) => {
  try {
    const filter = {};
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;

    const summaries = await Summary.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(summaries);
  } catch (err) {
    console.error("Fetch summary history error:", err);
    res.status(500).json({ message: "Failed to fetch meeting history" });
  }
});

module.exports = router;