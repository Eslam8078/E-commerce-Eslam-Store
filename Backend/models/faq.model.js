const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [5, "Question must be at least 5 characters"],
      maxlength: [300, "Question cannot exceed 300 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      minlength: [2, "Answer must be at least 2 characters"],
      maxlength: [2000, "Answer cannot exceed 2000 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

faqSchema.index({
  isActive: 1,
  isDeleted: 1,
  createdAt: -1,
});

module.exports = mongoose.model("FAQ", faqSchema);
