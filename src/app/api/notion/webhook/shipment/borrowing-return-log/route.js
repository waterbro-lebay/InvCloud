// app/api/borrowing-log/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";
import WarehouseItem from "@/models/WarehouseItem";
import ReservationItemLock from "@/models/ReservationItemLock";

import { removeHyphen } from "@/lib/notion/removeHyphen.js";
import { getNotionPage } from "@/lib/notionPage";
import { getChildDatabasesOfPage } from "@/lib/notion/getChildDatabaseOfPage";
import { getParsedDatabaseRows } from "@/lib/notion/getParsedDatabaseRows";

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

    const childDatabases = await getChildDatabasesOfPage(pageId);
    const parsedDatabaseRows = [];
    for (const childDatabase of childDatabases) {
      const parsedDatabaseRow = await getParsedDatabaseRows(childDatabase.id);
      parsedDatabaseRows.push(...parsedDatabaseRow);
    }

    // console.log("parsedDatabaseRows", parsedDatabaseRows);

    const item_updates = parsedDatabaseRows.map((row) => ({
      item_notion_page_id: removeHyphen(row["物品清單總覽"]),
      actual_return_quantity: row["歸還"],
    }));

    console.log("item_updates", item_updates.length);

    // 相同的 item_notion_page_id 相加數量後只留一個
    const uniqueItemUpdates = item_updates.reduce((acc, curr) => {
      const existingItem = acc.find(
        (item) => item.item_notion_page_id === curr.item_notion_page_id
      );
      if (existingItem) {
        existingItem.actual_return_quantity += curr.actual_return_quantity;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    console.log("uniqueItemUpdates", uniqueItemUpdates.length);

    await connectDB();

    const log = await BorrowingLog.findOne({
      activity_id: removeHyphen(activityId),
      reserved_date: reserved_date,
    });
    if (!log) {
      return NextResponse.json(
        { error: "Activity log not found" },
        { status: 404 }
      );
    }

    log.items = log.items.map((item) => {
      // console.log("item", item);
      const update = item_updates.find(
        (u) => u.item_notion_page_id === item.item_notion_page_id
      );
      if (!update) return item;

      const actual_return = update.actual_return_quantity;
      let status = "normal";

      if (actual_return < item.actual_out_quantity) status = "short_return";
      if (actual_return > item.actual_out_quantity) status = "mismatch";
      if (actual_return === item.actual_out_quantity) status = "normal";

      return {
        ...item,
        actual_return_quantity: actual_return,
        status,
        note: update.note || item.note || "",
      };
    });

    await log.save();

    console.log("Borrowing log updated");

    return NextResponse.json({ message: "Borrowing log updated" });
  } catch (err) {
    console.error("Error updating borrowing log:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
