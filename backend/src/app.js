const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 8080;
const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const bookingRoutes = require("./routes/bookings");
const dbConfig = require("./config/db");

const cors = require("cors");
const app = express();

app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
dbConfig();

// Seed sample movies if none exist (development convenience)
const Movie = require("./models/Movie");
const seedMovies = async () => {
  try {
    const count = await Movie.countDocuments();
    if (count === 0) {
      // helper to generate seats labels like A1..A5, B1..B6 etc
      const makeSeats = (rows = 5, perRow = 6) => {
        const seats = [];
        for (let r = 0; r < rows; r++) {
          const rowChar = String.fromCharCode(65 + r);
          for (let c = 1; c <= perRow; c++) {
            seats.push({ label: `${rowChar}${c}`, status: "available" });
          }
        }
        return seats;
      };

      const moviesToSeed = [
        {
          title: "The Midnight Heist",
          genre: "Action",
          description: "An action-packed thriller about a daring heist.",
          poster: "/logo192.png",
          showtimes: [
            {
              time: "12:00",
              seatsAvailable: 30,
              price: 9,
              seats: makeSeats(5, 6),
            },
            {
              time: "15:30",
              seatsAvailable: 30,
              price: 11,
              seats: makeSeats(5, 6),
            },
            {
              time: "19:00",
              seatsAvailable: 30,
              price: 13,
              seats: makeSeats(5, 6),
            },
          ],
        },
        {
          title: "Moonlit Melody",
          genre: "Romance",
          description: "A romantic journey that spans continents and time.",
          poster: "/logo192.png",
          showtimes: [
            {
              time: "11:00",
              seatsAvailable: 30,
              price: 8,
              seats: makeSeats(5, 6),
            },
            {
              time: "14:00",
              seatsAvailable: 30,
              price: 10,
              seats: makeSeats(5, 6),
            },
            {
              time: "18:00",
              seatsAvailable: 30,
              price: 12,
              seats: makeSeats(5, 6),
            },
          ],
        },
      ];

      await Movie.create(moviesToSeed);
      console.log("Seeded sample movies");
    }
  } catch (err) {
    console.error("Error seeding movies", err.message);
  }
};

seedMovies();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/bookings", bookingRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// // Connect to the database
// dbConfig();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
