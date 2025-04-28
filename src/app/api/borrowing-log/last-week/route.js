import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await connectDB();

    const logs = await BorrowingLog.find({
      reserved_date: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    }).sort({ reserved_date: -1 });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("獲取借用記錄時發生錯誤:", error);
    return NextResponse.json({ error: "獲取失敗" }, { status: 500 });
  }
}
