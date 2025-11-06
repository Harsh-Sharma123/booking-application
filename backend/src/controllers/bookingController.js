const Booking = require("../models/Booking");
const Movie = require("../models/Movie");

exports.create = async (req, res) => {
  try {
    const userId = req.userId;
    let { movieId, showtime, quantity, selectedSeats } = req.body;

    if (!movieId || !showtime) {
      return res
        .status(400)
        .json({ message: "movieId and showtime are required" });
    }

    if (
      selectedSeats &&
      (!Array.isArray(selectedSeats) || selectedSeats.length === 0)
    ) {
      return res
        .status(400)
        .json({
          message: "selectedSeats must be a non-empty array when provided",
        });
    }

    // Determine ticket count
    let ticketCount = (selectedSeats && selectedSeats.length) || quantity || 1;

    // If no selectedSeats provided, we'll pick first available seats
    if (!selectedSeats) {
      const movie = await Movie.findById(movieId);
      if (!movie) return res.status(404).json({ message: "Movie not found" });
      const st = movie.showtimes.find((s) => s.time === showtime);
      if (!st) return res.status(400).json({ message: "Showtime not found" });
      if (st.seatsAvailable < ticketCount)
        return res.status(400).json({ message: "Not enough seats available" });

      const availableSeats = (st.seats || [])
        .filter((s) => s.status === "available")
        .slice(0, ticketCount)
        .map((s) => s.label);
      if (availableSeats.length < ticketCount)
        return res.status(400).json({ message: "Not enough seats available" });
      selectedSeats = availableSeats;
    }

    // Build filter to ensure all selected seats are currently available for that showtime
    const seatMatchConditions = selectedSeats.map((label) => ({
      showtimes: {
        $elemMatch: {
          time: showtime,
          seats: { $elemMatch: { label: label, status: "available" } },
        },
      },
    }));

    const findFilter = {
      _id: movieId,
      "showtimes.time": showtime,
      $and: seatMatchConditions,
    };

    const update = {
      $set: { "showtimes.$[st].seats.$[seat].status": "reserved" },
      $inc: { "showtimes.$[st].seatsAvailable": -ticketCount },
    };

    const arrayFilters = [
      { "st.time": showtime },
      { "seat.label": { $in: selectedSeats }, "seat.status": "available" },
    ];

    // Atomically reserve seats only if all are available
    const updated = await Movie.findOneAndUpdate(findFilter, update, {
      arrayFilters,
      new: true,
    });

    if (!updated) {
      return res
        .status(400)
        .json({
          message:
            "One or more selected seats are no longer available. Please refresh and try again.",
        });
    }

    const updatedShow = updated.showtimes.find((s) => s.time === showtime);
    const seatPrice = updatedShow?.price || 10;
    const totalPrice = seatPrice * ticketCount;

    const booking = new Booking({
      user: userId,
      movie: movieId,
      showtime,
      quantity: ticketCount,
      totalPrice,
    });
    await booking.save();

    res.status(201).json({ booking });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating booking", error: err.message });
  }
};

exports.listForUser = async (req, res) => {
  try {
    const userId = req.userId;
    const bookings = await Booking.find({ user: userId }).populate("movie");
    res.json({ bookings });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: err.message });
  }
};
