import mongoose from "mongoose";

const DamageRecordSchema = new mongoose.Schema({
  item_name: {
    type: String,
    required: true,
  },
  item_id: {
    type: String,
    required: true,
  },
  item_notion_page_id: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
    required: true,
  },
  report_date: {
    type: Date,
    default: Date.now,
  },
  week_start_date: {
    type: Date,
    required: true,
  },
  week_end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "resolved"],
    default: "pending",
  },
  reporter: {
    type: String,
    required: true,
  },
});

// 創建複合索引，方便查詢特定週期的缺損記錄
DamageRecordSchema.index({ item_name: 1, week_start_date: 1 });

const DamageRecord =
  mongoose.models.DamageRecord ||
  mongoose.model("DamageRecord", DamageRecordSchema);

export default DamageRecord;
