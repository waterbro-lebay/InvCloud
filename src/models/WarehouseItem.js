import mongoose from "mongoose";

// 1. 倉庫物資主檔
// const WarehouseItem = {
//   _id: ObjectId(),
//   name: "鐵架椅",               // 物資名稱
//   type: "運動會",               // 物資類別
//   unit: "張",                  // 單位（張／組／台）
//   quantity_total: 100,         // 總庫存量
//   quantity_reserved: 25,       // 已鎖定數量（系統自動維護）
//   buffer_quantity: 5,          // 緩衝量
//   reorder_level: 10,           // 警戒線（自動通知補貨）
//   is_active: true,             // 是否啟用
//   created_at: ISODate(),
//   updated_at: ISODate()
// };
const WarehouseItemSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    unit: String,
    quantity_total: {
      type: Number,
      default: 0,
    }, // 總庫存量
    quantity_reserved: {
      type: Number,
      default: 0,
    }, // 已鎖定數量（系統自動維護）
    buffer_quantity: {
      type: Number,
      default: 0,
    }, // 緩衝量
    low_water_level: {
      type: Number,
      default: 0,
    }, // 低水位數量
    is_active: {
      type: Boolean,
      default: true,
    }, // 是否啟用
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.WarehouseItem ||
  mongoose.model("WarehouseItem", WarehouseItemSchema);
