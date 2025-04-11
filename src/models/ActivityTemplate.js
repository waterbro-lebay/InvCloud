import mongoose from "mongoose";

const ActivityTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    }, // 模板名稱
    packages: [
      {
        package_id: {
          type: String,
          required: true,
        }, // 物資ID
        package_name: {
          type: String,
        }, // 物資名稱
        package_items: [
          {
            item_id: {
              type: String,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.ActivityTemplate ||
  mongoose.model("ActivityTemplate", ActivityTemplateSchema);
