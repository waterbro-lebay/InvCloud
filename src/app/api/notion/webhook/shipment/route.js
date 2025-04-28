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
