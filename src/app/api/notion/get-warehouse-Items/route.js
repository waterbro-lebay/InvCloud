// 取得倉庫物資主檔
import notion from "@/lib/notion";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import WarehouseItem from "@/models/WarehouseItem";
import { fetchAllNotionInventory } from "@/lib/notion/fetchAllNotionData";
import { removeHyphen } from "@/lib/notion/removeHyphen";
export async function GET(request) {
  const databaseId = "e1c8569ba2364bdea5b7cd2ce4d6dd77";

  try {
    const notionData = await fetchAllNotionInventory(databaseId);

    const warehouseItems = notionData.map((page) => {
      // page id
      const pageId = page.id;
      const props = page.properties;

      return {
        notion_page_id: removeHyphen(pageId),
        name: props["物品名"].title[0]?.plain_text || "未命名物資",
        type: props["類別"]?.select?.name || "",
        unit: props["單位"]?.rich_text[0]?.plain_text || "",
        stock_total: parseInt(props["數量"]?.number ?? 0),
        location: props["位置"]?.select?.name || "",
      };
    });

    // console.log("notion 物資", warehouseItems);
    console.log("notion 物資", warehouseItems.length);

    await connectDB();
    console.log("connectDB");
    await WarehouseItem.deleteMany({});
    console.log("deleteMany");
    await WarehouseItem.insertMany(warehouseItems);
    console.log("insertMany");

    return NextResponse.json({
      status: "success",
      inserted: warehouseItems.length,
    });
  } catch (error) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      { error: "Failed to query database" },
      { status: 500 }
    );
  }
}
