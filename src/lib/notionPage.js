import notion from "@/lib/notion";
import connectDB from "@/lib/mongodb";
import NotionMember from "@/models/NotionMembers";

export async function getNotionPage(pageId) {
  try {
    if (!pageId) throw new Error("Page ID is required");
    await connectDB();

    const pageData = await notion.pages.retrieve({ page_id: pageId });
    // 從 pageData 中取得 properties

    // N - 客戶名稱
    const customerName = pageData.properties["客戶名稱"].title[0].plain_text;
    // N - 活動 multi_select
    const activity = pageData.properties["活動"].multi_select
      .map((item) => item.name)
      .join(", ");
    // N - 人數
    const people = pageData.properties["人數"].number;
    // N - 場地
    const location =
      pageData.properties["場地"].rich_text[0]?.plain_text || "待定";

    // format date (2025-02-28T14:00:00.000+08:00) -> 2025/02/28 14:00
    function formatDate(dateString) {
      const date = new Date(dateString);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    // N - 執行日期 - 開始
    const executionDate = pageData.properties["執行日期"]?.date?.start
      ? formatDate(pageData.properties["執行日期"]?.date?.start)
      : undefined;
    // N - 執行日期 - 結束
    const executionDateEnd = pageData.properties["執行日期"]?.date?.end
      ? formatDate(pageData.properties["執行日期"]?.date?.end)
      : undefined;

    // N - 工作人員集合時間
    const staffCollectionTime = pageData.properties["工作人員集合時間"]?.date
      ?.start
      ? formatDate(pageData.properties["工作人員集合時間"]?.date?.start)
      : undefined;
    // N - 工作人員集合時間 - 結束
    const staffCollectionTimeEnd = pageData.properties["工作人員集合時間"]?.date
      ?.end
      ? formatDate(pageData.properties["工作人員集合時間"]?.date?.end)
      : undefined;

    // N - 🔒 自動化-客戶提案明細 relation
    // https://www.notion.so/ubuntu-teambuilding/16fe26995c86802cae85d02db16ac5bf?v=16fe26995c8681f591ce000c1a65d1bf&pvs=4

    const proposalDbId = "16fe26995c86802cae85d02db16ac5bf";
    // 用 notion api 查詢 proposalDbId 🚀 自動化-客戶提案明細  為 pageId 的資料
    const proposalPageDatas = await notion.databases.query({
      database_id: proposalDbId,
      filter: {
        property: "🚀 自動化-測試專案總表",
        relation: {
          contains: pageId,
        },
      },
    });
    const proposalDetailIds = proposalPageDatas.results.map((item) => item.id);

    // N - 🔒 自動化-業務工作明細 relation
    const salesWorkDetailIds = pageData.properties[
      "🔒 自動化-業務工作明細"
    ]?.relation.map((item) => item.id);
    /* N - 
        🔒 自動化-攝影需求
        🔒 自動化-費用明細
        🔒 自動化-客戶提案明細
        🔒 自動化-保險明細
        🔒 自動化-企劃工作明細
        🔒 自動化-人員排班表
    */
    const photoRequirementIds = pageData.properties[
      "🔒 自動化-攝影需求"
    ]?.relation.map((item) => item.id);
    const costDetailIds = pageData.properties[
      "🔒 自動化-費用明細"
    ]?.relation.map((item) => item.id);
    const insuranceDetailIds = pageData.properties[
      "🔒 自動化-保險明細"
    ]?.relation.map((item) => item.id);
    const planningWorkDetailIds = pageData.properties[
      "🔒 自動化-企劃工作明細"
    ]?.relation.map((item) => item.id);

    const scheduleDbId = "197e26995c8680a6bd06c18f7dfd0731";
    // 用 notion api 查詢 scheduleDbId 🚀 自動化-測試專案總表  為 pageId 的資料
    const schedulePageDatas = await notion.databases.query({
      database_id: scheduleDbId,
      filter: {
        property: "🚀 自動化-測試專案總表",
        relation: {
          contains: pageId,
        },
      },
    });
    const scheduleDetailIds = schedulePageDatas.results.map((item) => item.id);

    // 要通知的對象
    // M -企劃主管
    const planningManagers = await NotionMember.find({
      role: { $in: ["企劃主管", "工程師"] },
    });

    // N - 業務 id
    const salesId = pageData.properties["業務"].relation[0]?.id;
    // M - 業務
    const sales = await NotionMember.findOne({ notionPageId: salesId });
    // M - salesNickname
    const salesNickname = sales?.nickname;
    // M - salesName
    const salesName = sales?.name;
    // M - salesLineId
    const salesLineId = sales?.lineId;
    // M - salesEmail
    const salesEmail = sales?.gmail;

    // N - 企劃 id
    const planningId = pageData.properties["企劃"].relation[0]?.id;
    // M - 企劃
    const planning = await NotionMember.findOne({ notionPageId: planningId });
    // M - planningNickname
    const planningNickname = planning?.nickname;
    // M - planningName
    const planningName = planning?.name;
    // M - planningLineId
    const planningLineId = planning?.lineId;
    // M - planningEmail
    const planningEmail = planning?.gmail;

    //  N - 主持人
    const hostId = pageData.properties["主持人"].relation[0]?.id;
    // M - host
    const host = await NotionMember.findOne({ notionPageId: hostId });
    // M - hostNickname
    const hostNickname = host?.nickname;
    // M - hostName
    const hostName = host?.name;
    // M - hostLineId
    const hostLineId = host?.lineId;
    // M - hostEmail
    const hostEmail = host?.gmail;

    // return pageData;
    const returnDatas = {
      customerName,
      activity,
      people,
      location,
      executionDate,
      executionDateEnd,
      staffCollectionTime,
      staffCollectionTimeEnd,
      proposalDetailIds,
      salesWorkDetailIds,
      photoRequirementIds,
      costDetailIds,
      insuranceDetailIds,
      planningWorkDetailIds,
      scheduleDetailIds,
      planningManagers,
      salesId,
      salesNickname,
      salesName,
      salesLineId,
      salesEmail,
      planningId,
      planningNickname,
      planningName,
      planningLineId,
      planningEmail,
      hostId,
      hostNickname,
      hostName,
      hostLineId,
      hostEmail,
    };

    return returnDatas;
  } catch (error) {
    console.error("Error retrieving Notion page:", error);
    throw error;
  }
}
