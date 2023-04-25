const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const { promisify } = require("util");

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}.`;

  return new AppError(message, 400);
};

const handleDublicateFieldsDB = (error) => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Dublicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  // const arrayErrorMessages = Object.keys(error.errors);
  // const errorMessages = arrayErrorMessages
  //   .map((element) => error.errors[element].message)
  //   .join(". ");

  const errors = Object.values(error.errors)
    .map((element) => element.message)
    .join(". ");

  const message = `Invalid input data. ${errors}`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDevelopment = (error, request, response) => {
  // API
  if (request.originalUrl.startsWith("/api")) {
    return response.status(error.statusCode).json({
      status: error.status,
      error,
      message: error.message,
      stack: error.stack,
    });
  }

  // RENDERED WEBSITE
  response.status(error.statusCode).render("error", {
    title: "Something went wrong!",
    message: error.message,
  });
};

const sendErrorProduction = (error, request, response) => {
  // API
  if (request.originalUrl.startsWith("/api")) {
    // Operational, trusted error: send message to client
    if (error.isOperational) {
      return response.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    // Programming or other unknown error: don't leak error details

    // 1) Log error
    console.error(`ERROR 💥 ${error}`);

    // 2) Send generic message
    return response.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  if (error.isOperational) {
    return response.status(error.statusCode).render("error", {
      title: "Something went wrong!",
      message: error.message,
    });
  }

  // Programming or other unknown error: don't leak error details

  // 1) Log error
  console.error(`ERROR 💥 ${error}`);

  // RENDERED WEBSITE
  response.status(error.statusCode).render("error", {
    title: "Something went wrong!",
    message: "Please try again later!",
  });
};

module.exports = async (error, request, response, next) => {
  // console.log(error.stack);

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  // error.message = error.message || "Internal server error";

  if (process.env.NODE_ENV === "development") {
    return sendErrorDevelopment(error, request, response);
  }

  if (process.env.NODE_ENV === "production") {
    let errorCopy = { ...error, message: error.message };
    // errorCopy.message = error.message;

    if (errorCopy.name === "CastError")
      errorCopy = handleCastErrorDB(errorCopy);

    if (errorCopy.code === 11000)
      errorCopy = handleDublicateFieldsDB(errorCopy);

    if (errorCopy.name === "ValidationError")
      errorCopy = handleValidationErrorDB(errorCopy);

    if (errorCopy.name === "JsonWebTokenError") errorCopy = handleJWTError();

    if (errorCopy.name === "TokenExpiredError")
      errorCopy = handleJWTExpiredError();

    return sendErrorProduction(errorCopy, request, response);
  }
};
