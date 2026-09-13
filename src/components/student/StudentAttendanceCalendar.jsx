import React, { useState, useMemo } from 'react';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEKDAY_HEADERS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function StudentAttendanceCalendar({
  attendance = [],
  group,
  pinnedStudent,
  onOpenProfilePicker,
}) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  const todayStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const scheduledDays = useMemo(() => {
    if (group?.schedule?.days && Array.isArray(group.schedule.days) && group.schedule.days.length > 0) {
      return group.schedule.days;
    }
    const lower = (group?.name || '').toLowerCase();
    if (lower.includes('dushanba')) return ['mon'];
    if (lower.includes('seshanba')) return ['tue'];
    if (lower.includes('chorshanba')) return ['wed'];
    if (lower.includes('payshanba')) return ['thu'];
    if (lower.includes('juma')) return ['fri'];
    if (lower.includes('shanba')) return ['sat'];
    if (lower.includes('yakshanba')) return ['sun'];
    return [];
  }, [group]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDateStr(null);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDateStr(null);
  };

  // Reset to today's month
  const handleResetToToday = () => {
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

      // Check scheduled class day
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

    let statusText = 'Dars belgilanmagan';
    let statusType = 'none';

    if (cell.status === 'present') {
      statusText = 'Darsga kelgan';
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
      statusText = 'Kelgusi rejadagi dars';
      statusType = 'scheduled';
    } else if (cell.hasGroupRecord && !pinnedStudent) {
      statusText = "Guruh darsi o'tilgan";
      statusType = 'group-lesson';
    }

    return { formatted, statusText, statusType };
  }, [selectedDateStr, calendarDays, pinnedStudent]);

  return (
    <div className="student-calendar-card">
      {/* Calendar Header / Month Switcher */}
      <div className="calendar-header">
        <div className="calendar-title-wrap">
          <span className="calendar-subtitle">Davomat Taqvimi</span>
          <h3 className="calendar-month-title">
            {UZBEK_MONTHS[currentMonth]} {currentYear}
          </h3>
        </div>

        <div className="calendar-controls">
          {!isCurrentMonth && (
            <button
              type="button"
              className="calendar-btn-today"
              onClick={handleResetToToday}
            >
              Bugun
            </button>
          )}
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Oldingi oy"
          >
            ←
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Keyingi oy"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="calendar-weekdays-grid">
        {WEEKDAY_HEADERS.map((w, idx) => (
          <div key={w} className={`weekday-header ${idx >= 5 ? 'weekend' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-days-grid">
        {calendarDays.map((cell) => {
          if (cell.isBlank) {
            return <div key={cell.key} className="day-cell blank" />;
          }

          const isSelected = cell.dateStr === selectedDateStr;
          let cellClass = 'day-cell';
          if (cell.isToday) cellClass += ' today';
          if (cell.status === 'present') cellClass += ' status-present';
          else if (cell.status === 'late') cellClass += ' status-late';
          else if (cell.status === 'absent') cellClass += ' status-absent';
          else if (cell.status === 'excused') cellClass += ' status-excused';
          else if (cell.isScheduled) cellClass += ' status-scheduled';
          if (isSelected) cellClass += ' selected';

          return (
            <button
              key={cell.key}
              type="button"
              className={cellClass}
              onClick={() => setSelectedDateStr(cell.dateStr)}
            >
              <span className="day-num">{cell.day}</span>
              {cell.status && <span className="day-dot" />}
            </button>
          );
        })}
      </div>

      {/* Selected Day Toast Line */}
      {selectedDayInfo && (
        <div className={`selected-day-detail ${selectedDayInfo.statusType}`}>
          <span className="selected-date">{selectedDayInfo.formatted}:</span>
          <span className="selected-status">{selectedDayInfo.statusText}</span>
        </div>
      )}

      {/* Minimal Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot present" />
          <span>Kelgan</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot late" />
          <span>Kechikkan</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot absent" />
          <span>Kelmagan</span>
        </div>
        <div className="legend-item">
          <span className="legend-dash scheduled" />
          <span>Rejadagi dars</span>
        </div>
      </div>

      {/* Monthly Summary Line */}
      <div className="calendar-summary-footer">
        {pinnedStudent ? (
          monthStats && (monthStats.accountable > 0 || monthStats.excused > 0) ? (
            <p className="summary-text">
              <strong>Shu oyda:</strong> {monthStats.present} ta darsda qatnashdi
              {monthStats.late > 0 ? `, ${monthStats.late} ta kechikdi` : ''}
              {monthStats.excused > 0 ? `, ${monthStats.excused} ta sababli` : ''}
              {`, ${monthStats.absent} ta qoldirdi`}
              <span className="summary-rate"> (Davomat: {monthStats.rate}%)</span>
            </p>
          ) : (
            <p className="summary-text muted">
              Shu oyda hali darslar o'tkazilmagan
            </p>
          )
        ) : (
          <div className="summary-prompt">
            <span className="summary-text muted">
              Shaxsiy davomatni ko'rish uchun profilingizni tanlang.
            </span>
            {onOpenProfilePicker && (
              <button
                type="button"
                className="summary-link-btn"
                onClick={onOpenProfilePicker}
              >
                Profilni tanlash
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .student-calendar-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .calendar-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .calendar-subtitle {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--apple-blue);
        }

        .calendar-month-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .calendar-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .calendar-btn-today {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          padding: 4px 10px;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .calendar-nav-btn {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background var(--transition-fast), border-color var(--transition-fast);
        }

        .calendar-nav-btn:hover,
        .calendar-btn-today:hover {
          background: var(--bg-secondary);
          border-color: var(--apple-blue);
        }

        .calendar-weekdays-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
          text-align: center;
        }

        .weekday-header {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-tertiary);
          padding: 4px 0;
        }

        .weekday-header.weekend {
          color: var(--text-secondary);
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .day-cell {
          aspect-ratio: 1;
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          padding: 0;
          transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
          user-select: none;
        }

        .day-cell.blank {
          background: transparent;
          border-color: transparent;
          cursor: default;
          pointer-events: none;
        }

        .day-cell:not(.blank):hover {
          border-color: var(--apple-blue);
        }

        .day-num {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1;
        }

        .day-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          margin-top: 3px;
        }

        .day-cell.today {
          border: 1.5px solid var(--apple-blue);
        }

        .day-cell.today .day-num {
          color: var(--apple-blue);
          font-weight: 700;
        }

        .day-cell.status-present {
          background: rgba(52, 199, 89, 0.12);
          border-color: rgba(52, 199, 89, 0.3);
        }
        .day-cell.status-present .day-num {
          color: #2E7D32;
        }
        .day-cell.status-present .day-dot {
          background: #2E7D32;
        }

        .day-cell.status-late {
          background: rgba(255, 149, 0, 0.12);
          border-color: rgba(255, 149, 0, 0.3);
        }
        .day-cell.status-late .day-num {
          color: #E65100;
        }
        .day-cell.status-late .day-dot {
          background: #E65100;
        }

        .day-cell.status-absent {
          background: rgba(255, 59, 48, 0.12);
          border-color: rgba(255, 59, 48, 0.3);
        }
        .day-cell.status-absent .day-num {
          color: #C62828;
        }
        .day-cell.status-absent .day-dot {
          background: #C62828;
        }

        .day-cell.status-excused {
          background: rgba(0, 113, 227, 0.08);
          border-color: rgba(0, 113, 227, 0.25);
        }
        .day-cell.status-excused .day-num {
          color: var(--apple-blue);
        }
        .day-cell.status-excused .day-dot {
          background: var(--apple-blue);
        }

        .day-cell.status-scheduled {
          border: 1px dashed var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.03);
        }

        .day-cell.selected {
          outline: 2px solid var(--apple-blue);
          outline-offset: 1px;
        }

        .selected-day-detail {
          margin-top: 14px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          display: flex;
          gap: 6px;
          align-items: center;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
        }

        .selected-day-detail.present {
          background: rgba(52, 199, 89, 0.1);
          border-color: rgba(52, 199, 89, 0.3);
        }
        .selected-day-detail.late {
          background: rgba(255, 149, 0, 0.1);
          border-color: rgba(255, 149, 0, 0.3);
        }
        .selected-day-detail.absent {
          background: rgba(255, 59, 48, 0.1);
          border-color: rgba(255, 59, 48, 0.3);
        }
        .selected-day-detail.excused {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.25);
        }
        .selected-day-detail.scheduled {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.04);
          border: 1px dashed var(--apple-blue);
        }
        .selected-day-detail.group-lesson {
          background: rgba(156, 163, 175, 0.1);
          border-color: rgba(156, 163, 175, 0.25);
        }

        .selected-date {
          font-weight: 700;
          color: var(--text-primary);
        }

        .selected-status {
          color: var(--text-secondary);
        }

        .calendar-legend {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color-subtle);
          font-size: 0.74rem;
          color: var(--text-secondary);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.present {
          background: var(--apple-green);
        }

        .legend-dot.late {
          background: var(--apple-orange);
        }

        .legend-dot.absent {
          background: var(--apple-red);
        }

        .legend-dash.scheduled {
          width: 10px;
          height: 0;
          border-top: 1.5px dashed var(--apple-blue);
        }

        .calendar-summary-footer {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
        }

        .summary-text {
          font-size: 0.84rem;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0;
        }

        .summary-text.muted {
          color: var(--text-secondary);
        }

        .summary-rate {
          font-weight: 700;
          color: var(--apple-blue);
        }

        .summary-prompt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .summary-link-btn {
          background: transparent;
          border: none;
          color: var(--apple-blue);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 0;
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .student-calendar-card {
            padding: 16px 14px;
            border-radius: var(--radius-lg);
          }

          .calendar-days-grid {
            gap: 4px;
          }

          .day-num {
            font-size: 0.8rem;
          }

          .calendar-legend {
            gap: 10px;
          }
        }

        [data-theme="dark"] .student-calendar-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .day-cell {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .day-cell.status-present .day-num,
        [data-theme="dark"] .day-cell.status-present .day-dot {
          color: #81C995;
          background: #81C995;
        }

        [data-theme="dark"] .day-cell.status-late .day-num,
        [data-theme="dark"] .day-cell.status-late .day-dot {
          color: #FDD663;
          background: #FDD663;
        }

        [data-theme="dark"] .day-cell.status-absent .day-num,
        [data-theme="dark"] .day-cell.status-absent .day-dot {
          color: #F28B82;
          background: #F28B82;
        }

        [data-theme="dark"] .day-cell.status-excused .day-num,
        [data-theme="dark"] .day-cell.status-excused .day-dot {
          color: #8AB4F8;
          background: #8AB4F8;
        }
      `}</style>
    </div>
  );
}
