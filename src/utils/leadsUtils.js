/**
 * Utility functions and constants for CRM Leads Management (Phase 3)
 */

export const LEAD_STATUSES = {
  new: {
    key: 'new',
    label: 'Yangi ariza',
    badge: 'Yangi',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A'
  },
  contacted: {
    key: 'contacted',
    label: 'Aloqada',
    badge: 'Aloqada',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE'
  },
  trial: {
    key: 'trial',
    label: 'Sinov darsida',
    badge: 'Sinov darsi',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE'
  },
  converted: {
    key: 'converted',
    label: 'Qabul qilindi',
    badge: 'Qabul qilindi',
    color: '#059669',
    bg: '#D1FAE5',
    border: '#A7F3D0'
  },
  cancelled: {
    key: 'cancelled',
    label: 'Bekor qilindi',
    badge: 'Bekor qilindi',
    color: '#6B7280',
    bg: '#F3F4F6',
    border: '#E5E7EB'
  }
};

export const SUBJECT_OPTIONS = [
  'Robototexnika',
  'Dasturlash',
  'Mental arifmetika',
  'Ingliz tili',
  'Matematika',
  'Boshqa'
];

export const SOURCE_OPTIONS = [
  'Instagram',
  'Telegram',
  "Do'stidan/Tanishidan",
  'Banner/Tashqi reklama',
  'Boshqa'
];

export const COLOR_OPTIONS = [
  { name: 'Ko\'k (Apple Blue)', value: '#007AFF' },
  { name: 'Yashil (Apple Green)', value: '#34C759' },
  { name: 'To\'q sariq (Orange)', value: '#FF9500' },
  { name: 'Binafsha (Purple)', value: '#AF52DE' },
  { name: 'Qizil (Red)', value: '#FF3B30' },
  { name: 'Burnt Sienna', value: '#E35336' },
  { name: 'Teal', value: '#30B0C7' }
];

// Helper: Uzbek clean phone number (digits only)
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/[^\d+]/g, '');
};

// Formats phone into dialable E.164 number (+998...)
export const getDialablePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }
  if (digits.length > 0) {
    return String(phone).trim().startsWith('+') ? `+${digits}` : digits;
  }
  return '';
};

// Formats phone into readable display string (+998 (90) 123-45-67)
export const formatDisplayPhone = (phone) => {
  if (!phone) return "Kiritilmagan";
  const cleaned = String(phone).trim();
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 9) {
    return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
  }
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  return cleaned;
};

// Auto-formats phone input while typing (+998 (XX) XXX-XX-XX)
// Correctly handles local 9-digit numbers starting with 998 (e.g. Uzmobile operator 99 8XX-XX-XX)
export const formatPhoneInput = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  let localDigits = digits;
  if (digits.length > 9 && digits.startsWith('998')) {
    localDigits = digits.slice(3);
  } else if (str.startsWith('+998') || str.startsWith('+ 998')) {
    localDigits = digits.slice(3);
  } else if (digits.length === 12 && digits.startsWith('998')) {
    localDigits = digits.slice(3);
  }

  localDigits = localDigits.slice(0, 9);
  if (localDigits.length === 0) return '';
  if (localDigits.length <= 2) return `+998 (${localDigits}`;
  if (localDigits.length <= 5) return `+998 (${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  if (localDigits.length <= 7) return `+998 (${localDigits.slice(0, 2)}) ${localDigits.slice(2, 5)}-${localDigits.slice(5)}`;
  return `+998 (${localDigits.slice(0, 2)}) ${localDigits.slice(2, 5)}-${localDigits.slice(5, 7)}-${localDigits.slice(7, 9)}`;
};

// Format date-time for display (e.g. "28-Sentabr, 15:30")
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}, ${hours}:${mins}`;
  } catch {
    return String(dateStr);
  }
};

// Returns relative status of trial date (today, tomorrow, past)
export const getTrialDateBadge = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Bugun', type: 'today' };
    if (diffDays === 1) return { label: 'Ertaga', type: 'tomorrow' };
    if (diffDays < 0) return { label: "O'tgan", type: 'past' };
    return null;
  } catch {
    return null;
  }
};

// Generates polite, pre-filled Telegram invitation message
export const getTelegramLeadMessage = (lead) => {
  const name = lead?.name || "Hurmatli o'quvchi";
  const subject = lead?.subject || "o'quv kursi";
  if (lead?.trialDate) {
    const formattedDate = formatDateTime(lead.trialDate);
    return `Assalomu alaykum! ${name}ning ${subject} kursi bo'yicha arizangiz yuzasidan "Epchil Robot" o'quv markazidan bog'lanmoqdamiz. Sizni ${formattedDate} dagi sinov darsimizga taklif qilamiz! Sizni kutib qolamiz.`;
  }
  return `Assalomu alaykum! ${name}ning ${subject} kursi bo'yicha arizangiz yuzasidan "Epchil Robot" o'quv markazidan bog'lanmoqdamiz. Sizni sinov darsimizga taklif qilamiz! Qaysi kun va vaqt sizga qulay bo'ladi?`;
};

// Generates Telegram share URL
export const getTelegramUrl = (lead) => {
  const text = getTelegramLeadMessage(lead);
  return `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
};

// Calculates KPI statistics for leads list
export const calculateLeadsKpis = (leads = []) => {
  const total = leads.length;
  let newCount = 0;
  let contactedCount = 0;
  let trialCount = 0;
  let convertedCount = 0;
  let cancelledCount = 0;

  leads.forEach((l) => {
    const s = l.status || 'new';
    if (s === 'new') newCount++;
    else if (s === 'contacted') contactedCount++;
    else if (s === 'trial') trialCount++;
    else if (s === 'converted') convertedCount++;
    else if (s === 'cancelled') cancelledCount++;
    else newCount++;
  });

  const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

  return {
    total,
    newCount,
    contactedCount,
    trialCount,
    convertedCount,
    cancelledCount,
    conversionRate
  };
};

// Filters and sorts leads list
export const filterAndSortLeads = (
  leads = [],
  { statusFilter = 'all', subjectFilter = 'all', teacherFilter = 'all', sourceFilter = 'all', searchQuery = '', sortBy = 'newest' } = {}
) => {
  let result = [...leads];

  // Status filter (defaults empty status to 'new')
  if (statusFilter !== 'all') {
    result = result.filter((l) => (l.status || 'new') === statusFilter);
  }

  // Subject filter: when 'Boshqa' is selected, include non-standard subjects
  if (subjectFilter !== 'all') {
    if (subjectFilter === 'Boshqa') {
      const standardSubjects = SUBJECT_OPTIONS.filter((s) => s !== 'Boshqa');
      result = result.filter((l) => !standardSubjects.includes(l.subject));
    } else {
      result = result.filter((l) => l.subject === subjectFilter);
    }
  }

  // Teacher filter
  if (teacherFilter !== 'all') {
    result = result.filter((l) => (l.teacherId || 'any') === teacherFilter);
  }

  // Source filter
  if (sourceFilter !== 'all') {
    result = result.filter((l) => l.source === sourceFilter);
  }

  // Search query (matches name, subject, note, source, and normalized phone numbers)
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const qLocalDigits = qDigits.startsWith('998') && qDigits.length > 3 ? qDigits.slice(3) : '';

    result = result.filter((l) => {
      const nameMatch = (l.name || '').toLowerCase().includes(q);
      const subjectMatch = (l.subject || '').toLowerCase().includes(q);
      const noteMatch = (l.note || '').toLowerCase().includes(q);
      const sourceMatch = (l.source || '').toLowerCase().includes(q);

      let phoneMatch = false;
      if (qDigits) {
        const phoneList = [l.phone, l.parentPhone].filter(Boolean);
        phoneMatch = phoneList.some((p) => {
          const raw = String(p).replace(/\D/g, '');
          const dialable = getDialablePhone(p).replace(/\D/g, '');
          return (
            raw.includes(qDigits) ||
            dialable.includes(qDigits) ||
            (qLocalDigits && (raw.includes(qLocalDigits) || dialable.includes(qLocalDigits)))
          );
        });
      }

      return nameMatch || subjectMatch || noteMatch || sourceMatch || phoneMatch;
    });
  }

  // Sorting with NaN protection
  result.sort((a, b) => {
    if (sortBy === 'newest') {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
    }
    if (sortBy === 'oldest') {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'trialDate') {
      const tA = a.trialDate ? new Date(a.trialDate).getTime() : NaN;
      const tB = b.trialDate ? new Date(b.trialDate).getTime() : NaN;
      const validA = !isNaN(tA);
      const validB = !isNaN(tB);
      if (!validA && !validB) return 0;
      if (!validA) return 1;
      if (!validB) return -1;
      return tA - tB;
    }
    return 0;
  });

  return result;
};
