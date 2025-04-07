import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema(
  {
    activity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    finalized: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Reservation ||
  mongoose.model("Reservation", ReservationSchema);
