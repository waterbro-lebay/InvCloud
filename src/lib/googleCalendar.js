// lib/googleCalendar.js

const GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzysIwoEvc7A-S7VWsSM3DeEgDjbO2H2GwGkUzJ7qug6H9Ryk80lZSHnFh4LOfDa4Bcew/exec";

// 創建 Google Calendar 事件
export async function createGoogleCalendarEvent(
  title,
  startTime,
  endTime,
  location,
  description,
  guests,
  calendarId
) {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      calendarId,
      title,
      startTime,
      endTime,
      location,
      description,
      guests,
    }),
  });
  const data = await response.json();
  console.log("data", data);
  const result = { eventId: data.eventId, meetLink: data.meetLink };
  return result; // 返回創建的事件 ID
}

// 更新 Google Calendar 事件
export async function updateGoogleCalendarEvent(
  eventId,
  title,
  startTime,
  endTime,
  location,
  description,
  guests,
  calendarId
) {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      calendarId,
      eventId,
      title,
      startTime,
      endTime,
      location,
      description,
      guests,
      update: true, // 假設在 GAS Web App 內部處理事件更新邏輯
    }),
  });
  const data = await response.json();
  console.log("data", data);

  return data.success;
}
