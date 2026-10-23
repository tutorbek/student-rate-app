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

    // Schedule presets
    if (lower.includes('toq kun')) {
      ['mon', 'wed', 'fri'].forEach((d) => { if (!days.includes(d)) days.push(d); });
    }
    if (lower.includes('juft kun')) {
      ['tue', 'thu', 'sat'].forEach((d) => { if (!days.includes(d)) days.push(d); });
    }
    if (lower.includes('har kuni') || lower.includes('har kun')) {
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach((d) => { if (!days.includes(d)) days.push(d); });
    }

    if (lower.includes('dushanba')) {
      if (!days.includes('mon')) days.push('mon');
    }
    if (lower.includes('seshanba')) {
      if (!days.includes('tue')) days.push('tue');
    }
    if (lower.includes('chorshanba')) {
      if (!days.includes('wed')) days.push('wed');
    }
    if (lower.includes('payshanba')) {
      if (!days.includes('thu')) days.push('thu');
    }
    if (lower.includes('juma')) {
      if (!days.includes('fri')) days.push('fri');
    }
    if (lower.includes('yakshanba')) {
      if (!days.includes('sun')) days.push('sun');
    }

    // Shanba (Saturday) check: MUST NOT match the 'shanba' inside dushanba, seshanba, chorshanba, payshanba, yakshanba
    const withoutOtherShanbas = lower.replace(/(dushanba|seshanba|chorshanba|payshanba|yakshanba)/g, '');
    if (withoutOtherShanbas.includes('shanba')) {
      if (!days.includes('sat')) days.push('sat');
    }
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
 * The window includes a 3-minute buffer before the start and 3-minute buffer after the end.
 * When back-to-back lessons exist today, their boundary is clamped so both groups never
 * show "Hozir darsda" simultaneously.
 *
 * @param {Object} group
 * @param {Date} [now=new Date()]
 * @param {number} [bufferMinutes=3]
 * @param {Array} [extraLessons=[]]
 * @param {string|number|null} [studentId=null]
 * @param {Array} [allGroups=[]]
 * @returns {boolean}
 */
export const isGroupLessonActive = (
  group,
  now = new Date(),
  bufferMinutes = 3,
  extraLessons = [],
  studentId = null,
  allGroups = []
) => {
  if (!group || group.deleted) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentDayKey = DAY_KEYS_MAP[now.getDay()];

  let targetStart = null;
  let targetEnd = null;

  // 1. Check if group has an Extra Lesson today
  if (Array.isArray(extraLessons) && extraLessons.length > 0) {
    const todayExtra = extraLessons.find(
      (el) => el && String(el.groupId) === String(group.id) && el.date === todayDateStr && (!studentId || isStudentTargetedByExtraLesson(el, studentId))
    );
    if (todayExtra && todayExtra.startTime) {
      const startMin = parseTimeToMinutes(todayExtra.startTime);
      let endMin = parseTimeToMinutes(todayExtra.endTime);
      if (startMin !== null) {
        if (endMin === null) endMin = (startMin + 90) % 1440;
        targetStart = startMin;
        targetEnd = endMin;
      }
    }
  }

  // 2. Regular weekly schedule check if no extra lesson found
  if (targetStart === null || targetEnd === null) {
    const days = extractGroupDays(group);
    if (days.includes(currentDayKey)) {
      const { startMinutes, endMinutes } = extractGroupTimes(group);
      if (startMinutes !== null && endMinutes !== null) {
        targetStart = startMinutes;
        targetEnd = endMinutes;
      }
    }
  }

  if (targetStart === null || targetEnd === null) {
    return false;
  }

  // 3-minute buffer before start and after end
  let windowStart = Math.max(0, targetStart - bufferMinutes);
  let windowEnd = Math.min(1439, targetEnd + bufferMinutes);

  // 3. Collision resolution for consecutive / back-to-back lessons on the same day
  const otherLessonsToday = [];

  if (Array.isArray(extraLessons)) {
    extraLessons.forEach((el) => {
      if (!el || el.date !== todayDateStr) return;
      if (String(el.groupId) === String(group.id)) return;
      if (studentId && !isStudentTargetedByExtraLesson(el, studentId)) return;
      const sMin = parseTimeToMinutes(el.startTime);
      let eMin = parseTimeToMinutes(el.endTime);
      if (sMin !== null) {
        if (eMin === null) eMin = (sMin + 90) % 1440;
        otherLessonsToday.push({ start: sMin, end: eMin });
      }
    });
  }

  if (Array.isArray(allGroups)) {
    allGroups.forEach((g) => {
      if (!g || g.deleted || String(g.id) === String(group.id)) return;
      const hasExtra = Array.isArray(extraLessons) && extraLessons.some(
        (el) => el && String(el.groupId) === String(g.id) && el.date === todayDateStr
      );
      if (hasExtra) return;

      const gDays = extractGroupDays(g);
      if (gDays.includes(currentDayKey)) {
        const { startMinutes: gStart, endMinutes: gEnd } = extractGroupTimes(g);
        if (gStart !== null && gEnd !== null) {
          otherLessonsToday.push({ start: gStart, end: gEnd });
        }
      }
    });
  }

  for (const other of otherLessonsToday) {
    // If other lesson finishes right before or near this group starts:
    if (other.end <= targetStart) {
      if (other.end === targetStart) {
        // Exactly consecutive: prior lesson ends at targetStart, so this group starts strictly at targetStart
        windowStart = Math.max(windowStart, targetStart);
      } else if (targetStart - other.end < 2 * bufferMinutes) {
        // Small gap where buffers overlap: split at midpoint + 1
        const mid = Math.floor((other.end + targetStart) / 2) + 1;
        windowStart = Math.max(windowStart, mid);
      }
    }

    // If other lesson starts right after or near this group ends:
    if (other.start >= targetEnd) {
      if (other.start === targetEnd) {
        // Exactly consecutive: next lesson begins at targetEnd, so this group window stops before targetEnd
        windowEnd = Math.min(windowEnd, targetEnd - 1);
      } else if (other.start - targetEnd < 2 * bufferMinutes) {
        // Small gap where buffers overlap: split at midpoint
        const mid = Math.floor((targetEnd + other.start) / 2);
        windowEnd = Math.min(windowEnd, mid);
      }
    }
  }

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
 * Finds the group currently having a lesson (with 3 min buffer before & after).
 * If multiple groups match, returns the one where current time is closest to start time.
 * Supports Extra Lessons.
 *
 * @param {Array} groups
 * @param {Date} [now=new Date()]
 * @param {number} [bufferMinutes=3]
 * @param {Array} [extraLessons=[]]
 * @param {string|number|null} [studentId=null]
 * @returns {Object|null}
 */
export const getCurrentActiveLessonGroup = (groups = [], now = new Date(), bufferMinutes = 3, extraLessons = [], studentId = null) => {
  if (!Array.isArray(groups) || groups.length === 0) return null;

  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check extra lessons first
  if (Array.isArray(extraLessons) && extraLessons.length > 0) {
    const activeExtras = extraLessons.filter((el) => {
      if (!el || el.date !== todayDateStr) return false;
      if (studentId && !isStudentTargetedByExtraLesson(el, studentId)) return false;
      const grp = groups.find((g) => String(g.id) === String(el.groupId) && !g.deleted);
      if (!grp) return false;
      return isGroupLessonActive(grp, now, bufferMinutes, extraLessons, studentId, groups);
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

  const activeGroups = groups.filter((g) => g && !g.deleted && isGroupLessonActive(g, now, bufferMinutes, extraLessons, studentId, groups));
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

export const DAY_INDEX_MAP = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };


/**
 * Computes YYYY-MM-DD date string for a given day-of-week in the baseDate's week (Mon-Sun).
 */
export const getWeekDayDateStr = (baseDate, targetDayKey) => {
  const d = new Date(baseDate);
  const currentIsoDay = d.getDay() === 0 ? 7 : d.getDay();
  const targetIsoDay = DAY_INDEX_MAP[targetDayKey] || 1;
  const diffDays = targetIsoDay - currentIsoDay;
  d.setDate(d.getDate() + diffDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const SCHEDULE_WEEKDAYS = [
  { key: 'mon', name: 'Dushanba', short: 'Du' },
  { key: 'tue', name: 'Seshanba', short: 'Se' },
  { key: 'wed', name: 'Chorshanba', short: 'Cho' },
  { key: 'thu', name: 'Payshanba', short: 'Pa' },
  { key: 'fri', name: 'Juma', short: 'Ju' },
  { key: 'sat', name: 'Shanba', short: 'Sha' },
  { key: 'sun', name: 'Yakshanba', short: 'Ya' },
];

export const DEFAULT_SCHEDULE_ROOMS = ['1-xona', '2-xona', '3-xona', '4-xona'];
export const TEACHER_IDS = ['teacher1'];
export const TEACHER_LABELS = {
  teacher1: 'Bekzod',
};

export const formatLessonDuration = (startMinutes, endMinutes) => {
  if (startMinutes === null || endMinutes === null || isNaN(startMinutes) || isNaN(endMinutes)) {
    return '90 daqiqa';
  }
  if (endMinutes <= startMinutes) {
    return '0 daqiqa';
  }
  const diff = endMinutes - startMinutes;
  return `${diff} daqiqa`;
};

export const formatMinutesToTime = (totalMinutes) => {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '00:00';
  const norm = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Detects room collisions among lesson instances occurring on the same day in the same room.
 */
export const detectRoomConflicts = (lessons = []) => {
  const conflictPairs = [];
  const conflictingGroupIds = new Set();
  const conflictingLessonIds = new Set();
  const conflictsMap = new Map();

  for (let i = 0; i < lessons.length; i++) {
    const l1 = lessons[i];
    if (!l1 || l1.startMinutes === null || l1.endMinutes === null) continue;
    const room1 = (l1.room || '1-xona').toLowerCase().trim();

    for (let j = i + 1; j < lessons.length; j++) {
      const l2 = lessons[j];
      if (!l2 || l2.startMinutes === null || l2.endMinutes === null) continue;

      if (l1.dayKey !== l2.dayKey) continue;

      const room2 = (l2.room || '1-xona').toLowerCase().trim();
      if (room1 !== room2) continue;

      if (String(l1.groupId) === String(l2.groupId)) continue;

      const isOverlapping = l1.startMinutes < l2.endMinutes && l1.endMinutes > l2.startMinutes;
      if (isOverlapping) {
        conflictingGroupIds.add(l1.groupId);
        conflictingGroupIds.add(l2.groupId);
        conflictingLessonIds.add(l1.id);
        conflictingLessonIds.add(l2.id);

        const list1 = conflictsMap.get(l1.id) || [];
        list1.push(l2);
        conflictsMap.set(l1.id, list1);

        const list2 = conflictsMap.get(l2.id) || [];
        list2.push(l1);
        conflictsMap.set(l2.id, list2);

        conflictPairs.push({
          id: `conflict_${l1.id}_${l2.id}`,
          room: l1.room || '1-xona',
          dayKey: l1.dayKey,
          dayName: SCHEDULE_DAY_FULL_NAMES[l1.dayKey] || l1.dayKey,
          lessonA: l1,
          lessonB: l2,
        });
      }
    }
  }

  return {
    conflictPairs,
    conflictingGroupIds: Array.from(conflictingGroupIds),
    conflictingLessonIds: Array.from(conflictingLessonIds),
    conflictsMap,
  };
};

/**
 * Extracts all recurring weekly lesson items across teachers for central schedule view.
 */
export const extractAllTeacherLessons = (allTeachersData = {}) => {
  const lessons = [];
  const tIds = Array.from(new Set([...TEACHER_IDS, ...Object.keys(allTeachersData).filter((k) => k.startsWith('teacher'))]));

  tIds.forEach((tId) => {
    const tData = allTeachersData[tId];
    if (!tData) return;
    const groups = (tData.groups || []).filter((g) => g && !g.deleted);
    const students = (tData.students || []).filter((s) => s && !s.deleted);
    const teacherProfile = tData.teacherProfile || tData.profile || {};
    const teacherName = teacherProfile.fullName?.trim() || TEACHER_LABELS[tId] || tId;
    const teacherAvatar = teacherProfile.avatar || null;
    const teacherTitle = teacherProfile.title?.trim() || 'Ustoz';

    groups.forEach((g) => {
      const days = extractGroupDays(g);
      const times = extractGroupTimes(g);
      const room = (g.schedule?.room || '1-xona').trim();
      const groupStudents = students.filter((s) => String(s.groupId) === String(g.id));

      const startTimeStr = g.schedule?.startTime?.trim() || (times.startMinutes !== null ? formatMinutesToTime(times.startMinutes) : '00:00');
      const endTimeStr = g.schedule?.endTime?.trim() || (times.endMinutes !== null ? formatMinutesToTime(times.endMinutes) : '00:00');

      days.forEach((dayKey) => {
        lessons.push({
          id: `${tId}_${g.id}_${dayKey}`,
          groupId: g.id,
          groupName: g.name || 'Nomsiz guruh',
          groupCategory: g.category || 'Dasturlash',
          groupColor: g.color || '#3B82F6',
          groupIcon: g.icon || 'code',
          monthlyFee: g.monthlyFee,
          teacherId: tId,
          teacherName,
          teacherLabel: teacherName,
          teacherAvatar,
          teacherTitle,
          dayKey,
          startTime: startTimeStr,
          endTime: endTimeStr,
          startMinutes: times.startMinutes,
          endMinutes: times.endMinutes,
          durationMinutes: times.endMinutes !== null && times.startMinutes !== null ? Math.max(0, times.endMinutes - times.startMinutes) : 90,
          room: room || '1-xona',
          studentCount: groupStudents.length,
          students: groupStudents,
          group: g,
        });
      });
    });
  });

  return lessons;
};

/**
 * Calculates schedule and room occupancy KPIs across all teachers.
 */
export const calculateScheduleKpis = (allTeachersData = {}, conflictsCount = 0) => {
  let totalActiveGroups = 0;
  let totalWeeklyMinutes = 0;
  const uniqueRoomsSet = new Set();
  const allRoomsMap = new Map();

  DEFAULT_SCHEDULE_ROOMS.forEach((r) => {
    allRoomsMap.set(r.toLowerCase().trim(), r.trim());
  });

  const tIds = Array.from(new Set([...TEACHER_IDS, ...Object.keys(allTeachersData).filter((k) => k.startsWith('teacher'))]));

  tIds.forEach((tId) => {
    const tData = allTeachersData[tId];
    if (!tData) return;
    const groups = (tData.groups || []).filter((g) => g && !g.deleted);

    groups.forEach((g) => {
      totalActiveGroups++;
      const days = extractGroupDays(g);
      const times = extractGroupTimes(g);
      const rawRoom = (g.schedule?.room || '1-xona').trim();

      if (rawRoom) {
        const lowerRoom = rawRoom.toLowerCase();
        uniqueRoomsSet.add(lowerRoom);
        if (!allRoomsMap.has(lowerRoom)) {
          allRoomsMap.set(lowerRoom, rawRoom);
        }
      }

      const duration = times.endMinutes !== null && times.startMinutes !== null && times.endMinutes > times.startMinutes
        ? times.endMinutes - times.startMinutes
        : 90;

      totalWeeklyMinutes += duration * (days.length || 0);
    });
  });

  const totalWeeklyLessonHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10;
  const allRooms = Array.from(allRoomsMap.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return {
    totalActiveGroups,
    occupiedRoomsCount: uniqueRoomsSet.size,
    totalWeeklyLessonHours,
    conflictsCount,
    allRooms,
  };
};

/**
 * Pre-validates whether a candidate group schedule will conflict with any existing lesson.
 */
export const checkCandidateConflict = (candidate, existingLessons = [], excludeGroupId = null) => {
  if (!candidate || !candidate.room || !candidate.startTime || !candidate.endTime || !Array.isArray(candidate.days)) {
    return { hasConflict: false, conflictingLesson: null };
  }

  const startMin = parseTimeToMinutes(candidate.startTime);
  const endMin = parseTimeToMinutes(candidate.endTime);
  if (startMin === null || endMin === null) {
    return { hasConflict: false, conflictingLesson: null };
  }

  if (startMin >= endMin) {
    return { hasConflict: false, conflictingLesson: null, isInvalidTime: true };
  }

  const normCandidateRoom = candidate.room.toLowerCase().trim();

  for (const l of existingLessons) {
    if (!l) continue;
    if (excludeGroupId && String(l.groupId) === String(excludeGroupId)) continue;
    if (!candidate.days.includes(l.dayKey)) continue;

    const normLessonRoom = (l.room || '1-xona').toLowerCase().trim();
    if (normCandidateRoom !== normLessonRoom) continue;

    if (l.startMinutes === null || l.endMinutes === null) continue;

    const isOverlapping = startMin < l.endMinutes && endMin > l.startMinutes;
    if (isOverlapping) {
      return {
        hasConflict: true,
        conflictingLesson: l,
      };
    }
  }

  return { hasConflict: false, conflictingLesson: null };
};



