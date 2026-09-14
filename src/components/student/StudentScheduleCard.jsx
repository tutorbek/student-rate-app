import React, { useMemo } from 'react';
import { extractGroupDays, extractGroupTimes } from '../../utils/scheduleUtils';

const DAY_NAMES_UZ = {
  mon: 'Dushanba',
  tue: 'Seshanba',
  wed: 'Chorshanba',
  thu: 'Payshanba',
  fri: 'Juma',
  sat: 'Shanba',
  sun: 'Yakshanba',
};

const WEEKDAYS = [
  { key: 'mon', short: 'Du', name: 'Dushanba' },
  { key: 'tue', short: 'Se', name: 'Seshanba' },
  { key: 'wed', short: 'Ch', name: 'Chorshanba' },
  { key: 'thu', short: 'Pa', name: 'Payshanba' },
  { key: 'fri', short: 'Ju', name: 'Juma' },
  { key: 'sat', short: 'Sh', name: 'Shanba' },
  { key: 'sun', short: 'Ya', name: 'Yakshanba' },
];

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const formatDaysList = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) {
    return 'Belgilanmagan';
  }
  const sorted = [...days].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
  return sorted.map((d) => DAY_NAMES_UZ[d] || d).join(', ');
};

const calculateNextLesson = (group) => {
  if (!group) return { text: 'Belgilanmagan', isToday: false, isLive: false };
  const schedule = group.schedule;
  const days = extractGroupDays(group);
  const times = extractGroupTimes(group);

  let startTime = schedule?.startTime?.trim();
  let endTime = schedule?.endTime?.trim();

  if (!startTime && times.startMinutes !== null) {
    const h = String(Math.floor(times.startMinutes / 60)).padStart(2, '0');
    const m = String(times.startMinutes % 60).padStart(2, '0');
    startTime = `${h}:${m}`;
  }
  if (!endTime && times.endMinutes !== null) {
    const h = String(Math.floor(times.endMinutes / 60)).padStart(2, '0');
    const m = String(times.endMinutes % 60).padStart(2, '0');
    endTime = `${h}:${m}`;
  }

  if (days.length === 0 || !startTime) {
    return { text: 'Belgilanmagan', isToday: false, isLive: false };
  }

  const now = new Date();
  const currentDayIdx = now.getDay();
  const currentKey = DAY_ORDER[currentDayIdx];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Check today
  if (days.includes(currentKey)) {
    if (currentTimeStr < startTime) {
      return { text: `Bugun soat ${startTime} da`, isToday: true, isLive: false };
    }
    if (endTime && currentTimeStr <= endTime) {
      return { text: `Dars vaqti davom etmoqda (${startTime} — ${endTime})`, isToday: true, isLive: true };
    }
    if (!endTime && currentTimeStr <= startTime) {
      return { text: `Bugun soat ${startTime} da`, isToday: true, isLive: false };
    }
  }

  // Check upcoming days within next week
  for (let offset = 1; offset <= 7; offset++) {
    const nextIdx = (currentDayIdx + offset) % 7;
    const nextKey = DAY_ORDER[nextIdx];
    if (days.includes(nextKey)) {
      if (offset === 1) {
        return { text: `Ertaga soat ${startTime} da`, isToday: false, isLive: false };
      }
      if (offset === 7) {
        return { text: `Keyingi ${DAY_NAMES_UZ[nextKey]} soat ${startTime} da`, isToday: false, isLive: false };
      }
      return { text: `${DAY_NAMES_UZ[nextKey]} soat ${startTime} da`, isToday: false, isLive: false };
    }
  }

  return { text: 'Belgilanmagan', isToday: false, isLive: false };
};

export default function StudentScheduleCard({
  group,
  isActive = false,
  showActiveBadge = false,
  onMakeActive = null,
}) {
  const schedule = group?.schedule;
  const extractedDays = useMemo(() => extractGroupDays(group), [group]);
  const times = useMemo(() => extractGroupTimes(group), [group]);

  const daysText = useMemo(() => formatDaysList(extractedDays), [extractedDays]);
  const activeDaysSet = useMemo(() => new Set(extractedDays), [extractedDays]);

  const currentDayKey = useMemo(() => {
    return DAY_ORDER[new Date().getDay()];
  }, []);

  const timeText = useMemo(() => {
    let start = schedule?.startTime?.trim();
    let end = schedule?.endTime?.trim();
    if (!start && times.startMinutes !== null) {
      start = `${String(Math.floor(times.startMinutes / 60)).padStart(2, '0')}:${String(times.startMinutes % 60).padStart(2, '0')}`;
    }
    if (!end && times.endMinutes !== null) {
      end = `${String(Math.floor(times.endMinutes / 60)).padStart(2, '0')}:${String(times.endMinutes % 60).padStart(2, '0')}`;
    }
    if (start && end) return `${start} — ${end}`;
    if (start) return start;
    return 'Belgilanmagan';
  }, [schedule?.startTime, schedule?.endTime, times]);

  const roomText = schedule?.room
    ? (schedule.room.toLowerCase().includes('xona') ? schedule.room : `${schedule.room}-xona`)
    : null;

  const nextLessonInfo = useMemo(() => {
    return calculateNextLesson(group);
  }, [group]);

  return (
    <div className={`student-schedule-widget ${showActiveBadge && isActive ? 'is-active-card' : ''}`}>
      {/* Live / Upcoming Status Hero Banner */}
      <div className={`schedule-hero-strip ${nextLessonInfo.isLive ? 'is-live' : nextLessonInfo.isToday ? 'is-today' : ''}`}>
        <div className="hero-strip-left">
          <span className={`hero-pulse-dot ${nextLessonInfo.isLive ? 'pulse-live' : nextLessonInfo.isToday ? 'pulse-today' : ''}`} />
          <span className="hero-strip-title">
            {nextLessonInfo.isLive ? "DARS DAVOM ETMOQDA" : "KEYINGI DARS"}
          </span>
        </div>
        <span className="hero-strip-time">{nextLessonInfo.text}</span>
      </div>

      {/* Main Group Header Row */}
      <div className="schedule-main-header">
        <div className="schedule-group-info">
          <div className="schedule-icon-container">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <div className="schedule-title-meta">
            <h3 className="schedule-group-heading">{group?.name || "Guruh"}</h3>
            {roomText && (
              <span className="schedule-room-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {roomText}
              </span>
            )}
          </div>
        </div>

        {showActiveBadge && (
          isActive ? (
            <span className="schedule-active-pill">
              <span className="active-dot" /> Asosiy
            </span>
          ) : onMakeActive ? (
            <button
              type="button"
              className="schedule-switch-btn"
              onClick={onMakeActive}
              title="Ushbu guruhni tanlash"
            >
              Tanlash
            </button>
          ) : null
        )}
      </div>

      {/* Weekday Visual Track */}
      <div className="schedule-weekdays-track" aria-label="Haftalik dars jadvali">
        {WEEKDAYS.map((wd) => {
          const hasClass = activeDaysSet.has(wd.key);
          const isToday = currentDayKey === wd.key;
          return (
            <div
              key={wd.key}
              className={`weekday-pill ${hasClass ? 'has-class' : ''} ${isToday ? 'is-current-day' : ''}`}
              title={`${wd.name}: ${hasClass ? 'Dars kuni' : "Dars yo'q"}`}
            >
              <span className="weekday-pill-short">{wd.short}</span>
              {hasClass && <span className="weekday-pill-dot" />}
            </div>
          );
        })}
      </div>

      {/* Key Details Row: Time & Days summary */}
      <div className="schedule-glance-row">
        <div className="glance-item">
          <div className="glance-icon-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="glance-text-col">
            <span className="glance-label">Dars vaqti</span>
            <span className="glance-value">{timeText}</span>
          </div>
        </div>

        <div className="glance-item">
          <div className="glance-icon-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="glance-text-col">
            <span className="glance-label">Dars kunlari</span>
            <span className="glance-value" title={daysText}>{daysText}</span>
          </div>
        </div>
      </div>

      <style>{`
        .student-schedule-widget {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 20px);
          padding: 14px 16px;
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .student-schedule-widget.is-active-card {
          border-color: rgba(52, 199, 89, 0.4);
          box-shadow: 0 4px 18px rgba(52, 199, 89, 0.08);
        }

        /* Hero Next Lesson Strip */
        .schedule-hero-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
          border: 1px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.14);
          border-radius: var(--radius-md, 12px);
          gap: 8px;
          flex-wrap: wrap;
        }

        .schedule-hero-strip.is-today {
          background: rgba(52, 199, 89, 0.08);
          border-color: rgba(52, 199, 89, 0.25);
        }

        .schedule-hero-strip.is-live {
          background: linear-gradient(135deg, rgba(52, 199, 89, 0.16), rgba(0, 113, 227, 0.12));
          border-color: rgba(52, 199, 89, 0.4);
        }

        .hero-strip-left {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .hero-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--apple-blue);
          flex-shrink: 0;
        }

        .hero-pulse-dot.pulse-today {
          background: #34C759;
          box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.25);
        }

        .hero-pulse-dot.pulse-live {
          background: #34C759;
          box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.35);
          animation: livePulse 1.8s infinite;
        }

        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .hero-strip-title {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .hero-strip-time {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Main Header */
        .schedule-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .schedule-group-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .schedule-icon-container {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
          color: var(--apple-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .schedule-title-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .schedule-group-heading {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .schedule-room-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          padding: 2px 7px;
          border-radius: var(--radius-full);
          width: fit-content;
        }

        .schedule-active-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: rgba(52, 199, 89, 0.12);
          color: #34C759;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }

        .active-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34C759;
        }

        .schedule-switch-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          color: var(--apple-blue);
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          touch-action: manipulation;
          flex-shrink: 0;
        }

        .schedule-switch-btn:hover {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        /* Weekday Pills Track */
        .schedule-weekdays-track {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          padding: 3px 0;
        }

        .weekday-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.04));
          transition: all var(--transition-fast);
          position: relative;
        }

        .weekday-pill-short {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-tertiary);
          line-height: 1;
        }

        .weekday-pill.has-class {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.09);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.25);
        }

        .weekday-pill.has-class .weekday-pill-short {
          color: var(--apple-blue);
          font-weight: 700;
        }

        .weekday-pill-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--apple-blue);
          margin-top: 3px;
        }

        .weekday-pill.is-current-day {
          border-color: #34C759 !important;
          box-shadow: 0 0 0 1px #34C759;
        }

        .weekday-pill.is-current-day .weekday-pill-short {
          color: #2E7D32;
          font-weight: 800;
        }

        .weekday-pill.is-current-day .weekday-pill-dot {
          background: #2E7D32;
        }

        /* 2-Column Glance Details */
        .schedule-glance-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .glance-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.05));
          border-radius: 11px;
          padding: 8px 10px;
          min-width: 0;
        }

        .glance-icon-wrap {
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .glance-text-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .glance-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .glance-value {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 420px) {
          .student-schedule-widget {
            padding: 12px 13px;
            gap: 10px;
          }

          .schedule-hero-strip {
            padding: 7px 10px;
          }

          .hero-strip-time {
            font-size: 0.76rem;
          }

          .schedule-group-heading {
            font-size: 0.96rem;
          }

          .weekday-pill {
            height: 32px;
            border-radius: 8px;
          }

          .weekday-pill-short {
            font-size: 0.68rem;
          }

          .schedule-glance-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }

        [data-theme="dark"] .student-schedule-widget {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .schedule-hero-strip {
          background: rgba(138, 180, 248, 0.08);
          border-color: rgba(138, 180, 248, 0.18);
        }

        [data-theme="dark"] .weekday-pill {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .weekday-pill.has-class {
          background: rgba(138, 180, 248, 0.14);
          border-color: rgba(138, 180, 248, 0.3);
        }

        [data-theme="dark"] .weekday-pill.is-current-day {
          border-color: #81C995 !important;
          box-shadow: 0 0 0 1px #81C995;
        }

        [data-theme="dark"] .weekday-pill.is-current-day .weekday-pill-short,
        [data-theme="dark"] .weekday-pill.is-current-day .weekday-pill-dot {
          color: #81C995;
          background: #81C995;
        }

        [data-theme="dark"] .glance-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
