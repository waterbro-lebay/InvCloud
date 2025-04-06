"use client";
import { useState } from "react";

export default function ConnectButton() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/connect-notion", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("連接失敗");
      }

      alert("成功連接！");
    } catch (error) {
      console.error("連接錯誤:", error);
      alert("連接失敗，請稍後再試");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`mt-4 px-6 py-2 rounded-md text-white transition-colors ${
        isConnecting
          ? "bg-blue-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {isConnecting ? "連接中..." : "連接 Notion，設定資料庫 ID"}
    </button>
  );
}
