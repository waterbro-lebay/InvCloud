import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: String,
    deadline: Date,
    priority: String,
    status: String,
    createdAt: Date,
    source: String,
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
