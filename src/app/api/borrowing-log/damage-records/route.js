import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import DamageRecord from "@/models/DamageRecord";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    console.log("start", start);
    console.log("end", end);

    if (!start || !end) {
      return NextResponse.json(
        { error: "缺少必要的查詢參數" },
        { status: 400 }
      );
    }

    await connectDB();

    const damageRecords = await DamageRecord.find({
      week_start_date: {
        $gte: new Date(start),
      },
      week_end_date: {
        $lte: new Date(end),
      },
    });

    console.log("damageRecords", damageRecords);

    return NextResponse.json({ damageRecords });
  } catch (error) {
    console.error("獲取缺損記錄錯誤:", error);
    return NextResponse.json({ error: "獲取缺損記錄失敗" }, { status: 500 });
  }
}
