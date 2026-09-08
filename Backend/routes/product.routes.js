const express = require("express");
const {
  getAdminProductsHandler,
  getAllProductsHandler,
  getAdminProductById,
  getProductBySlug,
  deactivateSeasonProducts,
  activateSeasonProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProductImage,
  deactivateProduct,
  activateProduct,
  toggleBestSeller,
  toggleNewArrival,
  deleteProduct,
  restoreProduct,
} = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/admin", authenticate, authorize("admin"), getAdminProductsHandler);
router.get("/", getAllProductsHandler);
router.get("/admin/:id", authenticate, authorize("admin"), getAdminProductById);
router.get("/slug/:slug", getProductBySlug);
router.patch("/admin/season/:season/deactivate", authenticate, authorize("admin"), deactivateSeasonProducts);
router.patch("/admin/season/:season/activate", authenticate, authorize("admin"), activateSeasonProducts);
router.get("/:id", getProductById);
router.post("/", authenticate, authorize("admin"), upload.array("images", 10), createProduct);
router.patch("/:id", authenticate, authorize("admin"), upload.array("images", 10), updateProduct);
router.delete("/:id/images", authenticate, authorize("admin"), deleteProductImage);
router.patch("/:id/deactivate", authenticate, authorize("admin"), deactivateProduct);
router.patch("/:id/activate", authenticate, authorize("admin"), activateProduct);
router.patch("/:id/best-seller", authenticate, authorize("admin"), toggleBestSeller);
router.patch("/:id/new-arrival", authenticate, authorize("admin"), toggleNewArrival);
router.delete("/:id", authenticate, authorize("admin"), deleteProduct);
router.patch("/:id/restore", authenticate, authorize("admin"), restoreProduct);

module.exports = router;