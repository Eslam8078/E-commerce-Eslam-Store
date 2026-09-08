const express = require("express");
const app = express();
const corsMiddleware = require("./middlewares/cors.middleware");
const AppError = require("./utilities/appError.util");
const globalError = require("./middlewares/errorHandelar.middleware");

app.use(corsMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/subcategories", require("./routes/subCategory.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/delivery-locations", require("./routes/deliveryLocation.routes"));
app.use("/api/testimonials", require("./routes/testimonial.routes"));
app.use("/api/faqs", require("./routes/faq.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/backups", require("./routes/backup.routes"));

app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalError);

module.exports = app;
