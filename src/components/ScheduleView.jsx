import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { renderGroupIcon, GROUP_COLOR_OPTIONS } from '../utils/groupIcons';
import { renderAvatar } from '../utils/studentAvatars';
import Time24Input from './Time24Input';

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

const ScheduleView = ({
  groups = [],
  students = [],
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
    return groups.some((g) => g.schedule?.days?.includes('sun'));
  }, [groups]);

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

  // Close group dropdown, student modal and edit modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isGroupDropdownOpen) {
          setIsGroupDropdownOpen(false);
          e.stopPropagation();
        } else if (selectedGroupForStudents) {
          setSelectedGroupForStudents(null);
          e.stopPropagation();
        } else if (showModal) {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGroupDropdownOpen, selectedGroupForStudents, showModal, setShowModal]);

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


  // Lessons mapped by weekday
  const scheduleByDay = useMemo(() => {
    const map = {};
    activeWeekdays.forEach((day) => {
      map[day.key] = groups
        .filter((g) => g.schedule?.days?.includes(day.key))
        .sort((a, b) => (a.schedule?.startTime || '00:00').localeCompare(b.schedule?.startTime || '00:00'));
    });
    return map;
  }, [groups, activeWeekdays]);

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
                  showToast("Dars qo'shish uchun dastlab guruh yarating!", "error");
                  return;
                }
                const targetGroup = groups[0];
                if (targetGroup) {
                  populateFormForGroup(targetGroup);
                }
                setShowModal(true);
              }}
            >
              <span>+ Dars qo'shish</span>
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
                    dayClasses.map((group) => {
                      const studentCount = getStudentCount(group.id);
                      const cardStyles = getGroupStyle(group.color);

                      return (
                        <div
                          key={group.id}
                          className="schedule-lesson-card scale-active"
                          style={cardStyles}
                          onClick={() => setSelectedGroupForStudents(group)}
                          title="Guruh talabalari ro'yxatini ko'rish uchun bosing"
                        >
                          <div className="lesson-time-header">
                            <span className="lesson-time-range">
                              {group.schedule?.startTime}
                              {group.schedule?.endTime ? ` - ${group.schedule.endTime}` : ''}
                            </span>
                            {group.schedule?.room && (
                              <span className="lesson-room-pill">{group.schedule.room}</span>
                            )}
                          </div>

                          <div className="lesson-group-main">
                            <div className="lesson-group-icon avatar-circle">
                              {renderGroupIcon(group.icon, 16)}
                            </div>
                            <span className="lesson-group-title">{group.name}</span>
                          </div>

                          <div className="lesson-card-footer">
                            <span className="lesson-students-count">{studentCount} talaba</span>
                            <span
                              className="lesson-edit-hint"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(group);
                              }}
                              title="Dars vaqtini tahrirlash"
                            >
                              Tahrirlash
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
                          handleOpenEdit(groups[0], day.key);
                        } else {
                          showToast("Dastlab guruh yarating!", "error");
                        }
                      }}
                      title="Ushbu kunga dars biriktirish uchun bosing"
                    >
                      <span className="empty-slot-text">Dars yo'q</span>
                      <span className="empty-slot-plus">+ Dars qo'shish</span>
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

            <h3 className="modal-title">Dars Vaqtini Belgilash</h3>
            <p className="modal-sub-info">
              Guruh uchun dars kunlari, boshlanish va tugash vaqtlarini kiriting.
            </p>

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
                        <span className="schedule-select-group-name">{activeGroup.name}</span>
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
                        const isSelected = g.id === activeGroupId;
                        const count = getStudentCount(g.id);
                        return (
                          <div
                            key={g.id}
                            className={`custom-dropdown-item schedule-dropdown-item ${isSelected ? 'active' : ''}`}
                            onClick={() => handleSelectGroup(g.id)}
                          >
                            <div className="schedule-item-left">
                              <span className="schedule-item-name">{g.name}</span>
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

            {/* Modal Actions */}
            <div className="modal-actions">
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
          justify-content: space-between;
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
          gap: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .schedule-select-group-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .schedule-select-student-count {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .schedule-select-placeholder {
          color: var(--text-tertiary, #86868B);
          font-weight: 500;
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
          gap: 6px;
        }

        .schedule-item-name {
          font-weight: 600;
        }

        .schedule-item-count {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 400;
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
          max-width: 480px;
          width: 92%;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-radius: var(--radius-lg);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          max-height: 85vh;
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
          max-height: 275px;
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
