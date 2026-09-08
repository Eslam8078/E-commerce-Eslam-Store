const express = require("express");
const {
  getDeliveryLocations,
  createGovernorate,
  addCity,
  updateDeliveryLocation,
  deleteGovernorate,
  deleteCity,
} = require("../controllers/deliveryLocation.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();
const adminOnly = [authenticate, authorize("admin")];

router.get("/", getDeliveryLocations);
router.post("/governorates", ...adminOnly, createGovernorate);
router.delete("/governorates/:governorate", ...adminOnly, deleteGovernorate);
router.post("/:governorate/cities", ...adminOnly, addCity);
router.delete("/:governorate/cities/:city", ...adminOnly, deleteCity);
router.patch("/:governorate", ...adminOnly, updateDeliveryLocation);

module.exports = router;
