const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    console.log("Headers:", req.headers);

    const token = req.header("Authorization");

    console.log("Token:", token);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    console.log("Decoded:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;