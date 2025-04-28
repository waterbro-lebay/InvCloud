// 檔案位置: src/app/api/download-pdf/route.js
// 安裝依賴: npm install pdfkit mongoose

// 使用 Node.js 環境
export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";
import { removeHyphen } from "@/lib/notion/removeHyphen.js";

export async function GET(req) {
  const activityId = req.nextUrl.searchParams.get("activityId");
  await connectDB();

  // 取得 borrowingLog 用 items 的 item_type 排序
  const borrowingLog = await BorrowingLog.findOne({
    activity_id: removeHyphen(activityId),
  });

  // 準備表格資料，加入編號
  const borrowingItem = borrowingLog.items.map((item, idx) => [
    item.item_type,
    item.item_name,
    item.actual_out_quantity.toString(),
    "",
    "",
    "",
  ]);
  // 將 borrowingItem 用 item_type 中文排序及可
  borrowingItem.sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"));
  console.log("borrowingItem", borrowingItem);

  // 將 borrowingItem 的編號加入
  borrowingItem.forEach((item, idx) => {
    item.unshift((idx + 1).toString());
  });

  const table = [
    ["編號", "類別", "項目", "數量", "準備", "回程", "缺少或損壞數量"],
    ...borrowingItem,
  ];

  // 載入中文字型 Buffer
  const fontDir = path.join(process.cwd(), "public/fonts");
  const fontBuffer = fs.readFileSync(path.join(fontDir, "NotoSansTC-Bold.ttf"));

  return new Promise((resolve) => {
    // PDF 版面設定
    const margin = 50;
    const pageWidth = 595.28; // A4 points
    const pageHeight = 841.89;
    const headerHeight = 80;
    const usableHeight = pageHeight - margin * 2 - headerHeight;
    const rowHeight = 25;

    // 欄位權重：第二欄 & 第六欄加大
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
            "Content-Disposition": `attachment; filename="sample.pdf"`,
          },
        })
      );
    });

    // 註冊字型
    doc.registerFont("Regular", fontBuffer);
    doc.registerFont("Bold", fontBuffer);

    // 畫一頁內容
    function drawPage(slice) {
      // 標題與說明
      doc.font("Bold").fontSize(20).text("物資檢查清單", { align: "center" });
      doc.moveDown(0.5);
      doc
        .font("Regular")
        .fontSize(12)
        .text("請在下列欄位中填寫：", { underline: true });
      doc.moveDown();

      // 計算欄位寬度
      const tableWidth = pageWidth - margin * 2;
      const weightSum = colWeights.reduce((s, w) => s + w, 0);
      const colWidths = colWeights.map((w) => (w / weightSum) * tableWidth);

      const tableTop = doc.y;

      // 畫格線
      doc.lineWidth(0.5).strokeColor("#000");
      // 水平線
      for (let i = 0; i <= slice.length; i++) {
        const y = tableTop + i * rowHeight;
        doc
          .moveTo(margin, y)
          .lineTo(margin + tableWidth, y)
          .stroke();
      }
      // 垂直線
      let xPos = margin;
      for (let i = 0; i <= numCols; i++) {
        doc
          .moveTo(xPos, tableTop)
          .lineTo(xPos, tableTop + slice.length * rowHeight)
          .stroke();
        if (i < numCols) xPos += colWidths[i];
      }

      // 填入文字
      slice.forEach((row, r) => {
        let x = margin;
        row.forEach((cell, c) => {
          const y = tableTop + r * rowHeight + 8;
          doc.font(r === 0 ? "Bold" : "Regular").fontSize(12);
          doc.text(cell, x + 5, y, { width: colWidths[c] - 10, align: "left" });
          x += colWidths[c];
        });
      });
    }

    // 分頁繪製
    const rowsPerPage = Math.floor(usableHeight / rowHeight);
    for (let i = 0; i < table.length; i += rowsPerPage) {
      const slice = table.slice(i, i + rowsPerPage);
      drawPage(slice);
      if (i + rowsPerPage < table.length) doc.addPage();
    }

    doc.end();
  });
}
