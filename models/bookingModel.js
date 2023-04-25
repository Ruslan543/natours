const mongoose = require("mongoose");
const Tour = require("./../models/tourModel");

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "Booking must below to a Tour!"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must below to a User!"],
  },
  price: {
    type: Number,
    required: [true, "Booking must have a price."],
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: [true, "Please provide tour start date!"],
  },
});

bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

bookingSchema.pre("save", async function (next) {
  const tour = await Tour.findById(this.tour);

  // if (tour.maxGroupSize === tour.participants) {
  //   tour.startDates = tour.startDates.map((dateObject) => {
  //     if (!dateObject.date === this.startDate) return dateObject;

  //     dateObject.soldOut = true;
  //     return dateObject;
  //   });
  // }

  tour.startDates = tour.startDates.map((dateObject) => {
    if (dateObject.date.getTime() !== this.startDate.getTime())
      return dateObject;

    dateObject.participants += 1;
    dateObject.soldOut = dateObject.participants >= tour.maxGroupSize;

    return dateObject;
  });

  await tour.save();

  next();
});

bookingSchema.pre(/^find/, function (next) {
  this.populate("user").populate({
    path: "tour",
    select: "name",
  });

  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
