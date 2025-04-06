import mongoose from "mongoose";

const WebhookLogSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
    },
    parentDatabaseId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "error"],
      default: "success",
    },
    updatedBy: {
      // 裡面有id, name, type
      type: mongoose.Schema.Types.Mixed,
    },
    error: String,
    result: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.WebhookLog ||
  mongoose.model("WebhookLog", WebhookLogSchema);
