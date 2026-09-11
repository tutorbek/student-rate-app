import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar } from '../utils/studentAvatars';
import { sanitizeAttendanceDate } from '../utils/db';
import {
  isStudentInGroupAtDate,
  calculateAttendanceRate,
  calculateSessionAttendance,
  calculateStudentAttendanceStats,
  calculateWeightedAttendanceMetrics,
  calculateFairAttendanceScore
} from '../utils/attendanceUtils';
import { exportAttendanceToCSV, printAttendanceJournal } from '../utils/exportAttendance';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const getShortWeekday = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dayIdx = d.getDay();
  return WEEKDAYS[dayIdx === 0 ? 6 : dayIdx - 1] || '';
};

const getDayNum = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parseInt(parts[2], 10) || parts[2];
};

const IconCheck = ({ size = 14, strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconCalendar = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconChevronLeft = ({ size = 14, strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = ({ size = 14, strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconChevronDown = ({ size = 12, strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconTrash = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconEdit = ({ size = 14, strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MinimalCheck = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MinimalCross = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MinimalClock = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MinimalSortIcon = ({ active, direction }) => (
  <span className={`sort-icon-svg ${active ? 'active' : ''}`}>
    {active ? (
      direction === 'asc' ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )
    ) : (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    )}
  </span>
);


const StudentAttendanceRow = React.memo(({ student, status, wasAbsentLastLesson, isFutureJoin, isFutureDate, onMarkStatus }) => {
  return (
    <div className={`student-attendance-row ${isFutureDate ? 'row-future-disabled' : ''}`}>
      <div className="student-info-left">
        <div className="avatar-circle student-avatar-circle" style={{ background: student.color }}>
          {renderAvatar(student.emoji)}
        </div>
        <div className="student-name-group">
          <span className="student-name">{student.name}</span>
          {wasAbsentLastLesson && (
            <span className="prev-absent-tag">
              O'tgan darsda kelmagan
            </span>
          )}
          {isFutureJoin && (
            <span className="prev-absent-tag future-join-tag" title="Talaba ushbu sanadan keyin guruhga qo'shilgan">
              Keyin qo'shilgan
            </span>
          )}
        </div>
      </div>
      <div className="attendance-options-group">
        <button
          type="button"
          disabled={isFutureDate}
          className={`att-status-btn present ${status === 'present' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'present')}
          title={isFutureDate ? "Bo'lajak sana uchun davomat belgilab bo'lmaydi" : status === 'present' ? "Bekor qilish (neytral holat)" : "Keldi deb belgilash"}
        >
          Keldi
        </button>
        <button
          type="button"
          disabled={isFutureDate}
          className={`att-status-btn excused ${status === 'excused' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'excused')}
          title={isFutureDate ? "Bo'lajak sana uchun davomat belgilab bo'lmaydi" : status === 'excused' ? "Bekor qilish (neytral holat)" : "Sababli deb belgilash"}
        >
          Sababli
        </button>
        <button
          type="button"
          disabled={isFutureDate}
          className={`att-status-btn absent ${status === 'absent' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'absent')}
          title={isFutureDate ? "Bo'lajak sana uchun davomat belgilab bo'lmaydi" : status === 'absent' ? "Bekor qilish (neytral holat)" : "Kelmadi deb belgilash"}
        >
          Kelmadi
        </button>
        <button
          type="button"
          disabled={isFutureDate}
          className={`att-status-btn late ${status === 'late' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'late')}
          title={isFutureDate ? "Bo'lajak sana uchun davomat belgilab bo'lmaydi" : status === 'late' ? "Bekor qilish (neytral holat)" : "Kechikdi deb belgilash"}
        >
          Kechikdi
        </button>
      </div>
    </div>
  );
});

const Attendance = ({ groups = [], students = [], attendance = [], onSaveAttendance, onDeleteAttendance, showToast }) => {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'journal' | 'stats'
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    return groups.length > 0 ? groups[0].id : '';
  });
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isJournalGroupDropdownOpen, setIsJournalGroupDropdownOpen] = useState(false);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState(null); // date string
  const [selectedDayDetail, setSelectedDayDetail] = useState(null); // date object with records
  const [selectedStudentHistoryModal, setSelectedStudentHistoryModal] = useState(null); // student object

  const [journalYear, setJournalYear] = useState(() => new Date().getFullYear());
  const [journalMonth, setJournalMonth] = useState(() => new Date().getMonth());
  const [isUnifiedMonthPickerOpen, setIsUnifiedMonthPickerOpen] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState(() => new Date().getFullYear());
  const [journalViewMode, setJournalViewMode] = useState('matrix'); // 'matrix' | 'calendar'
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixSortField, setMatrixSortField] = useState('rating'); // 'rating', 'name', 'present', 'excused', 'absent', 'late', 'total'
  const [matrixSortDirection, setMatrixSortDirection] = useState('desc'); // 'asc' or 'desc'

  const handleMatrixSort = (field) => {
    if (matrixSortField === field) {
      setMatrixSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setMatrixSortField(field);
      setMatrixSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  useEffect(() => {
    if (groups.length > 0 && (!selectedGroupId || !groups.find((g) => g.id === selectedGroupId))) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsGroupDropdownOpen(false);
        setIsDatePickerOpen(false);
        setIsUnifiedMonthPickerOpen(false);
        setConfirmDeleteDate(null);
        setSelectedDayDetail(null);
        setSelectedStudentHistoryModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const getTodayDateString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [timeframe, setTimeframe] = useState('month'); 

  const isFutureDate = useMemo(() => {
    return selectedDate > getTodayDateString();
  }, [selectedDate]);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState(() => new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date().getMonth());

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanDate = sanitizeAttendanceDate(dateStr);
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return cleanDate;
    const y = parts[0];
    const mIndex = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d}-${UZBEK_MONTHS[mIndex] || parts[1]}, ${y}`;
  };

  // Calendar for date-picker in Mark tab
  const calendarDays = useMemo(() => {
    const year = calendarViewYear;
    const month = calendarViewMonth;
    const firstDayInstance = new Date(year, month, 1);
    let startDayOfWeek = firstDayInstance.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: prevMonth, year: prevYear, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    const totalGridCells = 42;
    const nextMonthDays = totalGridCells - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
    }
    return days;
  }, [calendarViewYear, calendarViewMonth]);

  // Calendar for Journal tab
  const journalCalendarDays = useMemo(() => {
    const year = journalYear;
    const month = journalMonth;
    const firstDayInstance = new Date(year, month, 1);
    let startDayOfWeek = firstDayInstance.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: prevMonth, year: prevYear, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    const totalGridCells = 42;
    const nextMonthDays = totalGridCells - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
    }
    return days;
  }, [journalYear, journalMonth]);

  const handleJournalPrevMonth = () => {
    setTimeframe('month');
    if (journalMonth === 0) {
      setJournalMonth(11);
      setJournalYear((y) => y - 1);
      setMonthPickerYear((y) => y - 1);
    } else {
      setJournalMonth((m) => m - 1);
    }
  };

  const handleJournalNextMonth = () => {
    setTimeframe('month');
    if (journalMonth === 11) {
      setJournalMonth(0);
      setJournalYear((y) => y + 1);
      setMonthPickerYear((y) => y + 1);
    } else {
      setJournalMonth((m) => m + 1);
    }
  };

  const handleJournalToday = () => {
    const now = new Date();
    setJournalYear(now.getFullYear());
    setJournalMonth(now.getMonth());
    setMonthPickerYear(now.getFullYear());
    setTimeframe('month');
    setIsUnifiedMonthPickerOpen(false);
  };

  const handleSelectCurrentMonth = () => {
    handleJournalToday();
  };

  const handleSelectMonthFromPicker = (monthIndex) => {
    setJournalYear(monthPickerYear);
    setJournalMonth(monthIndex);
    setTimeframe('month');
    setIsUnifiedMonthPickerOpen(false);
  };

  const handlePickerPrevYear = (e) => {
    e.stopPropagation();
    setMonthPickerYear((y) => y - 1);
  };

  const handlePickerNextYear = (e) => {
    e.stopPropagation();
    setMonthPickerYear((y) => y + 1);
  };

  const isCurrentMonthSelected = useMemo(() => {
    const now = new Date();
    return journalYear === now.getFullYear() && journalMonth === now.getMonth();
  }, [journalYear, journalMonth]);

  const recordedMonthsSet = useMemo(() => {
    const set = new Set();
    attendance
      .filter((r) => r.groupId === selectedGroupId)
      .forEach((r) => {
        if (r.date) {
          const parts = r.date.split('-');
          if (parts.length >= 2) {
            set.add(`${parseInt(parts[0], 10)}-${parseInt(parts[1], 10) - 1}`);
          }
        }
      });
    return set;
  }, [attendance, selectedGroupId]);

  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) { setCalendarViewMonth(11); setCalendarViewYear((y) => y - 1); }
    else { setCalendarViewMonth((m) => m - 1); }
  };

  const handleNextMonth = () => {
    if (calendarViewMonth === 11) { setCalendarViewMonth(0); setCalendarViewYear((y) => y + 1); }
    else { setCalendarViewMonth((m) => m + 1); }
  };

  const handleSelectCalendarDate = (d) => {
    const formattedMonth = String(d.month + 1).padStart(2, '0');
    const formattedDay = String(d.day).padStart(2, '0');
    const fullDate = `${d.year}-${formattedMonth}-${formattedDay}`;
    setSelectedDate(fullDate);
    setCalendarViewYear(d.year);
    setCalendarViewMonth(d.month);
    setIsDatePickerOpen(false);
    if (fullDate > getTodayDateString()) {
      showToast("Kelgusi sana tanlandi. Davomat belgilash cheklangan!", "warning");
    }
  };

  const syncCalendarViewWithDate = useCallback((dateStr) => {
    if (!dateStr) return;
    const cleanDate = sanitizeAttendanceDate(dateStr);
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        setCalendarViewYear(y);
        setCalendarViewMonth(m);
      }
    }
  }, []);

  useEffect(() => {
    syncCalendarViewWithDate(selectedDate);
  }, [selectedDate, syncCalendarViewWithDate]);

  const handleToggleDatePicker = () => {
    if (!isDatePickerOpen && selectedDate) {
      syncCalendarViewWithDate(selectedDate);
    }
    setIsDatePickerOpen((prev) => !prev);
  };

  const handleSelectToday = () => {
    const todayStr = getTodayDateString();
    setSelectedDate(todayStr);
    const today = new Date();
    setCalendarViewYear(today.getFullYear());
    setCalendarViewMonth(today.getMonth());
    setIsDatePickerOpen(false);
  };

  const handleStepDay = (delta) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + delta);
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${current.getFullYear()}-${m}-${d}`);
    setCalendarViewYear(current.getFullYear());
    setCalendarViewMonth(current.getMonth());
  };

  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  useEffect(() => {
    setStudentSearchQuery('');
  }, [selectedGroupId, selectedDate]);

  const groupStudents = useMemo(() => students.filter((s) => s.groupId === selectedGroupId && !s.deleted), [students, selectedGroupId]);
  const currentRecord = useMemo(() => attendance.find((r) => r.groupId === selectedGroupId && r.date === selectedDate), [attendance, selectedGroupId, selectedDate]);
  const isDateExplicitlyMarked = !!currentRecord;

  // Default to 'present' for new/unmarked sessions on or after student's join date so UI & backend require 0 extra clicks
  const effectiveRecordsMap = useMemo(() => {
    if (currentRecord && currentRecord.records) {
      // For an already recorded session, do not auto-fill missing students with 'present'
      return { ...currentRecord.records };
    }
    if (selectedDate > getTodayDateString()) {
      return {};
    }
    const defaultMap = {};
    groupStudents.forEach((student) => {
      // Only default to 'present' if the student was already a member by selectedDate
      if (isStudentInGroupAtDate(student, selectedDate)) {
        defaultMap[student.id] = 'present';
      }
    });
    return defaultMap;
  }, [currentRecord, groupStudents, selectedDate]);

  const currentDateStats = useMemo(() => {
    let present = 0, absent = 0, late = 0, excused = 0;
    groupStudents.forEach((student) => {
      const st = effectiveRecordsMap[student.id];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
    });
    return { present, absent, late, excused, totalMarked: present + absent + late + excused };
  }, [effectiveRecordsMap, groupStudents]);

  // Insight: find students who were absent in the previous lesson for this group
  const previousLessonAbsentStudentIds = useMemo(() => {
    if (!selectedGroupId || !selectedDate) return new Set();
    const groupRecords = attendance
      .filter((r) => r.groupId === selectedGroupId && r.date < selectedDate)
      .sort((a, b) => b.date.localeCompare(a.date)); // descending date
    
    // Find the most recent session with real attendance recorded
    const lastSession = groupRecords.find((rec) => {
      const statuses = Object.values(rec.records || {});
      return statuses.length > 0 && statuses.some((st) => st === 'present' || st === 'late' || st === 'excused');
    });

    if (!lastSession) return new Set();

    const absentIds = new Set();
    Object.entries(lastSession.records || {}).forEach(([studentId, status]) => {
      if (status === 'absent') {
        absentIds.add(studentId);
      }
    });
    return absentIds;
  }, [attendance, selectedGroupId, selectedDate]);

  const filteredGroupStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return groupStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return groupStudents.filter((s) => s.name.toLowerCase().includes(q));
  }, [groupStudents, studentSearchQuery]);

  const isDateInJournalMonth = useCallback((dateStr) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length < 2) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === journalYear && m === journalMonth;
  }, [journalYear, journalMonth]);

  const filteredAttendanceRecords = useMemo(() => {
    if (activeTab !== 'journal' && !selectedStudentHistoryModal) return [];
    const groupRecords = attendance.filter((r) => r.groupId === selectedGroupId);
    if (timeframe === 'all') return groupRecords;
    return groupRecords.filter((r) => isDateInJournalMonth(r.date));
  }, [activeTab, selectedStudentHistoryModal, attendance, selectedGroupId, timeframe, isDateInJournalMonth]);

  // Indexed attendance map for Journal Calendar
  const journalRecordsByDate = useMemo(() => {
    if (activeTab !== 'journal') return {};
    const map = {};
    attendance
      .filter((r) => r.groupId === selectedGroupId)
      .forEach((rec) => {
        const breakdown = calculateSessionAttendance(rec, students, groupStudents);
        map[rec.date] = {
          ...rec,
          records: breakdown.effectiveRecords,
          studentsList: breakdown.studentsList,
          present: breakdown.present,
          absent: breakdown.absent,
          late: breakdown.late,
          excused: breakdown.excused,
          totalMarked: breakdown.totalMarked,
          rate: breakdown.rate,
        };
      });
    return map;
  }, [activeTab, attendance, selectedGroupId, groupStudents, students]);

  const handleMarkStatus = useCallback((studentId, clickedStatus) => {
    if (!selectedGroupId || !selectedDate) { showToast("Iltimos, guruh va sanani tanlang!", "error"); return; }
    if (selectedDate > getTodayDateString()) {
      showToast("Bo'lajak sanalar uchun davomat belgilab bo'lmaydi!", "warning");
      return;
    }
    const currentStatus = effectiveRecordsMap[studentId];
    const newStatus = currentStatus === clickedStatus ? null : clickedStatus;

    const updatedMap = { ...effectiveRecordsMap };
    if (newStatus === null) {
      delete updatedMap[studentId];
    } else {
      updatedMap[studentId] = newStatus;
    }

    const cleanRecords = {};
    Object.entries(updatedMap).forEach(([sId, st]) => {
      if (st === 'present' || st === 'absent' || st === 'late' || st === 'excused') {
        cleanRecords[sId] = st;
      }
    });
    onSaveAttendance(selectedGroupId, selectedDate, cleanRecords);
  }, [selectedGroupId, selectedDate, effectiveRecordsMap, onSaveAttendance, showToast]);

  const handleSaveExplicitly = () => {
    if (!selectedGroupId || !selectedDate) {
      showToast("Iltimos, guruh va sanani tanlang!", "error");
      return;
    }
    if (selectedDate > getTodayDateString()) {
      showToast("Bo'lajak sanalar uchun davomat saqlab bo'lmaydi!", "warning");
      return;
    }
    if (groupStudents.length === 0) {
      showToast("Bu guruhda o'quvchilar mavjud emas!", "warning");
      return;
    }
    const cleanRecords = {};
    Object.entries(effectiveRecordsMap).forEach(([sId, st]) => {
      if (st === 'present' || st === 'absent' || st === 'late' || st === 'excused') {
        cleanRecords[sId] = st;
      }
    });
    onSaveAttendance(selectedGroupId, selectedDate, cleanRecords);
    showToast("Davomat muvaffaqiyatli saqlandi!", "success");
  };

  const handleMarkAllPresent = () => {
    if (selectedDate > getTodayDateString()) {
      showToast("Bo'lajak sanalar uchun davomat belgilab bo'lmaydi!", "warning");
      return;
    }
    if (groupStudents.length === 0) { showToast("Bu guruhda o'quvchilar mavjud emas!", "warning"); return; }
    const updatedMap = { ...effectiveRecordsMap };
    groupStudents.forEach((student) => {
      if (isStudentInGroupAtDate(student, selectedDate)) {
        updatedMap[student.id] = 'present';
      }
    });
    const cleanRecords = {};
    Object.entries(updatedMap).forEach(([sId, st]) => {
      if (st === 'present' || st === 'absent' || st === 'late' || st === 'excused') {
        cleanRecords[sId] = st;
      }
    });
    onSaveAttendance(selectedGroupId, selectedDate, cleanRecords);
    showToast("Barcha o'quvchilar 'Keldi' deb belgilandi!", "success");
  };

  const handleMarkAllAbsent = () => {
    if (selectedDate > getTodayDateString()) {
      showToast("Bo'lajak sanalar uchun davomat belgilab bo'lmaydi!", "warning");
      return;
    }
    if (groupStudents.length === 0) { showToast("Bu guruhda o'quvchilar mavjud emas!", "warning"); return; }
    const updatedMap = { ...effectiveRecordsMap };
    groupStudents.forEach((student) => {
      if (isStudentInGroupAtDate(student, selectedDate)) {
        updatedMap[student.id] = 'absent';
      }
    });
    const cleanRecords = {};
    Object.entries(updatedMap).forEach(([sId, st]) => {
      if (st === 'present' || st === 'absent' || st === 'late' || st === 'excused') {
        cleanRecords[sId] = st;
      }
    });
    onSaveAttendance(selectedGroupId, selectedDate, cleanRecords);
    showToast("Barcha o'quvchilar 'Kelmadi' deb belgilandi!", "info");
  };

  const handleClearCurrentDate = () => {
    if (onDeleteAttendance && selectedGroupId && selectedDate) {
      onDeleteAttendance(selectedGroupId, selectedDate);
      showToast("Ushbu kundagi davomad tozalandi!", "info");
    }
  };

  const handleDeleteDateConfirmed = () => {
    if (confirmDeleteDate && onDeleteAttendance && selectedGroupId) {
      onDeleteAttendance(selectedGroupId, confirmDeleteDate);
      if (selectedDayDetail && selectedDayDetail.date === confirmDeleteDate) {
        setSelectedDayDetail(null);
      }
      setConfirmDeleteDate(null);
      showToast("Davomad yozuvi o'chirildi!", "success");
    }
  };

  const handleExportCSV = () => {
    if (!selectedGroup) {
      showToast("Guruh tanlanmagan!", "error");
      return;
    }
    if (monthLessonDates.length === 0) {
      showToast("Tanlangan oyda eksport qilish uchun darslar mavjud emas!", "warning");
      return;
    }
    exportAttendanceToCSV({
      group: selectedGroup,
      year: journalYear,
      month: journalMonth,
      lessonDates: monthLessonDates,
      studentsWithStats: filteredAndSortedMatrixStudents,
      attendanceByDate: journalRecordsByDate,
      uzbekMonths: UZBEK_MONTHS
    });
    showToast("Oylik davomat jurnali Excel (.csv) formatida yuklab olindi!", "success");
  };

  const handlePrint = () => {
    if (monthLessonDates.length === 0) {
      showToast("Tanlangan oyda chop etish uchun darslar mavjud emas!", "warning");
      return;
    }
    printAttendanceJournal();
  };

  const journalGroupStudents = useMemo(() => {
    if (activeTab !== 'journal') return groupStudents;

    const studentMap = new Map();
    // 1. Current active students in this group
    groupStudents.forEach((s) => studentMap.set(s.id, { ...s, isTransferred: false }));

    // 2. Any students who were transferred or have recorded attendance in this group
    (students || []).forEach((s) => {
      if (studentMap.has(s.id)) return;
      // Check if student has any recorded attendance in this group for the current filtered period
      const hasAttendance = filteredAttendanceRecords.some((rec) => rec?.records?.[s.id] !== undefined);
      if (hasAttendance) {
        studentMap.set(s.id, {
          ...s,
          isTransferred: true,
        });
      }
    });

    return Array.from(studentMap.values());
  }, [activeTab, groupStudents, students, filteredAttendanceRecords]);

  const studentStats = useMemo(() => {
    if (activeTab !== 'journal' || journalGroupStudents.length === 0) return [];
    return journalGroupStudents.map((student) => {
      const stats = calculateStudentAttendanceStats(student, filteredAttendanceRecords, selectedGroupId);
      const fairScore = stats.fairScore !== undefined
        ? stats.fairScore
        : calculateFairAttendanceScore(
            stats.presentCount,
            stats.absentCount,
            stats.lateCount,
            stats.totalLessons,
            stats.excusedCount
          );
      return {
        student,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        lateCount: stats.lateCount,
        excusedCount: stats.excusedCount,
        totalLessons: stats.totalLessons,
        rate: stats.rate,
        fairScore,
        isTransferred: !!student.isTransferred,
      };
    });
  }, [activeTab, journalGroupStudents, filteredAttendanceRecords, selectedGroupId]);

  const monthLessonDates = useMemo(() => {
    if (activeTab !== 'journal') return [];
    const datesSet = new Set();
    attendance
      .filter((r) => r.groupId === selectedGroupId && isDateInJournalMonth(r.date))
      .forEach((rec) => {
        if (!rec || !rec.date) return;
        const cleanDate = sanitizeAttendanceDate(rec.date);
        const hasMarks = rec.records && Object.values(rec.records).some(
          st => st === 'present' || st === 'absent' || st === 'late' || st === 'excused'
        );
        if (hasMarks) {
          datesSet.add(cleanDate);
        }
      });
    return Array.from(datesSet).sort((a, b) => a.localeCompare(b));
  }, [activeTab, attendance, selectedGroupId, isDateInJournalMonth]);

  const filteredAndSortedMatrixStudents = useMemo(() => {
    let list = [...studentStats];
    if (matrixSearchQuery.trim()) {
      const q = matrixSearchQuery.toLowerCase().trim();
      list = list.filter((item) => item.student.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (matrixSortField === 'name') {
        cmp = a.student.name.localeCompare(b.student.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (matrixSortField === 'present') {
        cmp = a.presentCount - b.presentCount;
        if (cmp === 0) cmp = a.fairScore - b.fairScore;
      } else if (matrixSortField === 'excused') {
        cmp = a.excusedCount - b.excusedCount;
        if (cmp === 0) cmp = a.fairScore - b.fairScore;
      } else if (matrixSortField === 'absent') {
        cmp = a.absentCount - b.absentCount;
        if (cmp === 0) cmp = b.fairScore - a.fairScore;
      } else if (matrixSortField === 'late') {
        cmp = a.lateCount - b.lateCount;
        if (cmp === 0) cmp = a.fairScore - b.fairScore;
      } else if (matrixSortField === 'total') {
        cmp = a.totalLessons - b.totalLessons;
        if (cmp === 0) cmp = a.fairScore - b.fairScore;
      } else {
        // Default: 'rating' (Adolatli davomat reytingi - fairScore)
        if (a.totalLessons === 0 && b.totalLessons === 0) cmp = 0;
        else if (a.totalLessons === 0) return matrixSortDirection === 'desc' ? 1 : -1;
        else if (b.totalLessons === 0) return matrixSortDirection === 'desc' ? -1 : 1;
        else {
          cmp = a.fairScore - b.fairScore;
          if (cmp === 0) cmp = a.rate - b.rate;
          if (cmp === 0) cmp = a.presentCount - b.presentCount;
        }
      }

      if (cmp === 0) {
        cmp = a.student.name.localeCompare(b.student.name, undefined, { numeric: true, sensitivity: 'base' });
      }

      return matrixSortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [studentStats, matrixSearchQuery, matrixSortField, matrixSortDirection]);

  const overallGroupStats = useMemo(() => {
    if (activeTab !== 'journal') return { avgRate: 0, totalLessons: 0, totalAbsents: 0, totalLates: 0, totalExcused: 0 };

    // Faqat kamida bitta o'quvchi belgilangan real darslarni hisobga olamiz
    const validSessions = filteredAttendanceRecords.filter((rec) => {
      if (!rec || !rec.records) return false;
      return Object.values(rec.records).some(
        (st) => st === 'present' || st === 'absent' || st === 'late' || st === 'excused'
      );
    });

    const metrics = calculateWeightedAttendanceMetrics(
      studentStats.map((s) => ({
        present: s.presentCount,
        absent: s.absentCount,
        late: s.lateCount,
        excused: s.excusedCount,
      }))
    );

    return {
      avgRate: metrics.avgRate,
      totalLessons: validSessions.length,
      totalAbsents: metrics.totalAbsent,
      totalLates: metrics.totalLate,
      totalExcused: metrics.totalExcused,
    };
  }, [activeTab, studentStats, filteredAttendanceRecords]);

  const studentHistoryDetails = useMemo(() => {
    if (!selectedStudentHistoryModal) return null;
    const student = selectedStudentHistoryModal;
    const studentId = student.id;

    const historyList = filteredAttendanceRecords
      .filter((record) => {
        // If lesson took place before student joined, ignore
        if (!isStudentInGroupAtDate(student, record.date, record.groupId)) return false;
        const status = record.records?.[studentId];
        return status === 'present' || status === 'absent' || status === 'late' || status === 'excused';
      })
      .map((record) => ({
        date: record.date,
        status: record.records[studentId],
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const absentDays = historyList.filter((item) => item.status === 'absent');
    const lateDays = historyList.filter((item) => item.status === 'late');
    const presentDays = historyList.filter((item) => item.status === 'present');
    const excusedDays = historyList.filter((item) => item.status === 'excused');

    const total = historyList.length;
    const rate = calculateAttendanceRate(presentDays.length, absentDays.length, lateDays.length, total, excusedDays.length);

    return {
      student,
      historyList,
      absentDays,
      lateDays,
      presentDays,
      excusedDays,
      total,
      rate,
    };
  }, [selectedStudentHistoryModal, filteredAttendanceRecords]);

  return (
    <div className="attendance-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Davomad</h2>
        </div>
        <div className="tab-control-brutalist">
          <button type="button" className={`tab-btn-brutalist ${activeTab === 'mark' ? 'active' : ''}`} onClick={() => setActiveTab('mark')}>
            <IconEdit size={15} />
            <span>Belgilash</span>
          </button>
          <button type="button" className={`tab-btn-brutalist ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>
            <IconCalendar size={15} />
            <span>Jurnal & Statistika</span>
          </button>
        </div>
      </div>

      {activeTab === 'mark' && (
        <div className="glass-card filters-toolbar">
          <div className="filter-item">
            <label className="form-label">Guruh</label>
            {groups.length > 0 ? (
              <div className="custom-select-container">
                <button type="button" className="filter-select-btn" onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}>
                  <span>{selectedGroup ? selectedGroup.name : 'Guruhni tanlang'}</span>
                  <span className="dropdown-arrow"><IconChevronDown /></span>
                </button>
                {isGroupDropdownOpen && (
                  <>
                    <div className="custom-select-overlay" onClick={() => setIsGroupDropdownOpen(false)} />
                    <div className="custom-dropdown-list glass">
                      {groups.map((g) => (
                        <div key={g.id} className={`custom-dropdown-item ${g.id === selectedGroupId ? 'active' : ''}`} onClick={() => { setSelectedGroupId(g.id); setIsGroupDropdownOpen(false); }}>{g.name}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : <p className="no-groups-text">Guruhlar mavjud emas.</p>}
          </div>

          <div className="filter-item filter-date-item">
            <label className="form-label">Dars Sanasi</label>
            <div className="date-picker-row">
              <button type="button" className="btn-date-nav scale-active" onClick={() => handleStepDay(-1)}>
                <IconChevronLeft />
              </button>
              <div className="custom-select-container date-input-container">
                <button type="button" className="filter-select-btn" onClick={handleToggleDatePicker}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconCalendar size={15} />
                    {formatDisplayDate(selectedDate)}
                  </span>
                  <span className="dropdown-arrow"><IconChevronDown /></span>
                </button>
                {isDatePickerOpen && (
                  <>
                    <div className="custom-select-overlay" onClick={() => setIsDatePickerOpen(false)} />
                    <div className="custom-calendar-popup glass-card">
                      <div className="calendar-header-bar">
                        <button type="button" className="cal-nav-btn" onClick={handlePrevMonth}>
                          <IconChevronLeft />
                        </button>
                        <span className="cal-month-title">{UZBEK_MONTHS[calendarViewMonth]} {calendarViewYear}</span>
                        <button type="button" className="cal-nav-btn" onClick={handleNextMonth}>
                          <IconChevronRight />
                        </button>
                      </div>
                      <div className="calendar-weekdays-row">
                        {WEEKDAYS.map((wd, colIdx) => {
                          const colType = colIdx === 6 ? 'hdr-sunday' : (colIdx === 0 || colIdx === 2 || colIdx === 4) ? 'hdr-toq' : 'hdr-juft';
                          return <span key={wd} className={`cal-weekday ${colType}`}>{wd}</span>;
                        })}
                      </div>
                      <div className="calendar-days-grid">{calendarDays.map((d, idx) => {
                          const m = String(d.month + 1).padStart(2, '0');
                          const dayStr = String(d.day).padStart(2, '0');
                          const fullDateStr = `${d.year}-${m}-${dayStr}`;
                          const isSunday = (idx % 7) === 6;
                          const isFuture = fullDateStr > getTodayDateString();
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`cal-day-cell ${isSunday ? 'day-sunday' : ''} ${!d.isCurrentMonth ? 'other-month' : ''} ${isFuture ? 'future-day' : ''} ${fullDateStr === selectedDate ? 'selected' : ''}`}
                              onClick={() => handleSelectCalendarDate(d)}
                              title={isFuture ? "Kelgusi sana" : undefined}
                            >
                              {d.day}
                            </button>
                          );
                      })}</div>
                      <div className="calendar-footer-bar"><button type="button" className="cal-today-btn" onClick={handleSelectToday}>Bugun</button></div>
                    </div>
                  </>
                )}
              </div>
              <button type="button" className="btn-date-nav scale-active" onClick={() => handleStepDay(1)}>
                <IconChevronRight />
              </button>
              <button type="button" className={`btn-today-quick scale-active ${selectedDate === getTodayDateString() ? 'active' : ''}`} onClick={handleSelectToday}>Bugun</button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-state glass-card"><p>Davomadni boshqarish uchun guruh yarating.</p></div>
      ) : activeTab === 'mark' ? (
        <div className="mark-view-section">
          {/* Search & Insight Bar */}
          <div className="attendance-search-filter-bar glass-card">
            <div className="attendance-search-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="attendance-search-input"
                placeholder="O'quvchini ismi bo'yicha tezkor qidirish..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
              />
              {studentSearchQuery && (
                <button
                  type="button"
                  className="search-clear-btn scale-active"
                  onClick={() => setStudentSearchQuery('')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {previousLessonAbsentStudentIds.size > 0 && (
              <span className="prev-absent-info-badge">
                <span className="prev-absent-dot" />
                <span>O'tgan darsda kelmaganlar: <strong>{previousLessonAbsentStudentIds.size} ta</strong></span>
              </span>
            )}
          </div>

          {isFutureDate && (
            <div className="attendance-future-warning-banner glass-card">
              <div className="warning-banner-left">
                <div className="warning-banner-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="warning-banner-title">
                    Kelgusi sana tanlangan ({formatDisplayDate(selectedDate)})
                  </div>
                  <div className="warning-banner-desc">
                    Statistika va hisobotlar to'g'riligini ta'minlash maqsadida bo'lajak kunlarga oldindan davomat belgilash cheklangan.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-warning-quick scale-active"
                onClick={handleSelectToday}
              >
                Bugungi kunga o'tish
              </button>
            </div>
          )}

          <div className="quick-actions-bar glass-card">
            <div className="quick-actions-btns">
              <button
                className="btn btn-secondary scale-active btn-sm"
                onClick={handleMarkAllPresent}
                disabled={isFutureDate}
                title={isFutureDate ? "Bo'lajak sana uchun davomat belgilab bo'lmaydi" : undefined}
              >
                Barchasi Keldi
              </button>
              <button
                className="btn btn-secondary scale-active btn-sm"
                onClick={handleMarkAllAbsent}
                disabled={isFutureDate}
                title={isFutureDate ? "Bo'lajak sana uchun davomat belgilab bo'lmaydi" : undefined}
              >
                Barchasi Kelmadi
              </button>
              {isDateExplicitlyMarked && (
                <button className="btn btn-danger scale-active btn-sm" onClick={handleClearCurrentDate}>
                  <IconTrash size={14} /> Tozalash
                </button>
              )}
            </div>
            <div className="quick-actions-summary">
              <span className="summary-pill pill-present">Keldi: <strong>{currentDateStats.present}</strong></span>
              {currentDateStats.excused > 0 && <span className="summary-pill pill-excused">Sababli: <strong>{currentDateStats.excused}</strong></span>}
              <span className="summary-pill pill-absent">Kelmadi: <strong>{currentDateStats.absent}</strong></span>
              {currentDateStats.late > 0 && <span className="summary-pill pill-late">Kechikdi: <strong>{currentDateStats.late}</strong></span>}
            </div>
            <div className="quick-actions-save-wrapper">
              <button
                className="btn btn-primary scale-active btn-sm save-att-btn"
                onClick={handleSaveExplicitly}
                disabled={isFutureDate}
                title={isFutureDate ? "Bo'lajak sana uchun davomat saqlab bo'lmaydi" : undefined}
              >
                <IconCheck size={14} strokeWidth={2.8} /> Saqlash
              </button>
            </div>
          </div>

          {groupStudents.length > 0 ? (
            filteredGroupStudents.length > 0 ? (
              <div className="students-attendance-list">
                {filteredGroupStudents.map((student) => {
                  const isFutureJoin = !isStudentInGroupAtDate(student, selectedDate);
                  return (
                    <StudentAttendanceRow
                      key={student.id}
                      student={student}
                      status={effectiveRecordsMap[student.id]}
                      wasAbsentLastLesson={previousLessonAbsentStudentIds.has(student.id)}
                      isFutureJoin={isFutureJoin}
                      isFutureDate={isFutureDate}
                      onMarkStatus={handleMarkStatus}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="empty-state glass-card">
                <p>Qidiruv bo'yicha hech qanday o'quvchi topilmadi.</p>
              </div>
            )
          ) : (
            <div className="empty-state glass-card">
              <p>Ushbu guruhda o'quvchilar mavjud emas.</p>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: JOURNAL & STATISTICS UNIFIED */
        <div className="journal-view-section">
          {/* Printable Header (Only rendered when printing / exporting to PDF) */}
          <div className="print-header-banner">
            <h1 className="print-school-title">
              {selectedGroup?.name || 'Guruh'} — Oylik Davomat Jurnali
            </h1>
            <p className="print-meta-info">
              Davr: <strong>{UZBEK_MONTHS[journalMonth]} {journalYear}-yil</strong> • O'tilgan darslar: <strong>{monthLessonDates.length} ta</strong> • O'quvchilar: <strong>{journalGroupStudents.length} ta</strong> • Chop etildi: {new Date().toLocaleDateString('uz-UZ')}
            </p>
          </div>

          {/* 1. UNIFIED JOURNAL TOOLBAR */}
          <div className="glass-card unified-journal-toolbar">
            <div className="toolbar-left-group">
              {groups.length > 0 && (
                <div className="custom-select-container journal-group-select-container">
                  <button
                    type="button"
                    className="toolbar-group-selector-btn scale-active"
                    onClick={() => setIsJournalGroupDropdownOpen((prev) => !prev)}
                    title="Guruhni almashtirish"
                  >
                    <span className="toolbar-group-name">{selectedGroup ? selectedGroup.name : 'Guruhni tanlang'}</span>
                    <IconChevronDown size={13} className={`group-chevron ${isJournalGroupDropdownOpen ? 'open' : ''}`} />
                  </button>
                  {isJournalGroupDropdownOpen && (
                    <>
                      <div className="custom-select-overlay" onClick={() => setIsJournalGroupDropdownOpen(false)} />
                      <div className="custom-dropdown-list glass">
                        {groups.map((g) => (
                          <div
                            key={g.id}
                            className={`custom-dropdown-item ${g.id === selectedGroupId ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedGroupId(g.id);
                              setIsJournalGroupDropdownOpen(false);
                            }}
                          >
                            {g.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="toolbar-center-group">
              <div className="month-jump-nav unified-month-nav">
                <button 
                  type="button" 
                  className="month-nav-arrow-btn scale-active" 
                  onClick={handleJournalPrevMonth}
                  title="Oldingi oy"
                >
                  <IconChevronLeft size={16} />
                </button>

                <div className="month-picker-wrapper">
                  <button 
                    type="button" 
                    className="month-picker-trigger active scale-active"
                    onClick={() => {
                      setMonthPickerYear(journalYear);
                      setIsUnifiedMonthPickerOpen((prev) => !prev);
                    }}
                    title="Oyni tanlash"
                  >
                    <IconCalendar size={14} />
                    <span className="month-picker-label">{UZBEK_MONTHS[journalMonth]} {journalYear}</span>
                    <IconChevronDown size={12} className={`month-picker-chevron ${isUnifiedMonthPickerOpen ? 'open' : ''}`} />
                  </button>

                  {isUnifiedMonthPickerOpen && (
                    <>
                      <div className="custom-select-overlay" onClick={() => setIsUnifiedMonthPickerOpen(false)} />
                      <div className="stats-month-picker-popup glass-card">
                        <div className="month-picker-header">
                          <button type="button" className="cal-nav-btn scale-active" onClick={handlePickerPrevYear}>
                            <IconChevronLeft />
                          </button>
                          <span className="month-picker-year-title">{monthPickerYear}-yil</span>
                          <button type="button" className="cal-nav-btn scale-active" onClick={handlePickerNextYear}>
                            <IconChevronRight />
                          </button>
                        </div>

                        <div className="month-picker-grid">
                          {UZBEK_MONTHS.map((mName, mIdx) => {
                            const isSelected = journalYear === monthPickerYear && journalMonth === mIdx;
                            const now = new Date();
                            const isCurrent = now.getFullYear() === monthPickerYear && now.getMonth() === mIdx;
                            const hasData = recordedMonthsSet.has(`${monthPickerYear}-${mIdx}`);

                            return (
                              <button
                                key={mIdx}
                                type="button"
                                className={`month-picker-cell ${isSelected ? 'selected' : ''} ${isCurrent ? 'current-month' : ''}`}
                                onClick={() => {
                                  handleSelectMonthFromPicker(mIdx);
                                  setIsUnifiedMonthPickerOpen(false);
                                }}
                              >
                                <span className="month-cell-name">{mName.slice(0, 3)}</span>
                                {hasData && <span className="month-has-data-dot" title="Dars davomati mavjud" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className="month-picker-footer">
                          <button 
                            type="button" 
                            className="month-picker-today-btn" 
                            onClick={() => {
                              handleSelectCurrentMonth();
                              setIsUnifiedMonthPickerOpen(false);
                            }}
                          >
                            Joriy oyga o'tish
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button 
                  type="button" 
                  className="month-nav-arrow-btn scale-active" 
                  onClick={handleJournalNextMonth}
                  title="Keyingi oy"
                >
                  <IconChevronRight size={16} />
                </button>
              </div>

              {!isCurrentMonthSelected && (
                <button
                  type="button"
                  className="btn-today-pill scale-active"
                  onClick={handleSelectCurrentMonth}
                  title="Joriy oyga qaytish"
                >
                  Bu oy
                </button>
              )}
            </div>

            <div className="toolbar-right-group">
              {/* View Switcher: Matrix vs Calendar */}
              <div className="view-mode-segmented-control">
                <button
                  type="button"
                  className={`view-mode-btn ${journalViewMode === 'matrix' ? 'active' : ''}`}
                  onClick={() => setJournalViewMode('matrix')}
                  title="Klassik davomat matritsasi"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                  </svg>
                  <span>Matritsa</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${journalViewMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => setJournalViewMode('calendar')}
                  title="Oylik kalendar ko'rinishi"
                >
                  <IconCalendar size={14} />
                  <span>Kalendar</span>
                </button>
              </div>

              {/* Action Buttons: Export Excel & Print */}
              <div className="toolbar-action-buttons">
                <button
                  type="button"
                  className="btn-export-toolbar scale-active"
                  onClick={handleExportCSV}
                  title="Oylik jurnalni Excel (.csv) formatida yuklab olish"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className="hide-on-mobile">Excel (.csv)</span>
                </button>

                <button
                  type="button"
                  className="btn-print-toolbar scale-active"
                  onClick={handlePrint}
                  title="Oylik jurnalni chop etish yoki PDF qilib saqlash"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span className="hide-on-mobile">Chop etish / PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. KPI CARDS */}
          <div className="stats-kpi-grid unified-kpi-grid">
            <div className="stats-kpi-card">
              <span className="kpi-label">O'rtacha Davomad</span>
              <span className="kpi-value">{overallGroupStats.avgRate}%</span>
            </div>
            <div className="stats-kpi-card">
              <span className="kpi-label">O'tilgan Darslar</span>
              <span className="kpi-value">{overallGroupStats.totalLessons} ta</span>
            </div>
            <div className="stats-kpi-card">
              <span className="kpi-label">Sababli Qoldirilgan</span>
              <span className="kpi-value">{overallGroupStats.totalExcused || 0} ta</span>
            </div>
            <div className="stats-kpi-card">
              <span className="kpi-label">Jami Qoldirilgan</span>
              <span className="kpi-value">{overallGroupStats.totalAbsents} ta</span>
            </div>
            <div className="stats-kpi-card">
              <span className="kpi-label">Jami Kechikishlar</span>
              <span className="kpi-value">{overallGroupStats.totalLates} ta</span>
            </div>
          </div>

          {/* 3. VIEW MODE A: KLASSIK DAVOMAT JURNALI (MATRIX GRID) */}
          {journalViewMode === 'matrix' && (
            <div className="glass-card section-container matrix-journal-card">
              {/* Search & Legend Toolbar */}
              <div className="matrix-top-toolbar">
                <div className="matrix-search-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="matrix-search-input"
                    placeholder="O'quvchi ismini qidirish..."
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  />
                  {matrixSearchQuery && (
                    <button
                      type="button"
                      className="matrix-search-clear-btn"
                      onClick={() => setMatrixSearchQuery('')}
                      title="Qidiruvni tozalash"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="matrix-legend">
                  <span className="legend-item"><span className="matrix-badge present"><MinimalCheck /></span> Keldi</span>
                  <span className="legend-item"><span className="matrix-badge excused">S</span> Sababli</span>
                  <span className="legend-item"><span className="matrix-badge absent"><MinimalCross /></span> Kelmadi</span>
                  <span className="legend-item"><span className="matrix-badge late"><MinimalClock /></span> Kechikdi</span>
                  <span className="legend-item"><span className="matrix-badge not-member">—</span> Darsi yo'q</span>
                </div>
              </div>

              {monthLessonDates.length === 0 ? (
                <div className="month-empty-banner" style={{ margin: '16px 0' }}>
                  <IconCalendar size={18} />
                  <div>
                    <strong>Tanlangan oyda ({UZBEK_MONTHS[journalMonth]} {journalYear}) dars davomati yozuvlari topilmadi.</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      Yangi dars davomatini belgilash uchun "Davomat olish" bo'limiga o'ting.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary scale-active btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => setActiveTab('mark')}
                  >
                    Davomat olishga o'tish
                  </button>
                </div>
              ) : filteredAndSortedMatrixStudents.length === 0 ? (
                <div className="empty-state glass-card" style={{ margin: '16px 0' }}>
                  <p>Qidiruv bo'yicha hech qanday o'quvchi topilmadi.</p>
                </div>
              ) : (
                <div className="matrix-table-scroll-container">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th className="sticky-col-rank">#</th>
                        <th
                          className={`sticky-col-name sortable-th ${matrixSortField === 'name' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('name')}
                          title="Ism bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>O'quvchi</span>
                            <MinimalSortIcon active={matrixSortField === 'name'} direction={matrixSortDirection} />
                          </div>
                        </th>

                        {/* Lesson Date Columns */}
                        {monthLessonDates.map((dateStr) => {
                          const dayNum = getDayNum(dateStr);
                          const wd = getShortWeekday(dateStr);
                          const isSunday = wd === 'Ya';
                          const session = journalRecordsByDate[dateStr];
                          return (
                            <th
                              key={dateStr}
                              className={`matrix-date-th ${isSunday ? 'th-sunday' : ''}`}
                              onClick={() => {
                                if (session) setSelectedDayDetail(session);
                              }}
                              title={`${dateStr} (${wd})${session ? ` • Ko'rish / Tahrirlash` : ''}`}
                            >
                              <div className="matrix-date-header-inner">
                                <span className="matrix-date-num">{dayNum}</span>
                                <span className="matrix-date-wd">{wd}</span>
                              </div>
                            </th>
                          );
                        })}

                        {/* Summary Headers */}
                        <th
                          className={`matrix-summary-th sortable-th ${matrixSortField === 'present' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('present')}
                          title="Kelgan darslar soni bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>Kelgan</span>
                            <MinimalSortIcon active={matrixSortField === 'present'} direction={matrixSortDirection} />
                          </div>
                        </th>
                        <th
                          className={`matrix-summary-th sortable-th ${matrixSortField === 'excused' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('excused')}
                          title="Sababli qoldirilgan darslar bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>Sababli</span>
                            <MinimalSortIcon active={matrixSortField === 'excused'} direction={matrixSortDirection} />
                          </div>
                        </th>
                        <th
                          className={`matrix-summary-th sortable-th ${matrixSortField === 'absent' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('absent')}
                          title="Qoldirilgan darslar bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>Kelmadi</span>
                            <MinimalSortIcon active={matrixSortField === 'absent'} direction={matrixSortDirection} />
                          </div>
                        </th>
                        <th
                          className={`matrix-summary-th sortable-th ${matrixSortField === 'late' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('late')}
                          title="Kechikishlar bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>Kechikkan</span>
                            <MinimalSortIcon active={matrixSortField === 'late'} direction={matrixSortDirection} />
                          </div>
                        </th>
                        <th
                          className={`matrix-summary-th sortable-th ${matrixSortField === 'total' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('total')}
                          title="Jami darslar bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>Jami</span>
                            <MinimalSortIcon active={matrixSortField === 'total'} direction={matrixSortDirection} />
                          </div>
                        </th>
                        <th
                          className={`matrix-summary-th sortable-th ${matrixSortField === 'rating' ? 'active-sort' : ''}`}
                          onClick={() => handleMatrixSort('rating')}
                          title="Adolatli davomat reytingi bo'yicha saralash"
                        >
                          <div className="th-sort-content">
                            <span>Davomat %</span>
                            <MinimalSortIcon active={matrixSortField === 'rating'} direction={matrixSortDirection} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedMatrixStudents.map((s, idx) => (
                        <tr key={s.student.id} className="matrix-row">
                          <td className="sticky-col-rank font-mono">#{idx + 1}</td>
                          <td
                            className="sticky-col-name clickable-cell"
                            onClick={() => setSelectedStudentHistoryModal(s.student)}
                            title="O'quvchi davomat tarixini ko'rish"
                          >
                            <div className="matrix-student-cell">
                              <span className="student-name-text">{s.student.name}</span>
                              {s.isTransferred && (
                                <span className="transferred-student-tag" title="Boshqa guruhga o'tkazilgan">
                                  Ko'chirilgan
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date status cells */}
                          {monthLessonDates.map((dateStr) => {
                            const isMember = isStudentInGroupAtDate(s.student, dateStr, selectedGroupId);
                            if (!isMember) {
                              return (
                                <td key={dateStr} className="matrix-cell not-member-cell" title={`${s.student.name}: Guruh a'zosi bo'lmagan`}>
                                  <span className="matrix-badge not-member">—</span>
                                </td>
                              );
                            }

                            const rec = journalRecordsByDate[dateStr];
                            const status = rec?.records?.[s.student.id];

                            return (
                              <td
                                key={dateStr}
                                className={`matrix-cell status-cell ${status || 'unmarked'}`}
                                onClick={() => {
                                  if (rec) setSelectedDayDetail(rec);
                                }}
                                title={`${s.student.name} • ${dateStr}: ${
                                  status === 'present' ? 'Keldi' :
                                  status === 'absent' ? 'Kelmadi' :
                                  status === 'late' ? 'Kechikdi' :
                                  status === 'excused' ? 'Sababli' : 'Belgilanmagan'
                                }`}
                              >
                                {status === 'present' ? (
                                  <span className="matrix-badge present" title="Keldi">
                                    <MinimalCheck />
                                  </span>
                                ) : status === 'absent' ? (
                                  <span className="matrix-badge absent" title="Kelmadi">
                                    <MinimalCross />
                                  </span>
                                ) : status === 'late' ? (
                                  <span className="matrix-badge late" title="Kechikdi">
                                    <MinimalClock />
                                  </span>
                                ) : status === 'excused' ? (
                                  <span className="matrix-badge excused" title="Sababli">S</span>
                                ) : (
                                  <span className="matrix-badge unmarked">·</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Summary numbers */}
                          <td className="matrix-summary-cell">
                            {s.presentCount > 0 ? (
                              <span className="matrix-num num-present">{s.presentCount}</span>
                            ) : (
                              <span className="matrix-num-zero">0</span>
                            )}
                          </td>
                          <td className="matrix-summary-cell">
                            {s.excusedCount > 0 ? (
                              <span className="matrix-num num-excused">{s.excusedCount}</span>
                            ) : (
                              <span className="matrix-num-zero">0</span>
                            )}
                          </td>
                          <td className="matrix-summary-cell">
                            {s.absentCount > 0 ? (
                              <span className="matrix-num num-absent">{s.absentCount}</span>
                            ) : (
                              <span className="matrix-num-zero">0</span>
                            )}
                          </td>
                          <td className="matrix-summary-cell">
                            {s.lateCount > 0 ? (
                              <span className="matrix-num num-late">{s.lateCount}</span>
                            ) : (
                              <span className="matrix-num-zero">0</span>
                            )}
                          </td>
                          <td className="matrix-summary-cell">
                            <span className="matrix-num-total">{s.totalLessons}</span>
                          </td>
                          <td className="matrix-summary-cell">
                            <span 
                              className={`rate-pill-minimal ${s.totalLessons === 0 ? 'empty' : s.rate >= 90 ? 'good' : s.rate >= 70 ? 'avg' : 'bad'}`}
                              title={s.totalLessons > 0 ? `Davomat foizi: ${s.rate}%, Reyting balli: ${s.fairScore}` : undefined}
                            >
                              {s.totalLessons === 0 ? '—' : `${s.rate}%`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Matrix Footer: Daily Summary */}
                    <tfoot>
                      <tr className="matrix-footer-row row-presents">
                        <td className="sticky-col-rank font-bold" colSpan={2}>
                          Jami kelganlar (har darsda)
                        </td>
                        {monthLessonDates.map((dateStr) => {
                          const rec = journalRecordsByDate[dateStr];
                          const present = rec?.present || 0;
                          const total = rec?.totalMarked || 0;
                          return (
                            <td key={dateStr} className="matrix-footer-cell" title={`${dateStr}: ${present}/${total} talaba kelgan`}>
                              <span className="footer-present-num">{present}</span>
                              <span className="footer-total-sub">/{total}</span>
                            </td>
                          );
                        })}
                        <td colSpan={6} className="matrix-footer-blank" />
                      </tr>

                      <tr className="matrix-footer-row row-rates">
                        <td className="sticky-col-rank font-bold" colSpan={2}>
                          Kunlik davomat foizi
                        </td>
                        {monthLessonDates.map((dateStr) => {
                          const rec = journalRecordsByDate[dateStr];
                          const rate = rec?.rate || 0;
                          return (
                            <td key={dateStr} className="matrix-footer-cell" title={`${dateStr}: ${rate}% davomat`}>
                              <span className={`footer-rate-pill ${rate >= 90 ? 'good' : rate >= 70 ? 'avg' : 'bad'}`}>
                                {rate}%
                              </span>
                            </td>
                          );
                        })}
                        <td colSpan={6} className="matrix-footer-blank" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. VIEW MODE B: OYLIK KALENDAR KO'RINISHI */}
          {journalViewMode === 'calendar' && (
            <div className="glass-card journal-cal-card">
              <div className="journal-cal-header-bar">
                <h4 className="journal-cal-title">
                  {UZBEK_MONTHS[journalMonth]} {journalYear} — Darslar Kalendari
                </h4>
                <span className="journal-cal-stats-badge">
                  Ushbu oyda o'tilgan: <strong>{monthLessonDates.length} ta dars</strong>
                </span>
              </div>

              <div className="journal-cal-weekdays">
                {WEEKDAYS.map((wd, colIdx) => {
                  const colType = colIdx === 6 ? 'hdr-sunday' : (colIdx === 0 || colIdx === 2 || colIdx === 4) ? 'hdr-toq' : 'hdr-juft';
                  return (
                    <div key={wd} className={`journal-cal-weekday-name ${colType}`}>{wd}</div>
                  );
                })}
              </div>

              <div className="journal-cal-grid">
                {journalCalendarDays.map((d, idx) => {
                  const m = String(d.month + 1).padStart(2, '0');
                  const dayStr = String(d.day).padStart(2, '0');
                  const fullDateStr = `${d.year}-${m}-${dayStr}`;
                  const session = journalRecordsByDate[fullDateStr];
                  const isToday = fullDateStr === getTodayDateString();
                  const isSunday = (idx % 7) === 6;
                  const rateStatusClass = session
                    ? session.rate >= 90
                      ? 'has-attendance-good'
                      : session.rate >= 70
                      ? 'has-attendance-avg'
                      : 'has-attendance-bad'
                    : '';

                  const isFuture = fullDateStr > getTodayDateString();
                  const hasRecordedSession = session && session.totalMarked > 0;

                  return (
                    <div
                      key={idx}
                      className={`journal-cal-cell ${isSunday ? 'day-sunday' : 'day-weekday'} ${!d.isCurrentMonth ? 'other-month' : ''} ${isFuture ? 'future-cell' : ''} ${isToday ? 'today-cell' : ''} ${hasRecordedSession ? `has-attendance-cell ${rateStatusClass}` : ''}`}
                      onClick={() => {
                        if (hasRecordedSession) {
                          setSelectedDayDetail(session);
                        } else {
                          if (isFuture) {
                            showToast("Bo'lajak sanalar uchun davomat olib bo'lmaydi!", "warning");
                            return;
                          }
                          setSelectedDate(fullDateStr);
                          setCalendarViewYear(d.year);
                          setCalendarViewMonth(d.month);
                          setActiveTab('mark');
                        }
                      }}
                      title={isFuture && !hasRecordedSession ? "Bo'lajak sana" : undefined}
                    >
                      <div className="cell-top-bar">
                        <span className="cell-day-num">{d.day}</span>
                        {isToday && <span className="cell-today-pill">Bugun</span>}
                      </div>

                      {hasRecordedSession ? (
                        <div className="cell-session-info">
                          <span className="pill-metric pill-green">{session.present}</span>
                          {session.excused > 0 && <span className="pill-metric pill-blue">{session.excused}</span>}
                          {session.absent > 0 && <span className="pill-metric pill-red">{session.absent}</span>}
                          {session.late > 0 && <span className="pill-metric pill-amber">{session.late}</span>}
                        </div>
                      ) : (d.isCurrentMonth && !isFuture) ? (
                        <div className="cell-empty-hint">
                          <span className="add-icon">+</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Attendance & Absent Days Modal */}
      {studentHistoryDetails && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedStudentHistoryModal(null)}>
          <div className="modal-content glass student-absent-history-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setSelectedStudentHistoryModal(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="student-modal-header">
              <div className="avatar-circle student-modal-avatar" style={{ background: studentHistoryDetails.student.color }}>
                {renderAvatar(studentHistoryDetails.student.emoji)}
              </div>
              <div className="student-modal-info">
                <h3 className="student-modal-title">{studentHistoryDetails.student.name}</h3>
                <p className="student-modal-subtitle">
                  {selectedGroup?.name || 'Guruh'} • Davr: {timeframe === 'all' ? 'Kurs davomida' : `${UZBEK_MONTHS[journalMonth]} ${journalYear}`}
                </p>
              </div>
            </div>

            {/* Modal KPI Mini Row */}
            <div className="student-modal-kpi-row">
              <div className="kpi-mini-card">
                <span className="lbl">Jami Darslar</span>
                <span className="val">{studentHistoryDetails.total} ta</span>
              </div>
              <div className="kpi-mini-card card-present">
                <span className="lbl">Qatnashgan</span>
                <span className="val text-positive">
                  {studentHistoryDetails.presentDays.length}
                </span>
              </div>
              <div className="kpi-mini-card card-excused">
                <span className="lbl">Sababli</span>
                <span className="val" style={{ color: '#2563EB' }}>
                  {studentHistoryDetails.excusedDays.length}
                </span>
              </div>
              <div className="kpi-mini-card card-absent">
                <span className="lbl">Qoldirilgan</span>
                <span className="val text-negative">
                  {studentHistoryDetails.absentDays.length}
                </span>
              </div>
              <div className="kpi-mini-card card-late">
                <span className="lbl">Kechikkan</span>
                <span className="val">
                  {studentHistoryDetails.lateDays.length}
                </span>
              </div>
              <div className="kpi-mini-card">
                <span className="lbl">Davomat</span>
                <span className="val font-bold">{studentHistoryDetails.total > 0 ? `${studentHistoryDetails.rate}%` : '—'}</span>
              </div>
            </div>

            {/* Qoldirilgan Darslar Ro'yxati */}
            <div className="student-modal-section">
              <h4 className="student-modal-section-title">
                Qoldirilgan darslar ({studentHistoryDetails.absentDays.length} ta)
              </h4>

              {studentHistoryDetails.total === 0 ? (
                <div className="all-present-notice info-notice">
                  <div className="notice-text">
                    <strong>Hali davomat qilinmagan</strong>
                    <p>Talabaga tanlangan davrda hali davomat belgilanmagan.</p>
                  </div>
                </div>
              ) : studentHistoryDetails.absentDays.length > 0 ? (
                <div className="absent-days-list">
                  {studentHistoryDetails.absentDays.map((item) => (
                    <div key={item.date} className="absent-day-item">
                      <div className="absent-date-left">
                        <IconCalendar size={14} />
                        <span className="date-text font-bold">{formatDisplayDate(item.date)}</span>
                      </div>
                      <span className="absent-badge">
                        Darsga kelmagan
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="all-present-notice">
                  <div className="notice-text">
                    <strong>Ajoyib natija!</strong>
                    <p>Talaba tanlangan davrda hech qanday darsni qoldirmagan.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sababli Darslar Ro'yxati */}
            {studentHistoryDetails.excusedDays.length > 0 && (
              <div className="student-modal-section">
                <h4 className="student-modal-section-title">
                  Sababli qoldirilgan darslar ({studentHistoryDetails.excusedDays.length} ta)
                </h4>
                <div className="excused-days-list">
                  {studentHistoryDetails.excusedDays.map((item) => (
                    <div key={item.date} className="excused-day-item">
                      <div className="absent-date-left">
                        <IconCalendar size={14} />
                        <span className="date-text font-bold">{formatDisplayDate(item.date)}</span>
                      </div>
                      <span className="excused-badge">
                        Sababli qoldirilgan
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kechikkan Darslar Ro'yxati (agar mavjud bo'lsa) */}
            {studentHistoryDetails.lateDays.length > 0 && (
              <div className="student-modal-section">
                <h4 className="student-modal-section-title">
                  Kechikkan darslar ({studentHistoryDetails.lateDays.length} ta)
                </h4>
                <div className="late-days-list">
                  {studentHistoryDetails.lateDays.map((item) => (
                    <div key={item.date} className="late-day-item">
                      <div className="absent-date-left">
                        <IconCalendar size={14} />
                        <span className="date-text font-bold">{formatDisplayDate(item.date)}</span>
                      </div>
                      <span className="late-badge">
                        Kechikib kelgan
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setSelectedStudentHistoryModal(null)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Selected Day Attendance Details Modal */}
      {selectedDayDetail && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedDayDetail(null)}>
          <div className="modal-content glass journal-day-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setSelectedDayDetail(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="journal-modal-header">
              <h3 className="modal-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <IconCalendar size={18} />
                <span>{formatDisplayDate(selectedDayDetail.date)}</span>
              </h3>
              <p className="modal-subtitle">Guruh davomat tafsilotlari</p>
            </div>

            <div className="journal-modal-metrics">
              <div className="modal-metric-box">
                <span className="metric-lbl">Kelgan</span>
                <span className="metric-val text-positive">
                  {selectedDayDetail.present}
                </span>
              </div>
              <div className="modal-metric-box">
                <span className="metric-lbl">Sababli</span>
                <span className="metric-val" style={{ color: '#2563EB' }}>
                  {selectedDayDetail.excused || 0}
                </span>
              </div>
              <div className="modal-metric-box">
                <span className="metric-lbl">Kelmagan</span>
                <span className="metric-val text-negative">
                  {selectedDayDetail.absent}
                </span>
              </div>
              <div className="modal-metric-box">
                <span className="metric-lbl">Kechikkan</span>
                <span className="metric-val">
                  {selectedDayDetail.late}
                </span>
              </div>
              <div className="modal-metric-box">
                <span className="metric-lbl">Davomad %</span>
                <span className="metric-val font-bold">{selectedDayDetail.rate}%</span>
              </div>
            </div>

            <div className="journal-modal-students-scroll">
              {(selectedDayDetail.studentsList || []).length > 0 ? (
                selectedDayDetail.studentsList.map((student) => {
                  const status = selectedDayDetail.records?.[student.id];
                  return (
                    <div key={student.id} className="journal-modal-student-row">
                      <div className="student-info-left">
                        <div className="avatar-circle table-avatar" style={{ background: student.color, width: 28, height: 28, fontSize: '0.9rem' }}>
                          {renderAvatar(student.emoji)}
                        </div>
                        <span className="student-name font-bold">{student.name}</span>
                      </div>
                      <div className="student-status-badge-wrap">
                        {status === 'present' ? (
                          <span className="badge-status present">
                            Keldi
                          </span>
                        ) : status === 'excused' ? (
                          <span className="badge-status excused">
                            Sababli
                          </span>
                        ) : status === 'absent' ? (
                          <span className="badge-status absent">
                            Kelmadi
                          </span>
                        ) : status === 'late' ? (
                          <span className="badge-status late">
                            Kechikdi
                          </span>
                        ) : (
                          <span className="badge-status" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
                            Belgilanmagan
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>Ushbu darsda o'quvchilar belgilanmagan.</p>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => {
                  const targetDate = sanitizeAttendanceDate(selectedDayDetail.date);
                  setSelectedDate(targetDate);
                  syncCalendarViewWithDate(targetDate);
                  setActiveTab('mark');
                  setSelectedDayDetail(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Tahrirlash / Belgilash</span>
              </button>
              <button
                type="button"
                className="btn btn-danger scale-active"
                onClick={() => {
                  setConfirmDeleteDate(selectedDayDetail.date);
                  setSelectedDayDetail(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconTrash size={15} />
                <span>O'chirish</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteDate && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmDeleteDate(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setConfirmDeleteDate(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title">Davomadni o'chirish</h3>
            <p className="modal-warning-text">
              <strong>{formatDisplayDate(confirmDeleteDate)}</strong> kunidagi barcha davomad yozuvini o'chirmoqchimisiz?
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setConfirmDeleteDate(null)}>
                Orqaga
              </button>
              <button className="btn btn-danger scale-active" onClick={handleDeleteDateConfirmed}>
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .attendance-container {
          animation: fade-in 0.4s ease-out;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .transferred-student-tag {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          background: #F3F4F6;
          color: #6B7280;
          border: 1px solid rgba(0, 0, 0, 0.08);
          margin-left: 6px;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        }
        [data-theme="dark"] .transferred-student-tag {
          background: rgba(255, 255, 255, 0.08);
          color: #9CA3AF;
          border-color: rgba(255, 255, 255, 0.12);
        }

        .tab-control-brutalist {
          display: inline-flex;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .tab-btn-brutalist {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .tab-btn-brutalist:hover {
          color: var(--text-primary);
        }

        .tab-btn-brutalist.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }

        /* Filters Toolbar */
        .filters-toolbar {
          position: relative;
          z-index: 100;
          padding: 14px 18px;
          display: flex;
          align-items: flex-end;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
          max-width: 320px;
          flex: 0 1 320px;
        }

        .filter-date-item {
          flex: 1 1 360px;
          max-width: 440px;
        }

        .filter-right-item {
          flex: 0 0 auto;
          min-width: unset;
        }

        .custom-select-container {
          position: relative;
          width: 100%;
        }

        .custom-select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 990;
          background: transparent;
        }

        .filter-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 14px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .filter-select-btn:hover {
          border-color: var(--apple-blue);
        }

        .dropdown-arrow {
          font-size: 0.65rem;
          margin-left: 6px;
        }

        .custom-dropdown-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 100%;
          max-height: 240px;
          overflow-y: auto;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        .custom-dropdown-item {
          padding: 10px 14px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          border-bottom: 1px solid var(--border-color-subtle);
          transition: background var(--transition-fast);
        }

        .custom-dropdown-item:hover, .custom-dropdown-item.active {
          background: #F5F5F7;
          color: var(--apple-blue);
          font-weight: 700;
        }

        .date-picker-row {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          min-width: 0;
        }

        .date-input-container {
          flex: 1;
          min-width: 0;
        }

        .date-input-container .filter-select-btn {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .date-input-container .filter-select-btn span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-date-nav {
          width: 38px;
          height: 38px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-date-nav:hover {
          background: #F5F5F7;
        }

        .btn-today-quick {
          height: 38px;
          padding: 0 14px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .btn-today-quick.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        /* Calendar Popup in Mark View */
        .custom-calendar-popup {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 290px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          padding: 14px;
        }

        .calendar-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 0.88rem;
          margin-bottom: 10px;
        }

        .cal-nav-btn {
          background: #F5F5F7;
          border: none;
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.72rem;
          transition: all var(--transition-fast);
        }

        .cal-nav-btn:hover {
          background: #E5E5EA;
        }

        .calendar-weekdays-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          text-align: center;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-tertiary);
          margin-bottom: 6px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
        }

        .cal-weekday {
          padding: 3px 0;
          border-radius: var(--radius-sm);
        }

        .cal-weekday.hdr-toq {
          color: #0071E3;
          background: #EFF6FF;
          font-weight: 700;
          border: 1px solid rgba(0, 113, 227, 0.15);
        }

        .cal-weekday.hdr-juft {
          color: #059669;
          background: #ECFDF5;
          font-weight: 700;
          border: 1px solid rgba(5, 150, 105, 0.15);
        }

        .cal-weekday.hdr-sunday {
          color: #DC2626;
          background: #FEF2F2;
          font-weight: 700;
          border: 1px solid rgba(220, 38, 38, 0.15);
        }

        .cal-day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0, 0, 0, 0.06);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-width: 0;
        }

        .cal-day-cell.day-sunday {
          color: #DC2626;
        }

        .cal-day-cell:hover {
          background: #F5F5F7;
        }

        .cal-day-cell.selected {
          background: #1D1D1F !important;
          color: #FFFFFF !important;
          border-color: #1D1D1F !important;
        }

        .cal-day-cell.today {
          border-color: var(--apple-blue) !important;
          font-weight: 700;
        }

        .cal-day-cell.other-month {
          color: var(--text-tertiary) !important;
          opacity: 0.4;
        }

        .cal-day-cell.future-day {
          opacity: 0.6;
        }

        .cal-day-cell.future-day:hover {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.35);
        }

        .calendar-footer-bar {
          margin-top: 10px;
          display: flex;
          justify-content: center;
        }

        .cal-today-btn {
          font-size: 0.76rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          border: 1px solid #D2D2D7;
          background: #FFFFFF;
          cursor: pointer;
        }

        /* Segmented Control */
        .segmented-control {
          display: inline-flex;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .seg-btn {
          padding: 7px 14px;
          border: none;
          background: transparent;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .seg-btn:last-child {
          border-right: none;
        }

        .seg-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }

        /* TAB 1: MARK ATTENDANCE */
        /* Search & Insight Bar in Mark View */
        .attendance-search-filter-bar {
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .attendance-search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 240px;
        }

        .attendance-search-input-wrap .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .attendance-search-input {
          width: 100%;
          padding: 9px 34px 9px 36px;
          border-radius: var(--radius-md);
          border: 1px solid #D2D2D7;
          background: #F5F5F7;
          font-size: 0.86rem;
          font-weight: 500;
          color: var(--text-primary);
          outline: none;
          transition: all var(--transition-fast);
        }

        .attendance-search-input:focus {
          background: #FFFFFF;
          border-color: var(--apple-blue);
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
        }

        .search-clear-btn {
          position: absolute;
          right: 10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E5E5EA;
          color: #666666;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .search-clear-btn:hover {
          background: #D1D1D6;
          color: #000000;
        }

        .prev-absent-info-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #F5F5F7;
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 500;
          user-select: none;
          pointer-events: none;
          flex-shrink: 0;
        }

        .prev-absent-info-badge strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .prev-absent-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #F59E0B;
          flex-shrink: 0;
        }

        .student-name-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .prev-absent-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid rgba(220, 38, 38, 0.18);
          border-radius: var(--radius-full);
          padding: 2px 8px;
          white-space: nowrap;
        }

        .future-join-tag {
          color: #2563EB;
          background: #EFF6FF;
          border-color: rgba(37, 99, 235, 0.2);
        }

        .quick-actions-bar {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .quick-actions-btns {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quick-actions-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .summary-pill {
          font-size: 0.76rem;
          padding: 3px 9px;
          border-radius: var(--radius-full);
          font-weight: 500;
          background: #F1F5F9;
          color: #475569;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .summary-pill strong {
          font-weight: 700;
        }

        .summary-pill.pill-present {
          background: #ECFDF5;
          color: #059669;
          border-color: #A7F3D0;
        }

        .summary-pill.pill-absent {
          background: #FEF2F2;
          color: #DC2626;
          border-color: #FECDD3;
        }

        .summary-pill.pill-late {
          background: #FFFBEB;
          color: #D97706;
          border-color: #FDE68A;
        }

        .summary-pill.pill-excused {
          background: #EFF6FF;
          color: #2563EB;
          border-color: #BFDBFE;
        }

        .save-att-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          padding: 7px 18px;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
          color: #FFFFFF !important;
          border: 1px solid #059669 !important;
          border-radius: var(--radius-sm);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .save-att-btn:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          border-color: #047857 !important;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);
        }

        .save-att-btn:active {
          opacity: 0.9;
        }

        .quick-actions-save-wrapper {
          display: flex;
          align-items: center;
        }

        .students-attendance-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .student-attendance-row {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition-fast);
          content-visibility: auto;
          contain-intrinsic-size: 0 72px;
        }

        @media (hover: hover) and (pointer: fine) {
          .student-attendance-row:hover {
            box-shadow: var(--shadow-md);
          }
        }

        .student-info-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .student-avatar-circle {
          width: 44px;
          height: 44px;
          font-size: 1.4rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
        }

        .student-name {
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .attendance-options-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          min-width: 350px;
          justify-content: flex-end;
        }

        .att-status-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 12px;
          min-width: 78px;
          font-size: 0.82rem;
          font-weight: 600;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
        }

        .att-status-btn:hover {
          background: #F5F5F7;
        }

        .att-status-btn.present.active {
          background: #ECFDF5;
          color: #059669;
          border-color: #A7F3D0;
          font-weight: 700;
        }

        .att-status-btn.excused.active {
          background: #EFF6FF;
          color: #2563EB;
          border-color: #BFDBFE;
          font-weight: 700;
        }

        .att-status-btn.absent.active {
          background: #FEF2F2;
          color: #DC2626;
          border-color: #FECACA;
          font-weight: 700;
        }

        .att-status-btn.late.active {
          background: #FFFBEB;
          color: #D97706;
          border-color: #FDE68A;
          font-weight: 700;
        }

        .att-status-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }

        .quick-actions-bar .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }

        .row-future-disabled {
          opacity: 0.82;
        }

        /* FUTURE DATE WARNING BANNER */
        .attendance-future-warning-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: var(--radius-lg);
          color: #92400E;
          margin-bottom: 4px;
          box-shadow: var(--shadow-sm);
          animation: fade-in 0.3s ease-out;
          flex-wrap: wrap;
        }

        [data-theme="dark"] .attendance-future-warning-banner {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.28);
          color: #FDE68A;
        }

        .warning-banner-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1 1 320px;
        }

        .warning-banner-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #D97706;
        }

        [data-theme="dark"] .warning-banner-icon {
          background: rgba(245, 158, 11, 0.25);
          color: #FBBF24;
        }

        .warning-banner-title {
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 2px;
          color: inherit;
        }

        .warning-banner-desc {
          font-size: 0.82rem;
          line-height: 1.35;
          opacity: 0.92;
          color: inherit;
        }

        .btn-warning-quick {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F59E0B;
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-md);
          padding: 8px 16px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }

        .btn-warning-quick:hover {
          background: #D97706;
        }

        /* TAB 2: JOURNAL CALENDAR (MINIMALIST) */
        .journal-cal-card {
          padding: 20px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .journal-cal-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .journal-cal-heading-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .journal-cal-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }

        .journal-cal-stats-badge {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: #F5F5F7;
        }

        .journal-cal-nav-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cal-nav-action-btn {
          padding: 7px 14px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .cal-nav-action-btn:hover {
          background: #F5F5F7;
        }

        /* Schedule Legend */
        .calendar-schedule-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
          padding: 8px 14px;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
          flex-wrap: wrap;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-dot.toq {
          background: #0071E3;
        }

        .legend-dot.juft {
          background: #34C759;
        }

        .legend-dot.sunday {
          background: #FF3B30;
        }

        .journal-cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          text-align: center;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
          padding-bottom: 8px;
          gap: 6px;
        }

        .journal-cal-weekday-name {
          padding: 7px 0;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          letter-spacing: 0.01em;
        }

        .journal-cal-weekday-name.hdr-toq {
          color: #0071E3;
          background: #EFF6FF;
          border: 1px solid rgba(0, 113, 227, 0.18);
        }

        .journal-cal-weekday-name.hdr-juft {
          color: #059669;
          background: #ECFDF5;
          border: 1px solid rgba(5, 150, 105, 0.18);
        }

        .journal-cal-weekday-name.hdr-sunday {
          color: #E11D48;
          background: #FFE4E6;
          border: 1px solid rgba(225, 29, 72, 0.18);
        }

        .journal-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }

        .journal-cal-cell {
          min-height: 92px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-md);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: border-color var(--transition-fast), background var(--transition-fast);
          position: relative;
        }

        .journal-cal-cell:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .journal-cal-cell.day-weekday {
          background: #FFFFFF;
          border-color: #E5E7EB;
        }

        .journal-cal-cell.day-weekday:hover {
          background: #F9FAFB;
          border-color: #CBD5E1;
        }

        .journal-cal-cell.day-sunday {
          background: #FFF8F8;
          border-color: #FECDD3;
        }

        .journal-cal-cell.day-sunday:hover {
          background: #FFE4E6;
          border-color: #FDA4AF;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.08);
        }

        .journal-cal-cell.day-sunday .cell-day-num {
          color: #E11D48;
        }

        .journal-cal-cell.has-attendance-cell {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .journal-cal-cell.has-attendance-cell.has-attendance-good {
          background: #F0FDF4;
          border: 1.5px solid #86EFAC;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.08);
        }

        .journal-cal-cell.has-attendance-cell.has-attendance-good:hover {
          background: #DCFCE7;
          border-color: #4ADE80;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.14);
        }

        .journal-cal-cell.has-attendance-cell.has-attendance-avg {
          background: #FFFBEB;
          border: 1.5px solid #FCD34D;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);
        }

        .journal-cal-cell.has-attendance-cell.has-attendance-avg:hover {
          background: #FEF3C7;
          border-color: #F59E0B;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.14);
        }

        .journal-cal-cell.has-attendance-cell.has-attendance-bad {
          background: #FEF2F2;
          border: 1.5px solid #FCA5A5;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
        }

        .journal-cal-cell.has-attendance-cell.has-attendance-bad:hover {
          background: #FEE2E2;
          border-color: #EF4444;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.14);
        }

        .journal-cal-cell.other-month {
          opacity: 0.32;
        }

        .journal-cal-cell.future-cell {
          opacity: 0.55;
          cursor: not-allowed;
          background: #FAFAFC;
        }

        .journal-cal-cell.future-cell:hover {
          transform: none;
          box-shadow: none;
          border-color: rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] .journal-cal-cell.future-cell {
          background: rgba(255, 255, 255, 0.02);
        }

        .journal-cal-cell.today-cell {
          border: 2px solid #0071E3 !important;
          box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.18), 0 4px 12px rgba(0, 113, 227, 0.12) !important;
        }

        .cell-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          min-width: 0;
          gap: 4px;
        }

        .cell-day-num {
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cell-today-pill {
          font-size: 0.64rem;
          font-weight: 800;
          background: #0071E3;
          color: #FFFFFF;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .cell-rate-pill {
          font-size: 0.74rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          font-variant-numeric: tabular-nums;
        }

        .cell-rate-pill.good {
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #86EFAC;
        }

        .cell-rate-pill.avg {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FCD34D;
        }

        .cell-rate-pill.bad {
          background: #FEE2E2;
          color: #B91C1C;
          border: 1px solid #FCA5A5;
        }

        .cell-session-info {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }

        .pill-metric {
          font-size: 0.74rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          min-width: 18px;
          text-align: center;
          line-height: 1.2;
          font-variant-numeric: tabular-nums;
        }

        .pill-green {
          background: #10B981;
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(16, 185, 129, 0.25);
        }

        .pill-blue {
          background: #3B82F6;
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.25);
        }

        .pill-red {
          background: #EF4444;
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(239, 68, 68, 0.25);
        }

        .pill-amber {
          background: #F59E0B;
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(245, 158, 11, 0.25);
        }

        .cell-empty-hint {
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .journal-cal-cell:hover .cell-empty-hint {
          opacity: 0.75;
        }

        .add-icon {
          font-size: 1.15rem;
          font-weight: 700;
          color: #94A3B8;
        }

        /* Day Details Modal */
        .journal-day-modal {
          max-width: 520px;
          width: 92%;
          padding: 24px;
        }

        .journal-modal-header {
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .journal-modal-header .modal-title {
          margin: 0 0 4px 0;
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .journal-modal-header .modal-subtitle {
          margin: 0;
          font-size: 0.84rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .journal-modal-metrics {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }

        .modal-metric-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 6px;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .modal-metric-box .metric-lbl {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .modal-metric-box .metric-val {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .journal-modal-students-scroll {
          max-height: 260px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .journal-modal-student-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
        }

        .badge-status {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: var(--radius-full);
        }

        .badge-status.present {
          background: #ECFDF5;
          color: #059669;
        }

        .badge-status.excused {
          background: #EFF6FF;
          color: #2563EB;
        }

        .badge-status.absent {
          background: #FEF2F2;
          color: #DC2626;
        }

        .badge-status.late {
          background: #FFFBEB;
          color: #D97706;
        }

        .badge-status.none {
          background: #F5F5F7;
          color: var(--text-tertiary);
        }

        /* Section 2: Student Stats Combined Card */
        .student-stats-combined-card {
          margin-top: 8px;
        }

        .stats-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .stats-section-header .section-title {
          margin: 0;
        }

        /* Month Jump Toolbar & Popover */
        .month-jump-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .month-jump-nav {
          display: inline-flex;
          align-items: center;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .month-nav-arrow-btn {
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          width: 30px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: background-color var(--transition-fast), color var(--transition-fast);
          touch-action: manipulation;
        }

        .month-nav-arrow-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: var(--text-primary);
        }

        .month-picker-wrapper {
          position: relative;
        }

        .month-picker-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
          white-space: nowrap;
        }

        .month-picker-trigger:hover {
          color: var(--text-primary);
        }

        .month-picker-trigger.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .month-picker-chevron {
          transition: transform 0.2s ease;
          color: var(--text-secondary);
        }

        .month-picker-chevron.open {
          transform: rotate(180deg);
        }

        .stats-month-picker-popup {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 270px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          padding: 14px;
        }

        .month-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 0.88rem;
          margin-bottom: 12px;
        }

        .month-picker-year-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .month-picker-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }

        .month-picker-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 8px 4px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          background: #F8F9FA;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .month-picker-cell:hover {
          background: #EAEAEA;
          color: var(--text-primary);
        }

        .month-picker-cell.selected {
          background: #1D1D1F !important;
          color: #FFFFFF !important;
          border-color: #1D1D1F !important;
        }

        .month-picker-cell.current-month:not(.selected) {
          border-color: #2563EB;
          color: #2563EB;
          font-weight: 700;
        }

        .month-has-data-dot {
          position: absolute;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10B981;
        }

        .month-picker-footer {
          display: flex;
          justify-content: center;
          padding-top: 8px;
          border-top: 1px solid var(--border-color);
        }

        .month-picker-today-btn {
          background: transparent;
          border: none;
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563EB;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .month-picker-today-btn:hover {
          background: rgba(37, 99, 235, 0.08);
          text-decoration: underline;
        }

        .month-empty-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #F8FAFC;
          border: 1px dashed rgba(0, 0, 0, 0.12);
          border-radius: var(--radius-md);
          margin-bottom: 16px;
          font-size: 0.83rem;
          color: var(--text-secondary);
        }

        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }

        .stats-kpi-grid.inside-section {
          margin-bottom: 18px;
        }

        @media (max-width: 900px) {
          .stats-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        .stats-kpi-card {
          padding: 14px 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-label {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .kpi-value {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .section-container {
          padding: 20px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0 0 14px 0;
        }

        .table-responsive-brutalist {
          overflow-x: auto;
        }

        .brutalist-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.86rem;
        }

        .brutalist-table th {
          padding: 10px 14px;
          background: #FAFAFC;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: left;
        }

        .brutalist-table th.sortable-th {
          cursor: pointer;
          user-select: none;
          transition: background var(--transition-fast), color var(--transition-fast);
          white-space: nowrap;
        }

        .brutalist-table th.sortable-th:hover {
          background: #F1F3F9;
          color: var(--text-primary);
        }

        .brutalist-table th.sortable-th.active-sort {
          color: var(--primary-color, #4F46E5);
          background: rgba(79, 70, 229, 0.07);
          font-weight: 700;
        }

        .th-sort-content {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .sort-icon {
          display: inline-flex;
          align-items: center;
          opacity: 0.45;
          font-size: 0.72rem;
          transition: opacity 0.15s ease;
        }

        .sortable-th.active-sort .sort-icon {
          opacity: 1;
          color: var(--primary-color, #4F46E5);
        }

        .mobile-stats-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }

        .mobile-stats-count {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .mobile-sort-select-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .mobile-sort-icon {
          font-size: 0.82rem;
          color: var(--text-tertiary);
        }

        .mobile-sort-select {
          padding: 6px 10px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-primary);
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          outline: none;
          cursor: pointer;
        }

        .mobile-card-rank {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-tertiary);
          min-width: 24px;
        }

        .brutalist-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color-subtle);
        }

        .table-student-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .table-avatar {
          width: 32px;
          height: 32px;
          font-size: 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
        }

        .empty-state, .empty-history {
          padding: 48px 24px;
          text-align: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .rate-pill {
          font-size: 0.78rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-full);
        }

        .rate-pill.good {
          background: #ECFDF5;
          color: #059669;
        }

        .rate-pill.avg {
          background: #FFFBEB;
          color: #D97706;
        }

        .rate-pill.bad {
          background: #FEF2F2;
          color: #DC2626;
        }

        .rate-pill.empty {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-muted);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .clickable-row {
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .clickable-row:hover {
          background: #FAFAFC;
        }

        .student-name-link {
          color: var(--text-primary);
          font-weight: 600;
          transition: color var(--transition-fast);
        }

        .clickable-row:hover .student-name-link {
          color: var(--apple-blue);
        }

        .badge-present-pill {
          display: inline-block;
          font-size: 0.84rem;
          font-weight: 700;
          color: #059669;
          background: #ECFDF5;
          border: 1px solid rgba(5, 150, 105, 0.15);
          border-radius: var(--radius-full);
          padding: 2px 10px;
          min-width: 24px;
          text-align: center;
        }

        .badge-excused-pill {
          display: inline-block;
          font-size: 0.84rem;
          font-weight: 700;
          color: #2563EB;
          background: #EFF6FF;
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: var(--radius-full);
          padding: 2px 10px;
          min-width: 24px;
          text-align: center;
        }

        .badge-absent-pill {
          display: inline-block;
          font-size: 0.84rem;
          font-weight: 700;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: var(--radius-full);
          padding: 2px 10px;
          min-width: 24px;
          text-align: center;
        }

        .badge-late-pill {
          display: inline-block;
          font-size: 0.84rem;
          font-weight: 700;
          color: #D97706;
          background: #FFFBEB;
          border: 1px solid rgba(217, 119, 6, 0.15);
          border-radius: var(--radius-full);
          padding: 2px 10px;
          min-width: 24px;
          text-align: center;
        }

        /* Student Attendance & Absent Days Modal */
        .student-absent-history-modal {
          max-width: 520px;
          width: 92%;
          padding: 24px;
        }

        .student-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
        }

        .student-modal-avatar {
          width: 48px;
          height: 48px;
          font-size: 1.6rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }

        .student-modal-info {
          flex: 1;
          min-width: 0;
        }

        .student-modal-title {
          margin: 0 0 2px 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .student-modal-subtitle {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .student-modal-kpi-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }

        .kpi-mini-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .kpi-mini-card.card-present {
          background: #ECFDF5;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .kpi-mini-card.card-present .lbl {
          color: #065F46;
        }

        .kpi-mini-card.card-present .val {
          color: #059669;
        }

        .kpi-mini-card.card-excused {
          background: #EFF6FF;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        .kpi-mini-card.card-excused .lbl {
          color: #1E40AF;
        }

        .kpi-mini-card.card-excused .val {
          color: #2563EB;
        }

        .kpi-mini-card.card-absent {
          background: #FEF2F2;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .kpi-mini-card.card-absent .lbl {
          color: #991B1B;
        }

        .kpi-mini-card.card-absent .val {
          color: #DC2626;
        }

        .kpi-mini-card.card-late {
          background: #FFFBEB;
          border: 1px solid rgba(217, 119, 6, 0.2);
        }

        .kpi-mini-card.card-late .lbl {
          color: #92400E;
        }

        .kpi-mini-card.card-late .val {
          color: #D97706;
        }

        .kpi-mini-card .lbl {
          font-size: 0.66rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: center;
        }

        .kpi-mini-card .val {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .student-modal-section {
          margin-bottom: 16px;
        }

        .student-modal-section-title {
          font-size: 0.86rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }

        .absent-days-list, .late-days-list, .excused-days-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }

        .absent-day-item, .late-day-item, .excused-day-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
        }

        .absent-date-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-icon {
          font-size: 0.95rem;
        }

        .date-text {
          font-size: 0.86rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .absent-badge {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 2px 8px;
          background: #FEF2F2;
          color: #DC2626;
          border-radius: var(--radius-full);
        }

        .excused-badge {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 2px 8px;
          background: #EFF6FF;
          color: #2563EB;
          border-radius: var(--radius-full);
        }

        .late-badge {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 2px 8px;
          background: #FFFBEB;
          color: #D97706;
          border-radius: var(--radius-full);
        }

        .all-present-notice {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #ECFDF5;
          border-radius: var(--radius-md);
          border: 1px solid #A7F3D0;
        }

        .notice-icon {
          font-size: 1.6rem;
        }

        .notice-text strong {
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          color: #065F46;
          margin-bottom: 2px;
        }

        .notice-text p {
          margin: 0;
          font-size: 0.8rem;
          color: #047857;
          font-weight: 500;
        }

        .all-present-notice.info-notice {
          background: #EFF6FF;
          border-color: #BFDBFE;
        }

        .all-present-notice.info-notice .notice-text strong {
          color: #1D4ED8;
        }

        .all-present-notice.info-notice .notice-text p {
          color: #2563EB;
        }

        /* Mobile Student Stat Cards (hidden on desktop) */
        .student-stats-mobile-list {
          display: none;
        }

        .student-stat-mobile-card {
          padding: 12px 14px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
        }

        .student-stat-mobile-card:active {
          transform: scale(0.99);
        }

        .stat-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .stat-card-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          color: var(--text-tertiary);
        }

        .stat-card-metrics {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          padding-top: 8px;
          border-top: 1px solid var(--border-color-subtle);
        }

        .mobile-metric-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5px 2px;
          border-radius: var(--radius-sm);
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .mobile-metric-item .m-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .mobile-metric-item .m-val {
          font-size: 0.88rem;
          font-weight: 700;
          margin-top: 1px;
        }

        .mobile-metric-item.metric-present {
          background: #ECFDF5;
          border-color: rgba(5, 150, 105, 0.15);
        }
        .mobile-metric-item.metric-present .m-label { color: #065F46; }
        .mobile-metric-item.metric-present .m-val { color: #059669; }

        .mobile-metric-item.metric-excused {
          background: #EFF6FF;
          border-color: rgba(37, 99, 235, 0.15);
        }
        .mobile-metric-item.metric-excused .m-label { color: #1E40AF; }
        .mobile-metric-item.metric-excused .m-val { color: #2563EB; }

        .mobile-metric-item.metric-absent {
          background: #FEF2F2;
          border-color: rgba(220, 38, 38, 0.15);
        }
        .mobile-metric-item.metric-absent .m-label { color: #991B1B; }
        .mobile-metric-item.metric-absent .m-val { color: #DC2626; }

        .mobile-metric-item.metric-late {
          background: #FFFBEB;
          border-color: rgba(217, 119, 6, 0.15);
        }
        .mobile-metric-item.metric-late .m-label { color: #92400E; }
        .mobile-metric-item.metric-late .m-val { color: #D97706; }

        .mobile-metric-item.metric-total {
          background: #F5F5F7;
        }
        .mobile-metric-item.metric-total .m-label { color: var(--text-secondary); }
        .mobile-metric-item.metric-total .m-val { color: var(--text-primary); }

        /* Print Header Banner (hidden on screen) */
        .print-header-banner {
          display: none;
        }

        /* Unified Journal Toolbar */
        .unified-journal-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          padding: 14px 18px;
          margin-bottom: 16px;
        }

        .toolbar-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .journal-group-select-container {
          position: relative;
        }

        .toolbar-group-selector-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .toolbar-group-selector-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .toolbar-group-selector-btn .group-chevron {
          color: var(--text-secondary);
          transition: transform var(--transition-fast);
        }

        .toolbar-group-selector-btn .group-chevron.open {
          transform: rotate(180deg);
        }

        .toolbar-title-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toolbar-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .toolbar-stats-chips {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbar-chip {
          font-size: 0.74rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: #F1F5F9;
          color: #475569;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .toolbar-center-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .unified-month-nav {
          display: inline-flex;
          align-items: center;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .btn-today-pill {
          background: transparent;
          border: none;
          font-size: 0.76rem;
          font-weight: 700;
          color: #2563EB;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-today-pill:hover {
          background: rgba(37, 99, 235, 0.08);
        }

        .toolbar-right-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .view-mode-segmented-control {
          display: inline-flex;
          background: #E2E8F0;
          padding: 3px;
          border-radius: var(--radius-md);
          gap: 2px;
        }

        .view-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .view-mode-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }

        .toolbar-action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-export-toolbar,
        .btn-print-toolbar {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #0F172A;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-export-toolbar:hover,
        .btn-print-toolbar:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .unified-kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        /* Matrix Table & Container */
        .matrix-journal-card {
          padding: 18px 20px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .matrix-top-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .matrix-search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 280px;
          max-width: 100%;
        }

        .matrix-search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-tertiary);
          font-size: 0.85rem;
          pointer-events: none;
        }

        .matrix-search-input {
          width: 100%;
          padding: 7px 32px 7px 32px;
          font-size: 0.82rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: #F8FAFC;
          color: var(--text-primary);
          outline: none;
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }

        .matrix-search-input:focus {
          border-color: #3B82F6;
          background: #FFFFFF;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .matrix-search-clear-btn {
          position: absolute;
          right: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .matrix-search-clear-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: var(--text-primary);
        }

        .matrix-legend {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .sort-icon-svg {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 4px;
          vertical-align: middle;
          color: var(--text-tertiary);
          transition: color var(--transition-fast);
        }

        .sort-icon-svg.active {
          color: var(--apple-blue);
        }

        .matrix-table-scroll-container {
          overflow-x: auto;
          width: 100%;
          border: 1px solid #E2E8F0;
          border-radius: var(--radius-md);
          max-height: calc(100vh - 280px);
        }

        .matrix-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.8rem;
        }

        /* Sticky header row */
        .matrix-table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #F8FAFC;
          border-bottom: 2px solid #CBD5E1;
          padding: 8px 6px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
          user-select: none;
        }

        /* Sticky # Rank Column */
        .sticky-col-rank {
          position: sticky;
          left: 0;
          z-index: 12;
          width: 38px;
          min-width: 38px;
          max-width: 38px;
          text-align: center;
          background: #FFFFFF;
          border-right: 1px solid #E2E8F0;
        }

        thead th.sticky-col-rank {
          z-index: 20;
          background: #F8FAFC;
        }

        /* Sticky Name Column */
        .sticky-col-name {
          position: sticky;
          left: 38px;
          z-index: 12;
          min-width: 170px;
          max-width: 220px;
          text-align: left;
          background: #FFFFFF;
          border-right: 2px solid #CBD5E1;
          padding: 8px 12px;
        }

        thead th.sticky-col-name {
          z-index: 20;
          background: #F8FAFC;
        }

        .col-sortable {
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .col-sortable:hover {
          background: #F1F5F9;
        }

        .col-sortable.active-sort {
          color: #2563EB;
          background: #EFF6FF;
        }

        .matrix-th-content {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .matrix-sort-caret {
          font-size: 0.72rem;
          opacity: 0.7;
        }

        /* Date Headers */
        .matrix-date-th {
          cursor: pointer;
          min-width: 36px;
          max-width: 48px;
          padding: 4px 2px;
          transition: background 0.15s;
        }

        .matrix-date-th:hover {
          background: #E2E8F0;
        }

        .matrix-date-header-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }

        .matrix-date-num {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .matrix-date-wd {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .th-sunday .matrix-date-num,
        .th-sunday .matrix-date-wd {
          color: #E11D48;
        }

        .th-has-lesson {
          background: #F0FDF4;
          border-bottom: 2px solid #86EFAC;
        }

        /* Summary Header Columns */
        .th-summary {
          min-width: 48px;
          text-align: center;
          border-left: 1px solid #E2E8F0;
          font-size: 0.74rem;
        }

        .th-summary-p {
          color: #059669;
          background: #ECFDF5;
        }

        .th-summary-s {
          color: #2563EB;
          background: #EFF6FF;
        }

        .th-summary-a {
          color: #DC2626;
          background: #FEF2F2;
        }

        .th-summary-l {
          color: #D97706;
          background: #FFFBEB;
        }

        .th-summary-total {
          color: #475569;
          background: #F8FAFC;
        }

        .th-summary-rate {
          min-width: 68px;
          color: #1E293B;
          background: #F1F5F9;
          border-left: 2px solid #CBD5E1;
        }

        /* Student Row */
        .matrix-student-row {
          transition: background 0.15s;
        }

        .matrix-student-row:hover td {
          background: #F8FAFC;
        }

        .matrix-student-row:hover .sticky-col-rank,
        .matrix-student-row:hover .sticky-col-name {
          background: #F1F5F9;
        }

        .matrix-rank-cell {
          font-weight: 700;
          color: var(--text-tertiary);
          font-size: 0.75rem;
          text-align: center;
          padding: 6px 2px;
          border-bottom: 1px solid #F1F5F9;
        }

        .matrix-name-cell {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          border-bottom: 1px solid #F1F5F9;
        }

        .student-name-flex {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .matrix-student-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .matrix-student-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #F1F5F9;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.74rem;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid rgba(0, 0, 0, 0.05);
          user-select: none;
        }

        .matrix-name-text {
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.15s;
          font-size: 0.82rem;
        }

        .matrix-name-cell:hover .matrix-name-text {
          color: #2563EB;
          text-decoration: underline;
        }

        /* Matrix Cell */
        .matrix-cell {
          text-align: center;
          padding: 6px 3px;
          border-bottom: 1px solid #F1F5F9;
          border-right: 1px solid #F1F5F9;
        }

        .matrix-cell.clickable-date-cell {
          cursor: pointer;
        }

        .matrix-cell.clickable-date-cell:hover {
          background: #F1F5F9;
        }

        /* Matrix Status Badges */
        .matrix-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 5px;
          font-size: 0.75rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          transition: all var(--transition-fast);
        }

        .matrix-badge.present {
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
        }

        .matrix-badge.absent {
          background: rgba(239, 68, 68, 0.12);
          color: #EF4444;
        }

        .matrix-badge.late {
          background: rgba(245, 158, 11, 0.12);
          color: #F59E0B;
        }

        .matrix-badge.excused {
          background: rgba(59, 130, 246, 0.12);
          color: #3B82F6;
        }

        .matrix-badge.not-member {
          background: transparent;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .matrix-badge.unmarked {
          background: transparent;
          color: var(--border-color);
        }

        /* Summary Cells */
        .matrix-summary-cell {
          text-align: center;
          padding: 6px 6px;
          border-bottom: 1px solid #F1F5F9;
          border-right: 1px solid #F1F5F9;
          font-size: 0.8rem;
        }

        .matrix-num {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          font-size: 0.82rem;
        }

        .matrix-num.num-present {
          color: #10B981;
        }

        .matrix-num.num-excused {
          color: #3B82F6;
        }

        .matrix-num.num-absent {
          color: #EF4444;
        }

        .matrix-num.num-late {
          color: #F59E0B;
        }

        .matrix-num-zero {
          color: var(--text-tertiary);
          font-size: 0.8rem;
          opacity: 0.45;
          font-variant-numeric: tabular-nums;
        }

        .matrix-num-total {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.82rem;
          font-variant-numeric: tabular-nums;
        }

        .rate-pill-minimal {
          display: inline-block;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 5px;
          font-variant-numeric: tabular-nums;
        }

        .rate-pill-minimal.good {
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
        }

        .rate-pill-minimal.avg {
          background: rgba(245, 158, 11, 0.12);
          color: #F59E0B;
        }

        .rate-pill-minimal.bad {
          background: rgba(239, 68, 68, 0.12);
          color: #EF4444;
        }

        .rate-pill-minimal.empty {
          color: var(--text-tertiary);
        }

        /* Footer Rows */
        .matrix-footer-row {
          position: sticky;
          bottom: 0;
          z-index: 11;
          font-weight: 700;
          border-top: 2px solid #CBD5E1;
        }

        .matrix-footer-row td {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding: 6px 4px;
        }

        .footer-label-cell {
          position: sticky;
          left: 0;
          z-index: 15;
          background: #F1F5F9 !important;
          border-right: 2px solid #CBD5E1;
          padding: 6px 12px;
          font-size: 0.74rem;
          color: #334155;
          text-align: left;
        }

        .matrix-footer-cell {
          text-align: center;
          font-size: 0.75rem;
          border-right: 1px solid #E2E8F0;
        }

        .footer-present-num {
          font-weight: 800;
          color: #059669;
        }

        .footer-total-sub {
          font-size: 0.65rem;
          color: #94A3B8;
          margin-left: 1px;
        }

        .footer-rate-pill {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: var(--radius-sm);
        }

        .footer-rate-pill.good {
          background: #DCFCE7;
          color: #15803D;
        }

        .footer-rate-pill.avg {
          background: #FEF3C7;
          color: #92400E;
        }

        .footer-rate-pill.bad {
          background: #FEE2E2;
          color: #B91C1C;
        }

        .footer-rate-pill.empty {
          background: #F1F5F9;
          color: #94A3B8;
        }

        .footer-grand-sum {
          text-align: center;
          font-weight: 800;
          font-size: 0.78rem;
        }

        @media (max-width: 768px) {
          .attendance-container {
            gap: 12px;
          }

          /* Header & Tab Control */
          .tab-control-brutalist {
            display: flex !important;
            width: 100% !important;
            background: #EEEEF0;
          }

          .tab-btn-brutalist {
            flex: 1 1 0px !important;
            justify-content: center !important;
            padding: 9px 6px !important;
            font-size: 0.82rem !important;
            white-space: nowrap !important;
            min-height: 40px;
          }

          /* Filters Toolbar */
          .filters-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 14px;
          }

          .filter-item {
            width: 100%;
            min-width: 0;
            flex: none;
          }

          .date-picker-row {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .date-input-container {
            flex: 1;
            min-width: 0;
          }

          .date-input-container .filter-select-btn {
            height: 38px;
            padding: 0 10px;
            font-size: 0.82rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .btn-date-nav {
            width: 38px;
            height: 38px;
            flex-shrink: 0;
          }

          .btn-today-quick {
            height: 38px;
            padding: 0 10px;
            font-size: 0.8rem;
            flex-shrink: 0;
          }

          .custom-calendar-popup {
            position: fixed;
            top: auto;
            bottom: 20px;
            left: 16px;
            right: 16px;
            width: auto;
            max-width: 340px;
            margin: 0 auto;
            z-index: 1001;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          }

          /* TAB 1: Mark View */
          .attendance-search-filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 10px 12px;
            margin-bottom: 12px;
          }

          .attendance-search-input-wrap {
            width: 100%;
            min-width: 0;
            flex: none;
          }

          .attendance-search-input {
            height: 38px;
            font-size: 0.84rem;
            padding: 8px 32px 8px 34px;
          }

          .prev-absent-info-badge {
            width: 100%;
            justify-content: center;
            font-size: 0.74rem;
            padding: 6px 10px;
            box-sizing: border-box;
          }

          .quick-actions-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 14px;
            margin-bottom: 12px;
          }

          .quick-actions-btns {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .quick-actions-btns .btn-danger {
            grid-column: 1 / -1;
          }

          .quick-actions-btns .btn {
            width: 100%;
            height: 38px;
            padding: 0 8px;
            font-size: 0.8rem;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .quick-actions-save-wrapper {
            width: 100%;
          }

          .quick-actions-save-wrapper .save-att-btn {
            width: 100%;
            height: 40px;
            font-size: 0.88rem;
            justify-content: center;
          }

          .students-attendance-list {
            gap: 10px;
          }

          .student-attendance-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px 14px;
            contain-intrinsic-size: auto 112px;
          }

          .student-info-left {
            width: 100%;
            gap: 10px;
          }

          .student-avatar-circle {
            width: 40px;
            height: 40px;
            font-size: 1.25rem;
          }

          .student-name-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 3px;
            flex: 1;
            min-width: 0;
          }

          .student-name {
            font-size: 0.95rem;
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .prev-absent-tag {
            font-size: 0.65rem;
            padding: 1px 7px;
          }

          .attendance-options-group {
            width: 100%;
            min-width: 0;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            justify-content: stretch;
          }

          .att-status-btn {
            width: 100%;
            min-width: 0;
            height: 40px;
            padding: 0 2px;
            font-size: 0.76rem;
            font-weight: 700;
            text-align: center;
            touch-action: manipulation;
          }

          /* TAB 2: Journal & Stats */
          .journal-cal-card {
            padding: 14px 10px;
            gap: 12px;
          }

          .journal-cal-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding-bottom: 10px;
          }

          .journal-cal-heading-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            gap: 8px;
          }

          .journal-cal-title {
            font-size: 1.1rem;
          }

          .journal-cal-stats-badge {
            font-size: 0.72rem;
            padding: 2px 8px;
            white-space: nowrap;
          }

          .journal-cal-nav-buttons {
            display: grid;
            grid-template-columns: 44px 1fr 44px;
            gap: 6px;
            width: 100%;
          }

          .cal-nav-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 38px;
            padding: 0 8px;
            font-size: 0.82rem;
          }

          .journal-cal-weekdays {
            gap: 3px;
            padding-bottom: 4px;
            font-size: 0.72rem;
          }

          .journal-cal-weekday-name {
            padding: 5px 0;
          }

          .journal-cal-grid {
            gap: 4px;
          }

          .journal-cal-cell {
            min-height: 64px;
            height: 64px;
            padding: 4px 3px;
            border-radius: var(--radius-sm);
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .cell-top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            min-width: 0;
            gap: 2px;
          }

          .cell-day-num {
            font-size: 0.76rem;
            font-weight: 700;
            line-height: 1;
            flex-shrink: 0;
          }

          .cell-today-pill {
            display: none;
          }

          .journal-cal-cell.today-cell {
            border: 1.5px solid var(--apple-blue) !important;
          }

          .cell-rate-pill {
            font-size: 0.58rem;
            font-weight: 800;
            padding: 1px 3px;
            border-radius: 3px;
            line-height: 1;
            flex-shrink: 0;
          }

          .cell-session-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            margin-top: 2px;
            flex-wrap: nowrap;
          }

          .pill-metric {
            font-size: 0.62rem;
            font-weight: 700;
            padding: 1px 3px;
            border-radius: 4px;
            min-width: 14px;
            line-height: 1.1;
          }

          .cell-empty-hint {
            display: none;
          }

          /* Section 2: Student stats breakdown */
          .student-stats-combined-card {
            padding: 14px 12px;
            margin-top: 4px;
          }

          .stats-section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            margin-bottom: 12px;
            padding-bottom: 10px;
          }

          .stats-section-header .section-title {
            font-size: 0.98rem;
          }

          .timeframe-filter-wrap {
            width: 100%;
          }

          .month-jump-toolbar {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .month-jump-nav {
            width: 100%;
            display: flex;
            justify-content: space-between;
          }

          .month-picker-wrapper {
            flex: 1;
            display: flex;
            justify-content: center;
          }

          .month-picker-trigger {
            width: 100%;
            justify-content: center;
          }

          .stats-timeframe-control {
            width: 100%;
          }

          .stats-month-picker-popup {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100vw - 32px);
            max-width: 280px;
          }

          .segmented-control {
            width: 100%;
            display: flex;
          }

          .seg-btn {
            flex: 1 1 0px;
            text-align: center;
            justify-content: center;
            padding: 7px 4px;
            font-size: 0.78rem;
            white-space: nowrap;
          }

          .stats-kpi-grid, .stats-kpi-grid.inside-section {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }

          .stats-kpi-card {
            padding: 10px 12px;
            gap: 2px;
          }

          .kpi-label {
            font-size: 0.7rem;
          }

          .kpi-value {
            font-size: 1.18rem;
          }

          /* Switch Desktop table to Mobile Card List */
          .table-responsive-brutalist {
            display: none;
          }

          .mobile-stats-header {
            display: flex;
          }

          .student-stats-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }

          /* Modals on Mobile */
          .journal-day-modal, .student-absent-history-modal {
            padding: 16px 14px;
            max-height: calc(100dvh - 60px);
            width: 95%;
          }

          .journal-modal-header {
            margin-bottom: 12px;
            padding-bottom: 10px;
          }

          .journal-modal-header .modal-title {
            font-size: 1.1rem;
          }

          .journal-modal-metrics {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 14px;
          }

          .modal-metric-box {
            padding: 8px 4px;
          }

          .modal-metric-box .metric-lbl {
            font-size: 0.65rem;
          }

          .modal-metric-box .metric-val {
            font-size: 0.95rem;
          }

          .journal-modal-students-scroll {
            max-height: 220px;
            gap: 6px;
            margin-bottom: 14px;
          }

          .journal-modal-student-row {
            padding: 8px 10px;
          }

          .student-modal-header {
            gap: 10px;
            margin-bottom: 12px;
            padding-bottom: 10px;
          }

          .student-modal-avatar {
            width: 42px;
            height: 42px;
            font-size: 1.35rem;
          }

          .student-modal-title {
            font-size: 1.1rem;
          }

          .student-modal-subtitle {
            font-size: 0.75rem;
          }

          .student-modal-kpi-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 14px;
          }

          .kpi-mini-card {
            padding: 6px 4px;
          }

          .kpi-mini-card .lbl {
            font-size: 0.62rem;
          }

          .kpi-mini-card .val {
            font-size: 0.88rem;
          }

          .absent-day-item, .late-day-item, .excused-day-item {
            padding: 7px 10px;
            gap: 8px;
          }

          .absent-date-left {
            min-width: 0;
            flex: 1;
            gap: 6px;
          }

          .date-text {
            font-size: 0.8rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .absent-badge, .late-badge, .excused-badge {
            font-size: 0.7rem;
            padding: 2px 6px;
            flex-shrink: 0;
          }

          .all-present-notice {
            padding: 10px 12px;
            gap: 8px;
          }

          .notice-text strong {
            font-size: 0.84rem;
          }

          .notice-text p {
            font-size: 0.74rem;
          }

          /* Mobile Matrix & Unified Toolbar adjustments */
          .unified-journal-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px 14px;
          }

          .toolbar-left-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .toolbar-center-group {
            width: 100%;
            justify-content: space-between;
          }

          .toolbar-right-group {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .view-mode-segmented-control {
            width: 100%;
            display: flex;
          }

          .view-mode-btn {
            flex: 1;
            justify-content: center;
            font-size: 0.78rem;
            padding: 7px 8px;
          }

          .toolbar-action-buttons {
            width: 100%;
            display: flex;
            gap: 6px;
          }

          .btn-export-toolbar,
          .btn-print-toolbar {
            flex: 1;
            justify-content: center;
            font-size: 0.78rem;
            padding: 7px 6px;
          }

          .unified-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .matrix-journal-card {
            padding: 12px 10px;
          }

          .matrix-top-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .matrix-search-box {
            width: 100%;
          }

          .matrix-legend {
            gap: 6px;
            font-size: 0.7rem;
            justify-content: flex-start;
          }

          .matrix-table-scroll-container {
            max-height: calc(100vh - 230px);
          }

          .sticky-col-name {
            min-width: 130px;
            max-width: 150px;
            padding: 6px 8px;
            font-size: 0.76rem;
          }

          .matrix-avatar {
            display: none;
          }
        }

        /* Attendance Dark Mode Overrides */
        [data-theme="dark"] .attendance-search-filter-bar {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .attendance-search-input {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .attendance-search-input:focus {
          background: #303134;
          border-color: #8AB4F8;
          box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.2);
        }

        [data-theme="dark"] .search-clear-btn {
          background: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .prev-absent-info-badge {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .prev-absent-info-badge strong {
          color: #E8EAED;
        }

        [data-theme="dark"] .prev-absent-tag {
          background: rgba(242, 139, 130, 0.15);
          color: #F28B82;
          border-color: rgba(242, 139, 130, 0.35);
        }

        [data-theme="dark"] .future-join-tag {
          background: rgba(37, 99, 235, 0.15);
          color: #8AB4F8;
          border-color: rgba(138, 180, 248, 0.35);
        }

        [data-theme="dark"] .quick-actions-bar {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .summary-pill {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .summary-pill strong {
          color: #8AB4F8;
        }

        [data-theme="dark"] .summary-pill.pill-present strong {
          color: #81C995;
        }

        [data-theme="dark"] .summary-pill.pill-absent strong {
          color: #F28B82;
        }

        [data-theme="dark"] .summary-pill.pill-late strong {
          color: #FDD663;
        }

        [data-theme="dark"] .student-attendance-row {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-avatar-circle {
          border-color: rgba(255, 255, 255, 0.12);
        }

        [data-theme="dark"] .student-name {
          color: #E8EAED;
        }

        [data-theme="dark"] .att-status-btn {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .att-status-btn:hover {
          background: #303134;
          color: #E8EAED;
        }

        [data-theme="dark"] .att-status-btn.present.active {
          background: rgba(129, 201, 149, 0.2) !important;
          color: #81C995 !important;
          border-color: rgba(129, 201, 149, 0.45) !important;
        }

        [data-theme="dark"] .att-status-btn.excused.active {
          background: rgba(138, 180, 248, 0.2) !important;
          color: #8AB4F8 !important;
          border-color: rgba(138, 180, 248, 0.45) !important;
        }

        [data-theme="dark"] .att-status-btn.absent.active {
          background: rgba(242, 139, 130, 0.2) !important;
          color: #F28B82 !important;
          border-color: rgba(242, 139, 130, 0.45) !important;
        }

        [data-theme="dark"] .att-status-btn.late.active {
          background: rgba(253, 214, 99, 0.2) !important;
          color: #FDD663 !important;
          border-color: rgba(253, 214, 99, 0.45) !important;
        }

        [data-theme="dark"] .btn-date-nav {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .btn-today-quick {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .btn-today-quick.active {
          background: #8AB4F8;
          color: #202124;
          border-color: #8AB4F8;
        }

        [data-theme="dark"] .journal-cal-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .journal-cal-count-badge {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .journal-cal-weekday-name.hdr-toq {
          color: #8AB4F8 !important;
          background: rgba(138, 180, 248, 0.14) !important;
          border: 1px solid rgba(138, 180, 248, 0.28) !important;
        }

        [data-theme="dark"] .journal-cal-weekday-name.hdr-juft {
          color: #81C995 !important;
          background: rgba(129, 201, 149, 0.14) !important;
          border: 1px solid rgba(129, 201, 149, 0.28) !important;
        }

        [data-theme="dark"] .journal-cal-weekday-name.hdr-sunday {
          color: #F28B82 !important;
          background: rgba(242, 139, 130, 0.14) !important;
          border: 1px solid rgba(242, 139, 130, 0.28) !important;
        }

        [data-theme="dark"] .journal-cal-cell.day-weekday {
          background: #252629;
          border-color: #383A3E;
        }

        [data-theme="dark"] .journal-cal-cell.day-weekday:hover {
          background: #2E3034;
          border-color: #4D5157;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        [data-theme="dark"] .journal-cal-cell.day-sunday {
          background: #2A2123;
          border-color: #483134;
        }

        [data-theme="dark"] .journal-cal-cell.day-sunday:hover {
          background: #34272A;
          border-color: #5E3D42;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        [data-theme="dark"] .journal-cal-cell.day-sunday .cell-day-num {
          color: #F28B82;
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell.has-attendance-good {
          background: #1C2921;
          border: 1.5px solid #2E5C3E;
          box-shadow: 0 2px 8px rgba(129, 201, 149, 0.1);
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell.has-attendance-good:hover {
          background: #24382C;
          border-color: #3D7A52;
          box-shadow: 0 4px 14px rgba(129, 201, 149, 0.2);
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell.has-attendance-avg {
          background: #2C261A;
          border: 1.5px solid #5C4A26;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell.has-attendance-avg:hover {
          background: #3B3220;
          border-color: #785F2C;
          box-shadow: 0 4px 14px rgba(251, 191, 36, 0.2);
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell.has-attendance-bad {
          background: #2D1A1E;
          border: 1.5px solid #5E2C33;
          box-shadow: 0 2px 8px rgba(242, 139, 130, 0.1);
        }

        [data-theme="dark"] .journal-cal-cell.has-attendance-cell.has-attendance-bad:hover {
          background: #3B2127;
          border-color: #7A3540;
          box-shadow: 0 4px 14px rgba(242, 139, 130, 0.2);
        }

        [data-theme="dark"] .journal-cal-cell.today-cell {
          border: 2px solid #8AB4F8 !important;
          box-shadow: 0 0 0 2px rgba(138, 180, 248, 0.25), 0 4px 14px rgba(0, 0, 0, 0.45) !important;
        }

        [data-theme="dark"] .cell-today-pill {
          background: #8AB4F8;
          color: #202124;
        }

        [data-theme="dark"] .cell-day-num {
          color: #E8EAED;
        }

        [data-theme="dark"] .cell-rate-pill.good {
          background: rgba(129, 201, 149, 0.18);
          color: #81C995;
          border-color: rgba(129, 201, 149, 0.35);
        }

        [data-theme="dark"] .cell-rate-pill.avg {
          background: rgba(253, 214, 99, 0.18);
          color: #FDD663;
          border-color: rgba(253, 214, 99, 0.35);
        }

        [data-theme="dark"] .cell-rate-pill.bad {
          background: rgba(242, 139, 130, 0.18);
          color: #F28B82;
          border-color: rgba(242, 139, 130, 0.35);
        }

        [data-theme="dark"] .pill-green {
          background: #059669;
          color: #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .pill-red {
          background: #DC2626;
          color: #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .pill-amber {
          background: #D97706;
          color: #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .add-icon {
          color: #5F6368;
        }

        [data-theme="dark"] .stats-kpi-card {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .kpi-label {
          color: #9AA0A6;
        }

        [data-theme="dark"] .kpi-value {
          color: #E8EAED;
        }

        [data-theme="dark"] .section-container {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .brutalist-table th {
          background: #202124;
          border-bottom-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .brutalist-table th.sortable-th:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }

        [data-theme="dark"] .brutalist-table th.sortable-th.active-sort {
          background: rgba(99, 102, 241, 0.2);
          color: #818CF8;
        }

        [data-theme="dark"] .sortable-th.active-sort .sort-icon {
          color: #818CF8;
        }

        [data-theme="dark"] .mobile-sort-select {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .brutalist-table td {
          border-bottom-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .clickable-row:hover {
          background: #303134;
        }

        [data-theme="dark"] .student-name-link {
          color: #E8EAED;
        }

        [data-theme="dark"] .student-name-link:hover {
          color: #8AB4F8;
        }

        [data-theme="dark"] .badge-present-pill {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
          border-color: rgba(129, 201, 149, 0.3);
        }

        [data-theme="dark"] .badge-excused-pill {
          background: rgba(138, 180, 248, 0.15);
          color: #8AB4F8;
          border-color: rgba(138, 180, 248, 0.3);
        }

        [data-theme="dark"] .badge-absent-pill {
          background: rgba(242, 139, 130, 0.15);
          color: #F28B82;
          border-color: rgba(242, 139, 130, 0.3);
        }

        [data-theme="dark"] .badge-late-pill {
          background: rgba(253, 214, 99, 0.15);
          color: #FDD663;
          border-color: rgba(253, 214, 99, 0.3);
        }

        /* Dark Mode Overrides for Mobile Stat Cards */
        [data-theme="dark"] .student-stat-mobile-card {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .stat-card-metrics {
          border-top-color: #3C4043;
        }

        [data-theme="dark"] .mobile-metric-item.metric-present {
          background: rgba(129, 201, 149, 0.12);
          border-color: rgba(129, 201, 149, 0.25);
        }

        [data-theme="dark"] .mobile-metric-item.metric-present .m-label,
        [data-theme="dark"] .mobile-metric-item.metric-present .m-val {
          color: #81C995 !important;
        }

        [data-theme="dark"] .mobile-metric-item.metric-excused {
          background: rgba(138, 180, 248, 0.12);
          border-color: rgba(138, 180, 248, 0.25);
        }

        [data-theme="dark"] .mobile-metric-item.metric-excused .m-label,
        [data-theme="dark"] .mobile-metric-item.metric-excused .m-val {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .mobile-metric-item.metric-absent {
          background: rgba(242, 139, 130, 0.12);
          border-color: rgba(242, 139, 130, 0.25);
        }

        [data-theme="dark"] .mobile-metric-item.metric-absent .m-label,
        [data-theme="dark"] .mobile-metric-item.metric-absent .m-val {
          color: #F28B82 !important;
        }

        [data-theme="dark"] .mobile-metric-item.metric-late {
          background: rgba(253, 214, 99, 0.12);
          border-color: rgba(253, 214, 99, 0.25);
        }

        [data-theme="dark"] .mobile-metric-item.metric-late .m-label,
        [data-theme="dark"] .mobile-metric-item.metric-late .m-val {
          color: #FDD663 !important;
        }

        [data-theme="dark"] .mobile-metric-item.metric-total {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .mobile-metric-item.metric-total .m-label {
          color: #9AA0A6;
        }

        [data-theme="dark"] .mobile-metric-item.metric-total .m-val {
          color: #E8EAED;
        }

        [data-theme="dark"] .absent-day-item,
        [data-theme="dark"] .late-day-item,
        [data-theme="dark"] .excused-day-item {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .modal-metric-box {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .journal-modal-student-row {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .empty-state {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .journal-cal-stats-badge {
          background: #202124 !important;
          border-color: #3C4043 !important;
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .journal-cal-stats-badge strong {
          color: #E8EAED !important;
        }

        [data-theme="dark"] .cal-nav-action-btn {
          background: #202124 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .cal-nav-action-btn:hover {
          background: #303134 !important;
        }

        [data-theme="dark"] .month-jump-nav {
          background: #202124 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .month-nav-arrow-btn {
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .month-nav-arrow-btn:hover {
          background: #303134 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .month-picker-trigger {
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .month-picker-trigger:hover {
          color: #E8EAED !important;
        }

        [data-theme="dark"] .month-picker-trigger.active {
          background: #303134 !important;
          color: #E8EAED !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4) !important;
        }

        [data-theme="dark"] .month-picker-chevron {
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .stats-month-picker-popup {
          background: #202124 !important;
          border-color: #3C4043 !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55) !important;
        }

        [data-theme="dark"] .month-picker-year-title {
          color: #E8EAED !important;
        }

        [data-theme="dark"] .month-picker-cell {
          background: #2A2B2E !important;
          border-color: #3C4043 !important;
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .month-picker-cell:hover {
          background: #35363A !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .month-picker-cell.selected {
          background: #E8EAED !important;
          color: #1D1D1F !important;
          border-color: #E8EAED !important;
        }

        [data-theme="dark"] .month-picker-cell.current-month:not(.selected) {
          border-color: #8AB4F8 !important;
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .month-has-data-dot {
          background: #81C995 !important;
        }

        [data-theme="dark"] .month-picker-today-btn {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .month-empty-banner {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .segmented-control {
          background: #202124 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .seg-btn {
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .seg-btn.active {
          background: #303134 !important;
          color: #E8EAED !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4) !important;
        }

        [data-theme="dark"] .pill-green {
          background: rgba(129, 201, 149, 0.15) !important;
          color: #81C995 !important;
          border-color: rgba(129, 201, 149, 0.35) !important;
        }

        [data-theme="dark"] .pill-blue {
          background: rgba(138, 180, 248, 0.15) !important;
          color: #8AB4F8 !important;
          border-color: rgba(138, 180, 248, 0.35) !important;
        }

        [data-theme="dark"] .pill-red {
          background: rgba(242, 139, 130, 0.15) !important;
          color: #F28B82 !important;
          border-color: rgba(242, 139, 130, 0.35) !important;
        }

        [data-theme="dark"] .pill-amber {
          background: rgba(253, 214, 99, 0.15) !important;
          color: #FDD663 !important;
          border-color: rgba(253, 214, 99, 0.35) !important;
        }

        [data-theme="dark"] .badge-status.present {
          background: rgba(129, 201, 149, 0.15) !important;
          color: #81C995 !important;
        }

        [data-theme="dark"] .badge-status.excused {
          background: rgba(138, 180, 248, 0.15) !important;
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .badge-status.absent {
          background: rgba(242, 139, 130, 0.15) !important;
          color: #F28B82 !important;
        }

        [data-theme="dark"] .badge-status.late {
          background: rgba(253, 214, 99, 0.15) !important;
          color: #FDD663 !important;
        }

        [data-theme="dark"] .badge-status.none {
          background: #303134 !important;
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .kpi-mini-card {
          background: #202124 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-present {
          background: rgba(129, 201, 149, 0.12) !important;
          border-color: rgba(129, 201, 149, 0.3) !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-present .lbl,
        [data-theme="dark"] .kpi-mini-card.card-present .val {
          color: #81C995 !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-excused {
          background: rgba(138, 180, 248, 0.12) !important;
          border-color: rgba(138, 180, 248, 0.3) !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-excused .lbl,
        [data-theme="dark"] .kpi-mini-card.card-excused .val {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-absent {
          background: rgba(242, 139, 130, 0.12) !important;
          border-color: rgba(242, 139, 130, 0.3) !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-absent .lbl,
        [data-theme="dark"] .kpi-mini-card.card-absent .val {
          color: #F28B82 !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-late {
          background: rgba(253, 214, 99, 0.12) !important;
          border-color: rgba(253, 214, 99, 0.3) !important;
        }

        [data-theme="dark"] .kpi-mini-card.card-late .lbl,
        [data-theme="dark"] .kpi-mini-card.card-late .val {
          color: #FDD663 !important;
        }

        [data-theme="dark"] .excused-badge {
          background: rgba(138, 180, 248, 0.15) !important;
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .all-present-notice {
          background: rgba(129, 201, 149, 0.12) !important;
          border-color: rgba(129, 201, 149, 0.3) !important;
        }

        [data-theme="dark"] .notice-text strong {
          color: #81C995 !important;
        }

        [data-theme="dark"] .notice-text p {
          color: #A7F3D0 !important;
        }

        [data-theme="dark"] .all-present-notice.info-notice {
          background: rgba(138, 180, 248, 0.12) !important;
          border-color: rgba(138, 180, 248, 0.3) !important;
        }

        [data-theme="dark"] .all-present-notice.info-notice .notice-text strong {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .all-present-notice.info-notice .notice-text p {
          color: #C2E7FF !important;
        }

        [data-theme="dark"] .calendar-popover {
          background: #202124 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .cal-nav-btn {
          background: #303134 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .cal-weekday.hdr-toq {
          color: #8AB4F8 !important;
          background: rgba(138, 180, 248, 0.14) !important;
          border-color: rgba(138, 180, 248, 0.28) !important;
        }

        [data-theme="dark"] .cal-weekday.hdr-juft {
          color: #81C995 !important;
          background: rgba(129, 201, 149, 0.14) !important;
          border-color: rgba(129, 201, 149, 0.28) !important;
        }

        [data-theme="dark"] .cal-weekday.hdr-sunday {
          color: #F28B82 !important;
          background: rgba(242, 139, 130, 0.14) !important;
          border-color: rgba(242, 139, 130, 0.28) !important;
        }

        [data-theme="dark"] .cal-day-cell {
          background: #202124 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .cal-day-cell.day-sunday {
          color: #F28B82 !important;
        }

        [data-theme="dark"] .cal-day-cell:hover {
          background: #303134 !important;
        }

        [data-theme="dark"] .cal-day-cell.selected {
          background: #8AB4F8 !important;
          color: #202124 !important;
        }

        [data-theme="dark"] .cal-today-btn {
          background: #303134 !important;
          border-color: #3C4043 !important;
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .save-att-btn {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          border-color: #10B981 !important;
          color: #FFFFFF !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
        }

        [data-theme="dark"] .save-att-btn:hover {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
        }

        /* Matrix & Unified Toolbar Dark Mode Overrides */
        [data-theme="dark"] .unified-journal-toolbar,
        [data-theme="dark"] .matrix-journal-card {
          background: #202124 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .toolbar-title {
          color: #E8EAED !important;
        }

        [data-theme="dark"] .toolbar-chip {
          background: #303134 !important;
          color: #BDC1C6 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .unified-month-nav {
          background: #303134 !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .btn-today-pill {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .btn-today-pill:hover {
          background: rgba(138, 180, 248, 0.15) !important;
        }

        [data-theme="dark"] .view-mode-segmented-control {
          background: #303134 !important;
        }

        [data-theme="dark"] .view-mode-btn {
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .view-mode-btn.active {
          background: #202124 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .btn-export-toolbar,
        [data-theme="dark"] .btn-print-toolbar {
          background: #303134 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .btn-export-toolbar:hover,
        [data-theme="dark"] .btn-print-toolbar:hover {
          background: #3C4043 !important;
          border-color: #5F6368 !important;
        }

        [data-theme="dark"] .matrix-search-input {
          background: #303134 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .matrix-search-input:focus {
          border-color: #8AB4F8 !important;
          background: #202124 !important;
          box-shadow: 0 0 0 2px rgba(138, 180, 248, 0.2) !important;
        }

        [data-theme="dark"] .matrix-search-clear-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .matrix-table-scroll-container {
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .matrix-table thead th {
          background: #282A2D !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .sticky-col-rank,
        [data-theme="dark"] .sticky-col-name {
          background: #202124 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] thead th.sticky-col-rank,
        [data-theme="dark"] thead th.sticky-col-name {
          background: #282A2D !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .matrix-student-row td {
          background: #202124;
          border-color: #303134;
          color: #E8EAED;
        }

        [data-theme="dark"] .matrix-student-row:hover td {
          background: #292A2D !important;
        }

        [data-theme="dark"] .matrix-name-text {
          color: #E8EAED !important;
        }

        [data-theme="dark"] .matrix-name-cell:hover .matrix-name-text {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .toolbar-group-selector-btn {
          background: #303134 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .toolbar-group-selector-btn:hover {
          background: #3C4043 !important;
        }

        [data-theme="dark"] .matrix-student-avatar {
          background: #303134 !important;
          color: #E8EAED !important;
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .matrix-badge.present {
          background: rgba(129, 201, 149, 0.18) !important;
          color: #81C995 !important;
          border: none !important;
        }

        [data-theme="dark"] .matrix-badge.absent {
          background: rgba(242, 139, 130, 0.18) !important;
          color: #F28B82 !important;
          border: none !important;
        }

        [data-theme="dark"] .matrix-badge.late {
          background: rgba(253, 214, 99, 0.18) !important;
          color: #FDD663 !important;
          border: none !important;
        }

        [data-theme="dark"] .matrix-badge.excused {
          background: rgba(138, 180, 248, 0.18) !important;
          color: #8AB4F8 !important;
          border: none !important;
        }

        [data-theme="dark"] .matrix-badge.not-member {
          background: transparent !important;
          color: #5F6368 !important;
          border: none !important;
        }

        [data-theme="dark"] .matrix-badge.unmarked {
          background: transparent !important;
          color: #3C4043 !important;
          border: none !important;
        }

        [data-theme="dark"] .matrix-num.num-present {
          color: #81C995 !important;
        }

        [data-theme="dark"] .matrix-num.num-excused {
          color: #8AB4F8 !important;
        }

        [data-theme="dark"] .matrix-num.num-absent {
          color: #F28B82 !important;
        }

        [data-theme="dark"] .matrix-num.num-late {
          color: #FDD663 !important;
        }

        [data-theme="dark"] .rate-pill-minimal.good {
          background: rgba(129, 201, 149, 0.18) !important;
          color: #81C995 !important;
        }

        [data-theme="dark"] .rate-pill-minimal.avg {
          background: rgba(253, 214, 99, 0.18) !important;
          color: #FDD663 !important;
        }

        [data-theme="dark"] .rate-pill-minimal.bad {
          background: rgba(242, 139, 130, 0.18) !important;
          color: #F28B82 !important;
        }

        [data-theme="dark"] .rate-pill-minimal.empty {
          color: #80868B !important;
        }

        [data-theme="dark"] .matrix-cell.clickable-date-cell:hover {
          background: #303134 !important;
        }

        [data-theme="dark"] .th-has-lesson {
          background: rgba(16, 185, 129, 0.12) !important;
          border-bottom-color: #10B981 !important;
        }

        [data-theme="dark"] .matrix-date-th:hover {
          background: #3C4043 !important;
        }

        [data-theme="dark"] .th-summary {
          border-color: #3C4043 !important;
        }

        [data-theme="dark"] .th-summary-p {
          color: #6EE7B7 !important;
          background: rgba(16, 185, 129, 0.15) !important;
        }

        [data-theme="dark"] .th-summary-s {
          color: #93C5FD !important;
          background: rgba(59, 130, 246, 0.15) !important;
        }

        [data-theme="dark"] .th-summary-a {
          color: #FCA5A5 !important;
          background: rgba(239, 68, 68, 0.15) !important;
        }

        [data-theme="dark"] .th-summary-l {
          color: #FCD34D !important;
          background: rgba(245, 158, 11, 0.15) !important;
        }

        [data-theme="dark"] .th-summary-total {
          color: #BDC1C6 !important;
          background: #282A2D !important;
        }

        [data-theme="dark"] .th-summary-rate {
          color: #E8EAED !important;
          background: #303134 !important;
          border-left-color: #3C4043 !important;
        }

        [data-theme="dark"] .matrix-sum-cell {
          border-color: #303134 !important;
        }

        [data-theme="dark"] .matrix-rate-cell {
          border-color: #303134 !important;
          border-left-color: #3C4043 !important;
        }

        [data-theme="dark"] .matrix-footer-row td {
          background: #282A2D !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .footer-label-cell {
          background: #303134 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        /* Print Media Styles */
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }

          nav, header, aside, .sidebar, .sidebar-container, .navbar,
          .tab-control-brutalist, .filters-toolbar, .unified-journal-toolbar,
          .matrix-top-toolbar, .month-empty-banner, .btn-export-toolbar,
          .btn-print-toolbar, .mobile-stats-header, .journal-cal-card,
          .btn, button, .date-picker-row {
            display: none !important;
          }

          body, #root, .app-container, .main-layout, .main-content,
          .attendance-container, .matrix-journal-card {
            background: #FFFFFF !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .print-header-banner {
            display: block !important;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #000;
          }

          .print-group-name {
            font-size: 16pt;
            font-weight: bold;
            margin: 0 0 4px 0;
            color: #000;
          }

          .print-meta-info {
            font-size: 9pt;
            color: #444;
          }

          .matrix-table-scroll-container {
            overflow: visible !important;
            border: 1px solid #000 !important;
            max-height: none !important;
          }

          .matrix-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8pt !important;
          }

          .matrix-table th,
          .matrix-table td {
            border: 1px solid #666 !important;
            padding: 3px 2px !important;
            color: #000 !important;
            background: #FFFFFF !important;
          }

          .matrix-table thead th {
            background: #EEEEEE !important;
          }

          .sticky-col-rank,
          .sticky-col-name,
          .matrix-footer-row,
          .footer-label-cell {
            position: static !important;
          }

          .matrix-badge {
            border: 1px solid #999 !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .matrix-rate-pill {
            border: 1px solid #999 !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Attendance;
