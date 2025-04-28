import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return true;
  }

  console.log("process.env.MONGODB_URI", process.env.NEXT_MONGODB_URI);

  try {
    await mongoose.connect(process.env.NEXT_MONGODB_URI);
    console.log("Mongodb connected");

    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectDB;
