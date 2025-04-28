import mongoose from "mongoose";

const NotionMemberSchema = new mongoose.Schema(
  {
    // notion page id
    notionPageId: {
      type: String,
      required: true,
      unique: true,
    },
    // 本名
    name: {
      type: String,
      required: true,
    },
    // 綽號
    nickname: {
      type: String,
      default: "",
    },
    // 人力分項
    type: {
      type: String,
      enum: ["內部人力", "外部人力"],
      default: "外部人力",
    },
    // 性別
    gender: {
      type: String,
      enum: ["男", "女"],
      default: "男",
    },
    // 職位
    role: {
      type: Array,
    },
    // 居住區域
    area: {
      type: String,
      default: "",
    },
    // 電話
    phone: {
      type: String,
      unique: true,
      sparse: true, // 允許多個 null 值
    },
    // Gmail
    gmail: {
      type: String,
      default: "",
    },
    // 備註
    memo: {
      type: String,
      default: "",
    },
    lineId: {
      type: String,
      default: "",
    },
    currentPosition: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.NotionMember ||
  mongoose.model("NotionMember", NotionMemberSchema);
