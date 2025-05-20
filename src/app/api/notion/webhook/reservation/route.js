// app/api/reservation/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import ReservationItemLock from "@/models/ReservationItemLock";

import { removeHyphen } from "@/lib/notion/removeHyphen.js";
import { getNotionPage } from "@/lib/notionPage";
import { getChildDatabasesOfPage } from "@/lib/notion/getChildDatabaseOfPage";
import { getParsedDatabaseRows } from "@/lib/notion/getParsedDatabaseRows";

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
    const reserved_date = activity.executionDateStart?.split(" ")[0];

    const childDatabases = await getChildDatabasesOfPage(pageId);
    const parsedDatabaseRows = [];
    for (const childDatabase of childDatabases) {
      const parsedDatabaseRow = await getParsedDatabaseRows(childDatabase.id);
      parsedDatabaseRows.push(...parsedDatabaseRow);
    }

    await connectDB();

    const success = [];
    const skipped = [];

    // 清除舊的鎖定資料
    await ReservationItemLock.deleteMany({
      activity_id: removeHyphen(activityId),
    });

    for (const row of parsedDatabaseRows) {
      const itemName = row["項目"];
      const quantity = row["數量"];
      const type = row["類別"];
      const item_id = row["物品清單總覽"]?.replace(/-/g, "");
      const dock = 0;

      // if (!item_id && quantity === undefined) {
      //   skipped.push({ itemName, reason: "缺少物品清單 ID 和 數量" });
      //   continue;
      // }
      // if (!item_id) {
      //   skipped.push({ itemName, reason: "缺少物品清單 ID" });
      //   continue;
      // }
      // if (quantity === undefined) {
      //   skipped.push({ itemName, reason: "缺少數量" });
      //   continue;
      // }
      console.log("ok");

      const reservationItemLock = new ReservationItemLock({
        _id: new mongoose.Types.ObjectId(),
        activity_id: removeHyphen(activityId),
        item_id: null,
        item_name: itemName,
        item_type: type,
        item_notion_page_id: item_id,
        quantity,
        dock,
        reserved_date,
        expire_at: getExpireAt(reserved_date),
      });

      await reservationItemLock.save();
      success.push({ itemName, quantity });
    }

    console.log("完成");

    return NextResponse.json({
      message: "已完成預約流程",
      success,
      skipped,
    });
  } catch (err) {
    console.log("err", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
