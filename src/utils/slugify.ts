/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành slug URL không dấu
 */
export function slugify(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-'); // Tránh nhiều dấu gạch ngang liền nhau
}
