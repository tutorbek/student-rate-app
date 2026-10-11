import assert from 'node:assert/strict';
import {
  verifyGroupPassword,
  deregisterTeacherGroupPasswords,
  syncTeacherGroupPasswords,
  getGroupPasswordsRegistry
} from '../src/utils/supabase.js';

console.log('--- TESTING GROUP PASSWORD REGISTRY & INTEGRITY ---');

(async () => {
  // Test 1: Non-existent password returns null
  const nullResult = await verifyGroupPassword('non_existent_pwd_9999');
  assert.equal(nullResult, null, 'Non-existent password must return null');
  console.log('✅ Test 1: Non-existent password returns null.');

  // Test 2: Valid active group password returns group
  const activeResult = await verifyGroupPassword('karam');
  assert.ok(activeResult, 'karam must resolve to active group');
  assert.equal(activeResult.teacherId, 'teacher3');
  assert.equal(activeResult.groupName, 'Эпчилар');
  console.log('✅ Test 2: Valid active group password returns group details.');

  // Test 3: solomustoz / salomustoz (previously orphaned) returns null
  const salomResult = await verifyGroupPassword('salomustoz');
  assert.equal(salomResult, null, 'Deleted group password salomustoz must return null');
  const soloResult = await verifyGroupPassword('solomustoz');
  assert.equal(soloResult, null, 'Typo solomustoz must return null');
  console.log('✅ Test 3: salomustoz / solomustoz returns null and is blocked.');

  // Test 4: Registry synchronization test
  const testTeacher = 'test_teacher_isolated';
  const testGroups = [
    { id: 'grp_active1', name: 'Faol 1', password: 'test_active_pwd1', deleted: false },
    { id: 'grp_active2', name: 'Faol 2', password: 'test_active_pwd2', deleted: false },
    { id: 'grp_deleted', name: 'Ochirilgan', password: 'test_del_pwd', deleted: true },
  ];

  await syncTeacherGroupPasswords(testTeacher, testGroups);
  const reg1 = await getGroupPasswordsRegistry();
  assert.ok(reg1['test_active_pwd1'], 'test_active_pwd1 must be registered');
  assert.ok(reg1['test_active_pwd2'], 'test_active_pwd2 must be registered');
  assert.equal(reg1['test_del_pwd'], undefined, 'Deleted group password must NOT be registered');
  console.log('✅ Test 4: syncTeacherGroupPasswords registers active and ignores deleted groups.');

  // Test 5: Re-syncing with one group removed deletes that password
  const testGroupsReduced = [
    { id: 'grp_active1', name: 'Faol 1', password: 'test_active_pwd1', deleted: false }
  ];
  await syncTeacherGroupPasswords(testTeacher, testGroupsReduced);
  const reg2 = await getGroupPasswordsRegistry();
  assert.ok(reg2['test_active_pwd1'], 'test_active_pwd1 remains registered');
  assert.equal(reg2['test_active_pwd2'], undefined, 'test_active_pwd2 was cleaned up automatically');
  console.log('✅ Test 5: syncTeacherGroupPasswords automatically deletes passwords when group is removed.');

  // Test 6: Deregister all teacher group passwords
  await deregisterTeacherGroupPasswords(testTeacher);
  const reg3 = await getGroupPasswordsRegistry();
  assert.equal(reg3['test_active_pwd1'], undefined, 'All passwords for teacher purged');
  console.log('✅ Test 6: deregisterTeacherGroupPasswords cleanly purges all teacher passwords.');

  console.log('🎉 ALL GROUP PASSWORD INTEGRITY TESTS PASSED SUCCESSFULLY!');
})();
