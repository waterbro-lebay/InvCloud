import { NextResponse } from "next/server";
import notion from "@/lib/notion.js";

export async function POST(request) {
  try {
    const { databaseId, filter, sorts } = await request.json();

    if (!databaseId) {
      return NextResponse.json(
        { error: "Database ID is required" },
        { status: 400 }
      );
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: filter || undefined,
      sorts: sorts || undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      { error: "Failed to query database" },
      { status: 500 }
    );
  }
}
