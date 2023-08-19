const AppError = require("../utils/AppError");

const errorsDevHandler = (err, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const errorsProdHandler = (err, res) => {
  if (err.isOperational)
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};
const castErrorHandler = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`);

const duplicateErrorHandler = (err) =>
  new AppError(`The ${Object.keys(err.keyValue)[0]} was exists`, 400);

const validationErrorHandler = (err) =>
  new AppError(
    `${Object.values(err.errors)
      .map((el) => el.message)
      .join(". ")}`,
    400
  );

const JWTErrorHandler = () =>
  new AppError(
    "Your login turn is not security, please check and try again",
    401
  );
const JWTExpiredErrorHandler = () =>
  new AppError("Your login turn was expired, please login again", 401);

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") errorsDevHandler(err, res);
  if (process.env.NODE_ENV === "production") {
    let errProd = { ...err };
    // console.log(errProd);
    if (errProd.reason?.name === "BSONError")
      errProd = castErrorHandler(errProd);
    if (errProd.code === 11000) errProd = duplicateErrorHandler(errProd);
    if (
      errProd.errors &&
      Object.values(errProd.errors)[0]?.name === "ValidatorError"
    )
      errProd = validationErrorHandler(errProd);
    if (errProd.name === "JsonWebTokenError") errProd = JWTErrorHandler();
    if (errProd.name === "TokenExpiredError")
      errProd = JWTExpiredErrorHandler();
    errorsProdHandler(errProd, res);
  }
};
