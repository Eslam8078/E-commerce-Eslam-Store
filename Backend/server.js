require("dotenv").config();
const Order = require("./models/order.model");
const Counter = require("./models/counter.model");

const app = require("./app");
const { connectDB } = require("./config/db.config");
const logger = require("./utilities/logger.util");
const { startBirthdayNotificationScheduler } = require("./services/birthdayNotification.service");

const port = process.env.PORT || 3000;

const syncOrderNumbers = async () => {
  const orders = await Order.find({})
    .select("_id orderNumber orderedAt orderStatus statusHistory refundStatus")
    .sort({ orderedAt: 1, _id: 1 })
    .lean();

  const legacyStatusMap = { confirmed: "preparing", refunded: "refund" };

  for (const order of orders) {
    const updates = {};
    if (legacyStatusMap[order.orderStatus]) {
      updates.orderStatus = legacyStatusMap[order.orderStatus];
      if (order.orderStatus === "refunded") updates.refundStatus = "approved";
    }

    const history = (order.statusHistory || []).map((entry) => ({
      ...entry,
      status: legacyStatusMap[entry.status] || entry.status,
    }));

    if (history.some((entry, i) => entry.status !== (order.statusHistory || [])[i]?.status)) {
      updates.statusHistory = history;
    }

    if (Object.keys(updates).length) {
      await Order.updateOne({ _id: order._id }, { $set: updates });
    }
  }

  const numericOrders = orders.filter((order) => /^\d+$/.test(String(order.orderNumber || "")));
  const legacyOrders = orders.filter((order) => !/^\d+$/.test(String(order.orderNumber || "")));

  let nextNumber = numericOrders.reduce((max, order) => {
    const number = Number(order.orderNumber);
    return Number.isFinite(number) && number > max ? number : max;
  }, 0) + 1;

  for (const order of legacyOrders) {
    await Order.updateOne(
      { _id: order._id },
      { $set: { orderNumber: String(nextNumber) } },
    );
    nextNumber += 1;
  }

  await Counter.findOneAndUpdate(
    { _id: "orders" },
    { $max: { seq: Math.max(nextNumber - 1, 0) } },
    { upsert: true, setDefaultsOnInsert: true },
  );
};

const startServer = async () => {
  await connectDB();
  await syncOrderNumbers();

  startBirthdayNotificationScheduler();

  app.listen(port, () => {
    logger.info(
      `Server started successfully | port:${port} | environment:${process.env.NODE_ENV || "development"}`,
    );
  });
};

startServer().catch((error) => {
  logger.error(`Server startup failed | ${error.message}`, {
    stack: error.stack,
  });

  process.exit(1);
});
