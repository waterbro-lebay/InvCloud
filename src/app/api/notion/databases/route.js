import { NextResponse } from "next/server";
import notion from "@/lib/notion";

export async function GET() {
  try {
    console.log("開始獲取資料庫列表");

    // 查詢所有資料庫
    const response = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
    });

    // 整理資料庫資訊
    const databases = response.results.map((db) => ({
      id: db.id,
      title: db.title[0]?.plain_text || "未命名資料庫",
      url: db.url,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time,
    }));

    console.log(`✅ 找到 ${databases.length} 個資料庫`);

    return NextResponse.json({
      message: "獲取成功",
      databases,
    });
  } catch (error) {
    console.error("獲取資料庫列表失敗:", error);
    return NextResponse.json(
      {
        error: "獲取資料庫列表失敗",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
