const Meeting = require("../models/Meeting");

exports.createMeeting = async (req, res) => {
  try {
    const { title, description } = req.body;

    const meeting = await Meeting.create({
      title,
      description,
      host: req.user.id,
      meetingCode: Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(),
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.joinMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    const meeting = await Meeting.findOne({
      meetingCode,
    });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    if (
      !meeting.participants.includes(req.user.id)
    ) {
      meeting.participants.push(req.user.id);
      await meeting.save();
    }

    res.status(200).json({
      message: "Joined Successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate("host", "name email")
      .populate("participants", "name email");

    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("host", "name email")
      .populate("participants", "name email");

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.leaveMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    const meeting = await Meeting.findOne({
      meetingCode,
    });

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    meeting.participants =
      meeting.participants.filter(
        (participant) =>
          participant.toString() !== req.user.id
      );

    await meeting.save();

    res.status(200).json({
      message: "Left meeting successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};