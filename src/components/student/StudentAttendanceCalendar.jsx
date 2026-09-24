import React, { useState, useMemo, useEffect } from 'react';
import { extractGroupDays } from '../../utils/scheduleUtils';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEKDAY_HEADERS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

export default function StudentAttendanceCalendar({
  attendance = [],
  group,
  pinnedStudent,
  onOpenProfilePicker,
}) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  // Reset selected date inspector when switching group
  useEffect(() => {
    setSelectedDateStr(null);
  }, [group?.id]);

  const todayStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const scheduledDays = useMemo(() => extractGroupDays(group), [group]);

  const handlePrevMonth = () => {
    triggerHaptic('light');
    if (currentMonth === 0) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    if (currentMonth === 11) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDateStr(null);
  };

  const handleResetToToday = () => {
    triggerHaptic('light');
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(null);
  };

  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentYear === today.getFullYear() && currentMonth === today.getMonth();
  }, [currentYear, currentMonth]);

  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const attendanceMap = useMemo(() => {
    const map = new Map();
    if (!attendance || !group?.id) return map;
    const targetGroupId = String(group.id);
    attendance.forEach((att) => {
      if (att && String(att.groupId) === targetGroupId && att.date && att.date.startsWith(monthPrefix)) {
        map.set(att.date.slice(0, 10), att);
      }
    });
    return map;
  }, [attendance, group?.id, monthPrefix]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ isBlank: true, key: `blank-start-${i}` });
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(currentYear, currentMonth, day);
      const dayKey = DAY_KEYS[(dayDate.getDay() + 6) % 7];
      const isToday = dateStr === todayStr;

      const record = attendanceMap.get(dateStr);
      let status = null;
      if (record && pinnedStudent) {
        const pId = String(pinnedStudent.id);
        status = record.records?.[pId] ?? record.records?.[pinnedStudent.id] ?? null;
      }

      const isScheduled = scheduledDays.includes(dayKey) && dateStr >= todayStr && !status && !record;

      cells.push({
        isBlank: false,
        key: dateStr,
        day,
        dateStr,
        dayKey,
        isToday,
        status,
        isScheduled,
        hasGroupRecord: Boolean(record),
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr, attendanceMap, pinnedStudent, scheduledDays]);

  const monthStats = useMemo(() => {
    if (!group?.id) {
      return null;
    }

    const totalLessons = attendanceMap.size;
    let scheduledLessons = 0;
    calendarDays.forEach((cell) => {
      if (!cell.isBlank && cell.isScheduled) {
        scheduledLessons++;
      }
    });

    if (!pinnedStudent) {
      return {
        isPinned: false,
        totalLessons,
        scheduledLessons,
      };
    }

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    const pId = String(pinnedStudent.id);

    attendanceMap.forEach((rec) => {
      const st = rec.records?.[pId] ?? rec.records?.[pinnedStudent.id];
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
    });

    const accountable = present + absent + late;
    const rate = accountable > 0
      ? Math.round(((present + late * 0.5) / accountable) * 100)
      : (excused > 0 ? 100 : null);

    return {
      isPinned: true,
      present,
      absent,
      late,
      excused,
      accountable,
      rate,
      totalLessons,
      scheduledLessons,
    };
  }, [attendanceMap, pinnedStudent, group?.id, calendarDays]);

  const selectedDayInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    const cell = calendarDays.find((c) => c.dateStr === selectedDateStr);
    if (!cell) return null;

    const parts = selectedDateStr.split('-');
    const formatted = `${parseInt(parts[2], 10)}-${UZBEK_MONTHS[parseInt(parts[1], 10) - 1]}`;

    let statusText = "Dars o'tkazilmagan";
    let statusType = 'none';

    if (cell.status === 'present') {
      statusText = 'Darsda qatnashgan';
      statusType = 'present';
    } else if (cell.status === 'late') {
      statusText = 'Darsga kechikkan';
      statusType = 'late';
    } else if (cell.status === 'absent') {
      statusText = 'Darsga kelmagan';
      statusType = 'absent';
    } else if (cell.status === 'excused') {
      statusText = 'Sababli qatnashmadi';
      statusType = 'excused';
    } else if (cell.isScheduled) {
      statusText = 'Kelgusi rejadagi dars kuni';
      statusType = 'scheduled';
    } else if (cell.hasGroupRecord) {
      statusText = pinnedStudent
        ? "Bu kungi davomatda qayd etilmagan"
        : "Guruh darsi o'tilgan";
      statusType = 'group-lesson';
    }

    return { formatted, statusText, statusType, hasGroupRecord: cell.hasGroupRecord };
  }, [selectedDateStr, calendarDays, pinnedStudent]);

  return (
    <div className="native-calendar-card" id="student-attendance-calendar">
      {/* Calendar Header */}
      <div className="native-calendar-header">
        <div className="calendar-header-titles">
          <h3>
            {UZBEK_MONTHS[currentMonth]} {currentYear}
          </h3>
          <span className="calendar-subtitle">Oylik davomat taqvimi</span>
        </div>

        <div className="calendar-month-controls">
          {!isCurrentMonth && (
            <button
              type="button"
              className="calendar-today-btn"
              onClick={handleResetToToday}
            >
              Bugun
            </button>
          )}
          <button
            type="button"
            className="calendar-arrow-btn"
            onClick={handlePrevMonth}
            aria-label="Oldingi oy"
          >
            ‹
          </button>
          <button
            type="button"
            className="calendar-arrow-btn"
            onClick={handleNextMonth}
            aria-label="Keyingi oy"
          >
            ›
          </button>
        </div>
      </div>

      {/* Monthly Stats Summary Pills */}
      {monthStats && (
        <div className="calendar-stats-row">
          {monthStats.isPinned ? (
            <>
              <div className="calendar-stat-pill present">
                <span className="stat-pill-label">Kelgan</span>
                <span className="stat-pill-val">{monthStats.present}</span>
              </div>
              <div className="calendar-stat-pill late">
                <span className="stat-pill-label">Kechikkan</span>
                <span className="stat-pill-val">{monthStats.late}</span>
              </div>
              <div className="calendar-stat-pill absent">
                <span className="stat-pill-label">Kelmagan</span>
                <span className="stat-pill-val">{monthStats.absent}</span>
              </div>
              <div className="calendar-stat-pill rate">
                <span className="stat-pill-label">Foiz</span>
                <span className="stat-pill-val">{monthStats.rate !== null ? `${monthStats.rate}%` : '—'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="calendar-stat-pill group-lessons">
                <span className="stat-pill-label">O'tilgan darslar</span>
                <span className="stat-pill-val">{monthStats.totalLessons}</span>
              </div>
              <div className="calendar-stat-pill scheduled">
                <span className="stat-pill-label">Rejadagi darslar</span>
                <span className="stat-pill-val">{monthStats.scheduledLessons}</span>
              </div>
              {onOpenProfilePicker && (
                <div
                  className="calendar-stat-pill profile-action is-clickable"
                  onClick={onOpenProfilePicker}
                  title="Shaxsiy davomatni ko'rish"
                  role="button"
                  tabIndex={0}
                >
                  <span className="stat-pill-label">Shaxsiy davomat</span>
                  <span className="stat-pill-val action-text">Profil tanlash ›</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* If profile is not chosen */}
      {!pinnedStudent && (
        <div className="native-unpinned-card">
          <span className="unpinned-title">Shaxsiy davomat</span>
          <span className="unpinned-sub">Shaxsiy davomatingizni ko'rish uchun Profil bo'limidan ismingizni tanlang.</span>
          {onOpenProfilePicker && (
            <button
              type="button"
              className="account-action-pill-btn secondary"
              onClick={onOpenProfilePicker}
              style={{ marginTop: 8 }}
            >
              Profilni tanlash ▾
            </button>
          )}
        </div>
      )}

      {/* 7-col Weekday Headers */}
      <div className="calendar-weekdays-header">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* Days Grid Cells */}
      <div className="calendar-grid-cells">
        {calendarDays.map((cell) => {
          if (cell.isBlank) {
            return <div key={cell.key} style={{ visibility: 'hidden' }} />;
          }

          const isSelected = cell.dateStr === selectedDateStr;
          let statusDotClass = '';
          if (cell.status === 'present') statusDotClass = 'dot-present';
          else if (cell.status === 'late') statusDotClass = 'dot-late';
          else if (cell.status === 'absent') statusDotClass = 'dot-absent';
          else if (cell.status === 'excused') statusDotClass = 'dot-excused';
          else if (cell.hasGroupRecord) statusDotClass = 'dot-group-lesson';
          else if (cell.isScheduled) statusDotClass = 'dot-scheduled';

          return (
            <button
              key={cell.key}
              type="button"
              className={`day-cell ${cell.isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setSelectedDateStr(isSelected ? null : cell.dateStr);
              }}
              aria-label={`${cell.day}-kun`}
            >
              <span>{cell.day}</span>
              {statusDotClass && <span className={`cell-status-dot ${statusDotClass}`} />}
            </button>
          );
        })}
      </div>

      {/* Selected Day Inspector */}
      {selectedDayInfo && (
        <div className={`native-day-inspector ${selectedDayInfo.statusType}`}>
          <div className="inspector-content">
            <span className="inspector-date">{selectedDayInfo.formatted}:</span>
            <span className="inspector-status">{selectedDayInfo.statusText}</span>
            {!pinnedStudent && selectedDayInfo.hasGroupRecord && onOpenProfilePicker && (
              <button
                type="button"
                className="inspector-action-btn"
                onClick={onOpenProfilePicker}
              >
                Profilni tanlash ›
              </button>
            )}
          </div>
          <button
            type="button"
            className="inspector-close-btn"
            onClick={() => setSelectedDateStr(null)}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend Bar */}
      <div className="native-legend-bar">
        {pinnedStudent ? (
          <>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#34C759' }} />
              <span>Kelgan</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#FF9500' }} />
              <span>Kechikkan</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#FF3B30' }} />
              <span>Kelmagan</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'rgba(0, 113, 227, 0.4)' }} />
              <span>Rejadagi dars</span>
            </div>
          </>
        ) : (
          <>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#0071E3' }} />
              <span>Dars o'tilgan</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'rgba(0, 113, 227, 0.4)' }} />
              <span>Rejadagi dars</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
