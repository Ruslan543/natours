const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, response) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  cookieOptions.secure = process.env.NODE_ENV === "production";

  response.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  response.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (request, response, next) => {
  const newUser = await User.create({
    name: request.body.name,
    email: request.body.email,
    password: request.body.password,
    passwordConfirm: request.body.passwordConfirm,
  });

  // const url = `${request.protocol}://${request.get("host")}/me`;
  // await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, response);
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body;

  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 401));

  const code = user.createAuthentification();
  await user.save({ validateBeforeSave: false });

  // createSendToken(user, 200, response);
  response.status(200).json({
    status: "success",
    code,
    message: "Verification code has been sent to your email.",
  });
});

exports.authentification = catchAsync(async (request, response, next) => {
  const { code } = request.body;

  const hashCode = crypto.createHash("sha256").update(code).digest("hex");
  const user = await User.findOne({
    authentificationCode: hashCode,
    authentificationExpires: { $gte: Date.now() },
  });

  if (!user) return next(new AppError("Incorrect code", 401));

  user.authentificationCode = undefined;
  user.authentificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, response);
});

// exports.refresh = catchAsync(async (request, response, next) => {
//   const { refreshToken } = request.cookies;

//   if (!refreshToken) return next(new AppError("", 401));

//   const decoded = await promisify(jwt.verify)(
//     refreshToken,
//     process.env.JWT_SECRET
//   );

//   const currentUser = await User.findById(decoded.id);

//   if (!currentUser) {
//     return next(new AppError("", 401));
//   }

//   if (currentUser.changedPasswordAfter(decoded.iat)) {
//     return next(
//       new AppError("User recently changed password! Please log in again.", 401)
//     );
//   }

//   const newAccessToken = jwt.sign(
//     { id: currentUser._id },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: "5s",
//     }
//   );

//   response.cookie("accessToken", newAccessToken, {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     secure: true,
//   });

//   // response.redirect("http://127.0.0.1:3000/login");
//   // response.status(200).json({
//   //   status: "success",
//   //   token: newAccessToken,
//   //   user: currentUser,
//   // });
// });

exports.logout = catchAsync(async (request, response, next) => {
  response.cookie("accessToken", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  response.status(200).json({
    status: "success",
  });
});

exports.protect = catchAsync(async (request, response, next) => {
  // 1) Getting token and check of it's there
  const { authorization } = request.headers;
  let token;

  if (authorization && authorization.startsWith("Bearer")) {
    // [, token] = authorization.split(" ");
    token = authorization.split(" ")[1];
  } else if (request.cookies.jwt) {
    token = request.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );

  // GRAND ACCESS TO PROTECTED ROUTE
  request.user = currentUser;
  response.locals.user = currentUser;

  next();
});

// Only for rendered, no errors!
exports.isLoggedIn = catchAsync(async (request, response, next) => {
  try {
    // 1) Getting token and check of it's there
    const token = request.cookies.jwt;

    if (!token) return next();

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) return next();

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    // THERE IS A LOGGED USER
    request.user = currentUser;
    response.locals.user = currentUser;
  } catch (error) {
    return next();
  }

  next();
});

exports.restrictTo =
  (...roles) =>
  (request, response, next) => {
    // roles ["admin", "lead-guide"]

    if (!roles.includes(request.user.role))
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );

    next();
  };

exports.forgotPassword = catchAsync(async (request, response, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: request.body.email });

  if (!user)
    return next(new AppError("There is no user with email address.", 404));

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${request.protocol}://${request.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    response.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passworrdResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (request, response, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(request.params.token)
    .digest("hex");

  // 2) If token has not expired, and there is user, set the new password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changePasswordAt property for the user

  // 4) Log the user in, JWT
  createSendToken(user, 200, response);
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  const { passwordCurrent, password, passwordConfirm } = request.body;

  // 1) Get user from collection
  const user = await User.findById(request.user._id).select("+password");

  // 2) Check if POSTed current password is correct;
  if (!(await user.correctPassword(passwordCurrent, user.password)))
    return next(new AppError("Your current password is wrong!", 401));

  // 3) Uf so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, response);
});
