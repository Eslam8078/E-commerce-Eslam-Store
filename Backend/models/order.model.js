const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "pending",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
  "refund",
];

const REFUND_STATUSES = ["none", "pending", "approved", "rejected"];

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    priceAtOrder: {
      type: Number,
      required: [true, "Price at order is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
  },
  {
    _id: false,
  },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: [true, "Status is required"],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    orderedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    addressString: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    governorate: {
      type: String,
      required: [true, "Governorate is required"],
      trim: true,
      lowercase: true,
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    deliveryFee: {
      type: Number,
      required: [true, "Delivery fee is required"],
      min: [0, "Delivery fee cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },

    refundStatus: {
      type: String,
      enum: REFUND_STATUSES,
      default: "none",
      index: true,
    },
    stockRestored: {
      type: Boolean,
      default: false,
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({
  userId: 1,
  orderedAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  orderedAt: -1,
});

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;
orderSchema.statics.REFUND_STATUSES = REFUND_STATUSES;

module.exports = mongoose.model("Order", orderSchema);
