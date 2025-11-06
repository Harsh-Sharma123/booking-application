const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware.verifyToken, bookingController.create);
router.get("/", authMiddleware.verifyToken, bookingController.listForUser);

module.exports = router;
