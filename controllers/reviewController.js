const Review = require("./../models/reviewModel");
const factory = require("./handlerFactory");
// const catchAsync = require("./../utils/catchAsync");

exports.setTourId = (request, response, next) => {
  const { tourId } = request.params;
  const filter = tourId && { tour: tourId };

  request.findObject = filter;

  next();
};

exports.setTourUserIds = (request, response, next) => {
  // Allow nested routes
  const { body } = request;

  body.user = body.user ?? request.user._id;
  body.tour = body.tour ?? request.params.tourId;

  // if (!request.body.tour) request.body.tour = request.params.tourId;
  // if (!request.body.user) request.body.user = request.user._id;

  next();
};

exports.getAllReviews = factory.getAll(Review, "reviews");
exports.getReview = factory.getOne(Review, "review");
exports.createReview = factory.createOne(Review, "review");
exports.updateReview = factory.updateOne(Review, "review");
exports.deleteReview = factory.deleteOne(Review);

// exports.getAllReviews = catchAsync(async (request, response, next) => {
//   const { tourId } = request.params;
//   const filter = tourId ? { tour: tourId } : {};

//   const reviews = await Review.find(filter);

//   response.status(200).json({
//     status: "success",
//     results: reviews.length,
//     data: { reviews },
//   });
// });

// exports.createReview = catchAsync(async (request, response, next) => {
//   // Allow nested routes
//   const { body } = request;

//   body.user = body.user ?? request.user._id;
//   body.tour = body.tour ?? request.params.tourId;

//   // if (!request.body.tour) request.body.tour = request.params.tourId;
//   // if (!request.body.user) request.body.user = request.user._id;

//   const newReview = await Review.create(request.body);

//   response.status(201).json({
//     status: "success",
//     data: { review: newReview },
//   });
// });
