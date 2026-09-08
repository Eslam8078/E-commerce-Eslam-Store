const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const Counter = require("../models/counter.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");
const { parseDateRange } = require("../utilities/dateRange.util");
const logger = require("../utilities/logger.util");
const { getLocations, getDeliveryFee } = require("../services/deliveryLocation.service");

const {
  ORDER_STATUSES: [
    PENDING,
    PREPARING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REJECTED,
    REFUND,
  ],
} = Order;

const CANCELLABLE_STATUSES = [PENDING, PREPARING];
const STOCK_RESTORED_STATUSES = [CANCELLED, REJECTED];

const stockIsRestored = (order) => order.stockRestored === true;

const statusRestoresStock = (status, refundStatus = "none") =>
  STOCK_RESTORED_STATUSES.includes(status) ||
  (status === REFUND && refundStatus === "approved");

const notifyAdmins = async (type, message, context) => {
  try {
    const admins = await User.find({
      role: "admin",
      isDeleted: false,
      isBlocked: false,
    }).select("_id");

    if (admins.length === 0) {
      return;
    }

    const notifications = admins.map((admin) => ({
      userId: admin._id,
      type,
      message,
      relatedId: context?.relatedId || null,
      relatedType: context?.relatedType || null,
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
  }
};

const applyStatusChange = (order, status, changedBy) => {
  order.orderStatus = status;
  order.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy,
  });
};

const restoreOrderStock = async (order, session) => {
  if (order.stockRestored === true) {
    return;
  }

  for (const item of order.items) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.productId },
      { $inc: { stockQuantity: item.quantity } },
      { new: true, session },
    );

    if (!updatedProduct) {
      throw new AppError("Unable to restore product stock", 409);
    }
  }

  order.stockRestored = true;
};

const reserveOrderStock = async (order, session) => {
  if (!order.stockRestored) {
    return;
  }

  for (const item of order.items) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.productId, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity } },
      { new: true, session },
    );

    if (!updatedProduct) {
      throw new AppError(
        "Insufficient stock to move this order back to an active status",
        409,
      );
    }
  }

  order.stockRestored = false;
};

exports.getOrderQuote = catchAsync(async (req, res, next) => {
  const { addressId } = req.query;

  if (!addressId) return next(new AppError("Address is required", 400));

  const user = await User.findById(req.user._id);
  if (!user || user.isDeleted) return next(new AppError("User not found", 404));

  const address = user.addresses.id(addressId);
  if (!address || address.isDeleted) return next(new AppError("Address not found", 404));

  const cart = await Cart.findOne({ userId: user._id });
  if (!cart || cart.items.length === 0) return next(new AppError("Your cart is empty", 400));

  const deliveryFee = await getDeliveryFee(address.governorate, address.city);

  if (deliveryFee === null) {
    return next(new AppError("Invalid delivery location", 400));
  }
  const subtotal = Number(cart.totalPrice || 0);

  return res.status(200).json({
    message: "Order quote",
    data: { subtotal, deliveryFee, totalPrice: subtotal + deliveryFee },
  });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const { addressId } = req.body;

  if (!addressId) {
    return next(new AppError("Address is required", 400));
  }

  const session = await mongoose.startSession();
  let createdOrder;
  let orderSummary = "";

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.user._id).session(session);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.isDeleted) {
        throw new AppError("Your account has been deleted", 403);
      }

      if (user.isBlocked) {
        throw new AppError("Your account has been blocked", 403);
      }

      if (!user.nationalId) {
        throw new AppError(
          "National ID is required before placing an order",
          400,
        );
      }

      if (!user.mobilePhone) {
        throw new AppError(
          "Mobile phone is required before placing an order",
          400,
        );
      }

      const selectedAddress = user.addresses.id(addressId);

      if (!selectedAddress || selectedAddress.isDeleted) {
        throw new AppError("Address not found", 404);
      }

      const cart = await Cart.findOne({ userId: user._id }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError("Your cart is empty", 400);
      }

      const hasPriceChanged = cart.items.some(
        (item) => item.isPriceChanged === true,
      );

      if (hasPriceChanged) {
        throw new AppError(
          "You must resolve all price changes before placing the order",
          400,
        );
      }

      const productIds = cart.items.map((item) => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
      }).session(session);

      const productMap = new Map(
        products.map((product) => [String(product._id), product]),
      );

      let subtotal = 0;

      for (const item of cart.items) {
        const product = productMap.get(String(item.productId));

        if (!product) {
          throw new AppError("One or more products no longer exist", 404);
        }

        if (product.isDeleted || !product.isActive) {
          throw new AppError(
            `Product "${product.name}" is no longer available`,
            400,
          );
        }

        if (Number(product.price) !== Number(item.priceAtOrder)) {
          throw new AppError(
            `Price changed for "${product.name}". Please review your cart`,
            400,
          );
        }

        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new AppError(`Invalid quantity for "${product.name}"`, 400);
        }

        if (product.stockQuantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}`,
            400,
          );
        }

        subtotal += Number(item.priceAtOrder) * Number(item.quantity);
      }

      const deliveryFee = await getDeliveryFee(selectedAddress.governorate, selectedAddress.city);

      if (deliveryFee === null) {
        throw new AppError("Invalid delivery location", 400);
      }

      const totalPrice = subtotal + deliveryFee;

      const formattedAddress = [
        selectedAddress.label,
        selectedAddress.street,
        selectedAddress.city,
        selectedAddress.governorate,
      ]
        .filter(Boolean)
        .join(", ");

      if (!formattedAddress) {
        throw new AppError("Selected address is invalid", 400);
      }

      const counter = await Counter.findOneAndUpdate(
        { _id: "orders" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true, session },
      );

      const orderNumber = String(counter.seq);
      orderSummary = cart.items
        .map((item) => {
          const product = productMap.get(String(item.productId));
          return `${product?.name || "Product"} x${item.quantity}`;
        })
        .join(", ");

      const [order] = await Order.create(
        [
          {
            orderNumber,
            userId: user._id,
            items: cart.items.map((item) => ({
              productId: item.productId,
              priceAtOrder: item.priceAtOrder,
              quantity: item.quantity,
            })),
            orderedAt: new Date(),
            addressString: formattedAddress,
            governorate: selectedAddress.governorate,
            subtotal,
            deliveryFee,
            totalPrice,
            paymentMethod: "cash",
            orderStatus: PENDING,
            stockRestored: false,
            statusHistory: [
              {
                status: PENDING,
                changedAt: new Date(),
                changedBy: user._id,
              },
            ],
          },
        ],
        { session },
      );

      for (const item of cart.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stockQuantity: { $gte: item.quantity },
            isActive: true,
            isDeleted: false,
          },
          {
            $inc: { stockQuantity: -item.quantity },
          },
          { new: true, session },
        );

        if (!updatedProduct) {
          throw new AppError(
            "Stock changed while creating the order. Please try again",
            409,
          );
        }
      }

      cart.items = [];
      cart.totalPrice = 0;
      await cart.save({ session });

      createdOrder = order;
    });

    const customer = await User.findById(createdOrder.userId).select("name");
    const customerName = customer?.name || "Customer";
    const message = `New order #${createdOrder.orderNumber} from ${customerName}: ${orderSummary} | Total: ${createdOrder.totalPrice} EGP`;

    await notifyAdmins(
      "new_order",
      message.slice(0, 500),
      { relatedId: createdOrder._id, relatedType: "order" },
    );

    return res.status(201).json({
      message: "Order created successfully",
      data: createdOrder,
    });
  } finally {
    await session.endSession();
  }
});

exports.getMyOrdersFilter = async (req) => ({
  userId: req.user._id,
});

exports.getMyOrdersHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Order, req, exports.getMyOrdersFilter, {
      defaultSort: "orderedAt",
      allowedSortFields: ["createdAt", "orderedAt", "totalPrice", "orderStatus"],
      populate: [{ path: "items.productId", select: "name slug images" }],
    });

  res.status(200).json({
    message: "Your orders",
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

exports.getMyOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    userId: req.user._id,
  }).populate("items.productId", "name slug images");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    message: "Order found",
    data: order,
  });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  let cancelledOrder;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: id,
        userId: req.user._id,
      }).session(session);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
        throw new AppError("Order can no longer be cancelled", 400);
      }

      await restoreOrderStock(order, session);

      applyStatusChange(order, CANCELLED, req.user._id);

      await order.save({ session });
      cancelledOrder = order;
    });

    res.status(200).json({
      message: "Order cancelled successfully",
      data: cancelledOrder,
    });
  } finally {
    await session.endSession();
  }
});

exports.requestRefund = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });

  if (!order) return next(new AppError("Order not found", 404));
  if (order.orderStatus !== DELIVERED || order.refundStatus === "pending") {
    return next(new AppError("Refund can only be requested for a delivered order", 400));
  }
  if (order.refundStatus === "approved") {
    return next(new AppError("This order has already been refunded", 400));
  }

  applyStatusChange(order, REFUND, req.user._id);
  order.refundStatus = "pending";
  await order.save();

  const customer = await User.findById(req.user._id).select("name");
  await notifyAdmins(
    "refund_requested",
    `Refund requested for order #${order.orderNumber || order._id} by ${customer?.name || "Customer"} | Total: ${order.totalPrice} EGP`,
    { relatedId: order._id, relatedType: "order" },
  );

  res.status(200).json({ message: "Refund requested successfully", data: order });
});

exports.approveRefund = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  let updatedOrder;
  let previousStatus;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new AppError("Order not found", 404);
      if (order.orderStatus !== REFUND || order.refundStatus !== "pending") {
        throw new AppError("Only pending refund requests can be approved", 400);
      }

      await restoreOrderStock(order, session);
      order.refundStatus = "approved";
      await order.save({ session });
      updatedOrder = order;
    });

    await Notification.create({
      userId: updatedOrder.userId,
      type: "refund_approved",
      message: `Your refund for order #${updatedOrder.orderNumber || updatedOrder._id} has been approved`,
      relatedId: updatedOrder._id,
      relatedType: "order",
    });

    res.status(200).json({ message: "Refund approved successfully", data: updatedOrder });
  } finally {
    await session.endSession();
  }
});

exports.rejectRefund = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError("Order not found", 404));
  if (order.orderStatus !== REFUND || order.refundStatus !== "pending") {
    return next(new AppError("Only pending refund requests can be rejected", 400));
  }

  order.refundStatus = "rejected";
  applyStatusChange(order, DELIVERED, req.user._id);
  await order.save();

  await Notification.create({
    userId: order.userId,
    type: "refund_rejected",
    message: `Your refund request for order #${order.orderNumber || order._id} has been rejected`,
    relatedId: order._id,
    relatedType: "order",
  });

  res.status(200).json({ message: "Refund rejected successfully", data: order });
});

exports.getAllOrdersFilter = async (req) => {
  const { status, fromDate, toDate } = req.query;
  const filter = {};

  if (status) {
    if (!Order.ORDER_STATUSES.includes(status)) {
      throw new AppError("Invalid order status", 400);
    }
    filter.orderStatus = status;
  }

  const dateRange = parseDateRange(fromDate, toDate);
  if (dateRange) filter.orderedAt = dateRange;

  return filter;
};

exports.getAllOrdersHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Order, req, exports.getAllOrdersFilter, {
      defaultSort: "orderedAt",
      allowedSortFields: ["createdAt", "orderedAt", "totalPrice", "orderStatus"],
      populate: [
        { path: "userId", select: "name email mobilePhone" },
        { path: "items.productId", select: "name slug images" },
      ],
    });

  res.status(200).json({
    message: "Orders list",
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

exports.getOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("userId", "name email mobilePhone")
    .populate("items.productId", "name slug images");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    message: "Order found",
    data: order,
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!Order.ORDER_STATUSES.includes(status)) {
    return next(new AppError("Invalid order status", 400));
  }

  const session = await mongoose.startSession();
  let updatedOrder;
  let previousStatus;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const oldStatus = order.orderStatus;
      previousStatus = oldStatus;

      if (oldStatus === status) {
        throw new AppError("Order is already in this status", 400);
      }

      if (status === REFUND) {
        await restoreOrderStock(order, session);
        order.refundStatus = "approved";
      } else {
        const stockWasRestored = stockIsRestored(order);
        const stockShouldBeRestored = statusRestoresStock(
          status,
          order.refundStatus,
        );

        if (!stockWasRestored && stockShouldBeRestored) {
          await restoreOrderStock(order, session);
        }

        if (stockWasRestored && !stockShouldBeRestored) {
          await reserveOrderStock(order, session);
        }

        if (order.refundStatus !== "none") {
          order.refundStatus = "none";
        }
      }

      applyStatusChange(order, status, req.user._id);

      await order.save({ session });
      updatedOrder = order;

    });

    const orderNumber = updatedOrder.orderNumber || updatedOrder._id;

    try {
      await Notification.create({
        userId: updatedOrder.userId,
        type: "order_status_changed",
        message: `Order #${orderNumber} status changed from ${previousStatus} to ${updatedOrder.orderStatus}`.slice(0, 500),
        relatedId: updatedOrder._id,
        relatedType: "order",
      });
    } catch (err) {
      logger.error(`Failed to create order status notification: ${err.message}`);
    }

    res.status(200).json({
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } finally {
    await session.endSession();
  }
});
