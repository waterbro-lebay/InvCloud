// 檔案位置: src/app/api/download-pdf/route.js
export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";
import { removeHyphen } from "@/lib/notion/removeHyphen.js";
import notion from "@/lib/notion.js";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const activityId = searchParams.get("activityId");

  await connectDB();

  const borrowingLog = await BorrowingLog.findOne({
    activity_id: removeHyphen(activityId),
  });

  // default date function
  const defaultDate = (date) => {
    if (!date) return "未設定日期";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 使用 URL 上傳進來的參數（如有）覆蓋 DB 預設值
  const activityName = borrowingLog.activity_name || "未命名活動";
  const activityDate = defaultDate(borrowingLog.reserved_date) || "未設定日期";
  const mainPlanner = borrowingLog.planner || "未設定主企劃";

  const borrowingItem = borrowingLog.items.map((item) => [
    item.item_type,
    item.item_name,
    item.actual_out_quantity.toString(),
    "",
    "",
    "",
  ]);

  borrowingItem.sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"));
  borrowingItem.forEach((item, idx) => item.unshift((idx + 1).toString()));

  const table = [
    ["編號", "類別", "項目", "數量", "準備", "回程", "缺少或損壞數量"],
    ...borrowingItem,
  ];

  const fontDir = path.join(process.cwd(), "public/fonts");
  const fontBuffer = fs.readFileSync(path.join(fontDir, "NotoSansTC-Bold.ttf"));

  return new Promise((resolve) => {
    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const headerHeight = 130;
    const usableHeight = pageHeight - margin * 2 - headerHeight;
    const rowHeight = 25;

    const colWeights = [0.5, 1, 2, 0.5, 0.5, 0.5, 2];
    const numCols = colWeights.length;

    const doc = new PDFDocument({ size: "A4", margin });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(
        new NextResponse(pdfData, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="borrowing-list.pdf"`,
          },
        })
      );
    });

    doc.registerFont("Regular", fontBuffer);
    doc.registerFont("Bold", fontBuffer);

    function drawPage(slice, isFirstPage = false) {
      if (isFirstPage) {
        doc.font("Bold").fontSize(20).text("物資檢查清單", { align: "center" });
        doc.moveDown(0.5);
        doc
          .font("Regular")
          .fontSize(12)
          .text("請在下列欄位中填寫：", { underline: true });
        doc.moveDown(0.5);

        doc.font("Regular").fontSize(12);
        doc.text(`活動名稱：${activityName}`);
        doc.moveDown(0.2);
        doc.text(`日　　期：${activityDate}`);
        doc.moveDown(0.2);
        doc.text(`主要企劃：${mainPlanner}`);
        doc.moveDown(1);
      }

      const tableWidth = pageWidth - margin * 2;
      const weightSum = colWeights.reduce((s, w) => s + w, 0);
      const colWidths = colWeights.map((w) => (w / weightSum) * tableWidth);
      const tableTop = doc.y;

      doc.lineWidth(0.5).strokeColor("#000");

      for (let i = 0; i <= slice.length; i++) {
        const y = tableTop + i * rowHeight;
        doc
          .moveTo(margin, y)
          .lineTo(margin + tableWidth, y)
          .stroke();
      }

      let xPos = margin;
      for (let i = 0; i <= numCols; i++) {
        doc
          .moveTo(xPos, tableTop)
          .lineTo(xPos, tableTop + slice.length * rowHeight)
          .stroke();
        if (i < numCols) xPos += colWidths[i];
      }

      slice.forEach((row, r) => {
        let x = margin;
        row.forEach((cell, c) => {
          const y = tableTop + r * rowHeight + 8;
          doc.font(r === 0 ? "Bold" : "Regular").fontSize(12);
          doc.text(cell, x + 5, y, {
            width: colWidths[c] - 10,
            align: "left",
          });
          x += colWidths[c];
        });
      });
    }

    const rowsPerPage = Math.floor(usableHeight / rowHeight);
    for (let i = 0; i < table.length; i += rowsPerPage) {
      const slice = table.slice(i, i + rowsPerPage);
      drawPage(slice, i === 0);
      if (i + rowsPerPage < table.length) doc.addPage();
    }

    doc.end();
  });
}
