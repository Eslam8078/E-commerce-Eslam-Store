const express = require("express");
const {
  getAdminCategoriesHandler,
  getAllCategoriesHandler,
  getAdminCategoryById,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
  activateCategory,
  deleteCategory,
  restoreCategory,
} = require("../controllers/category.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.get("/admin", authenticate, authorize("admin"), getAdminCategoriesHandler);
router.get("/", getAllCategoriesHandler);
router.get("/admin/:id", authenticate, authorize("admin"), getAdminCategoryById);
router.get("/:id", getCategoryById);

router.post("/", authenticate, authorize("admin"), createCategory);
router.patch("/:id", authenticate, authorize("admin"), updateCategory);
router.patch("/:id/deactivate", authenticate, authorize("admin"), deactivateCategory);
router.patch("/:id/activate", authenticate, authorize("admin"), activateCategory);
router.delete("/:id", authenticate, authorize("admin"), deleteCategory);
router.patch("/:id/restore", authenticate, authorize("admin"), restoreCategory);

module.exports = router;