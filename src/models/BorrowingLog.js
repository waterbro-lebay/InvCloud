// models/BorrowingLog.js
import mongoose from "mongoose";

const BorrowingItemSchema = new mongoose.Schema(
  {
    item_id: String,
    item_name: String,
    item_notion_page_id: String,
    item_type: String,
    planned_quantity: Number,
    actual_out_quantity: Number,
    actual_return_quantity: Number,
    status: {
      type: String,
      enum: ["normal", "short_out", "short_return", "mismatch"],
      default: "normal",
    },
    note: String,
  },
  { _id: false }
);

const BorrowingLogSchema = new mongoose.Schema({
  activity_id: { type: String, required: true },
  activity_name: { type: String, required: true },
  planner: { type: String, required: true },
  reserved_date: { type: Date, required: true },
  dock: Number,
  items: [BorrowingItemSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

BorrowingLogSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.models.BorrowingLog ||
  mongoose.model("BorrowingLog", BorrowingLogSchema);
