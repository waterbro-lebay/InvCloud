// 取得倉庫物資主檔
import notion from "@/lib/notion";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import WarehouseItem from "@/models/WarehouseItem";

export async function GET(request) {
  const databaseId = "e1c8569ba2364bdea5b7cd2ce4d6dd77";

  try {
    await connectDB();

    let itemsProperties = [];
    let hasMore = true;
    let startCursor = undefined;

    // 分頁查詢 Notion 資料庫直到結束
    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        ...(startCursor && { start_cursor: startCursor }),
      });

      const newItems = response.results.map((page) => {
        const properties = page.properties;
        // id 處理成1bde26995c86800dad13e70263a0393a
        return {
          item_id: page.id.replace(/-/g, ""),
          name: properties["物品名"]?.title[0]?.plain_text,
          type: properties["類別"]?.select?.name,
          unit: properties["單位"]?.rich_text[0]?.plain_text,
          quantity_total: properties["數量"]?.number,
          buffer_quantity: properties["緩衝數量"]?.number,
          low_water_level: properties["低水位數量"]?.number,
        };
      });

      itemsProperties = itemsProperties.concat(newItems);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    // 使用 upsert 更新或新增每一筆資料
    for (const item of itemsProperties) {
      await WarehouseItem.updateOne(
        { name: item.name }, // 用物品名當作唯一識別
        { $set: item }, // 更新全部欄位
        { upsert: true } // 沒有就新增
      );
    }

    return NextResponse.json({
      message: "資料同步成功",
      count: itemsProperties.length,
    });
  } catch (error) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      { error: "Failed to query database" },
      { status: 500 }
    );
  }
}
