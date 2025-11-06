const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");

router.get("/", movieController.list);
router.get("/:id", movieController.get);
router.get("/:id/showtime/:showtime/seats", movieController.getShowtimeSeats);
router.post("/", movieController.create);
router.post("/initialize-seats", movieController.initializeSeats);

module.exports = router;
