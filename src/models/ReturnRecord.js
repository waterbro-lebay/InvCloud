import mongoose from "mongoose";

const ReturnRecordSchema = new mongoose.Schema(
  {
    shipment_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    quantity_returned: {
      type: Number,
      required: true,
    },
    condition_note: String,
    return_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ReturnRecord ||
  mongoose.model("ReturnRecord", ReturnRecordSchema);
