/**
 * src/utils/exportAttendance.js
 * 
 * Exports monthly attendance matrix to CSV (Excel compatible with UTF-8 BOM)
 * and provides print/PDF helper.
 */

import { isStudentInGroupAtDate, calculateAttendanceRate } from './attendanceUtils.js';

/**
 * Escapes a field for CSV according to RFC 4180.
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports monthly attendance journal to CSV.
 * 
 * @param {Object} params
 * @param {Object} params.group - group object { id, name, ... }
 * @param {number} params.year - year (e.g. 2026)
 * @param {number} params.month - 0-indexed month (e.g. 2 for Mart)
 * @param {Array<string>} params.lessonDates - sorted array of YYYY-MM-DD date strings
 * @param {Array<Object>} params.studentsWithStats - array of { student, presentCount, absentCount, ... }
 * @param {Object} params.attendanceByDate - map of { [dateStr]: attendanceRecord }
 * @param {Array<string>} params.uzbekMonths - array of month names
 */
export function exportAttendanceToCSV({
  group,
  year,
  month,
  lessonDates = [],
  studentsWithStats = [],
  attendanceByDate = {},
  uzbekMonths = []
}) {
  const monthName = uzbekMonths[month] || `Oy ${month + 1}`;
  const groupName = group?.name || 'Guruh';

  const rows = [];

  // 1. Header Information
  rows.push([escapeCSV(`DAVOMAT JURNALI: ${groupName.toUpperCase()}`)]);
  rows.push([escapeCSV(`Davr: ${monthName} ${year}-yil`)]);
  rows.push([escapeCSV(`Chop etilgan sana: ${new Date().toLocaleDateString('uz-UZ')}`)]);
  rows.push([]); // Empty row separator

  // 2. Table Header Row
  const headerRow = [
    escapeCSV('T/r'),
    escapeCSV('O\'quvchi Ismi')
  ];

  // Date columns (e.g. "02-Mart", "04-Mart")
  lessonDates.forEach(dateStr => {
    const parts = dateStr.split('-');
    const day = parts[2];
    headerRow.push(escapeCSV(`${day}-${monthName.slice(0, 3)}`));
  });

  // Summary columns
  headerRow.push(escapeCSV('Kelgan (✔)'));
  headerRow.push(escapeCSV('Sababli (S)'));
  headerRow.push(escapeCSV('Kelmadi (❌)'));
  headerRow.push(escapeCSV('Kechikkan (⏰)'));
  headerRow.push(escapeCSV('Jami Dars'));
  headerRow.push(escapeCSV('Davomat %'));

  rows.push(headerRow);

  // 3. Student Data Rows
  studentsWithStats.forEach((item, idx) => {
    const student = item.student;
    const sRow = [
      escapeCSV(idx + 1),
      escapeCSV(`${student.name}${item.isTransferred ? ' (Ko\'chirilgan)' : ''}`)
    ];

    // Status for each date
    lessonDates.forEach(dateStr => {
      const rec = attendanceByDate[dateStr];
      const status = rec?.records?.[student.id];
      const isMember = isStudentInGroupAtDate(student, dateStr, group?.id) || (status !== undefined);
      if (!isMember) {
        sRow.push(escapeCSV('—'));
        return;
      }

      if (status === 'present') sRow.push(escapeCSV('✔'));
      else if (status === 'absent') sRow.push(escapeCSV('❌'));
      else if (status === 'late') sRow.push(escapeCSV('⏰'));
      else if (status === 'excused') sRow.push(escapeCSV('S'));
      else sRow.push(escapeCSV('·'));
    });

    // Summary numbers
    sRow.push(escapeCSV(item.presentCount));
    sRow.push(escapeCSV(item.excusedCount));
    sRow.push(escapeCSV(item.absentCount));
    sRow.push(escapeCSV(item.lateCount));
    sRow.push(escapeCSV(item.totalLessons));
    sRow.push(escapeCSV(item.totalLessons > 0 ? `${item.rate}%` : '—'));

    rows.push(sRow);
  });

  // 4. Daily Attendance Summary Footer Rows
  const footerRowPresent = [
    escapeCSV(''),
    escapeCSV('Jami Kelganlar (✔)')
  ];
  const footerRowExcused = [
    escapeCSV(''),
    escapeCSV('Sababli Qoldirilgan (S)')
  ];
  const footerRowAbsent = [
    escapeCSV(''),
    escapeCSV('Sababsiz Kelmaganlar (❌)')
  ];
  const footerRowLate = [
    escapeCSV(''),
    escapeCSV('Kechikkanlar (⏰)')
  ];
  const footerRowRate = [
    escapeCSV(''),
    escapeCSV('Kunlik Davomat %')
  ];

  lessonDates.forEach(dateStr => {
    const rec = attendanceByDate[dateStr];
    if (!rec || !rec.records) {
      footerRowPresent.push(escapeCSV('—'));
      footerRowExcused.push(escapeCSV('—'));
      footerRowAbsent.push(escapeCSV('—'));
      footerRowLate.push(escapeCSV('—'));
      footerRowRate.push(escapeCSV('—'));
      return;
    }

    let sessionPresent = rec.present;
    let sessionExcused = rec.excused;
    let sessionAbsent = rec.absent;
    let sessionLate = rec.late;
    let sessionRate = rec.rate;

    if (sessionPresent === undefined || sessionRate === undefined) {
      const vals = Object.values(rec.records);
      let p = 0, a = 0, l = 0, e = 0;
      vals.forEach(v => {
        if (v === 'present') p++;
        else if (v === 'absent') a++;
        else if (v === 'late') l++;
        else if (v === 'excused') e++;
      });
      sessionPresent = p;
      sessionExcused = e;
      sessionAbsent = a;
      sessionLate = l;
      sessionRate = calculateAttendanceRate(p, a, l, p + a + l + e, e);
    }

    footerRowPresent.push(escapeCSV(sessionPresent));
    footerRowExcused.push(escapeCSV(sessionExcused || 0));
    footerRowAbsent.push(escapeCSV(sessionAbsent || 0));
    footerRowLate.push(escapeCSV(sessionLate || 0));
    footerRowRate.push(escapeCSV(`${sessionRate}%`));
  });

  // Empty cells for summary columns
  for (let i = 0; i < 6; i++) {
    footerRowPresent.push(escapeCSV(''));
    footerRowExcused.push(escapeCSV(''));
    footerRowAbsent.push(escapeCSV(''));
    footerRowLate.push(escapeCSV(''));
    footerRowRate.push(escapeCSV(''));
  }

  rows.push([]);
  rows.push(footerRowPresent);
  rows.push(footerRowExcused);
  rows.push(footerRowAbsent);
  rows.push(footerRowLate);
  rows.push(footerRowRate);

  // 5. Build CSV with UTF-8 BOM and semicolon separator
  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');

  // 6. Trigger Browser Download (if running in browser)
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeGroupName = (groupName || 'guruh').replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `Davomat_${safeGroupName}_${monthName}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}

/**
 * Triggers standard browser printing for PDF export or paper printing.
 */
export function printAttendanceJournal() {
  window.print();
}
