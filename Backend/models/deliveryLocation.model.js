const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const deliveryLocationSchema = new mongoose.Schema(
  {
    governorate: { type: String, required: true, unique: true, trim: true },
    cities: { type: [citySchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DeliveryLocation", deliveryLocationSchema);
