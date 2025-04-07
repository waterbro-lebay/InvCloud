import notion from "@/lib/notion";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ActivityTemplate from "@/models/ActivityTemplate";

export async function POST(request) {
  const payload = await request.json();
  // header
  const btn_id = request.headers.get("btn_id");
  //   console.log("btn_id", btn_id);

  await connectDB();
  const activityTemplate = await ActivityTemplate.findById(btn_id);
  //   console.log("activityTemplate", activityTemplate);
  const btn_name = activityTemplate.name;

  const data = payload.data;
  //   console.log("data", data);
  const pageId = data.id;

  const children = await notion.blocks.children.list({
    block_id: pageId,
  });

  const inlineDatabases = children.results.filter(
    (block) => block.type === "child_database"
  );

  console.log("inlineDatabases", inlineDatabases);

  //   // 把活動模板資料庫的資料同步到 notion page 中

  // 從 inlineDatabases 中找到 btn_name 對應的 database
  const newDatabaseId = inlineDatabases.find(
    (block) => block.child_database.title === btn_name
  ).id;
  //   console.log("newDatabaseId", newDatabaseId);

  Promise.all(
    activityTemplate.packages.map(async (activityTemplatePackage) => {
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
          物品清單總覽: {
            relation: activityTemplatePackage.package_items.map((item) => ({
              id: item.item_id,
            })),
          },
          數量: {
            number: 0,
          },
        },
      });
    })
  );

  return NextResponse.json({ message: "success" });
}
