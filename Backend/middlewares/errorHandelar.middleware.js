const logger = require("../utilities/logger.util");
const AppError = require("../utilities/appError.util");

const handleCastError = (err) =>
  new AppError(`Invalid value for ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = field ? err.keyValue[field] : "value";
  return new AppError(`${field || "Field"} "${value}" is already in use`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((item) => item.message);
  return new AppError(messages.join(". "), 400);
};

const handleJwtError = () =>
  new AppError("Invalid token, please log in again", 401);

const handleJwtExpiredError = () =>
  new AppError("Your token has expired, please log in again", 401);

const normalizeError = (err) => {
  if (err.name === "CastError") {
    return handleCastError(err);
  }

  if (err.code === 11000) {
    return handleDuplicateFieldsError(err);
  }

  if (err.name === "ValidationError") {
    return handleValidationError(err);
  }

  if (err.name === "JsonWebTokenError") {
    return handleJwtError();
  }

  if (err.name === "TokenExpiredError") {
    return handleJwtExpiredError();
  }

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return new AppError("Image file size cannot exceed 2 MB", 400);
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return new AppError("Too many image files", 400);
    }

    return new AppError("Invalid image upload", 400);
  }

  return err;
};

module.exports = (err, req, res, next) => {
  const normalizedError = normalizeError(err);

  normalizedError.statusCode = normalizedError.statusCode || 500;
  normalizedError.status = normalizedError.status || "error";

  const userInfo = req.user
    ? `user:${req.user.name} - ${req.user._id}`
    : "user:Guest";

  logger.error(
    `Error found | status:${normalizedError.statusCode} | ${req.method} ${req.originalUrl} | ${normalizedError.message} | ${userInfo} | ip:${req.ip}`,
    {
      stack: err.stack,
      name: err.name,
    },
  );

  if (process.env.NODE_ENV === "dev") {
    return res.status(normalizedError.statusCode).json({
      status: normalizedError.status,
      message: normalizedError.message,
      error: err,
      stack: err.stack,
    });
  }

  if (normalizedError.isOperational) {
    return res.status(normalizedError.statusCode).json({
      status: normalizedError.status,
      message: normalizedError.message,
    });
  }

  logger.error(
    `Unexpected server error | ${req.method} ${req.originalUrl} | user:${req.user?._id || "Guest"}`,
  );

  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};
