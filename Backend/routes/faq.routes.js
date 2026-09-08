const express = require("express");
const {
  getActiveFAQsHandler,
  getAllFAQsHandler,
  getFAQByIdAdmin,
  createFAQ,
  updateFAQ,
  deactivateFAQ,
  activateFAQ,
  deleteFAQ,
  restoreFAQ,
  getFAQById,
} = require("../controllers/faq.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.get("/", getActiveFAQsHandler);

router.use("/admin", authenticate, authorize("admin"));
router.get("/admin", getAllFAQsHandler);
router.get("/admin/:id", getFAQByIdAdmin);
router.post("/admin", createFAQ);
router.patch("/admin/:id", updateFAQ);
router.patch("/admin/:id/deactivate", deactivateFAQ);
router.patch("/admin/:id/activate", activateFAQ);
router.delete("/admin/:id", deleteFAQ);
router.patch("/admin/:id/restore", restoreFAQ);
router.get("/:id", getFAQById);

module.exports = router;