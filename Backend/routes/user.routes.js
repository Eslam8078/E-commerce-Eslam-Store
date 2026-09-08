const express = require("express");
const {
  createAdmin,
  getMe,
  updateMe,
  getMyAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsersHandler,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  restoreUser,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.post("/admins", authenticate, authorize("admin"), createAdmin);
router.get("/me", authenticate, authorize("customer", "admin"), getMe);
router.patch("/me", authenticate, authorize("customer", "admin"), updateMe);
router.get("/me/addresses", authenticate, authorize("customer", "admin"), getMyAddresses);
router.post("/me/addresses", authenticate, authorize("customer"), addAddress);
router.patch("/me/addresses/:addressId", authenticate, authorize("customer", "admin"), updateAddress);
router.delete("/me/addresses/:addressId", authenticate, authorize("customer", "admin"), deleteAddress);
router.get("/", authenticate, authorize("admin"), getAllUsersHandler);
router.get("/:id", authenticate, authorize("admin"), getUserById);
router.patch("/:id/block", authenticate, authorize("admin"), blockUser);
router.patch("/:id/unblock", authenticate, authorize("admin"), unblockUser);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);
router.patch("/:id/restore", authenticate, authorize("admin"), restoreUser);

module.exports = router;