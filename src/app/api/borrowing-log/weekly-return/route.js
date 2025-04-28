import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WeeklyReturn from "@/models/WeeklyReturn";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await connectDB();

    const weeklyReturns = await WeeklyReturn.find({
      week_start_date: new Date(start),
      week_end_date: new Date(end),
    });

    return NextResponse.json({ weeklyReturns });
  } catch (error) {
    console.error("獲取週歸還記錄時發生錯誤:", error);
    return NextResponse.json({ error: "獲取失敗" }, { status: 500 });
  }
}
