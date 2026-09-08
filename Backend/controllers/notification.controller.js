const mongoose = require("mongoose");

const Notification = require("../models/notification.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");

const { NOTIFICATION_TYPES } = Notification;

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const findMyNotificationOrFail = async (id, userId, context) => {
  if (!isValidObjectId(id)) {

    throw new AppError("Invalid notification id", 400);
  }

  const notification = await Notification.findOne({
    _id: id,
    userId,
  });

  if (!notification) {

    throw new AppError("Notification not found", 404);
  }

  return notification;
};

const getUnreadFilter = (value) => {
  if (value === undefined || value === null || value === "") {
    return {};
  }

  if (value === "true") {
    return {
      isRead: false,
    };
  }

  if (value === "false") {
    return {
      isRead: true,
    };
  }

  throw new AppError("unread must be true or false", 400);
};

exports.getMyNotificationsFilter = async (req) => {
  const filter = {
    userId: req.user._id,
  };

  const unreadFilter = getUnreadFilter(req.query.unread);

  return {
    ...filter,
    ...unreadFilter,
  };
};

exports.getMyNotificationsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Notification, req, exports.getMyNotificationsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ["createdAt"],
      defaultOrder: "desc",
    });

  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    message: "Notifications list",
    count: results.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    unreadCount,
    data: results,
  });
});

exports.getNotificationById = catchAsync(async (req, res, next) => {
  const notification = await findMyNotificationOrFail(
    req.params.id,
    req.user._id,
    "Get notification",
  );

  res.status(200).json({
    message: "Notification found",
    data: notification,
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await findMyNotificationOrFail(
    req.params.id,
    req.user._id,
    "Mark notification as read",
  );

  if (notification.isRead) {

    return res.status(200).json({
      message: "Notification is already read",
      data: notification,
    });
  }

  notification.isRead = true;

  await notification.save();

  res.status(200).json({
    message: "Notification marked as read",
    data: notification,
  });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await Notification.updateMany(
    {
      userId: req.user._id,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
      },
    },
  );

  res.status(200).json({
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await findMyNotificationOrFail(
    req.params.id,
    req.user._id,
    "Delete notification",
  );

  await notification.deleteOne();

  res.status(200).json({
    message: "Notification deleted successfully",
    data: { _id: req.params.id },
  });
});

exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
