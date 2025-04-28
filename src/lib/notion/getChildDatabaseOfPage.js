// utils/getChildDatabasesOfPage.js
import notion from "@/lib/notion";

export async function getChildDatabasesOfPage(pageId) {
  try {
    const childBlocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    const databases = childBlocks.results
      .filter((block) => block.type === "child_database")
      .map((block) => ({
        id: block.id,
        title: block.child_database.title,
      }));

    return databases;
  } catch (error) {
    console.error("獲取子資料庫失敗:", error.message);
    return [];
  }
}
