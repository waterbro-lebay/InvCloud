import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WeeklyReturn from "@/models/WeeklyReturn";
import DamageRecord from "@/models/DamageRecord";

export async function PUT(req) {
  try {
    const {
      itemName,
      itemData,
      actual_return_quantity,
      damageList,
      weekRange,
      reporter,
    } = await req.json();

    if (
      !itemName ||
      actual_return_quantity === undefined ||
      !weekRange ||
      !reporter
    ) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await connectDB();

    // 更新或創建週歸還記錄
    const weeklyReturn = await WeeklyReturn.findOneAndUpdate(
      {
        item_name: itemName,
        week_start_date: new Date(weekRange.start),
      },
      {
        $set: {
          item_id: itemData.item_id,
          item_notion_page_id: itemData.item_notion_page_id,
          week_end_date: new Date(weekRange.end),
          total_out: itemData.total_out,
          total_return: actual_return_quantity,
          last_updated: new Date(),
          damages: damageList || [], // 將損壞記錄存為陣列
        },
      },
      { upsert: true, new: true }
    );

    // 處理缺損記錄
    if (damageList && damageList.length > 0) {
      // 先刪除該物品在該週期的所有缺損記錄
      await DamageRecord.deleteMany({
        item_name: itemName,
        week_start_date: new Date(weekRange.start),
      });

      // 保存新的缺損記錄
      const newDamageRecords = await Promise.all(
        damageList.map((damage) =>
          DamageRecord.create({
            item_name: itemName,
            item_id: itemData.item_id,
            item_notion_page_id: itemData.item_notion_page_id,
            quantity: damage.quantity,
            description: damage.description,
            type: damage.type,
            week_start_date: new Date(weekRange.start),
            week_end_date: new Date(weekRange.end),
            reporter: reporter,
          })
        )
      );
    } else {
      // 如果沒有缺損記錄，刪除該物品在該週期的所有缺損記錄
      await DamageRecord.deleteMany({
        item_name: itemName,
        week_start_date: new Date(weekRange.start),
      });
    }

    return NextResponse.json({
      message: "更新成功",
      weeklyReturn,
    });
  } catch (error) {
    console.error("更新歸還記錄時發生錯誤:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
