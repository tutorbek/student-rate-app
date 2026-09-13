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

export default function StudentScheduleCard({ group }) {
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
    <div className="student-schedule-card">
      <div className="schedule-header">
        <div className="schedule-title-wrap">
          <span className="schedule-tag">Dars Jadvali</span>
          <h2 className="schedule-group-name">{group?.name || 'Guruh'}</h2>
        </div>
      </div>

      <div className="schedule-grid">
        <div className="schedule-item">
          <span className="schedule-label">Dars kunlari</span>
          <span className="schedule-value">{daysText}</span>
        </div>
        <div className="schedule-item">
          <span className="schedule-label">Dars vaqti</span>
          <span className="schedule-value">{timeText}</span>
        </div>
        {roomText && (
          <div className="schedule-item">
            <span className="schedule-label">Xona</span>
            <span className="schedule-value">{roomText}</span>
          </div>
        )}
      </div>

      <div className="schedule-next-banner">
        <span className="schedule-next-label">Keyingi dars:</span>
        <span className="schedule-next-time">{nextLessonText}</span>
      </div>

      <style>{`
        .student-schedule-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .schedule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .schedule-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .schedule-tag {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--apple-blue);
        }

        .schedule-group-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .schedule-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
        }

        .schedule-label {
          font-size: 0.74rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .schedule-value {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .schedule-next-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          border-left: 3px solid var(--apple-blue);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 0.88rem;
        }

        .schedule-next-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .schedule-next-time {
          color: var(--text-primary);
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .student-schedule-card {
            padding: 16px 16px;
            border-radius: var(--radius-lg);
          }

          .schedule-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .schedule-next-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
        }

        [data-theme="dark"] .student-schedule-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .schedule-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .schedule-next-banner {
          background: rgba(138, 180, 248, 0.12);
        }
      `}</style>
    </div>
  );
}
