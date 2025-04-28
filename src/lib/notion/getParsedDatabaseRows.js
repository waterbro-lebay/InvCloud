import notion from "@/lib/notion";
import { removeHyphen } from "@/lib/notion/removeHyphen";

export async function getParsedDatabaseRows(databaseId) {
  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
    });

    allResults = allResults.concat(response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  // 將每筆資料解析為平坦格式
  return allResults.map((page) => {
    const props = page.properties;

    const parseValue = (prop) => {
      if (!prop) return null;
      switch (prop.type) {
        case "title":
          return prop.title.map((t) => t.plain_text).join("");
        case "rich_text":
          return prop.rich_text.map((t) => t.plain_text).join("");
        case "number":
          return prop.number;
        case "select":
          return prop.select?.name || null;
        case "multi_select":
          return prop.multi_select.map((s) => s.name);
        case "checkbox":
          return prop.checkbox;
        case "date":
          return prop.date?.start || null;
        case "formula":
          return prop.formula?.string || null;
        case "relation":
          return prop.relation.map((r) => r.id)[0] || "";
        default:
          return `[不支援的欄位: ${prop.type}]`;
      }
    };

    const parsed = {};
    for (const key in props) {
      parsed[key] = parseValue(props[key]);
    }

    return {
      notion_page_id: removeHyphen(page.id),
      ...parsed,
    };
  });
}
