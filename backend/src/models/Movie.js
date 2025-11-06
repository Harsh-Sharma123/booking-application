const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
  time: { type: String, required: true },
  seatsAvailable: { type: Number, default: 100 },
  price: { type: Number, default: 10 },
  seats: [
    {
      label: { type: String },
      status: {
        type: String,
        enum: ["available", "reserved"],
        default: "available",
      },
    },
  ],
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String },
  description: { type: String },
  poster: { type: String },
  showtimes: [showtimeSchema],
});

module.exports = mongoose.model("Movie", movieSchema);
