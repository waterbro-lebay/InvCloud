import axios from "axios";

const DEEPSEEK_API_KEY = process.env.NEXT_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // 确认实际的API端点

export async function queryDeepSeek(prompt, model = "deepseek-chat") {
  const prefix = `
    請幫我依據格式修正以下任務，你需要判斷文句中是否有 1.任務、2.時間、3.+。
    格式：
    +[任務]｜[時間]｜[優先級]｜[是否完成]
    例如：
    +寫報告｜3/25｜高｜完成
    優先級：高、中、低
    是否完成：已完成、未開始、進行中
    並且，你只需要回傳修正後的任務，不需要回傳其他文字。
    `;
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model,
        messages: [{ role: "user", content: `${prefix}${prompt}` }],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw error;
  }
}

export async function queryDeepSeekType(prompt, model = "deepseek-chat") {
  const test_ai_type = ["摺疊桌", "底版", "奇異筆"];
  const prefix = `
    請幫我判斷傳入的文字可能屬於以下何種類型：
    類型：${test_ai_type.join("\n")}
    例如：
    1. 摺疊桌
    2. 底版
    3. 奇異筆
    你只需要回傳是何種類型，不需要回傳其他文字。
    `;
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model,
        messages: [{ role: "user", content: `${prefix}${prompt}` }],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw error;
  }
}
