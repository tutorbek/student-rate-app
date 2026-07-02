import { getGroupPasswordsRegistry } from './supabase';

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

// Default Quick Tags
export const DEFAULT_QUICK_TAGS = [
  'Faol ishtirok 🌟',
  'Uy vazifasi bajardi 📚',
  'Ajoyib javob 💡',
  'Darsga kechikdi ⏰',
  'Guruh ishida faollik 👥',
  'Intizom buzilishi ⚠️',
];

// Helper: Generate Unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper: Get Start of Current Week (Monday 00:00)
export const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0: Sunday, 1: Monday, etc.
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper: Get Start of Current Month (1st of current month 00:00)
export const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// Helper: Get Start of Last Week (Monday 00:00 of previous week)
export const getStartOfLastWeek = () => {
  const currentMonday = getStartOfWeek();
  const lastMonday = new Date(currentMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  return lastMonday;
};

// Helper: Get End of Last Week (Sunday 23:59:59.999 of previous week)
export const getEndOfLastWeek = () => {
  const currentMonday = getStartOfWeek();
  const lastSunday = new Date(currentMonday);
  lastSunday.setMilliseconds(lastSunday.getMilliseconds() - 1);
  return lastSunday;
};

// --- Groups API ---
export const addGroup = (groups, name, icon, password) => {
  const newGroup = {
    id: generateId(),
    name: name.trim(),
    icon: icon || '📁',
    password: password ? password.trim().toLowerCase() : '',
    createdAt: new Date().toISOString(),
  };
  const updatedGroups = [...groups, newGroup];
  return { newGroup, updatedGroups };
};

export const updateGroup = (groups, groupId, newName, newIcon, newPassword) => {
  let updatedGroup = null;
  const updatedGroups = groups.map((g) => {
    if (g.id === groupId) {
      updatedGroup = {
        ...g,
        name: newName.trim(),
        icon: newIcon || g.icon || '📁',
        password: newPassword !== undefined ? newPassword.trim().toLowerCase() : g.password,
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
  const newStudent = {
    id: generateId(),
    name: name.trim(),
    groupId,
    emoji: emoji || '🚀',
    color: color || '#007AFF', // Default Apple blue
    createdAt: new Date().toISOString(),
  };
  const updatedStudents = [...students, newStudent];
  return { newStudent, updatedStudents };
};

export const updateStudent = (students, studentId, newName, newEmoji, newColor) => {
  let updatedStudent = null;
  const updatedStudents = students.map((s) => {
    if (s.id === studentId) {
      updatedStudent = {
        ...s,
        name: newName.trim(),
        emoji: newEmoji || s.emoji,
        color: newColor || s.color,
      };
      return updatedStudent;
    }
    return s;
  });
  return { updatedStudent, updatedStudents };
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

// --- Export / Import ---
export const exportDatabase = (groups, students, transactions, quickTags) => {
  const db = {
    groups,
    students,
    transactions,
    quickTags,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(db, null, 2);
};

export const importDatabase = (jsonString) => {
  const db = JSON.parse(jsonString);
  if (!db || typeof db !== 'object') throw new Error("Yaroqsiz ma'lumot formati");
  
  const groups = Array.isArray(db.groups) ? db.groups : [];
  const students = Array.isArray(db.students) ? db.students : [];
  const transactions = Array.isArray(db.transactions) ? db.transactions : [];
  const quickTags = Array.isArray(db.quickTags) ? db.quickTags : DEFAULT_QUICK_TAGS;

  return { groups, students, transactions, quickTags };
};

// --- Statistics and Calculations API ---
export const getStudentScore = (transactions, studentId, timeframe = 'all') => {
  const txs = transactions.filter((t) => t.studentId === studentId && !t.deleted);
  
  if (timeframe === 'all') {
    return txs.reduce((sum, t) => sum + t.amount, 0);
  }

  if (timeframe === 'lastWeek') {
    const startOfLastWeek = getStartOfLastWeek();
    const endOfLastWeek = getEndOfLastWeek();
    return txs
      .filter((t) => {
        const txDate = new Date(t.timestamp);
        return txDate >= startOfLastWeek && txDate <= endOfLastWeek;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  const limitDate = timeframe === 'week' ? getStartOfWeek() : getStartOfMonth();

  return txs
    .filter((t) => new Date(t.timestamp) >= limitDate)
    .reduce((sum, t) => sum + t.amount, 0);
};

export const resetDatabase = () => {
  return {
    groups: [],
    students: [],
    transactions: [],
    quickTags: DEFAULT_QUICK_TAGS,
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

export const permanentlyDeleteGroup = (groups, students, transactions, groupId) => {
  const updatedGroups = groups.filter((g) => g.id !== groupId);
  const updatedStudents = students.filter((s) => s.groupId !== groupId);
  const remainingStudentIds = updatedStudents.map((s) => s.id);
  const updatedTransactions = transactions.filter((t) => remainingStudentIds.includes(t.studentId));
  return { updatedGroups, updatedStudents, updatedTransactions };
};

export const permanentlyDeleteStudent = (students, transactions, studentId) => {
  const updatedStudents = students.filter((s) => s.id !== studentId);
  const updatedTransactions = transactions.filter((t) => t.studentId !== studentId);
  return { updatedStudents, updatedTransactions };
};
