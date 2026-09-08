const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const logger = require("../utilities/logger.util");
const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");

exports.authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn(
      `Authentication failed | no token provided | ${req.method} ${req.originalUrl} | ip:${req.ip}`,
    );
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.SECRET_KEY);

  const myUser = await User.findById(decoded.id).select("-password");

  if (!myUser) {
    logger.warn(
      `Authentication failed | user not found | user:${decoded.id} | ip:${req.ip}`,
    );
    return next(new AppError("User no longer exists", 401));
  }

  if (myUser.isDeleted) {
    logger.warn(
      `Authentication rejected | deleted user:${myUser._id} | ip:${req.ip}`,
    );

    return next(new AppError("User no longer exists", 401));
  }

  if (myUser.isBlocked) {
    logger.warn(
      `Authentication rejected | blocked user:${myUser._id} | ip:${req.ip}`,
    );

    return next(new AppError("Your account has been blocked", 403));
  }

  req.user = myUser;

  logger.debug(
    `Authentication successful | user:${myUser._id} | role:${myUser.role} | ${req.method} ${req.originalUrl}`,
  );

  next();
});
