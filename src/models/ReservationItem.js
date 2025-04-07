import mongoose from "mongoose";

const ReservationItemSchema = new mongoose.Schema(
  {
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    note: String,
    lock_status: {
      type: String,
      enum: ["locked", "failed", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ReservationItem ||
  mongoose.model("ReservationItem", ReservationItemSchema);
