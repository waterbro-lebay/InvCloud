// 檔案位置: src/app/api/download-pdf/route.js
// 需先安裝依賴: npm install pdfkit

// 強制在 Node.js 環境執行
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import notion from "@/lib/notion.js";
import connectDB from "@/lib/mongodb";
import { removeHyphen } from "@/lib/notion/removeHyphen.js";
import { getNotionPage } from "@/lib/notionPage";

export async function POST(req) {
  const payload = await req.json();
  const data = payload.data;
  const pageId = data.id;
  const activityId =
    data["properties"]["🚀 自動化-測試專案總表"].relation[0].id;
  const activity = await getNotionPage(activityId);
  const activityName = activity.name;
  const planningName = activity.planningName;
  const planningLineId = activity.planningLineId;
  const reserved_date = activity.executionDateStart?.split(" ")[0];

  try {
    await connectDB();

    const url = `https://auto-notion-inv.ubsoway.online/api/notion/webhook/shipment/pdf/output?activityId=${removeHyphen(
      activityId
    )}`;
    // const url = `https://8814/output?activityId=${activityId}`;
    // 把 url 寫進 pageId 的 properties 裡 (url)
    await notion.pages.update({
      page_id: pageId,
      properties: {
        下載pdf: {
          url: url,
        },
      },
    });

    return NextResponse.json({ message: "PDF URL updated" });
  } catch (err) {
    console.log("err", err);
  }
}
