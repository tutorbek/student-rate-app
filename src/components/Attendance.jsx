import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar } from '../utils/studentAvatars';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const IconCheck = ({ size = 14, strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ size = 14, strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconClock = ({ size = 14, strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

const StudentAttendanceRow = React.memo(({ student, status, wasAbsentLastLesson, onMarkStatus }) => {
  return (
    <div className="student-attendance-row">
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
        </div>
      </div>
      <div className="attendance-options-group">
        <button
          type="button"
          className={`att-status-btn present ${status === 'present' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'present')}
        >
          Keldi
        </button>
        <button
          type="button"
          className={`att-status-btn absent ${status === 'absent' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'absent')}
        >
          Kelmadi
        </button>
        <button
          type="button"
          className={`att-status-btn late ${status === 'late' ? 'active' : ''}`}
          onClick={() => onMarkStatus(student.id, 'late')}
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
  const [confirmDeleteDate, setConfirmDeleteDate] = useState(null); // date string
  const [selectedDayDetail, setSelectedDayDetail] = useState(null); // date object with records
  const [selectedStudentHistoryModal, setSelectedStudentHistoryModal] = useState(null); // student object

  const [journalYear, setJournalYear] = useState(() => new Date().getFullYear());
  const [journalMonth, setJournalMonth] = useState(() => new Date().getMonth());

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

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState(() => new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date().getMonth());

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
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
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    const totalGridCells = 42;
    const nextMonthDays = totalGridCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({ day: i, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
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
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    const totalGridCells = 42;
    const nextMonthDays = totalGridCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({ day: i, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false });
    }
    return days;
  }, [journalYear, journalMonth]);

  const handleJournalPrevMonth = () => {
    if (journalMonth === 0) {
      setJournalMonth(11);
      setJournalYear((y) => y - 1);
    } else {
      setJournalMonth((m) => m - 1);
    }
  };

  const handleJournalNextMonth = () => {
    if (journalMonth === 11) {
      setJournalMonth(0);
      setJournalYear((y) => y + 1);
    } else {
      setJournalMonth((m) => m + 1);
    }
  };

  const handleJournalToday = () => {
    const now = new Date();
    setJournalYear(now.getFullYear());
    setJournalMonth(now.getMonth());
  };

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
    setSelectedDate(`${d.year}-${formattedMonth}-${formattedDay}`);
    setIsDatePickerOpen(false);
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
  const [filterLastAbsentOnly, setFilterLastAbsentOnly] = useState(false);

  useEffect(() => {
    setStudentSearchQuery('');
    setFilterLastAbsentOnly(false);
  }, [selectedGroupId, selectedDate]);

  const groupStudents = useMemo(() => students.filter((s) => s.groupId === selectedGroupId && !s.deleted), [students, selectedGroupId]);
  const currentRecord = useMemo(() => attendance.find((r) => r.groupId === selectedGroupId && r.date === selectedDate), [attendance, selectedGroupId, selectedDate]);
  const isDateExplicitlyMarked = !!currentRecord;

  // Default to 'present' for new/unmarked sessions so UI & backend require 0 extra clicks for present students
  const effectiveRecordsMap = useMemo(() => {
    if (currentRecord && currentRecord.records) {
      const map = { ...currentRecord.records };
      groupStudents.forEach((student) => {
        if (!map[student.id]) {
          map[student.id] = 'present';
        }
      });
      return map;
    }
    const defaultMap = {};
    groupStudents.forEach((student) => {
      defaultMap[student.id] = 'present';
    });
    return defaultMap;
  }, [currentRecord, groupStudents]);

  const currentDateStats = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    groupStudents.forEach((student) => {
      const st = effectiveRecordsMap[student.id] || 'present';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
    });
    return { present, absent, late, totalMarked: groupStudents.length };
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
      return statuses.length > 0 && statuses.some((st) => st === 'present' || st === 'late');
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

  const isDateInCurrentMonth = (dateStr) => {
    const recordDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    return recordDate.getFullYear() === now.getFullYear() && recordDate.getMonth() === now.getMonth();
  };

  const isDateInLastMonth = (dateStr) => {
    const recordDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return recordDate.getFullYear() === lastMonth.getFullYear() && recordDate.getMonth() === lastMonth.getMonth();
  };

  const filteredAttendanceRecords = useMemo(() => {
    if (activeTab !== 'journal' && !selectedStudentHistoryModal) return [];
    const groupRecords = attendance.filter((r) => r.groupId === selectedGroupId);
    if (timeframe === 'month') return groupRecords.filter((r) => isDateInCurrentMonth(r.date));
    if (timeframe === 'lastMonth') return groupRecords.filter((r) => isDateInLastMonth(r.date));
    return groupRecords;
  }, [activeTab, selectedStudentHistoryModal, attendance, selectedGroupId, timeframe]);

  // Indexed attendance map for Journal Calendar
  const journalRecordsByDate = useMemo(() => {
    if (activeTab !== 'journal') return {};
    const map = {};
    attendance
      .filter((r) => r.groupId === selectedGroupId)
      .forEach((rec) => {
        // Collect all students relevant to this session:
        // 1. Current group students
        // 2. Plus any students recorded in rec.records (including transferred/deleted)
        const recordedIds = Object.keys(rec.records || {});
        const extraStudents = (students || []).filter(
          (s) => recordedIds.includes(s.id) && !groupStudents.some((gs) => gs.id === s.id)
        );
        const sessionStudentsList = [...groupStudents, ...extraStudents];

        let present = 0, absent = 0, late = 0;
        const effectiveRecords = {};

        sessionStudentsList.forEach((student) => {
          const status = rec.records?.[student.id] || 'present';
          effectiveRecords[student.id] = status;
          if (status === 'present') present++;
          else if (status === 'absent') absent++;
          else if (status === 'late') late++;
        });

        const totalMarked = sessionStudentsList.length;
        const rate = totalMarked > 0 ? Math.round(((present + late * 0.5) / totalMarked) * 100) : 100;
        map[rec.date] = {
          ...rec,
          records: effectiveRecords,
          studentsList: sessionStudentsList,
          present,
          absent,
          late,
          totalMarked,
          rate,
        };
      });
    return map;
  }, [activeTab, attendance, selectedGroupId, groupStudents, students]);

  const handleMarkStatus = useCallback((studentId, status) => {
    if (!selectedGroupId || !selectedDate) { showToast("Iltimos, guruh va sanani tanlang!", "error"); return; }
    const updatedMap = { ...effectiveRecordsMap, [studentId]: status };
    onSaveAttendance(selectedGroupId, selectedDate, updatedMap);
  }, [selectedGroupId, selectedDate, effectiveRecordsMap, onSaveAttendance, showToast]);

  const handleSaveExplicitly = () => {
    if (!selectedGroupId || !selectedDate) {
      showToast("Iltimos, guruh va sanani tanlang!", "error");
      return;
    }
    if (groupStudents.length === 0) {
      showToast("Bu guruhda o'quvchilar mavjud emas!", "warning");
      return;
    }
    onSaveAttendance(selectedGroupId, selectedDate, effectiveRecordsMap);
    showToast("Davomat muvaffaqiyatli saqlandi!", "success");
  };

  const handleMarkAllPresent = () => {
    if (groupStudents.length === 0) { showToast("Bu guruhda o'quvchilar mavjud emas!", "warning"); return; }
    const updatedMap = {};
    groupStudents.forEach((student) => { updatedMap[student.id] = 'present'; });
    onSaveAttendance(selectedGroupId, selectedDate, updatedMap);
    showToast("Barcha o'quvchilar 'Keldi' deb belgilandi!", "success");
  };

  const handleMarkAllAbsent = () => {
    if (groupStudents.length === 0) { showToast("Bu guruhda o'quvchilar mavjud emas!", "warning"); return; }
    const updatedMap = {};
    groupStudents.forEach((student) => { updatedMap[student.id] = 'absent'; });
    onSaveAttendance(selectedGroupId, selectedDate, updatedMap);
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

  const studentStats = useMemo(() => {
    if (activeTab !== 'journal' || groupStudents.length === 0) return [];
    return groupStudents.map((student) => {
      let presentCount = 0, absentCount = 0, lateCount = 0, totalLessons = 0;
      filteredAttendanceRecords.forEach((record) => {
        const status = record.records?.[student.id] || 'present';
        totalLessons++;
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
      });
      const calculatedPresents = presentCount + lateCount * 0.5;
      const rate = totalLessons > 0 ? Math.round((calculatedPresents / totalLessons) * 100) : 100;
      return { student, presentCount, absentCount, lateCount, totalLessons, rate };
    }).sort((a, b) => b.rate - a.rate);
  }, [activeTab, groupStudents, filteredAttendanceRecords]);

  const overallGroupStats = useMemo(() => {
    if (activeTab !== 'journal') return { avgRate: 100, totalLessons: 0, totalAbsents: 0, totalLates: 0 };
    let totalLessonsCount = filteredAttendanceRecords.length;
    let totalAbsents = 0, totalLates = 0;
    studentStats.forEach((s) => { totalAbsents += s.absentCount; totalLates += s.lateCount; });
    if (studentStats.length === 0) return { avgRate: 100, totalLessons: totalLessonsCount, totalAbsents: 0, totalLates: 0 };
    const avgRate = Math.round(studentStats.reduce((sum, s) => sum + s.rate, 0) / studentStats.length);
    return { avgRate, totalLessons: totalLessonsCount, totalAbsents, totalLates };
  }, [activeTab, studentStats, filteredAttendanceRecords]);

  const journalMonthLessonCount = useMemo(() => {
    return Object.keys(journalRecordsByDate).filter(d => {
      const parts = d.split('-');
      return parseInt(parts[0], 10) === journalYear && parseInt(parts[1], 10) === journalMonth + 1;
    }).length;
  }, [journalRecordsByDate, journalYear, journalMonth]);

  const studentHistoryDetails = useMemo(() => {
    if (!selectedStudentHistoryModal) return null;
    const studentId = selectedStudentHistoryModal.id;

    const historyList = filteredAttendanceRecords
      .map((record) => {
        const status = record.records?.[studentId];
        return {
          date: record.date,
          status: status || 'none',
        };
      })
      .filter((item) => item.status && item.status !== 'none')
      .sort((a, b) => b.date.localeCompare(a.date));

    const absentDays = historyList.filter((item) => item.status === 'absent');
    const lateDays = historyList.filter((item) => item.status === 'late');
    const presentDays = historyList.filter((item) => item.status === 'present');

    const total = historyList.length;
    const rate = total > 0 ? Math.round(((presentDays.length + lateDays.length * 0.5) / total) * 100) : 100;

    return {
      student: selectedStudentHistoryModal,
      historyList,
      absentDays,
      lateDays,
      presentDays,
      total,
      rate,
    };
  }, [selectedStudentHistoryModal, filteredAttendanceRecords]);

  return (
    <div className="attendance-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Davomad</h2>
          <p className="page-subtitle">O'quvchilar davomatini belgilash, jurnali va statistikasi</p>
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

        {activeTab === 'mark' && (
          <div className="filter-item filter-date-item">
            <label className="form-label">Dars Sanasi</label>
            <div className="date-picker-row">
              <button type="button" className="btn-date-nav scale-active" onClick={() => handleStepDay(-1)}>
                <IconChevronLeft />
              </button>
              <div className="custom-select-container date-input-container">
                <button type="button" className="filter-select-btn" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
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
                          return <button key={idx} type="button" className={`cal-day-cell ${isSunday ? 'day-sunday' : ''} ${!d.isCurrentMonth ? 'other-month' : ''} ${fullDateStr === selectedDate ? 'selected' : ''}`} onClick={() => handleSelectCalendarDate(d)}>{d.day}</button>;
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
        )}
      </div>

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

          <div className="quick-actions-bar glass-card">
            <div className="quick-actions-btns">
              <button className="btn btn-secondary scale-active btn-sm" onClick={handleMarkAllPresent}>
                Barchasi Keldi
              </button>
              <button className="btn btn-secondary scale-active btn-sm" onClick={handleMarkAllAbsent}>
                Barchasi Kelmadi
              </button>
              {isDateExplicitlyMarked && (
                <button className="btn btn-danger scale-active btn-sm" onClick={handleClearCurrentDate}>
                  <IconTrash size={14} /> Tozalash
                </button>
              )}
            </div>
            <div className="quick-actions-save-wrapper">
              <button className="btn btn-primary scale-active btn-sm save-att-btn" onClick={handleSaveExplicitly}>
                <IconCheck size={14} strokeWidth={2.8} /> Saqlash
              </button>
            </div>
          </div>

          {groupStudents.length > 0 ? (
            filteredGroupStudents.length > 0 ? (
              <div className="students-attendance-list">
                {filteredGroupStudents.map((student) => (
                  <StudentAttendanceRow
                    key={student.id}
                    student={student}
                    status={effectiveRecordsMap[student.id] || 'present'}
                    wasAbsentLastLesson={previousLessonAbsentStudentIds.has(student.id)}
                    onMarkStatus={handleMarkStatus}
                  />
                ))}
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
          {/* Section 1: Interactive Monthly Calendar */}
          <div className="glass-card journal-cal-card">
            <div className="journal-cal-toolbar">
              <div className="journal-cal-heading-group">
                <h3 className="journal-cal-title">
                  {UZBEK_MONTHS[journalMonth]} {journalYear}
                </h3>
                <span className="journal-cal-stats-badge">
                  Ushbu oyda o'tilgan: <strong>{journalMonthLessonCount} ta dars</strong>
                </span>
              </div>
              <div className="journal-cal-nav-buttons">
                <button type="button" className="cal-nav-action-btn scale-active" onClick={handleJournalPrevMonth}>
                  <IconChevronLeft />
                </button>
                <button type="button" className="cal-nav-action-btn scale-active" onClick={handleJournalToday}>
                  Bugun
                </button>
                <button type="button" className="cal-nav-action-btn scale-active" onClick={handleJournalNextMonth}>
                  <IconChevronRight />
                </button>
              </div>
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

                return (
                  <div
                    key={idx}
                    className={`journal-cal-cell ${isSunday ? 'day-sunday' : 'day-weekday'} ${!d.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today-cell' : ''} ${session ? `has-attendance-cell ${rateStatusClass}` : ''}`}
                    onClick={() => {
                      if (session) {
                        setSelectedDayDetail(session);
                      } else {
                        setSelectedDate(fullDateStr);
                        setActiveTab('mark');
                      }
                    }}
                  >
                    <div className="cell-top-bar">
                      <span className="cell-day-num">{d.day}</span>
                      {isToday && <span className="cell-today-pill">Bugun</span>}
                      {session && (
                        <span className={`cell-rate-pill ${session.rate >= 90 ? 'good' : session.rate >= 70 ? 'avg' : 'bad'}`}>
                          {session.rate}%
                        </span>
                      )}
                    </div>

                    {session ? (
                      <div className="cell-session-info">
                        <span className="pill-metric pill-green">{session.present}</span>
                        {session.absent > 0 && <span className="pill-metric pill-red">{session.absent}</span>}
                        {session.late > 0 && <span className="pill-metric pill-amber">{session.late}</span>}
                      </div>
                    ) : d.isCurrentMonth ? (
                      <div className="cell-empty-hint">
                        <span className="add-icon">+</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Students Performance Breakdown with Timeframe & KPI Cards */}
          <div className="glass-card section-container student-stats-combined-card">
            <div className="stats-section-header">
              <h3 className="section-title">O'quvchilar Davomat Ko'rsatkichlari</h3>
              <div className="timeframe-filter-wrap">
                <div className="segmented-control">
                  <button type="button" className={`seg-btn ${timeframe === 'month' ? 'active' : ''}`} onClick={() => setTimeframe('month')}>Bu oy</button>
                  <button type="button" className={`seg-btn ${timeframe === 'lastMonth' ? 'active' : ''}`} onClick={() => setTimeframe('lastMonth')}>O'tgan oy</button>
                  <button type="button" className={`seg-btn ${timeframe === 'all' ? 'active' : ''}`} onClick={() => setTimeframe('all')}>Kurs davomida</button>
                </div>
              </div>
            </div>

            {/* KPI Cards inside the stats card */}
            <div className="stats-kpi-grid inside-section">
              <div className="stats-kpi-card">
                <span className="kpi-label">O'rtacha Davomad</span>
                <span className="kpi-value">{overallGroupStats.avgRate}%</span>
              </div>
              <div className="stats-kpi-card">
                <span className="kpi-label">O'tilgan Darslar</span>
                <span className="kpi-value">{overallGroupStats.totalLessons} ta</span>
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

            {/* Students Table */}
            <div className="table-responsive-brutalist">
              <table className="brutalist-table">
                <thead>
                  <tr>
                    <th>O'quvchi</th>
                    <th>Kelgan</th>
                    <th>Kelmadi</th>
                    <th>Kechikkan</th>
                    <th>Jami</th>
                    <th>Davomad %</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.map((s) => (
                    <tr 
                      key={s.student.id}
                      className="student-stat-table-row clickable-row"
                      onClick={() => setSelectedStudentHistoryModal(s.student)}
                    >
                      <td>
                        <div className="table-student-cell">
                          <div className="avatar-circle table-avatar" style={{ background: s.student.color }}>
                            {renderAvatar(s.student.emoji)}
                          </div>
                          <span className="font-bold student-name-link">{s.student.name}</span>
                        </div>
                      </td>
                      <td>
                        {s.presentCount > 0 ? (
                          <span className="badge-present-pill">
                            {s.presentCount}
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        {s.absentCount > 0 ? (
                          <span className="badge-absent-pill">
                            {s.absentCount}
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        {s.lateCount > 0 ? (
                          <span className="badge-late-pill">
                            {s.lateCount}
                          </span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>{s.totalLessons}</td>
                      <td>
                        <span className={`rate-pill ${s.rate >= 90 ? 'good' : s.rate >= 70 ? 'avg' : 'bad'}`}>
                          {s.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                  {selectedGroup?.name || 'Guruh'} • Davr: {timeframe === 'month' ? 'Bu oy' : timeframe === 'lastMonth' ? "O'tgan oy" : 'Kurs davomida'}
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
                <span className="val font-bold">{studentHistoryDetails.rate}%</span>
              </div>
            </div>

            {/* Qoldirilgan Darslar Ro'yxati */}
            <div className="student-modal-section">
              <h4 className="student-modal-section-title">
                Qoldirilgan darslar ({studentHistoryDetails.absentDays.length} ta)
              </h4>

              {studentHistoryDetails.absentDays.length > 0 ? (
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
              {(selectedDayDetail.studentsList || groupStudents).length > 0 ? (
                (selectedDayDetail.studentsList || groupStudents).map((student) => {
                  const status = selectedDayDetail.records?.[student.id] || 'present';
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
                        ) : status === 'absent' ? (
                          <span className="badge-status absent">
                            Kelmadi
                          </span>
                        ) : (
                          <span className="badge-status late">
                            Kechikdi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>O'quvchilar mavjud emas.</p>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => {
                  setSelectedDate(selectedDayDetail.date);
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
          transition: all var(--transition-fast);
          touch-action: manipulation;
        }

        .tab-btn-brutalist:hover {
          color: var(--text-primary);
        }

        .tab-btn-brutalist.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 700;
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
          min-width: 180px;
          flex: 1;
        }

        .filter-date-item {
          flex: 1.5;
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
          transition: all var(--transition-fast);
        }

        .seg-btn:last-child {
          border-right: none;
        }

        .seg-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 700;
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
          min-width: 268px;
          justify-content: flex-end;
        }

        .att-status-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 12px;
          min-width: 82px;
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
          grid-template-columns: repeat(4, 1fr);
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

        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
          grid-template-columns: repeat(5, 1fr);
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

        .absent-days-list, .late-days-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }

        .absent-day-item, .late-day-item {
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

        @media (max-width: 768px) {
          .filters-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 14px;
          }

          .filter-item {
            width: 100%;
            min-width: 100%;
          }

          .date-picker-row {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .date-input-container .filter-select-btn {
            font-size: 0.82rem;
            padding: 0 8px;
          }

          .quick-actions-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px 14px;
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
            padding: 9px 8px;
            font-size: 0.8rem;
            white-space: nowrap;
          }

          .quick-actions-save-wrapper {
            width: 100%;
          }

          .quick-actions-save-wrapper .save-att-btn {
            width: 100%;
            justify-content: center;
          }

          .summary-pill {
            text-align: center;
            justify-content: center;
            font-size: 0.74rem;
            padding: 6px 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .student-attendance-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 14px;
          }

          .student-info-left {
            width: 100%;
          }

          .attendance-options-group {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }

          .att-status-btn {
            width: 100%;
            min-width: 0;
            padding: 8px 2px;
            font-size: 0.78rem;
            text-align: center;
            height: 38px;
            touch-action: manipulation;
          }

          .student-modal-kpi-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }

          .journal-cal-card {
            padding: 12px 10px;
          }

          .journal-cal-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
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
            padding: 8px;
          }

          .journal-cal-grid {
            gap: 4px;
          }

          .journal-cal-cell {
            min-height: 56px;
            height: 56px;
            padding: 3px 4px;
            border-radius: var(--radius-sm);
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
          }

          .cell-top-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            min-width: 0;
            gap: 2px;
          }

          .cell-day-num {
            font-size: 0.78rem;
            font-weight: 700;
            line-height: 1;
            flex-shrink: 0;
          }

          .cell-today-pill {
            display: none;
          }

          .cell-rate-pill {
            font-size: 0.62rem;
            font-weight: 700;
            padding: 1px 3px;
            border-radius: 3px;
            line-height: 1;
            flex-shrink: 0;
          }

          .cell-session-info {
            display: none;
          }

          .journal-day-modal, .student-absent-history-modal {
            padding: 16px 18px;
            max-height: calc(100dvh - 80px);
          }

          .journal-modal-metrics {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
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

        [data-theme="dark"] .absent-day-item,
        [data-theme="dark"] .late-day-item {
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
      `}</style>
    </div>
  );
};

export default Attendance;
