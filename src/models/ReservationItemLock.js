import mongoose from "mongoose";

const ReservationItemLockSchema = new mongoose.Schema(
  {
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    quantity_locked: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ReservationItemLock ||
  mongoose.model("ReservationItemLock", ReservationItemLockSchema);
