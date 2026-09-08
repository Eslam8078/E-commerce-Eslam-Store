const Order = require("../models/order.model");
const Product = require("../models/product.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { parseDateRange } = require("../utilities/dateRange.util");

const REVENUE_STATUS = "delivered";

const revenueMatch = (extra = {}) => ({
  ...extra,
  $or: [
    { orderStatus: REVENUE_STATUS },
    { orderStatus: "refund", refundStatus: { $in: ["pending", "rejected"] } },
  ],
});

const parseClampedLimit = (value, { defaultValue = 10, max = 50 } = {}) => {
  const numericValue = Number(value);

  const baseValue = Number.isFinite(numericValue)
    ? Math.trunc(numericValue)
    : defaultValue;

  return Math.min(Math.max(baseValue, 1), max);
};

exports.getRevenueReport = catchAsync(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {

    return next(new AppError("fromDate and toDate are required", 400));
  }

  const orderedAt = parseDateRange(fromDate, toDate);

  const result = await Order.aggregate([
    {
      $match: revenueMatch({ orderedAt }),
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalPrice",
        },
        totalOrders: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalOrders: 1,
      },
    },
  ]);

  const report = result[0] || {
    totalRevenue: 0,
    totalOrders: 0,
  };

  res.status(200).json({
    message: "Revenue report",
    data: report,
  });
});

exports.getTopProducts = catchAsync(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const orderedAt = parseDateRange(fromDate, toDate);

  const match = revenueMatch();

  if (orderedAt) {
    match.orderedAt = orderedAt;
  }

  const result = await Order.aggregate([
    {
      $match: match,
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.productId",
        totalQuantity: {
          $sum: "$items.quantity",
        },
        totalSales: {
          $sum: {
            $multiply: ["$items.priceAtOrder", "$items.quantity"],
          },
        },
      },
    },
    {
      $sort: {
        totalQuantity: -1,
        totalSales: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$product.name",
        slug: "$product.slug",
        images: "$product.images",
        totalQuantity: 1,
        totalSales: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "Top 5 products",
    data: result,
  });
});

exports.getTopSales = catchAsync(async (req, res, next) => {
  const safeLimit = parseClampedLimit(req.query.limit, {
    defaultValue: 10,
    max: 50,
  });

  const result = await Order.aggregate([
    {
      $match: {
        orderStatus: REVENUE_STATUS,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.productId",
        totalQuantity: {
          $sum: "$items.quantity",
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $match: {
        "product.isActive": true,
        "product.isDeleted": false,
      },
    },
    {
      $sort: {
        totalQuantity: -1,
      },
    },
    {
      $limit: safeLimit,
    },
    {
      $project: {
        _id: "$product._id",
        name: "$product.name",
        slug: "$product.slug",
        price: "$product.price",
        images: "$product.images",
        stockQuantity: "$product.stockQuantity",
        totalQuantity: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "Top sales products",
    data: result,
  });
});

exports.getBestSellers = catchAsync(async (req, res) => {
  const safeLimit = parseClampedLimit(req.query.limit, { defaultValue: 8, max: 20 });

  const result = await Product.find({
    isBestSeller: true,
    isActive: true,
    isDeleted: false,
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(safeLimit)
    .select("name slug price images stockQuantity")
    .lean();

  res.status(200).json({ message: "Best seller products", data: result });
});

exports.getOrdersByStatus = catchAsync(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const orderedAt = parseDateRange(fromDate, toDate);

  const match = {};

  if (orderedAt) {
    match.orderedAt = orderedAt;
  }

  const result = await Order.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: "$orderStatus",
        count: {
          $sum: 1,
        },
        totalValue: {
          $sum: "$totalPrice",
        },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
        totalValue: 1,
      },
    },
    {
      $sort: {
        status: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "Orders by status",
    data: result,
  });
});

exports.getSalesByDate = catchAsync(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const orderedAt = parseDateRange(fromDate, toDate);

  const match = revenueMatch();

  if (orderedAt) {
    match.orderedAt = orderedAt;
  }

  const result = await Order.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" },
        },
        totalRevenue: {
          $sum: "$totalPrice",
        },
        totalOrders: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        totalRevenue: 1,
        totalOrders: 1,
      },
    },
    {
      $sort: {
        date: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "Sales by date",
    data: result,
  });
});

exports.getSalesByGovernorate = catchAsync(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const orderedAt = parseDateRange(fromDate, toDate);

  const match = revenueMatch();

  if (orderedAt) {
    match.orderedAt = orderedAt;
  }

  const result = await Order.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: "$governorate",
        totalRevenue: {
          $sum: "$totalPrice",
        },
        totalOrders: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        governorate: "$_id",
        totalRevenue: 1,
        totalOrders: 1,
      },
    },
    {
      $sort: {
        totalRevenue: -1,
      },
    },
  ]);

  res.status(200).json({
    message: "Sales by governorate",
    data: result,
  });
});

exports.getNewArrivals = catchAsync(async (req, res, next) => {
  const safeLimit = parseClampedLimit(req.query.limit, {
    defaultValue: 10,
    max: 50,
  });

  const products = await Product.find({
    isActive: true,
    isDeleted: false,
    isNewArrival: true,
  })
    .populate("categoryId", "name slug")
    .populate("subCategoryId", "name slug")
    .sort({
      updatedAt: -1,
      createdAt: -1,
    })
    .limit(safeLimit);

  res.status(200).json({
    message: "New arrivals",
    data: products,
  });
});
