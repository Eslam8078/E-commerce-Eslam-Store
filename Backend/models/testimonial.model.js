const mongoose = require("mongoose");

const TESTIMONIAL_STATUSES = ["pending", "approved", "declined"];

const testimonialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [5, "Message must be at least 5 characters"],
      maxlength: [500, "Message cannot exceed 500 characters"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer",
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: TESTIMONIAL_STATUSES,
        message: "Invalid testimonial status",
      },
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

testimonialSchema.index({
  userId: 1,
  createdAt: -1,
});

testimonialSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
module.exports.TESTIMONIAL_STATUSES = TESTIMONIAL_STATUSES;
