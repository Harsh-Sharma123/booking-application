const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// User registration route
router.post("/register", authController.register);

// User login route
router.post("/login", authController.login);

// Get current user
router.get("/me", authMiddleware.verifyToken, authController.me);

module.exports = router;
