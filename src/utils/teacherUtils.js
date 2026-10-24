import { calculateSessionAttendance, calculateAttendanceRate } from './attendanceUtils.js';
import { parseTimeToMinutes } from './scheduleUtils.js';

export const TEACHER_IDS = ['teacher1'];

export const TEACHER_LABELS = {
  teacher1: 'Bekzod',
};

export const DEFAULT_TEACHER_CREDENTIALS = {
  teacher1: 'insight',
};

/**
 * Format money in Uzbek sum format (e.g. "400 000 so'm")
 */
export const formatMoneyUz = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 so'm";
  return Number(amount).toLocaleString('uz-UZ').replace(/[\u00A0,]/g, ' ') + " so'm";
};

/**
 * Safely parse fee number, returning null for empty string or negative numbers.
 * Handles space separators (e.g. "400 000" -> 400000).
 */
export const parseFee = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const cleanVal = typeof val === 'string' ? val.replace(/\s+/g, '') : val;
  const num = Number(cleanVal);
  return (!isNaN(num) && num >= 0) ? num : null;
};

/**
 * Resolves a teacher's display name, preferring dynamic real name over static label.
 * Accepts either teacherProfile object or full teacherData object.
 */
export const getTeacherDisplayName = (teacherId, profileOrData = null) => {
  const profile = profileOrData?.teacherProfile || profileOrData?.profile || profileOrData;
  const customName = profile?.fullName?.trim();
  if (customName) return customName;
  return TEACHER_LABELS[teacherId] || teacherId || 'Ustoz';
};

/**
 * Extracts 2-letter uppercase initials from full name.
 */
export const getTeacherInitials = (name) => {
  if (!name || typeof name !== 'string') return 'US';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  if (words.length === 1 && words[0].length === 1) {
    return words[0].toUpperCase();
  }
  return 'US';
};

/**
 * Determines attendance KPI tier based on percentage:
 * - A'lo (>= 90%)
 * - O'rtacha (75% - 89%)
 * - E'tibor talab (< 75%)
 * - Ma'lumot yo'q (no sessions)
 */
export const getTeacherKpiTier = (attendanceRate, sessionsCount = 1) => {
  if (sessionsCount === 0 || attendanceRate === null || attendanceRate === undefined || isNaN(attendanceRate)) {
    return {
      tier: 'none',
      label: "Ma'lumot yo'q",
      color: '#6B7280',
      badgeBg: 'rgba(107, 114, 128, 0.1)',
      badgeBorder: 'rgba(107, 114, 128, 0.25)',
      icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" fill="#6B7280"/></svg>',
    };
  }

  if (attendanceRate >= 90) {
    return {
      tier: 'excellent',
      label: "A'lo",
      color: '#059669',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
      icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" fill="#059669"/></svg>',
    };
  }

  if (attendanceRate >= 75) {
    return {
      tier: 'average',
      label: "O'rtacha",
      color: '#D97706',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" fill="#D97706"/></svg>',
    };
  }

  return {
    tier: 'needs_attention',
    label: "E'tibor talab",
    color: '#DC2626',
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    badgeBorder: 'rgba(239, 68, 68, 0.3)',
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" fill="#DC2626"/></svg>',
  };
};

/**
 * Calculates student retention rate percentage:
 * Retention = active / (active + departed) * 100
 * If total is 0, returns 100% (safe default when no students have ever departed).
 */
export const calculateRetentionRate = (activeCount = 0, departedCount = 0) => {
  const validActive = Math.max(0, Number(activeCount) || 0);
  const validDeparted = Math.max(0, Number(departedCount) || 0);
  const total = validActive + validDeparted;
  if (total === 0) return 100;
  return Math.round((validActive / total) * 100);
};

/**
 * Unified month key helper (e.g. "2026-09")
 */
export const getMonthKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calculates financial KPI for a teacher:
 * expected revenue vs collected revenue (both for selected month and all time).
 */
export const calculateTeacherFinancials = (teacherData = {}, selectedMonthKey = null, defaultMonthlyFee = 400000) => {
  const groups = (teacherData?.groups || []).filter((g) => !g.deleted);
  const students = (teacherData?.students || []).filter((s) => !s.deleted);
  const payments = (teacherData?.payments || []).filter((p) => !p.deleted);
  const monthKey = selectedMonthKey || getMonthKey();

  const groupsMap = new Map();
  groups.forEach((g) => groupsMap.set(String(g.id), g));

  // Calculate monthly expected revenue from active students
  let expectedMonthlyRevenue = 0;
  students.forEach((s) => {
    const group = groupsMap.get(String(s.groupId));
    const sFee = parseFee(s.monthlyFee);
    const gFee = group ? parseFee(group.monthlyFee) : null;
    const resolvedFee = sFee !== null ? sFee : (gFee !== null ? gFee : defaultMonthlyFee);
    expectedMonthlyRevenue += resolvedFee;
  });

  // Calculate collected revenue for current month
  let collectedMonthlyRevenue = 0;
  let collectedAllTimeRevenue = 0;

  payments.forEach((p) => {
    const amount = Number(p.amount) || 0;
    collectedAllTimeRevenue += amount;
    const pMonth = p.month || (p.date ? String(p.date).substring(0, 7) : '');
    if (pMonth === monthKey) {
      collectedMonthlyRevenue += amount;
    }
  });

  const collectionRate = expectedMonthlyRevenue > 0
    ? Math.round((collectedMonthlyRevenue / expectedMonthlyRevenue) * 100)
    : (collectedMonthlyRevenue > 0 ? 100 : 0);

  return {
    monthKey,
    expectedMonthlyRevenue,
    collectedMonthlyRevenue,
    collectedAllTimeRevenue,
    collectionRate,
  };
};

/**
 * Aggregates all attendance metrics for a teacher (all-time & current month).
 */
export const calculateTeacherAttendanceMetrics = (teacherData = {}, selectedMonthKey = null) => {
  const students = teacherData?.students || [];
  const attendance = teacherData?.attendance || [];
  const monthKey = selectedMonthKey || getMonthKey();

  let allPresent = 0;
  let allAbsent = 0;
  let allLate = 0;
  let allExcused = 0;

  let monthPresent = 0;
  let monthAbsent = 0;
  let monthLate = 0;
  let monthExcused = 0;
  let monthSessionsCount = 0;

  attendance.forEach((rec) => {
    const isThisMonth = rec?.date && String(rec.date).startsWith(monthKey);
    if (isThisMonth) {
      monthSessionsCount++;
    }

    const breakdown = calculateSessionAttendance(rec, students);
    allPresent += breakdown.present;
    allAbsent += breakdown.absent;
    allLate += breakdown.late;
    allExcused += breakdown.excused;

    if (isThisMonth) {
      monthPresent += breakdown.present;
      monthAbsent += breakdown.absent;
      monthLate += breakdown.late;
      monthExcused += breakdown.excused;
    }
  });

  const allAccountable = allPresent + allAbsent + allLate;
  const allTotalMarked = allAccountable + allExcused;
  const allTimeRate = calculateAttendanceRate(allPresent, allAbsent, allLate, allTotalMarked, allExcused);

  const monthAccountable = monthPresent + monthAbsent + monthLate;
  const monthTotalMarked = monthAccountable + monthExcused;
  const monthRate = calculateAttendanceRate(monthPresent, monthAbsent, monthLate, monthTotalMarked, monthExcused);

  return {
    totalSessions: attendance.length,
    monthSessions: monthSessionsCount,
    allTime: {
      present: allPresent,
      absent: allAbsent,
      late: allLate,
      excused: allExcused,
      totalMarked: allTotalMarked,
      accountable: allAccountable,
      rate: allTimeRate,
      tier: getTeacherKpiTier(allTimeRate, attendance.length),
    },
    currentMonth: {
      monthKey,
      present: monthPresent,
      absent: monthAbsent,
      late: monthLate,
      excused: monthExcused,
      totalMarked: monthTotalMarked,
      accountable: monthAccountable,
      rate: monthRate,
      tier: getTeacherKpiTier(monthRate, monthSessionsCount),
    },
  };
};

/**
 * Computes complete KPI dossier for a teacher.
 */
export const calculateTeacherKpis = (teacherId, teacherData = {}, options = {}) => {
  const profile = teacherData?.teacherProfile || teacherData?.profile || {};
  const displayName = getTeacherDisplayName(teacherId, profile);
  const initials = getTeacherInitials(displayName);
  const title = profile.title?.trim() || 'Ustoz';
  const currentPassword = profile.password?.trim() || DEFAULT_TEACHER_CREDENTIALS[teacherId] || '';

  const groups = (teacherData?.groups || []).filter((g) => !g.deleted);
  const allStudents = teacherData?.students || [];
  const activeStudents = allStudents.filter((s) => !s.deleted);
  const departedStudents = allStudents.filter((s) => s.deleted);

  const retentionRate = calculateRetentionRate(activeStudents.length, departedStudents.length);
  const churnRate = 100 - retentionRate;

  const monthKey = options.monthKey || getMonthKey(options.now);
  const defaultMonthlyFee = options.defaultMonthlyFee || 400000;

  const attendanceMetrics = calculateTeacherAttendanceMetrics(teacherData, monthKey);
  const financials = calculateTeacherFinancials(teacherData, monthKey, defaultMonthlyFee);

  return {
    teacherId,
    displayName,
    initials,
    title,
    profile,
    currentPassword,
    hasCustomPassword: Boolean(profile.password?.trim()),
    groupsCount: groups.length,
    groups,
    activeStudentsCount: activeStudents.length,
    activeStudents,
    departedStudentsCount: departedStudents.length,
    departedStudents,
    totalEnrolledEver: allStudents.length,
    retentionRate,
    churnRate,
    attendance: attendanceMetrics,
    financials,
    hasData: groups.length > 0 || activeStudents.length > 0 || attendanceMetrics.totalSessions > 0,
  };
};

/**
 * Validates and constructs group creation payload.
 */
export const buildGroupPayload = ({
  teacherId,
  name,
  category = 'teens',
  icon = 'folder',
  room = '1-xona',
  days = [],
  startTime = '14:00',
  endTime = '15:30',
  monthlyFee = 400000,
  password = '',
  color = '#3B82F6',
}) => {
  if (!teacherId || typeof teacherId !== 'string') {
    throw new Error("Ustoz tanlanishi shart!");
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error("Guruh nomi kiritilishi shart!");
  }

  const cleanName = name.trim();
  const cleanCategory = category === 'kids' ? 'kids' : 'teens';
  const cleanRoom = (room || '1-xona').trim();
  const cleanDays = Array.isArray(days) ? [...days] : [];
  const cleanStartTime = (startTime || '14:00').trim();
  const cleanEndTime = (endTime || '15:30').trim();

  const startMin = parseTimeToMinutes(cleanStartTime);
  const endMin = parseTimeToMinutes(cleanEndTime);
  if (startMin !== null && endMin !== null && startMin >= endMin) {
    throw new Error("Dars tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak!");
  }

  const cleanMonthlyFee = parseFee(monthlyFee) !== null ? parseFee(monthlyFee) : 400000;
  const cleanPassword = (password || '').trim().toLowerCase();

  const id = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  return {
    id,
    name: cleanName,
    icon: icon || 'folder',
    color: color || '#3B82F6',
    category: cleanCategory,
    monthlyFee: cleanMonthlyFee,
    password: cleanPassword,
    room: cleanRoom,
    schedule: {
      days: cleanDays,
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      room: cleanRoom,
    },
    createdAt: new Date().toISOString(),
  };
};
