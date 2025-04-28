import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";
import DamageRecord from "@/models/DamageRecord";

export async function PUT(req) {
  try {
    const { logId, itemIndex, actual_return_quantity } = await req.json();

    if (
      !logId ||
      itemIndex === undefined ||
      actual_return_quantity === undefined
    ) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await connectDB();

    const log = await BorrowingLog.findById(logId);
    if (!log) {
      return NextResponse.json({ error: "找不到借用記錄" }, { status: 404 });
    }

    // 更新指定物品的實際歸還數量
    log.items[itemIndex].actual_return_quantity = actual_return_quantity;

    // 更新狀態
    const item = log.items[itemIndex];
    const notReturned = item.actual_out_quantity - actual_return_quantity;
    if (notReturned > 0) {
      item.status = "short_return";
    } else if (notReturned < 0) {
      item.status = "mismatch";
    } else {
      item.status = "normal";
    }

    await log.save();

    return NextResponse.json({
      message: "更新成功",
      updatedLog: log,
    });
  } catch (error) {
    console.error("更新借用記錄時發生錯誤:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
