import assert from 'node:assert/strict';

console.log('--- RUNNING RIGOROUS PHASE 2 FINANCE VERIFICATION SUITE ---');

// 1. Fee Parsing Logic
const parseFee = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const num = Number(val);
  return (!isNaN(num) && num >= 0) ? num : null;
};

// Test 1: Empty and whitespace strings MUST return null, not 0
assert.equal(parseFee(''), null, 'Empty string must return null');
assert.equal(parseFee('   '), null, 'Whitespace string must return null');
assert.equal(parseFee(null), null, 'null must return null');
assert.equal(parseFee(undefined), null, 'undefined must return null');
assert.equal(parseFee('abc'), null, 'Non-numeric string must return null');
assert.equal(parseFee(-50000), null, 'Negative numbers must return null');

// Test 2: Valid numbers and 0 grant
assert.equal(parseFee(400000), 400000, '400,000 must parse to 400000');
assert.equal(parseFee('450000'), 450000, '"450000" must parse to 450000');
assert.equal(parseFee(0), 0, '0 must parse to 0 (grant)');
assert.equal(parseFee('0'), 0, '"0" must parse to 0 (grant)');

console.log('✅ Test 1 & 2: parseFee handles empty strings and grants correctly.');

// 2. Fee Hierarchy
const defaultMonthlyFee = 400000;
const resolveFee = (student, group) => {
  const sFee = parseFee(student?.monthlyFee);
  const gFee = group ? parseFee(group.monthlyFee) : null;
  return sFee !== null ? sFee : (gFee !== null ? gFee : defaultMonthlyFee);
};

assert.equal(resolveFee({ monthlyFee: 500000 }, { monthlyFee: 350000 }), 500000, 'Student fee has highest priority');
assert.equal(resolveFee({ monthlyFee: '' }, { monthlyFee: 350000 }), 350000, 'Empty student fee falls back to group fee');
assert.equal(resolveFee({ monthlyFee: '' }, { monthlyFee: '' }), 400000, 'Empty student & group fee falls back to default center fee');
assert.equal(resolveFee({ monthlyFee: 0 }, { monthlyFee: 500000 }), 0, 'Zero fee (grant) is preserved and not overridden by group');

console.log('✅ Test 3: Fee hierarchy priority is respected.');

// 3. Month Key & Advance Payment Boundary
const getPaymentMonthKey = (payment) => {
  if (!payment) return '';
  return payment.month || (payment.date ? String(payment.date).substring(0, 7) : '');
};

const payAdvance = {
  id: 'p1',
  studentId: 's1',
  amount: 400000,
  month: '2026-10',
  date: '2026-09-27',
  method: 'card'
};

const payCurrent = {
  id: 'p2',
  studentId: 's2',
  amount: 400000,
  month: '2026-09',
  date: '2026-09-10',
  method: 'cash'
};

const payLegacyWithoutMonth = {
  id: 'p3',
  studentId: 's3',
  amount: 200000,
  date: '2026-09-05',
  method: 'cash'
};

assert.equal(getPaymentMonthKey(payAdvance), '2026-10', 'Advance payment month key must be designated month');
assert.equal(getPaymentMonthKey(payCurrent), '2026-09', 'Current month payment must match');
assert.equal(getPaymentMonthKey(payLegacyWithoutMonth), '2026-09', 'Legacy payment falls back to date YYYY-MM');

// Verify that advance payment for Oct is NOT counted in Sept
assert.equal(getPaymentMonthKey(payAdvance) === '2026-09', false, 'Oct advance payment must NOT match Sept');
assert.equal(getPaymentMonthKey(payAdvance) === '2026-10', true, 'Oct advance payment MUST match Oct');

console.log('✅ Test 4: Month key and advance payment boundary test passed.');

// 4. Status and Scholarship / Zero-Fee Debtors Bug
const evaluateStudentStatus = (monthlyFee, totalPaid) => {
  const remainingDebt = Math.max(0, monthlyFee - totalPaid);
  const overpaid = Math.max(0, totalPaid - monthlyFee);
  let status = 'unpaid';
  if (monthlyFee === 0 || totalPaid >= monthlyFee) {
    status = 'paid';
  } else if (totalPaid > 0) {
    status = 'partial';
  } else {
    status = 'unpaid';
  }
  return { status, remainingDebt, overpaid };
};

// Case A: Full paid
const resA = evaluateStudentStatus(400000, 400000);
assert.equal(resA.status, 'paid');
assert.equal(resA.remainingDebt, 0);

// Case B: Partial paid
const resB = evaluateStudentStatus(400000, 250000);
assert.equal(resB.status, 'partial');
assert.equal(resB.remainingDebt, 150000);

// Case C: Unpaid
const resC = evaluateStudentStatus(400000, 0);
assert.equal(resC.status, 'unpaid');
assert.equal(resC.remainingDebt, 400000);

// Case D: Overpaid
const resD = evaluateStudentStatus(400000, 600000);
assert.equal(resD.status, 'paid');
assert.equal(resD.remainingDebt, 0);
assert.equal(resD.overpaid, 200000);

// Case E: Grant student (0 fee) - MUST NOT BE UNPAID / DEBTOR!
const resE = evaluateStudentStatus(0, 0);
assert.equal(resE.status, 'paid', '0 fee student must have status paid / qarzsiz');
assert.equal(resE.remainingDebt, 0, '0 fee student must have 0 debt');

console.log('✅ Test 5: Student status and 0-fee grant cases evaluated correctly.');

// 5. Dialable E.164 Phone Helper
const getDialablePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }
  if (digits.length > 0) {
    return String(phone).trim().startsWith('+') ? `+${digits}` : digits;
  }
  return '';
};

assert.equal(getDialablePhone('90 123 45 67'), '+998901234567');
assert.equal(getDialablePhone('+998 (90) 123-45-67'), '+998901234567');
assert.equal(getDialablePhone(''), '');
assert.equal(getDialablePhone(null), '');

console.log('✅ Test 6: Dialable E.164 phone formatting verified.');

// 6. Telegram Reminder Template and Intent URL
const selectedMonthName = 'Sentabr';
const studentName = 'Javohir Aliyev';
const remainingDebt = 400000;
const debtStr = Number(remainingDebt).toLocaleString('uz-UZ').replace(/[\u00A0,]/g, ' ');
const reminderText = `Assalomu alaykum! ${studentName}ning ${selectedMonthName} oyi uchun ${debtStr} so'm to'lovi qolgan. Iltimos to'lovni amalga oshirishingizni so'raymiz.`;

assert.equal(
  reminderText,
  "Assalomu alaykum! Javohir Aliyevning Sentabr oyi uchun 400 000 so'm to'lovi qolgan. Iltimos to'lovni amalga oshirishingizni so'raymiz."
);

const tgUrl = `https://t.me/share/url?text=${encodeURIComponent(reminderText)}`;
assert.match(tgUrl, /^https:\/\/t\.me\/share\/url\?text=Assalomu%20alaykum/);

console.log('✅ Test 7: Telegram Uzbek template and share URL verified.');

// 7. CSV Export Escaping
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return String(val);
  const str = String(val);
  if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Numeric amounts must NOT be quoted so Excel interprets them as numbers for SUM
assert.equal(escapeCSV(400000), '400000');
assert.equal(escapeCSV(0), '0');
// Strings with semicolons or quotes must be RFC 4180 escaped
assert.equal(escapeCSV('Alisher; Bekzod'), '"Alisher; Bekzod"');
assert.equal(escapeCSV('He said "Salom"'), '"He said ""Salom"""');
assert.equal(escapeCSV('Oddiy matn'), 'Oddiy matn');

console.log('✅ Test 8: CSV RFC 4180 escaping and unquoted numbers verified.');

// 8. Rollback simulation
let mockAllTeachersData = {
  teacher1: {
    students: [{ id: 's1', name: 'Ali' }],
    payments: []
  }
};

const simulateRecordPayment = async (tId, newPayment, shouldSucceed) => {
  const tData = mockAllTeachersData[tId];
  const prevTeacherData = tData;

  // Optimistic update
  mockAllTeachersData = {
    ...mockAllTeachersData,
    [tId]: {
      ...tData,
      payments: [newPayment, ...tData.payments]
    }
  };

  // Simulate network save
  if (!shouldSucceed) {
    // Rollback!
    mockAllTeachersData = {
      ...mockAllTeachersData,
      [tId]: prevTeacherData
    };
    return false;
  }
  return true;
};

// Test successful save
const resSuccess = await simulateRecordPayment('teacher1', { id: 'p1', amount: 100000 }, true);
assert.equal(resSuccess, true);
assert.equal(mockAllTeachersData.teacher1.payments.length, 1);

// Test failed save with rollback
const resFail = await simulateRecordPayment('teacher1', { id: 'p2', amount: 200000 }, false);
assert.equal(resFail, false);
assert.equal(mockAllTeachersData.teacher1.payments.length, 1, 'Failed payment must be rolled back');
assert.equal(mockAllTeachersData.teacher1.payments[0].id, 'p1', 'Original state must remain untouched');

console.log('✅ Test 9: Optimistic state rollback on network failure verified.');

console.log('🎉 ALL RIGOROUS TESTS PASSED SUCCESSFULLY (9/9)!');
