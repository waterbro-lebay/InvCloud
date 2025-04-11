import notion from "@/lib/notion";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import WarehouseItem from "@/models/WarehouseItem";
import Reservation from "@/models/Reservation";
import ReservationItem from "@/models/ReservationItem";
import ReservationItemLock from "@/models/ReservationItemLock";

export async function POST(request) {
  // 解析 Notion webhook payload
  const { data } = await request.json();
  const pageId = data.id;
  const pageProperties = data.properties;

  // 1️⃣ 取得活動 ID（Notion relation）
  const activity_id =
    pageProperties["🚀 自動化-測試專案總表"].relation?.[0]?.id;

  try {
    await connectDB();

    /* -------------------------
     * STEP 0：取得所有 child DB
     * ------------------------*/
    const children = await notion.blocks.children.list({ block_id: pageId });
    const childDatabaseIds = children.results
      .filter((b) => b.type === "child_database")
      .map((b) => b.id);

    /* -------------------------
     * STEP 1：建立 / 更新 Reservation
     * 每一組活動會有一個 Reservation
     * 存在則更新 version
     * 不存在則建立
     * ------------------------*/
    let reservation = await Reservation.findOne({ activity_id });
    if (!reservation) {
      reservation = await Reservation.create({ activity_id });
    } else {
      await Reservation.updateOne(
        { _id: reservation._id },
        { $inc: { version: 1 }, $set: { finalized: false } }
      );
    }

    /* -------------------------
     * STEP 2：彙整物資數量
     * ------------------------*/
    const itemMap = {}; // { itemId: { quantity, pageId } }

    const reservationItems = [];

    for (const dbId of childDatabaseIds) {
      const { results } = await notion.databases.query({ database_id: dbId });

      for (const row of results) {
        const quantity = row.properties["數量"]?.number ?? 1;
        const pageId = row.id;
        const relations = row.properties["物品清單總覽"]?.relation ?? [];

        for (const rel of relations) {
          const itemId = rel.id.replace(/-/g, "");
          const itemInfo = await WarehouseItem.findOne({ item_id: itemId });
          const { name } = itemInfo;

          reservationItems.push({
            reservation_id: reservation._id,
            item_id: itemId,
            quantity,
            page_id: pageId,
            name,
            lock_status: "pending",
          });
        }
      }
    }

    // console.log("物資清單", reservationItems);

    /* -------------------------
     * STEP 3：重寫 ReservationItem
     * ------------------------*/
    await ReservationItem.deleteMany({ reservation_id: reservation._id });
    await ReservationItem.insertMany(reservationItems);

    /* -------------------------
     * STEP 4：鎖定流程
     * ------------------------*/
    await ReservationItemLock.deleteMany({ reservation_id: reservation._id });

    for (const [index, item] of reservationItems.entries()) {
      /*
        const aggResult = await ReservationItemLock.aggregate([...]);
        const first = aggResult[0] || {};
        const initial_locked = first.total_locked ?? 0;
      */
      const [{ total_locked: initial_locked = 0 } = {}] =
        await ReservationItemLock.aggregate([
          { $match: { item_id: item.item_id } },
          {
            $group: {
              _id: "$item_id",
              total_locked: { $sum: "$quantity_locked" },
            },
          },
        ]);

      const warehouse = await WarehouseItem.findOneAndUpdate(
        { item_id: item.item_id },
        { $set: { quantity_reserved: initial_locked } },
        { new: true } // 回傳更新後的 document
      );

      if (!warehouse) continue;

      const available =
        warehouse.quantity_total -
        warehouse.buffer_quantity -
        warehouse.quantity_reserved;

      if (available >= item.quantity) {
        // 4‑1 建立 Lock
        await ReservationItemLock.create({
          reservation_id: reservation._id,
          item_id: item.item_id,
          quantity_locked: item.quantity,
        });

        // 4‑2 更新 ReservationItem.lock_status
        await ReservationItem.updateOne(
          { reservation_id: reservation._id, item_id: item.item_id },
          { $set: { lock_status: "locked" } }
        );

        const page = await notion.pages.retrieve({ page_id: item.page_id });
        page.properties["備註"]?.rich_text ?? [];

        // 4‑3 Notion 標註
        // await notion.pages.update({
        //   page_id: item.page_id,
        //   properties: {
        //     備註: {
        //       rich_text: [
        //         ...oldNotes,
        //         {
        //           text: {
        //             content: `[${new Date().toLocaleString()}] ${
        //               item.name
        //             } 已鎖定`,
        //           },
        //         },
        //       ],
        //     },
        //   },
        // });
      } else {
        console.log("庫存不足", item.name, item.quantity, available);

        await ReservationItem.updateOne(
          { reservation_id: reservation._id, item_id: item.item_id },
          { $set: { lock_status: "failed" } }
        );

        const page = await notion.pages.retrieve({ page_id: item.page_id });
        const oldNotes = page.properties["備註"]?.rich_text ?? [];

        const updatedNotes = [
          ...oldNotes,
          {
            type: "text",
            text: {
              content: `[${new Date().toLocaleString()}] ${item.name} 庫存不足`,
            },
          },
        ];

        await notion.pages.update({
          page_id: item.page_id,
          properties: {
            備註: {
              rich_text: updatedNotes,
            },
          },
        });
      }

      // 4‑4 回寫 quantity_reserved
      const [{ total_locked: final_locked = 0 } = {}] =
        await ReservationItemLock.aggregate([
          { $match: { item_id: item.item_id } },
          {
            $group: {
              _id: "$item_id",
              total_locked: { $sum: "$quantity_locked" },
            },
          },
        ]);

      const _warehouse = await WarehouseItem.findOneAndUpdate(
        { item_id: item.item_id },
        { $set: { quantity_reserved: final_locked } },
        { new: true }
      );

      if (!warehouse) continue;

      await notion.pages.update({
        page_id: _warehouse.item_id,
        properties: {
          鎖定數量: { number: _warehouse.quantity_reserved },
        },
      });

      // 知道 跑到第幾個
      console.log("跑到第幾個", index + 1, "/", reservationItems.length);
      if (index === reservationItems.length - 1) {
        const now = new Date().toLocaleString();
        await notion.pages.update({
          page_id: pageId,
          properties: {
            預約訊息: {
              rich_text: [
                {
                  text: { content: `[${now}] 預約完成` },
                },
              ],
            },
          },
        });
        console.log("完成");
      }
    }

    return NextResponse.json({ message: "success" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "error" }, { status: 500 });
  }
}
