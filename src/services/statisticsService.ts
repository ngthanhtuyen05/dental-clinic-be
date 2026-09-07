import { QueryTypes } from 'sequelize';
import sequelize from '../config/db.js';

export interface DateRangeFilter {
  timeRange?: string; // 'today' | 'week' | 'month' | 'quarter' | 'year'
  startDate?: string;
  endDate?: string;
  dentistId?: number | 'all';
  branch?: string;
}

export interface ClinicalFilter {
  timeRange?: string; // 'week' | 'month' | 'quarter' | 'year'
  startDate?: string;
  endDate?: string;
  specialtyId?: number | string;
  dentistId?: number | string;
}

/**
 * Helper: Format Date sang chuỗi 'YYYY-MM-DD' theo giờ địa phương (tránh lệch ngày do UTC)
 */
function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * Helper: Tính khoảng ngày bắt đầu & kết thúc dựa trên filter (Chuẩn timezone địa phương)
 */
function resolveDateRange(timeRange = 'month', customStart?: string, customEnd?: string) {
  const now = new Date();

  if (customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const prevStart = new Date(start.getTime() - diffDays * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(start.getTime() - 1 * 24 * 60 * 60 * 1000);
    return {
      startDate: customStart,
      endDate: customEnd,
      prevStartDate: formatLocalYMD(prevStart),
      prevEndDate: formatLocalYMD(prevEnd),
      diffDays,
    };
  }

  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (timeRange) {
    case 'today': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    }
    case 'week': {
      startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    }
    case 'year': {
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case 'month':
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
  }

  const startStr = formatLocalYMD(startDate);
  const endStr = formatLocalYMD(endDate);
  const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const prevStart = new Date(startDate.getTime() - diffDays * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(startDate.getTime() - 1 * 24 * 60 * 60 * 1000);

  return {
    startDate: startStr,
    endDate: endStr,
    prevStartDate: formatLocalYMD(prevStart),
    prevEndDate: formatLocalYMD(prevEnd),
    diffDays,
  };
}

/**
 * Helper format tiền tệ VNĐ
 */
function formatVND(val: number): string {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)} Tỷ ₫`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)} Triệu ₫`;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

/**
 * Helper tính % tăng trưởng so với kỳ trước
 */
function calcGrowth(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

/**
 * 1. LẤY THỐNG KÊ LỊCH HẸN KHÁM (TỐI ƯU HÓA 100% BẰNG SQL AGGREGATION)
 */
export async function getAppointmentStatistics(filter: DateRangeFilter) {
  const { startDate, endDate, prevStartDate, prevEndDate } = resolveDateRange(
    filter.timeRange,
    filter.startDate,
    filter.endDate
  );

  const dentistId = filter.dentistId && filter.dentistId !== 'all' ? Number(filter.dentistId) : undefined;
  const dentistWhereSql = dentistId ? 'AND dentistId = :dentistId' : '';
  const dentistApptWhereSql = dentistId ? 'AND a.dentistId = :dentistId' : '';

  const replacements: Record<string, any> = {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    dentistId,
  };

  // 1.1 Tổng hợp KPIs & Phân bổ trạng thái trong kỳ hiện tại
  const [currKpiRow]: any = await sequelize.query(
    `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedCount,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledCount,
      SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS noShowCount,
      SUM(CASE WHEN status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress') THEN 1 ELSE 0 END) AS upcomingCount
    FROM Appointments
    WHERE appointmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const total = Number(currKpiRow?.total || 0);
  const completedCount = Number(currKpiRow?.completedCount || 0);
  const cancelledCount = Number(currKpiRow?.cancelledCount || 0);
  const noShowCount = Number(currKpiRow?.noShowCount || 0);
  const upcomingCount = Number(currKpiRow?.upcomingCount || 0);
  const cancelledTotal = cancelledCount + noShowCount;

  // 1.2 Số lượng kỳ trước để tính % tăng trưởng
  const [prevKpiRow]: any = await sequelize.query(
    `
    SELECT
      COUNT(*) AS prevTotal,
      SUM(CASE WHEN status IN ('cancelled', 'no_show') THEN 1 ELSE 0 END) AS prevCancelledTotal
    FROM Appointments
    WHERE appointmentDate BETWEEN :prevStartDate AND :prevEndDate
      ${dentistWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const prevTotal = Number(prevKpiRow?.prevTotal || 0);
  const prevCancelledTotal = Number(prevKpiRow?.prevCancelledTotal || 0);

  const totalGrowth = calcGrowth(total, prevTotal);
  const cancelledGrowth = calcGrowth(cancelledTotal, prevCancelledTotal);
  const completionRate = total > 0 ? Number(((completedCount / total) * 100).toFixed(1)) : 0;
  const noShowRate = total > 0 ? Number(((noShowCount / total) * 100).toFixed(1)) : 0;

  // 1.3 Tỷ lệ Bệnh nhân mới vs Tái khám (1 single SQL query với LEFT JOIN)
  const [ratioRow]: any = await sequelize.query(
    `
    SELECT 
      COUNT(DISTINCT a.patientId) AS totalPatients,
      COUNT(DISTINCT CASE WHEN prev.id IS NOT NULL THEN a.patientId END) AS returningPatients
    FROM Appointments a
    LEFT JOIN Appointments prev ON prev.patientId = a.patientId AND prev.appointmentDate < :startDate
    WHERE a.appointmentDate BETWEEN :startDate AND :endDate
      ${dentistApptWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const totalPatients = Number(ratioRow?.totalPatients || 0);
  const returningPatientsCount = Number(ratioRow?.returningPatients || 0);
  const newPatientsCount = Math.max(0, totalPatients - returningPatientsCount);
  const newPercent = totalPatients > 0 ? Number(((newPatientsCount / totalPatients) * 100).toFixed(1)) : 0;
  const returningPercent = totalPatients > 0 ? Number(((returningPatientsCount / totalPatients) * 100).toFixed(1)) : 0;

  // 1.4 Xu hướng theo ngày (Trend data) gom nhóm SQL
  const trendRows: any = await sequelize.query(
    `
    SELECT 
      DATE_FORMAT(appointmentDate, '%Y-%m-%d') AS dStr,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
      SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS noShow
    FROM Appointments
    WHERE appointmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    GROUP BY DATE_FORMAT(appointmentDate, '%Y-%m-%d')
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const dateMap: Record<string, { total: number; completed: number; cancelled: number; noShow: number }> = {};
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const dStr = formatLocalYMD(cur);
    dateMap[dStr] = { total: 0, completed: 0, cancelled: 0, noShow: 0 };
    cur.setDate(cur.getDate() + 1);
  }

  trendRows.forEach((r: any) => {
    if (dateMap[r.dStr]) {
      dateMap[r.dStr] = {
        total: Number(r.total || 0),
        completed: Number(r.completed || 0),
        cancelled: Number(r.cancelled || 0),
        noShow: Number(r.noShow || 0),
      };
    }
  });

  const trendData = Object.keys(dateMap).map((dStr) => {
    const parts = dStr.split('-');
    const dateLabel = `${parts[2]}/${parts[1]}`;
    const item = dateMap[dStr];
    return {
      date: dateLabel,
      total: item.total,
      completed: item.completed,
      cancelled: item.cancelled,
      noShow: item.noShow,
    };
  });

  // 1.5 Phân bổ trạng thái (Status Distribution)
  const statusDistribution = [
    {
      name: 'Đã hoàn thành',
      value: completedCount,
      color: '#0d9488',
      status: 'completed',
    },
    {
      name: 'Đã xác nhận / Sắp tới',
      value: upcomingCount,
      color: '#3b82f6',
      status: 'upcoming',
    },
    {
      name: 'Đã hủy hẹn',
      value: cancelledCount,
      color: '#f43f5e',
      status: 'cancelled',
    },
    {
      name: 'Vắng mặt (No-show)',
      value: noShowCount,
      color: '#f59e0b',
      status: 'no_show',
    },
  ];

  // 1.6 Mật độ khung giờ (Hourly Density) gom nhóm theo 2 ký tự đầu startTime
  const hourlyBuckets = [
    { hour: '08:00', appointments: 0, capacity: 16 },
    { hour: '09:00', appointments: 0, capacity: 30 },
    { hour: '10:00', appointments: 0, capacity: 35 },
    { hour: '11:00', appointments: 0, capacity: 25 },
    { hour: '13:30', appointments: 0, capacity: 20 },
    { hour: '14:30', appointments: 0, capacity: 35 },
    { hour: '15:30', appointments: 0, capacity: 35 },
    { hour: '16:30', appointments: 0, capacity: 30 },
    { hour: '17:30', appointments: 0, capacity: 28 },
    { hour: '18:30', appointments: 0, capacity: 25 },
    { hour: '19:30', appointments: 0, capacity: 15 },
  ];

  const hourlyRows: any = await sequelize.query(
    `
    SELECT 
      SUBSTRING(startTime, 1, 2) AS hourPrefix,
      COUNT(*) AS count
    FROM Appointments
    WHERE appointmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    GROUP BY SUBSTRING(startTime, 1, 2)
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const hourCountMap = new Map<string, number>();
  hourlyRows.forEach((r: any) => {
    hourCountMap.set(String(r.hourPrefix), Number(r.count || 0));
  });

  const hourlyData = hourlyBuckets.map((b) => {
    const prefix = b.hour.substring(0, 2);
    return {
      hour: b.hour,
      appointments: hourCountMap.get(prefix) || 0,
      capacity: b.capacity,
    };
  });

  // 1.7 Hiệu suất Bác sĩ (Doctor Workload Performance)
  const doctorRows: any = await sequelize.query(
    `
    SELECT 
      u.id, 
      u.fullName,
      COUNT(a.id) AS assigned,
      SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM Users u
    LEFT JOIN Appointments a ON a.dentistId = u.id 
      AND a.appointmentDate BETWEEN :startDate AND :endDate
    WHERE u.role = 'dentist'
    GROUP BY u.id, u.fullName
    ORDER BY assigned DESC
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const doctorPerformance = doctorRows.map((r: any) => {
    const assigned = Number(r.assigned || 0);
    const comp = Number(r.completed || 0);
    const rate = assigned > 0 ? Math.round((comp / assigned) * 100) : 0;
    const fullName = String(r.fullName || '');

    return {
      id: r.id,
      name: fullName.startsWith('BS.') ? fullName : `BS. ${fullName}`,
      assigned,
      completed: comp,
      rate,
    };
  });

  // 1.8 Kênh tiếp nhận lịch hẹn (Channel Breakdown) gom nhóm theo phân loại kênh
  const channelsConfig = [
    { key: '1', channel: 'Đặt trực tuyến qua Website', color: 'blue' },
    { key: '2', channel: 'Hotline / Tiếp đón tại quầy', color: 'cyan' },
    { key: '3', channel: 'Bệnh nhân vãng lai (Walk-in)', color: 'emerald' },
    { key: '4', channel: 'Tái khám / Khám định kỳ', color: 'gold' },
    { key: '5', channel: 'Cấp cứu nha khoa', color: 'volcano' },
  ];

  const channelRows: any = await sequelize.query(
    `
    SELECT
      CASE 
        WHEN type = 'regular' AND (createdBy IS NULL OR createdBy = patientId) THEN '1'
        WHEN type = 'regular' AND (createdBy IS NOT NULL AND createdBy != patientId) THEN '2'
        WHEN type = 'walk_in' THEN '3'
        WHEN type = 'follow_up' THEN '4'
        WHEN type = 'emergency' THEN '5'
        ELSE '1'
      END AS channelKey,
      COUNT(*) AS count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS compCount
    FROM Appointments
    WHERE appointmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    GROUP BY channelKey
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const channelMap = new Map<string, { count: number; compCount: number }>();
  channelRows.forEach((r: any) => {
    channelMap.set(String(r.channelKey), {
      count: Number(r.count || 0),
      compCount: Number(r.compCount || 0),
    });
  });

  const channelData = channelsConfig.map((ch) => {
    const data = channelMap.get(ch.key) || { count: 0, compCount: 0 };
    const count = data.count;
    const comp = data.compCount;
    const percent = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
    const convRate = count > 0 ? Number(((comp / count) * 100).toFixed(1)) : 0;

    return {
      key: ch.key,
      channel: ch.channel,
      count,
      percent,
      convRate,
      color: ch.color,
    };
  });

  return {
    period: {
      timeRange: filter.timeRange || 'month',
      startDate,
      endDate,
    },
    kpis: {
      totalAppointments: {
        count: total,
        diffPercent: totalGrowth,
        isIncrease: totalGrowth >= 0,
      },
      completed: {
        count: completedCount,
        rate: completionRate,
      },
      cancelled: {
        count: cancelledTotal,
        diffPercent: cancelledGrowth,
        noShowCount: noShowCount,
        noShowRate: noShowRate,
      },
      patientRatio: {
        newPatients: newPatientsCount,
        returningPatients: returningPatientsCount,
        newPercent,
        returningPercent,
      },
    },
    trendData,
    statusDistribution,
    hourlyData,
    doctorPerformance,
    channelData,
  };
}

/**
 * 2. LẤY THỐNG KÊ LÂM SÀNG & ĐIỀU TRỊ (TỐI ƯU HÓA 100% BẰNG SQL AGGREGATION)
 */
export async function getClinicalStatistics(filter: ClinicalFilter) {
  const { startDate, endDate, prevStartDate, prevEndDate } = resolveDateRange(
    filter.timeRange || 'month',
    filter.startDate,
    filter.endDate
  );

  const dentistId = filter.dentistId && filter.dentistId !== 'all' ? Number(filter.dentistId) : undefined;
  const dentistWhereSql = dentistId ? 'AND dentistId = :dentistId' : '';
  const dentistApptWhereSql = dentistId ? 'AND a.dentistId = :dentistId' : '';

  const replacements: Record<string, any> = {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    dentistId,
  };

  // 2.1 KPIs & Doanh thu thực tế trong kỳ hiện tại
  const [currKpiRow]: any = await sequelize.query(
    `
    SELECT 
      COUNT(*) AS totalCases,
      COALESCE(SUM(cost), 0) AS totalRevenue
    FROM TreatmentHistories
    WHERE treatmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const totalCases = Number(currKpiRow?.totalCases || 0);
  const totalRevenue = Number(currKpiRow?.totalRevenue || 0);
  const avgPerCase = totalCases > 0 ? Math.round(totalRevenue / totalCases) : 0;

  // 2.2 Số lượng ca điều trị kỳ trước để so sánh tăng trưởng
  const [prevKpiRow]: any = await sequelize.query(
    `
    SELECT 
      COUNT(*) AS prevCases
    FROM TreatmentHistories
    WHERE treatmentDate BETWEEN :prevStartDate AND :prevEndDate
      ${dentistWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const prevTreatmentsCount = Number(prevKpiRow?.prevCases || 0);
  const casesGrowth = calcGrowth(totalCases, prevTreatmentsCount);

  // 2.3 Top Dịch vụ Lâm sàng thực hiện nhiều nhất
  let topRows: any = await sequelize.query(
    `
    SELECT 
      COALESCE(NULLIF(TRIM(treatment), ''), NULLIF(TRIM(diagnosis), ''), 'Điều trị lâm sàng') AS name,
      COUNT(*) AS cases,
      ROUND(SUM(cost) / 1000000, 1) AS revenue
    FROM TreatmentHistories
    WHERE treatmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    GROUP BY name
    ORDER BY cases DESC
    LIMIT 8
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  // Fallback từ các lịch hẹn đã hoàn thành nếu TreatmentHistories chưa có dữ liệu
  if (!topRows || topRows.length === 0) {
    topRows = await sequelize.query(
      `
      SELECT 
        COALESCE(s.name, 'Khám tổng quát') AS name,
        COUNT(a.id) AS cases,
        ROUND(SUM(COALESCE(s.price, 0)) / 1000000, 1) AS revenue
      FROM Appointments a
      LEFT JOIN Services s ON s.id = a.serviceId
      WHERE a.appointmentDate BETWEEN :startDate AND :endDate
        AND a.status = 'completed'
        ${dentistApptWhereSql}
      GROUP BY s.id, s.name
      ORDER BY cases DESC
      LIMIT 8
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }

  interface TopServiceItem {
    name: string;
    cases: number;
    revenue: number;
  }

  const topServices: TopServiceItem[] = (topRows || []).map((r: any) => ({
    name: String(r.name),
    cases: Number(r.cases || 0),
    revenue: Number(r.revenue || 0),
  }));

  // 2.4 Doanh thu theo chuyên khoa qua 7 tháng gần nhất từ DB
  const now = new Date();
  const monthlySpecialtyMap = new Map<string, { month: string; prosthetics: number; implant: number; ortho: number; general: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mLabel = `T${d.getMonth() + 1}`;
    monthlySpecialtyMap.set(mLabel, { month: mLabel, prosthetics: 0, implant: 0, ortho: 0, general: 0 });
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const sixMonthsAgoStr = formatLocalYMD(sixMonthsAgo);

  const specialtyTrendRows: any = await sequelize.query(
    `
    SELECT 
      DATE_FORMAT(treatmentDate, '%c') AS monthNum,
      ROUND(SUM(CASE 
        WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'sứ|phục hình|veneer' THEN cost ELSE 0 END) / 1000000) AS prosthetics,
      ROUND(SUM(CASE 
        WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'implant|cấy' THEN cost ELSE 0 END) / 1000000) AS implant,
      ROUND(SUM(CASE 
        WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'niềng|chỉnh nha|mắc cài' THEN cost ELSE 0 END) / 1000000) AS ortho,
      ROUND(SUM(CASE 
        WHEN NOT (LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'sứ|phục hình|veneer|implant|cấy|niềng|chỉnh nha|mắc cài') THEN cost ELSE 0 END) / 1000000) AS general
    FROM TreatmentHistories
    WHERE treatmentDate >= :sixMonthsAgoStr
    GROUP BY DATE_FORMAT(treatmentDate, '%c')
    `,
    { replacements: { sixMonthsAgoStr }, type: QueryTypes.SELECT }
  );

  specialtyTrendRows.forEach((r: any) => {
    const mLabel = `T${r.monthNum}`;
    const row = monthlySpecialtyMap.get(mLabel);
    if (row) {
      row.prosthetics = Number(r.prosthetics || 0);
      row.implant = Number(r.implant || 0);
      row.ortho = Number(r.ortho || 0);
      row.general = Number(r.general || 0);
    }
  });

  const specialtyRevenueTrend = Array.from(monthlySpecialtyMap.values());

  // 2.5 Biểu đồ Radar Ma trận Bệnh lý (1 SQL query đếm regex trên toàn bộ điều trị)
  const [pathologyRow]: any = await sequelize.query(
    `
    SELECT 
      SUM(CASE WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'sâu|trám|caries' THEN 1 ELSE 0 END) AS sauRang,
      SUM(CASE WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'tủy|nội nha|pulp' THEN 1 ELSE 0 END) AS viemTuy,
      SUM(CASE WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'nha chu|vôi|nướu|periodont' THEN 1 ELSE 0 END) AS nhaChu,
      SUM(CASE WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'răng khôn|răng số 8|nhổ' THEN 1 ELSE 0 END) AS rangKhon,
      SUM(CASE WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'khớp cắn|niềng|chỉnh nha' THEN 1 ELSE 0 END) AS khopCan,
      SUM(CASE WHEN LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'mất răng|implant|tiêu xương' THEN 1 ELSE 0 END) AS matRang
    FROM TreatmentHistories
    WHERE treatmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const calcPrevalence = (count: number) => (totalCases > 0 ? Math.round((count / totalCases) * 100) : 0);

  const pathologyRadar = [
    { pathology: 'Sâu răng', prevalence: calcPrevalence(Number(pathologyRow?.sauRang || 0)), fullMark: 100 },
    { pathology: 'Viêm tủy răng', prevalence: calcPrevalence(Number(pathologyRow?.viemTuy || 0)), fullMark: 100 },
    { pathology: 'Viêm nha chu', prevalence: calcPrevalence(Number(pathologyRow?.nhaChu || 0)), fullMark: 100 },
    { pathology: 'Răng khôn mọc lệch', prevalence: calcPrevalence(Number(pathologyRow?.rangKhon || 0)), fullMark: 100 },
    { pathology: 'Khớp cắn sai lệch', prevalence: calcPrevalence(Number(pathologyRow?.khopCan || 0)), fullMark: 100 },
    { pathology: 'Mất răng / Tiêu xương', prevalence: calcPrevalence(Number(pathologyRow?.matRang || 0)), fullMark: 100 },
  ];

  // 2.6 Phân bố độ tuổi từ ngày sinh (dateOfBirth) bệnh nhân bằng TIMESTAMPDIFF SQL
  const [ageRow]: any = await sequelize.query(
    `
    SELECT 
      SUM(CASE WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) < 18 THEN 1 ELSE 0 END) AS under18,
      SUM(CASE WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 18 AND 30 THEN 1 ELSE 0 END) AS from18to30,
      SUM(CASE WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 31 AND 50 THEN 1 ELSE 0 END) AS from31to50,
      SUM(CASE WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) > 50 THEN 1 ELSE 0 END) AS above50
    FROM PatientProfiles
    WHERE dateOfBirth IS NOT NULL
    `,
    { type: QueryTypes.SELECT }
  );

  const ageDistribution = [
    { name: 'Dưới 18 tuổi (Trẻ em & Teen)', value: Number(ageRow?.under18 || 0), color: '#38bdf8' },
    { name: '18 - 30 tuổi (Thẩm mỹ & Niềng)', value: Number(ageRow?.from18to30 || 0), color: '#0d9488' },
    { name: '31 - 50 tuổi (Tổng quát & Sứ)', value: Number(ageRow?.from31to50 || 0), color: '#6366f1' },
    { name: 'Trên 50 tuổi (Implant & Hàm)', value: Number(ageRow?.above50 || 0), color: '#f59e0b' },
  ];

  // 2.7 Danh sách chi tiết thủ thuật lâm sàng & Bác sĩ phụ trách chính
  const leadDoctorRows: any = await sequelize.query(
    `
    SELECT 
      COALESCE(NULLIF(TRIM(t.treatment), ''), NULLIF(TRIM(t.diagnosis), ''), 'Điều trị lâm sàng') AS serviceName,
      u.fullName AS doctorName,
      COUNT(*) AS docCases
    FROM TreatmentHistories t
    LEFT JOIN Users u ON u.id = t.dentistId
    WHERE t.treatmentDate BETWEEN :startDate AND :endDate
      ${dentistWhereSql}
    GROUP BY serviceName, doctorName
    ORDER BY docCases DESC
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const leadDoctorMap = new Map<string, string>();
  leadDoctorRows.forEach((r: any) => {
    const sName = String(r.serviceName);
    if (!leadDoctorMap.has(sName)) {
      const docName = String(r.doctorName || 'Bác sĩ phụ trách');
      leadDoctorMap.set(sName, docName.startsWith('BS') ? docName : `BS. ${docName}`);
    }
  });

  const clinicalDetails = topServices.map((srv, idx) => ({
    key: String(idx + 1),
    service: srv.name,
    category: 'Thủ thuật nha khoa',
    cases: srv.cases,
    avgTime: '30 - 45 phút',
    revenue: formatVND(srv.revenue * 1000000),
    leadDoctor: leadDoctorMap.get(srv.name) || 'BS. Bác sĩ phụ trách',
    successRate: 100,
  }));

  // 2.8 Phục hình & cấy ghép: tính số ca và doanh số thực tế
  const [specialtyRow]: any = await sequelize.query(
    `
    SELECT 
      COUNT(*) AS count,
      COALESCE(SUM(cost), 0) AS rev
    FROM TreatmentHistories
    WHERE treatmentDate BETWEEN :startDate AND :endDate
      AND LOWER(CONCAT(COALESCE(diagnosis, ''), ' ', COALESCE(treatment, ''))) REGEXP 'implant|sứ|veneer'
      ${dentistWhereSql}
    `,
    { replacements, type: QueryTypes.SELECT }
  );

  const specialtyCount = Number(specialtyRow?.count || 0);
  const specialtyRev = Number(specialtyRow?.rev || 0);
  const specialtyRevPercent = totalRevenue > 0 ? Number(((specialtyRev / totalRevenue) * 100).toFixed(1)) : 0;

  return {
    period: {
      timeRange: filter.timeRange || 'month',
      startDate,
      endDate,
    },
    kpis: {
      totalCases: {
        count: totalCases,
        diffPercent: casesGrowth,
        isIncrease: casesGrowth >= 0,
      },
      specialtyCases: {
        count: specialtyCount,
        revenuePercent: specialtyRevPercent,
        label: 'Phục hình & Cấy ghép',
      },
      totalRevenue: {
        amount: totalRevenue,
        avgPerCase,
        formattedAmount: formatVND(totalRevenue),
        formattedAvg: formatVND(avgPerCase),
      },
      successRate: {
        rate: 100,
        reworkRate: 0,
      },
    },
    topServices,
    specialtyRevenueTrend,
    pathologyRadar,
    ageDistribution,
    clinicalDetails,
  };
}
