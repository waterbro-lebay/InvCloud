// app/api/borrowing-log/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import BorrowingLog from "@/models/BorrowingLog";
import WarehouseItem from "@/models/WarehouseItem";
import ReservationItemLock from "@/models/ReservationItemLock";
import notion from "@/lib/notion.js";

import { removeHyphen } from "@/lib/notion/removeHyphen.js";
import { getNotionPage } from "@/lib/notionPage";

export async function POST(req) {
  try {
    // const { activity_id, activity_name, reserved_date, dock, items } = body;

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

    await connectDB();

    // console.log("activityId", activityId);
    // console.log("reserved_date", reserved_date);

    // 查 LOCK 的資料 by activityId reserved_date，用 aggregate 查，以 item_id 分組
    const reservationItemLock = await ReservationItemLock.aggregate([
      {
        $match: {
          activity_id: removeHyphen(activityId),
          reserved_date,
        },
      },
      {
        $group: {
          _id: "$item_name",
          item_name: { $first: "$item_name" },
          item_notion_page_id: { $first: "$item_notion_page_id" },
          quantity: { $sum: "$quantity" },
          item_type: { $first: "$item_type" },
          note: { $first: "$note" },
        },
      },
    ]);
    // console.log("reservationItemLock", reservationItemLock);

    const items = reservationItemLock.map((item) => ({
      item_id: item._id,
      item_name: item.item_name,
      item_type: item.item_type,
      item_notion_page_id: item.item_notion_page_id,
      planned_quantity: item.quantity,
      note: item.note,
    }));
    console.log("items", items);

    // 查 WAREHOUSE 的資料 by reservationItemLock.itemId

    // 先 DELETE all borrowing log by activityId reserved_date
    await BorrowingLog.deleteMany({
      activity_id: removeHyphen(activityId),
    });

    const log = await BorrowingLog.create({
      activity_id: removeHyphen(activityId),
      activity_name: activityName,
      planner: planningName,
      reserved_date: new Date(reserved_date).toISOString(),
      dock: 0,
      items: items.map((item) => ({
        ...item,
        actual_out_quantity: item.planned_quantity,
        actual_return_quantity: 0,
        status: "short_return",
        note: item.note,
      })),
    });
    // console.log("log", log);
    await notion.pages.update({
      page_id: pageId,
      properties: {
        預約狀態: {
          rich_text: [
            {
              type: "text",
              text: {
                content: `確認借出物資：${new Date().toLocaleString("zh-TW", {
                  timeZone: "Asia/Taipei",
                })}`,
              },
            },
          ],
        },
      },
    });

    return NextResponse.json({ message: "Borrowing log created" });
  } catch (err) {
    console.error("Error creating borrowing log:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
