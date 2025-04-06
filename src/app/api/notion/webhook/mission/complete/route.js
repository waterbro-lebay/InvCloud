import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function POST(request) {
  try {
    // 嘗試連線
    const payload = await request.json();
    console.log("payload", payload);

    const data = payload.data;
    const properties = data.properties;
    const missionId = properties["任務-id"].rich_text[0].plain_text;
    // console.log("missionId", missionId);

    const status = properties["狀態"].select.name;

    await connectDB();

    const task = await Task.findById(missionId);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    console.log("task", task);

    // 將 task 的 status 設為 "已完成"
    task.status = status;
    await task.save();

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("MongoDB 狀態檢查失敗:", error);
    return NextResponse.json(
      {
        error: "MongoDB 狀態檢查失敗",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
