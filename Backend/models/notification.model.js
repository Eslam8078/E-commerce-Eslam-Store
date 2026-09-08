const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "birthday",
  "new_order",
  "new_testimonial",
  "testimonial_approved",
  "testimonial_declined",
  "refund_requested",
  "refund_approved",
  "refund_rejected",
  "order_status_changed",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Invalid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Notification message cannot exceed 500 characters"],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    relatedType: {
      type: String,
      enum: ["order", "testimonial", "user"],
      default: null,
    },
    birthdayYear: {
      type: Number,
      default: null,
      min: [2000, "Invalid birthday year"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index(
  { userId: 1, type: 1, birthdayYear: 1 },
  { unique: true, partialFilterExpression: { type: "birthday" } },
);

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
