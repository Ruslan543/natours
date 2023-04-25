const multer = require("multer");
const sharp = require("sharp");
const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("./../utils/appError");
// const APIFeatures = require("./../utils/apiFeatures");

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (request, response, next, value) => {
//   console.log(`Tour id is: ${value}`);

//   if (+request.params.id > tours.length - 1) {
//     return response.status(404).json({
//       status: "fail",
//       message: "Invalid ID",
//     });
//   }

//   next();
// };

// exports.checkBody = (request, response, next) => {
//   if (!request.body.name || !request.body.price) {
//     return response.status(400).json({
//       status: "fail",
//       message: "Missing name or price",
//     });
//   }

//   next();
// };

// exports.updateRatings = async (id, updateOptions) => {
//   await Tour.findByIdAndUpdate(id, updateOptions);
// };

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    return cb(null, true);
  }

  cb(new AppError("Not an image! Please upload only images.", 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 3,
  },
]);

// upload.single("image"); request.file
// upload.array("images", 3); request.files

exports.resizeTourImages = catchAsync(async (request, response, next) => {
  if (!request.files.imageCover || !request.files.images) return next();

  // 1) Cover image
  request.body.imageCover = `tour-${
    request.params.id
  }-${Date.now()}-cover.jpeg`;

  await sharp(request.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${request.body.imageCover}`);

  // 2) Images
  request.body.images = [];

  await Promise.all(
    request.files.images.map(async (file, index) => {
      const filename = `tour-${request.params.id}-${Date.now()}-${
        index + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      request.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (request, response, next) => {
  request.query.limit = "5";
  request.query.sort = "-ratingsAverage,price";
  request.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

exports.getAllTours = factory.getAll(Tour, "tours");
exports.getTour = factory.getOne(Tour, "tour", { path: "reviews" });
exports.createTour = factory.createOne(Tour, "tour");
exports.updateTour = factory.updateOne(Tour, "tour");
exports.deleteTour = factory.deleteOne(Tour);

// exports.getAllTours = catchAsync(async (request, response, next) => {
//   // console.log(request.query);

//   const features = new APIFeatures(Tour.find(), request.query);
//   features.filter().sort().limitFields().paginate();

//   const tours = await features.query;

//   // if (!tours.length) throw new Error("This page does not exist");

//   // const query = Tour.find()
//   //   .where("duration")
//   //   .equals(5)
//   //   .where("difficulty")
//   //   .equals("easy");

//   // SEND RESPONSE
//   response.status(200).json({
//     status: "success",
//     results: tours.length,
//     data: { tours },
//   });
// });

// exports.getTour = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findById(request.params.id).populate("reviews");
//   // Tour.findOne({ _id: request.params.id });

//   if (!tour) return next(new AppError("No tour found with that ID", 404));

//   response.status(200).json({
//     status: "success",
//     data: { tour },
//   });
// });

// exports.createTour = catchAsync(async (request, response, next) => {
//   // const newTour = new Tour({});
//   // newTour.save();

//   const newTour = await Tour.create(request.body);

//   response.status(201).json({
//     status: "success",
//     data: { tour: newTour },
//   });
// });

// exports.updateTour = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) return next(new AppError("No tour found with that ID", 404));

//   response.status(200).json({
//     status: "success",
//     data: { tour },
//   });
// });

// exports.deleteTour = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findByIdAndDelete(request.params.id);

//   if (!tour) return next(new AppError("No tour found with that ID", 404));

//   response.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (request, response, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRatings: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: {
    //     _id: { $ne: "EASY" },
    //   },
    // },
  ]);

  response.status(200).json({
    status: "success",
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (request, response, next) => {
  const year = +request.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  response.status(200).json({
    status: "success",
    data: { plan },
  });
});

// "/tours-within/:distance/center/:latlng/unit/:unit"
// tours-within/233/center/14.111745,-118.113491/unit/mi

exports.getTourWithin = catchAsync(async (request, response, next) => {
  const { distance, latlng, unit } = request.params;
  const [lat, lng] = latlng.split(",");

  // radians = distance / radius Eath
  // Радианы = расстояние / радиус Земли
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  response.status(200).json({
    status: "success",
    results: tours.length,
    data: { tours },
  });
});

exports.getDistances = catchAsync(async (request, response, next) => {
  const { latlng, unit } = request.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng."
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [+lng, +lat],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  response.status(200).json({
    status: "success",
    data: { distances },
  });
});
