export const DAY_KEYS_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const SCHEDULE_DAY_FULL_NAMES = {
  mon: 'Dushanba',
  tue: 'Seshanba',
  wed: 'Chorshanba',
  thu: 'Payshanba',
  fri: 'Juma',
  sat: 'Shanba',
  sun: 'Yakshanba',
};

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
};

export const extractGroupDays = (group) => {
  if (!group) return [];
  let days = Array.isArray(group.schedule?.days) ? [...group.schedule.days] : [];
  if (days.length === 0 && group.name) {
    const lower = group.name.toLowerCase();
    if (lower.includes('dushanba')) days.push('mon');
    if (lower.includes('seshanba')) days.push('tue');
    if (lower.includes('chorshanba')) days.push('wed');
    if (lower.includes('payshanba')) days.push('thu');
    if (lower.includes('juma')) days.push('fri');
    if (lower.includes('shanba')) days.push('sat');
    if (lower.includes('yakshanba')) days.push('sun');
  }
  return days;
};

export const extractGroupTimes = (group) => {
  if (!group) return { startMinutes: null, endMinutes: null };
  let startTimeStr = group.schedule?.startTime?.trim();
  let endTimeStr = group.schedule?.endTime?.trim();

  // If no explicit startTime, check name
  if (!startTimeStr && group.name) {
    const match = group.name.match(/(\d{1,2})[:.](\d{2})/);
    if (match) {
      startTimeStr = `${match[1]}:${match[2]}`;
    }
  }

  const startMinutes = parseTimeToMinutes(startTimeStr);
  let endMinutes = parseTimeToMinutes(endTimeStr);

  if (startMinutes !== null && endMinutes === null) {
    // Default lesson duration: 90 minutes
    endMinutes = (startMinutes + 90) % 1440;
  }

  return { startMinutes, endMinutes };
};

/**
 * Checks whether a specific group is currently in its active lesson window.
 * The window includes a 15-minute buffer before the start and 15-minute buffer after the end.
 *
 * @param {Object} group
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export const isGroupLessonActive = (group, now = new Date()) => {
  if (!group || group.deleted) return false;

  const currentDayKey = DAY_KEYS_MAP[now.getDay()];
  const days = extractGroupDays(group);
  if (!days.includes(currentDayKey)) {
    return false;
  }

  const { startMinutes, endMinutes } = extractGroupTimes(group);
  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 15-minute buffer before start and after end
  const windowStart = Math.max(0, startMinutes - 15);
  const windowEnd = Math.min(1439, endMinutes + 15);

  if (windowEnd >= windowStart) {
    return currentMinutes >= windowStart && currentMinutes <= windowEnd;
  } else {
    // Crosses midnight
    return currentMinutes >= windowStart || currentMinutes <= windowEnd;
  }
};

/**
 * Finds the group currently having a lesson (with 15 min buffer before & after).
 * If multiple groups match, returns the one where current time is closest to start time.
 *
 * @param {Array} groups
 * @param {Date} [now=new Date()]
 * @returns {Object|null}
 */
export const getCurrentActiveLessonGroup = (groups = [], now = new Date()) => {
  if (!Array.isArray(groups) || groups.length === 0) return null;

  const activeGroups = groups.filter((g) => g && !g.deleted && isGroupLessonActive(g, now));
  if (activeGroups.length === 0) return null;

  if (activeGroups.length === 1) return activeGroups[0];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return activeGroups.reduce((best, curr) => {
    if (!best) return curr;
    const { startMinutes: bestStart } = extractGroupTimes(best);
    const { startMinutes: currStart } = extractGroupTimes(curr);
    const distBest = Math.abs(currentMinutes - (bestStart || 0));
    const distCurr = Math.abs(currentMinutes - (currStart || 0));
    return distCurr < distBest ? curr : best;
  }, null);
};
