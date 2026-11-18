import assert from 'node:assert/strict';
import {
  addGroup,
  updateGroup,
  getLocalDateString,
  sanitizeGroupStartDate,
  getGroupStartDate,
  formatGroupStartDate,
  formatGroupStartDateLong,
} from '../src/utils/db.js';

console.log('--- TESTING GROUP LESSON START DATE ---');

const todayStr = getLocalDateString();
assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/, 'getLocalDateString must return YYYY-MM-DD');

// 1. New group automatically gets today's local date when startDate is omitted
const { newGroup: autoGroup, updatedGroups: groupsAfterAdd } = addGroup(
  [],
  'Guruh 1',
  'folder',
  'olma',
  '#FFFFFF',
  { days: ['mon', 'wed', 'fri'], startTime: '15:30', endTime: '17:00', room: '1-xona' },
  'teens'
);
assert.equal(autoGroup.startDate, todayStr, 'New group without explicit startDate must default to today');
console.log('PASS 1: addGroup defaults startDate to today.');

// 2. New group accepts explicit custom startDate
const { newGroup: customGroup, updatedGroups: groupsWithTwo } = addGroup(
  groupsAfterAdd,
  'Guruh 2',
  'folder',
  'anor',
  '#FFFFFF',
  null,
  'kids',
  '2026-09-01'
);
assert.equal(customGroup.startDate, '2026-09-01', 'New group must preserve explicit valid startDate');
console.log('PASS 2: addGroup stores explicit startDate.');

// 3. Updating ONLY startDate via updateGroup preserves all other fields
const { updatedGroup: dateUpdated, updatedGroups: groupsAfterDateEdit } = updateGroup(
  groupsWithTwo,
  autoGroup.id,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  '2026-10-15'
);
assert.equal(dateUpdated.startDate, '2026-10-15', 'updateGroup must update startDate');
assert.equal(dateUpdated.name, 'Guruh 1', 'updateGroup must preserve group name');
assert.equal(dateUpdated.password, 'olma', 'updateGroup must preserve group password');
assert.equal(dateUpdated.category, 'teens', 'updateGroup must preserve group category');
assert.deepEqual(dateUpdated.schedule, autoGroup.schedule, 'updateGroup must preserve group schedule');
console.log('PASS 3: updateGroup updates startDate without altering other fields.');

// 4. Updating another field (e.g. category) preserves existing startDate
const { updatedGroup: categoryUpdated } = updateGroup(
  groupsAfterDateEdit,
  autoGroup.id,
  autoGroup.name,
  autoGroup.icon,
  autoGroup.password,
  autoGroup.color,
  autoGroup.schedule,
  'kids'
);
assert.equal(categoryUpdated.category, 'kids', 'updateGroup must update category');
assert.equal(categoryUpdated.startDate, '2026-10-15', 'updateGroup must preserve existing startDate when omitted');
console.log('PASS 4: updateGroup preserves startDate when updating other properties.');

// 5. Legacy group fallback to createdAt
const legacyGroup = {
  id: 'legacy_1',
  name: 'Legacy',
  createdAt: '2026-06-24T09:00:00.000Z',
};
const fallbackDate = getGroupStartDate(legacyGroup);
assert.match(fallbackDate, /^2026-06-24$/, 'Legacy group without startDate must fall back to createdAt date');
console.log('PASS 5: getGroupStartDate falls back to createdAt for legacy groups.');

// 6. Sanitization rejects invalid calendar dates and formats valid ones
assert.equal(sanitizeGroupStartDate('2026-02-31'), null, 'Invalid calendar date must be rejected');
assert.equal(sanitizeGroupStartDate('not-a-date'), null, 'Malformed date string must be rejected');
assert.equal(formatGroupStartDate('2026-11-18'), '18.11.2026', 'formatGroupStartDate must return DD.MM.YYYY');
assert.equal(formatGroupStartDateLong('2026-11-18'), '18 Noyabr 2026', 'formatGroupStartDateLong must return Uzbek month label');
console.log('PASS 6: sanitizeGroupStartDate and date formatters behave accurately.');

console.log('ALL GROUP START DATE TESTS PASSED.');
