const Testimonial = require("../models/testimonial.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");

const { TESTIMONIAL_STATUSES } = Testimonial;
const [PENDING, APPROVED, DECLINED] = TESTIMONIAL_STATUSES;

exports.createTestimonial = catchAsync(async (req, res, next) => {
  const { rating } = req.body;
  const message =
    typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!message) {

    return next(new AppError("Testimonial message is required", 400));
  }

  const numericRating = Number(rating);

  const isValidRating =
    rating !== undefined &&
    rating !== null &&
    Number.isInteger(numericRating) &&
    numericRating >= 1 &&
    numericRating <= 5;

  if (!isValidRating) {

    return next(new AppError("Rating must be an integer between 1 and 5", 400));
  }

  const user = await User.findById(req.user._id).select(
    "name role isDeleted isBlocked",
  );

  if (!user) {

    return next(new AppError("User not found", 404));
  }

  if (user.isDeleted) {

    return next(new AppError("Your account has been deleted", 403));
  }

  if (user.isBlocked) {

    return next(new AppError("Your account has been blocked", 403));
  }

  const testimonialCount = await Testimonial.countDocuments({
    userId: user._id,
    isDeleted: false,
  });

  if (testimonialCount >= 5) {
    return next(new AppError("You can submit a maximum of 5 testimonials", 400));
  }

  const hasVerifiedPurchase = await Order.exists({
    userId: user._id,
    orderStatus: "delivered",
    "items.0": { $exists: true },
  });

  if (!hasVerifiedPurchase) {
    return next(new AppError("You can submit a testimonial after a delivered order", 400));
  }

  const testimonial = await Testimonial.create({
    userId: user._id,
    message,
    rating: numericRating,
    status: PENDING,
  });

  try {
    const admins = await User.find({
      role: "admin",
      isDeleted: false,
      isBlocked: false,
    }).select("_id");

    if (admins.length === 0) {
    } else {
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        type: "new_testimonial",
        message: `New testimonial submitted by ${user.name}`,
        relatedId: testimonial._id,
        relatedType: "testimonial",
      }));

      await Notification.insertMany(notifications);

    }
  } catch (err) {
  }

  res.status(201).json({
    message: "Testimonial submitted successfully",
    data: testimonial,
  });
});

exports.myTestimonialsFilter = async (req) => ({
  userId: req.user._id,
  isDeleted: false,
});

exports.getMyTestimonialsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Testimonial, req, exports.myTestimonialsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ["createdAt", "rating"],
      defaultOrder: "desc",
    });

  res.status(200).json({
    message: "Your testimonials",
    count: results.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: results,
  });
});

exports.approvedTestimonialsFilter = async () => ({
  status: APPROVED,
  isDeleted: false,
});

exports.getApprovedTestimonialsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Testimonial, req, exports.approvedTestimonialsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ["createdAt", "rating"],
      defaultOrder: "desc",
      populate: [{ path: "userId", select: "name" }],
    });

  res.status(200).json({
    message: "Approved testimonials",
    count: results.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: results,
  });
});

exports.allTestimonialsFilter = async (req) => {
  const { status, includeDeleted, isDeleted } = req.query;

  const filter = {};

  if (isDeleted === "true") {
    filter.isDeleted = true;
  } else if (isDeleted === "false") {
    filter.isDeleted = false;
  } else if (includeDeleted !== "true") {
    filter.isDeleted = false;
  }

  if (status) {
    if (!TESTIMONIAL_STATUSES.includes(status)) {
      throw new AppError("Invalid testimonial status", 400);
    }
    filter.status = status;
  }

  return filter;
};

exports.getAllTestimonialsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Testimonial, req, exports.allTestimonialsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ["createdAt", "rating"],
      defaultOrder: "desc",
      populate: [{ path: "userId", select: "name email mobilePhone" }],
    });

  res.status(200).json({
    message: "Testimonials list",
    count: results.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: results,
  });
});

exports.getTestimonialById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findById(id).populate(
    "userId",
    "name email mobilePhone",
  );

  if (!testimonial) {

    return next(new AppError("Testimonial not found", 404));
  }

  res.status(200).json({
    message: "Testimonial found",
    data: testimonial,
  });
});

exports.updateTestimonialStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const reviewStatuses = [APPROVED, DECLINED];

  if (!reviewStatuses.includes(status)) {

    return next(new AppError("Status must be approved or declined", 400));
  }

  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {

    return next(new AppError("Testimonial not found", 404));
  }

  if (testimonial.status !== PENDING) {

    return next(new AppError("Only pending testimonials can be reviewed", 400));
  }

  const oldStatus = testimonial.status;

  if (testimonial.isDeleted) {
    return next(new AppError("Only active pending testimonials can be reviewed", 400));
  }

  testimonial.status = status;

  await testimonial.save();

  const notificationType =
    status === APPROVED ? "testimonial_approved" : "testimonial_declined";

  const notificationMessage =
    status === APPROVED
      ? "Your testimonial has been approved"
      : "Your testimonial has been declined";

  try {
    const customer = await User.findOne({
      _id: testimonial.userId,
      isDeleted: false,
    }).select("_id");

    if (!customer) {
    } else {
      await Notification.create({
        userId: testimonial.userId,
        type: notificationType,
        message: notificationMessage,
        relatedId: testimonial._id,
        relatedType: "testimonial",
      });

    }
  } catch (err) {
  }

  res.status(200).json({
    message: `Testimonial ${status} successfully`,
    data: testimonial,
  });
});

exports.deleteMyTestimonial = catchAsync(async (req, res, next) => {
  const testimonial = await Testimonial.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!testimonial) {
    return next(new AppError("Testimonial not found", 404));
  }

  testimonial.isDeleted = true;
  await testimonial.save();

  return res.status(200).json({
    message: "Testimonial deleted successfully",
    data: testimonial,
  });
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findById(id);

  if (!testimonial) {
    return next(new AppError("Testimonial not found", 404));
  }

  if (testimonial.isDeleted) {
    return next(new AppError("Testimonial is already deleted", 400));
  }

  testimonial.isDeleted = true;
  await testimonial.save();

  return res.status(200).json({
    message: "Testimonial deleted successfully",
    data: testimonial,
  });
});

exports.restoreTestimonial = catchAsync(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    return next(new AppError("Testimonial not found", 404));
  }

  if (!testimonial.isDeleted) {
    return next(new AppError("Testimonial is not deleted", 400));
  }

  testimonial.isDeleted = false;
  await testimonial.save();

  return res.status(200).json({
    message: "Testimonial restored successfully",
    data: testimonial,
  });
});
