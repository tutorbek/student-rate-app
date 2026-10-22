import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalDismiss } from '../../hooks/useModalDismiss';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const TEACHER_IDS = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
const TEACHER_LABELS = {
  'teacher1': 'Teacher 1',
  'teacher2': 'Teacher 2',
  'teacher3': 'Teacher 3',
  'teacher4': 'Teacher 4'
};

// Format money in Uzbek format: "400 000 so'm"
const formatMoney = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 so'm";
  return Number(amount).toLocaleString('uz-UZ').replace(/[\u00A0,]/g, ' ') + " so'm";
};

// Phone cleaning helper for Uzbekistan numbers
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/[^\d+]/g, '');
};

const formatDisplayPhone = (phone) => {
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

// Formats phone into dialable E.164 number (+998...)
const getDialablePhone = (phone) => {
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

// Parse fee value handling empty strings and invalid numbers
const parseFee = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const num = Number(val);
  return (!isNaN(num) && num >= 0) ? num : null;
};

// Unified month key getter for payment records (e.g. "2026-09")
const getPaymentMonthKey = (payment) => {
  if (!payment) return '';
  return payment.month || (payment.date ? String(payment.date).substring(0, 7) : '');
};

// Local date string in YYYY-MM-DD avoiding UTC off-by-one shifts
const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Safe time formatter for ISO date strings
const formatTimeSafe = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const AdminFinance = ({
  allTeachersData = {},
  onRecordPayment,
  onDeletePayment,
  onUpdateStudentPhone,
  showToast,
  onRefresh,
  isSyncing = false
}) => {
  // 1. Month & Year state (defaults to current date)
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const selectedMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const selectedMonthName = UZBEK_MONTHS[selectedMonth];

  // Default monthly fee (persisted in localStorage, fallback 400,000)
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState(() => {
    try {
      const saved = localStorage.getItem('rsa_default_monthly_fee');
      if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
        return Number(saved);
      }
    } catch {
      // ignore
    }
    return 400000;
  });

  // Main View Toggle: 'students' (Qarzdorlar & To'lovchilar) vs 'history' (Kassa Jurnali)
  const [viewMode, setViewMode] = useState('students');

  // Sub-filter for students: 'all' | 'debtors' | 'paid'
  const [statusFilter, setStatusFilter] = useState('debtors');

  // Additional Filters
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('debt_desc'); // 'debt_desc' | 'name_asc' | 'paid_desc'

  // Modals state
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, studentItem: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, payment: null });
  const [phoneModal, setPhoneModal] = useState({ isOpen: false, studentItem: null });
  const [feeConfigModal, setFeeConfigModal] = useState(false);
  const [customDefaultFeeInput, setCustomDefaultFeeInput] = useState(defaultMonthlyFee);

  // Modal Dismiss hooks
  useModalDismiss(checkoutModal.isOpen, () => setCheckoutModal({ isOpen: false, studentItem: null }));
  useModalDismiss(deleteConfirmModal.isOpen, () => setDeleteConfirmModal({ isOpen: false, payment: null }));
  useModalDismiss(phoneModal.isOpen, () => setPhoneModal({ isOpen: false, studentItem: null }));
  useModalDismiss(feeConfigModal, () => setFeeConfigModal(false));

  // Month navigation helpers
  const handlePrevMonth = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleResetCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === selectedYear && now.getMonth() === selectedMonth;
  }, [selectedYear, selectedMonth]);

  // Available Groups for secondary filter (depending on selected teacherFilter)
  const availableGroups = useMemo(() => {
    const list = [];
    const tIds = teacherFilter === 'all' ? TEACHER_IDS : [teacherFilter];
    tIds.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter((g) => !g.deleted);
      const teacherLabel = tData.teacherProfile?.fullName || TEACHER_LABELS[tId] || tId;
      groups.forEach((g) => {
        list.push({
          id: g.id,
          name: g.name,
          teacherId: tId,
          teacherLabel
        });
      });
    });
    return list;
  }, [allTeachersData, teacherFilter]);

  // Reset group filter if selected group is not in availableGroups
  useEffect(() => {
    if (groupFilter !== 'all' && !availableGroups.some((g) => String(g.id) === String(groupFilter))) {
      setGroupFilter('all');
    }
  }, [teacherFilter, availableGroups, groupFilter]);

  // Aggregate all students with finance calculations for selectedMonthKey
  const allStudentsWithFinance = useMemo(() => {
    const list = [];
    TEACHER_IDS.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter((g) => !g.deleted);
      const students = (tData.students || []).filter((s) => !s.deleted);
      const payments = tData.payments || [];
      const teacherLabel = tData.teacherProfile?.fullName || TEACHER_LABELS[tId] || tId;

      const groupsMap = new Map();
      groups.forEach((g) => groupsMap.set(String(g.id), g));

      students.forEach((s) => {
        const group = groupsMap.get(String(s.groupId));
        const groupName = group ? group.name : 'Guruhsiz';
        
        // Fee hierarchy: student.monthlyFee -> group.monthlyFee -> defaultMonthlyFee
        const sFee = parseFee(s.monthlyFee);
        const gFee = group ? parseFee(group.monthlyFee) : null;
        const monthlyFee = sFee !== null ? sFee : (gFee !== null ? gFee : defaultMonthlyFee);

        // Filter payments for this student and this month using unified month key
        const studentPayments = payments.filter((p) => {
          if (!p || p.deleted) return false;
          if (String(p.studentId) !== String(s.id)) return false;
          return getPaymentMonthKey(p) === selectedMonthKey;
        });

        const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const remainingDebt = Math.max(0, monthlyFee - totalPaid);
        const overpaid = Math.max(0, totalPaid - monthlyFee);

        let status = 'unpaid';
        if (monthlyFee === 0 || totalPaid >= monthlyFee) {
          status = 'paid';
        } else if (totalPaid > 0) {
          status = 'partial';
        } else {
          status = 'unpaid';
        }

        list.push({
          student: s,
          group,
          groupName,
          teacherId: tId,
          teacherLabel,
          monthlyFee,
          totalPaid,
          remainingDebt,
          overpaid,
          status,
          payments: studentPayments
        });
      });
    });

    return list;
  }, [allTeachersData, selectedMonthKey, defaultMonthlyFee]);

  // Aggregate all payments history across all teachers
  const allPaymentsHistory = useMemo(() => {
    const list = [];
    TEACHER_IDS.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const groups = tData.groups || [];
      const students = tData.students || [];
      const payments = tData.payments || [];
      const teacherLabel = tData.teacherProfile?.fullName || TEACHER_LABELS[tId] || tId;

      const studentsMap = new Map();
      students.forEach((s) => studentsMap.set(String(s.id), s));
      const groupsMap = new Map();
      groups.forEach((g) => groupsMap.set(String(g.id), g));

      payments.forEach((p) => {
        if (!p || p.deleted) return;
        const student = studentsMap.get(String(p.studentId));
        const group = groupsMap.get(String(p.groupId)) || (student ? groupsMap.get(String(student.groupId)) : null);
        list.push({
          ...p,
          teacherId: tId,
          teacherLabel,
          studentName: student?.name || p.studentName || "Noma'lum o'quvchi",
          studentEmoji: student?.emoji || p.studentEmoji,
          studentColor: student?.color || p.studentColor,
          groupName: group?.name || p.groupName || 'Guruhsiz',
          groupIcon: group?.icon || p.groupIcon
        });
      });
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    });
  }, [allTeachersData]);

  // Filter payments history for selected month (or toggle to all)
  const [historyScope, setHistoryScope] = useState('selected_month'); // 'selected_month' | 'all_time'
  const filteredPaymentsHistory = useMemo(() => {
    let list = allPaymentsHistory;
    if (historyScope === 'selected_month') {
      list = list.filter((p) => getPaymentMonthKey(p) === selectedMonthKey);
    }
    if (teacherFilter !== 'all') {
      list = list.filter((p) => p.teacherId === teacherFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => (p.studentName || '').toLowerCase().includes(q) || (p.note || '').toLowerCase().includes(q));
    }
    return list;
  }, [allPaymentsHistory, historyScope, selectedMonthKey, teacherFilter, searchQuery]);

  // Cashflow KPIs for the selected month
  const kpiStats = useMemo(() => {
    let expectedRevenue = 0;
    let totalRemainingDebt = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    allStudentsWithFinance.forEach((item) => {
      expectedRevenue += item.monthlyFee;
      totalRemainingDebt += item.remainingDebt;
      if (item.status === 'paid') paidCount++;
      else if (item.status === 'partial') partialCount++;
      else unpaidCount++;
    });

    // Payment method breakdown for the selected month
    let cashTotal = 0;
    let cashCount = 0;
    let cardTotal = 0;
    let cardCount = 0;

    TEACHER_IDS.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const payments = tData.payments || [];
      payments.forEach((p) => {
        if (!p || p.deleted) return;
        if (getPaymentMonthKey(p) === selectedMonthKey) {
          const amt = Number(p.amount) || 0;
          if (p.method === 'card') {
            cardTotal += amt;
            cardCount++;
          } else {
            cashTotal += amt;
            cashCount++;
          }
        }
      });
    });

    const collectedRevenue = cashTotal + cardTotal;
    const collectionRate = expectedRevenue > 0
      ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100))
      : 0;

    return {
      totalStudents: allStudentsWithFinance.length,
      expectedRevenue,
      collectedRevenue,
      totalRemainingDebt,
      collectionRate,
      paidCount,
      partialCount,
      unpaidCount,
      debtorsCount: partialCount + unpaidCount,
      cashTotal,
      cashCount,
      cardTotal,
      cardCount
    };
  }, [allStudentsWithFinance, allTeachersData, selectedMonthKey]);

  // Filtered & Sorted Students List
  const filteredStudents = useMemo(() => {
    let list = [...allStudentsWithFinance];

    // Status filter
    if (statusFilter === 'debtors') {
      list = list.filter((item) => item.status === 'partial' || item.status === 'unpaid');
    } else if (statusFilter === 'paid') {
      list = list.filter((item) => item.status === 'paid');
    }

    // Teacher filter
    if (teacherFilter !== 'all') {
      list = list.filter((item) => item.teacherId === teacherFilter);
    }

    // Group filter
    if (groupFilter !== 'all') {
      list = list.filter((item) => String(item.student.groupId) === String(groupFilter));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) =>
        (item.student.name || '').toLowerCase().includes(q) ||
        (item.groupName || '').toLowerCase().includes(q) ||
        (item.student.phone || '').includes(q) ||
        (item.student.parentPhone || '').includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'debt_desc') {
        if (b.remainingDebt !== a.remainingDebt) {
          return b.remainingDebt - a.remainingDebt;
        }
        return (a.student.name || '').localeCompare(b.student.name || '', 'uz');
      }
      if (sortBy === 'paid_desc') {
        if (b.totalPaid !== a.totalPaid) {
          return b.totalPaid - a.totalPaid;
        }
        return (a.student.name || '').localeCompare(b.student.name || '', 'uz');
      }
      if (sortBy === 'name_asc') {
        return (a.student.name || '').localeCompare(b.student.name || '', 'uz');
      }
      return 0;
    });

    return list;
  }, [allStudentsWithFinance, statusFilter, teacherFilter, groupFilter, searchQuery, sortBy]);

  // Save Default Monthly Fee Setting
  const handleSaveDefaultFee = (newFee) => {
    const feeNum = Number(newFee);
    if (isNaN(feeNum) || feeNum <= 0) {
      if (showToast) showToast("Noto'g'ri summa kiritildi!", 'warning');
      return;
    }
    setDefaultMonthlyFee(feeNum);
    try {
      localStorage.setItem('rsa_default_monthly_fee', String(feeNum));
    } catch {
      // ignore
    }
    setFeeConfigModal(false);
    if (showToast) showToast(`Oylik to'lov standarti ${formatMoney(feeNum)} ga yangilandi!`, 'success');
  };

  // 1-Click Telegram Reminder
  const handleSendTelegramReminder = (item) => {
    const student = item.student;
    const debtStr = Number(item.remainingDebt).toLocaleString('uz-UZ').replace(/[\u00A0,]/g, ' ');
    const reminderText = `Assalomu alaykum! ${student.name}ning ${selectedMonthName} oyi uchun ${debtStr} so'm to'lovi qolgan. Iltimos to'lovni amalga oshirishingizni so'raymiz.`;

    // 1. Copy to clipboard
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(reminderText)
        .then(() => {
          if (showToast) showToast("Eslatma matni xotiraga nusxalandi!", 'success');
        })
        .catch(() => {
          if (showToast) showToast("Xabarni nusxalashda xatolik", 'error');
        });
    }

    // 2. Open Telegram via intent
    const tgUrl = `https://t.me/share/url?text=${encodeURIComponent(reminderText)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  // CSV Export for the selected month
  const handleExportCSV = () => {
    const rows = [];
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return String(val);
      const str = String(val);
      if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // 1. Title & Metadata
    rows.push([escapeCSV("EPCHIL COM O'QUV MARKAZI - OYLIK MOLIYAVIY HISOBOT")]);
    rows.push([escapeCSV(`Davr: ${selectedMonthName} ${selectedYear}-yil`)]);
    rows.push([escapeCSV(`Chop etilgan vaqt: ${new Date().toLocaleString('uz-UZ')}`)]);
    rows.push([]);

    // 2. Summary KPIs
    rows.push([escapeCSV("KO'RSATKICH"), escapeCSV("QIYMAT")]);
    rows.push([escapeCSV("Jami faol o'quvchilar"), escapeCSV(`${kpiStats.totalStudents} ta`)]);
    rows.push([escapeCSV("Kutilayotgan umumiy tushum"), escapeCSV(`${kpiStats.expectedRevenue} so'm`)]);
    rows.push([escapeCSV("Yig'ilgan tushum (Jami)"), escapeCSV(`${kpiStats.collectedRevenue} so'm`)]);
    rows.push([escapeCSV("Yig'ilish darajasi"), escapeCSV(`${kpiStats.collectionRate}%`)]);
    rows.push([escapeCSV("Qolgan jami qarz"), escapeCSV(`${kpiStats.totalRemainingDebt} so'm`)]);
    rows.push([escapeCSV("Naqd pul tushumi"), escapeCSV(`${kpiStats.cashTotal} so'm (${kpiStats.cashCount} ta to'lov)`)]);
    rows.push([escapeCSV("Plastik karta (Click/Payme) tushumi"), escapeCSV(`${kpiStats.cardTotal} so'm (${kpiStats.cardCount} ta to'lov)`)]);
    rows.push([escapeCSV("To'liq to'laganlar"), escapeCSV(`${kpiStats.paidCount} ta`)]);
    rows.push([escapeCSV("Qisman to'laganlar"), escapeCSV(`${kpiStats.partialCount} ta`)]);
    rows.push([escapeCSV("Umuman to'lamaganlar (Qarzdorlar)"), escapeCSV(`${kpiStats.unpaidCount} ta`)]);
    rows.push([]);

    // 3. Students Table
    rows.push([escapeCSV("O'QUVCHILAR VA QARZDORLIK RO'YXATI")]);
    rows.push([
      escapeCSV("T/r"),
      escapeCSV("O'quvchi Ismi"),
      escapeCSV("Ustoz"),
      escapeCSV("Guruh"),
      escapeCSV("O'quvchi Telefoni"),
      escapeCSV("Ota-ona Telefoni"),
      escapeCSV("Oylik To'lov"),
      escapeCSV("To'langan Summa"),
      escapeCSV("Qolgan Qarz"),
      escapeCSV("Holati")
    ]);

    allStudentsWithFinance.forEach((item, idx) => {
      const statusText = item.status === 'paid' ? "To'langan" : item.status === 'partial' ? "Qisman to'langan" : "Qarzdor";
      rows.push([
        escapeCSV(idx + 1),
        escapeCSV(item.student.name),
        escapeCSV(item.teacherLabel),
        escapeCSV(item.groupName),
        escapeCSV(item.student.phone || ''),
        escapeCSV(item.student.parentPhone || ''),
        escapeCSV(item.monthlyFee),
        escapeCSV(item.totalPaid),
        escapeCSV(item.remainingDebt),
        escapeCSV(statusText)
      ]);
    });
    rows.push([]);

    // 4. Kassa Jurnali (To'lovlar Tarixi)
    rows.push([escapeCSV("KASSA JURNALI (QABUL QILINGAN TO'LOVLAR)")]);
    rows.push([
      escapeCSV("T/r"),
      escapeCSV("Sana"),
      escapeCSV("Vaqt"),
      escapeCSV("O'quvchi Ismi"),
      escapeCSV("Ustoz"),
      escapeCSV("Guruh"),
      escapeCSV("Summa"),
      escapeCSV("To'lov Usuli"),
      escapeCSV("Izoh")
    ]);

    const monthPayments = allPaymentsHistory.filter((p) => getPaymentMonthKey(p) === selectedMonthKey);
    if (monthPayments.length === 0) {
      rows.push([escapeCSV("—"), escapeCSV("Ushbu oyda hali to'lovlar qabul qilinmagan")]);
    } else {
      monthPayments.forEach((p, idx) => {
        const dateDisplay = p.date || (p.createdAt ? p.createdAt.split('T')[0] : '');
        const timeDisplay = formatTimeSafe(p.createdAt);
        const methodDisplay = p.method === 'card' ? 'Plastik karta' : 'Naqd pul';
        rows.push([
          escapeCSV(idx + 1),
          escapeCSV(dateDisplay),
          escapeCSV(timeDisplay),
          escapeCSV(p.studentName),
          escapeCSV(p.teacherLabel),
          escapeCSV(p.groupName),
          escapeCSV(Number(p.amount) || 0),
          escapeCSV(methodDisplay),
          escapeCSV(p.note || '')
        ]);
      });
    }

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Kassa_Hisobot_${selectedMonthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) showToast(`Kassa hisoboti (${selectedMonthName} ${selectedYear}) yuklab olindi!`, 'success');
  };

  return (
    <div className="admin-finance-container">
      {/* Page Header */}
      <div className="page-header admin-header-row">
        <div>
          <h2 className="page-title">Kassa va To'lovlar</h2>
        </div>

        <div className="admin-header-actions">
          {onRefresh && (
            <button
              type="button"
              className="btn btn-secondary scale-active admin-refresh-btn"
              onClick={onRefresh}
              disabled={isSyncing}
            >
              <span>{isSyncing ? "Yangilanmoqda..." : "Yangilash"}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary scale-active"
            onClick={handleExportCSV}
          >
            <span>CSV Eksport</span>
          </button>
        </div>
      </div>

      {/* Month & Year Navigation Selector + Fee Standard */}
      <div className="glass-card finance-month-bar">
        <div className="finance-month-selector">
          <button
            type="button"
            className="month-nav-btn scale-active"
            onClick={handlePrevMonth}
            aria-label="Oldingi oy"
          >
            ‹
          </button>

          <div className="month-display-box">
            <span className="month-name-text">{selectedMonthName}</span>
            <span className="month-year-text">{selectedYear}</span>
            {isCurrentMonth && <span className="current-month-badge">Joriy oy</span>}
          </div>

          <button
            type="button"
            className="month-nav-btn scale-active"
            onClick={handleNextMonth}
            aria-label="Keyingi oy"
          >
            ›
          </button>

          {!isCurrentMonth && (
            <button
              type="button"
              className="btn-today-reset scale-active"
              onClick={handleResetCurrentMonth}
            >
              Bugungi oyga qaytish
            </button>
          )}
        </div>

        <div className="finance-config-box">
          <span className="config-label">Standart to'lov:</span>
          <span className="config-value">{formatMoney(defaultMonthlyFee)}</span>
          <button
            type="button"
            className="config-edit-btn scale-active"
            onClick={() => {
              setCustomDefaultFeeInput(defaultMonthlyFee);
              setFeeConfigModal(true);
            }}
          >
            <span>O'zgartirish</span>
          </button>
        </div>
      </div>

      {/* Cashflow KPIs Dashboard */}
      <section className="finance-kpis-grid">
        {/* KPI 1: Kutilayotgan Tushum */}
        <div className="glass-card finance-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Kutilayotgan Tushum</span>
            <div className="kpi-val-row">
              <span className="kpi-value">{formatMoney(kpiStats.expectedRevenue)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Yig'ilgan Tushum */}
        <div className="glass-card finance-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Yig'ilgan Tushum</span>
            <div className="kpi-val-row">
              <span className="kpi-value text-green">{formatMoney(kpiStats.collectedRevenue)}</span>
              <span
                className="kpi-rate-badge"
                style={{
                  background: kpiStats.collectionRate >= 70 ? '#D1FAE5' : (kpiStats.collectionRate >= 40 ? '#FEF3C7' : '#FEE2E2'),
                  color: kpiStats.collectionRate >= 70 ? '#047857' : (kpiStats.collectionRate >= 40 ? '#B45309' : '#B91C1C'),
                }}
              >
                {kpiStats.collectionRate}%
              </span>
            </div>
            <div className="kpi-progress-bar-bg">
              <div
                className="kpi-progress-bar-fill"
                style={{
                  width: `${kpiStats.collectionRate}%`,
                  background: kpiStats.collectionRate >= 70 ? '#10B981' : (kpiStats.collectionRate >= 40 ? '#F59E0B' : '#EF4444')
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Qolgan Qarz */}
        <div className="glass-card finance-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Qolgan Qarz</span>
            <div className="kpi-val-row">
              <span className="kpi-value text-red">{formatMoney(kpiStats.totalRemainingDebt)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: To'lov Usullari Taqsimoti */}
        <div className="glass-card finance-kpi-card finance-method-breakdown-card">
          <span className="kpi-label">To'lov Usullari</span>
          <div className="method-breakdown-list">
            <div className="method-item">
              <div className="method-left">
                <span className="method-name">Naqd pul:</span>
              </div>
              <div className="method-right">
                <span className="method-amount">{formatMoney(kpiStats.cashTotal)}</span>
                <span className="method-count">({kpiStats.cashCount} ta)</span>
              </div>
            </div>

            <div className="method-item">
              <div className="method-left">
                <span className="method-name">Karta (Click/Payme):</span>
              </div>
              <div className="method-right">
                <span className="method-amount">{formatMoney(kpiStats.cardTotal)}</span>
                <span className="method-count">({kpiStats.cardCount} ta)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main View Switcher (Tabs) */}
      <div className="finance-view-tabs-bar">
        <button
          type="button"
          className={`finance-view-tab ${viewMode === 'students' ? 'active' : ''}`}
          onClick={() => setViewMode('students')}
        >
          <span>O'quvchilar va Qarzdorlik</span>
          <span className="tab-counter-badge">{kpiStats.totalStudents}</span>
        </button>

        <button
          type="button"
          className={`finance-view-tab ${viewMode === 'history' ? 'active' : ''}`}
          onClick={() => setViewMode('history')}
        >
          <span>Kassa Jurnali (Tarix)</span>
          <span className="tab-counter-badge">{allPaymentsHistory.length}</span>
        </button>
      </div>

      {/* SECTION 1: STUDENTS & DEBTORS VIEW */}
      {viewMode === 'students' && (
        <section className="finance-students-section">
          {/* Subtabs + Filters Bar */}
          <div className="glass-card finance-controls-card">
            {/* Subtabs: Barchasi | Qarzdorlar | To'laganlar */}
            <div className="finance-subtabs">
              <button
                type="button"
                className={`finance-subtab-btn ${statusFilter === 'debtors' ? 'active alert-active' : ''}`}
                onClick={() => setStatusFilter('debtors')}
              >
                Qarzdorlar ({kpiStats.debtorsCount})
              </button>

              <button
                type="button"
                className={`finance-subtab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Barchasi ({kpiStats.totalStudents})
              </button>

              <button
                type="button"
                className={`finance-subtab-btn ${statusFilter === 'paid' ? 'active success-active' : ''}`}
                onClick={() => setStatusFilter('paid')}
              >
                To'laganlar ({kpiStats.paidCount})
              </button>
            </div>

            {/* Filter Dropdowns & Search */}
            <div className="finance-filters-row">
              {/* Search */}
              <div className="finance-search-input-wrap">
                <input
                  type="text"
                  className="finance-search-input"
                  placeholder="O'quvchi ismi, guruh yoki telefon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="finance-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Teacher Filter */}
              <div className="finance-filter-select-wrap">
                <select
                  className="finance-filter-select"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                >
                  <option value="all">Barcha Ustozlar</option>
                  {TEACHER_IDS.map((tId) => (
                    <option key={tId} value={tId}>{TEACHER_LABELS[tId]}</option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              <div className="finance-filter-select-wrap">
                <select
                  className="finance-filter-select"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                >
                  <option value="all">Barcha Guruhlar</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.teacherLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="finance-filter-select-wrap">
                <select
                  className="finance-filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="debt_desc">Qarzi ko'plar bo'yicha</option>
                  <option value="paid_desc">Ko'p to'laganlar bo'yicha</option>
                  <option value="name_asc">Ism bo'yicha (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <div className="glass-card finance-empty-card">
              <h4 className="finance-empty-title">
                {statusFilter === 'debtors'
                  ? "Qarzdor o'quvchilar yo'q"
                  : "O'quvchilar topilmadi"}
              </h4>
            </div>
          ) : (
            <div className="finance-students-list">
              {filteredStudents.map((item) => {
                const s = item.student;
                const displayPhone = s.parentPhone || s.phone;
                const dialablePhone = getDialablePhone(displayPhone);

                return (
                  <div key={`${item.teacherId}-${s.id}`} className="glass-card finance-student-card">
                    {/* Left: Avatar & Info */}
                    <div className="student-card-left">
                      <div
                        className="avatar-circle student-finance-avatar"
                        style={{ background: s.color || '#E5E7EB' }}
                      >
                        {s.name ? s.name.charAt(0).toUpperCase() : 'O'}
                      </div>

                      <div className="student-finance-details">
                        <div className="student-name-row">
                          <span className="student-finance-name">{s.name}</span>
                          <span className="student-teacher-pill">{item.teacherLabel}</span>
                          <span className="student-group-pill">
                            <span>{item.groupName}</span>
                          </span>
                        </div>

                        {/* Phone Row */}
                        <div className="student-phone-row">
                          <span className="student-phone-text">
                            {formatDisplayPhone(displayPhone)}
                            {s.parentPhone && s.phone && s.parentPhone !== s.phone && (
                              <span className="phone-secondary"> (O'quvchi: {formatDisplayPhone(s.phone)})</span>
                            )}
                          </span>
                          <button
                            type="button"
                            className="phone-edit-icon-btn scale-active"
                            onClick={() => setPhoneModal({ isOpen: true, studentItem: item })}
                          >
                            Tahrirlash
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Financial Status & Amounts */}
                    <div className="student-card-middle">
                      <div className="finance-amount-block">
                        <span className="amount-label">Oylik to'lov:</span>
                        <span className="amount-val">{formatMoney(item.monthlyFee)}</span>
                      </div>

                      <div className="finance-amount-block">
                        <span className="amount-label">To'langan:</span>
                        <span className="amount-val text-green">{formatMoney(item.totalPaid)}</span>
                      </div>

                      <div className="finance-amount-block">
                        <span className="amount-label">Qarz:</span>
                        <span className={`amount-val ${item.remainingDebt > 0 ? 'text-red' : 'text-green'}`}>
                          {item.remainingDebt > 0 ? formatMoney(item.remainingDebt) : "0 so'm (Qarzsiz)"}
                        </span>
                      </div>

                      <div className="finance-status-badge-wrap">
                        {item.status === 'paid' && (
                          <span className="student-badge badge-paid">To'langan</span>
                        )}
                        {item.status === 'partial' && (
                          <span className="student-badge badge-partial">Qisman to'langan</span>
                        )}
                        {item.status === 'unpaid' && (
                          <span className="student-badge badge-unpaid">To'lanmagan</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="student-card-actions">
                      {/* Fast Payment Modal Button */}
                      <button
                        type="button"
                        className="btn btn-primary btn-sm scale-active finance-pay-btn"
                        onClick={() => setCheckoutModal({ isOpen: true, studentItem: item })}
                      >
                        <span>To'lov qabul qilish</span>
                      </button>

                      {/* 1-Click Call Button */}
                      {dialablePhone ? (
                        <a
                          href={`tel:${dialablePhone}`}
                          className="btn btn-secondary btn-sm scale-active finance-call-btn"
                        >
                          <span>Qo'ng'iroq</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm scale-active finance-call-btn disabled"
                          onClick={() => setPhoneModal({ isOpen: true, studentItem: item })}
                        >
                          <span>Tel yo'q</span>
                        </button>
                      )}

                      {/* 1-Click Telegram Reminder Button */}
                      {item.remainingDebt > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm scale-active finance-tg-btn"
                          onClick={() => handleSendTelegramReminder(item)}
                        >
                          <span>Eslatma</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: PAYMENTS HISTORY (KASSA JURNALI) */}
      {viewMode === 'history' && (
        <section className="finance-history-section">
          {/* History Controls Bar */}
          <div className="glass-card finance-controls-card">
            <div className="history-scope-selector">
              <button
                type="button"
                className={`finance-subtab-btn ${historyScope === 'selected_month' ? 'active' : ''}`}
                onClick={() => setHistoryScope('selected_month')}
              >
                {selectedMonthName} {selectedYear} ({kpiStats.cashCount + kpiStats.cardCount} ta to'lov)
              </button>

              <button
                type="button"
                className={`finance-subtab-btn ${historyScope === 'all_time' ? 'active' : ''}`}
                onClick={() => setHistoryScope('all_time')}
              >
                Barcha vaqtlar ({allPaymentsHistory.length} ta)
              </button>
            </div>

            <div className="finance-filters-row">
              <div className="finance-search-input-wrap">
                <input
                  type="text"
                  className="finance-search-input"
                  placeholder="O'quvchi ismi yoki izoh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="finance-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="finance-filter-select-wrap">
                <select
                  className="finance-filter-select"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                >
                  <option value="all">Barcha Ustozlar</option>
                  {TEACHER_IDS.map((tId) => (
                    <option key={tId} value={tId}>{TEACHER_LABELS[tId]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredPaymentsHistory.length === 0 ? (
            <div className="glass-card finance-empty-card">
              <h4 className="finance-empty-title">To'lovlar topilmadi</h4>
            </div>
          ) : (
            <div className="finance-history-list">
              {filteredPaymentsHistory.map((p) => {
                const dateDisplay = p.date || (p.createdAt ? p.createdAt.split('T')[0] : '—');
                const timeDisplay = formatTimeSafe(p.createdAt);

                return (
                  <div key={p.id} className="glass-card finance-history-item">
                    <div className="history-item-left">
                      <div
                        className="avatar-circle history-avatar"
                        style={{ background: p.studentColor || '#E5E7EB' }}
                      >
                        {p.studentName ? p.studentName.charAt(0).toUpperCase() : 'O'}
                      </div>

                      <div className="history-item-info">
                        <div className="history-student-title">
                          <span className="history-student-name">{p.studentName}</span>
                          <span className="history-teacher-badge">{p.teacherLabel}</span>
                          <span className="history-group-badge">{p.groupName}</span>
                        </div>

                        <div className="history-meta-row">
                          <span className="history-date">{dateDisplay} {timeDisplay && `• ${timeDisplay}`}</span>
                          <span className="history-month-tag">Oy: {p.month || selectedMonthKey}</span>
                          {p.note && <span className="history-note">"{p.note}"</span>}
                        </div>
                      </div>
                    </div>

                    <div className="history-item-right">
                      <div className="history-amount-box">
                        <span className="history-amount-val">+{formatMoney(p.amount)}</span>
                        <span className={`history-method-badge ${p.method === 'card' ? 'card' : 'cash'}`}>
                          {p.method === 'card' ? 'Plastik karta' : 'Naqd pul'}
                        </span>
                      </div>

                      {/* Revert / Delete Payment Button */}
                      <button
                        type="button"
                        className="history-delete-btn scale-active"
                        onClick={() => setDeleteConfirmModal({ isOpen: true, payment: p })}
                        aria-label="O'chirish"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MODAL 1: CHECKOUT / TO'LOV QABUL QILISH */}
      {checkoutModal.isOpen && checkoutModal.studentItem && (
        <CheckoutModal
          studentItem={checkoutModal.studentItem}
          selectedMonthKey={selectedMonthKey}
          selectedMonthName={selectedMonthName}
          onClose={() => setCheckoutModal({ isOpen: false, studentItem: null })}
          onSubmit={async (paymentPayload) => {
            if (onRecordPayment) {
              const res = await onRecordPayment(checkoutModal.studentItem.teacherId, paymentPayload);
              if (res) {
                setCheckoutModal({ isOpen: false, studentItem: null });
              }
            }
          }}
          showToast={showToast}
        />
      )}

      {/* MODAL 2: DELETE PAYMENT CONFIRMATION */}
      {deleteConfirmModal.isOpen && deleteConfirmModal.payment && (
        <DeleteConfirmModal
          payment={deleteConfirmModal.payment}
          onClose={() => setDeleteConfirmModal({ isOpen: false, payment: null })}
          onConfirm={async () => {
            if (onDeletePayment) {
              const p = deleteConfirmModal.payment;
              await onDeletePayment(p.teacherId, p.id);
              setDeleteConfirmModal({ isOpen: false, payment: null });
            }
          }}
        />
      )}

      {/* MODAL 3: PHONE EDIT MODAL */}
      {phoneModal.isOpen && phoneModal.studentItem && (
        <PhoneEditModal
          studentItem={phoneModal.studentItem}
          onClose={() => setPhoneModal({ isOpen: false, studentItem: null })}
          onSave={async (phone, parentPhone) => {
            if (onUpdateStudentPhone) {
              await onUpdateStudentPhone(phoneModal.studentItem.teacherId, phoneModal.studentItem.student.id, phone, parentPhone);
              setPhoneModal({ isOpen: false, studentItem: null });
            }
          }}
        />
      )}

      {/* MODAL 4: DEFAULT FEE CONFIG MODAL */}
      {feeConfigModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay modal-backdrop" onClick={() => setFeeConfigModal(false)}>
          <div
            className="modal-content modal-card fee-config-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header modal-header-fixed">
              <h3 className="modal-title">Standart Oylik To'lovni Sozlash</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setFeeConfigModal(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="modal-body modal-body-scrollable">
              <div className="form-group">
                <label className="form-label">Standart to'lov summasi (so'm):</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="10000"
                  value={customDefaultFeeInput}
                  onChange={(e) => setCustomDefaultFeeInput(e.target.value)}
                />
              </div>

              {/* Quick Fee Presets */}
              <div className="fee-presets-row">
                {[300000, 350000, 400000, 450000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`fee-preset-pill ${Number(customDefaultFeeInput) === amt ? 'active' : ''}`}
                    onClick={() => setCustomDefaultFeeInput(amt)}
                  >
                    {formatMoney(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer modal-actions-fixed">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setFeeConfigModal(false)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-primary scale-active"
                onClick={() => handleSaveDefaultFee(customDefaultFeeInput)}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Component Styles */}
      <style>{`
        .admin-finance-container {
          padding: 24px;
          max-width: 1300px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .admin-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .admin-title-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-pill-badge {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .admin-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Month Bar */
        .finance-month-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .finance-month-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .month-nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 1.3rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .month-nav-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .month-display-box {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .month-name-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .month-year-text {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .current-month-badge {
          background: #DBEAFE;
          color: #1D4ED8;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 4px;
        }

        .btn-today-reset {
          background: none;
          border: none;
          color: var(--accent, #007AFF);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          padding: 0 4px;
        }

        .finance-config-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.03);
          padding: 6px 12px;
          border-radius: var(--radius-md);
        }

        .config-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .config-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .config-edit-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--accent, #007AFF);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .config-edit-btn:hover {
          background: rgba(0, 122, 255, 0.08);
        }

        /* KPIs Grid */
        .finance-kpis-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .finance-kpis-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .finance-kpis-grid {
            grid-template-columns: 1fr;
          }
        }

        .finance-kpi-card {
          padding: 18px;
          border-radius: var(--radius-lg);
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .kpi-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-blue { background: rgba(0, 122, 255, 0.12); color: #007AFF; }
        .kpi-green { background: rgba(16, 185, 129, 0.12); color: #10B981; }
        .kpi-red { background: rgba(239, 68, 68, 0.12); color: #EF4444; }

        .kpi-alert-symbol {
          font-size: 1.25rem;
        }

        .kpi-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .kpi-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .text-green { color: #059669; }
        .text-red { color: #DC2626; }
        .text-red-sub { color: #DC2626; font-weight: 600; }

        .kpi-rate-badge {
          background: #D1FAE5;
          color: #047857;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 8px;
        }

        .kpi-progress-bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 6px;
        }

        .kpi-progress-bar-fill {
          height: 100%;
          background: #10B981;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .kpi-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        /* Breakdown Card */
        .finance-method-breakdown-card {
          flex-direction: column;
          justify-content: space-between;
        }

        .method-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;
        }

        .method-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
        }

        .method-left {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }

        .method-badge-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .method-badge-icon.cash { background: #E0F2FE; color: #0284C7; }
        .method-badge-icon.card { background: #EDE9FE; color: #7C3AED; }

        .method-right {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .method-amount {
          font-weight: 700;
          color: var(--text-primary);
        }

        .method-count {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        /* View Switcher Tabs */
        .finance-view-tabs-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          padding-bottom: 8px;
        }

        .finance-view-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          border: none;
          background: none;
          color: var(--text-secondary);
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .finance-view-tab:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.04);
        }

        .finance-view-tab.active {
          background: var(--accent, #007AFF);
          color: #FFFFFF;
        }

        .tab-counter-badge {
          background: rgba(0, 0, 0, 0.08);
          font-size: 0.75rem;
          padding: 2px 7px;
          border-radius: 12px;
          font-weight: 700;
        }

        .finance-view-tab.active .tab-counter-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        /* Controls Card (Subtabs + Filters) */
        .finance-controls-card {
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .finance-subtabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .finance-subtab-btn {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .finance-subtab-btn:hover {
          color: var(--text-primary);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .finance-subtab-btn.active {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .finance-subtab-btn.alert-active.active {
          background: #DC2626;
          color: #FFFFFF;
          border-color: #DC2626;
        }

        .finance-subtab-btn.success-active.active {
          background: #059669;
          color: #FFFFFF;
          border-color: #059669;
        }

        .finance-filters-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .finance-search-input-wrap {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-primary);
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 7px 12px;
          border-radius: var(--radius-md);
        }

        .finance-search-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .finance-search-clear {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.8rem;
        }

        .finance-filter-select-wrap select {
          padding: 7px 12px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        /* Empty State */
        .finance-empty-card {
          text-align: center;
          padding: 50px 20px;
          border-radius: var(--radius-lg);
        }

        .finance-empty-icon {
          font-size: 2.8rem;
          margin-bottom: 12px;
        }

        .finance-empty-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }

        .finance-empty-sub {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Students Cards List */
        .finance-students-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .finance-student-card {
          padding: 14px 20px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 900px) {
          .finance-student-card {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .student-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 250px;
        }

        .student-finance-avatar {
          width: 44px;
          height: 44px;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .student-finance-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .student-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .student-finance-name {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .student-teacher-pill {
          background: #EEF2FF;
          color: #4F46E5;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .student-group-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .student-phone-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .phone-icon-tag {
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
        }

        .phone-secondary {
          color: var(--text-tertiary);
          font-size: 0.75rem;
        }

        .phone-edit-icon-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .phone-edit-icon-btn:hover {
          color: var(--accent, #007AFF);
          background: rgba(0, 122, 255, 0.08);
        }

        /* Middle Amount Stats */
        .student-card-middle {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .finance-amount-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .amount-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .amount-val {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .finance-status-badge-wrap {
          min-width: 110px;
        }

        .student-badge {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: var(--radius-full);
          display: inline-block;
        }

        .badge-paid { background: rgba(52, 199, 89, 0.14); color: #34C759; border: 1px solid rgba(52, 199, 89, 0.25); }
        .badge-partial { background: rgba(255, 149, 0, 0.14); color: #FF9500; border: 1px solid rgba(255, 149, 0, 0.25); }
        .badge-unpaid { background: rgba(255, 59, 48, 0.14); color: #FF3B30; border: 1px solid rgba(255, 59, 48, 0.25); }

        /* Action Buttons */
        .student-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .finance-pay-btn {
          font-weight: 600;
          padding: 6px 12px;
        }

        .finance-call-btn, .finance-tg-btn {
          padding: 6px 10px;
          font-weight: 600;
          text-decoration: none;
        }

        .finance-tg-btn {
          color: #0284C7;
          border-color: rgba(2, 132, 199, 0.3);
        }

        .finance-tg-btn:hover {
          background: rgba(2, 132, 199, 0.08);
        }

        /* History View */
        .finance-history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .finance-history-item {
          padding: 14px 20px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .history-item-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .history-avatar {
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .history-item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .history-student-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .history-student-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .history-teacher-badge {
          background: #EEF2FF;
          color: #4F46E5;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .history-group-badge {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .history-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.78rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }

        .history-month-tag {
          background: rgba(0, 0, 0, 0.04);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .history-note {
          color: var(--text-primary);
          font-style: italic;
        }

        .history-item-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .history-amount-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .history-amount-val {
          font-size: 1.1rem;
          font-weight: 800;
          color: #059669;
        }

        .history-method-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .history-method-badge.cash { background: #E0F2FE; color: #0284C7; }
        .history-method-badge.card { background: #EDE9FE; color: #7C3AED; }

        .history-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.06);
          color: #DC2626;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .history-delete-btn:hover {
          background: #DC2626;
          color: #FFFFFF;
        }

        /* Fee Config Presets */
        .fee-config-modal {
          max-width: 440px;
          width: 90%;
        }

        .fee-presets-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .fee-preset-pill {
          padding: 5px 10px;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .fee-preset-pill.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        /* Dark Mode Overrides */
        [data-theme="dark"] .finance-month-bar,
        [data-theme="dark"] .finance-kpi-card,
        [data-theme="dark"] .finance-controls-card,
        [data-theme="dark"] .finance-student-card,
        [data-theme="dark"] .finance-history-item,
        [data-theme="dark"] .finance-empty-card {
          background: #292A2D;
          border-color: #363739;
        }

        [data-theme="dark"] .month-nav-btn,
        [data-theme="dark"] .finance-config-box,
        [data-theme="dark"] .finance-search-input-wrap,
        [data-theme="dark"] .finance-filter-select-wrap select,
        [data-theme="dark"] .student-group-pill,
        [data-theme="dark"] .history-group-badge,
        [data-theme="dark"] .fee-preset-pill {
          background: #202124;
          border-color: #363739;
          color: #E8EAED;
        }

        [data-theme="dark"] .finance-subtab-btn {
          background: #202124;
          border-color: #363739;
          color: #9AA0A6;
        }

        [data-theme="dark"] .finance-subtab-btn.active {
          background: #E8EAED;
          color: #202124;
        }

        [data-theme="dark"] .kpi-progress-bar-bg {
          background: #363739;
        }

        [data-theme="dark"] .tab-counter-badge {
          background: #363739;
          color: #E8EAED;
        }

        [data-theme="dark"] .badge-paid { background: rgba(52, 199, 89, 0.18); color: #81C995; border-color: rgba(52, 199, 89, 0.35); }
        [data-theme="dark"] .badge-partial { background: rgba(255, 149, 0, 0.18); color: #FDD663; border-color: rgba(255, 149, 0, 0.35); }
        [data-theme="dark"] .badge-unpaid { background: rgba(255, 59, 48, 0.18); color: #F28B82; border-color: rgba(255, 59, 48, 0.35); }
      `}</style>
    </div>
  );
};

// ==========================================
// SUBCOMPONENT: CHECKOUT / TO'LOV QABUL QILISH MODAL
// ==========================================
const CheckoutModal = ({
  studentItem,
  selectedMonthKey,
  selectedMonthName,
  onClose,
  onSubmit,
  showToast
}) => {
  const student = studentItem.student;
  const initialAmount = studentItem.remainingDebt > 0 ? studentItem.remainingDebt : studentItem.monthlyFee;

  const [amountStr, setAmountStr] = useState(String(initialAmount || 400000));
  const [method, setMethod] = useState('cash'); // 'cash' | 'card'
  const [month, setMonth] = useState(selectedMonthKey);
  const [paymentDate, setPaymentDate] = useState(() => getLocalDateStr());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format amount with space separators for live display
  const rawNumber = Number(String(amountStr).replace(/\D/g, '')) || 0;

  const handleAmountChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '');
    setAmountStr(clean);
  };

  const handleQuickAmount = (val) => {
    setAmountStr(String(val));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (rawNumber <= 0) {
      if (showToast) showToast("To'lov summasi 0 dan katta bo'lishi kerak!", 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      studentId: student.id,
      studentName: student.name,
      studentEmoji: student.emoji || '',
      studentColor: student.color || '',
      groupId: student.groupId || '',
      groupName: studentItem.groupName || '',
      amount: rawNumber,
      method,
      month,
      date: paymentDate,
      note: note.trim()
    };

    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-card checkout-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header modal-header-fixed">
          <div className="checkout-modal-title-box">
            <h3 className="modal-title">To'lov Qabul Qilish</h3>
            <span className="checkout-student-sub">
              {student.name} • {studentItem.groupName} ({studentItem.teacherLabel})
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="modal-body modal-body-scrollable checkout-modal-body">
            {/* Student Debt Summary Banner */}
            <div className="checkout-debt-banner">
              <div className="banner-left">
                <span className="banner-label">{selectedMonthName} oyi uchun qarz:</span>
                <span className={`banner-debt-val ${studentItem.remainingDebt > 0 ? 'text-red' : 'text-green'}`}>
                  {studentItem.remainingDebt > 0 ? formatMoney(studentItem.remainingDebt) : "Qarz yo'q (To'liq to'langan)"}
                </span>
              </div>
              <div className="banner-right">
                <span className="banner-sub">Oylik to'lov: {formatMoney(studentItem.monthlyFee)}</span>
                <span className="banner-sub">Oldin to'langan: {formatMoney(studentItem.totalPaid)}</span>
              </div>
            </div>

            {/* Payment Month */}
            <div className="form-group">
              <label className="form-label">Qaysi oy uchun to'lov:</label>
              <input
                type="month"
                className="form-input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>

            {/* Payment Amount */}
            <div className="form-group">
              <label className="form-label">To'lov summasi (so'm):</label>
              <div className="amount-input-box">
                <input
                  type="text"
                  className="form-input amount-large-input"
                  value={rawNumber > 0 ? rawNumber.toLocaleString('uz-UZ').replace(/[\u00A0,]/g, ' ') : ''}
                  onChange={handleAmountChange}
                  placeholder="0"
                  autoFocus
                  required
                />
                <span className="amount-currency-label">so'm</span>
              </div>

              {/* Quick Amount Pills */}
              <div className="quick-amount-pills">
                {studentItem.remainingDebt > 0 && (
                  <button
                    type="button"
                    className="quick-pill pill-debt"
                    onClick={() => handleQuickAmount(studentItem.remainingDebt)}
                  >
                    To'liq qarz ({formatMoney(studentItem.remainingDebt)})
                  </button>
                )}
                <button type="button" className="quick-pill" onClick={() => handleQuickAmount(100000)}>
                  100 000
                </button>
                <button type="button" className="quick-pill" onClick={() => handleQuickAmount(200000)}>
                  200 000
                </button>
                {studentItem.remainingDebt !== studentItem.monthlyFee && (
                  <button type="button" className="quick-pill" onClick={() => handleQuickAmount(studentItem.monthlyFee)}>
                    {formatMoney(studentItem.monthlyFee)}
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="form-group">
              <label className="form-label">To'lov usuli:</label>
              <div className="method-toggle-group">
                <button
                  type="button"
                  className={`method-toggle-btn ${method === 'cash' ? 'active cash' : ''}`}
                  onClick={() => setMethod('cash')}
                >
                  <span>Naqd pul</span>
                </button>

                <button
                  type="button"
                  className={`method-toggle-btn ${method === 'card' ? 'active card' : ''}`}
                  onClick={() => setMethod('card')}
                >
                  <span>Plastik karta (Click / Payme)</span>
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div className="form-group">
              <label className="form-label">To'lov sanasi:</label>
              <input
                type="date"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            {/* Note / Comment */}
            <div className="form-group">
              <label className="form-label">Izoh (ixtiyoriy):</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masalan: Otasidan qabul qilindi, chek №123..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer modal-actions-fixed">
            <button
              type="button"
              className="btn btn-secondary scale-active"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn btn-primary scale-active checkout-submit-btn"
              disabled={isSubmitting || rawNumber <= 0}
            >
              {isSubmitting ? "Saqlanmoqda..." : "Tasdiqlash va Saqlash"}
            </button>
          </div>
        </form>

        <style>{`
          .checkout-modal-card {
            max-width: 500px;
            width: 92%;
          }

          .checkout-modal-title-box {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .checkout-student-sub {
            font-size: 0.8rem;
            color: var(--text-secondary);
            font-weight: 500;
          }

          .checkout-modal-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 18px 24px;
          }

          .checkout-debt-banner {
            background: rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: var(--radius-md);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .banner-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .banner-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          .banner-debt-val {
            font-size: 1.15rem;
            font-weight: 800;
          }

          .banner-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
          }

          .banner-sub {
            font-size: 0.76rem;
            color: var(--text-secondary);
          }

          .amount-input-box {
            position: relative;
            display: flex;
            align-items: center;
          }

          .amount-large-input {
            font-size: 1.3rem;
            font-weight: 800;
            padding-right: 55px;
            color: var(--text-primary);
          }

          .amount-currency-label {
            position: absolute;
            right: 14px;
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--text-secondary);
          }

          .quick-amount-pills {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 8px;
          }

          .quick-pill {
            padding: 4px 10px;
            border-radius: var(--radius-full);
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: var(--bg-primary);
            color: var(--text-secondary);
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .quick-pill:hover {
            color: var(--text-primary);
            border-color: rgba(0, 0, 0, 0.25);
          }

          .quick-pill.pill-debt {
            background: #FEF2F2;
            color: #DC2626;
            border-color: rgba(220, 38, 38, 0.3);
          }

          .method-toggle-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .method-toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px;
            border-radius: var(--radius-md);
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: var(--bg-primary);
            color: var(--text-secondary);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .method-toggle-btn.active.cash {
            background: #E0F2FE;
            color: #0369A1;
            border-color: #0284C7;
          }

          .method-toggle-btn.active.card {
            background: #EDE9FE;
            color: #6D28D9;
            border-color: #7C3AED;
          }

          .checkout-submit-btn {
            padding: 8px 18px;
            font-weight: 700;
          }

          [data-theme="dark"] .checkout-debt-banner {
            background: #202124;
            border-color: #3C4043;
          }

          [data-theme="dark"] .quick-pill,
          [data-theme="dark"] .method-toggle-btn {
            background: #202124;
            border-color: #3C4043;
            color: #E8EAED;
          }
        `}</style>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

// ==========================================
// SUBCOMPONENT: DELETE PAYMENT CONFIRMATION MODAL
// ==========================================
const DeleteConfirmModal = ({ payment, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-card modal-confirm delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header modal-header-fixed">
          <h3 className="modal-title text-red">To'lovni Bekor Qilish</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>

        <div className="modal-body modal-body-scrollable">
          <p className="modal-description">
            Ushbu to'lovni o'chirishni tasdiqlaysizmi? O'quvchining qarz balansi qayta hisoblanadi.
          </p>

          <div className="delete-payment-info-box">
            <div className="del-info-row">
              <span className="del-label">O'quvchi:</span>
              <span className="del-val">{payment.studentName}</span>
            </div>
            <div className="del-info-row">
              <span className="del-label">Summa:</span>
              <span className="del-val text-green">+{formatMoney(payment.amount)}</span>
            </div>
            <div className="del-info-row">
              <span className="del-label">Sana:</span>
              <span className="del-val">{payment.date} (Oy: {payment.month})</span>
            </div>
            <div className="del-info-row">
              <span className="del-label">Usuli:</span>
              <span className="del-val">{payment.method === 'card' ? 'Plastik karta' : 'Naqd pul'}</span>
            </div>
            {payment.note && (
              <div className="del-info-row">
                <span className="del-label">Izoh:</span>
                <span className="del-val">"{payment.note}"</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary scale-active"
            onClick={onClose}
            disabled={isDeleting}
          >
            Bekor qilish
          </button>
          <button
            type="button"
            className="btn btn-danger scale-active"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
          </button>
        </div>

        <style>{`
          .delete-confirm-modal {
            max-width: 440px;
            width: 90%;
          }

          .delete-payment-info-box {
            background: rgba(0, 0, 0, 0.04);
            border-radius: var(--radius-md);
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 12px;
          }

          .del-info-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
          }

          .del-label {
            color: var(--text-secondary);
          }

          .del-val {
            font-weight: 700;
            color: var(--text-primary);
          }

          [data-theme="dark"] .delete-payment-info-box {
            background: #202124;
          }
        `}</style>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

// ==========================================
// SUBCOMPONENT: PHONE EDIT MODAL
// ==========================================
const PhoneEditModal = ({ studentItem, onClose, onSave }) => {
  const student = studentItem.student;
  const [phone, setPhone] = useState(student.phone || '');
  const [parentPhone, setParentPhone] = useState(student.parentPhone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(phone, parentPhone);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-card phone-edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header modal-header-fixed">
          <h3 className="modal-title">Telefon Raqamlarini Kiritish</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body modal-body-scrollable">
            <p className="modal-description">
              <strong>{student.name}</strong> ({studentItem.groupName}) uchun telefon raqamlarini yangilang:
            </p>

            <div className="form-group">
              <label className="form-label">Ota-ona telefon raqami (Asosiy):</label>
              <input
                type="text"
                className="form-input"
                placeholder="+998 90 123 45 67"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">O'quvchining shaxsiy telefoni:</label>
              <input
                type="text"
                className="form-input"
                placeholder="+998 91 987 65 43"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer modal-actions-fixed">
            <button
              type="button"
              className="btn btn-secondary scale-active"
              onClick={onClose}
              disabled={isSaving}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn btn-primary scale-active"
              disabled={isSaving}
            >
              {isSaving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>

        <style>{`
          .phone-edit-modal {
            max-width: 440px;
            width: 90%;
          }
        `}</style>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default AdminFinance;
