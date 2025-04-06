"use client";
import { useState } from "react";

export default function DatabaseClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [databaseId, setDatabaseId] = useState("");

  const queryDatabase = async () => {
    if (!databaseId.trim()) {
      setError("請輸入資料庫 ID");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion/query-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: databaseId,
        }),
      });

      if (!response.ok) {
        throw new Error("查詢失敗");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notion 資料庫查詢</h1>

        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              資料庫 ID
            </label>
            <input
              type="text"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="輸入 Notion 資料庫 ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={queryDatabase}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "查詢中..." : "查詢資料庫"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {data && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">查詢結果</h2>
            <div className="space-y-4">
              {data.results.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
