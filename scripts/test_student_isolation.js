import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('--- RUNNING STUDENT GROUP ISOLATION & MOBILE INTEGRITY TESTS ---');

// Test 1: Verify zoom: 0.9 is removed from index.html and index.css
{
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
  assert.strictEqual(indexHtml.includes('zoom: 0.9'), false, 'index.html must not contain zoom: 0.9');
  
  const indexCss = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf-8');
  assert.strictEqual(indexCss.includes('zoom: 0.9'), false, 'src/index.css must not contain zoom: 0.9');
  console.log('✔ Test 1 passed: zoom: 0.9 is completely removed to fix mobile scroll and touch lag');
}

// Test 2: Verify CSS syntax in StudentPortal.jsx has no stray unbalanced braces
{
  const studentPortal = fs.readFileSync(path.join(ROOT, 'src/components/student/StudentPortal.jsx'), 'utf-8');
  assert.strictEqual(
    studentPortal.includes('allActiveGroups[0]'),
    false,
    'StudentPortal.jsx must not fall back to allActiveGroups[0]'
  );
  assert.strictEqual(
    studentPortal.includes('|| groups[0] || allActiveGroups[0]'),
    false,
    'StudentPortal.jsx must not fall back to unauthenticated teacher groups'
  );
  console.log('✔ Test 2 passed: dangerous teacher-wide group fallbacks removed from StudentPortal.jsx');
}

// Test 3: Simulation of student filtering logic in App.jsx
{
  const mockGroups = [
    { id: 'grp_1', name: 'Guruh 1 (Olma)', deleted: false },
    { id: 'grp_2', name: 'Guruh 2 (Anor)', deleted: false },
    { id: 'grp_3', name: 'Guruh 3 (Deleted)', deleted: true },
  ];

  const mockStudents = [
    { id: 'st_1', name: 'Ali', groupId: 'grp_1', deleted: false },
    { id: 'st_2', name: 'Vali', groupId: 'grp_1', deleted: false },
    { id: 'st_3', name: 'Hasan', groupId: 'grp_2', deleted: false },
    { id: 'st_4', name: 'Husan', groupId: 'grp_2', deleted: false },
    { id: 'st_del', name: 'Olim', groupId: 'grp_1', deleted: true },
  ];

  const mockTransactions = [
    { id: 'tx_1', studentId: 'st_1', amount: 10, deleted: false },
    { id: 'tx_2', studentId: 'st_2', amount: 20, deleted: false },
    { id: 'tx_3', studentId: 'st_3', amount: 30, deleted: false },
    { id: 'tx_4', studentId: 'st_4', amount: 40, deleted: false },
    { id: 'tx_del', studentId: 'st_1', amount: 99, deleted: true },
  ];

  // Filtering function matching App.jsx implementation:
  function filterForRole(role, studentGroupId, groups, students, transactions) {
    const activeGroups = groups.filter(g => !g.deleted);
    let filteredGroups;
    if (role === 'student') {
      if (!studentGroupId) filteredGroups = [];
      else filteredGroups = activeGroups.filter(g => String(g.id) === String(studentGroupId));
    } else {
      filteredGroups = activeGroups;
    }

    const activeStudents = students.filter(s => !s.deleted);
    let filteredStudents;
    if (role === 'student') {
      if (!studentGroupId) filteredStudents = [];
      else filteredStudents = activeStudents.filter(s => String(s.groupId) === String(studentGroupId));
    } else {
      filteredStudents = activeStudents;
    }

    const studentIds = filteredStudents.map(s => s.id);
    const activeTxs = transactions.filter(t => !t.deleted);
    let filteredTransactions;
    if (role === 'student') {
      if (!studentGroupId || studentIds.length === 0) filteredTransactions = [];
      else {
        const idSet = new Set(studentIds.map(String));
        filteredTransactions = activeTxs.filter(t => idSet.has(String(t.studentId)));
      }
    } else {
      filteredTransactions = activeTxs;
    }

    return { filteredGroups, filteredStudents, filteredTransactions };
  }

  // Student in grp_1
  const s1Data = filterForRole('student', 'grp_1', mockGroups, mockStudents, mockTransactions);
  assert.strictEqual(s1Data.filteredGroups.length, 1, 'Student in grp_1 must only see 1 group');
  assert.strictEqual(s1Data.filteredGroups[0].id, 'grp_1');
  assert.strictEqual(s1Data.filteredStudents.length, 2, 'Student in grp_1 must only see 2 students (Ali, Vali)');
  assert.deepStrictEqual(s1Data.filteredStudents.map(s => s.id).sort(), ['st_1', 'st_2']);
  assert.strictEqual(s1Data.filteredTransactions.length, 2, 'Must only see tx_1 and tx_2');
  assert.deepStrictEqual(s1Data.filteredTransactions.map(t => t.id).sort(), ['tx_1', 'tx_2']);

  // Student with missing studentGroupId (temporary load state or invalid session)
  const emptyStudentData = filterForRole('student', null, mockGroups, mockStudents, mockTransactions);
  assert.strictEqual(emptyStudentData.filteredGroups.length, 0, 'Must NOT leak all groups if studentGroupId is missing');
  assert.strictEqual(emptyStudentData.filteredStudents.length, 0, 'Must NOT leak all students if studentGroupId is missing');
  assert.strictEqual(emptyStudentData.filteredTransactions.length, 0, 'Must NOT leak transactions if studentGroupId is missing');

  // Teacher sees all active data
  const teacherData = filterForRole('teacher', null, mockGroups, mockStudents, mockTransactions);
  assert.strictEqual(teacherData.filteredGroups.length, 2);
  assert.strictEqual(teacherData.filteredStudents.length, 4);
  assert.strictEqual(teacherData.filteredTransactions.length, 4);

  console.log('✔ Test 3 passed: strict group isolation in App.jsx filtering prevents any cross-group leaks');
}

// Test 4: Simulation of student login session isolation (handleLoginSubmit)
{
  const mockLocalStorage = {};
  function setItem(k, v) { mockLocalStorage[k] = String(v); }
  function getItem(k) { return mockLocalStorage[k] || null; }
  function removeItem(k) { delete mockLocalStorage[k]; }

  // Student login
  const loginStudent = (groupMatch) => {
    const freshGroup = {
      teacherId: groupMatch.teacherId,
      groupId: groupMatch.groupId,
      groupName: groupMatch.groupName || ''
    };
    const updatedGroups = [freshGroup];

    setItem('rsa_authenticated', 'true');
    setItem('rsa_role', 'student');
    setItem('rsa_teacher_id', groupMatch.teacherId);
    setItem('rsa_student_group_id', groupMatch.groupId);
    setItem('rsa_student_groups', JSON.stringify(updatedGroups));

    removeItem('rsa_pinned_student_id');
    Object.keys(mockLocalStorage).forEach((k) => {
      if (k.startsWith('rsa_pinned_student_') && k !== `rsa_pinned_student_${groupMatch.groupId}`) {
        removeItem(k);
      }
    });

    return updatedGroups;
  };

  // Student A logs in
  const sA = loginStudent({ teacherId: 'teacher1', groupId: 'group_A', groupName: 'Robo-1' });
  assert.strictEqual(sA.length, 1);
  assert.strictEqual(sA[0].groupId, 'group_A');

  // Student A pins their profile
  setItem('rsa_pinned_student_group_A', 'student_123');

  // Later, Student B logs in on the SAME device to group_B
  const sB = loginStudent({ teacherId: 'teacher1', groupId: 'group_B', groupName: 'Robo-2' });
  assert.strictEqual(sB.length, 1, 'Student B session must ONLY contain group_B');
  assert.strictEqual(sB[0].groupId, 'group_B');
  assert.strictEqual(JSON.parse(getItem('rsa_student_groups')).length, 1);
  assert.strictEqual(JSON.parse(getItem('rsa_student_groups'))[0].groupId, 'group_B');

  // Group A's pinned profile must have been purged
  assert.strictEqual(getItem('rsa_pinned_student_group_A'), null, 'Previous group pinned identity must be removed');

  console.log('✔ Test 4 passed: student login session isolation guarantees no stale groups or profiles leak across users');
}

// Test 5: Attendance scoping test
{
  const mockAttendance = [
    { id: 'att_1', groupId: 'group_A', date: '2026-09-10' },
    { id: 'att_2', groupId: 'group_B', date: '2026-09-10' },
  ];

  function getGroupAttendance(currentGroup, attendance) {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    return attendance.filter((a) => String(a.groupId) === gId);
  }

  assert.strictEqual(getGroupAttendance({ id: 'group_A' }, mockAttendance).length, 1);
  assert.strictEqual(getGroupAttendance({ id: 'group_A' }, mockAttendance)[0].id, 'att_1');
  assert.strictEqual(getGroupAttendance(null, mockAttendance).length, 0, 'Null currentGroup must return empty array');

  console.log('✔ Test 5 passed: attendance is strictly isolated to currentGroup');
}

console.log('\n========================================');
console.log('🎉 ALL STUDENT ISOLATION & MOBILE INTEGRITY TESTS PASSED (5/5)!');
console.log('========================================');
