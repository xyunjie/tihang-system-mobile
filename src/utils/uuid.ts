// utils/uuid.js
export function generateUUID() {
  // UUID v4 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.floor(Math.random() * 16); // 0~15 随机数
    const v = c === 'x' ? r : (r & 0x3 | 0x8); // 'y' 位必须是 8、9、a 或 b
    return v.toString(16);
  });
}
