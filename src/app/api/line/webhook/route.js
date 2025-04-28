import { NextResponse } from "next/server";
import lineClient from "@/lib/line";
import redisClient from "@/lib/redis";
import connectDB from "@/lib/mongodb";

import Task from "@/models/Task";
import notion from "@/lib/notion";
import { sendMessageToLine } from "@/lib/lineMessage";

import {
  queryDeepSeek,
  queryDeepSeekType,
  queryIntent,
} from "@/lib/deepseek/api";

// Redis key 前綴
const REDIS_PREFIX = {
  VERIFY_PHONE: "line_verify:",
  BIND_GROUP: "line_group_bind:",
};
// Redis 過期時間（5分鐘）
const REDIS_EXPIRE = 300;

export async function POST(request) {
  try {
    const payload = await request.json();
    const event = payload.events?.[0];

    if (!event || event.type !== "message" || event.message.type !== "text") {
      return NextResponse.json({ message: "Not a text message." });
    }

    const userId = event.source.userId;
    const text = event.message.text.trim();

    // 如果是指令（如 /bind /status），讓舊邏輯處理
    if (text.startsWith("/")) {
      await handleMessage(event);
      return NextResponse.json({ message: "Command processed." });
    }

    // 透過 AI 判斷是否為任務新增需求
    const intentResult = await queryIntent(text);

    console.log("INTENT：", intentResult);

    const task = intentResult.task;

    switch (intentResult.intent) {
      case "create_task":
        // 👉 你可以用 intentResult.task 來建立 Notion 任務
        task["status"] = "未開始";
        task["source"] = "LINE";
        break;
      case "query_task":
        // 👉 查 Notion 上的資料傳回來
        break;
      case "greeting":
        // 👉 回傳一段歡迎語
        break;
      case "complete_task":
        // 👉 完成任務
        task["status"] = "已完成";
        task["source"] = "LINE";
        // console.log("complete_task", task);
        break;
      default:
        // 👉 不認識的就 friendly 回話
        break;
    }
    const taskToDB = await saveTaskToDB(task);
    await pushTaskToNotion(taskToDB);
    // const result = await queryDeepSeek(text); // 回傳應為可直接存入的 task 描述文字

    // 回覆用戶新增成功（可依照群組或個人不同回應）
    // await sendMessageToLine(userId, `✅ 已新增任務：${task.title}`);
    return NextResponse.json({ message: "Task added." });
  } catch (error) {
    console.error("LINE Webhook Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// // 處理加入群組事件
// async function handleJoinGroup(event) {
//   try {
//     await connectDB();
//     console.log("connectDB");
//     // 確保 Redis 已連線
//     if (!redisClient || !redisClient.isOpen) {
//       console.log("redisClient is not open, connecting...");
//       await redisClient.connect();
//     }
//     console.log("redisClient connected");

//     const groupId = event.source.groupId;

//     // 取得群組資訊
//     const groupSummary = await lineClient.getGroupSummary(groupId);

//     // 建立群組記錄，需要先查 此 groupId 是否存在，不存在再創建

//     const group = await LineGroup.findOne({ groupId });
//     if (!group) {
//       await LineGroup.create({
//         groupId: groupId,
//         name: groupSummary.groupName,
//         memberCount: groupSummary.memberCount,
//         status: "waiting_bind",
//       });
//     }

//     // 設置 Redis 等待綁定
//     await redisClient.set(`${REDIS_PREFIX.BIND_GROUP}${groupId}`, "waiting", {
//       EX: REDIS_EXPIRE,
//     });

//     // 發送歡迎訊息
//     await lineClient.pushMessage(groupId, [
//       {
//         type: "text",
//         text: "感謝將我加入群組！請在5分鐘內輸入要綁定的 Notion 頁面 ID",
//       },
//       {
//         type: "text",
//         text: "格式：/bind [Notion頁面URL]\n例如：/bind https://www.notion.so/...",
//       },
//     ]);
//   } catch (error) {
//     console.error("Handle Join Group Error:", error);
//   } finally {
//     await redisClient.disconnect();
//   }
// }

// // 處理離開群組事件
// async function handleLeaveGroup(event) {
//   try {
//     await connectDB();
//     const groupId = event.source.groupId;

//     // 更新群組狀態
//     await LineGroup.findOneAndUpdate({ groupId }, { status: "inactive" });
//   } catch (error) {
//     console.error("Handle Leave Group Error:", error);
//   }
// }

// // 處理文字訊息
// async function handleMessage(event) {
//   try {
//     await redisClient.connect();
//     await connectDB();

//     const userId = event.source.userId;
//     const message = event.message.text;

//     // 檢查是否在等待電話號碼驗證
//     const phoneVerifyStatus = await redisClient.get(
//       `${REDIS_PREFIX.VERIFY_PHONE}${userId}`
//     );

//     if (phoneVerifyStatus === "waiting_phone") {
//       await handlePhoneVerification(event, message);
//       return;
//     }

//     // 如果是群組訊息，檢查是否在等待綁定 Notion
//     if (event.source.type === "group") {
//       const groupId = event.source.groupId;
//       const bindStatus = await redisClient.get(
//         `${REDIS_PREFIX.BIND_GROUP}${groupId}`
//       );

//       if (bindStatus === "waiting" && message.startsWith("/bind ")) {
//         await handleNotionBinding(event, message);
//         return;
//       }

//       // 處理其他群組指令
//       if (message === "/help") {
//         await lineClient.replyMessage(event.replyToken, {
//           type: "text",
//           text: "可用指令：\n- /bind [NotionID]: 綁定 Notion 頁面\n- /status: 查看綁定狀態\n- /unbind: 解除綁定",
//         });
//       } else if (message === "/status") {
//         await handleStatusCheck(event);
//       } else if (message === "/unbind") {
//         await handleUnbind(event);
//       } else if (message === "/rebind") {
//         console.log("rebind");
//         await handleJoinGroup(event);
//       }
//     }
//   } catch (error) {
//     console.error("Handle Message Error:", error);
//   } finally {
//     console.log("disconnect redis", redisClient.isOpen);
//     if (redisClient.isOpen) {
//       await redisClient.disconnect();
//     }
//   }
// }

// // 處理 Notion 綁定
// async function handleNotionBinding(event, message) {
//   const groupId = event.source.groupId;
//   const notionPageUrl = message.split("/bind")[1].trim();
//   console.log("notionPageUrl", notionPageUrl);
//   function extractNotionPageId(url) {
//     const match = url.match(/([a-f0-9]{32})(?:\?|$)/);
//     return match ? match[1] : null;
//   }

//   const notionPageId = extractNotionPageId(notionPageUrl);
//   console.log("notionPageId", notionPageId);
//   try {
//     // 更新群組記錄
//     await LineGroup.findOneAndUpdate(
//       { groupId },
//       {
//         notionPageId,
//         status: "bound",
//       }
//     );

//     // 刪除 Redis 綁定狀態
//     await redisClient.del(`${REDIS_PREFIX.BIND_GROUP}${groupId}`);
//     // 斷開 redis
//     await redisClient.disconnect();

//     // 發送成功訊息
//     await lineClient.replyMessage(event.replyToken, {
//       type: "text",
//       text: `成功綁定 Notion 頁面！\nID: ${notionPageId}`,
//     });
//   } catch (error) {
//     console.error("Notion Binding Error:", error);
//     await lineClient.replyMessage(event.replyToken, {
//       type: "text",
//       text: "綁定失敗，請稍後再試",
//     });
//   }
// }

// // 處理狀態查詢
// async function handleStatusCheck(event) {
//   const groupId = event.source.groupId;

//   try {
//     const group = await LineGroup.findOne({ groupId });

//     if (!group) {
//       await lineClient.replyMessage(event.replyToken, {
//         type: "text",
//         text: "找不到群組記錄",
//       });
//       return;
//     }

//     await lineClient.replyMessage(event.replyToken, {
//       type: "text",
//       text: `群組狀態：\n名稱：${group.name}\n狀態：${
//         group.status
//       }\nNotion ID：${group.notionPageId || "未綁定"}`,
//     });
//   } catch (error) {
//     console.error("Status Check Error:", error);
//   }
// }

// // 處理解除綁定
// async function handleUnbind(event) {
//   const groupId = event.source.groupId;

//   try {
//     await LineGroup.findOneAndUpdate(
//       { groupId },
//       {
//         notionPageId: null,
//         status: "waiting_bind",
//       }
//     );

//     await lineClient.replyMessage(event.replyToken, {
//       type: "text",
//       text: "已解除 Notion 頁面綁定",
//     });
//   } catch (error) {
//     console.error("Unbind Error:", error);
//   }
// }

// // 處理加入好友事件
// async function handleFollow(event) {
//   try {
//     await redisClient.connect();

//     // 設置 Redis 等待電話號碼驗證
//     await redisClient.set(
//       `${REDIS_PREFIX.VERIFY_PHONE}${event.source.userId}`,
//       "waiting_phone",
//       {
//         EX: REDIS_EXPIRE,
//       }
//     );

//     // 發送歡迎訊息
//     await lineClient.replyMessage(event.replyToken, {
//       type: "text",
//       text: "歡迎加入！請輸入您的電話號碼進行驗證。",
//     });
//   } catch (error) {
//     console.error("Handle Follow Error:", error);
//   } finally {
//     await redisClient.disconnect();
//   }
// }

// // 處理文字訊息
// async function handlePhoneVerification(event, message) {
//   try {
//     // 驗證電話號碼格式（簡單驗證）
//     const phoneRegex = /^09\d{8}$/;
//     if (!phoneRegex.test(message)) {
//       await lineClient.replyMessage(event.replyToken, {
//         type: "text",
//         text: "請輸入正確的手機號碼格式（例如：0912345678）",
//       });
//       return;
//     }

//     // 連接資料庫並查詢用戶
//     await connectDB();
//     const user = await NotionMember.findOne({ phone: message });

//     if (user) {
//       // 更新用戶的 LINE ID
//       user.lineId = event.source.userId;
//       await user.save();

//       // 刪除 Redis 驗證狀態
//       await redisClient.del(
//         `${REDIS_PREFIX.VERIFY_PHONE}${event.source.userId}`
//       );

//       // 發送成功訊息
//       await lineClient.replyMessage(event.replyToken, {
//         type: "text",
//         text: `驗證成功！歡迎 ${user.displayName || user.name}`,
//       });
//     } else {
//       await lineClient.replyMessage(event.replyToken, {
//         type: "text",
//         text: "找不到對應的用戶記錄，請確認電話號碼是否正確。",
//       });
//     }
//   } catch (error) {
//     console.error("Handle Phone Verification Error:", error);
//   }
// }

// // 處理 postback 事件
// async function handlePostback(event) {
//   try {
//     const userId = event.source.userId;
//     const groupId = event.source.groupId || "個人聊天室";
//     const postbackData = event.postback.data; // 例如 "action=confirm&pageId=123"

//     console.log(
//       `使用者 ${userId} 在群組 ${groupId} 按下了按鈕，postback 資料: ${postbackData}`
//     );

//     // call activity-pre-send-to-group-process
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/api/line/activity-pre-send-to-group-process/join`,
//       {
//         method: "POST",
//         body: JSON.stringify({
//           userId,
//           groupId,
//           postbackData,
//         }),
//       }
//     );
//   } catch (error) {
//     console.error("Handle Postback Error:", error);
//   }
// }

function parseTaskMessage(text) {
  // 假設格式為「+寫報告｜3/25｜高」
  const [_, body] = text.split("+");
  const [title, rawDate, priority, status] = body.split("｜");
  // 今年
  const year = new Date().getFullYear();
  const deadline = new Date(`${year}/${rawDate}`);

  return {
    title: title.trim(),
    deadline,
    priority: priority.trim(),
    status: status.trim(),
    createdAt: new Date(),
    source: "LINE",
  };
}

async function saveTaskToDB(taskData) {
  await connectDB();
  const task = new Task(taskData);
  const taskToDB = await task.save();
  return taskToDB;
}

// https://www.notion.so/ubuntu-teambuilding/1bde26995c86807e8e2ecbf5f6c4aade?v=a71056938460459c8f23c45147d16534&pvs=4
async function pushTaskToNotion(task) {
  const DATABASE_ID = "1bde26995c86807e8e2ecbf5f6c4aade";
  // console.log("pushTaskToNotion", task);
  await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      任務名稱: { title: [{ text: { content: task.title } }] },
      狀態: { select: { name: task.status } },
      優先順序: { select: { name: task.priority } },
      截止日: { date: { start: task.deadline.toISOString() } },
      建立時間: { date: { start: task.createdAt.toISOString() } },
      任務來源: { select: { name: "LINE" } },
      "任務-id": { rich_text: [{ text: { content: task._id } }] },
    },
  });
}
