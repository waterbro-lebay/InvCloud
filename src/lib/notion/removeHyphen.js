// 移除page_id中的 "-"的function
export const removeHyphen = (str) => {
  return str.replace(/-/g, "");
};
