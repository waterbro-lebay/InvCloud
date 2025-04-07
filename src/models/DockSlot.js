import mongoose from "mongoose";

const DockSlotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    slot_number: {
      type: Number,
      required: true,
    },
    activity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["idle", "assigned", "completed"],
      default: "idle",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DockSlot ||
  mongoose.model("DockSlot", DockSlotSchema);
