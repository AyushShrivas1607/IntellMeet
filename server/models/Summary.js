const mongoose = require("mongoose");

const actionItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    assignee: { type: String, default: "Unassigned" },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    meetingTitle: { type: String, default: "Untitled Meeting" },
    summary: { type: String, required: true },
    actionItems: [actionItemSchema],
    participants: [{ type: String }],
    createdBy: { type: String },
    duration: { type: Number, default: 0 }, // in minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Summary", summarySchema);