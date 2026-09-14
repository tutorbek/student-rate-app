import React, { useMemo } from 'react';

const DAY_NAMES_UZ = {
  mon: 'Dushanba',
  tue: 'Seshanba',
  wed: 'Chorshanba',
  thu: 'Payshanba',
  fri: 'Juma',
  sat: 'Shanba',
  sun: 'Yakshanba',
};

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const formatDaysList = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) {
    return 'Belgilanmagan';
  }
  const sorted = [...days].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
  return sorted.map((d) => DAY_NAMES_UZ[d] || d).join(', ');
};

const calculateNextLesson = (schedule, groupName = '') => {
  let days = Array.isArray(schedule?.days) ? [...schedule.days] : [];
  const startTime = schedule?.startTime?.trim();
  const endTime = schedule?.endTime?.trim();

  if (days.length === 0 && groupName) {
    const lower = groupName.toLowerCase();
    if (lower.includes('dushanba')) days = ['mon'];
    else if (lower.includes('seshanba')) days = ['tue'];
    else if (lower.includes('chorshanba')) days = ['wed'];
    else if (lower.includes('payshanba')) days = ['thu'];
    else if (lower.includes('juma')) days = ['fri'];
    else if (lower.includes('shanba')) days = ['sat'];
    else if (lower.includes('yakshanba')) days = ['sun'];
  }

  if (days.length === 0 || !startTime) {
    return 'Belgilanmagan';
  }

  const now = new Date();
  const currentDayIdx = now.getDay();
  const currentKey = DAY_ORDER[currentDayIdx];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Check today
  if (days.includes(currentKey)) {
    if (currentTimeStr < startTime) {
      return `Bugun soat ${startTime} da`;
    }
    if (endTime && currentTimeStr <= endTime) {
      return `Bugun dars vaqti (${startTime} — ${endTime})`;
    }
    if (!endTime && currentTimeStr <= startTime) {
      return `Bugun soat ${startTime} da`;
    }
  }

  // Check upcoming days within the next week
  for (let offset = 1; offset <= 7; offset++) {
    const nextIdx = (currentDayIdx + offset) % 7;
    const nextKey = DAY_ORDER[nextIdx];
    if (days.includes(nextKey)) {
      if (offset === 1) {
        return `Ertaga soat ${startTime} da`;
      }
      if (offset === 7) {
        return `Keyingi ${DAY_NAMES_UZ[nextKey]} soat ${startTime} da`;
      }
      return `${DAY_NAMES_UZ[nextKey]} soat ${startTime} da`;
    }
  }

  return 'Belgilanmagan';
};

export default function StudentScheduleCard({
  group,
  isActive = false,
  showActiveBadge = false,
  onMakeActive = null,
}) {
  const schedule = group?.schedule;
  const daysText = useMemo(() => formatDaysList(schedule?.days), [schedule?.days]);
  const timeText = useMemo(() => {
    const start = schedule?.startTime?.trim();
    const end = schedule?.endTime?.trim();
    if (start && end) return `${start} — ${end}`;
    if (start) return start;
    return 'Belgilanmagan';
  }, [schedule?.startTime, schedule?.endTime]);

  const roomText = schedule?.room ? (schedule.room.includes('xona') ? schedule.room : `${schedule.room}-xona`) : null;
  const nextLessonText = useMemo(() => calculateNextLesson(schedule, group?.name), [schedule, group?.name]);

  return (
    <div className={`student-schedule-card ${showActiveBadge && isActive ? 'is-active-card' : ''}`}>
      <div className="schedule-card-header">
        <div className="schedule-card-title-row">
          <div className="schedule-card-left">
            <div className="schedule-icon-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="schedule-name-wrap">
              <h3 className="schedule-group-name">{group?.name || 'Guruh'}</h3>
              {roomText && <span className="schedule-room-chip">{roomText}</span>}
            </div>
          </div>

          <div className="schedule-card-right">
            {showActiveBadge && (
              isActive ? (
                <span className="schedule-active-badge">
                  <span className="badge-dot" /> Faol guruh
                </span>
              ) : onMakeActive ? (
                <button
                  type="button"
                  className="schedule-activate-btn"
                  onClick={onMakeActive}
                  title="Ushbu guruhni asosiy (faol) qilish"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Faol qilish
                </button>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* Info Row: Days & Time in a 2-Column Compact Layout */}
      <div className="schedule-info-row">
        <div className="schedule-info-box">
          <div className="info-box-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="info-box-label">Dars kunlari</span>
          </div>
          <span className="info-box-value">{daysText}</span>
        </div>

        <div className="schedule-info-box">
          <div className="info-box-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="info-box-label">Dars vaqti</span>
          </div>
          <span className="info-box-value">{timeText}</span>
        </div>
      </div>

      {/* Next Lesson Strip */}
      <div className="schedule-next-strip">
        <span className="next-strip-dot" />
        <span className="next-strip-label">Keyingi dars:</span>
        <span className="next-strip-time">{nextLessonText}</span>
      </div>

      <style>{`
        .student-schedule-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg, 14px);
          padding: 14px 16px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .student-schedule-card.is-active-card {
          border-color: rgba(52, 199, 89, 0.45);
          background: var(--bg-card);
          box-shadow: 0 4px 14px rgba(52, 199, 89, 0.08);
        }

        .schedule-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .schedule-card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 8px;
        }

        .schedule-card-left {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .schedule-icon-badge {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
          color: var(--apple-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .schedule-name-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .schedule-group-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .schedule-room-chip {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          padding: 2px 7px;
          border-radius: 5px;
          white-space: nowrap;
        }

        .schedule-card-right {
          flex-shrink: 0;
        }

        .schedule-active-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: var(--radius-full);
          background: rgba(52, 199, 89, 0.12);
          color: #34C759;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34C759;
        }

        .schedule-activate-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          color: var(--apple-blue);
          border: 1px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.2);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          touch-action: manipulation;
        }

        .schedule-activate-btn:hover {
          background: var(--apple-blue);
          color: #ffffff;
          border-color: var(--apple-blue);
        }

        /* 2-Column Info Row */
        .schedule-info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .schedule-info-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color);
          border-radius: 9px;
          padding: 8px 10px;
          min-width: 0;
        }

        .info-box-header {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .info-icon {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        .info-box-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-box-value {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Next Lesson Accent Strip */
        .schedule-next-strip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
          border: 1px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.15);
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.8rem;
          flex-wrap: wrap;
        }

        .next-strip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--apple-blue);
          flex-shrink: 0;
        }

        .next-strip-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .next-strip-time {
          color: var(--text-primary);
          font-weight: 700;
        }

        @media (max-width: 420px) {
          .student-schedule-card {
            padding: 12px 14px;
          }

          .schedule-info-row {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .info-box-value {
            font-size: 0.78rem;
          }
        }

        [data-theme="dark"] .student-schedule-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .schedule-info-box {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.07);
        }

        [data-theme="dark"] .schedule-next-strip {
          background: rgba(138, 180, 248, 0.1);
          border-color: rgba(138, 180, 248, 0.2);
        }
      `}</style>
    </div>
  );
}
