import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { renderGroupIcon, GROUP_COLOR_OPTIONS } from '../utils/groupIcons';
import { renderAvatar } from '../utils/studentAvatars';
import { getGroupCategory } from '../utils/db';
import Time24Input from './Time24Input';
import { useModalDismiss } from '../hooks/useModalDismiss';

const WEEKDAYS = [
  { key: 'mon', name: 'Dushanba', short: 'Du' },
  { key: 'tue', name: 'Seshanba', short: 'Se' },
  { key: 'wed', name: 'Chorshanba', short: 'Cho' },
  { key: 'thu', name: 'Payshanba', short: 'Pa' },
  { key: 'fri', name: 'Juma', short: 'Ju' },
  { key: 'sat', name: 'Shanba', short: 'Sha' },
];

const SUNDAY = { key: 'sun', name: 'Yakshanba', short: 'Ya' };

const DAY_KEYS_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MONTH_NAMES_SHORT_UZ = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
  'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
];

const getDayKeyFromDateStr = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return DAY_KEYS_MAP[dt.getDay()];
};

const getNextDateForDayKey = (dayKey) => {
  const targetDayIdx = DAY_KEYS_MAP.indexOf(dayKey);
  const today = new Date();
  if (targetDayIdx === -1) {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  const currentDayIdx = today.getDay();
  let diff = targetDayIdx - currentDayIdx;
  if (diff < 0) diff += 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
};

const formatExtraLessonDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) return 'Bugun';
  if (dateStr === tomorrowStr) return 'Ertaga';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${day}-${MONTH_NAMES_SHORT_UZ[monthIdx] || parts[1]}`;
  }
  return dateStr;
};

const getDayNameUzFromDateStr = (dateStr) => {
  const key = getDayKeyFromDateStr(dateStr);
  const found = WEEKDAYS.find((w) => w.key === key) || (key === 'sun' ? SUNDAY : null);
  return found ? found.name : '';
};

const ScheduleView = ({
  groups = [],
  students = [],
  extraLessons = [],
  onAddExtraLesson,
  onUpdateExtraLesson,
  onDeleteExtraLesson,
  onSelectGroup,
  onUpdateGroupSchedule,
  showToast,
  showModal: controlledShowModal,
  setShowModal: controlledSetShowModal,
  initialGroupId = null,
  modalOnly = false,
}) => {
  const [internalShowModal, setInternalShowModal] = useState(false);
  const isControlled = controlledShowModal !== undefined;
  const showModal = isControlled ? controlledShowModal : internalShowModal;
  const setShowModal = isControlled ? controlledSetShowModal : setInternalShowModal;

  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('15:30');
  const [endTime, setEndTime] = useState('17:00');
  const [room, setRoom] = useState('');
  const [activeGroupId, setActiveGroupId] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [selectedGroupForStudents, setSelectedGroupForStudents] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Extra Lesson state
  const [showExtraLessonModal, setShowExtraLessonModal] = useState(false);
  const [editingExtraLesson, setEditingExtraLesson] = useState(null);
  const [extraGroupId, setExtraGroupId] = useState('');
  const [extraDate, setExtraDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [extraStartTime, setExtraStartTime] = useState('15:30');
  const [extraEndTime, setExtraEndTime] = useState('17:00');
  const [extraRoom, setExtraRoom] = useState('');
  const [extraTopic, setExtraTopic] = useState('');
  const [isExtraGroupDropdownOpen, setIsExtraGroupDropdownOpen] = useState(false);
  const [extraTargetType, setExtraTargetType] = useState('all'); // 'all' | 'custom'
  const [extraSelectedStudentIds, setExtraSelectedStudentIds] = useState([]);
  const [extraStudentSearch, setExtraStudentSearch] = useState('');

  // Students belonging to the group currently selected in the Extra Lesson modal
  const modalGroupStudents = useMemo(() => {
    if (!extraGroupId) return [];
    return students
      .filter((s) => String(s.groupId) === String(extraGroupId) && !s.deleted)
      .sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [students, extraGroupId]);

  const filteredModalStudents = useMemo(() => {
    if (!extraStudentSearch.trim()) return modalGroupStudents;
    const q = extraStudentSearch.toLowerCase().trim();
    return modalGroupStudents.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [modalGroupStudents, extraStudentSearch]);

  // Reset search when modal opens/closes
  useEffect(() => {
    setStudentSearchQuery('');
  }, [selectedGroupForStudents]);

  // Filter and sort students for selected group modal
  const selectedGroupStudents = useMemo(() => {
    if (!selectedGroupForStudents) return [];
    return students
      .filter((s) => s.groupId === selectedGroupForStudents.id && !s.deleted)
      .sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [students, selectedGroupForStudents]);

  const displayedStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return selectedGroupStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return selectedGroupStudents.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [selectedGroupStudents, studentSearchQuery]);

  // Mobile selected day tab
  const todayKey = useMemo(() => {
    const dayIdx = new Date().getDay();
    return DAY_KEYS_MAP[dayIdx];
  }, []);

  const [mobileDay, setMobileDay] = useState(todayKey === 'sun' ? 'mon' : todayKey);

  // Check if Sunday has any classes scheduled
  const hasSundayClasses = useMemo(() => {
    const hasRegularSun = groups.some((g) => g.schedule?.days?.includes('sun'));
    const hasExtraSun = (extraLessons || []).some((el) => el && el.date && getDayKeyFromDateStr(el.date) === 'sun');
    return hasRegularSun || hasExtraSun;
  }, [groups, extraLessons]);

  const activeWeekdays = useMemo(() => {
    return hasSundayClasses ? [...WEEKDAYS, SUNDAY] : WEEKDAYS;
  }, [hasSundayClasses]);

  // Count students in each group
  const getStudentCount = (groupId) => {
    return students.filter((s) => s.groupId === groupId).length;
  };

  // Helper: guess schedule from group name if none set
  const guessScheduleFromName = (groupName) => {
    const lower = (groupName || '').toLowerCase();
    let days = [];
    if (lower.includes('dushanba')) days = ['mon'];
    else if (lower.includes('seshanba')) days = ['tue'];
    else if (lower.includes('chorshanba')) days = ['wed'];
    else if (lower.includes('payshanba')) days = ['thu'];
    else if (lower.includes('juma')) days = ['fri'];
    else if (lower.includes('shanba')) days = ['sat'];
    else if (lower.includes('yakshanba')) days = ['sun'];

    let start = '15:30';
    let end = '17:00';
    const timeMatch = groupName.match(/(\d{1,2})[:.](\d{2})/);
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const startHStr = String(h).padStart(2, '0');
      start = `${startHStr}:${m}`;
      const endHStr = String(Math.min(23, h + 1)).padStart(2, '0');
      end = `${endHStr}:${m === '00' ? '30' : m}`;
    }

    return { days, startTime: start, endTime: end, room: '' };
  };

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [groups, activeGroupId]);

  // Escape key and background scroll lock handler for all modals and dropdowns
  const isAnyScheduleModalOpen = Boolean(
    showModal || showExtraLessonModal || selectedGroupForStudents
  );

  useModalDismiss(isAnyScheduleModalOpen, () => {
    if (isGroupDropdownOpen) {
      setIsGroupDropdownOpen(false);
    } else if (isExtraGroupDropdownOpen) {
      setIsExtraGroupDropdownOpen(false);
    } else if (selectedGroupForStudents) {
      setSelectedGroupForStudents(null);
    } else if (showExtraLessonModal) {
      setShowExtraLessonModal(false);
    } else if (showModal) {
      setShowModal(false);
    }
  });

  // Close dropdown whenever modal closes
  useEffect(() => {
    if (!showModal) {
      setIsGroupDropdownOpen(false);
    }
  }, [showModal]);

  // Helper to populate form fields from a group's schedule
  const populateFormForGroup = (group, defaultDay = null) => {
    setIsGroupDropdownOpen(false);
    setActiveGroupId(group.id);
    if (group.schedule && group.schedule.days?.length) {
      setSelectedDays(group.schedule.days || []);
      setStartTime(group.schedule.startTime || '15:30');
      setEndTime(group.schedule.endTime || '17:00');
      setRoom(group.schedule.room || '');
    } else {
      const guessed = guessScheduleFromName(group.name);
      setSelectedDays(defaultDay ? [defaultDay] : (guessed.days.length ? guessed.days : ['mon', 'wed', 'fri']));
      setStartTime(guessed.startTime);
      setEndTime(guessed.endTime);
      setRoom(guessed.room);
    }
  };

  // Sync with initialGroupId or activeGroupId when modal opens
  useEffect(() => {
    if (showModal) {
      const targetId = initialGroupId || activeGroupId || (groups.length > 0 ? groups[0].id : null);
      if (targetId) {
        const targetGroup = groups.find((g) => g.id === targetId);
        if (targetGroup) {
          populateFormForGroup(targetGroup);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, initialGroupId]);

  // Open modal for editing a specific group's schedule
  const handleOpenEdit = (group, defaultDay = null) => {
    populateFormForGroup(group, defaultDay);
    setShowModal(true);
  };

  const handleSelectGroup = (id) => {
    const found = groups.find((g) => g.id === id);
    if (found) {
      populateFormForGroup(found);
    } else {
      setActiveGroupId(id);
      setIsGroupDropdownOpen(false);
    }
  };

  const toggleDay = (dayKey) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const setPresetDays = (preset) => {
    if (preset === 'odd') {
      setSelectedDays(['mon', 'wed', 'fri']);
    } else if (preset === 'even') {
      setSelectedDays(['tue', 'thu', 'sat']);
    } else if (preset === 'all') {
      setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    } else if (preset === 'clear') {
      setSelectedDays([]);
    }
  };

  const handleStartTimeChange = (val) => {
    setStartTime(val);
    // Automatically suggest +90 minutes for end time if appropriate
    if (val && (!endTime || endTime <= val)) {
      const [h, m] = val.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const totalMinutes = h * 60 + m + 90;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        setEndTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
      }
    }
  };

  const handleSave = () => {
    if (!activeGroupId) {
      showToast("Iltimos, guruhni tanlang!", "error");
      return;
    }
    if (!selectedDays.length) {
      showToast("Kamida bitta hafta kunini tanlang!", "error");
      return;
    }
    if (!startTime || !endTime) {
      showToast("Dars boshlanish va tugash vaqtlarini kiriting!", "error");
      return;
    }

    const newSchedule = {
      days: selectedDays,
      startTime: startTime,
      endTime: endTime,
      room: room.trim(),
    };

    onUpdateGroupSchedule(activeGroupId, newSchedule);
    setShowModal(false);
    showToast("Dars jadvali muvaffaqiyatli saqlandi!", "success");
  };

  const handleOpenCreateExtraLesson = (defaultDayKey = null) => {
    setEditingExtraLesson(null);
    const targetGroupId = groups.length > 0 ? groups[0].id : '';
    setExtraGroupId(targetGroupId);

    if (defaultDayKey) {
      setExtraDate(getNextDateForDayKey(defaultDayKey));
    } else {
      const today = new Date();
      setExtraDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    }

    const grp = groups.find((g) => String(g.id) === String(targetGroupId));
    setExtraStartTime(grp?.schedule?.startTime || '15:30');
    setExtraEndTime(grp?.schedule?.endTime || '17:00');
    setExtraRoom(grp?.schedule?.room || '');
    setExtraTopic('');
    setExtraTargetType('all');
    setExtraSelectedStudentIds([]);
    setExtraStudentSearch('');
    setIsExtraGroupDropdownOpen(false);
    setShowExtraLessonModal(true);
  };

  const handleOpenEditExtraLesson = (lesson) => {
    setEditingExtraLesson(lesson);
    setExtraGroupId(lesson.groupId);
    setExtraDate(lesson.date);
    setExtraStartTime(lesson.startTime || '15:30');
    setExtraEndTime(lesson.endTime || '17:00');
    setExtraRoom(lesson.room || '');
    setExtraTopic(lesson.topic || '');
    setExtraTargetType(lesson.targetType === 'custom' ? 'custom' : 'all');
    setExtraSelectedStudentIds(Array.isArray(lesson.studentIds) ? lesson.studentIds : []);
    setExtraStudentSearch('');
    setIsExtraGroupDropdownOpen(false);
    setShowExtraLessonModal(true);
  };

  const handleSaveExtraLesson = () => {
    if (!extraGroupId) {
      showToast("Iltimos, guruhni tanlang!", "error");
      return;
    }
    if (!extraDate) {
      showToast("Iltimos, dars sanasini tanlang!", "error");
      return;
    }
    if (!extraStartTime || !extraEndTime) {
      showToast("Dars boshlanish va tugash vaqtlarini kiriting!", "error");
      return;
    }
    if (extraStartTime >= extraEndTime) {
      showToast("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak!", "error");
      return;
    }
    if (extraTargetType === 'custom' && extraSelectedStudentIds.length === 0) {
      showToast("Iltimos, kamida bitta talabani tanlang!", "error");
      return;
    }

    const payload = {
      groupId: extraGroupId,
      date: extraDate,
      startTime: extraStartTime,
      endTime: extraEndTime,
      room: extraRoom.trim(),
      topic: extraTopic.trim(),
      targetType: extraTargetType,
      studentIds: extraTargetType === 'custom' ? extraSelectedStudentIds : [],
    };

    if (editingExtraLesson) {
      onUpdateExtraLesson?.(editingExtraLesson.id, payload);
      showToast("Extra Lesson yangilandi!", "success");
    } else {
      onAddExtraLesson?.(payload);
      showToast("Extra Lesson muvaffaqiyatli qo'shildi!", "success");
    }
    setShowExtraLessonModal(false);
  };

  const extraSelectedGroup = useMemo(() => {
    return groups.find((g) => String(g.id) === String(extraGroupId)) || null;
  }, [groups, extraGroupId]);

  // Lessons mapped by weekday (Combines regular group schedule + Extra Lessons)
  const scheduleByDay = useMemo(() => {
    const map = {};
    activeWeekdays.forEach((day) => {
      // 1. Regular weekly classes
      const regularClasses = groups
        .filter((g) => g.schedule?.days?.includes(day.key))
        .map((g) => ({
          type: 'regular',
          key: `reg_${g.id}_${day.key}`,
          startTime: g.schedule?.startTime || '00:00',
          endTime: g.schedule?.endTime || '',
          room: g.schedule?.room || '',
          group: g,
        }));

      // 2. Standalone Extra Lessons matching this weekday
      const extraClasses = (extraLessons || [])
        .filter((el) => el && el.date && getDayKeyFromDateStr(el.date) === day.key)
        .map((el) => {
          const matchedGroup = groups.find((g) => g.id === el.groupId);
          return {
            type: 'extra',
            key: `extra_${el.id}`,
            startTime: el.startTime || '00:00',
            endTime: el.endTime || '',
            room: el.room || '',
            extraLesson: el,
            group: matchedGroup || { id: el.groupId, name: 'Guruh', color: '#8B5CF6' },
          };
        });

      // Combine and sort chronologically by startTime
      map[day.key] = [...regularClasses, ...extraClasses].sort((a, b) =>
        (a.startTime || '00:00').localeCompare(b.startTime || '00:00')
      );
    });
    return map;
  }, [groups, activeWeekdays, extraLessons]);

  // Helper to get group styling
  const getGroupStyle = (colorValue) => {
    const opt = GROUP_COLOR_OPTIONS.find((c) => c.value === colorValue) || GROUP_COLOR_OPTIONS[0];
    return {
      '--card-bg-light': opt.value || '#FFFFFF',
      '--card-border-light': opt.border || 'rgba(0, 0, 0, 0.08)',
      '--card-bg-dark': opt.darkBg || '#292A2D',
      '--card-border-dark': opt.darkBorder || '#3C4043',
    };
  };

  return (
    <>
      {!modalOnly && (
        <div className="schedule-container">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h2 className="page-title">Dars Jadvalim</h2>
            </div>
            <button
              type="button"
              className="btn btn-primary scale-active"
              onClick={() => {
                if (groups.length === 0) {
                  showToast("Extra dars qo'shish uchun dastlab guruh yarating!", "error");
                  return;
                }
                handleOpenCreateExtraLesson();
              }}
            >
              <span>+ Extra Dars</span>
            </button>
          </div>

          {/* Mobile Day Switcher Tabs (Visible on screens < 768px) */}
      <div className="mobile-day-tabs">
        {activeWeekdays.map((day) => {
          const count = scheduleByDay[day.key]?.length || 0;
          const isToday = day.key === todayKey;
          const isActive = day.key === mobileDay;
          return (
            <button
              key={day.key}
              type="button"
              className={`mobile-day-pill ${isActive ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => setMobileDay(day.key)}
            >
              <span className="mobile-day-short">{day.short}</span>
              {count > 0 && <span className="mobile-day-dot" />}
            </button>
          );
        })}
      </div>

      {/* Weekly Timetable Grid (Desktop: 6/7 columns, Mobile: shows selected day) */}
      <div className="weekly-grid-wrapper">
        <div className="weekly-timetable-grid">
          {activeWeekdays.map((day) => {
            const dayClasses = scheduleByDay[day.key] || [];
            const isToday = day.key === todayKey;
            const isSelectedMobile = day.key === mobileDay;

            return (
              <div
                key={day.key}
                className={`timetable-day-col ${isToday ? 'current-day-col' : ''} ${
                  isSelectedMobile ? 'mobile-selected-day' : ''
                }`}
              >
                {/* Column Header */}
                <div className="day-col-header">
                  <div className="day-col-title-wrap">
                    <span className="day-col-name">{day.name}</span>
                    {isToday && <span className="day-today-indicator">Bugun</span>}
                  </div>
                  <span className="day-classes-count">
                    {dayClasses.length}
                  </span>
                </div>

                {/* Day Classes List */}
                <div className="day-col-content">
                  {dayClasses.length > 0 ? (
                    dayClasses.map((item) => {
                      if (item.type === 'extra') {
                        const extraLesson = item.extraLesson;
                        const group = item.group;

                        return (
                          <div
                            key={item.key}
                            className="schedule-lesson-card extra-lesson-card scale-active"
                            onClick={() => setSelectedGroupForStudents(group)}
                            title="Guruh talabalari ro'yxatini ko'rish uchun bosing"
                          >
                            <div className="extra-lesson-top-row">
                              <span className="extra-lesson-badge">
                                <span className="extra-lesson-badge-pulse" />
                                ⚡ Extra Lesson
                              </span>
                              <span className="extra-lesson-date-pill">
                                {formatExtraLessonDateLabel(extraLesson.date)}
                              </span>
                            </div>

                            <div className="lesson-time-and-actions">
                              <span className="lesson-time-range">
                                {item.startTime}
                                {item.endTime ? ` - ${item.endTime}` : ''}
                              </span>
                              <div className="extra-actions-group">
                                {item.room && (
                                  <span className="lesson-room-pill">{item.room}</span>
                                )}
                                <button
                                  type="button"
                                  className="extra-action-icon-btn edit-btn"
                                  title="Extra Lessonni tahrirlash"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditExtraLesson(extraLesson);
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="extra-action-icon-btn delete-btn"
                                  title="Extra Lessonni o'chirish"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Haqiqatan ham ushbu qo'shimcha darsni (Extra Lesson) o'chirmoqchimisiz?")) {
                                      onDeleteExtraLesson?.(extraLesson.id);
                                    }
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <div className="lesson-group-main">
                              <div className="lesson-group-icon avatar-circle">
                                {renderGroupIcon(group.icon, 16)}
                              </div>
                              <span className="lesson-group-title">{group.name}</span>
                            </div>

                            {/* Targeted Students Display on Card */}
                            {extraLesson.targetType === 'custom' && Array.isArray(extraLesson.studentIds) && extraLesson.studentIds.length > 0 ? (() => {
                              const targetedList = students.filter(
                                (s) => extraLesson.studentIds.some((id) => String(id) === String(s.id)) && !s.deleted
                              );
                              const fullNamesTitle = targetedList.map((s) => s.name).join(', ');
                              return (
                                <div className="extra-lesson-target-badge individual" title={`Tanlangan talabalar: ${fullNamesTitle}`}>
                                  <div className="extra-target-avatar-stack">
                                    {targetedList.slice(0, 3).map((st) => (
                                      <div key={st.id} className="extra-target-mini-avatar" title={st.name}>
                                        {st.avatar ? (
                                          <img src={st.avatar} alt={st.name} />
                                        ) : (
                                          <span>{(st.name || '?')[0].toUpperCase()}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="extra-target-label">
                                    {targetedList.length === 1
                                      ? targetedList[0].name
                                      : `${targetedList.length} ta talaba: ${targetedList.slice(0, 2).map((s) => s.name.split(' ')[0]).join(', ')}${targetedList.length > 2 ? ` +${targetedList.length - 2}` : ''}`}
                                  </span>
                                </div>
                              );
                            })() : (
                              <div className="extra-lesson-target-badge all-group" title={`Guruhning barcha talabalari uchun (${getStudentCount(group.id)} ta)`}>
                                <span className="extra-target-icon">👥</span>
                                <span className="extra-target-label">Butun guruh ({getStudentCount(group.id)})</span>
                              </div>
                            )}

                            {extraLesson.topic && (
                              <div className="extra-lesson-topic-box" title={extraLesson.topic}>
                                <span className="extra-topic-icon">🎯</span>
                                <span className="extra-topic-text">{extraLesson.topic}</span>
                              </div>
                            )}

                            <div className="lesson-card-footer">
                              <span className={`group-category-pill group-category-${getGroupCategory(group)}`}>
                                {getGroupCategory(group) === 'kids' ? 'Kids' : 'Teens'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const group = item.group;
                      const cardStyles = getGroupStyle(group.color);

                      return (
                        <div
                          key={item.key}
                          className="schedule-lesson-card scale-active"
                          style={cardStyles}
                          onClick={() => setSelectedGroupForStudents(group)}
                          title="Guruh talabalari ro'yxatini ko'rish uchun bosing"
                        >
                          <div className="lesson-time-header">
                            <span className="lesson-time-range">
                              {item.startTime}
                              {item.endTime ? ` - ${item.endTime}` : ''}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {item.room && (
                                <span className="lesson-room-pill">{item.room}</span>
                              )}
                              <button
                                type="button"
                                className="lesson-card-action-btn"
                                title="Doimiy dars jadvalini tahrirlash"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(group);
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="lesson-group-main">
                            <div className="lesson-group-icon avatar-circle">
                              {renderGroupIcon(group.icon, 16)}
                            </div>
                            <span className="lesson-group-title">{group.name}</span>
                          </div>

                          <div className="lesson-card-footer">
                            <span className={`group-category-pill group-category-${getGroupCategory(group)}`}>
                              {getGroupCategory(group) === 'kids' ? 'Kids' : 'Teens'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      className="day-empty-slot"
                      onClick={() => {
                        if (groups.length > 0) {
                          handleOpenCreateExtraLesson(day.key);
                        } else {
                          showToast("Dastlab guruh yarating!", "error");
                        }
                      }}
                      title="Ushbu kunga Extra Dars biriktirish uchun bosing"
                    >
                      <span className="empty-slot-text">Dars yo'q</span>
                      <span className="empty-slot-plus">+ Extra Dars</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )}

  {/* Edit / Add Schedule Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass schedule-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header-fixed">
              <h3 className="modal-title">Dars Vaqtini Belgilash</h3>
              <p className="modal-sub-info" style={{ margin: 0 }}>
                Guruh uchun dars kunlari, boshlanish va tugash vaqtlarini kiriting.
              </p>
            </div>

            <div className="modal-body-scrollable">
              {/* Select Group (Custom Project Styled Popover) */}
              <div className="form-group schedule-group-picker-form-group">
              <label className="form-label">Guruh</label>
              <div className="custom-dropdown-container schedule-group-dropdown-wrap">
                <button
                  type="button"
                  className={`filter-select-btn schedule-custom-select-btn ${isGroupDropdownOpen ? 'active' : ''}`}
                  onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                >
                  <div className="schedule-select-val">
                    {activeGroup ? (
                      <>
                        <div className="schedule-group-pill-icon">
                          {renderGroupIcon(activeGroup.icon, 16)}
                        </div>
                        <span className="schedule-select-group-name">{activeGroup.name}</span>
                        <span className={`group-category-pill group-category-${getGroupCategory(activeGroup)}`}>
                          {getGroupCategory(activeGroup) === 'kids' ? 'Kids' : 'Teens'}
                        </span>
                        <span className="schedule-select-student-count">({getStudentCount(activeGroup.id)} talaba)</span>
                      </>
                    ) : (
                      <span className="schedule-select-placeholder">Guruhni tanlang</span>
                    )}
                  </div>
                  <span className={`dropdown-arrow ${isGroupDropdownOpen ? 'rotated' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {isGroupDropdownOpen && (
                  <>
                    <div className="schedule-select-backdrop" onClick={() => setIsGroupDropdownOpen(false)} />
                    <div className="custom-dropdown-list glass schedule-custom-dropdown-list">
                      {groups.map((g) => {
                        const isSelected = String(g.id) === String(activeGroupId);
                        const count = getStudentCount(g.id);
                        return (
                          <div
                            key={g.id}
                            className={`custom-dropdown-item schedule-dropdown-item ${isSelected ? 'active' : ''}`}
                            onClick={() => handleSelectGroup(g.id)}
                          >
                            <div className="schedule-item-left">
                              <div className="schedule-group-pill-icon">
                                {renderGroupIcon(g.icon, 16)}
                              </div>
                              <span className="schedule-item-name">{g.name}</span>
                              <span className={`group-category-pill group-category-${getGroupCategory(g)}`}>
                                {getGroupCategory(g) === 'kids' ? 'Kids' : 'Teens'}
                              </span>
                              <span className="schedule-item-count">({count} talaba)</span>
                            </div>
                            {isSelected && (
                              <span className="schedule-item-check">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Weekdays Picker */}
            <div className="form-group">
              <div className="schedule-section-header">
                <label className="form-label" style={{ margin: 0 }}>Hafta kunlari</label>
                <div className="schedule-presets-wrap">
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => setPresetDays('odd')}
                  >
                    Du-Cho-Ju
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => setPresetDays('even')}
                  >
                    Se-Pa-Sha
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => setPresetDays('all')}
                  >
                    Har kuni
                  </button>
                </div>
              </div>

              <div className="days-chip-grid">
                {[...WEEKDAYS, SUNDAY].map((day) => {
                  const isSelected = selectedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      className={`day-chip-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleDay(day.key)}
                    >
                      <span className="day-chip-short">{day.short}</span>
                      <span className="day-chip-name">{day.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time range (24-hour format) */}
            <div className="schedule-time-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Boshlanish vaqti</label>
                <Time24Input
                  value={startTime}
                  onChange={handleStartTimeChange}
                  placeholder="15:30"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Tugash vaqti</label>
                <Time24Input
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="17:00"
                />
              </div>
            </div>

            {/* Quick 24-hour presets */}
            <div className="time-presets-bar">
              <span className="time-presets-label">Tezkor:</span>
              <div className="time-presets-chips">
                {['08:00', '09:30', '11:00', '14:00', '15:30', '17:00', '18:30'].map((timeStr) => (
                  <button
                    key={timeStr}
                    type="button"
                    className={`time-preset-chip ${startTime === timeStr ? 'active' : ''}`}
                    onClick={() => handleStartTimeChange(timeStr)}
                  >
                    {timeStr}
                  </button>
                ))}
              </div>
            </div>

            {/* Room (Optional) */}
            <div className="form-group">
              <label className="form-label">
                Xona / Kabinet raqami <span style={{ opacity: 0.6, fontWeight: 400 }}>(ixtiyoriy)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Masalan: 204-xona yoki Lab 1"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-fixed">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setShowModal(false)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-primary scale-active"
                onClick={handleSave}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Extra Lesson Modal (Standalone Date-Specific Lesson) */}
      {showExtraLessonModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowExtraLessonModal(false)}>
          <div className="modal-content glass schedule-modal-box extra-lesson-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowExtraLessonModal(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header-fixed extra-modal-header" style={{ marginBottom: '14px' }}>
              <span className="extra-modal-badge">Mustaqil Dars</span>
              <h3 className="modal-title">
                {editingExtraLesson ? "Extra Lessonni Tahrirlash" : "Yangi Extra Lesson Qo'shish"}
              </h3>
              <p className="modal-sub-info" style={{ margin: 0 }}>
                Doimiy dars jadvalidan mustaqil ravishda alohida sana va vaqt uchun qo'shimcha dars belgilash.
              </p>
            </div>

            <div className="modal-body-scrollable">
              {/* Select Group */}
              <div className="form-group schedule-group-picker-form-group">
              <label className="form-label">Guruh</label>
              <div className="custom-dropdown-container schedule-group-dropdown-wrap">
                <button
                  type="button"
                  className={`filter-select-btn schedule-custom-select-btn ${isExtraGroupDropdownOpen ? 'active' : ''}`}
                  onClick={() => setIsExtraGroupDropdownOpen((prev) => !prev)}
                >
                  <div className="schedule-select-val">
                    {extraSelectedGroup ? (
                      <>
                        <div className="schedule-group-pill-icon">
                          {renderGroupIcon(extraSelectedGroup.icon, 16)}
                        </div>
                        <span className="schedule-select-group-name">{extraSelectedGroup.name}</span>
                        <span className={`group-category-pill group-category-${getGroupCategory(extraSelectedGroup)}`}>
                          {getGroupCategory(extraSelectedGroup) === 'kids' ? 'Kids' : 'Teens'}
                        </span>
                        <span className="schedule-select-student-count">({getStudentCount(extraSelectedGroup.id)} talaba)</span>
                      </>
                    ) : (
                      <span className="schedule-select-placeholder">Guruhni tanlang...</span>
                    )}
                  </div>
                  <span className={`dropdown-arrow ${isExtraGroupDropdownOpen ? 'rotated' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {isExtraGroupDropdownOpen && (
                  <>
                    <div className="schedule-select-backdrop" onClick={() => setIsExtraGroupDropdownOpen(false)} />
                    <div className="custom-dropdown-list glass schedule-custom-dropdown-list">
                      {groups.map((g) => {
                        const isSelected = String(g.id) === String(extraGroupId);
                        const count = getStudentCount(g.id);
                        return (
                          <div
                            key={g.id}
                            className={`custom-dropdown-item schedule-dropdown-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setExtraGroupId(g.id);
                              setIsExtraGroupDropdownOpen(false);
                              if (extraTargetType === 'custom') {
                                setExtraSelectedStudentIds([]);
                              }
                              if (!editingExtraLesson && g.schedule) {
                                if (g.schedule.startTime) setExtraStartTime(g.schedule.startTime);
                                if (g.schedule.endTime) setExtraEndTime(g.schedule.endTime);
                                if (g.schedule.room) setExtraRoom(g.schedule.room);
                              }
                            }}
                          >
                            <div className="schedule-item-left">
                              <div className="schedule-group-pill-icon">
                                {renderGroupIcon(g.icon, 16)}
                              </div>
                              <span className="schedule-item-name">{g.name}</span>
                              <span className={`group-category-pill group-category-${getGroupCategory(g)}`}>
                                {getGroupCategory(g) === 'kids' ? 'Kids' : 'Teens'}
                              </span>
                              <span className="schedule-item-count">({count} talaba)</span>
                            </div>
                            {isSelected && (
                              <span className="schedule-item-check">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Target Scope: All group vs Custom students */}
            <div className="form-group">
              <label className="form-label">Dars qamrovi</label>
              <div className="extra-target-segmented">
                <button
                  type="button"
                  className={`extra-target-seg-btn ${extraTargetType === 'all' ? 'active' : ''}`}
                  onClick={() => setExtraTargetType('all')}
                >
                  Butun guruh ({modalGroupStudents.length})
                </button>
                <button
                  type="button"
                  className={`extra-target-seg-btn ${extraTargetType === 'custom' ? 'active' : ''}`}
                  onClick={() => setExtraTargetType('custom')}
                >
                  Alohida talabalar {extraSelectedStudentIds.length > 0 ? `(${extraSelectedStudentIds.length})` : ''}
                </button>
              </div>

              {extraTargetType === 'custom' && (
                <div className="extra-student-picker-card">
                  <div className="extra-student-picker-header">
                    <div className="extra-student-search-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="extra-student-search-input"
                        placeholder="Talaba ismini qidirish..."
                        value={extraStudentSearch}
                        onChange={(e) => setExtraStudentSearch(e.target.value)}
                      />
                      {extraStudentSearch && (
                        <button
                          type="button"
                          className="extra-student-search-clear"
                          onClick={() => setExtraStudentSearch('')}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="extra-student-select-all-btn"
                      onClick={() => {
                        if (extraSelectedStudentIds.length === modalGroupStudents.length && modalGroupStudents.length > 0) {
                          setExtraSelectedStudentIds([]);
                        } else {
                          setExtraSelectedStudentIds(modalGroupStudents.map((s) => s.id));
                        }
                      }}
                    >
                      {extraSelectedStudentIds.length === modalGroupStudents.length && modalGroupStudents.length > 0 ? "Tozalash" : "Barchasini tanlash"}
                    </button>
                  </div>

                  <div className="extra-student-picker-list">
                    {filteredModalStudents.length > 0 ? (
                      filteredModalStudents.map((s) => {
                        const isChecked = extraSelectedStudentIds.some((id) => String(id) === String(s.id));
                        return (
                          <label key={s.id} className={`extra-student-picker-item ${isChecked ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              className="extra-student-checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setExtraSelectedStudentIds(extraSelectedStudentIds.filter((id) => String(id) !== String(s.id)));
                                } else {
                                  setExtraSelectedStudentIds([...extraSelectedStudentIds, s.id]);
                                }
                              }}
                            />
                            <span className="extra-student-name">{s.name}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="extra-student-empty-text">
                        {extraStudentSearch ? "Talaba topilmadi" : "Bu guruhda hali talabalar mavjud emas"}
                      </div>
                    )}
                  </div>

                  <div className="extra-student-picker-footer">
                    <span>Tanlandi: <strong>{extraSelectedStudentIds.length}</strong> / {modalGroupStudents.length} ta talaba</span>
                    {extraSelectedStudentIds.length === 0 && (
                      <span className="extra-student-warning-text">Kamida 1 ta talaba tanlanishi shart</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Input */}
            <div className="form-group">
              <label className="form-label">Sana (Kalendar kuni)</label>
              <input
                type="date"
                className="form-input modal-date-input"
                value={extraDate}
                onChange={(e) => setExtraDate(e.target.value)}
                required
              />
              {extraDate && (
                <span className="field-hint-text">
                  Tanlangan kun: <strong>{getDayNameUzFromDateStr(extraDate) || "Noma'lum"} ({formatExtraLessonDateLabel(extraDate)})</strong>
                </span>
              )}
            </div>

            {/* Start and End Times */}
            <div className="schedule-time-row">
              <div className="form-group flex-1">
                <label className="form-label">Boshlanish vaqti</label>
                <Time24Input
                  value={extraStartTime}
                  onChange={(val) => {
                    setExtraStartTime(val);
                    if (val && (!extraEndTime || extraEndTime <= val)) {
                      const [h, m] = val.split(':').map(Number);
                      if (!isNaN(h) && !isNaN(m)) {
                        const totalMinutes = h * 60 + m + 90;
                        const newH = Math.floor(totalMinutes / 60) % 24;
                        const newM = totalMinutes % 60;
                        setExtraEndTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
                      }
                    }
                  }}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">Tugash vaqti</label>
                <Time24Input
                  value={extraEndTime}
                  onChange={setExtraEndTime}
                />
              </div>
            </div>

            {/* Room */}
            <div className="form-group">
              <label className="form-label">Xona (Ixtiyoriy)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masalan: 204-xona, Lab 1..."
                value={extraRoom}
                onChange={(e) => setExtraRoom(e.target.value)}
                maxLength={40}
              />
            </div>

            {/* Topic / Note */}
            <div className="form-group">
              <label className="form-label">Dars Mavzusi / Izoh (Ixtiyoriy)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masalan: Oraliq nazoratga tayyorgarlik, qo'shimcha amaliyot..."
                value={extraTopic}
                onChange={(e) => setExtraTopic(e.target.value)}
                maxLength={120}
              />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions-footer modal-actions-fixed">
              {editingExtraLesson && (
                <button
                  type="button"
                  className="btn-danger-outline scale-active"
                  onClick={() => {
                    if (window.confirm("Haqiqatan ham ushbu Extra Lessonni o'chirmoqchimisiz?")) {
                      onDeleteExtraLesson?.(editingExtraLesson.id);
                      setShowExtraLessonModal(false);
                    }
                  }}
                >
                  O'chirish
                </button>
              )}
              <div className="modal-actions-right">
                <button
                  type="button"
                  className="btn btn-secondary scale-active"
                  onClick={() => setShowExtraLessonModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="btn btn-primary scale-active"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', border: 'none' }}
                  onClick={handleSaveExtraLesson}
                >
                  <span>{editingExtraLesson ? "O'zgarishlarni Saqlash" : "Darsni Qo'shish"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Roster Students List Modal */}
      {selectedGroupForStudents && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedGroupForStudents(null)}>
          <div
            className="modal-content glass student-list-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={getGroupStyle(selectedGroupForStudents.color)}
          >
            {/* Modal Header */}
            <div className="student-list-modal-header">
              <div className="student-list-header-left">
                <div className="student-list-group-badge avatar-circle">
                  {renderGroupIcon(selectedGroupForStudents.icon, 24)}
                </div>
                <div className="student-list-header-info">
                  <div className="student-list-title-row">
                    <h3 className="student-list-group-name">{selectedGroupForStudents.name}</h3>
                    <span className={`group-category-pill group-category-${getGroupCategory(selectedGroupForStudents)}`}>
                      {getGroupCategory(selectedGroupForStudents) === 'kids' ? 'Kids' : 'Teens'}
                    </span>
                    <span className="student-list-count-badge">
                      {selectedGroupStudents.length} ta talaba
                    </span>
                  </div>
                  <div className="student-list-meta-row">
                    {selectedGroupForStudents.schedule?.startTime && (
                      <span className="student-list-time-pill">
                        {selectedGroupForStudents.schedule.startTime}
                        {selectedGroupForStudents.schedule.endTime ? ` - ${selectedGroupForStudents.schedule.endTime}` : ''}
                      </span>
                    )}
                    {selectedGroupForStudents.schedule?.room && (
                      <span className="student-list-room-pill">{selectedGroupForStudents.schedule.room}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="student-list-close-btn scale-active"
                onClick={() => setSelectedGroupForStudents(null)}
                title="Yopish (Esc)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Quick Search for Groups with 7+ students */}
            {selectedGroupStudents.length > 6 && (
              <div className="student-list-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="student-list-search-input"
                  placeholder="Talabalar orasidan qidirish..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    className="student-list-search-clear"
                    onClick={() => setStudentSearchQuery('')}
                    title="Tozalash"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Student List (Numbered, Non-clickable, Optimized Grid/List) */}
            <div className="student-list-modal-body">
              {displayedStudents.length > 0 ? (
                <div className="compact-students-container">
                  {displayedStudents.map((student, idx) => (
                    <div
                      key={student.id}
                      className="compact-student-row"
                    >
                      <span className="compact-student-index">{idx + 1}.</span>
                      <div className="compact-student-avatar avatar-circle">
                        {renderAvatar(student.emoji)}
                      </div>
                      <span className="compact-student-name" title={student.name}>
                        {student.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : selectedGroupStudents.length > 0 ? (
                <div className="compact-students-empty">
                  <p className="compact-empty-title">Talaba topilmadi</p>
                  <p className="compact-empty-sub">"{studentSearchQuery}" bo'yicha hech kim chiqmadi.</p>
                </div>
              ) : (
                <div className="compact-students-empty">
                  <div className="compact-empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                  <p className="compact-empty-title">Ushbu guruhda talabalar yo'q</p>
                  <p className="compact-empty-sub">Guruh sahifasiga kirib yangi talabalar qo'shishingiz mumkin.</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="student-list-modal-footer">
              <button
                type="button"
                className="btn btn-secondary scale-active student-list-edit-btn"
                onClick={() => {
                  const grp = selectedGroupForStudents;
                  setSelectedGroupForStudents(null);
                  handleOpenEdit(grp);
                }}
                title="Dars vaqti va kunlarini o'zgartirish"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Vaqtni tahrirlash</span>
              </button>

              {onSelectGroup ? (
                <button
                  type="button"
                  className="btn btn-primary scale-active"
                  onClick={() => {
                    const gId = selectedGroupForStudents.id;
                    setSelectedGroupForStudents(null);
                    onSelectGroup(gId);
                  }}
                >
                  <span>Guruhga o'tish →</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary scale-active"
                  onClick={() => setSelectedGroupForStudents(null)}
                >
                  <span>Yopish</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Schedule View Styles */}
      <style>{`
        .schedule-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Today's schedule banner */
        .today-schedule-banner {
          padding: 20px 24px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        [data-theme="dark"] .today-schedule-banner {
          background: #292A2D;
          border-color: #3C4043;
        }

        .today-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .today-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .today-badge {
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: #1D1D1F;
          color: #FFFFFF;
        }

        [data-theme="dark"] .today-badge {
          background: var(--apple-blue);
          color: #1D1D1F;
        }

        .today-date-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .today-count-pill {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: #F5F5F7;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] .today-count-pill {
          background: #202124;
          border-color: #3C4043;
          color: var(--text-secondary);
        }

        .today-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .today-lesson-card {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background-color: var(--card-bg-light, #FFFFFF);
          border: 1px solid var(--card-border-light, rgba(0, 0, 0, 0.08));
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        [data-theme="dark"] .today-lesson-card {
          background-color: var(--card-bg-dark, #292A2D) !important;
          border-color: var(--card-border-dark, #3C4043) !important;
        }

        .today-lesson-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .today-card-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .today-group-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        [data-theme="dark"] .today-group-icon {
          background: #202124;
          border-color: #3C4043;
        }

        .today-card-info {
          min-width: 0;
          flex: 1;
        }

        .today-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .today-card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 3px;
        }

        .today-time-badge {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--apple-blue);
          font-variant-numeric: tabular-nums;
        }

        .today-room-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.05);
          padding: 1px 6px;
          border-radius: 4px;
        }

        [data-theme="dark"] .today-room-badge {
          background: rgba(255, 255, 255, 0.08);
        }

        .today-empty-note {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-style: italic;
          padding: 8px 0;
        }

        /* Mobile day tabs */
        .mobile-day-tabs {
          display: none;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-day-pill {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 8px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          cursor: pointer;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.86rem;
          transition: all var(--transition-fast);
          min-width: 50px;
          position: relative;
        }

        [data-theme="dark"] .mobile-day-pill {
          background: #292A2D;
          border-color: #3C4043;
        }

        .mobile-day-pill.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        [data-theme="dark"] .mobile-day-pill.active {
          background: var(--apple-blue);
          color: #1D1D1F;
          border-color: var(--apple-blue);
        }

        .mobile-day-pill.is-today:not(.active) {
          border-color: var(--apple-blue);
          color: var(--apple-blue);
        }

        .mobile-day-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          margin-top: 4px;
        }

        /* Weekly timetable grid */
        .weekly-grid-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .weekly-timetable-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          min-width: 850px;
        }

        .timetable-day-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #FBFBFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          padding: 12px;
          min-height: 280px;
        }

        [data-theme="dark"] .timetable-day-col {
          background: #242528;
          border-color: #34373B;
        }

        .timetable-day-col.current-day-col {
          border-color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.02);
        }

        [data-theme="dark"] .timetable-day-col.current-day-col {
          border-color: var(--apple-blue);
          background: rgba(138, 180, 248, 0.05);
        }

        .day-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        [data-theme="dark"] .day-col-header {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .day-col-title-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .day-col-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .day-today-indicator {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          background: var(--apple-blue);
          color: #FFFFFF;
          padding: 1px 5px;
          border-radius: 4px;
        }

        [data-theme="dark"] .day-today-indicator {
          color: #1D1D1F;
        }

        .day-classes-count {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.05);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [data-theme="dark"] .day-classes-count {
          background: rgba(255, 255, 255, 0.08);
        }

        .day-col-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .schedule-lesson-card {
          padding: 12px;
          border-radius: var(--radius-md);
          background-color: var(--card-bg-light, #FFFFFF);
          border: 1px solid var(--card-border-light, rgba(0, 0, 0, 0.08));
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        [data-theme="dark"] .schedule-lesson-card {
          background-color: var(--card-bg-dark, #292A2D) !important;
          border-color: var(--card-border-dark, #3C4043) !important;
        }

        .schedule-lesson-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* Extra Lesson Card Styling */
        .schedule-lesson-card.extra-lesson-card {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.07) 0%, rgba(245, 158, 11, 0.05) 100%), #FFFFFF !important;
          border: 1.5px solid rgba(124, 58, 237, 0.4) !important;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.08);
          position: relative;
        }

        [data-theme="dark"] .schedule-lesson-card.extra-lesson-card {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.16) 0%, rgba(245, 158, 11, 0.09) 100%), #25262B !important;
          border: 1.5px solid rgba(167, 139, 250, 0.5) !important;
          box-shadow: 0 2px 12px rgba(124, 58, 237, 0.18);
        }

        .schedule-lesson-card.extra-lesson-card:hover {
          border-color: rgba(124, 58, 237, 0.8) !important;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.22);
        }

        .extra-lesson-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 6px;
          margin-bottom: 2px;
        }

        .extra-lesson-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          background: rgba(124, 58, 237, 0.12);
          color: #7C3AED;
          border: 1px solid rgba(124, 58, 237, 0.25);
        }

        [data-theme="dark"] .extra-lesson-badge {
          background: rgba(167, 139, 250, 0.18);
          color: #C4B5FD;
          border-color: rgba(167, 139, 250, 0.35);
        }

        .extra-lesson-badge-pulse {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #7C3AED;
          box-shadow: 0 0 6px #7C3AED;
        }

        [data-theme="dark"] .extra-lesson-badge-pulse {
          background: #A78BFA;
          box-shadow: 0 0 6px #A78BFA;
        }

        .extra-lesson-date-pill {
          font-size: 0.67rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(245, 158, 11, 0.12);
          color: #D97706;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        [data-theme="dark"] .extra-lesson-date-pill {
          background: rgba(245, 158, 11, 0.2);
          color: #FBBF24;
          border-color: rgba(245, 158, 11, 0.35);
        }

        .lesson-time-and-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 6px;
        }

        .extra-actions-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .extra-action-icon-btn {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          transition: all 0.15s ease;
          padding: 0;
        }

        .extra-action-icon-btn:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.06);
        }

        [data-theme="dark"] .extra-action-icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .extra-action-icon-btn.delete-btn:hover {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.12);
        }

        .lesson-card-action-btn {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          transition: all 0.15s ease;
          padding: 0;
        }

        .lesson-card-action-btn:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.06);
        }

        [data-theme="dark"] .lesson-card-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .extra-lesson-topic-box {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.03);
          border-left: 2px solid #8B5CF6;
          padding: 3px 6px;
          border-radius: 0 4px 4px 0;
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [data-theme="dark"] .extra-lesson-topic-box {
          background: rgba(255, 255, 255, 0.04);
          border-left-color: #A78BFA;
        }

        .extra-topic-icon {
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .extra-modal-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
        }

        .extra-modal-badge {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          background: rgba(124, 58, 237, 0.12);
          color: #7C3AED;
        }

        [data-theme="dark"] .extra-modal-badge {
          background: rgba(167, 139, 250, 0.18);
          color: #C4B5FD;
        }

        .modal-date-input {
          font-family: inherit;
          color-scheme: light dark;
        }

        .field-hint-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
          display: block;
        }

        .modal-actions-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .modal-actions-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }

        .btn-danger-outline {
          background: transparent;
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          padding: 8px 14px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-danger-outline:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #EF4444;
        }

        /* Extra Lesson Target Scope Segmented */
        .extra-target-segmented {
          display: flex;
          background: rgba(0, 0, 0, 0.04);
          border-radius: var(--radius-sm, 8px);
          padding: 3px;
          gap: 4px;
          border: 1px solid var(--border-color);
        }

        [data-theme="dark"] .extra-target-segmented {
          background: rgba(255, 255, 255, 0.05);
          border-color: #3C4043;
        }

        .extra-target-seg-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .extra-target-seg-btn:hover {
          color: var(--text-primary);
        }

        .extra-target-seg-btn.active {
          background: #FFFFFF;
          color: var(--apple-blue, #0071E3);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] .extra-target-seg-btn.active {
          background: #35363A;
          color: #8AB4F8;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        /* Student Picker Card inside Modal */
        .extra-student-picker-card {
          margin-top: 8px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 10px);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        [data-theme="dark"] .extra-student-picker-card {
          background: rgba(255, 255, 255, 0.02);
          border-color: #3C4043;
        }

        .extra-student-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .extra-student-search-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm, 6px);
          padding: 6px 10px;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }

        .extra-student-search-wrap:focus-within {
          border-color: var(--apple-blue, #0071E3);
          box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.15);
        }

        [data-theme="dark"] .extra-student-search-wrap {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .extra-student-search-wrap:focus-within {
          border-color: #8AB4F8;
          box-shadow: 0 0 0 2px rgba(138, 180, 248, 0.2);
        }

        .extra-student-search-input {
          flex: 1;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
          font-size: 0.85rem;
          color: var(--text-primary);
          font-family: inherit;
        }

        .extra-student-search-input:focus {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .extra-student-search-clear {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0 2px;
        }

        .extra-student-select-all-btn {
          background: transparent;
          border: none;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--apple-blue, #0071E3);
          cursor: pointer;
          padding: 4px 6px;
          white-space: nowrap;
        }

        [data-theme="dark"] .extra-student-select-all-btn {
          color: #8AB4F8;
        }

        .extra-student-picker-list {
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-right: 4px;
        }

        .extra-student-picker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.12s ease;
          user-select: none;
        }

        .extra-student-picker-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        [data-theme="dark"] .extra-student-picker-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .extra-student-picker-item.selected {
          background: rgba(0, 113, 227, 0.08);
        }

        [data-theme="dark"] .extra-student-picker-item.selected {
          background: rgba(138, 180, 248, 0.12);
        }

        .extra-student-checkbox {
          cursor: pointer;
          accent-color: var(--apple-blue, #0071E3);
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin: 0;
        }

        .extra-student-name {
          flex: 1;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .extra-student-picker-item.selected .extra-student-name {
          font-weight: 600;
          color: var(--apple-blue, #0071E3);
        }

        [data-theme="dark"] .extra-student-picker-item.selected .extra-student-name {
          color: #8AB4F8;
        }

        .extra-student-empty-text {
          padding: 16px;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .extra-student-picker-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.74rem;
          color: var(--text-secondary);
          padding-top: 4px;
          border-top: 1px solid var(--border-color);
        }

        .extra-student-warning-text {
          color: #EF4444;
          font-weight: 600;
        }

        /* Targeted Student Badge on Schedule Grid Cards */
        .extra-lesson-target-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          padding: 3px 6px;
          border-radius: 5px;
          background: rgba(0, 0, 0, 0.03);
          margin-top: 2px;
          overflow: hidden;
        }

        [data-theme="dark"] .extra-lesson-target-badge {
          background: rgba(255, 255, 255, 0.04);
        }

        .extra-lesson-target-badge.individual {
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #6D28D9;
        }

        [data-theme="dark"] .extra-lesson-target-badge.individual {
          background: rgba(167, 139, 250, 0.12);
          border-color: rgba(167, 139, 250, 0.25);
          color: #C4B5FD;
        }

        .extra-target-avatar-stack {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .extra-target-mini-avatar {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #FFFFFF;
          margin-left: -5px;
          overflow: hidden;
          background: #E5E7EB;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.55rem;
          font-weight: 700;
          color: #374151;
        }

        .extra-target-mini-avatar:first-child {
          margin-left: 0;
        }

        .extra-target-mini-avatar img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        [data-theme="dark"] .extra-target-mini-avatar {
          border-color: #292A2D;
          background: #4B5563;
          color: #F3F4F6;
        }

        .extra-target-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 600;
          min-width: 0;
        }

        .extra-target-icon {
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .lesson-time-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        .lesson-time-range {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        .lesson-room-pill {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 6px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 4px;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        [data-theme="dark"] .lesson-room-pill {
          background: rgba(255, 255, 255, 0.08);
        }

        .lesson-group-main {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .group-category-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          height: 20px;
          box-sizing: border-box;
          text-align: center;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 0 6px;
          border-radius: var(--radius-full, 9999px);
          user-select: none;
          white-space: nowrap;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .group-category-pill.group-category-kids {
          background: rgba(255, 149, 0, 0.12);
          color: #d97706;
          border: 1px solid rgba(255, 149, 0, 0.3);
        }

        .group-category-pill.group-category-teens {
          background: rgba(88, 86, 214, 0.12);
          color: #4f46e5;
          border: 1px solid rgba(88, 86, 214, 0.3);
        }

        [data-theme="dark"] .group-category-pill.group-category-kids {
          background: rgba(255, 159, 10, 0.18);
          color: #fbbf24;
          border-color: rgba(255, 159, 10, 0.35);
        }

        [data-theme="dark"] .group-category-pill.group-category-teens {
          background: rgba(99, 102, 241, 0.18);
          color: #818cf8;
          border-color: rgba(99, 102, 241, 0.35);
        }

        .lesson-group-icon {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        [data-theme="dark"] .lesson-group-icon {
          background: #202124;
          border-color: #3C4043;
        }

        .lesson-group-title {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lesson-card-footer {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-top: 4px;
          border-top: 1px dashed rgba(0, 0, 0, 0.06);
        }

        [data-theme="dark"] .lesson-card-footer {
          border-top-color: rgba(255, 255, 255, 0.08);
        }

        .lesson-students-count {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .lesson-edit-hint {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--apple-blue);
          opacity: 0.9;
        }

        .day-empty-slot {
          flex: 1;
          min-height: 80px;
          border: 1px dashed rgba(0, 0, 0, 0.1);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          color: var(--text-tertiary);
          transition: all var(--transition-fast);
          padding: 12px 6px;
          text-align: center;
        }

        [data-theme="dark"] .day-empty-slot {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .day-empty-slot:hover {
          border-color: var(--apple-blue);
          color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.02);
        }

        .empty-slot-text {
          font-size: 0.74rem;
          font-weight: 500;
        }

        .empty-slot-plus {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--apple-blue);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .day-empty-slot:hover .empty-slot-plus {
          opacity: 1;
        }

        /* Modal Styles */
        .schedule-modal-box {
          max-width: 500px;
        }

        .modal-sub-info {
          font-size: 0.86rem;
          color: var(--text-secondary);
          margin-top: -8px;
          margin-bottom: 20px;
        }

        .schedule-group-dropdown-wrap {
          position: relative;
          width: 100%;
        }

        .schedule-custom-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.9rem;
          color: var(--text-primary);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
          box-sizing: border-box;
        }

        .schedule-custom-select-btn:hover,
        .schedule-custom-select-btn.active {
          border-color: var(--apple-blue);
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
        }

        .schedule-select-val {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          flex: 1;
        }

        .schedule-select-group-name {
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .schedule-select-student-count {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .schedule-select-placeholder {
          color: var(--text-tertiary, #86868B);
          font-weight: 500;
        }

        .schedule-group-pill-icon {
          width: 22px;
          height: 22px;
          min-width: 22px;
          max-width: 22px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.05);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .schedule-group-pill-icon img {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          border-radius: 6px !important;
          display: block;
        }

        [data-theme="dark"] .schedule-group-pill-icon {
          background: rgba(255, 255, 255, 0.08);
        }

        .schedule-custom-dropdown-list img,
        .schedule-custom-select-btn img {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          border-radius: inherit;
        }

        .schedule-select-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2040;
        }

        .schedule-custom-dropdown-list {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          max-height: 240px;
          overflow-y: auto;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06);
          z-index: 2050;
          animation: fadeInScale 0.15s ease-out;
          box-sizing: border-box;
        }

        .schedule-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          font-size: 0.88rem;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.05));
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .schedule-dropdown-item:last-child {
          border-bottom: none;
        }

        .schedule-dropdown-item:hover {
          background: rgba(0, 113, 227, 0.06);
          color: var(--apple-blue);
        }

        .schedule-dropdown-item.active {
          background: rgba(0, 113, 227, 0.09);
          color: var(--apple-blue);
          font-weight: 600;
        }

        .schedule-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .schedule-item-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .schedule-item-count {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 400;
          flex-shrink: 0;
        }

        .schedule-dropdown-item.active .schedule-item-count {
          color: var(--apple-blue);
          opacity: 0.85;
        }

        .schedule-item-check {
          display: flex;
          align-items: center;
          color: var(--apple-blue);
          flex-shrink: 0;
        }

        .dropdown-arrow {
          display: inline-flex;
          align-items: center;
          color: var(--text-secondary);
          transition: transform var(--transition-fast);
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        /* Dark Theme Support */
        [data-theme="dark"] .schedule-custom-select-btn {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .schedule-custom-select-btn:hover,
        [data-theme="dark"] .schedule-custom-select-btn.active {
          border-color: #8AB4F8;
          box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.18);
        }

        [data-theme="dark"] .schedule-custom-dropdown-list {
          background: #292A2D;
          border-color: #3C4043;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
        }

        [data-theme="dark"] .schedule-dropdown-item {
          color: var(--text-primary);
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .schedule-dropdown-item:hover {
          background: #35363A;
          color: #8AB4F8;
        }

        [data-theme="dark"] .schedule-dropdown-item.active {
          background: #35363A;
          color: #8AB4F8;
        }

        [data-theme="dark"] .schedule-dropdown-item.active .schedule-item-count {
          color: #8AB4F8;
        }

        [data-theme="dark"] .schedule-item-check {
          color: #8AB4F8;
        }

        .schedule-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 6px;
        }

        .schedule-presets-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .preset-btn {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        [data-theme="dark"] .preset-btn {
          background: #202124;
          border-color: #3C4043;
          color: var(--text-secondary);
        }

        .preset-btn:hover {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        .days-chip-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .day-chip-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 2px;
          border-radius: var(--radius-sm);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        [data-theme="dark"] .day-chip-btn {
          background: #202124;
          border-color: #3C4043;
        }

        .day-chip-short {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .day-chip-name {
          font-size: 0.58rem;
          color: var(--text-secondary);
          margin-top: 2px;
          display: none;
        }

        .day-chip-btn.selected {
          background: #1D1D1F;
          border-color: #1D1D1F;
        }

        .day-chip-btn.selected .day-chip-short {
          color: #FFFFFF;
        }

        [data-theme="dark"] .day-chip-btn.selected {
          background: var(--apple-blue);
          border-color: var(--apple-blue);
        }

        [data-theme="dark"] .day-chip-btn.selected .day-chip-short {
          color: #1D1D1F;
        }

        .schedule-time-row {
          display: flex;
          gap: 12px;
        }

        .time-presets-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: -6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .time-presets-label {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-tertiary, #86868B);
        }

        .time-presets-chips {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .time-preset-chip {
          padding: 3px 8px;
          font-size: 0.74rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .time-preset-chip:hover {
          background: rgba(0, 113, 227, 0.08);
          color: var(--apple-blue);
          border-color: var(--apple-blue);
        }

        .time-preset-chip.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        [data-theme="dark"] .time-preset-chip {
          background: #202124;
          border-color: #3C4043;
          color: var(--text-secondary);
        }

        [data-theme="dark"] .time-preset-chip:hover {
          background: #35363A;
          color: #8AB4F8;
          border-color: #8AB4F8;
        }

        [data-theme="dark"] .time-preset-chip.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        /* Roster Students List Modal */
        .student-list-modal-box {
          max-width: 500px;
          width: 100%;
          padding: 22px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-radius: var(--radius-xl);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          max-height: min(620px, calc(100dvh - 48px));
          height: auto;
        }

        [data-theme="dark"] .student-list-modal-box {
          background: #292A2D;
          border-color: #3C4043;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
        }

        .student-list-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .student-list-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }

        .student-list-group-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }

        [data-theme="dark"] .student-list-group-badge {
          background: rgba(255, 255, 255, 0.08);
        }

        .student-list-header-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .student-list-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .student-list-group-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .student-list-count-badge {
          font-size: 0.76rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue);
          white-space: nowrap;
        }

        [data-theme="dark"] .student-list-count-badge {
          background: rgba(138, 180, 248, 0.15);
          color: #8AB4F8;
        }

        .student-list-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .student-list-time-pill {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .student-list-room-pill {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 5px;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        [data-theme="dark"] .student-list-room-pill {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        .student-list-close-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }

        .student-list-close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--text-primary);
        }

        [data-theme="dark"] .student-list-close-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #9AA0A6;
        }

        [data-theme="dark"] .student-list-close-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #E8EAED;
        }

        /* Search input */
        .student-list-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }

        .student-list-search-wrap:focus-within {
          border-color: var(--apple-blue);
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
        }

        [data-theme="dark"] .student-list-search-wrap {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-list-search-wrap:focus-within {
          background: #292A2D;
          border-color: #8AB4F8;
          box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.15);
        }

        .student-list-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.86rem;
          color: var(--text-primary);
        }

        .student-list-search-clear {
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: 0 4px;
        }

        .student-list-search-clear:hover {
          color: var(--text-primary);
        }

        .student-list-modal-body {
          flex: 1 1 auto;
          min-height: 0;
          max-height: 380px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overscroll-behavior: contain;
        }

        .student-list-modal-body::-webkit-scrollbar {
          width: 5px;
        }

        .student-list-modal-body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 4px;
        }

        .student-list-modal-body::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.18);
          border-radius: 4px;
        }

        [data-theme="dark"] .student-list-modal-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
        }

        [data-theme="dark"] .student-list-modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.22);
        }

        .compact-students-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .compact-student-row {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 52px;
          min-height: 52px;
          padding: 0 16px;
          border-radius: var(--radius-md);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.07);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          cursor: default;
          user-select: text;
          box-sizing: border-box;
          transition: background var(--transition-fast), border-color var(--transition-fast);
        }

        .compact-student-row:hover {
          background: #F9FAFB;
        }

        [data-theme="dark"] .compact-student-row {
          background: #202124;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }

        [data-theme="dark"] .compact-student-row:hover {
          background: #28292D;
        }

        .compact-student-index {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-secondary);
          min-width: 22px;
          font-variant-numeric: tabular-nums;
          opacity: 0.85;
        }

        .compact-student-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.04);
        }

        .compact-student-avatar svg,
        .compact-student-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        [data-theme="dark"] .compact-student-avatar {
          background: rgba(255, 255, 255, 0.08);
        }

        .compact-student-name {
          font-size: 0.94rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .compact-students-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 16px;
          gap: 8px;
        }

        .compact-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        [data-theme="dark"] .compact-empty-icon {
          background: rgba(255, 255, 255, 0.06);
        }

        .compact-empty-title {
          font-size: 0.94rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .compact-empty-sub {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
          max-width: 280px;
        }

        .student-list-modal-footer {
          margin-top: auto;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid var(--border-color);
        }

        .student-list-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          padding: 8px 14px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .mobile-day-tabs {
            display: flex;
          }

          .weekly-grid-wrapper {
            overflow: visible;
          }

          .weekly-timetable-grid {
            display: block;
            min-width: 0;
          }

          .timetable-day-col {
            display: none;
            min-height: auto;
          }

          .timetable-day-col.mobile-selected-day {
            display: flex;
          }

          .day-chip-name {
            display: none;
          }

          .today-schedule-banner {
            padding: 16px;
          }

          .today-cards-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default ScheduleView;
