/**
 * src/utils/attendanceUtils.js
 * 
 * Centralized attendance calculation module used by both Teacher (Attendance.jsx)
 * and Admin (AdminAttendance.jsx, AdminGroups.jsx, AdminDashboard.jsx).
 */

/**
 * Returns student join date in 'YYYY-MM-DD' format.
 */
export function getStudentJoinDate(student) {
  if (!student) return '';
  return (student.joinedGroupAt || student.createdAt || '').slice(0, 10);
}

/**
 * Checks if a student was a member of a group on a given lesson date.
 * Supports transferred students by verifying groupHistory or previous group timelines.
 * 
 * @param {Object} student - student object
 * @param {string} lessonDateStr - date of the lesson (YYYY-MM-DD)
 * @param {string} [groupId] - ID of the group the lesson belongs to (optional)
 * @returns {boolean}
 */
export function isStudentInGroupAtDate(student, lessonDateStr, groupId = null) {
  if (!student) return false;

  const cleanDate = (lessonDateStr || '').slice(0, 10);
  const currentGroupId = student.groupId;
  const targetGroupId = groupId || currentGroupId;

  // If checking for a different group than student's current group, student is not in it
  if (targetGroupId !== currentGroupId) {
    return false;
  }

  // Determine earliest enrollment date in school
  let earliestDate = (student.createdAt || '').slice(0, 10);
  if (Array.isArray(student.groupHistory) && student.groupHistory.length > 0) {
    student.groupHistory.forEach((h) => {
      const hJoin = (h.joinedAt || '').slice(0, 10);
      if (hJoin && (!earliestDate || hJoin < earliestDate)) {
        earliestDate = hJoin;
      }
    });
  }

  // Before student joined the school -> false
  if (earliestDate && cleanDate < earliestDate) {
    return false;
  }

  // If student was soft deleted and lesson date is after deletion -> false
  if (student.deleted && student.deletedAt && cleanDate > student.deletedAt.slice(0, 10)) {
    return false;
  }

  return true;
}

/**
 * Checks if a student was enrolled in a group during a specified calendar month.
 * Useful for monthly journals to prevent future students from cluttering past registers.
 * 
 * @param {Object} student
 * @param {string} groupId
 * @param {number} year
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @returns {boolean}
 */
export function wasStudentInGroupDuringMonth(student, groupId, year, month) {
  if (!student || !groupId) return false;
  if (student.groupId !== groupId) return false;

  const m = String(month + 1).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;

  let earliestDate = (student.createdAt || '').slice(0, 10);
  if (Array.isArray(student.groupHistory) && student.groupHistory.length > 0) {
    student.groupHistory.forEach((h) => {
      const hJoin = (h.joinedAt || '').slice(0, 10);
      if (hJoin && (!earliestDate || hJoin < earliestDate)) {
        earliestDate = hJoin;
      }
    });
  }

  // If student was only created in a future month (relative to monthEnd):
  if (earliestDate && earliestDate > monthEnd) {
    return false;
  }

  return true;
}

/**
 * Calculates attendance rate percentage according to the formula:
 * Rate = (present + late * 0.5) / (present + absent + late) * 100
 * Excused absences do not penalize the rate.
 * Returns 0 if empty/no marked accountable lessons (or 100 if only excused).
 */
export function calculateAttendanceRate(present = 0, absent = 0, late = 0, totalMarked = 0, excused = 0) {
  const accountable = present + absent + late;
  if (accountable > 0) {
    return Math.round(((present + late * 0.5) / accountable) * 100);
  }
  return (totalMarked > 0 || excused > 0) ? 100 : 0;
}

/**
 * Calculates attendance breakdown for a single lesson session.
 * Excludes students who joined the group after the lesson date (rec.date < studentJoinDate).
 * 
 * @param {Object} rec - attendance record { date, groupId, records }
 * @param {Array} students - all students or group students
 * @param {Array} [groupStudents] - optional current group students
 * @returns {Object} breakdown object
 */
export function calculateSessionAttendance(rec, students = [], groupStudents = []) {
  if (!rec || !rec.records) {
    return {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      totalMarked: 0,
      accountable: 0,
      rate: 0,
      studentDetails: [],
      effectiveRecords: {},
      studentsList: []
    };
  }

  const recordedIds = Object.keys(rec.records);

  // Student lookup map
  const studentMap = new Map();
  (students || []).forEach(s => {
    if (s && s.id !== undefined && s.id !== null) studentMap.set(String(s.id), s);
  });
  (groupStudents || []).forEach(s => {
    if (s && s.id !== undefined && s.id !== null) studentMap.set(String(s.id), s);
  });

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  const studentDetails = [];
  const effectiveRecords = {};
  const studentsList = [];

  recordedIds.forEach(sId => {
    const status = rec.records[sId];
    if (status !== 'present' && status !== 'absent' && status !== 'late' && status !== 'excused') {
      return;
    }

    const student = studentMap.get(String(sId));
    // If student does not exist, is deleted, or was not in this group on this date:
    // Exclude from this group's session!
    if (!student || student.deleted) {
      return;
    }
    if (!isStudentInGroupAtDate(student, rec.date, rec.groupId)) {
      return;
    }

    effectiveRecords[sId] = status;
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'late') late++;
    else if (status === 'excused') excused++;

    studentsList.push(student);

    studentDetails.push({
      id: sId,
      name: student.name,
      emoji: student.emoji,
      color: student.color,
      status,
      student
    });
  });

  const totalMarked = studentDetails.length;
  const accountable = present + absent + late;
  const rate = calculateAttendanceRate(present, absent, late, totalMarked, excused);

  return {
    present,
    absent,
    late,
    excused,
    totalMarked,
    accountable,
    rate,
    studentDetails: studentDetails.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
    effectiveRecords,
    studentsList
  };
}

/**
 * Calculates a single student's attendance stats across group attendance records.
 * Automatically respects student join date and group history.
 * If groupId is null, aggregates across all groups the student was a member of.
 */
export function calculateStudentAttendanceStats(student, attendanceRecords = [], groupId = null) {
  if (!student) {
    return {
      student: null,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      totalLessons: 0,
      accountableLessons: 0,
      rate: 0,
      fairScore: 0
    };
  }

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let totalLessons = 0;

  attendanceRecords.forEach(att => {
    if (groupId && att.groupId !== groupId) return;
    if (!att || !att.records) return;
    const attDate = (att.date || '').slice(0, 10);
    if (!isStudentInGroupAtDate(student, attDate, att.groupId)) return;

    const st = att.records[student.id];
    if (st === 'present' || st === 'absent' || st === 'late' || st === 'excused') {
      totalLessons++;
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'late') lateCount++;
      else if (st === 'excused') excusedCount++;
    }
  });

  const accountableLessons = presentCount + absentCount + lateCount;
  const calculatedPresents = presentCount + lateCount * 0.5;
  const rate = accountableLessons > 0
    ? Math.round((calculatedPresents / accountableLessons) * 100)
    : (totalLessons > 0 ? 100 : 0);

  const fairScore = calculateFairAttendanceScore(
    presentCount,
    absentCount,
    lateCount,
    totalLessons,
    excusedCount
  );

  return {
    student,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    totalLessons,
    accountableLessons,
    rate,
    fairScore
  };
}

/**
 * Calculates a fair attendance rating score (Bayesian smoothed score)
 * that balances attendance percentage with the number of lessons attended.
 * Prevents a 1-lesson student (1/1 = 100%) from unfairly outranking an exemplary
 * student who attended 19 out of 20 lessons (95%).
 * 
 * @param {number} presentCount
 * @param {number} absentCount
 * @param {number} lateCount
 * @param {number} totalLessons
 * @param {number} [excusedCount=0]
 * @returns {number} Score between 0 and 100 (rounded to 2 decimals)
 */
export function calculateFairAttendanceScore(presentCount = 0, absentCount = 0, lateCount = 0, totalLessons = 0, excusedCount = 0) {
  const accountableLessons = presentCount + absentCount + lateCount;
  if (totalLessons === 0) return 0;
  if (accountableLessons === 0) {
    return excusedCount > 0 ? 70 : 0;
  }
  const calculatedPresents = presentCount + lateCount * 0.5;
  const K = 3;
  const priorRate = 0.70;
  const fairScore = ((calculatedPresents + K * priorRate) / (accountableLessons + K)) * 100;
  return Math.round(fairScore * 100) / 100;
}

/**
 * Calculates weighted group attendance metrics across sessions/records.
 * Eliminates Simpson's Paradox by weighting actual accountable lessons.
 */
export function calculateWeightedAttendanceMetrics(sessions = []) {
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalExcused = 0;

  sessions.forEach(s => {
    totalPresent += (s.present || 0);
    totalAbsent += (s.absent || 0);
    totalLate += (s.late || 0);
    totalExcused += (s.excused || 0);
  });

  const totalMarked = totalPresent + totalAbsent + totalLate + totalExcused;
  const accountable = totalPresent + totalAbsent + totalLate;
  const avgRate = calculateAttendanceRate(totalPresent, totalAbsent, totalLate, totalMarked, totalExcused);

  return {
    totalSessions: sessions.length,
    totalPresent,
    totalAbsent,
    totalLate,
    totalExcused,
    totalMarked,
    accountable,
    avgRate
  };
}
