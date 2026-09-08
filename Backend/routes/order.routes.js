const express = require("express");
const {
  getOrderQuote,
  createOrder,
  getMyOrdersHandler,
  getMyOrderById,
  cancelOrder,
  requestRefund,
  getAllOrdersHandler,
  getOrderById,
  updateOrderStatus,
  approveRefund,
  rejectRefund,
} = require("../controllers/order.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");
const { getDeliveryLocations } = require("../controllers/deliveryLocation.controller");

const router = express.Router();

router.get("/delivery-locations", getDeliveryLocations);
router.get("/quote", authenticate, authorize("customer"), getOrderQuote);
router.post("/", authenticate, authorize("customer"), createOrder);
router.get("/my-orders", authenticate, authorize("customer"), getMyOrdersHandler);
router.get("/my-orders/:id", authenticate, authorize("customer"), getMyOrderById);
router.patch("/:id/cancel", authenticate, authorize("customer"), cancelOrder);
router.patch("/:id/refund", authenticate, authorize("customer"), requestRefund);
router.get("/", authenticate, authorize("admin"), getAllOrdersHandler);
router.get("/:id", authenticate, authorize("admin"), getOrderById);
router.patch("/:id/status", authenticate, authorize("admin"), updateOrderStatus);
router.patch("/:id/refund/approve", authenticate, authorize("admin"), approveRefund);
router.patch("/:id/refund/reject", authenticate, authorize("admin"), rejectRefund);

module.exports = router;