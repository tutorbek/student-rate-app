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
      return { text: `${DAY_NAMES_UZ[nextKey]} soat ${startTime} da`, isToday: false, isLive: false };
    }
  }

  return { text: 'Belgilanmagan', isToday: false, isLive: false };
};

export default function StudentScheduleCard({ group }) {
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

  const nextLessonInfo = useMemo(() => {
    return calculateNextLesson(group);
  }, [group]);

  return (
    <div className="native-schedule-card" id="student-schedule-card">
      {/* Dynamic Status Strip */}
      <div className={`native-schedule-strip ${nextLessonInfo.isLive ? 'is-live' : nextLessonInfo.isToday ? 'is-today' : ''}`}>
        <span className="schedule-status-eyebrow">
          {nextLessonInfo.isLive ? "DARS DAVOM ETMOQDA" : "KEYINGI DARS"}
        </span>
        <span className="schedule-status-time">{nextLessonInfo.text}</span>
      </div>

      {/* Main Group Header Row */}
      <div className="native-schedule-header">
        <div className="schedule-header-titles">
          <h3 className="schedule-group-name">{group?.name || "Guruh"}</h3>
        </div>
      </div>

      {/* Weekday Visual Track */}
      <div className="native-weekdays-row" aria-label="Haftalik dars jadvali">
        {WEEKDAYS.map((wd) => {
          const hasClass = activeDaysSet.has(wd.key);
          const isToday = currentDayKey === wd.key;
          return (
            <div
              key={wd.key}
              className={`native-weekday-cell ${hasClass ? 'has-class' : ''} ${isToday ? 'is-today' : ''}`}
            >
              <span className="cell-day-text">{wd.short}</span>
              {hasClass && <span className="cell-dot" />}
            </div>
          );
        })}
      </div>

      {/* Key Details */}
      <div className="native-schedule-meta-grid">
        <div className="schedule-meta-box">
          <span className="meta-label">Dars vaqti</span>
          <span className="meta-value">{timeText}</span>
        </div>
        <div className="schedule-meta-box">
          <span className="meta-label">Dars kunlari</span>
          <span className="meta-value" title={daysText}>{daysText}</span>
        </div>
      </div>
    </div>
  );
}
