import notion from "@/lib/notion.js";

// 取得資料庫資料 自動化-測試專案總表
export async function getSingleDbDatasInAutoList(dbId, pageId) {
  try {
    const dbQueryResult = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: "🚀 自動化-測試專案總表",
        relation: {
          contains: pageId,
        },
      },
    });
    // console.log("🔍 資料庫資料", dbQueryResult);
    return dbQueryResult;
  } catch (error) {
    console.error("Error retrieving Notion page:", error);
    throw error;
  }
}

// 取得 page 資料
export async function getPageDatas(pageId) {
  try {
    const pageDatas = await notion.pages.retrieve({
      page_id: pageId,
    });
    return pageDatas;
  } catch (error) {
    console.error("Error retrieving Notion page:", error);
    throw error;
  }
}

// 將整筆資料取出properties(傳入陣列喔)
export async function getPageProperties(datas) {
  return datas.map((data) => {
    return data.properties;
  });
}

// 新增資料進資料庫
export async function createDataInDb(dbId, data) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties: data,
    });
    return response;
  } catch (error) {
    console.error("Error creating Notion page:", error);
    throw error;
  }
}

// 更新page資料
export async function updatePageData(pageId, data) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties: data,
    });
    return response;
  } catch (error) {
    console.error("Error updating Notion page:", error);
    throw error;
  }
}

// 查詢資料庫中有無相同資料
export async function checkDataInDb(dbId, filterDatas) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        and: [...filterDatas],
      },
    });
    // console.log("🔍 查詢資料庫中是否有相同資料", response.results);

    // 判斷資料庫中是否有相同資料
    const isExist = response.results.length > 0;
    // response.results 中第一筆資料的 id
    const firstDataId = isExist ? response.results[0].id : null;
    return { isExist, firstDataId };
  } catch (error) {
    console.error("Error checking Notion page:", error);
    throw error;
  }
}
