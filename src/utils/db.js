import { getGroupPasswordsRegistry } from './supabase.js';
import { normalizeIconUrl } from './avatarGallery.js';

const UZBEK_WORDS = [
  'olma', 'anor', 'uzum', 'anjir', 'orik', 'shaftoli', 'behi', 'tarvuz', 'qovun', 'bodring',
  'pomidor', 'sabzi', 'piyoz', 'kartoshka', 'karam', 'sarimsak', 'qalampir', 'osh', 'palov', 'somsa',
  'manti', 'shurva', 'kabob', 'non', 'choy', 'asal', 'sut', 'qatiq', 'qaymoq', 'pishloq',
  'kitob', 'daftar', 'qalam', 'ruchka', 'sinf', 'maktab', 'ustoz', 'talaba', 'dars', 'bilim',
  'doska', 'parta', 'xona', 'bino', 'shahar', 'qishloq', 'daryo', 'tog', 'gul', 'lola',
  'daraxt', 'barg', 'maysa', 'quyosh', 'yulduz', 'bulut', 'shamol', 'yomgir', 'qor', 'bahor',
  'yoz', 'kuz', 'qish', 'olov', 'suv', 'tuproq', 'tosh', 'temir', 'oltin', 'kumush',
  'soat', 'oyna', 'stol', 'stul', 'gilam', 'uy', 'bog', 'ot', 'sher', 'burgut',
  'lola', 'bugdoy', 'arpa', 'guruch', 'faol', 'epchil', 'robot', 'ajoyib', 'kuchli'
];

/**
 * Generate a unique group password using simple Uzbek words.
 * Queries the global registry to guarantee uniqueness.
 */
export const generateUniqueGroupPassword = async () => {
  try {
    const registry = await getGroupPasswordsRegistry();
    let attempts = 0;
    while (attempts < 100) {
      const randomWord = UZBEK_WORDS[Math.floor(Math.random() * UZBEK_WORDS.length)];
      // First 40 attempts, try plain words. Then start appending numbers.
      const candidate = attempts < 40 ? randomWord : `${randomWord}${Math.floor(Math.random() * 10)}`;
      if (!registry[candidate]) {
        return candidate;
      }
      attempts++;
    }
  } catch (err) {
    console.error('Failed to generate unique password, fallback to random string:', err);
  }
  return `guruh_${Math.random().toString(36).substring(2, 7)}`;
};

// Default Quick Tags with associated default points
export const DEFAULT_QUICK_TAGS = [
  { text: 'Uy vazifasi bajarildi 📚', points: 85 },
  { text: 'Mustaqil izlanish 🔍', points: 50 },
  { text: 'Uy vazifasi chala bajarildi 🔄', points: 20 },
  { text: 'Darsga kechikdi ⏰', points: -10 },
  { text: 'Uy vazifasi bajarilmadi ❌', points: -30 },
  { text: 'Darsga sababsiz kelmadi 🚫', points: -40 },
];

const DEFAULT_POINTS_MAP = {
  'Uy vazifasi bajarildi 📚': 85,
  'Uy vazifasi bajardi 📚': 85,
  'Mustaqil izlanish 🔍': 50,
  'Uy vazifasi chala bajarildi 🔄': 20,
  'Darsga kechikdi ⏰': -10,
  'Uy vazifasi bajarilmadi ❌': -30,
  'Uy vazifasini topshirmadi ❌': -30,
  'Darsga sababsiz kelmadi 🚫': -40,
  'Faol ishtirok 🌟': 50,
  'Ajoyib javob 💡': 20,
  'Guruh ishida faollik 👥': 20,
  'Intizom buzilishi ⚠️': -15,
};

export const normalizeQuickTag = (tag) => {
  if (!tag) return null;

  let text = '';
  let points = undefined;

  if (typeof tag === 'string') {
    text = tag.trim();
  } else if (typeof tag === 'object') {
    text = String(tag.text || '').trim();
    if (tag.points !== undefined && tag.points !== null && tag.points !== '') {
      points = Number(tag.points);
    }
  }

  if (!text) return null;

  // If points is not a valid non-zero number, check default points map
  if (points === undefined || isNaN(points) || points === 0) {
    const defaultPts = DEFAULT_POINTS_MAP[text];
    if (defaultPts !== undefined) {
      points = defaultPts;
    } else {
      points = points || 0;
    }
  }

  return { text, points };
};

export const normalizeQuickTags = (tags) => {
  if (tags === undefined || tags === null) return DEFAULT_QUICK_TAGS;
  if (!Array.isArray(tags)) return DEFAULT_QUICK_TAGS;
  return tags.map(normalizeQuickTag).filter(Boolean);
};

// Helper: Generate Unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper: Get Start of Current Month (1st of current month 00:00)
export const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// Helper: Get Start of Last Month (1st of previous month 00:00)
export const getStartOfLastMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

// Helper: Get End of Last Month (Last day of previous month 23:59:59.999)
export const getEndOfLastMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
};

// --- Groups API ---
export const addGroup = (groups, name, icon, password, color, schedule = null) => {
  const newGroup = {
    id: generateId(),
    name: name.trim(),
    icon: normalizeIconUrl(icon || 'folder'),
    password: password ? password.trim().toLowerCase() : '',
    color: color || '#FFFFFF',
    schedule: schedule || null,
    createdAt: new Date().toISOString(),
  };
  const updatedGroups = [...groups, newGroup];
  return { newGroup, updatedGroups };
};

export const updateGroup = (groups, groupId, newName, newIcon, newPassword, newColor, newSchedule) => {
  let updatedGroup = null;
  const updatedGroups = groups.map((g) => {
    if (g.id === groupId) {
      updatedGroup = {
        ...g,
        name: newName !== undefined ? newName.trim() : g.name,
        icon: newIcon !== undefined ? normalizeIconUrl(newIcon || g.icon || 'folder') : g.icon,
        password: newPassword !== undefined ? newPassword.trim().toLowerCase() : g.password,
        color: newColor !== undefined ? newColor : (g.color || '#FFFFFF'),
        schedule: newSchedule !== undefined ? newSchedule : (g.schedule || null),
      };
      return updatedGroup;
    }
    return g;
  });
  return { updatedGroup, updatedGroups };
};

export const deleteGroup = (groups, students, transactions, groupId) => {
  const deletedTime = new Date().toISOString();
  const updatedGroups = groups.map((g) => {
    if (g.id === groupId) {
      return { ...g, deleted: true, deletedAt: deletedTime };
    }
    return g;
  });

  const studentIds = [];
  const updatedStudents = students.map((s) => {
    if (s.groupId === groupId) {
      studentIds.push(s.id);
      return { ...s, deleted: true, deletedAt: deletedTime };
    }
    return s;
  });

  const updatedTransactions = transactions.map((t) => {
    if (studentIds.includes(t.studentId)) {
      return { ...t, deleted: true, deletedAt: deletedTime };
    }
    return t;
  });

  return { updatedGroups, updatedStudents, updatedTransactions };
};

// --- Students API ---
export const addStudent = (students, name, groupId, emoji, color) => {
  const now = new Date().toISOString();
  const newStudent = {
    id: generateId(),
    name: name.trim(),
    groupId,
    emoji: normalizeIconUrl(emoji || 'lion'),
    color: color || '#007AFF', // Default Apple blue
    createdAt: now,
    joinedGroupAt: now,
  };
  const updatedStudents = [...students, newStudent];
  return { newStudent, updatedStudents };
};

export const migrateStudentAttendance = (attendance = [], studentId, oldGroupId, targetGroupId) => {
  if (!Array.isArray(attendance) || attendance.length === 0 || !studentId || !oldGroupId || !targetGroupId) {
    return attendance;
  }
  if (oldGroupId === targetGroupId) return attendance;

  const sIdStr = String(studentId);
  const now = new Date().toISOString();

  // 1. Collect records for student in oldGroupId
  const studentOldMarksByDate = new Map();

  let updatedList = attendance.map((att) => {
    if (att.groupId === oldGroupId && att.records && att.records[sIdStr] !== undefined) {
      const cleanDate = sanitizeAttendanceDate(att.date);
      studentOldMarksByDate.set(cleanDate, att.records[sIdStr]);

      const { [sIdStr]: _, ...remainingRecords } = att.records;
      return {
        ...att,
        records: remainingRecords,
      };
    }
    return att;
  });

  if (studentOldMarksByDate.size === 0) {
    return attendance;
  }

  // 2. Remove any old sessions that became completely empty
  updatedList = updatedList.filter(
    (att) => att.groupId !== oldGroupId || Object.keys(att.records || {}).length > 0
  );

  // 3. Add or merge marks into targetGroupId
  const targetSessionsByDate = new Map();
  updatedList.forEach((att, idx) => {
    if (att.groupId === targetGroupId) {
      const cleanDate = sanitizeAttendanceDate(att.date);
      targetSessionsByDate.set(cleanDate, idx);
    }
  });

  studentOldMarksByDate.forEach((status, cleanDate) => {
    if (targetSessionsByDate.has(cleanDate)) {
      const idx = targetSessionsByDate.get(cleanDate);
      const existing = updatedList[idx];
      updatedList[idx] = {
        ...existing,
        records: {
          ...existing.records,
          [sIdStr]: status,
        },
      };
    } else {
      const newSession = {
        id: generateId(),
        groupId: targetGroupId,
        date: cleanDate,
        records: {
          [sIdStr]: status,
        },
        createdAt: now,
      };
      updatedList.push(newSession);
      targetSessionsByDate.set(cleanDate, updatedList.length - 1);
    }
  });

  return updatedList;
};

export const syncTransferredStudentsAttendance = (students = [], attendance = []) => {
  if (!Array.isArray(students) || !Array.isArray(attendance) || attendance.length === 0) {
    return { updatedAttendance: attendance, hasChanges: false };
  }

  let currentAttendance = [...attendance];
  let hasChanges = false;

  students.forEach((student) => {
    if (!student || student.deleted || !student.groupId) return;
    const currentGroupId = student.groupId;
    const sIdStr = String(student.id);

    // Check if this student has attendance records in other groups
    const mismatchedGroups = new Set();
    currentAttendance.forEach((att) => {
      if (att && att.groupId && att.groupId !== currentGroupId && att.records && att.records[sIdStr] !== undefined) {
        mismatchedGroups.add(att.groupId);
      }
    });

    if (mismatchedGroups.size > 0) {
      mismatchedGroups.forEach((oldGroupId) => {
        currentAttendance = migrateStudentAttendance(currentAttendance, student.id, oldGroupId, currentGroupId);
        hasChanges = true;
      });
    }
  });

  return { updatedAttendance: currentAttendance, hasChanges };
};

export const updateStudent = (students, studentId, newName, newEmoji, newColor, newGroupId = null, attendance = []) => {
  let updatedStudent = null;
  const now = new Date().toISOString();
  const sIdStr = String(studentId);
  let oldGroupId = null;
  let isGroupChanged = false;

  const updatedStudents = students.map((s) => {
    if (String(s.id) === sIdStr) {
      isGroupChanged = newGroupId && newGroupId !== s.groupId;
      const history = Array.isArray(s.groupHistory) ? s.groupHistory : [];
      let updatedHistory = history;
      let newJoinedGroupAt = s.joinedGroupAt;

      if (isGroupChanged) {
        oldGroupId = s.groupId;
        const previousEntry = {
          groupId: s.groupId,
          joinedAt: s.joinedGroupAt || s.createdAt || now,
          leftAt: now,
        };
        updatedHistory = [...history, previousEntry];
        newJoinedGroupAt = now;
      }

      updatedStudent = {
        ...s,
        name: newName !== undefined && newName !== null ? newName.trim() : s.name,
        emoji: normalizeIconUrl(newEmoji || s.emoji),
        color: newColor || s.color,
        groupId: newGroupId || s.groupId,
        joinedGroupAt: newJoinedGroupAt,
        groupHistory: updatedHistory,
      };
      return updatedStudent;
    }
    return s;
  });

  let updatedAttendance = attendance;
  if (isGroupChanged && oldGroupId && newGroupId && Array.isArray(attendance) && attendance.length > 0) {
    updatedAttendance = migrateStudentAttendance(attendance, studentId, oldGroupId, newGroupId);
  }

  return { updatedStudent, updatedStudents, updatedAttendance };
};

export const transferStudent = (students, studentId, targetGroupId, attendance = []) => {
  let updatedStudent = null;
  const now = new Date().toISOString();
  const sIdStr = String(studentId);
  let oldGroupId = null;

  const updatedStudents = students.map((s) => {
    if (String(s.id) === sIdStr) {
      if (s.groupId === targetGroupId) {
        updatedStudent = s;
        return s;
      }
      oldGroupId = s.groupId;
      const history = Array.isArray(s.groupHistory) ? s.groupHistory : [];
      const previousEntry = {
        groupId: s.groupId,
        joinedAt: s.joinedGroupAt || s.createdAt || now,
        leftAt: now,
      };
      updatedStudent = {
        ...s,
        groupId: targetGroupId,
        joinedGroupAt: now,
        groupHistory: [...history, previousEntry],
      };
      return updatedStudent;
    }
    return s;
  });

  let updatedAttendance = attendance;
  if (oldGroupId && oldGroupId !== targetGroupId && Array.isArray(attendance) && attendance.length > 0) {
    updatedAttendance = migrateStudentAttendance(attendance, studentId, oldGroupId, targetGroupId);
  }

  return { updatedStudent, updatedStudents, updatedAttendance };
};

export const deleteStudent = (students, transactions, studentId) => {
  const deletedTime = new Date().toISOString();
  const updatedStudents = students.map((s) => {
    if (s.id === studentId) {
      return { ...s, deleted: true, deletedAt: deletedTime };
    }
    return s;
  });

  const updatedTransactions = transactions.map((t) => {
    if (t.studentId === studentId) {
      return { ...t, deleted: true, deletedAt: deletedTime };
    }
    return t;
  });

  return { updatedStudents, updatedTransactions };
};

// --- Transactions API ---
export const addTransaction = (transactions, studentId, amount, comment) => {
  const newTx = {
    id: generateId(),
    studentId,
    amount: Number(amount),
    comment: comment.trim(),
    timestamp: new Date().toISOString(),
  };
  const updatedTransactions = [newTx, ...transactions]; // Newest transactions first
  return { newTx, updatedTransactions };
};

export const deleteTransaction = (transactions, txId) => {
  const updatedTransactions = transactions.map((t) => {
    if (t.id === txId) {
      return { ...t, deleted: true, deletedAt: new Date().toISOString() };
    }
    return t;
  });
  return updatedTransactions;
};

// --- Attendance API ---
export const sanitizeAttendanceDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  let [year, month, day] = parts;
  if (month === '00' || month === '0') {
    month = '01';
    return `${year}-${month}-${day}`;
  }
  if (month === '13') {
    month = '01';
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

export const sanitizeAttendanceList = (attendance = []) => {
  if (!Array.isArray(attendance)) return [];
  const map = new Map();
  attendance.forEach((rec) => {
    if (!rec || !rec.date) return;
    const cleanDate = sanitizeAttendanceDate(rec.date);
    const key = `${rec.groupId}_${cleanDate}`;
    if (map.has(key)) {
      const existing = map.get(key);
      map.set(key, {
        ...existing,
        ...rec,
        id: existing.id || rec.id,
        date: cleanDate,
        records: { ...(existing.records || {}), ...(rec.records || {}) },
        updatedAt: rec.updatedAt || existing.updatedAt || new Date().toISOString(),
      });
    } else {
      map.set(key, cleanDate === rec.date ? rec : { ...rec, date: cleanDate });
    }
  });
  return Array.from(map.values());
};

export const saveAttendance = (attendance = [], groupId, date, records) => {
  const cleanDate = sanitizeAttendanceDate(date);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (cleanDate > todayStr) {
    console.warn(`[saveAttendance] Blocked saving attendance for future date: ${cleanDate}`);
    return { updatedRecord: null, updatedAttendance: attendance, error: 'FUTURE_DATE_BLOCKED' };
  }

  // records is an object: { [studentId]: 'present' | 'absent' | 'late' }
  const existingRecordIndex = attendance.findIndex(
    (a) => a.groupId === groupId && sanitizeAttendanceDate(a.date) === cleanDate
  );

  const updatedRecord = {
    groupId,
    date: cleanDate,
    records,
    updatedAt: new Date().toISOString(),
  };

  let updatedAttendance;
  if (existingRecordIndex > -1) {
    updatedRecord.id = attendance[existingRecordIndex].id;
    updatedRecord.createdAt = attendance[existingRecordIndex].createdAt;
    updatedAttendance = [...attendance];
    updatedAttendance[existingRecordIndex] = updatedRecord;
  } else {
    updatedRecord.id = generateId();
    updatedRecord.createdAt = new Date().toISOString();
    updatedAttendance = [...attendance, updatedRecord];
  }

  return { updatedRecord, updatedAttendance };
};

export const deleteAttendanceRecord = (attendance = [], groupId, date, studentId = null) => {
  const cleanDate = sanitizeAttendanceDate(date);
  const existingRecordIndex = attendance.findIndex(
    (a) => a.groupId === groupId && sanitizeAttendanceDate(a.date) === cleanDate
  );

  if (existingRecordIndex === -1) {
    return attendance;
  }

  const updatedAttendance = [...attendance];
  const targetRecord = { ...updatedAttendance[existingRecordIndex], date: cleanDate };

  if (studentId) {
    // Delete individual student record
    const updatedRecords = { ...targetRecord.records };
    delete updatedRecords[studentId];

    if (Object.keys(updatedRecords).length === 0) {
      // Remove entire date record if no student records remain
      updatedAttendance.splice(existingRecordIndex, 1);
    } else {
      targetRecord.records = updatedRecords;
      targetRecord.updatedAt = new Date().toISOString();
      updatedAttendance[existingRecordIndex] = targetRecord;
    }
  } else {
    // Delete entire date record for the group
    updatedAttendance.splice(existingRecordIndex, 1);
  }

  return updatedAttendance;
};

// --- Export / Import ---
export const exportDatabase = (groups, students, transactions, quickTags, attendance = []) => {
  const normalizedGroups = (groups || []).map((g) => ({
    ...g,
    icon: normalizeIconUrl(g.icon),
  }));
  const normalizedStudents = (students || []).map((s) => ({
    ...s,
    emoji: normalizeIconUrl(s.emoji),
  }));

  const db = {
    groups: normalizedGroups,
    students: normalizedStudents,
    transactions,
    quickTags,
    attendance,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(db, null, 2);
};

export const importDatabase = (jsonString) => {
  const db = JSON.parse(jsonString);
  if (!db || typeof db !== 'object') throw new Error("Yaroqsiz ma'lumot formati");
  
  const rawGroups = Array.isArray(db.groups) ? db.groups : [];
  const rawStudents = Array.isArray(db.students) ? db.students : [];
  const transactions = Array.isArray(db.transactions) ? db.transactions : [];
  const quickTags = Array.isArray(db.quickTags) ? db.quickTags : DEFAULT_QUICK_TAGS;
  const attendance = Array.isArray(db.attendance) ? db.attendance : [];

  const groups = rawGroups.map((g) => ({
    ...g,
    icon: normalizeIconUrl(g.icon),
  }));

  const students = rawStudents.map((s) => ({
    ...s,
    emoji: normalizeIconUrl(s.emoji),
  }));

  return { groups, students, transactions, quickTags, attendance };
};

// --- Statistics and Calculations API ---
export const getStudentScore = (transactions, studentId, timeframe = 'month') => {
  const txs = transactions.filter((t) => t.studentId === studentId && !t.deleted);
  
  if (timeframe === 'all') {
    return txs.reduce((sum, t) => sum + t.amount, 0);
  }

  if (timeframe === 'lastMonth') {
    const startOfLastMonth = getStartOfLastMonth();
    const endOfLastMonth = getEndOfLastMonth();
    return txs
      .filter((t) => {
        const txDate = new Date(t.timestamp);
        return txDate >= startOfLastMonth && txDate <= endOfLastMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // default 'month'
  const startOfMonth = getStartOfMonth();
  return txs
    .filter((t) => new Date(t.timestamp) >= startOfMonth)
    .reduce((sum, t) => sum + t.amount, 0);
};

export const resetDatabase = () => {
  return {
    groups: [],
    students: [],
    transactions: [],
    quickTags: DEFAULT_QUICK_TAGS,
    attendance: [],
  };
};

export const restoreGroup = (groups, students, transactions, groupId) => {
  const updatedGroups = groups.map((g) => {
    if (g.id === groupId) {
      const { deleted, deletedAt, ...rest } = g;
      return rest;
    }
    return g;
  });

  const studentIds = [];
  const updatedStudents = students.map((s) => {
    if (s.groupId === groupId && s.deleted) {
      studentIds.push(s.id);
      const { deleted, deletedAt, ...rest } = s;
      return rest;
    }
    return s;
  });

  const updatedTransactions = transactions.map((t) => {
    if (studentIds.includes(t.studentId) && t.deleted) {
      const { deleted, deletedAt, ...rest } = t;
      return rest;
    }
    return t;
  });

  return { updatedGroups, updatedStudents, updatedTransactions };
};

export const restoreStudent = (groups, students, transactions, studentId) => {
  let studentGroupId = null;
  const updatedStudents = students.map((s) => {
    if (s.id === studentId) {
      studentGroupId = s.groupId;
      const { deleted, deletedAt, ...rest } = s;
      return rest;
    }
    return s;
  });

  // If the group this student belongs to is also deleted, restore it as well!
  const updatedGroups = groups.map((g) => {
    if (g.id === studentGroupId && g.deleted) {
      const { deleted, deletedAt, ...rest } = g;
      return rest;
    }
    return g;
  });

  const updatedTransactions = transactions.map((t) => {
    if (t.studentId === studentId && t.deleted) {
      const { deleted, deletedAt, ...rest } = t;
      return rest;
    }
    return t;
  });

  return { updatedGroups, updatedStudents, updatedTransactions };
};

export const permanentlyDeleteGroup = (groups, students, transactions, groupId, attendance = []) => {
  const updatedGroups = groups.filter((g) => g.id !== groupId);
  const updatedStudents = students.filter((s) => s.groupId !== groupId);
  const remainingStudentIds = updatedStudents.map((s) => s.id);
  const updatedTransactions = transactions.filter((t) => remainingStudentIds.includes(t.studentId));
  const updatedAttendance = Array.isArray(attendance) ? attendance.filter((a) => a.groupId !== groupId) : [];
  return { updatedGroups, updatedStudents, updatedTransactions, updatedAttendance };
};

export const permanentlyDeleteStudent = (students, transactions, studentId, attendance = []) => {
  const updatedStudents = students.filter((s) => s.id !== studentId);
  const updatedTransactions = transactions.filter((t) => t.studentId !== studentId);
  const sIdStr = String(studentId);
  const updatedAttendance = Array.isArray(attendance)
    ? attendance.map((att) => {
        if (!att || !att.records || !att.records[sIdStr]) return att;
        const { [sIdStr]: _, ...remainingRecords } = att.records;
        return {
          ...att,
          records: remainingRecords,
        };
      })
    : [];
  return { updatedStudents, updatedTransactions, updatedAttendance };
};
