import mongoose from "mongoose";

const ReservationItemLockSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    activity_id: String, // 活動對應 ID（Notion 傳來）
    item_id: mongoose.Schema.Types.ObjectId, // 關聯的物資 _id
    item_name: String, // 物資名稱
    item_notion_page_id: String, // 物資 Notion 頁面 ID
    quantity: Number, // 要借幾個
    dock: Number, // 出貨碼頭 0–4（可選）
    reserved_date: String, // 活動當天日期："YYYY-MM-DD"
    expire_at: Date, // TTL 到期時間（當天 18:00）
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.ReservationItemLock ||
  mongoose.model("ReservationItemLock", ReservationItemLockSchema);
