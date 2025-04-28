// 發送文字訊息到 LINE
async function sendMessageToLine(lineUserId, messageText) {
  console.log("lineUserId", lineUserId);
  console.log("messageText", messageText);
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer YgHqOO6dO2qkLoUdqWR/NUxI3iMiabk2wqRXpwZjLHXGeRurKgMOeo1wVECp6lvZWa5YsfRybw4BL5t0hHWhOLH1NZO7XtljEi4ZrIk1XrJU97RMyFK9VaKu7Mwm8zW2jfafQ1OSZICuDQpAuHsZTgdB04t89/1O/w1cDnyilFU=`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: messageText,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `🚨 LINE API 回應錯誤: ${JSON.stringify(data)}, to: ${lineUserId}`
      );
    }
    console.log("✅ LINE 文字訊息發送成功:", data);
  } catch (error) {
    console.log("error", error);
    console.error("❌ LINE 文字訊息發送失敗:", error);
  }
}

// 發送 Flex Message 到 LINE FOR 重複排班訊息
function createDuplicateScheduleFlexMessage({
  title = "重複排班訊息",
  customerName,
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "sm",
          color: "#FFFFFF", // 白色
        },
      ],
      backgroundColor: "#FF0000", // 紅色
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
      ],
    },
  };
}

// 發送 Flex Message 到 LINE 費用歷史
function createCostHistoryFlexMessage({
  title = "費用歷史",
  customerName,
  url,
  backgroundColor = "#003A8A",
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "sm",
          color: "#ffffff",
        },
      ],
      backgroundColor: backgroundColor,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "查看詳情",
            uri: url,
          },
          style: "primary",
          // 預設為藍色
          color: "#003A8A",
        },
      ],
    },
  };
}

async function sendFlexMessageToLine(
  lineUserId,
  flexMessage,
  altText = "系統通知"
) {
  try {
    // **1. 檢查 lineUserId**
    if (!lineUserId || typeof lineUserId !== "string") {
      throw new Error(`❌ 無效的 lineUserId: ${lineUserId}`);
    }

    // **2. 發送請求**
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: "flex",
            altText: altText,
            contents: flexMessage,
          },
        ],
      }),
    });

    const data = await response.json();

    // **3. 手動檢查 LINE API 是否回傳錯誤**
    if (!response.ok) {
      throw new Error(
        `🚨 LINE API 回應錯誤: ${JSON.stringify(data)}, to: ${lineUserId}`
      );
    }

    console.log("✅ LINE Flex Message 發送成功:", data);
  } catch (error) {
    console.error("❌ LINE Flex Message 發送失敗:", error);

    // **4. 通知管理員**
    try {
      await sendMessageToLine(
        "Uecdf4fca645f80c191efde218eb123b1", // 你的管理員 LINE ID
        `❌ LINE Flex Message 失敗: ${error.message}, 
        用戶 ID: ${lineUserId}, 
        專案名稱: ${JSON.stringify(flexMessage).customerName || "未知"}`
      );
    } catch (notifyError) {
      console.error("❌ 無法通知管理員:", notifyError);
    }
  }
}

// format date (2025-02-28T14:00:00.000+08:00) -> 2025/02/28 14:00
function formatDate(dateString) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// 建立專案通知的 Flex Message
function createProjectNotificationFlex({
  title = "專案通知",
  customerName,
  projectType,
  date,
  location,
  url,
  updatedBy,
  backgroundColor = "#003A8A",
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "sm",
          color: "#ffffff",
        },
      ],
      backgroundColor: backgroundColor,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "類型",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: projectType || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "日期",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: date || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "地點",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: location || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
          ],
        },
        {
          type: "text",
          text: `${updatedBy}`,
          size: "sm",
          color: "#aaaaaa",
          margin: "xxl",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "查看詳情",
            uri: url,
          },
          style: "primary",
          // 預設為藍色
          color: "#003A8A",
        },
      ],
    },
  };
}

// 建立人員新增（費用）通知的 Flex Message
function createCostNotificationFlex({
  title = "人員新增（費用）通知",
  customerName,
  projectType,
  date,
  location,
  url,
  role,
  updatedBy,
  backgroundColor = "#003A8A",
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "sm",
          color: "#ffffff",
        },
      ],
      backgroundColor: backgroundColor,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "類型",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: projectType || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "日期",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: formatDate(new Date(date)) || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "地點",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: location || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "text",
              text: `您的角色：${role}`,
              size: "sm",
              color: "#aaaaaa",
              margin: "xxl",
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "查看詳情",
            uri: url,
          },
          style: "primary",
        },
      ],
    },
  };
}

// 建立內部行前會議通知的 Flex Message(確認參加)
function createInternalPreMeetingNotificationForConfirmFlex({
  title = "內部行前會議通知",
  customerName,
  date,
  location,
  projectType,
  url,
  updatedBy,
  backgroundColor = "#FFE135", // 黃色
  pageId,
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "sm",
          color: "#ffffff",
        },
      ],
      backgroundColor: backgroundColor,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "日期",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: date || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
          ],
        },
        {
          type: "text",
          text: `${updatedBy || "系統通知"}`,
          size: "sm",
          color: "#aaaaaa",
          margin: "xxl",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "確認參加",
            data: `action=confirm&pageId=${pageId}`,
            displayText: "我確認參加此會議",
          },
          style: "primary",
          // 綠色
          color: "#008000",
        },
      ],
    },
  };
}
// 建立內部行前會議通知的 Flex Message(meet&&內部流程)
function createInternalPreMeetingNotificationForMeetAndInternalProcessFlex({
  title = "內部行前會議通知",
  customerName,
  date,
  location,
  projectType,
  url,
  updatedBy,
  backgroundColor = "#FF5733", // 橘色
  innerPageUrl,
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "sm",
          color: "#ffffff",
        },
      ],
      backgroundColor: backgroundColor,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "日期",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: date || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
          ],
        },
        {
          type: "text",
          text: `${updatedBy || "系統通知"}`,
          size: "sm",
          color: "#aaaaaa",
          margin: "xxl",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "Google 會議連結",
            uri: url || "https://www.google.com",
          },
          style: "primary",
          color: "#003A8A",
        },
        {
          type: "button",
          action: {
            type: "uri",
            label: "內部流程",
            uri: innerPageUrl || "https://www.google.com",
          },
          style: "primary",
          color: "#003A8A",
        },
      ],
    },
  };
}

// 建立活動行前通知的 Flex Message
function createActivityNotificationFlex({
  title = "活動行前通知",
  customerName,
  date,
  location,
  projectType,
  url,
  updatedBy,
  backgroundColor = "#E53935", // 紅色
  pageId,
}) {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          color: "#ffffff",
          size: "sm",
          weight: "bold",
        },
      ],
      backgroundColor: backgroundColor,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: customerName,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "類型",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: projectType || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "日期",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: date || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "地點",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 1,
                },
                {
                  type: "text",
                  text: location || "未設定",
                  wrap: true,
                  size: "sm",
                  color: "#666666",
                  flex: 4,
                },
              ],
            },
          ],
        },
        {
          type: "text",
          text: `${updatedBy || "系統通知"}`,
          size: "sm",
          color: "#aaaaaa",
          margin: "xxl",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "確認參加",
            data: `action=confirm&pageId=${pageId}`,
            displayText: "我確認參加此活動",
          },
          style: "primary",
          color: "#008000",
        },
      ],
    },
  };
}

export {
  sendMessageToLine,
  sendFlexMessageToLine,
  createProjectNotificationFlex,
  createCostNotificationFlex,
  createCostHistoryFlexMessage,
  createInternalPreMeetingNotificationForConfirmFlex,
  createInternalPreMeetingNotificationForMeetAndInternalProcessFlex,
  createActivityNotificationFlex,
  createDuplicateScheduleFlexMessage,
};
