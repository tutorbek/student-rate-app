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
  if (!lessonDateStr || !student) return true;
  const cleanDate = lessonDateStr.slice(0, 10);
  const currentGroupId = student.groupId;
  const currentJoinDate = (student.joinedGroupAt || student.createdAt || '').slice(0, 10);
  const studentCreatedAt = (student.createdAt || '').slice(0, 10);

  // If no specific groupId is specified, or groupId matches student's current group:
  if (!groupId || groupId === currentGroupId) {
    // If student was created after this date, they couldn't be in the school
    if (studentCreatedAt && cleanDate < studentCreatedAt) {
      return false;
    }
    // Must be on or after they joined this current group
    if (currentJoinDate && cleanDate < currentJoinDate) {
      return false;
    }
    return true;
  }

  // The lesson is for a DIFFERENT group (student may have been in groupId before transferring)
  // 1. Check groupHistory if available
  if (Array.isArray(student.groupHistory) && student.groupHistory.length > 0) {
    const historyEntry = student.groupHistory.find(h => h.groupId === groupId);
    if (historyEntry) {
      const joinStr = (historyEntry.joinedAt || '').slice(0, 10);
      const leftStr = (historyEntry.leftAt || '').slice(0, 10);
      if (joinStr && cleanDate < joinStr) return false;
      if (leftStr && cleanDate > leftStr) return false;
      return true;
    }
  }

  // 2. Fallback for legacy transferred students without groupHistory:
  // If the lesson date is before they joined their current group,
  // and on or after their creation date, they were in their previous group.
  if (currentJoinDate && cleanDate < currentJoinDate) {
    if (studentCreatedAt && cleanDate < studentCreatedAt) {
      return false;
    }
    return true;
  }

  return false;
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

  const cleanDate = (rec.date || '').slice(0, 10);
  const recordedIds = Object.keys(rec.records);

  // Student lookup map
  const studentMap = new Map();
  (students || []).forEach(s => {
    if (s && s.id) studentMap.set(s.id, s);
  });
  (groupStudents || []).forEach(s => {
    if (s && s.id) studentMap.set(s.id, s);
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

    const student = studentMap.get(sId);
    if (student) {
      // If lesson took place before student joined group, ignore completely
      if (!isStudentInGroupAtDate(student, cleanDate, rec.groupId)) {
        return;
      }
    }

    effectiveRecords[sId] = status;
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'late') late++;
    else if (status === 'excused') excused++;

    const studentObj = student || { id: sId, name: 'Noma\'lum o\'quvchi', emoji: '👤', color: '#9CA3AF' };
    studentsList.push(studentObj);

    studentDetails.push({
      id: sId,
      name: studentObj.name,
      emoji: studentObj.emoji,
      color: studentObj.color,
      status,
      student: studentObj
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
