const Movie = require("../models/Movie");

exports.list = async (req, res) => {
  try {
    const movies = await Movie.find({});
    res.json({ movies });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching movies", error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ movie });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching movie", error: err.message });
  }
};

// Utility endpoint to initialize seats for all movies
exports.initializeSeats = async (req, res) => {
  try {
    const movies = await Movie.find({});

    for (const movie of movies) {
      const updatedShowtimes = movie.showtimes.map((showtime) => ({
        ...showtime.toObject(),
        seats: showtime.seats?.length ? showtime.seats : generateSeats(),
        seatsAvailable: 100,
      }));

      await Movie.updateOne(
        { _id: movie._id },
        { $set: { showtimes: updatedShowtimes } }
      );
    }

    res.json({ message: "Successfully initialized seats for all movies" });
  } catch (err) {
    res.status(500).json({
      message: "Error initializing seats",
      error: err.message,
    });
  }
};

exports.getShowtimeSeats = async (req, res) => {
  try {
    const { id, showtime } = req.params;
    let movie = await Movie.findOne(
      {
        _id: id,
        "showtimes.time": showtime,
      },
      {
        "showtimes.$": 1,
      }
    );

    if (!movie)
      return res.status(404).json({ message: "Movie or showtime not found" });

    // Initialize seats if they don't exist
    if (!movie.showtimes[0].seats || movie.showtimes[0].seats.length === 0) {
      const seats = generateSeats();
      await Movie.updateOne(
        { _id: id, "showtimes.time": showtime },
        {
          $set: {
            "showtimes.$.seats": seats,
            "showtimes.$.seatsAvailable": seats.length,
          },
        }
      );
      movie = await Movie.findOne(
        { _id: id, "showtimes.time": showtime },
        { "showtimes.$": 1 }
      );
    }

    const seats = movie.showtimes[0].seats;
    const seatsAvailable = movie.showtimes[0].seatsAvailable;

    res.json({ seats, seatsAvailable });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching seats", error: err.message });
  }
};

// basic admin helper to create a movie (not protected here)
// Helper function to generate seat labels (A1, A2, ... B1, B2, etc.)
const generateSeats = (rows = 10, seatsPerRow = 10) => {
  const seats = [];
  for (let i = 0; i < rows; i++) {
    const rowLabel = String.fromCharCode(65 + i); // A, B, C, ...
    for (let j = 1; j <= seatsPerRow; j++) {
      seats.push({
        label: `${rowLabel}${j}`,
        status: "available",
      });
    }
  }
  return seats;
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;

    // Initialize seats for each showtime if they don't have seats
    if (payload.showtimes) {
      payload.showtimes = payload.showtimes.map((showtime) => ({
        ...showtime,
        seats: showtime.seats || generateSeats(),
        seatsAvailable: 100, // Total number of seats
      }));
    }

    const movie = new Movie(payload);
    await movie.save();
    res.status(201).json({ movie });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating movie", error: err.message });
  }
};
