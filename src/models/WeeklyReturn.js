import mongoose from "mongoose";

const WeeklyReturnSchema = new mongoose.Schema({
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
  week_start_date: {
    type: Date,
    required: true,
  },
  week_end_date: {
    type: Date,
    required: true,
  },
  total_out: {
    type: Number,
    required: true,
    default: 0,
  },
  total_return: {
    type: Number,
    required: true,
    default: 0,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

// 創建複合索引，確保每週每件物品只有一筆記錄
WeeklyReturnSchema.index(
  { item_name: 1, week_start_date: 1 },
  { unique: true }
);

const WeeklyReturn =
  mongoose.models.WeeklyReturn ||
  mongoose.model("WeeklyReturn", WeeklyReturnSchema);

export default WeeklyReturn;
