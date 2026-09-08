const express = require("express");
const {
  getApprovedTestimonialsHandler,
  createTestimonial,
  getMyTestimonialsHandler,
  deleteMyTestimonial,
  getAllTestimonialsHandler,
  getTestimonialById,
  updateTestimonialStatus,
  deleteTestimonial,
  restoreTestimonial,
} = require("../controllers/testimonial.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.get("/approved", getApprovedTestimonialsHandler);
router.post("/", authenticate, authorize("customer"), createTestimonial);
router.get("/my-testimonials", authenticate, authorize("customer"), getMyTestimonialsHandler);
router.delete("/my-testimonials/:id", authenticate, authorize("customer"), deleteMyTestimonial);
router.get("/", authenticate, authorize("admin"), getAllTestimonialsHandler);
router.get("/:id", authenticate, authorize("admin"), getTestimonialById);
router.patch("/:id/status", authenticate, authorize("admin"), updateTestimonialStatus);
router.delete("/:id", authenticate, authorize("admin"), deleteTestimonial);
router.patch("/:id/restore", authenticate, authorize("admin"), restoreTestimonial);

module.exports = router;