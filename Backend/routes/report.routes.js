const express = require("express");

const {
  getTopSales,
  getBestSellers,
  getNewArrivals,
  getRevenueReport,
  getTopProducts,
  getOrdersByStatus,
  getSalesByDate,
  getSalesByGovernorate,
} = require("../controllers/report.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.get("/top-sales", getTopSales);
router.get("/best-sellers", getBestSellers);
router.get("/new-arrivals", getNewArrivals);
router.use(authenticate, authorize("admin"));
router.get("/revenue", getRevenueReport);
router.get("/top-products", getTopProducts);
router.get("/orders-by-status", getOrdersByStatus);
router.get("/sales-by-date", getSalesByDate);
router.get("/sales-by-governorate", getSalesByGovernorate);

module.exports = router;
