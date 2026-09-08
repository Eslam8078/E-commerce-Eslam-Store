const express = require("express");
const {
  getAdminSubCategoriesHandler,
  getAllSubCategoriesHandler,
  getAdminSubCategoryById,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deactivateSubCategory,
  activateSubCategory,
  deleteSubCategory,
  restoreSubCategory,
} = require("../controllers/subCategory.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.get("/admin", authenticate, authorize("admin"), getAdminSubCategoriesHandler);
router.get("/", getAllSubCategoriesHandler);
router.get("/admin/:id", authenticate, authorize("admin"), getAdminSubCategoryById);
router.get("/:id", getSubCategoryById);

router.post("/", authenticate, authorize("admin"), createSubCategory);
router.patch("/:id", authenticate, authorize("admin"), updateSubCategory);
router.patch("/:id/deactivate", authenticate, authorize("admin"), deactivateSubCategory);
router.patch("/:id/activate", authenticate, authorize("admin"), activateSubCategory);
router.delete("/:id", authenticate, authorize("admin"), deleteSubCategory);
router.patch("/:id/restore", authenticate, authorize("admin"), restoreSubCategory);

module.exports = router;