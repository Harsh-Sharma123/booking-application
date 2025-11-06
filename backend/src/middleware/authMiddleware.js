const jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: (req, res, next) => {
    // Expect header in format: Authorization: Bearer <token>
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const parts = authHeader.split(" ");
    const token =
      parts.length === 2 && parts[0].toLowerCase() === "bearer"
        ? parts[1]
        : authHeader;

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      // Attach userId to request for handlers
      req.userId = decoded.userId;
      next();
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Invalid token", error: err.message });
    }
  },

  // compatibility placeholder
  isAuthenticated: (req, res, next) => {
    return module.exports.verifyToken(req, res, next);
  },
};
