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
 * The window includes a 5-minute buffer before the start and 5-minute buffer after the end.
 *
 * @param {Object} group
 * @param {Date} [now=new Date()]
 * @param {number} [bufferMinutes=5]
 * @param {Array} [extraLessons=[]]
 * @returns {boolean}
 */
export const isGroupLessonActive = (group, now = new Date(), bufferMinutes = 5, extraLessons = []) => {
  if (!group || group.deleted) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Check if group has an Extra Lesson today
  if (Array.isArray(extraLessons) && extraLessons.length > 0) {
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayExtra = extraLessons.find(
      (el) => el && String(el.groupId) === String(group.id) && el.date === todayDateStr && (!studentId || isStudentTargetedByExtraLesson(el, studentId))
    );
    if (todayExtra && todayExtra.startTime) {
      const startMin = parseTimeToMinutes(todayExtra.startTime);
      let endMin = parseTimeToMinutes(todayExtra.endTime);
      if (startMin !== null) {
        if (endMin === null) endMin = (startMin + 90) % 1440;
        const wStart = Math.max(0, startMin - bufferMinutes);
        const wEnd = Math.min(1439, endMin + bufferMinutes);
        const isActive = wEnd >= wStart
          ? currentMinutes >= wStart && currentMinutes <= wEnd
          : currentMinutes >= wStart || currentMinutes <= wEnd;
        if (isActive) return true;
      }
    }
  }

  // 2. Regular weekly schedule check
  const currentDayKey = DAY_KEYS_MAP[now.getDay()];
  const days = extractGroupDays(group);
  if (!days.includes(currentDayKey)) {
    return false;
  }

  const { startMinutes, endMinutes } = extractGroupTimes(group);
  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  // 5-minute buffer before start and after end
  const windowStart = Math.max(0, startMinutes - bufferMinutes);
  const windowEnd = Math.min(1439, endMinutes + bufferMinutes);

  if (windowEnd >= windowStart) {
    return currentMinutes >= windowStart && currentMinutes <= windowEnd;
  } else {
    // Crosses midnight
    return currentMinutes >= windowStart || currentMinutes <= windowEnd;
  }
};

/**
 * Checks whether an Extra Lesson applies to a specific student.
 * If targetType is 'all' (or undefined/null), it applies to all students in that group.
 * If targetType is 'custom', it only applies if studentIds includes the student's ID.
 */
export const isStudentTargetedByExtraLesson = (extraLesson, studentId) => {
  if (!extraLesson) return false;
  if (!extraLesson.targetType || extraLesson.targetType === 'all') return true;
  if (extraLesson.targetType === 'custom') {
    if (!studentId) return false;
    return Array.isArray(extraLesson.studentIds) && extraLesson.studentIds.some((id) => String(id) === String(studentId));
  }
  return true;
};

/**
 * Finds the group currently having a lesson (with 5 min buffer before & after).
 * If multiple groups match, returns the one where current time is closest to start time.
 * Supports Extra Lessons.
 *
 * @param {Array} groups
 * @param {Date} [now=new Date()]
 * @param {number} [bufferMinutes=5]
 * @param {Array} [extraLessons=[]]
 * @param {string|number|null} [studentId=null]
 * @returns {Object|null}
 */
export const getCurrentActiveLessonGroup = (groups = [], now = new Date(), bufferMinutes = 5, extraLessons = [], studentId = null) => {
  if (!Array.isArray(groups) || groups.length === 0) return null;

  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check extra lessons first
  if (Array.isArray(extraLessons) && extraLessons.length > 0) {
    const activeExtras = extraLessons.filter((el) => {
      if (!el || el.date !== todayDateStr) return false;
      if (studentId && !isStudentTargetedByExtraLesson(el, studentId)) return false;
      const startMin = parseTimeToMinutes(el.startTime);
      let endMin = parseTimeToMinutes(el.endTime);
      if (startMin === null) return false;
      if (endMin === null) endMin = (startMin + 90) % 1440;
      const wStart = Math.max(0, startMin - bufferMinutes);
      const wEnd = Math.min(1439, endMin + bufferMinutes);
      return wEnd >= wStart
        ? currentMinutes >= wStart && currentMinutes <= wEnd
        : currentMinutes >= wStart || currentMinutes <= wEnd;
    });

    if (activeExtras.length > 0) {
      const matchedLesson = activeExtras[0];
      const grp = groups.find((g) => String(g.id) === String(matchedLesson.groupId) && !g.deleted);
      if (grp) {
        return {
          ...grp,
          isExtraLesson: true,
          extraLessonData: matchedLesson,
        };
      }
    }
  }

  const activeGroups = groups.filter((g) => g && !g.deleted && isGroupLessonActive(g, now, bufferMinutes, extraLessons, studentId));
  if (activeGroups.length === 0) return null;

  if (activeGroups.length === 1) return activeGroups[0];

  return activeGroups.reduce((best, curr) => {
    if (!best) return curr;
    const { startMinutes: bestStart } = extractGroupTimes(best);
    const { startMinutes: currStart } = extractGroupTimes(curr);
    const distBest = Math.abs(currentMinutes - (bestStart || 0));
    const distCurr = Math.abs(currentMinutes - (currStart || 0));
    return distCurr < distBest ? curr : best;
  }, null);
};

/**
 * Returns upcoming or current extra lessons for a group, sorted chronologically.
 */
export const getUpcomingExtraLessons = (groupId, extraLessons = [], now = new Date(), studentId = null) => {
  if (!groupId || !Array.isArray(extraLessons) || extraLessons.length === 0) return [];
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return extraLessons
    .filter((el) => {
      if (!el || String(el.groupId) !== String(groupId) || el.date < todayStr) return false;
      if (studentId && !isStudentTargetedByExtraLesson(el, studentId)) return false;
      return true;
    })
    .sort((a, b) => {
      const cmpDate = (a.date || '').localeCompare(b.date || '');
      if (cmpDate !== 0) return cmpDate;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
};

