"use client";

import { useState, useEffect } from "react";

export default function MongoDBStatusPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mongodb/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "檢查連線失敗");
      }

      setStatus(data);
      setLastChecked(new Date().toLocaleString());
      setError(null);
    } catch (err) {
      setError(err.message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">MongoDB 連線狀態</h1>
            <button
              onClick={checkConnection}
              disabled={loading}
              className={`px-4 py-2 rounded ${
                loading
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading ? "檢查中..." : "重新檢查"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              <h3 className="font-bold mb-2">錯誤</h3>
              <p>{error}</p>
            </div>
          )}

          {status && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">連線資訊</h2>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-gray-600">狀態</p>
                    <p
                      className={`font-medium ${
                        status.connected ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {status.connected ? "已連線" : "未連線"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">資料庫名稱</p>
                    <p className="font-medium">{status.dbName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">主機</p>
                    <p className="font-medium">{status.host || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">端口</p>
                    <p className="font-medium">{status.port || "N/A"}</p>
                  </div>
                </div>
              </div>

              {status.collections && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">資料集合</h2>
                  <div className="bg-gray-50 p-4 rounded">
                    <ul className="space-y-2">
                      {status.collections.map((collection, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="font-medium">{collection.name}</span>
                          <span className="text-gray-600">
                            {collection.count} 筆資料
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {lastChecked && (
                <div className="text-sm text-gray-500">
                  最後檢查時間：{lastChecked}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
