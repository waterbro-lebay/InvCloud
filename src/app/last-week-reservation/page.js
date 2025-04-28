"use client";

import React, { useState, useEffect } from "react";

function calculateItemTotals(logs, weeklyReturns, damageRecords) {
  const itemTotals = {};

  // 先從 logs 中計算總借出數量
  logs.forEach((log) => {
    log.items.forEach((item) => {
      if (!itemTotals[item.item_name]) {
        itemTotals[item.item_name] = {
          total_out: 0,
          total_return: 0, // 預設為 0
          type: item.item_type,
          item_id: item.item_id,
          item_notion_page_id: item.item_notion_page_id,
          damages: [], // 添加缺損記錄
        };
      }
      itemTotals[item.item_name].total_out += item.actual_out_quantity || 0;
    });
  });

  // 從 WeeklyReturn 中獲取總歸還數量
  weeklyReturns.forEach((weeklyReturn) => {
    if (itemTotals[weeklyReturn.item_name]) {
      itemTotals[weeklyReturn.item_name].total_return =
        weeklyReturn.total_return;
    } else {
      // 如果物品只存在於 WeeklyReturn 中（可能借出記錄已被刪除）
      itemTotals[weeklyReturn.item_name] = {
        total_out: weeklyReturn.total_out,
        total_return: weeklyReturn.total_return,
        type: weeklyReturn.type,
        item_id: weeklyReturn.item_id,
        item_notion_page_id: weeklyReturn.item_notion_page_id,
        damages: [], // 添加缺損記錄
      };
    }
  });

  // 添加缺損記錄
  damageRecords.forEach((damage) => {
    if (itemTotals[damage.item_name]) {
      itemTotals[damage.item_name].damages.push({
        quantity: damage.quantity,
        description: damage.description,
        reporter: damage.reporter,
        report_date: damage.report_date,
      });
    }
  });

  return itemTotals;
}

function sortItemsByNotReturned(items) {
  return Object.entries(items).sort(([, a], [, b]) => {
    // 先按類別排序
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
  });
}

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

export default function LastWeekReservationPage() {
  const [logs, setLogs] = useState([]);
  const [weeklyReturns, setWeeklyReturns] = useState([]);
  const [damageRecords, setDamageRecords] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [weekRange, setWeekRange] = useState(null);
  const [damageList, setDamageList] = useState([]);
  const [currentDate, setCurrentDate] = useState(getLastWeekStart());
  const [isActivityListCollapsed, setIsActivityListCollapsed] = useState(false);
  const [collapsedDamageLists, setCollapsedDamageLists] = useState({});

  const fetchData = async (date) => {
    try {
      setLoading(true);
      const weekRange = getWeekRange(date);
      setWeekRange(weekRange);

      const [logsResponse, weeklyResponse, damageResponse] = await Promise.all([
        fetch(
          `/api/borrowing-log/last-week?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`
        ),
        fetch(
          `/api/borrowing-log/weekly-return?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`
        ),
        fetch(
          `/api/borrowing-log/damage-records?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`
        ),
      ]);

      if (!logsResponse.ok) throw new Error("獲取借用記錄失敗");
      if (!weeklyResponse.ok) throw new Error("獲取歸還記錄失敗");
      if (!damageResponse.ok) throw new Error("獲取缺損記錄失敗");

      const logsData = await logsResponse.json();
      const weeklyData = await weeklyResponse.json();
      const damageData = await damageResponse.json();

      setLogs(logsData.logs);
      setWeeklyReturns(weeklyData.weeklyReturns);
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
    // 如果下一週的日期超過今天，則不允許切換
    if (nextWeek < today) {
      setCurrentDate(nextWeek);
    } else {
      alert("無法查看未來的記錄");
    }
  };

  const itemTotals = calculateItemTotals(logs, weeklyReturns, damageRecords);
  const sortedItems = sortItemsByNotReturned(itemTotals);

  const handleEditClick = (itemName, currentValue) => {
    setEditingItem(itemName);
    setEditValue(currentValue);
  };

  const handleSave = async (itemName, itemData) => {
    try {
      const response = await fetch("/api/borrowing-log/update-return", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName,
          itemData,
          actual_return_quantity: parseInt(editValue),
          damageList: damageList.filter((item) => item.itemName === itemName),
          weekRange: weekRange,
          reporter: "系統管理員",
        }),
      });

      if (!response.ok) {
        throw new Error("更新失敗");
      }

      const data = await response.json();

      // 更新 weeklyReturns 狀態
      setWeeklyReturns((prevReturns) => {
        const newReturns = [...prevReturns];
        const existingIndex = newReturns.findIndex(
          (r) =>
            r.item_name === itemName &&
            new Date(r.week_start_date).getTime() ===
              new Date(weekRange.start).getTime()
        );

        if (existingIndex !== -1) {
          newReturns[existingIndex] = data.weeklyReturn;
        } else {
          newReturns.push(data.weeklyReturn);
        }

        return newReturns;
      });

      // 重新獲取缺損記錄
      if (weekRange) {
        const damageResponse = await fetch(
          `/api/borrowing-log/damage-records?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`
        );
        if (damageResponse.ok) {
          const damageData = await damageResponse.json();
          setDamageRecords(damageData.damageRecords);
        }
      }

      // 保持缺損清單的顯示
      setEditingItem(null);
      setEditValue("");
      // 不移除當前物品的缺損記錄
      setDamageList((prevList) =>
        prevList.filter((item) => item.itemName !== itemName)
      );
    } catch (error) {
      console.error("更新錯誤:", error);
      alert("更新失敗，請重試");
    }
  };

  const handleAddDamage = (itemName) => {
    // 獲取當前物品的已存在損壞記錄
    const currentItem = itemTotals[itemName];
    const existingDamages = currentItem.damages || [];

    // 將已存在的損壞記錄轉換為新的格式
    const existingDamageList = existingDamages.map((damage) => ({
      itemName,
      quantity: damage.quantity,
      description: damage.description,
      type: damage.type || "missing",
    }));

    // 添加新的損壞記錄
    setDamageList([
      ...existingDamageList,
      {
        itemName,
        quantity: 1,
        description: "",
        type: "missing", // 預設為遺失
      },
    ]);
  };

  const handleUpdateDamage = (index, field, value) => {
    const newDamageList = [...damageList];
    newDamageList[index] = {
      ...newDamageList[index],
      [field]: field === "quantity" ? value : value,
    };
    setDamageList(newDamageList);
  };

  const handleRemoveDamage = (index) => {
    setDamageList(damageList.filter((_, i) => i !== index));
  };

  const toggleDamageList = (itemName) => {
    setCollapsedDamageLists((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const handleRemoveSavedDamage = async (itemName, damageIndex) => {
    try {
      // 獲取當前物品的所有損壞記錄
      const currentItem = itemTotals[itemName];
      const currentDamages = currentItem.damages || [];

      // 過濾掉要刪除的記錄
      const updatedDamages = currentDamages.filter(
        (_, index) => index !== damageIndex
      );

      const response = await fetch("/api/borrowing-log/update-return", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName,
          itemData: currentItem,
          actual_return_quantity: currentItem.total_return,
          damageList: updatedDamages, // 傳送更新後的損壞記錄陣列
          weekRange: weekRange,
          reporter: "系統管理員",
        }),
      });

      if (!response.ok) {
        throw new Error("刪除失敗");
      }

      // 重新獲取缺損記錄
      if (weekRange) {
        const damageResponse = await fetch(
          `/api/borrowing-log/damage-records?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`
        );
        if (damageResponse.ok) {
          const damageData = await damageResponse.json();
          setDamageRecords(damageData.damageRecords);
        }
      }
    } catch (error) {
      console.error("刪除錯誤:", error);
      alert("刪除失敗，請重試");
    }
  };

  const handleCancelEdit = (itemName) => {
    setEditingItem(null);
    setEditValue("");
    // 移除當前物品的缺損記錄
    setDamageList((prevList) =>
      prevList.filter((item) => item.itemName !== itemName)
    );
  };

  if (loading) {
    return <div className="p-4">載入中...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">借用記錄</h1>
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

      {/* 活動列表 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">活動列表</h2>
          <button
            onClick={() => setIsActivityListCollapsed(!isActivityListCollapsed)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-900"
          >
            {isActivityListCollapsed ? "展開" : "收合"}
          </button>
        </div>
        {!isActivityListCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.map((log) => (
              <div key={log._id} className="p-4 border rounded-lg bg-white">
                <h3 className="font-medium text-gray-900">
                  {log.activity_name}
                </h3>
                <p className="text-gray-700">
                  活動日期: {formatDate(log.reserved_date)}
                </p>
                <p className="text-gray-700">
                  創建時間: {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 物資統計部分 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">物資借出統計</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map(([itemName, stats]) => {
            const notReturned = stats.total_out - stats.total_return;
            const hasNotReturned = notReturned > 0;
            const isEditing = editingItem === itemName;
            const itemDamages = damageList.filter(
              (item) => item.itemName === itemName
            );
            const isDamageListCollapsed = collapsedDamageLists[itemName];

            return (
              <div
                key={itemName}
                className={`p-4 rounded-lg border ${
                  hasNotReturned
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <h3 className="font-medium text-gray-900">{itemName}</h3>
                <p className="text-gray-700">類別: {stats.type}</p>
                <p className="text-gray-700">總借出: {stats.total_out}</p>
                <p className="text-gray-700">總歸還: {stats.total_return}</p>
                <div className="mt-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">實際歸還:</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="border rounded px-2 py-1 w-20 text-gray-900"
                          min="0"
                          max={stats.total_out}
                        />
                      </div>
                      <button
                        onClick={() => handleSave(itemName, stats)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => handleCancelEdit(itemName)}
                        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 ml-2"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleAddDamage(itemName)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 ml-2"
                      >
                        添加缺損
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p
                        className={`${
                          hasNotReturned ? "font-semibold" : ""
                        } text-gray-700`}
                      >
                        未歸還: {notReturned}
                      </p>
                      <button
                        onClick={() =>
                          handleEditClick(itemName, stats.total_return)
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        編輯
                      </button>
                    </div>
                  )}

                  {/* 缺損清單 */}
                  {(stats.damages.length > 0 || itemDamages.length > 0) && (
                    <div className="mt-4 border-t pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            缺損清單
                          </h4>
                          <button
                            onClick={() => toggleDamageList(itemName)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            {isDamageListCollapsed ? "展開" : "收合"}
                          </button>
                        </div>
                        {isEditing && !isDamageListCollapsed && (
                          <button
                            onClick={() => handleAddDamage(itemName)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + 新增缺損項目
                          </button>
                        )}
                      </div>
                      {!isDamageListCollapsed && (
                        <>
                          {/* 顯示已保存的缺損記錄 */}
                          {stats.damages.map((damage, index) => (
                            <div
                              key={`saved-${index}`}
                              className="mt-2 p-2 bg-red-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {damage.quantity} 件
                                </span>
                                <span className="flex-1 text-gray-700">
                                  {damage.description}
                                </span>
                                <button
                                  onClick={() =>
                                    handleRemoveSavedDamage(itemName, index)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  刪除
                                </button>
                              </div>
                            </div>
                          ))}
                          {/* 顯示正在編輯的缺損記錄 */}
                          {itemDamages.map((damage, index) => (
                            <div
                              key={`editing-${index}`}
                              className="mt-2 p-2 bg-red-50 rounded"
                            >
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={damage.quantity}
                                    onChange={(e) =>
                                      handleUpdateDamage(
                                        index,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    className="border rounded px-2 py-1 w-16 text-gray-900"
                                    min="0"
                                  />
                                  <button
                                    onClick={() => handleRemoveDamage(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    刪除
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={damage.description}
                                  onChange={(e) =>
                                    handleUpdateDamage(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="請描述缺損情況"
                                  className="border rounded px-2 py-1 w-full text-gray-900"
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細記錄部分 */}
      <h2 className="text-xl font-semibold mb-4 text-white">詳細記錄</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log._id} className="border p-4 rounded-lg bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              {log.activity_name}
            </h2>
            <p className="text-gray-700">活動日期: {log.reserved_date}</p>
            <p className="text-gray-700">
              創建時間: {new Date(log.created_at).toLocaleString()}
            </p>
            <div className="mt-2">
              <h3 className="font-medium text-gray-900">借用物品:</h3>
              <ul className="list-disc pl-5">
                {log.items.map((item, index) => {
                  const notReturned =
                    (item.actual_out_quantity || 0) -
                    (item.actual_return_quantity || 0);
                  const hasNotReturned = notReturned > 0;

                  return (
                    <li
                      key={index}
                      className={`${
                        hasNotReturned ? "text-red-600" : "text-gray-700"
                      }`}
                    >
                      {item.item_name} - 計劃數量: {item.planned_quantity},
                      實際出庫: {item.actual_out_quantity}, 實際歸還:{" "}
                      {item.actual_return_quantity}
                      {hasNotReturned && ` (未歸還: ${notReturned})`}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
