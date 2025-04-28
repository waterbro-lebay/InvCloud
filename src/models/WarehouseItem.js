import mongoose from "mongoose";

const WarehouseItemSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    notion_page_id: String,
    name: String,
    type: String,
    unit: String,
    // 總庫存量
    stock_total: {
      type: Number,
      default: 0,
    },
    location: String,
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.WarehouseItem ||
  mongoose.model("WarehouseItem", WarehouseItemSchema);
