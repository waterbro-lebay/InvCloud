import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    // 嘗試連線
    await connectDB();

    // 獲取連線狀態
    const connected = mongoose.connection.readyState === 1;

    // 如果已連線，獲取更多資訊
    let status = {
      connected,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };

    // 如果已連線，獲取集合資訊
    if (connected) {
      const collections = await Promise.all(
        Object.keys(mongoose.connection.collections).map(async (name) => {
          const count = await mongoose.connection
            .collection(name)
            .countDocuments();
          return { name, count };
        })
      );
      status.collections = collections;
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("MongoDB 狀態檢查失敗:", error);
    return NextResponse.json(
      {
        error: "MongoDB 狀態檢查失敗",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
