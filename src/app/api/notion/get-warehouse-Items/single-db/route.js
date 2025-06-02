// 取得倉庫物資主檔
import notion from "@/lib/notion";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import ActivityTemplate from "@/models/ActivityTemplate";

export async function GET(request) {
  // https://www.notion.so/ubuntu-teambuilding/dd6131e4935c4c619b9e363b371071d4?v=6e2069f5c6ae4f978187354b3840163a&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/f2bc7d35e2cc485b92a6ff0525530cc9?v=1176e97797ce47f69761c649d92b899e&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1d0e26995c8680c79849fa1c7650b0a8?v=1d0e26995c8681bd8663000c4aeaa5a0&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dde26995c8680f3a27ae6db1767c0cd?v=1dde26995c86816ca53d000cc91981b0&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dde26995c8680e7be46dbaa1de1bf7e?v=1dde26995c868107b77e000ccb6b6791&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dde26995c8680b69c25d8914f2749bc?v=1dde26995c8681b6ad80000c01e275a5&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dde26995c8680769665e3f47942dffd?v=1dde26995c868158863a000cd734d9f7&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dde26995c86808eb226e07c3185895e?v=1dde26995c8681aba45b000ce9807174&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dde26995c86803885b4c499f99a791e?v=1dde26995c8681538beb000c52bac8c0&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1dee26995c86805aa9e9f8957a2a1889?v=1dee26995c86814da702000c86397bf5&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1f3e26995c8680e88e24d76a20741c08?v=1f3e26995c8681928a53000c13f7fb66&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/586e3ba9ae9a47acb15f07904bee7338?v=9c29171bdeac49e0ae6459509062f183&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1f3e26995c868008b7dbe21fec7030fb?v=1f3e26995c8681e2adcb000c03558b3f&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1f3e26995c8680e7bafed80474810d98?v=1f3e26995c8681c7a936000c2238d5ad&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c8680b39c0fd1170ee5731c?v=1a8e26995c8681b59e6b000c98fe371b&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c8680f78036dd6ef89013a6?v=1a8e26995c86812e9744000c93e01e4d&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c8680198c74f604f15a9ee5?v=1a8e26995c8681dba057000cc34624f8&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c8680fd98bbf4e129fa2a86?v=1a8e26995c86816fb255000cd5b352ae&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c868017a35ac6c5d046587a?v=1a8e26995c868156a6a6000ca4db34db&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c868005aee2e90a3629228d?v=1a8e26995c8681d9847a000c4cf3e04a&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c86804e85eef74a07263a02?v=1a8e26995c8681e0896b000cd9d1eac8&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c86803982c9eece871f8947?v=1a8e26995c86812ca12d000c880bdb33&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c868009b623d26431f5cc51?v=1a8e26995c86815fb91f000c3c0480ad&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a8e26995c86800ca560e60ef24689fa?v=1a8e26995c86818da4d8000cd13dee44&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a7e26995c8680f98268c5374172dcca?v=1a7e26995c86814cb9b6000cef5494cf&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a7e26995c86808aaad7eaf7043f0f9e?v=1a7e26995c86815f8d9a000c56fe0338&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a7e26995c8680099a5efd6118f6898d?v=1a7e26995c868179943c000cf64daeb3&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1a7e26995c8680879964f7ac7e115d5a?v=1a7e26995c8681d398b7000c94358c96&pvs=4
  // https://www.notion.so/ubuntu-teambuilding/1f3e26995c8680edbc94d04ea63f811b?v=1f3e26995c86817fbc9f000ce458a919&pvs=4
  const databaseId = "1f3e26995c8680edbc94d04ea63f811b";

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
