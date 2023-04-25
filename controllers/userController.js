const multer = require("multer");
const sharp = require("sharp");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split("/")[1];

//     cb(null, `user-${req.user._id}-${Date.now()}.${extension}`);
//   },
// });

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

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (request, response, next) => {
  if (!request.file) return next();

  request.file.filename = `user-${request.user._id}-${Date.now()}.jpeg`;

  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${request.file.filename}`);

  next();
});

const filterObject = (object, ...allowedFields) => {
  const newObject = {};

  Object.keys(object).forEach((element) => {
    if (allowedFields.includes(element)) {
      newObject[element] = object[element];
    }
  });

  return newObject;
};

exports.getMe = (request, response, next) => {
  request.params.id = request.user._id;

  next();
};

exports.updateMe = catchAsync(async (request, response, next) => {
  // 1) Create error if user POSTs password data
  if (request.body.password || request.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObject(request.body, "name", "email");
  // const allowedFields = ["name", "email"];
  // const filteredBody = filterObj(request.body, allowedFields);

  if (request.file) filteredBody.photo = request.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    request.user._id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  response.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (request, response, next) => {
  await User.findByIdAndUpdate(request.user._id, { active: false });

  response.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (requset, response) => {
  response.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

exports.getAllUsers = factory.getAll(User, "users");
exports.getUser = factory.getOne(User, "user");

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User, "user");
exports.deleteUser = factory.deleteOne(User);
