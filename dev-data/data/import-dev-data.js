const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");
const User = require("./../../models/userModel");
const Review = require("./../../models/reviewModel");
const Booking = require("./../../models/bookingModel");

dotenv.config({ path: "./../../config.env" });

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DATABASE connection successful!"));

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours copy.json`, "utf-8")
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

const importData = async () => {
  try {
    // await Tour.create(tours);
    // await User.create(users, { validateBeforeSave: false });
    // await Review.create(reviews);

    console.log("Data successfully loaded!");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

const deleteData = async () => {
  try {
    // await Tour.deleteMany();
    // await User.deleteMany();
    // await Review.deleteMany();
    await Booking.deleteMany();

    console.log("Data successfully deleted!");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

if (process.argv[2] === "--import") importData();

if (process.argv[2] === "--delete") deleteData();

console.log(process.argv);
