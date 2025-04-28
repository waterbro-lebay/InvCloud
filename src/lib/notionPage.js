import notion from "@/lib/notion";
import connectDB from "@/lib/mongodb";

import NotionMember from "@/models/NotionMembers";

export async function getNotionPage(pageId) {
  try {
    if (!pageId) throw new Error("Page ID is required");
    await connectDB();

    const pageData = await notion.pages.retrieve({ page_id: pageId });

    // 取客戶名稱
    const customerName =
      pageData.properties["客戶名稱"]?.title?.[0]?.plain_text || "未命名";

    // N - 企劃 id
    const planningId = pageData.properties["企劃"].relation[0]?.id;
    // M - 企劃
    const planning = await NotionMember.findOne({ notionPageId: planningId });
    // M - planningName
    const planningName = planning?.name;
    // M - planningLineId
    const planningLineId = planning?.lineId;

    // 時間格式轉換
    function formatDate(dateString) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    // 取執行日期（開始與結束）
    const executionStart = pageData.properties["執行日期"]?.date?.start
      ? formatDate(pageData.properties["執行日期"].date.start)
      : undefined;

    const executionEnd = pageData.properties["執行日期"]?.date?.end
      ? formatDate(pageData.properties["執行日期"].date.end)
      : undefined;

    return {
      name: customerName,
      executionDateStart: executionStart,
      executionDateEnd: executionEnd,
      planningName,
      planningLineId,
    };
  } catch (error) {
    console.error("Error retrieving Notion page (simple):", error);
    throw error;
  }
}
