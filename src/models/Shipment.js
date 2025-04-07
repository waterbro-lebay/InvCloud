import mongoose from "mongoose";

const ShipmentSchema = new mongoose.Schema(
  {
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    dock_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "completed"],
      default: "pending",
    },
    shipped_at: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Shipment ||
  mongoose.model("Shipment", ShipmentSchema);
