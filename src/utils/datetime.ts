/**
 * Tiện ích ngày giờ theo múi giờ phòng khám.
 *
 * Trước đây mỗi nơi tự xử lý một kiểu: `getAvailableSlots` dùng Intl với Asia/Ho_Chi_Minh,
 * `getTodayStats` và `stockRepository` dùng `toISOString()` (tức UTC), `statisticsService`
 * dùng giờ địa phương của máy chủ. Hệ quả: trong khoảng 00:00–07:00 giờ Việt Nam, phần dùng
 * UTC vẫn coi là "hôm qua" — bảng thống kê hôm nay hiển thị số liệu của ngày trước đó, và
 * cảnh báo hạn dùng lệch 1 ngày. Chạy trong Docker (TZ mặc định UTC) thì phần dùng giờ máy
 * chủ cũng sai nốt.
 *
 * Toàn hệ thống nên đi qua các hàm ở đây để chỉ có một định nghĩa "hôm nay".
 */

export const CLINIC_TIMEZONE = 'Asia/Ho_Chi_Minh';

// en-CA cho định dạng YYYY-MM-DD, en-GB hour12:false cho HH:mm
const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourMinuteFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: CLINIC_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Chuyển một mốc thời gian thành chuỗi 'YYYY-MM-DD' theo giờ phòng khám. */
export const toClinicDateString = (date: Date = new Date()): string => ymdFormatter.format(date);

/** Ngày hôm nay ('YYYY-MM-DD') theo giờ phòng khám. */
export const getClinicToday = (): string => toClinicDateString();

/** Giờ hiện tại dạng 'HH:mm' theo giờ phòng khám. */
export const getClinicTimeHHmm = (date: Date = new Date()): string => hourMinuteFormatter.format(date);

/** Ngày cách `days` ngày so với mốc cho trước ('YYYY-MM-DD', giờ phòng khám). Số âm = lùi về quá khứ. */
export const addClinicDays = (days: number, from: Date = new Date()): string =>
  toClinicDateString(new Date(from.getTime() + days * 24 * 60 * 60 * 1000));

/**
 * Trả về một Date mà các trường giờ ĐỊA PHƯƠNG của nó (getFullYear/getMonth/getDate/…)
 * trùng với đồng hồ treo tường của phòng khám.
 *
 * Dùng cho đoạn code đã lỡ tính toán bằng getFullYear/getMonth/getDate: thay `new Date()`
 * bằng hàm này là toàn bộ phép tính phía sau chạy theo giờ phòng khám mà không phải viết lại.
 * Đừng dùng giá trị này làm mốc thời gian tuyệt đối (getTime/toISOString sẽ lệch).
 */
export const getClinicNowAsLocalDate = (): Date => {
  const now = new Date();
  const [year, month, day] = toClinicDateString(now).split('-').map(Number);
  const [hour, minute] = getClinicTimeHHmm(now).split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};
