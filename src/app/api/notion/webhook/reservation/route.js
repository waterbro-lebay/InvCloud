// app/api/reservation/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import WarehouseItem from "@/models/WarehouseItem";
import ReservationItemLock from "@/models/ReservationItemLock";

import { removeHyphen } from "@/lib/notion/removeHyphen.js";
import { getNotionPage } from "@/lib/notionPage";
import { getChildDatabasesOfPage } from "@/lib/notion/getChildDatabaseOfPage";
import { getParsedDatabaseRows } from "@/lib/notion/getParsedDatabaseRows";

import { sendMessageToLine } from "@/lib/lineMessage";

function getExpireAt(dateStr) {
  const [year, month, day] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}T18:00:00.000Z`);
}

export async function POST(req) {
  try {
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
    console.log("reserved_date", reserved_date);
    console.log("planningName", planningName);
    console.log("planningLineId", planningLineId);

    // await sendMessageToLine(planningLineId, "insufficientItemsMessage");

    const childDatabases = await getChildDatabasesOfPage(pageId);
    const parsedDatabaseRows = [];
    for (const childDatabase of childDatabases) {
      const parsedDatabaseRow = await getParsedDatabaseRows(childDatabase.id);
      parsedDatabaseRows.push(...parsedDatabaseRow);
    }

    await connectDB();

    const success = [];
    const failed = [];
    const skipped = [];

    // 先刪除 activity_id 相同的 ReservationItemLock
    await ReservationItemLock.deleteMany({
      activity_id: removeHyphen(activityId),
    });

    for (const row of parsedDatabaseRows) {
      const itemName = row["項目"];
      const quantity = row["數量"];
      const type = row["類別"];
      const item_id = row["物品清單總覽"]?.replace(/-/g, "");
      const dock = 0;

      if (!item_id && quantity === undefined) {
        skipped.push({ itemName, reason: "缺少物品清單 ID 和 數量" });
        continue;
      }
      if (!item_id) {
        skipped.push({ itemName, reason: "缺少物品清單 ID" });
        continue;
      }
      if (quantity === undefined) {
        skipped.push({ itemName, reason: "缺少數量" });
        continue;
      }

      const item = await WarehouseItem.findOne({ notion_page_id: item_id });
      if (!item) {
        failed.push({ itemName, reason: "找不到物資" });
        continue;
      }

      if (quantity > item.stock_total) {
        failed.push({
          itemName,
          reason: "倉庫總量不足",
          stock: item.stock_total,
          quantity,
        });
      }

      const lockedResult = await ReservationItemLock.aggregate([
        {
          $match: {
            item_notion_page_id: item_id,
            reserved_date,
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]);

      const locked = lockedResult[0]?.total || 0;

      if (locked + quantity > item.stock_total) {
        failed.push({
          itemName,
          reason: "已被其他活動預約鎖定過多",
          stock: item.stock_total,
          locked,
          requested: quantity,
        });
      }

      const expire_at = getExpireAt(reserved_date);

      const reservationItemLock = new ReservationItemLock({
        _id: new mongoose.Types.ObjectId(),
        activity_id: removeHyphen(activityId),
        item_id: item._id,
        item_name: item.name,
        item_type: type,
        item_notion_page_id: item.notion_page_id,
        quantity,
        dock,
        reserved_date,
        expire_at,
      });
      await reservationItemLock.save();

      success.push({ itemName, quantity });
    }

    console.log("success", success);
    console.log("failed", failed);
    console.log("skipped", skipped);

    // 狀態A - 不足物品
    // 狀態B - 鎖定過多

    // 整理一個 不足物品的訊息
    const insufficientItems = failed
      .map(
        (item, index) =>
          index +
          1 +
          "." +
          item.itemName +
          "\n" +
          (item.reason == "倉庫總量不足" ? "(A)" : "(B)")
      )
      .join("\n");
    const insufficientItemsMessage = `狀態分類：\nA:倉庫總量不足\nB:其他活動鎖定過多\n\n 以下物品數量不足：\n${insufficientItems}`;
    // console.log("insufficientItemsMessage", insufficientItemsMessage);

    // 發送 LINE 訊息
    await sendMessageToLine(planningLineId, insufficientItemsMessage);

    return NextResponse.json({
      message: "已完成預約流程",
      success,
      failed,
      skipped,
    });
  } catch (err) {
    console.log("err", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
