const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsync = require("./../utils/catchAsync");
const Tour = require("./../models/tourModel");
const Booking = require("./../models/bookingModel");
const factory = require("./../controllers/handlerFactory");
const AppError = require("./../utils/appError");

exports.getCheckoutSession = catchAsync(async (request, response, next) => {
  // 1) Get the currently booked tour
  const { tourId, startDate } = request.params;

  const booking = await Booking.find({ user: request.user, tour: tourId });
  if (booking) {
    return next(new AppError("You have already booked this tour.", 403));
  }

  const tour = await Tour.findById(tourId);
  const date = tour.findStartDate(+startDate);

  if (!date) return next(new AppError("No such date exists", 404));

  if (date.soldOut)
    return next(new AppError("Can't book tour as group is full", 403));

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${request.protocol}://${request.get(
      "host"
    )}/?tour=${tourId}&user=${request.user._id}&price=${
      tour.price
    }&startDate=${startDate}`,
    cancel_url: `${request.protocol}://${request.get("host")}/tour/${
      tour.slug
    }`,
    customer_email: request.user.email,
    client_reference_id: tourId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: tour.price,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });

  // 3) Create session as response
  response.status(200).json({
    status: "success",
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (request, response, next) => {
  // This is only TEMPORARY, because it's UNSECURE everyone can make bookings without paying
  const { tour, user, price, startDate } = request.query;

  // console.log(tour);
  if (!tour || !user || !price || !startDate) return next();

  // const currentTour = await Tour.findById(tour);
  // const tourDate = currentTour.startDates.find(
  //   (dateObject) => dateObject.date.getTime() === Date.parse(startDate)
  // );

  // if (tourDate.soldOut) return next();

  await Booking.create({ tour, user, price, startDate });

  response.redirect(request.originalUrl.split("?")[0]);
});

exports.setIDs = (request, response, next) => {
  const { tourId, userId } = request.params;
  const filter = {};

  if (tourId) filter.tour = tourId;
  if (userId) filter.user = userId;

  request.findObject = filter;

  next();
};

exports.getAllBookings = factory.getAll(Booking, "bookings");
exports.createBooking = factory.createOne(Booking, "booking");
exports.getBooking = factory.getOne(Booking, "booking");
exports.updateBooking = factory.updateOne(Booking, "booking");
exports.deleteBooking = factory.deleteOne(Booking);
