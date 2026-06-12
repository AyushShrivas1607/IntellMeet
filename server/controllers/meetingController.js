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