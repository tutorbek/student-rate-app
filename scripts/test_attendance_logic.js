import assert from "assert";
import {
  isStudentInGroupAtDate,
  wasStudentInGroupDuringMonth,
  calculateAttendanceRate,
  calculateFairAttendanceScore,
  calculateSessionAttendance,
  calculateStudentAttendanceStats
} from "../src/utils/attendanceUtils.js";
import {
  transferStudent,
  updateStudent,
  syncTransferredStudentsAttendance,
  permanentlyDeleteGroup,
  permanentlyDeleteStudent,
  sanitizeAttendanceDate
} from "../src/utils/db.js";
import { exportAttendanceToCSV } from "../src/utils/exportAttendance.js";

console.log("--- RUNNING ATTENDANCE MODULE TEST SUITE ---");

// 1. Tests for isStudentInGroupAtDate
{
  const student = {
    id: "s1",
    name: "Muhammadjon",
    groupId: "G6",
    createdAt: "2026-08-01T10:00:00.000Z",
    joinedGroupAt: "2026-09-12T10:00:00.000Z",
    groupHistory: [
      {
        groupId: "G2",
        joinedAt: "2026-08-01T10:00:00.000Z",
        leftAt: "2026-09-12T10:00:00.000Z"
      }
    ]
  };

  // Student is in current group G6 on dates since school enrollment
  assert.strictEqual(isStudentInGroupAtDate(student, "2026-08-15", "G6"), true, "Should be eligible in G6 on 2026-08-15");
  assert.strictEqual(isStudentInGroupAtDate(student, "2026-09-15", "G6"), true, "Should be in G6 on 2026-09-15");
  // Student is completely excluded from old group G2
  assert.strictEqual(isStudentInGroupAtDate(student, "2026-08-15", "G2"), false, "Should NOT be in G2 on 2026-08-15");
  assert.strictEqual(isStudentInGroupAtDate(student, "2026-09-15", "G2"), false, "Should NOT be in G2 on 2026-09-15");
  // Before student creation date -> false
  assert.strictEqual(isStudentInGroupAtDate(student, "2026-07-20", "G6"), false, "Should not be anywhere before creation");
  console.log("✔ isStudentInGroupAtDate tests passed");
}

// 2. Tests for wasStudentInGroupDuringMonth
{
  const student = {
    id: "s2",
    name: "Muhammadjon",
    groupId: "G6",
    createdAt: "2026-08-01T10:00:00.000Z",
    joinedGroupAt: "2026-09-12T10:00:00.000Z",
    groupHistory: [
      {
        groupId: "G2",
        joinedAt: "2026-08-01T10:00:00.000Z",
        leftAt: "2026-09-12T10:00:00.000Z"
      }
    ]
  };

  // Student does NOT belong to old group G2 in any month
  assert.strictEqual(wasStudentInGroupDuringMonth(student, "G2", 2026, 7), false, "Not in G2 in August");
  assert.strictEqual(wasStudentInGroupDuringMonth(student, "G2", 2026, 8), false, "Not in G2 in September");

  // Student belongs to current group G6
  assert.strictEqual(wasStudentInGroupDuringMonth(student, "G6", 2026, 7), true, "In G6 in August");
  assert.strictEqual(wasStudentInGroupDuringMonth(student, "G6", 2026, 8), true, "In G6 in September");

  console.log("✔ wasStudentInGroupDuringMonth tests passed");
}

// 3. Tests for calculateAttendanceRate
{
  // 10 present / 10 total -> 100%
  assert.strictEqual(calculateAttendanceRate(10, 0, 0, 10, 0), 100);
  // 5 present, 5 absent -> 50%
  assert.strictEqual(calculateAttendanceRate(5, 5, 0, 10, 0), 50);
  // 8 present, 2 late -> (8 + 1) / 10 = 90%
  assert.strictEqual(calculateAttendanceRate(8, 0, 2, 10, 0), 90);
  // 5 present, 5 excused -> 5/5 = 100% (excused does not lower rate)
  assert.strictEqual(calculateAttendanceRate(5, 0, 0, 10, 5), 100);
  // 0 lessons -> 0%
  assert.strictEqual(calculateAttendanceRate(0, 0, 0, 0, 0), 0);
  // Only excused -> 100%
  assert.strictEqual(calculateAttendanceRate(0, 0, 0, 1, 1), 100);
  console.log("✔ calculateAttendanceRate tests passed");
}

// 4. Tests for calculateFairAttendanceScore (Bayesian Score)
{
  const oneLessonScore = calculateFairAttendanceScore(1, 0, 0, 1, 0);
  assert.strictEqual(oneLessonScore, 77.5);

  const twentyLessonsScore = calculateFairAttendanceScore(19, 1, 0, 20, 0);
  assert.strictEqual(twentyLessonsScore, 91.74);

  assert.ok(twentyLessonsScore > oneLessonScore, "Veteran student must rank higher than 1-day student");
  console.log("✔ calculateFairAttendanceScore Bayesian smoothing tests passed");
}

// 5. Tests for calculateSessionAttendance
{
  const students = [
    { id: "s1", name: "Student 1", groupId: "g1", createdAt: "2026-09-01" },
    { id: "s2", name: "Student 2", groupId: "g1", createdAt: "2026-09-01" },
    { id: "s3_future", name: "Future Student", groupId: "g1", createdAt: "2026-09-20" },
  ];

  const rec = {
    groupId: "g1",
    date: "2026-09-10",
    records: {
      "s1": "present",
      "s2": "absent",
      "s3_future": "present",
    }
  };

  const session = calculateSessionAttendance(rec, students);
  assert.strictEqual(session.present, 1, "Only s1 is present");
  assert.strictEqual(session.absent, 1, "s2 is absent");
  assert.strictEqual(session.totalMarked, 2, "Total accountable must be 2, ignoring future student");
  assert.strictEqual(session.rate, 50, "1/2 = 50%");
  console.log("✔ calculateSessionAttendance session breakdown tests passed");
}

// 6. Tests for calculateStudentAttendanceStats
{
  const student = {
    id: "s1",
    name: "Dilshod",
    groupId: "g1",
    createdAt: "2026-09-01",
  };

  const attendance = [
    {
      groupId: "g1",
      date: "2026-09-07",
      records: { "s1": "present" }
    },
    {
      groupId: "g1",
      date: "2026-09-10",
      records: { "s1": "late" }
    },
    {
      groupId: "g1",
      date: "2026-09-12",
      records: { "s1": "excused" }
    },
    {
      groupId: "g1",
      date: "2026-09-14",
      records: { "s1": "absent" }
    }
  ];

  const stats = calculateStudentAttendanceStats(student, attendance, "g1");
  assert.strictEqual(stats.totalLessons, 4);
  assert.strictEqual(stats.presentCount, 1);
  assert.strictEqual(stats.lateCount, 1);
  assert.strictEqual(stats.excusedCount, 1);
  assert.strictEqual(stats.absentCount, 1);
  assert.strictEqual(stats.rate, 50);
  console.log("✔ calculateStudentAttendanceStats student stats tests passed");
}

// 7. Full Muhammadjon Transfer Test: transferStudent with attendance migration
{
  const initialStudents = [
    {
      id: "mj",
      name: "Muhammadjon",
      groupId: "G2",
      createdAt: "2026-08-01T10:00:00.000Z",
    },
    {
      id: "st_other",
      name: "Sobir",
      groupId: "G2",
      createdAt: "2026-08-01T10:00:00.000Z",
    }
  ];

  const initialAttendance = [
    {
      id: "att_g2_1",
      groupId: "G2",
      date: "2026-09-02",
      records: { "mj": "present", "st_other": "absent" }
    },
    {
      id: "att_g2_2",
      groupId: "G2",
      date: "2026-09-04",
      records: { "mj": "late" }
    },
    {
      id: "att_g6_1",
      groupId: "G6",
      date: "2026-09-02",
      records: { "g6_student": "present" }
    }
  ];

  const { updatedStudent, _updatedStudents, updatedAttendance } = transferStudent(
    initialStudents,
    "mj",
    "G6",
    initialAttendance
  );

  // 1. Student record updated
  assert.strictEqual(updatedStudent.groupId, "G6");
  assert.strictEqual(updatedStudent.groupHistory.length, 1);
  assert.strictEqual(updatedStudent.groupHistory[0].groupId, "G2");

  // 2. G2 attendance cleaned: mj removed from att_g2_1
  const g2Sess1 = updatedAttendance.find((a) => a.id === "att_g2_1");
  assert.strictEqual(g2Sess1.records["mj"], undefined, "mj must be removed from G2 session");
  assert.strictEqual(g2Sess1.records["st_other"], "absent", "st_other must remain in G2 session");

  // 3. att_g2_2 was ONLY mj, so it should be pruned completely from G2
  const g2Sess2 = updatedAttendance.find((a) => a.id === "att_g2_2");
  assert.strictEqual(g2Sess2, undefined, "Empty G2 session must be pruned");

  // 4. G6 attendance received mj records
  const g6Sess1 = updatedAttendance.find((a) => a.groupId === "G6" && a.date === "2026-09-02");
  assert.strictEqual(g6Sess1.records["mj"], "present", "mj present mark merged into G6 session");
  assert.strictEqual(g6Sess1.records["g6_student"], "present");

  const g6Sess2 = updatedAttendance.find((a) => a.groupId === "G6" && a.date === "2026-09-04");
  assert.ok(g6Sess2, "New G6 session created on 2026-09-04");
  assert.strictEqual(g6Sess2.records["mj"], "late", "mj late mark created in G6");

  // 5. In G2, stats for mj are now 0!
  const statsInG2 = calculateStudentAttendanceStats(updatedStudent, updatedAttendance, "G2");
  assert.strictEqual(statsInG2.totalLessons, 0, "mj has 0 lessons in G2");

  // 6. In G6, stats for mj include both past lessons!
  const statsInG6 = calculateStudentAttendanceStats(updatedStudent, updatedAttendance, "G6");
  assert.strictEqual(statsInG6.totalLessons, 2, "mj has 2 lessons in G6");
  assert.strictEqual(statsInG6.presentCount, 1);
  assert.strictEqual(statsInG6.lateCount, 1);
  assert.strictEqual(statsInG6.rate, 75, "(1 + 0.5) / 2 = 75%");

  console.log("✔ Full Muhammadjon Transfer Test passed");
}

// 8. Auto-repair with syncTransferredStudentsAttendance
{
  const students = [
    {
      id: "mj_repair",
      name: "Muhammadjon",
      groupId: "G6",
      createdAt: "2026-08-01T10:00:00.000Z"
    }
  ];

  const dirtyAttendance = [
    {
      id: "dirty_g2",
      groupId: "G2",
      date: "2026-09-01",
      records: { "mj_repair": "present", "other": "absent" }
    }
  ];

  const { updatedAttendance, hasChanges } = syncTransferredStudentsAttendance(students, dirtyAttendance);
  assert.strictEqual(hasChanges, true, "Must detect changes needed");

  const g2Record = updatedAttendance.find((a) => a.groupId === "G2" && a.date === "2026-09-01");
  assert.strictEqual(g2Record.records["mj_repair"], undefined, "mj_repair removed from G2");

  const g6Record = updatedAttendance.find((a) => a.groupId === "G6" && a.date === "2026-09-01");
  assert.ok(g6Record, "G6 session created");
  assert.strictEqual(g6Record.records["mj_repair"], "present", "mj_repair present in G6");

  const syncAgain = syncTransferredStudentsAttendance(students, updatedAttendance);
  assert.strictEqual(syncAgain.hasChanges, false, "No further changes needed");

  console.log("✔ syncTransferredStudentsAttendance auto-repair tests passed");
}

// 9. transferStudent to same group should be safe no-op
{
  const student = {
    id: "st_same",
    groupId: "g1",
    createdAt: "2026-05-01T00:00:00.000Z",
    joinedGroupAt: "2026-05-01T00:00:00.000Z",
    groupHistory: []
  };
  const { updatedStudent } = transferStudent([student], "st_same", "g1");
  assert.strictEqual(updatedStudent.groupHistory.length, 0, "No history entry created for same group");
  assert.strictEqual(updatedStudent.joinedGroupAt, "2026-05-01T00:00:00.000Z", "joinedGroupAt must not change");
  console.log("✔ Same-group transfer no-op tests passed");
}

// 10. updateStudent with group change migrates attendance
{
  const students = [{ id: "st_upd", name: "Alisher", groupId: "g1", createdAt: "2026-01-01" }];
  const attendance = [{ groupId: "g1", date: "2026-09-01", records: { "st_upd": "present" } }];

  const { updatedStudent, updatedAttendance } = updateStudent(
    students,
    "st_upd",
    "Alisher Yangi",
    undefined,
    undefined,
    "g2",
    attendance
  );

  assert.strictEqual(updatedStudent.groupId, "g2");
  assert.strictEqual(updatedAttendance.find((a) => a.groupId === "g2" && a.date === "2026-09-01").records["st_upd"], "present");
  console.log("✔ updateStudent group change migration tests passed");
}

// 11. Defensive null safety in calculateStudentAttendanceStats
{
  const nullStats = calculateStudentAttendanceStats(null, [], "g1");
  assert.strictEqual(nullStats.presentCount, 0);
  assert.strictEqual(nullStats.totalLessons, 0);
  assert.strictEqual(nullStats.rate, 0);
  assert.strictEqual(nullStats.fairScore, 0);
  console.log("✔ calculateStudentAttendanceStats null safety tests passed");
}

// 12. CSV export format: semicolon delimiter and UTF-8 BOM
{
  const group = { id: "g1", name: "Robo-Start 1" };
  const student = { id: "s1", name: "Ali" };
  const studentsWithStats = [
    { student, presentCount: 2, absentCount: 0, lateCount: 0, excusedCount: 1, totalLessons: 3, rate: 100 }
  ];
  const attendanceByDate = {
    "2026-09-01": { groupId: "g1", date: "2026-09-01", records: { "s1": "excused" }, excused: 1, present: 0, absent: 0, late: 0, rate: 100 },
    "2026-09-03": { groupId: "g1", date: "2026-09-03", records: { "s1": "present" }, present: 1, excused: 0, absent: 0, late: 0, rate: 100 },
    "2026-09-05": { groupId: "g1", date: "2026-09-05", records: { "s1": "present" }, present: 1, excused: 0, absent: 0, late: 0, rate: 100 }
  };

  const csv = exportAttendanceToCSV({
    group,
    year: 2026,
    month: 8,
    lessonDates: ["2026-09-01", "2026-09-03", "2026-09-05"],
    studentsWithStats,
    attendanceByDate,
    uzbekMonths: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"]
  });

  assert.ok(csv.startsWith("﻿"), "CSV must start with UTF-8 BOM");
  assert.ok(csv.includes(";"), "CSV must use semicolon separator");
  assert.ok(csv.includes("Kunlik Davomat %"), "CSV must include daily rate footer");
  assert.ok(csv.includes("Sababli Qoldirilgan (S)"), "CSV must include excused footer");
  console.log("✔ exportAttendanceToCSV semicolon and complete footer tests passed");
}

// 13. Excused-only session rate calculation
{
  const rec = {
    groupId: "g1",
    date: "2026-09-10",
    records: {
      "s1": "excused",
      "s2": "excused"
    }
  };
  const students = [
    { id: "s1", name: "S1", groupId: "g1" },
    { id: "s2", name: "S2", groupId: "g1" }
  ];
  const session = calculateSessionAttendance(rec, students);
  assert.strictEqual(session.excused, 2);
  assert.strictEqual(session.accountable, 0);
  assert.strictEqual(session.rate, 100, "Excused-only session rate must be 100%");
  console.log("✔ Excused-only session rate calculation tests passed");
}

// 14. permanentlyDeleteGroup attendance cleanup
{
  const groups = [{ id: "g1", name: "Group 1" }, { id: "g2", name: "Group 2" }];
  const students = [{ id: "s1", groupId: "g1" }, { id: "s2", groupId: "g2" }];
  const transactions = [{ id: "t1", studentId: "s1" }, { id: "t2", studentId: "s2" }];
  const attendance = [
    { id: "a1", groupId: "g1", date: "2026-09-01", records: { "s1": "present" } },
    { id: "a2", groupId: "g2", date: "2026-09-01", records: { "s2": "present" } }
  ];

  const res = permanentlyDeleteGroup(groups, students, transactions, "g1", attendance);
  assert.strictEqual(res.updatedGroups.length, 1);
  assert.strictEqual(res.updatedGroups[0].id, "g2");
  assert.strictEqual(res.updatedAttendance.length, 1);
  assert.strictEqual(res.updatedAttendance[0].groupId, "g2", "Attendance for g1 must be deleted");
  console.log("✔ permanentlyDeleteGroup attendance cleanup tests passed");
}

// 15. permanentlyDeleteStudent attendance cleanup
{
  const students = [{ id: "s1", groupId: "g1" }, { id: "s2", groupId: "g1" }];
  const transactions = [{ id: "t1", studentId: "s1" }, { id: "t2", studentId: "s2" }];
  const attendance = [
    { id: "a1", groupId: "g1", date: "2026-09-01", records: { "s1": "present", "s2": "absent" } }
  ];

  const res = permanentlyDeleteStudent(students, transactions, "s1", attendance);
  assert.strictEqual(res.updatedStudents.length, 1);
  assert.strictEqual(res.updatedStudents[0].id, "s2");
  assert.strictEqual(res.updatedAttendance[0].records["s1"], undefined, "s1 must be removed from records");
  assert.strictEqual(res.updatedAttendance[0].records["s2"], "absent", "s2 record must be intact");
  console.log("✔ permanentlyDeleteStudent attendance cleanup tests passed");
}

// 16. sanitizeAttendanceDate month 00/0 mapping to 01
{
  assert.strictEqual(sanitizeAttendanceDate("2026-00-15"), "2026-01-15");
  assert.strictEqual(sanitizeAttendanceDate("2026-0-15"), "2026-01-15");
  assert.strictEqual(sanitizeAttendanceDate("2026-12-15"), "2026-12-15");
  console.log("✔ sanitizeAttendanceDate month 00/0 mapping tests passed");
}

console.log('\n========================================');
console.log('🎉 ALL ATTENDANCE LOGIC & TRANSFER TESTS PASSED (16/16)!');
console.log('========================================');
