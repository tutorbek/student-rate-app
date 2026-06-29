// LocalStorage keys
const KEYS = {
  GROUPS: 'rsa_groups',
  STUDENTS: 'rsa_students',
  TRANSACTIONS: 'rsa_transactions',
  QUICK_TAGS: 'rsa_quick_tags',
};

// Default Quick Tags
const DEFAULT_QUICK_TAGS = [
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
export const getGroups = () => {
  const data = localStorage.getItem(KEYS.GROUPS);
  return data ? JSON.parse(data) : [];
};

export const saveGroups = (groups) => {
  localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
};

export const addGroup = (name, icon) => {
  const groups = getGroups();
  const newGroup = {
    id: generateId(),
    name: name.trim(),
    icon: icon || '📁',
    createdAt: new Date().toISOString(),
  };
  groups.push(newGroup);
  saveGroups(groups);
  return newGroup;
};

export const updateGroup = (groupId, newName, newIcon) => {
  const groups = getGroups();
  const index = groups.findIndex((g) => g.id === groupId);
  if (index !== -1) {
    groups[index].name = newName.trim();
    groups[index].icon = newIcon || groups[index].icon || '📁';
    saveGroups(groups);
    return groups[index];
  }
  return null;
};

export const deleteGroup = (groupId) => {
  // 1. Delete group
  const groups = getGroups().filter((g) => g.id !== groupId);
  saveGroups(groups);

  // 2. Find and delete students in group
  const students = getStudents();
  const studentsInGroup = students.filter((s) => s.groupId === groupId);
  const studentIds = studentsInGroup.map((s) => s.id);
  const remainingStudents = students.filter((s) => s.groupId !== groupId);
  saveStudents(remainingStudents);

  // 3. Delete transactions for those students
  const transactions = getTransactions().filter((t) => !studentIds.includes(t.studentId));
  saveTransactions(transactions);
};

// --- Students API ---
export const getStudents = () => {
  const data = localStorage.getItem(KEYS.STUDENTS);
  return data ? JSON.parse(data) : [];
};

export const saveStudents = (students) => {
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
};

export const addStudent = (name, groupId, emoji, color) => {
  const students = getStudents();
  const newStudent = {
    id: generateId(),
    name: name.trim(),
    groupId,
    emoji: emoji || '🚀',
    color: color || '#007AFF', // Default Apple blue
    createdAt: new Date().toISOString(),
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
};

export const updateStudent = (studentId, newName, newEmoji, newColor) => {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === studentId);
  if (index !== -1) {
    students[index].name = newName.trim();
    students[index].emoji = newEmoji || students[index].emoji;
    students[index].color = newColor || students[index].color;
    saveStudents(students);
    return students[index];
  }
  return null;
};

export const deleteStudent = (studentId) => {
  const students = getStudents().filter((s) => s.id !== studentId);
  saveStudents(students);

  // Delete student transactions
  const transactions = getTransactions().filter((t) => t.studentId !== studentId);
  saveTransactions(transactions);
};

// --- Transactions API ---
export const getTransactions = () => {
  const data = localStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (txs) => {
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
};

export const addTransaction = (studentId, amount, comment) => {
  const transactions = getTransactions();
  const newTx = {
    id: generateId(),
    studentId,
    amount: Number(amount),
    comment: comment.trim(),
    timestamp: new Date().toISOString(),
  };
  transactions.unshift(newTx); // Newest transactions first
  saveTransactions(transactions);
  return newTx;
};

export const deleteTransaction = (txId) => {
  const transactions = getTransactions().filter((t) => t.id !== txId);
  saveTransactions(transactions);
};

// --- Quick Tags API ---
export const getQuickTags = () => {
  const data = localStorage.getItem(KEYS.QUICK_TAGS);
  return data ? JSON.parse(data) : DEFAULT_QUICK_TAGS;
};

export const saveQuickTags = (tags) => {
  localStorage.setItem(KEYS.QUICK_TAGS, JSON.stringify(tags));
};

// --- Export / Import ---
export const exportDatabase = () => {
  const db = {
    groups: getGroups(),
    students: getStudents(),
    transactions: getTransactions(),
    quickTags: getQuickTags(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(db, null, 2);
};

export const importDatabase = (jsonString) => {
  try {
    const db = JSON.parse(jsonString);
    if (!db || typeof db !== 'object') throw new Error("Yaroqsiz ma'lumot formati");
    
    // Basic validation
    const groups = Array.isArray(db.groups) ? db.groups : [];
    const students = Array.isArray(db.students) ? db.students : [];
    const transactions = Array.isArray(db.transactions) ? db.transactions : [];
    const quickTags = Array.isArray(db.quickTags) ? db.quickTags : DEFAULT_QUICK_TAGS;

    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(KEYS.QUICK_TAGS, JSON.stringify(quickTags));
    return true;
  } catch (error) {
    console.error("Import error:", error);
    throw new Error("JSON fayl yuklashda xatolik yuz berdi: " + error.message);
  }
};

// --- Statistics and Calculations API ---
export const getStudentScore = (studentId, timeframe = 'all') => {
  const txs = getTransactions().filter((t) => t.studentId === studentId);
  
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
  localStorage.removeItem(KEYS.GROUPS);
  localStorage.removeItem(KEYS.STUDENTS);
  localStorage.removeItem(KEYS.TRANSACTIONS);
  localStorage.removeItem(KEYS.QUICK_TAGS);
};
