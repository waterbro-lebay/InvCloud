import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";
import { removeHyphen } from "@/lib/notion/removeHyphen.js";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const activityId = searchParams.get("activityId");

  await connectDB();

  const borrowingLog = await BorrowingLog.findOne({
    activity_id: removeHyphen(activityId),
  });

  const defaultDate = (date) => {
    if (!date) return "未設定日期";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const activityName = borrowingLog.activity_name || "未命名活動";
  const activityDate = defaultDate(borrowingLog.reserved_date);
  const mainPlanner = borrowingLog.planner || "未設定主企劃";

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("物資清單", {
    properties: { tabColor: { argb: "FFC0000" } },
  });

  // 活動資訊
  sheet.addRow([`活動名稱：${activityName}`]);
  sheet.addRow([`日　　期：${activityDate}`]);
  sheet.addRow([`主要企劃：${mainPlanner}`]);
  sheet.addRow([]);

  // 表頭
  const headerRow = sheet.addRow([
    "編號",
    "項目",
    "數量",
    "準備",
    "回程",
    "缺少或損壞數量",
    "備註",
  ]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // 對 items 依照 item_name 進行繁體中文排序
  borrowingLog.items.sort((a, b) =>
    (a.item_name || "").localeCompare(b.item_name || "", "zh-Hant")
  );

  // 資料列
  borrowingLog.items.forEach((item, idx) => {
    const row = sheet.addRow([
      idx + 1,
      item.item_name || "",
      item.actual_out_quantity?.toString() || "0",
      "",
      "",
      "",
      item.note || "",
    ]);
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // 欄寬設定（項目、備註加寬）
  sheet.columns = [
    { key: "編號", width: 8 },
    { key: "項目", width: 30 },
    { key: "數量", width: 10 },
    { key: "準備", width: 10 },
    { key: "回程", width: 10 },
    { key: "缺少或損壞數量", width: 18 },
    { key: "備註", width: 50 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=borrowing-list.xlsx`,
    },
  });
}
