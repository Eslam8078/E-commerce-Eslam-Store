const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "SubCategory name is required"],
      trim: true,
      minlength: [2, "SubCategory name must be at least 2 characters"],
      maxlength: [100, "SubCategory name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      required: [true, "SubCategory slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
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

subCategorySchema.index({
  categoryId: 1,
  name: 1,
});

subCategorySchema.index({
  categoryId: 1,
  isActive: 1,
  isDeleted: 1,
});

module.exports = mongoose.model("SubCategory", subCategorySchema);
