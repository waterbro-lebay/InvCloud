// import ConnectButton from "./components/ConnectButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Notion 自動化工具</h1>

        <div className="grid gap-6">
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">功能概覽</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>自動化資料同步</li>
              <li>資料庫管理</li>
              <li>內容自動整理</li>
              <li>自定義工作流程</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">開始使用</h2>
            <p className="text-gray-600">
              請先連接您的 Notion 帳號來開始使用自動化功能。
            </p>
            {/* <ConnectButton /> */}
          </section>

          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">快速導航</h2>
            <div className="space-y-4">
              <Link
                href="/database"
                className="block w-full text-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                資料庫管理
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
