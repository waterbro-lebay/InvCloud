"use client";

import React, { useState, useEffect } from "react";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
}

function getWeekRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + 1); // 設定為週一
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // 設定為週日
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getPreviousWeek(date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  newDate.setDate(newDate.getDate() - 7);
  return newDate;
}

function getNextWeek(date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  newDate.setDate(newDate.getDate() + 7);
  return newDate;
}

function getLastWeekStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - today.getDay() - 6); // 上週一
  return lastWeekStart;
}

export default function DamageReportPage() {
  const [damageRecords, setDamageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekRange, setWeekRange] = useState(null);
  const [currentDate, setCurrentDate] = useState(getLastWeekStart());

  const fetchData = async (date) => {
    try {
      setLoading(true);
      const weekRange = getWeekRange(date);
      setWeekRange(weekRange);

      const damageResponse = await fetch(
        `/api/borrowing-log/damage-records?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`
      );

      if (!damageResponse.ok) {
        throw new Error("獲取缺損記錄失敗");
      }

      const damageData = await damageResponse.json();
      setDamageRecords(damageData.damageRecords);
    } catch (error) {
      console.error("獲取數據錯誤:", error);
      alert("獲取數據失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate]);

  const handlePreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const handleNextWeek = () => {
    const nextWeek = getNextWeek(currentDate);
    const today = new Date();
    if (nextWeek < today) {
      setCurrentDate(nextWeek);
    } else {
      alert("無法查看未來的記錄");
    }
  };

  if (loading) {
    return <div className="p-4">載入中...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">缺損清單報告</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousWeek}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-900"
          >
            上一週
          </button>
          <button
            onClick={handleNextWeek}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-900"
          >
            下一週
          </button>
        </div>
      </div>

      {weekRange && (
        <div className="mb-4 text-white">
          <p>
            查詢期間：{formatDate(weekRange.start)} 至{" "}
            {formatDate(weekRange.end)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {damageRecords.length > 0 ? (
          damageRecords.map((record, index) => (
            <div key={index} className="border p-3 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {record.item_name}
                </h2>
                <span className="text-sm text-gray-700">
                  {formatDate(record.report_date)}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-700">
                  數量: {record.quantity} 件
                </p>
                <p className="text-sm text-gray-700">
                  類型:{" "}
                  {record.type === "missing"
                    ? "遺失"
                    : record.type === "damaged"
                    ? "損壞"
                    : "其他"}
                </p>
                <p className="text-sm text-gray-700">
                  描述: {record.description}
                </p>
                <p className="text-sm text-gray-700">
                  報告人: {record.reporter}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-white">
            <p>本週無缺損記錄</p>
          </div>
        )}
      </div>
    </div>
  );
}
