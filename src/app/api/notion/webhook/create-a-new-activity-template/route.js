import notion from "@/lib/notion";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ActivityTemplate from "@/models/ActivityTemplate";

export async function POST(request) {
  const payload = await request.json();
  const btn_id = request.headers.get("btn_id");

  await connectDB();
  const activityTemplate = await ActivityTemplate.findById(btn_id);
  const btn_name = activityTemplate.name;

  const data = payload.data;
  const pageId = data.id;

  // 取得 page 底下的所有 blocks（找出子資料庫）
  const children = await notion.blocks.children.list({ block_id: pageId });
  const inlineDatabases = children.results.filter(
    (block) => block.type === "child_database"
  );

  const matchedDb = inlineDatabases.find(
    (block) => block.child_database.title === btn_name
  );

  if (!matchedDb) {
    return NextResponse.json(
      { error: "找不到對應的子資料庫" },
      { status: 404 }
    );
  }

  const newDatabaseId = matchedDb.id;

  // 建立 pages（每筆 template package → 建立成一筆資料庫資料）
  for (const activityTemplatePackage of activityTemplate.packages) {
    await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: newDatabaseId,
      },
      properties: {
        項目: {
          title: [
            {
              type: "text",
              text: {
                content: `${activityTemplatePackage.package_name}`,
              },
            },
          ],
        },
        // 物品清單總覽: {
        //   relation: activityTemplatePackage.package_items.map((item) => ({
        //     id: item.item_id.replace(/-/g, ""),
        //   })),
        // },
        數量: {
          number: 0,
        },
        類別: {
          select: {
            name: activityTemplatePackage.package_type,
          },
        },
      },
    });

    // 為了 Notion API 穩定性，加個小 delay
    await new Promise((r) => setTimeout(r, 300));
  }

  // ✅ 資料寫入完成後，將資料庫名稱更新為「原名（完成）」
  await notion.databases.update({
    database_id: newDatabaseId,
    title: [
      {
        type: "text",
        text: {
          content: `${btn_name}（列表完成）`,
        },
      },
    ],
  });

  return NextResponse.json({ message: "success" });
}
