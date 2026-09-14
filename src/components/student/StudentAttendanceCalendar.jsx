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

  // Fast map of group attendance records for this month: dateStr -> record
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

  // Calendar cells computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];

    // Blank cells before month start
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ isBlank: true, key: `blank-start-${i}` });
    }

    // Days in month
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

      const isScheduled = scheduledDays.includes(dayKey) && dateStr >= todayStr && !status;

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

  // Monthly summary stats for pinned student
  const monthStats = useMemo(() => {
    if (!pinnedStudent || !group?.id) {
      return null;
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
      : (excused > 0 ? 100 : 0);

    return {
      present,
      absent,
      late,
      excused,
      accountable,
      rate,
    };
  }, [attendanceMap, pinnedStudent, group?.id]);

  // Selected date info
  const selectedDayInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    const cell = calendarDays.find((c) => c.dateStr === selectedDateStr);
    if (!cell) return null;

    const parts = selectedDateStr.split('-');
    const formatted = `${parseInt(parts[2], 10)}-${UZBEK_MONTHS[parseInt(parts[1], 10) - 1]}`;

    let statusText = "Dars o'tkazilmagan";
    let statusType = 'none';
    let icon = 'ℹ️';

    if (cell.status === 'present') {
      statusText = 'Darsda qatnashgan';
      statusType = 'present';
      icon = '✅';
    } else if (cell.status === 'late') {
      statusText = 'Darsga kechikkan';
      statusType = 'late';
      icon = '⏰';
    } else if (cell.status === 'absent') {
      statusText = 'Darsga kelmagan';
      statusType = 'absent';
      icon = '❌';
    } else if (cell.status === 'excused') {
      statusText = 'Sababli qatnashmadi';
      statusType = 'excused';
      icon = '📝';
    } else if (cell.isScheduled) {
      statusText = 'Kelgusi rejadagi dars kuni';
      statusType = 'scheduled';
      icon = '📅';
    } else if (cell.hasGroupRecord && !pinnedStudent) {
      statusText = "Guruh darsi o'tilgan";
      statusType = 'group-lesson';
      icon = '👥';
    }

    return { formatted, statusText, statusType, icon };
  }, [selectedDateStr, calendarDays, pinnedStudent]);

  return (
    <div className="student-calendar-card" id="student-attendance-calendar">
      {/* Calendar Header / Month Switcher */}
      <div className="calendar-header-bar">
        <div className="calendar-title-col">
          <span className="calendar-eyebrow">Davomat Taqvimi</span>
          <h3 className="calendar-month-name">
            {UZBEK_MONTHS[currentMonth]} {currentYear}
          </h3>
        </div>

        <div className="calendar-action-controls">
          {!isCurrentMonth && (
            <button
              type="button"
              className="calendar-today-pill"
              onClick={handleResetToToday}
            >
              Bugun
            </button>
          )}
          <div className="calendar-arrows-wrap">
            <button
              type="button"
              className="calendar-arrow-btn"
              onClick={handlePrevMonth}
              aria-label="Oldingi oy"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="calendar-arrow-btn"
              onClick={handleNextMonth}
              aria-label="Keyingi oy"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Overview Stats Strip (Compact & Instant) */}
      {pinnedStudent && monthStats && (
        <div className="calendar-stats-strip">
          <div className="stat-pill-rate">
            <span className="stat-rate-val">{monthStats.rate}%</span>
            <span className="stat-rate-sub">Davomat</span>
          </div>
          <div className="stat-mini-chips">
            <span className="stat-chip present">
              <span className="chip-dot" /> {monthStats.present} kelgan
            </span>
            {monthStats.late > 0 && (
              <span className="stat-chip late">
                <span className="chip-dot" /> {monthStats.late} kechikkan
              </span>
            )}
            <span className="stat-chip absent">
              <span className="chip-dot" /> {monthStats.absent} qoldirgan
            </span>
          </div>
        </div>
      )}

      {/* If profile is not chosen yet, friendly prompt */}
      {!pinnedStudent && (
        <div className="calendar-unpinned-tip">
          <span>Shaxsiy davomatingizni ko'rish uchun profilingizni tanlang.</span>
          {onOpenProfilePicker && (
            <button
              type="button"
              className="unpinned-tip-btn"
              onClick={onOpenProfilePicker}
            >
              Tanlash
            </button>
          )}
        </div>
      )}

      {/* Weekdays Row */}
      <div className="calendar-weekdays-row">
        {WEEKDAY_HEADERS.map((w, idx) => (
          <div key={w} className={`calendar-weekday ${idx >= 5 ? 'is-weekend' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-grid">
        {calendarDays.map((cell) => {
          if (cell.isBlank) {
            return <div key={cell.key} className="calendar-cell is-blank" />;
          }

          const isSelected = cell.dateStr === selectedDateStr;
          let statusClass = '';
          if (cell.status === 'present') statusClass = 'status-present';
          else if (cell.status === 'late') statusClass = 'status-late';
          else if (cell.status === 'absent') statusClass = 'status-absent';
          else if (cell.status === 'excused') statusClass = 'status-excused';
          else if (cell.isScheduled) statusClass = 'status-scheduled';

          return (
            <button
              key={cell.key}
              type="button"
              className={`calendar-cell ${cell.isToday ? 'is-today' : ''} ${statusClass} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setSelectedDateStr(isSelected ? null : cell.dateStr);
              }}
              aria-label={`${cell.day}-kun`}
            >
              <span className="cell-num">{cell.day}</span>
              {cell.status && <span className="cell-indicator-dot" />}
            </button>
          );
        })}
      </div>

      {/* Interactive Selected Date Banner */}
      {selectedDayInfo && (
        <div className={`calendar-day-inspection ${selectedDayInfo.statusType}`}>
          <div className="inspection-left">
            <span className="inspection-icon">{selectedDayInfo.icon}</span>
            <div className="inspection-text-col">
              <span className="inspection-date">{selectedDayInfo.formatted}</span>
              <span className="inspection-status">{selectedDayInfo.statusText}</span>
            </div>
          </div>
          <button
            type="button"
            className="inspection-close-btn"
            onClick={() => setSelectedDateStr(null)}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modern Minimalist Legend */}
      <div className="calendar-legend-bar">
        <div className="legend-badge">
          <span className="legend-indicator present" />
          <span>Kelgan</span>
        </div>
        <div className="legend-badge">
          <span className="legend-indicator late" />
          <span>Kechikkan</span>
        </div>
        <div className="legend-badge">
          <span className="legend-indicator absent" />
          <span>Kelmagan</span>
        </div>
        <div className="legend-badge">
          <span className="legend-indicator scheduled" />
          <span>Rejadagi dars</span>
        </div>
      </div>

      <style>{`
        .student-calendar-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 20px);
          padding: 16px 18px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Header Bar */
        .calendar-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .calendar-title-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .calendar-eyebrow {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--apple-blue);
        }

        .calendar-month-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .calendar-action-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .calendar-today-pill {
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-full);
          padding: 4px 10px;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .calendar-today-pill:hover {
          border-color: var(--apple-blue);
          color: var(--apple-blue);
        }

        .calendar-arrows-wrap {
          display: inline-flex;
          align-items: center;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 2px;
          gap: 2px;
        }

        .calendar-arrow-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .calendar-arrow-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        /* Stats Strip */
        .calendar-stats-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.05));
          border-radius: var(--radius-md, 12px);
          padding: 8px 12px;
          gap: 10px;
          flex-wrap: wrap;
        }

        .stat-pill-rate {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .stat-rate-val {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--apple-blue);
          line-height: 1;
        }

        .stat-rate-sub {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
        }

        .stat-mini-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }

        .stat-chip.present {
          background: rgba(52, 199, 89, 0.12);
          color: #2E7D32;
        }

        .stat-chip.late {
          background: rgba(255, 149, 0, 0.12);
          color: #E65100;
        }

        .stat-chip.absent {
          background: rgba(255, 59, 48, 0.12);
          color: #C62828;
        }

        .chip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        /* Unpinned Prompt */
        .calendar-unpinned-tip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.05);
          border: 1px dashed rgba(var(--apple-blue-rgb, 0, 113, 227), 0.25);
          border-radius: var(--radius-md, 10px);
          padding: 8px 12px;
          font-size: 0.78rem;
          color: var(--text-secondary);
          gap: 8px;
        }

        .unpinned-tip-btn {
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* Weekdays */
        .calendar-weekdays-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          text-align: center;
          margin-top: 2px;
        }

        .calendar-weekday {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-tertiary);
          padding: 2px 0;
        }

        .calendar-weekday.is-weekend {
          color: var(--text-secondary);
        }

        /* Day Grid */
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }

        .calendar-cell {
          aspect-ratio: 1;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.04));
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: all var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
          position: relative;
        }

        .calendar-cell.is-blank {
          background: transparent;
          border-color: transparent;
          cursor: default;
          pointer-events: none;
        }

        .calendar-cell:not(.is-blank):active {
          transform: scale(0.93);
        }

        .cell-num {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1;
        }

        .cell-indicator-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          margin-top: 3px;
        }

        .calendar-cell.is-today {
          border: 1.5px solid var(--apple-blue);
        }

        .calendar-cell.is-today .cell-num {
          color: var(--apple-blue);
          font-weight: 800;
        }

        /* Statuses */
        .calendar-cell.status-present {
          background: rgba(52, 199, 89, 0.14);
          border-color: rgba(52, 199, 89, 0.35);
        }
        .calendar-cell.status-present .cell-num,
        .calendar-cell.status-present .cell-indicator-dot {
          color: #2E7D32;
          background: #2E7D32;
        }

        .calendar-cell.status-late {
          background: rgba(255, 149, 0, 0.14);
          border-color: rgba(255, 149, 0, 0.35);
        }
        .calendar-cell.status-late .cell-num,
        .calendar-cell.status-late .cell-indicator-dot {
          color: #E65100;
          background: #E65100;
        }

        .calendar-cell.status-absent {
          background: rgba(255, 59, 48, 0.14);
          border-color: rgba(255, 59, 48, 0.35);
        }
        .calendar-cell.status-absent .cell-num,
        .calendar-cell.status-absent .cell-indicator-dot {
          color: #C62828;
          background: #C62828;
        }

        .calendar-cell.status-excused {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
        }
        .calendar-cell.status-excused .cell-num,
        .calendar-cell.status-excused .cell-indicator-dot {
          color: var(--apple-blue);
          background: var(--apple-blue);
        }

        .calendar-cell.status-scheduled {
          border: 1.5px dashed var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.04);
        }

        .calendar-cell.is-selected {
          box-shadow: 0 0 0 2px var(--apple-blue) !important;
        }

        /* Inspection Drawer */
        .calendar-day-inspection {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: var(--radius-md, 11px);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--border-color);
          gap: 10px;
          animation: inspectFade 0.2s ease-out;
        }

        @keyframes inspectFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .calendar-day-inspection.present {
          background: rgba(52, 199, 89, 0.1);
          border-color: rgba(52, 199, 89, 0.3);
        }
        .calendar-day-inspection.late {
          background: rgba(255, 149, 0, 0.1);
          border-color: rgba(255, 149, 0, 0.3);
        }
        .calendar-day-inspection.absent {
          background: rgba(255, 59, 48, 0.1);
          border-color: rgba(255, 59, 48, 0.3);
        }
        .calendar-day-inspection.scheduled {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
          border: 1px dashed var(--apple-blue);
        }

        .inspection-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .inspection-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .inspection-text-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .inspection-date {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .inspection-status {
          font-size: 0.74rem;
          color: var(--text-secondary);
        }

        .inspection-close-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 0.8rem;
          cursor: pointer;
          padding: 4px;
        }

        /* Legend */
        .calendar-legend-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 8px;
          border-top: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.06));
        }

        .legend-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .legend-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .legend-indicator.present { background: #34C759; }
        .legend-indicator.late { background: #FF9500; }
        .legend-indicator.absent { background: #FF3B30; }
        .legend-indicator.scheduled {
          border: 1.5px dashed var(--apple-blue);
          background: transparent;
        }

        @media (max-width: 420px) {
          .student-calendar-card {
            padding: 13px 12px;
            gap: 10px;
          }

          .calendar-month-name {
            font-size: 1.05rem;
          }

          .calendar-cell {
            border-radius: 8px;
          }

          .cell-num {
            font-size: 0.78rem;
          }

          .calendar-stats-strip {
            padding: 7px 10px;
          }

          .calendar-legend-bar {
            gap: 8px;
            justify-content: flex-start;
          }
        }

        [data-theme="dark"] .student-calendar-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .calendar-stats-strip {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .calendar-cell {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .calendar-cell.status-present .cell-num,
        [data-theme="dark"] .calendar-cell.status-present .cell-indicator-dot {
          color: #81C995;
          background: #81C995;
        }

        [data-theme="dark"] .calendar-cell.status-late .cell-num,
        [data-theme="dark"] .calendar-cell.status-late .cell-indicator-dot {
          color: #FDD663;
          background: #FDD663;
        }

        [data-theme="dark"] .calendar-cell.status-absent .cell-num,
        [data-theme="dark"] .calendar-cell.status-absent .cell-indicator-dot {
          color: #F28B82;
          background: #F28B82;
        }

        [data-theme="dark"] .stat-chip.present {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
        }

        [data-theme="dark"] .stat-chip.late {
          background: rgba(253, 214, 99, 0.15);
          color: #FDD663;
        }

        [data-theme="dark"] .stat-chip.absent {
          background: rgba(242, 139, 130, 0.15);
          color: #F28B82;
        }

        [data-theme="dark"] .calendar-legend-bar {
          border-top-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
