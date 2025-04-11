// 取得倉庫物資主檔
import notion from "@/lib/notion";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import ActivityTemplate from "@/models/ActivityTemplate";

export async function GET(request) {
  // https://www.notion.so/ubuntu-teambuilding/dd6131e4935c4c619b9e363b371071d4?v=6e2069f5c6ae4f978187354b3840163a&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/f2bc7d35e2cc485b92a6ff0525530cc9?v=1176e97797ce47f69761c649d92b899e&pvs=4
  const databaseId = "1d0e26995c8680c79849fa1c7650b0a8";

  try {
    await connectDB();

    // 活動模板
    let activityTemplates = {};
    let packages = [];
    let hasMore = true;
    let startCursor = undefined;

    const dbInfo = await notion.databases.retrieve({ database_id: databaseId });
    // console.log("資料庫名稱", dbInfo.title[0]?.plain_text);

    // 分頁查詢 Notion 資料庫直到結束
    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        ...(startCursor && { start_cursor: startCursor }),
      });

      // console.log("response", response);
      const results = response.results;
      const newPackages = results.map((page) => {
        // db name
        const properties = page.properties;
        console.log("properties", properties);
        return {
          package_id: page.id.replace(/-/g, ""),
          package_name: properties["項目"]?.title[0]?.plain_text,
          package_type: properties["類別"]?.select?.name,
          package_items: properties["物品清單總覽"]?.relation.map((item) => {
            return {
              item_id: item.id.replace(/-/g, ""),
            };
          }),
        };
      });

      packages = packages.concat(newPackages);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    activityTemplates = {
      name: dbInfo.title[0]?.plain_text,
      packages,
    };

    // console.log("activityTemplates", activityTemplates);
    // 使用 upsert 更新或新增每一筆資料
    await ActivityTemplate.updateOne(
      { name: activityTemplates.name },
      { $set: activityTemplates },
      { upsert: true }
    );

    return NextResponse.json({
      message: "資料同步成功",
      count: activityTemplates.length,
      activityTemplates,
    });
  } catch (error) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      { error: "Failed to query database" },
      { status: 500 }
    );
  }
}
