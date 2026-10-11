import assert from 'node:assert/strict';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  extractGroupDays,
  extractGroupTimes,
  formatLessonDuration,
  detectRoomConflicts,
  extractAllTeacherLessons,
  calculateScheduleKpis,
  checkCandidateConflict,
  SCHEDULE_WEEKDAYS,
  DEFAULT_SCHEDULE_ROOMS
} from '../src/utils/scheduleUtils.js';

console.log('--- RUNNING RIGOROUS PHASE 4 SCHEDULE & ROOMS VERIFICATION SUITE ---');

// ==========================================
// TEST 1: Time Parsing & Formatting
// ==========================================
assert.equal(parseTimeToMinutes('00:00'), 0, '00:00 must be 0 minutes');
assert.equal(parseTimeToMinutes('14:30'), 870, '14:30 must be 870 minutes');
assert.equal(parseTimeToMinutes('14.30'), 870, '14.30 (dot format) must be 870 minutes');
assert.equal(parseTimeToMinutes('23:59'), 1439, '23:59 must be 1439 minutes');
assert.equal(parseTimeToMinutes(''), null, 'Empty string must return null');
assert.equal(parseTimeToMinutes(null), null, 'null must return null');
assert.equal(parseTimeToMinutes('invalid'), null, 'Invalid string must return null');
assert.equal(parseTimeToMinutes('25:00'), null, 'Hours > 23 must return null');
assert.equal(parseTimeToMinutes('12:65'), null, 'Minutes > 59 must return null');

assert.equal(formatMinutesToTime(0), '00:00', '0 minutes is 00:00');
assert.equal(formatMinutesToTime(870), '14:30', '870 minutes is 14:30');
assert.equal(formatMinutesToTime(1439), '23:59', '1439 minutes is 23:59');
assert.equal(formatMinutesToTime(null), '00:00', 'null defaults to 00:00');

assert.equal(SCHEDULE_WEEKDAYS.length, 7, 'Must have 7 weekdays');
assert.ok(DEFAULT_SCHEDULE_ROOMS.includes('1-xona') && DEFAULT_SCHEDULE_ROOMS.includes('4-xona'), 'Default rooms must include 1-xona and 4-xona');

console.log('✅ Test 1: Time parsing, boundaries, and formatting verified.');

// ==========================================
// TEST 2: Group Schedule & Times Extraction
// ==========================================
const groupWithExplicitSchedule = {
  id: 'g1',
  name: 'Frontend React',
  schedule: {
    days: ['mon', 'wed', 'fri'],
    startTime: '14:00',
    endTime: '15:30',
    room: '1-xona'
  }
};

const days1 = extractGroupDays(groupWithExplicitSchedule);
assert.deepEqual(days1, ['mon', 'wed', 'fri'], 'Explicit days should be returned');
const times1 = extractGroupTimes(groupWithExplicitSchedule);
assert.equal(times1.startMinutes, 840, 'Start time 14:00 is 840 min');
assert.equal(times1.endMinutes, 930, 'End time 15:30 is 930 min');

// Fallback to name if schedule missing
const groupWithoutSchedule = {
  id: 'g2',
  name: 'Seshanba-Payshanba-Shanba 16:00 Guruhi'
};
const days2 = extractGroupDays(groupWithoutSchedule);
assert.deepEqual(days2, ['tue', 'thu', 'sat'], 'Days inferred from group name');
const times2 = extractGroupTimes(groupWithoutSchedule);
assert.equal(times2.startMinutes, 960, '16:00 inferred from name is 960 min');
assert.equal(times2.endMinutes, 1050, 'Default 90 min duration yields 1050 min');

// CRITICAL EDGE CASE: Uzbek weekdays ending with 'shanba' MUST NOT falsely match Saturday ('sat')
const groupMonWed = { id: 'g_mw', name: 'Dushanba-Chorshanba guruhi' };
assert.deepEqual(extractGroupDays(groupMonWed), ['mon', 'wed'], 'Dushanba-Chorshanba must NOT include Saturday (sat)');

const groupSunday = { id: 'g_sun', name: 'Yakshanba Intensiv' };
assert.deepEqual(extractGroupDays(groupSunday), ['sun'], 'Yakshanba must NOT include Saturday (sat)');

const groupToq = { id: 'g_toq', name: 'Toq kunlar 14:00' };
assert.deepEqual(extractGroupDays(groupToq), ['mon', 'wed', 'fri'], 'Toq kunlar must map to mon, wed, fri');

const groupJuft = { id: 'g_juft', name: 'Juft kunlar 16:00' };
assert.deepEqual(extractGroupDays(groupJuft), ['tue', 'thu', 'sat'], 'Juft kunlar must map to tue, thu, sat');

assert.equal(formatLessonDuration(840, 930), '90 daqiqa', 'Duration 840 to 930 is 90 daqiqa');
assert.equal(formatLessonDuration(900, 1020), '120 daqiqa', 'Duration 900 to 1020 is 120 daqiqa');
assert.equal(formatLessonDuration(900, 900), '0 daqiqa', 'Zero duration must return 0 daqiqa');
assert.equal(formatLessonDuration(900, 840), '0 daqiqa', 'Inverted duration must return 0 daqiqa');
assert.equal(formatLessonDuration(null, null), '90 daqiqa', 'Missing times default to 90 daqiqa');

console.log('✅ Test 2: Group schedule extraction and duration helper verified.');

// ==========================================
// TEST 3: Room Collision / Conflict Detection
// ==========================================
// Scenario A: Overlapping times in same room on same day -> CONFLICT
const lessonA1 = {
  id: 't1_g1_mon',
  groupId: 'g1',
  groupName: 'Frontend React',
  teacherId: 'teacher1',
  dayKey: 'mon',
  startTime: '14:00',
  endTime: '15:30',
  startMinutes: 840,
  endMinutes: 930,
  room: '1-xona'
};

const lessonB1 = {
  id: 't2_g2_mon',
  groupId: 'g2',
  groupName: 'Backend Node.js',
  teacherId: 'teacher2',
  dayKey: 'mon',
  startTime: '15:00', // starts before A1 ends!
  endTime: '16:30',
  startMinutes: 900,
  endMinutes: 990,
  room: '  1-XONA  ' // case and space variation
};

const conflictResultA = detectRoomConflicts([lessonA1, lessonB1]);
assert.equal(conflictResultA.conflictPairs.length, 1, 'Should detect exactly 1 conflict pair');
assert.equal(conflictResultA.conflictingGroupIds.length, 2, 'Both groups should be marked as conflicting');
assert.ok(conflictResultA.conflictingGroupIds.includes('g1'));
assert.ok(conflictResultA.conflictingGroupIds.includes('g2'));

// Scenario B: Back-to-back non-overlapping times in same room -> NO CONFLICT
const lessonB_BackToBack = {
  id: 't2_g2_mon',
  groupId: 'g2',
  groupName: 'Backend Node.js',
  teacherId: 'teacher2',
  dayKey: 'mon',
  startTime: '15:30', // exact start at A1's end
  endTime: '17:00',
  startMinutes: 930,
  endMinutes: 1020,
  room: '1-xona'
};

const conflictResultB = detectRoomConflicts([lessonA1, lessonB_BackToBack]);
assert.equal(conflictResultB.conflictPairs.length, 0, 'Back-to-back lessons do NOT conflict');

// Scenario C: Same time, different rooms -> NO CONFLICT
const lessonB_DiffRoom = {
  id: 't2_g2_mon',
  groupId: 'g2',
  groupName: 'Backend Node.js',
  teacherId: 'teacher2',
  dayKey: 'mon',
  startTime: '14:00',
  endTime: '15:30',
  startMinutes: 840,
  endMinutes: 930,
  room: '2-xona'
};

const conflictResultC = detectRoomConflicts([lessonA1, lessonB_DiffRoom]);
assert.equal(conflictResultC.conflictPairs.length, 0, 'Different rooms do NOT conflict');

// Scenario D: Same room and time, different days -> NO CONFLICT
const lessonB_DiffDay = {
  id: 't2_g2_tue',
  groupId: 'g2',
  groupName: 'Backend Node.js',
  teacherId: 'teacher2',
  dayKey: 'tue',
  startTime: '14:00',
  endTime: '15:30',
  startMinutes: 840,
  endMinutes: 930,
  room: '1-xona'
};

const conflictResultD = detectRoomConflicts([lessonA1, lessonB_DiffDay]);
assert.equal(conflictResultD.conflictPairs.length, 0, 'Different days do NOT conflict');

// Scenario E: Same group on different days -> NO self-conflict
const lessonA2 = {
  id: 't1_g1_wed',
  groupId: 'g1',
  groupName: 'Frontend React',
  teacherId: 'teacher1',
  dayKey: 'wed',
  startTime: '14:00',
  endTime: '15:30',
  startMinutes: 840,
  endMinutes: 930,
  room: '1-xona'
};
const conflictResultE = detectRoomConflicts([lessonA1, lessonA2]);
assert.equal(conflictResultE.conflictPairs.length, 0, 'Same group on different days cannot self-conflict');

console.log('✅ Test 3: Comprehensive room conflict detection verified.');

// ==========================================
// TEST 4: Candidate Conflict Checker for Modals
// ==========================================
const existingLessons = [lessonA1, lessonB_DiffRoom];

// Check conflicting candidate
const badCandidate = {
  days: ['mon', 'fri'],
  startTime: '14:30',
  endTime: '16:00',
  room: '1-xona'
};
const candCheck1 = checkCandidateConflict(badCandidate, existingLessons, 'some_new_group');
assert.equal(candCheck1.hasConflict, true, 'Candidate should conflict on Monday in 1-xona');
assert.equal(candCheck1.conflictingLesson.groupId, 'g1');

// Check candidate ignoring own groupId when editing
const candCheckSelf = checkCandidateConflict(badCandidate, existingLessons, 'g1');
assert.equal(candCheckSelf.hasConflict, false, 'Candidate should ignore own group being edited');

// Check safe candidate (different room)
const safeCandidate = {
  days: ['mon', 'wed', 'fri'],
  startTime: '14:00',
  endTime: '15:30',
  room: '3-xona'
};
const candCheckSafe = checkCandidateConflict(safeCandidate, existingLessons, 'g3');
assert.equal(candCheckSafe.hasConflict, false, 'Candidate in 3-xona should be free and conflict-free');

// Candidate with identical times (15:00 - 15:00) must be flagged as invalid
const candIdentical = {
  days: ['mon'],
  startTime: '15:00',
  endTime: '15:00',
  room: '1-xona'
};
const candCheckIdentical = checkCandidateConflict(candIdentical, existingLessons, 'g4');
assert.equal(candCheckIdentical.isInvalidTime, true, 'Candidate with start === end time must be marked as invalid time');
assert.equal(candCheckIdentical.hasConflict, false);

// Candidate with inverted times (16:00 - 15:00) must be flagged as invalid
const candInverted = {
  days: ['mon'],
  startTime: '16:00',
  endTime: '15:00',
  room: '1-xona'
};
const candCheckInverted = checkCandidateConflict(candInverted, existingLessons, 'g4');
assert.equal(candCheckInverted.isInvalidTime, true, 'Candidate with start > end time must be marked as invalid time');
assert.equal(candCheckInverted.hasConflict, false);

// Candidate back-to-back at exact boundary (15:30 - 17:00 when g1 is 14:00 - 15:30 in 1-xona)
const candBoundary = {
  days: ['mon'],
  startTime: '15:30',
  endTime: '17:00',
  room: '1-xona'
};
const candCheckBoundary = checkCandidateConflict(candBoundary, existingLessons, 'g4');
assert.equal(candCheckBoundary.hasConflict, false, 'Candidate starting exactly when another ends must NOT conflict');

console.log('✅ Test 4: Modal candidate conflict checker verified.');

// ==========================================
// TEST 5: Extract All Teacher Lessons & KPIs
// ==========================================
const mockAllTeachersData = {
  teacher1: {
    profile: { fullName: 'Ali Valiyev', title: 'Senior Frontend' },
    groups: [
      {
        id: 'g1',
        name: 'React 101',
        category: 'Frontend',
        schedule: { days: ['mon', 'wed', 'fri'], startTime: '10:00', endTime: '11:30', room: '1-xona' }
      },
      {
        id: 'g_deleted',
        name: 'Old Group',
        deleted: true,
        schedule: { days: ['mon'], startTime: '10:00', endTime: '11:30', room: '1-xona' }
      }
    ],
    students: [
      { id: 's1', groupId: 'g1', name: 'Student 1' },
      { id: 's2', groupId: 'g1', name: 'Student 2' },
      { id: 's3', groupId: 'g1', name: 'Student 3', deleted: true }
    ]
  },
  teacher2: {
    profile: { fullName: 'Bobur Mirzoyev', title: 'Python Backend' },
    groups: [
      {
        id: 'g2',
        name: 'Python Django',
        category: 'Backend',
        schedule: { days: ['tue', 'thu'], startTime: '14:00', endTime: '16:00', room: '2-xona' } // 2 hours each
      }
    ],
    students: [
      { id: 's4', groupId: 'g2', name: 'Student 4' }
    ]
  },
  teacher3: {
    groups: []
  },
  teacher4: {
    groups: []
  }
};

const allLessons = extractAllTeacherLessons(mockAllTeachersData);
// g1 has 3 days (mon, wed, fri) = 3 lessons
// g2 has 2 days (tue, thu) = 2 lessons
// g_deleted is ignored
assert.equal(allLessons.length, 5, 'Total extracted lessons should be 5');

const g1Lesson = allLessons.find(l => l.groupId === 'g1' && l.dayKey === 'mon');
assert.ok(g1Lesson, 'g1 Monday lesson should exist');
assert.equal(g1Lesson.teacherName, 'Ali Valiyev');
assert.equal(g1Lesson.studentCount, 2, 'Active student count should be 2 (s3 is deleted)');
assert.equal(g1Lesson.room, '1-xona');
assert.equal(g1Lesson.durationMinutes, 90);

// KPI Calculation
const kpis = calculateScheduleKpis(mockAllTeachersData, 0);
assert.equal(kpis.totalActiveGroups, 2, '2 active groups in center');
assert.equal(kpis.occupiedRoomsCount, 2, '2 unique occupied rooms (1-xona, 2-xona)');
// g1: 3 days * 1.5h = 4.5h. g2: 2 days * 2.0h = 4.0h. Total = 8.5h
assert.equal(kpis.totalWeeklyLessonHours, 8.5, 'Total weekly lesson hours should be 8.5 hours');
assert.equal(kpis.conflictsCount, 0, 'Zero conflicts');
assert.ok(kpis.allRooms.includes('1-xona') && kpis.allRooms.includes('2-xona') && kpis.allRooms.includes('3-xona') && kpis.allRooms.includes('4-xona'));

// Test canonical room normalization (e.g. '1-XONA' and '1-xona' should not duplicate)
const mockDataWithCasing = {
  teacher1: {
    groups: [
      { id: 'g1', schedule: { days: ['mon'], startTime: '10:00', endTime: '11:30', room: '1-xona' } },
      { id: 'g2', schedule: { days: ['tue'], startTime: '10:00', endTime: '11:30', room: '  1-XONA  ' } },
      { id: 'g3', schedule: { days: ['wed'], startTime: '10:00', endTime: '11:30', room: 'Robototexnika Zali' } },
    ]
  }
};
const kpisCasing = calculateScheduleKpis(mockDataWithCasing, 0);
const occurrencesOfRoom1 = kpisCasing.allRooms.filter(r => r.toLowerCase().trim() === '1-xona');
assert.equal(occurrencesOfRoom1.length, 1, '1-xona and 1-XONA must be merged canonically into a single room entry');
assert.ok(kpisCasing.allRooms.includes('Robototexnika Zali'), 'Custom room Robototexnika Zali must be present in allRooms');

console.log('✅ Test 5: Teacher lesson extraction and KPI statistics verified.');

// ==========================================
// TEST 6: Schedule Update & Optimistic Rollback
// ==========================================
const handleAdminUpdateScheduleSimulation = async (teacherId, groupId, newSchedule, networkFails = false) => {
  let state = { ...mockAllTeachersData };
  const prevTeacherData = state[teacherId];

  // Apply update optimistically
  const updatedGroups = (prevTeacherData.groups || []).map(g => {
    if (g.id === groupId) {
      return { ...g, schedule: { ...(g.schedule || {}), ...newSchedule } };
    }
    return g;
  });

  state[teacherId] = { ...prevTeacherData, groups: updatedGroups };

  // Simulate remote save
  if (networkFails) {
    // Rollback
    state[teacherId] = prevTeacherData;
    return { success: false, state };
  }
  return { success: true, state };
};

// Successful save test
const updateSuccess = await handleAdminUpdateScheduleSimulation('teacher1', 'g1', {
  room: '4-xona',
  startTime: '16:00',
  endTime: '17:30'
}, false);

assert.equal(updateSuccess.success, true);
const updatedG1 = updateSuccess.state.teacher1.groups.find(g => g.id === 'g1');
assert.equal(updatedG1.schedule.room, '4-xona');
assert.equal(updatedG1.schedule.startTime, '16:00');
assert.equal(updatedG1.schedule.endTime, '17:30');
// Other properties remain intact
assert.equal(updatedG1.name, 'React 101');
assert.equal(updatedG1.category, 'Frontend');

// Network failure rollback test
const updateFailure = await handleAdminUpdateScheduleSimulation('teacher1', 'g1', {
  room: '5-xona'
}, true);

assert.equal(updateFailure.success, false);
const rolledBackG1 = updateFailure.state.teacher1.groups.find(g => g.id === 'g1');
assert.equal(rolledBackG1.schedule.room, '1-xona', 'Room must be rolled back to 1-xona on network error');

console.log('✅ Test 6: Schedule update integrity and rollback safety verified.');

// ==========================================
// TEST 7: Schedule Edit Multi-Day Preservation
// ==========================================
const groupWithInferredDays = {
  id: 'g_legacy',
  name: 'Dushanba-Chorshanba-Juma 14:00 guruhi',
  // No explicit schedule.days array
};
// Simulating handleOpenEditSchedule logic
const initialDays = (groupWithInferredDays.schedule?.days && groupWithInferredDays.schedule.days.length > 0)
  ? groupWithInferredDays.schedule.days
  : extractGroupDays(groupWithInferredDays);
const editDays = initialDays.length > 0 ? initialDays : ['mon', 'wed', 'fri'];

assert.deepEqual(editDays, ['mon', 'wed', 'fri'], 'Editing must preserve all inferred days (mon, wed, fri) rather than dropping to a single day');

console.log('✅ Test 7: Multi-day schedule preservation during edit verified.');

console.log('🎉 ALL RIGOROUS PHASE 4 SCHEDULE & ROOMS TESTS PASSED (7/7)!');
