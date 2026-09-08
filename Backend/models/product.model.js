const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    images: {
      type: [String],
      required: [true, "At least one product image is required"],
      validate: {validator: (images) =>Array.isArray(images) && images.length > 0,message: "At least one product image is required" }
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "SubCategory is required"],
      index: true,
    },

    season: {
      type: String,
      enum: [
        "summer",
        "winter",
        "spring",
        "autumn",
        "all",
      ],
      default: "all",
      index: true,
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock quantity must be an integer",
      },
      default: 0,
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

    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  categoryId: 1,
  isActive: 1,
  isDeleted: 1,
});

productSchema.index({
  subCategoryId: 1,
  isActive: 1,
  isDeleted: 1,
});

productSchema.index({
  price: 1,
});

productSchema.index({
  createdAt: -1,
});

module.exports =mongoose.model("Product", productSchema);