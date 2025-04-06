import { Client } from "@notionhq/client";

if (!process.env.NEXT_NOTION_API_KEY) {
  throw new Error("Missing Notion API key");
}

const notion = new Client({
  auth: process.env.NEXT_NOTION_API_KEY,
});

export default notion;
