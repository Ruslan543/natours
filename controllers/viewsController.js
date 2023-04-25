const Tour = require("./../models/tourModel");
const User = require("./../models/userModel");
const Booking = require("./../models//bookingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getOverview = catchAsync(async (request, response, next) => {
  // !) Get tour data from collection
  // let query = Tour.find();

  // if (request.user) {
  //   const booking = await Booking.find({ user: request.user });
  //   const tourIds = booking.map((element) => element.tour._id);

  //   tourIds.forEach((tourId) => {
  //     query = query.find({ _id: { $ne: tourId } });
  //   });
  // }

  const tours = await Tour.find();

  // 2) Build template

  // 3) Render that template using tour data from 1)
  response.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (request, response, next) => {
  const tour = await Tour.findOne({ slug: request.params.slug }).populate({
    path: "reviews",
    select: "review rating user",
  });

  if (!tour) return next(new AppError("There is no tour with that name.", 404));

  // const booking = await Booking.findOne({
  //   user: request.user._id,
  //   tour: tour._id,
  // });

  // if (!booking) return next(new AppError("Please book a tour to see!", 404));

  response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
  response.setHeader("Pragma", "no-cache"); // HTTP 1.0.
  response.setHeader("Expires", "0"); // Proxies.

  response.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (request, response, next) => {
  response.status(200).render("login", {
    title: "Log into your account",
  });
});

exports.getAuthentificationForm = catchAsync(
  async (request, response, next) => {
    response.status(200).render("authentification", {
      title: "Two-factor account authentication",
    });
  }
);

exports.getAccount = catchAsync(async (request, response, next) => {
  response.status(200).render("account", {
    title: "Your account",
  });
});

exports.getMyTours = catchAsync(async (request, response, next) => {
  const bookings = await Booking.find({ user: request.user._id });

  // const toursIDs = request.user.bookings.map((element) => element.tour._id);
  const toursIDs = bookings.map((element) => element.tour._id);
  const tours = await Tour.find({ _id: { $in: toursIDs } });

  response.status(200).render("overview", {
    title: "",
    tours,
  });
});

exports.updateUserData = catchAsync(async (request, response, next) => {
  const updatedUser = await User.finByIdAndUpdate(
    request.user._id,
    {
      name: request.body.name,
      email: request.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  response.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});
