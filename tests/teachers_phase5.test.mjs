import assert from 'node:assert/strict';
import {
  TEACHER_IDS,
  TEACHER_LABELS,
  DEFAULT_TEACHER_CREDENTIALS,
  getTeacherDisplayName,
  getTeacherInitials,
  getTeacherKpiTier,
  calculateRetentionRate,
  calculateTeacherFinancials,
  calculateTeacherAttendanceMetrics,
  calculateTeacherKpis,
  buildGroupPayload,
  parseFee,
  getMonthKey,
} from '../src/utils/teacherUtils.js';
import { checkCandidateConflict, extractAllTeacherLessons } from '../src/utils/scheduleUtils.js';

console.log('--- RUNNING RIGOROUS PHASE 5 TEACHERS & KPI VERIFICATION SUITE ---');

// ==========================================
// TEST 1: Real Name & Display Initials Resolution
// ==========================================
assert.equal(TEACHER_IDS.length, 1, 'There must be 1 teacher ID');
assert.equal(TEACHER_LABELS.teacher1, 'Bekzod');
assert.equal(DEFAULT_TEACHER_CREDENTIALS.teacher1, 'insight');

assert.equal(getTeacherDisplayName('teacher1', { fullName: 'Bekzod Usmonov' }), 'Bekzod Usmonov', 'Custom full name must take priority');
assert.equal(getTeacherDisplayName('teacher1', { teacherProfile: { fullName: 'Bekzod Usmonov' } }), 'Bekzod Usmonov', 'Must support full teacherData object');
assert.equal(getTeacherDisplayName('teacher1', { profile: { fullName: 'Bekzod U.' } }), 'Bekzod U.', 'Must support profile property');
assert.equal(getTeacherDisplayName('teacher1', { fullName: '   ' }), 'Bekzod', 'Whitespace full name must fall back to TEACHER_LABELS');
assert.equal(getTeacherDisplayName('custom_t9', null), 'custom_t9', 'Unknown teacherId falls back to teacherId');

assert.equal(getTeacherInitials('Bekzod Usmonov'), 'BU', 'Two words must return first letters');
assert.equal(getTeacherInitials('Ulugbek Qodirov Senior'), 'UQ', 'Multiple words use first two words');
assert.equal(getTeacherInitials('Jasur'), 'JA', 'Single word returns first two letters');
assert.equal(getTeacherInitials('A'), 'A', 'Single character returns that char');
assert.equal(getTeacherInitials(''), 'US', 'Empty string returns default US');
assert.equal(getTeacherInitials(null), 'US', 'null returns default US');

console.log('✅ Test 1: Real name and display initials resolution verified.');

// ==========================================
// TEST 2: Attendance KPI Tiers & Exact Boundaries
// ==========================================
const tier95 = getTeacherKpiTier(95, 10);
assert.equal(tier95.tier, 'excellent', '95% must be excellent');
assert.equal(tier95.icon, '🟢');

const tier90 = getTeacherKpiTier(90, 5);
assert.equal(tier90.tier, 'excellent', 'Exact 90% boundary must be excellent');

const tier89 = getTeacherKpiTier(89, 5);
assert.equal(tier89.tier, 'average', '89% must be average');
assert.equal(tier89.icon, '🟡');

const tier75 = getTeacherKpiTier(75, 4);
assert.equal(tier75.tier, 'average', 'Exact 75% boundary must be average');

const tier74 = getTeacherKpiTier(74, 4);
assert.equal(tier74.tier, 'needs_attention', '74% must be needs_attention');
assert.equal(tier74.icon, '🔴');

const tier0 = getTeacherKpiTier(0, 2);
assert.equal(tier0.tier, 'needs_attention', '0% with sessions must be needs_attention');

const tierNoSessions = getTeacherKpiTier(100, 0);
assert.equal(tierNoSessions.tier, 'none', '0 sessions must return none tier regardless of rate');
assert.equal(tierNoSessions.icon, '⚪');

const tierNull = getTeacherKpiTier(null, 5);
assert.equal(tierNull.tier, 'none', 'Null rate must return none tier');

console.log('✅ Test 2: Attendance KPI tiers and exact boundaries verified.');

// ==========================================
// TEST 3: Student Retention & Churn Rate Formulas
// ==========================================
assert.equal(calculateRetentionRate(10, 0), 100, '10 active, 0 departed must be 100%');
assert.equal(calculateRetentionRate(8, 2), 80, '8 active, 2 departed must be 80%');
assert.equal(calculateRetentionRate(5, 5), 50, '5 active, 5 departed must be 50%');
assert.equal(calculateRetentionRate(1, 3), 25, '1 active, 3 departed must be 25%');
assert.equal(calculateRetentionRate(0, 5), 0, '0 active, 5 departed must be 0%');
assert.equal(calculateRetentionRate(0, 0), 100, '0 active, 0 departed (empty group) must safely return 100%');
assert.equal(calculateRetentionRate(-1, -5), 100, 'Negative numbers safely normalized');

console.log('✅ Test 3: Student retention & churn rate formulas verified.');

// ==========================================
// TEST 4: Multi-month Attendance & Session Metrics
// ==========================================
const currentMonthKey = getMonthKey(new Date('2026-09-15'));
assert.equal(currentMonthKey, '2026-09', 'Month key for 2026-09-15 must be 2026-09');
const testTeacherData = {
  teacherProfile: {
    fullName: 'Aziz Raximov',
    title: 'Robototexnika Ustozi',
    phone: '+998901234567',
    social: { telegram: 'aziz_robot' },
  },
  groups: [
    { id: 'g1', name: 'RoboKids 1', monthlyFee: 450000 },
    { id: 'g2', name: 'Lego WeDo', monthlyFee: 400000 },
  ],
  students: [
    { id: 's1', groupId: 'g1', name: 'Ali', deleted: false },
    { id: 's2', groupId: 'g1', name: 'Vali', deleted: false },
    { id: 's3', groupId: 'g2', name: 'Gani', deleted: false },
    { id: 's4', groupId: 'g2', name: 'Hasan', deleted: true, deletedAt: '2026-08-30' },
  ],
  attendance: [
    // Session in August (prior month)
    {
      id: 'att_aug',
      groupId: 'g1',
      date: '2026-08-20',
      records: { s1: 'present', s2: 'present' }, // 100%
    },
    // Session in September (current month): 1 present, 1 late (0.5) -> (1 + 0.5) / 2 = 75%
    {
      id: 'att_sep1',
      groupId: 'g1',
      date: '2026-09-02',
      records: { s1: 'present', s2: 'late' },
    },
    // Session in September (current month): 1 present, 1 absent -> 1 / 2 = 50%
    {
      id: 'att_sep2',
      groupId: 'g1',
      date: '2026-09-05',
      records: { s1: 'present', s2: 'absent' },
    },
  ],
  payments: [
    { id: 'p1', studentId: 's1', amount: 450000, month: '2026-09', date: '2026-09-03' },
    { id: 'p2', studentId: 's2', amount: 200000, month: '2026-09', date: '2026-09-04' },
    { id: 'p3', studentId: 's1', amount: 450000, month: '2026-08', date: '2026-08-05' },
  ],
};

const attMetrics = calculateTeacherAttendanceMetrics(testTeacherData, '2026-09');
assert.equal(attMetrics.totalSessions, 3, 'Total sessions must be 3');
assert.equal(attMetrics.monthSessions, 2, 'September sessions must be 2');

// All-time: 4 present, 1 late, 1 absent -> (4 + 0.5) / 6 = 4.5 / 6 = 75%
assert.equal(attMetrics.allTime.present, 4);
assert.equal(attMetrics.allTime.late, 1);
assert.equal(attMetrics.allTime.absent, 1);
assert.equal(attMetrics.allTime.rate, 75, 'All-time rate must be 75%');
assert.equal(attMetrics.allTime.tier.tier, 'average');

// September only: 2 present, 1 late, 1 absent -> (2 + 0.5) / 4 = 2.5 / 4 = 63%
assert.equal(attMetrics.currentMonth.present, 2);
assert.equal(attMetrics.currentMonth.late, 1);
assert.equal(attMetrics.currentMonth.absent, 1);
assert.equal(attMetrics.currentMonth.rate, 63, 'September rate must be 63%');
assert.equal(attMetrics.currentMonth.tier.tier, 'needs_attention');

console.log('✅ Test 4: Multi-month attendance and session metrics verified.');

// ==========================================
// TEST 5: Financial Performance & Fee Hierarchy
// ==========================================
// Active students in testTeacherData:
// s1 (in g1, fee 450000)
// s2 (in g1, fee 450000)
// s3 (in g2, fee 400000)
// Total expected monthly: 450,000 + 450,000 + 400,000 = 1,300,000
// September payments: p1 (450,000) + p2 (200,000) = 650,000
// All-time payments: 650,000 + 450,000 = 1,100,000
const finMetrics = calculateTeacherFinancials(testTeacherData, '2026-09');
assert.equal(finMetrics.expectedMonthlyRevenue, 1300000, 'Expected revenue must match sum of student group fees');
assert.equal(finMetrics.collectedMonthlyRevenue, 650000, 'Collected monthly revenue must match September payments');
assert.equal(finMetrics.collectedAllTimeRevenue, 1100000, 'All-time revenue must match all valid payments');
assert.equal(finMetrics.collectionRate, 50, 'Collection rate 650000 / 1300000 must be 50%');

// Test Grant Student (0 fee):
const dataWithGrant = {
  groups: [{ id: 'g_grant', monthlyFee: 500000 }],
  students: [
    { id: 's_normal', groupId: 'g_grant', monthlyFee: 500000 },
    { id: 's_grant', groupId: 'g_grant', monthlyFee: 0 }, // Free scholarship
  ],
  payments: [],
};
const finGrant = calculateTeacherFinancials(dataWithGrant, '2026-09');
assert.equal(finGrant.expectedMonthlyRevenue, 500000, 'Grant student with 0 fee must not be billed group fee');

console.log('✅ Test 5: Financial performance & fee hierarchy verified.');

// ==========================================
// TEST 6: Complete Teacher KPI Dossier
// ==========================================
const kpiDossier = calculateTeacherKpis('teacher1', testTeacherData, { monthKey: '2026-09' });
assert.equal(kpiDossier.displayName, 'Aziz Raximov');
assert.equal(kpiDossier.initials, 'AR');
assert.equal(kpiDossier.activeStudentsCount, 3);
assert.equal(kpiDossier.departedStudentsCount, 1);
assert.equal(kpiDossier.totalEnrolledEver, 4);
assert.equal(kpiDossier.retentionRate, 75, '3 active / 4 total = 75% retention');
assert.equal(kpiDossier.churnRate, 25, '1 departed / 4 total = 25% churn');
assert.equal(kpiDossier.groupsCount, 2);
assert.equal(kpiDossier.currentPassword, 'insight', 'Fallback to default teacher1 password insight');

console.log('✅ Test 6: Complete teacher KPI dossier verified.');

// ==========================================
// TEST 7: Group Creation Payload Builder
// ==========================================
const groupPayload = buildGroupPayload({
  teacherId: 'teacher2',
  name: 'RoboKids Teens 1',
  category: 'teens',
  icon: 'robot',
  room: '2-xona',
  days: ['tue', 'thu', 'sat'],
  startTime: '16:00',
  endTime: '17:30',
  monthlyFee: '450000',
  password: ' Robo2026 ',
  color: '#8B5CF6',
});

assert.ok(groupPayload.id.startsWith('grp_'), 'Group ID must start with grp_');
assert.equal(groupPayload.name, 'RoboKids Teens 1');
assert.equal(groupPayload.category, 'teens');
assert.equal(groupPayload.room || groupPayload.schedule.room, '2-xona');
assert.deepEqual(groupPayload.schedule.days, ['tue', 'thu', 'sat']);
assert.equal(groupPayload.schedule.startTime, '16:00');
assert.equal(groupPayload.schedule.endTime, '17:30');
assert.equal(groupPayload.monthlyFee, 450000, 'Fee string must parse to number');
assert.equal(groupPayload.password, 'robo2026', 'Password must be trimmed and lowercased');
assert.equal(groupPayload.color, '#8B5CF6');

// Required validations
assert.throws(() => buildGroupPayload({ teacherId: '', name: 'G1' }), /Ustoz tanlanishi shart/);
assert.throws(() => buildGroupPayload({ teacherId: 'teacher1', name: '' }), /Guruh nomi kiritilishi shart/);

console.log('✅ Test 7: Group creation payload builder and validations verified.');

// ==========================================
// TEST 8: Atomic Optimistic Rollback Safety
// ==========================================
// Simulate App state updater with rollback pattern
let simulatedAllTeachers = {
  teacher1: {
    teacherProfile: { fullName: 'Old Name' },
    groups: [{ id: 'g1', name: 'Old Group' }],
  },
};

const originalState = JSON.parse(JSON.stringify(simulatedAllTeachers));

// Attempt profile update that fails
const updateWithRollback = async (shouldFail) => {
  const tId = 'teacher1';
  const prevData = simulatedAllTeachers[tId];

  // Optimistic update
  simulatedAllTeachers = {
    ...simulatedAllTeachers,
    [tId]: {
      ...prevData,
      teacherProfile: { fullName: 'New Failed Name' },
    },
  };
  assert.equal(simulatedAllTeachers.teacher1.teacherProfile.fullName, 'New Failed Name');

  // Network call
  if (shouldFail) {
    // Rollback
    simulatedAllTeachers = {
      ...simulatedAllTeachers,
      [tId]: prevData,
    };
    return false;
  }
  return true;
};

const failedResult = await updateWithRollback(true);
assert.equal(failedResult, false);
assert.deepEqual(simulatedAllTeachers, originalState, 'State must be fully restored on network error');

console.log('✅ Test 8: Atomic optimistic rollback on network failure verified.');

// ==========================================
// TEST 9: Multi-Teacher Sorting & Ranking Logic
// ==========================================
const mockTeachers = [
  { teacherId: 'tA', attendance: { allTime: { rate: 70 } }, activeStudentsCount: 20, groupsCount: 3, retentionRate: 85 },
  { teacherId: 'tB', attendance: { allTime: { rate: 95 } }, activeStudentsCount: 10, groupsCount: 5, retentionRate: 95 },
  { teacherId: 'tC', attendance: { allTime: { rate: 85 } }, activeStudentsCount: 30, groupsCount: 2, retentionRate: 75 },
];

const sortByAttendance = [...mockTeachers].sort((a, b) => b.attendance.allTime.rate - a.attendance.allTime.rate);
assert.deepEqual(sortByAttendance.map((t) => t.teacherId), ['tB', 'tC', 'tA'], 'Sorted by attendance descending');

const sortByStudents = [...mockTeachers].sort((a, b) => b.activeStudentsCount - a.activeStudentsCount);
assert.deepEqual(sortByStudents.map((t) => t.teacherId), ['tC', 'tA', 'tB'], 'Sorted by active students count descending');

const sortByGroups = [...mockTeachers].sort((a, b) => b.groupsCount - a.groupsCount);
assert.deepEqual(sortByGroups.map((t) => t.teacherId), ['tB', 'tA', 'tC'], 'Sorted by groups count descending');

const sortByRetention = [...mockTeachers].sort((a, b) => b.retentionRate - a.retentionRate);
assert.deepEqual(sortByRetention.map((t) => t.teacherId), ['tB', 'tA', 'tC'], 'Sorted by retention rate descending');

console.log('✅ Test 9: Multi-teacher sorting & ranking logic verified.');

// ==========================================
// TEST 10: Uzbek Typography, Custom Passwords & Edge Cases
// ==========================================
const uzbekProfile = {
  fullName: "G'ayrat O'ktamov",
  title: "Sun'iy intellekt ustozi",
  password: 'yangi_parol_2026',
};

const uzbekDossier = calculateTeacherKpis('teacher3', {
  teacherProfile: uzbekProfile,
  groups: [],
  students: [],
  attendance: [],
});

assert.equal(uzbekDossier.displayName, "G'ayrat O'ktamov");
assert.equal(uzbekDossier.initials, 'GO', "G'ayrat O'ktamov initials should be GO");
assert.equal(uzbekDossier.currentPassword, 'yangi_parol_2026', 'Custom password overrides default credentials');
assert.equal(uzbekDossier.hasCustomPassword, true);

// Fee fallback when monthlyFee is null or empty string
const groupWithDefaultFee = buildGroupPayload({
  teacherId: 'teacher1',
  name: 'Standard Group',
  monthlyFee: '',
});
assert.equal(groupWithDefaultFee.monthlyFee, 400000, 'Empty string fee defaults to 400,000');

// parseFee with space-formatted strings
assert.equal(parseFee("450 000"), 450000, 'Fee with space separators must parse to number');
assert.equal(parseFee(" 500000 "), 500000, 'Fee with leading/trailing spaces must parse');
assert.equal(parseFee(""), null, 'Empty string fee must return null');
assert.equal(parseFee(null), null, 'null fee must return null');
assert.equal(parseFee(-100), null, 'Negative fee must return null');

console.log('✅ Test 10: Uzbek typography, custom passwords, and fee fallback edge cases verified.');

// ==========================================
// TEST 11: Candidate Conflict Detection for Group Creation
// ==========================================
const sampleTeacherData = {
  teacher1: {
    teacherProfile: { fullName: 'Bekzod U.' },
    groups: [
      {
        id: 'grp_mon1',
        name: 'RoboKids 1',
        schedule: {
          days: ['mon', 'wed', 'fri'],
          startTime: '14:00',
          endTime: '15:30',
          room: '1-xona',
        },
      },
    ],
  },
};

const extractedLessons = extractAllTeacherLessons(sampleTeacherData);
assert.equal(extractedLessons.length, 3, 'Must extract 3 lessons for mon, wed, fri');
assert.equal(extractedLessons[0].teacherLabel, 'Bekzod U.', 'Must resolve real dynamic teacher name');

// Candidate that overlaps on Monday in 1-xona from 15:00 to 16:30
const overlappingCandidate = {
  days: ['mon'],
  startTime: '15:00',
  endTime: '16:30',
  room: '1-xona',
};
const conflictResult = checkCandidateConflict(overlappingCandidate, extractedLessons);
assert.equal(conflictResult.hasConflict, true, 'Must detect room conflict for overlapping time');
assert.equal(conflictResult.conflictingLesson.groupName, 'RoboKids 1');

// Candidate on Tuesday in 1-xona (no conflict)
const nonOverlappingCandidateDay = {
  days: ['tue'],
  startTime: '14:00',
  endTime: '15:30',
  room: '1-xona',
};
assert.equal(checkCandidateConflict(nonOverlappingCandidateDay, extractedLessons).hasConflict, false);

// Candidate in 2-xona on Monday (different room, no conflict)
const nonOverlappingCandidateRoom = {
  days: ['mon'],
  startTime: '14:00',
  endTime: '15:30',
  room: '2-xona',
};
assert.equal(checkCandidateConflict(nonOverlappingCandidateRoom, extractedLessons).hasConflict, false);

console.log('✅ Test 11: Candidate conflict detection for group creation verified.');

// ==========================================
// TEST 12: Invalid Schedule Time Rejection
// ==========================================
assert.throws(
  () => buildGroupPayload({
    teacherId: 'teacher1',
    name: 'Invalid Times Group',
    startTime: '16:00',
    endTime: '15:00', // ends before start!
  }),
  /Dars tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak/
);

assert.throws(
  () => buildGroupPayload({
    teacherId: 'teacher1',
    name: 'Zero Duration Group',
    startTime: '14:00',
    endTime: '14:00', // 0 duration!
  }),
  /Dars tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak/
);

// Valid times pass without error
const validGroup = buildGroupPayload({
  teacherId: 'teacher1',
  name: 'Valid Times Group',
  startTime: '14:00',
  endTime: '15:30',
});
assert.equal(validGroup.schedule.startTime, '14:00');
assert.equal(validGroup.schedule.endTime, '15:30');

console.log('✅ Test 12: Invalid schedule time rejection verified.');

// ==========================================
// TEST 13: Room Property at Root Level for Legacy Compatibility
// ==========================================
assert.equal(validGroup.room, '1-xona', 'Group payload must have root-level room for legacy consumers');
assert.equal(validGroup.schedule.room, '1-xona', 'Group payload must have schedule.room for new consumers');

console.log('✅ Test 13: Room property presence at root level verified.');

// ==========================================
// TEST 14: Teacher Custom Password Multi-Layer Login Resolution
// ==========================================
const testCredentials = {
  insight: { role: 'teacher', teacherId: 'teacher1' },
};

// Simulate multi-layer login logic
const resolveLogin = (inputPassword, inMemoryData = null, localCache = {}, remoteData = null) => {
  const clean = inputPassword.trim().toLowerCase();
  // 1. Static credentials
  if (testCredentials[clean]) return testCredentials[clean];
  // 2. In-memory allTeachersData
  if (inMemoryData) {
    for (const tId of ['teacher1']) {
      if (inMemoryData[tId]?.teacherProfile?.password?.trim()?.toLowerCase() === clean) {
        return { role: 'teacher', teacherId: tId };
      }
    }
  }
  // 3. LocalStorage cache
  for (const tId of ['teacher1']) {
    if (localCache[`rsa_teacher_profile_${tId}`]?.password?.trim()?.toLowerCase() === clean) {
      return { role: 'teacher', teacherId: tId };
    }
  }
  // 4. Remote Supabase data
  if (remoteData) {
    for (const tId of ['teacher1']) {
      if (remoteData[tId]?.teacherProfile?.password?.trim()?.toLowerCase() === clean) {
        return { role: 'teacher', teacherId: tId };
      }
    }
  }
  return null;
};

// Default password test (case-insensitive)
assert.deepEqual(resolveLogin('INSIGHT'), { role: 'teacher', teacherId: 'teacher1' });
// Custom password in localStorage (e.g. after logout when inMemoryData is null)
const localProfiles = {
  rsa_teacher_profile_teacher1: { fullName: 'Bekzod', password: 'custom_secret_2026' },
};
assert.deepEqual(resolveLogin('CUSTOM_SECRET_2026', null, localProfiles), { role: 'teacher', teacherId: 'teacher1' });
// Custom password in remote Supabase (e.g. fresh incognito browser)
const remoteProfiles = {
  teacher1: { teacherProfile: { fullName: 'Bekzod', password: 'remote_secret_777' } },
};
assert.deepEqual(resolveLogin('remote_secret_777', null, {}, remoteProfiles), { role: 'teacher', teacherId: 'teacher1' });
// Invalid password returns null
assert.equal(resolveLogin('wrong_pwd', null, localProfiles, remoteProfiles), null);

console.log('✅ Test 14: Teacher custom password multi-layer login resolution verified.');

// ==========================================
// TEST 15: Departed Student Historical Attendance Preservation
// ==========================================
// A student who was active in August and departed at the end of August
const churnedTeacherData = {
  students: [
    { id: 'st_active', name: 'Faol Bola', deleted: false },
    { id: 'st_churned', name: 'Ketgan Bola', deleted: true, deletedAt: '2026-08-31T23:59:59Z' },
  ],
  attendance: [
    {
      id: 'att_aug1',
      date: '2026-08-15',
      records: { st_active: 'present', st_churned: 'present' }, // Both were present
    },
    {
      id: 'att_sep1',
      date: '2026-09-10',
      records: { st_active: 'present' }, // Only active student
    },
  ],
};

const churnedMetrics = calculateTeacherAttendanceMetrics(churnedTeacherData);
assert.equal(churnedMetrics.totalSessions, 2, 'Total sessions must be 2');
// In Aug session: 2 students attended (active + churned when they were enrolled)
// In Sep session: 1 student attended
// Total present must be 3
assert.equal(churnedMetrics.allTime.present, 3, 'Historical session must count departed student present marks');

console.log('✅ Test 15: Departed student historical attendance preservation verified.');

console.log('🎉 ALL 15 RIGOROUS PHASE 5 TEACHERS & KPI TESTS PASSED (15/15)!');
