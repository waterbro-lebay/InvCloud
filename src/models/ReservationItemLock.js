import mongoose from "mongoose";

const ReservationItemLockSchema = new mongoose.Schema(
  {
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    item_id: {
      type: String,
      required: true,
    },
    quantity_locked: {
      type: Number,
      required: true,
    },
    activity_date: { type: Date, required: true }, // ⭐ 活動 / 出貨日期
    dock_id: { type: mongoose.Schema.Types.ObjectId }, // ⭐ 綁定碼頭
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ReservationItemLock ||
  mongoose.model("ReservationItemLock", ReservationItemLockSchema);
