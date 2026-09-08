const express = require("express");
const {
  getMyCart,
  addToCart,
  mergeGuestCart,
  clearCart,
  confirmPriceChange,
  updateCartItem,
  removeFromCart,
} = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authenticate, getMyCart);
router.post("/", authenticate, addToCart);
router.post("/merge", authenticate, mergeGuestCart);
router.delete("/clear", authenticate, clearCart);
router.patch("/:productId/confirm-price", authenticate, confirmPriceChange);
router.patch("/:productId", authenticate, updateCartItem);
router.delete("/:productId", authenticate, removeFromCart);

module.exports = router;