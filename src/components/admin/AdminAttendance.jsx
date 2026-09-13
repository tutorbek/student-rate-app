import React, { useState, useMemo } from 'react';
import { renderAvatar } from '../../utils/studentAvatars';
import { renderGroupIcon } from '../../utils/groupIcons';
import { sanitizeAttendanceDate } from '../../utils/db';
import { calculateSessionAttendance, calculateWeightedAttendanceMetrics } from '../../utils/attendanceUtils';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const TEACHER_IDS = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
const TEACHER_LABELS = {
  'teacher1': 'Teacher 1',
  'teacher2': 'Teacher 2',
  'teacher3': 'Teacher 3',
  'teacher4': 'Teacher 4'
};

const AdminAttendance = ({
  allTeachersData = {},
  selectedTeacherFilter = 'all'
}) => {
  const [activeTeacherFilter, setActiveTeacherFilter] = useState(selectedTeacherFilter || 'all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [sessionDetailModal, setSessionDetailModal] = useState(null); // { session, teacherLabel, groupName, students }

  // Extract all groups based on teacher filter
  const availableGroups = useMemo(() => {
    const list = [];
    const targetTeachers = activeTeacherFilter === 'all' ? TEACHER_IDS : [activeTeacherFilter];

    targetTeachers.forEach(tId => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter(g => !g.deleted);
      groups.forEach(g => {
        list.push({
          ...g,
          teacherId: tId,
          teacherLabel: TEACHER_LABELS[tId]
        });
      });
    });

    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [allTeachersData, activeTeacherFilter]);

  // If selected group is not in available groups, reset to 'all'
  React.useEffect(() => {
    if (selectedGroupId !== 'all' && !availableGroups.some(g => g.id === selectedGroupId)) {
      setSelectedGroupId('all');
    }
  }, [availableGroups, selectedGroupId]);

  // Aggregate attendance sessions
  const attendanceSessions = useMemo(() => {
    const sessions = [];
    const targetTeachers = activeTeacherFilter === 'all' ? TEACHER_IDS : [activeTeacherFilter];

    targetTeachers.forEach(tId => {
      const tData = allTeachersData[tId] || {};
      const groups = tData.groups || [];
      const students = tData.students || [];
      const attendance = tData.attendance || [];

      attendance.forEach(rec => {
        if (!rec.date) return;

        const cleanDate = sanitizeAttendanceDate(rec.date);

        // Date filtering by selected month and year
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (y !== selectedYear || m !== selectedMonth) {
            return;
          }
        }

        // Group filtering
        if (selectedGroupId !== 'all' && rec.groupId !== selectedGroupId) {
          return;
        }

        const group = groups.find(g => g.id === rec.groupId);
        const groupName = group ? group.name : 'Noma\'lum guruh';
        const groupIcon = group ? group.icon : '📁';

        // Calculate session breakdown using unified calculation
        const breakdown = calculateSessionAttendance(rec, students);

        sessions.push({
          id: `${tId}-${rec.groupId}-${cleanDate}`,
          teacherId: tId,
          teacherLabel: TEACHER_LABELS[tId],
          groupId: rec.groupId,
          groupName,
          groupIcon,
          date: cleanDate,
          present: breakdown.present,
          absent: breakdown.absent,
          late: breakdown.late,
          excused: breakdown.excused,
          total: breakdown.accountable,
          rate: breakdown.rate,
          students: breakdown.studentDetails
        });
      });
    });

    // Sort descending by date
    return sessions.sort((a, b) => b.date.localeCompare(a.date));
  }, [allTeachersData, activeTeacherFilter, selectedGroupId, selectedMonth, selectedYear]);

  // High-level metrics for the selected view
  const metrics = useMemo(() => {
    return calculateWeightedAttendanceMetrics(attendanceSessions);
  }, [attendanceSessions]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleExportCSV = () => {
    if (attendanceSessions.length === 0) {
      alert("Tanlangan davrda eksport qilish uchun darslar mavjud emas!");
      return;
    }

    const rows = [];
    rows.push(['Sana', 'Ustoz', 'Guruh', 'Keldi', 'Sababli', 'Kelmadi', 'Kechikdi', 'Jami', 'Qatnashuv %'].join(';'));

    attendanceSessions.forEach(s => {
      const row = [
        `"${s.date}"`,
        `"${s.teacherLabel.replace(/"/g, '""')}"`,
        `"${s.groupName.replace(/"/g, '""')}"`,
        s.present,
        s.excused || 0,
        s.absent,
        s.late,
        s.total,
        `${s.rate}%`
      ];
      rows.push(row.join(';'));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Epchil_Robot_Admin_Davomad_${selectedYear}_${selectedMonth + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatUzbekDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanDate = sanitizeAttendanceDate(dateStr);
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return cleanDate;
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d}-${UZBEK_MONTHS[m] || parts[1]}, ${y}`;
  };

  return (
    <div className="admin-attendance-container">
      {/* Printable Header */}
      <div className="print-header-banner admin-print-header">
        <h1 className="print-school-title">
          Epchil Robot — Markaziy Davomad Jurnali
        </h1>
        <p className="print-meta-info">
          Davr: <strong>{UZBEK_MONTHS[selectedMonth]} {selectedYear}-yil</strong> • Ustoz: <strong>{activeTeacherFilter === 'all' ? 'Barcha Ustozlar' : TEACHER_LABELS[activeTeacherFilter]}</strong> • Jami darslar: <strong>{attendanceSessions.length} ta</strong> • Chop etildi: {new Date().toLocaleDateString('uz-UZ')}
        </p>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Markaziy Davomad Jurnali</h2>
          <p className="page-subtitle">Barcha ustozlar va guruhlarning kunlik/oylik dars davomati hisoboti</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card admin-att-filters-card">
        {/* Teacher Tabs */}
        <div className="admin-filter-group">
          <label className="form-label">Ustoz filtri</label>
          <div className="admin-teacher-filter-tabs">
            <button
              type="button"
              className={`admin-filter-tab-btn ${activeTeacherFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTeacherFilter('all')}
            >
              Barcha Ustozlar
            </button>
            {TEACHER_IDS.map(tId => (
              <button
                key={tId}
                type="button"
                className={`admin-filter-tab-btn ${activeTeacherFilter === tId ? 'active' : ''}`}
                onClick={() => setActiveTeacherFilter(tId)}
              >
                {TEACHER_LABELS[tId]}
              </button>
            ))}
          </div>
        </div>

        {/* Group Selector, Month Navigator & Action Buttons */}
        <div className="admin-att-controls-row">
          <div className="admin-filter-item">
            <label className="form-label">Guruh</label>
            <select
              className="form-input admin-group-select"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="all">Barcha guruhlar ({availableGroups.length} ta)</option>
              {availableGroups.map(g => (
                <option key={`${g.teacherId}-${g.id}`} value={g.id}>
                  {g.teacherLabel} • {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter-item">
            <label className="form-label">Oy / Yil</label>
            <div className="admin-month-nav-box">
              <button type="button" className="btn btn-secondary btn-sm scale-active" onClick={handlePrevMonth}>
                ‹
              </button>
              <span className="admin-current-month-label">
                {UZBEK_MONTHS[selectedMonth]} {selectedYear}
              </span>
              <button type="button" className="btn btn-secondary btn-sm scale-active" onClick={handleNextMonth}>
                ›
              </button>
            </div>
          </div>

          <div className="admin-att-actions-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm scale-active admin-btn-action"
              onClick={handleExportCSV}
              title="Tanlangan oylik davomatni Excel (.csv) formatida yuklab olish"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Excel (.csv)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm scale-active admin-btn-action"
              onClick={() => window.print()}
              title="Davomat hisobotini chop etish yoki PDF qilib saqlash"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Chop etish / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Metrics */}
      <div className="admin-att-metrics-grid">
        <div className="glass-card admin-metric-card">
          <span className="admin-metric-label">O'tkazilgan darslar</span>
          <span className="admin-metric-val">{metrics.totalSessions} ta</span>
        </div>
        <div className="glass-card admin-metric-card">
          <span className="admin-metric-label">O'rtacha qatnashuv</span>
          <span className="admin-metric-val" style={{ color: metrics.totalSessions === 0 ? 'var(--text-tertiary)' : (metrics.avgRate >= 85 ? '#059669' : '#D97706') }}>
            {metrics.totalSessions === 0 ? '—' : `${metrics.avgRate}%`}
          </span>
        </div>
        <div className="glass-card admin-metric-card">
          <span className="admin-metric-label">Kelganlar (Jami)</span>
          <span className="admin-metric-val" style={{ color: '#059669' }}>
            {metrics.totalPresent}
          </span>
        </div>
        <div className="glass-card admin-metric-card">
          <span className="admin-metric-label">Sababli (Jami)</span>
          <span className="admin-metric-val" style={{ color: '#2563EB' }}>
            {metrics.totalExcused || 0}
          </span>
        </div>
        <div className="glass-card admin-metric-card">
          <span className="admin-metric-label">Kelmaganlar (Sababsiz)</span>
          <span className="admin-metric-val" style={{ color: '#DC2626' }}>
            {metrics.totalAbsent}
          </span>
        </div>
        <div className="glass-card admin-metric-card">
          <span className="admin-metric-label">Kechikkanlar</span>
          <span className="admin-metric-val" style={{ color: '#D97706' }}>
            {metrics.totalLate}
          </span>
        </div>
      </div>

      {/* Attendance Sessions List / Table */}
      <div className="glass-card admin-sessions-card">
        <div className="admin-sessions-header">
          <h3 className="section-title-main" style={{ fontSize: '1.05rem', margin: 0 }}>
            Dars davomati jurnallari ({attendanceSessions.length})
          </h3>
        </div>

        {attendanceSessions.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <p style={{ margin: 0 }}>Tanlangan davrda ({UZBEK_MONTHS[selectedMonth]} {selectedYear}) dars davomati yozuvlari topilmadi.</p>
          </div>
        ) : (
          <div className="admin-sessions-table-wrapper">
            <table className="admin-sessions-table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Ustoz</th>
                  <th>Guruh</th>
                  <th style={{ textAlign: 'center' }}>Keldi</th>
                  <th style={{ textAlign: 'center' }}>Sababli</th>
                  <th style={{ textAlign: 'center' }}>Kelmadi</th>
                  <th style={{ textAlign: 'center' }}>Kechikdi</th>
                  <th style={{ textAlign: 'center' }}>Qatnashuv</th>
                  <th style={{ textAlign: 'right' }}>Harakat</th>
                </tr>
              </thead>
              <tbody>
                {attendanceSessions.map(session => (
                  <tr key={session.id}>
                    <td>
                      <div className="admin-date-cell">
                        <span className="admin-date-main">{formatUzbekDate(session.date)}</span>
                        <span className="admin-date-sub">{session.date}</span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-teacher-tag">{session.teacherLabel}</span>
                    </td>
                    <td>
                      <div className="admin-group-cell">
                        <span className="admin-group-mini-icon">{renderGroupIcon(session.groupIcon, 16)}</span>
                        <span className="admin-group-name">{session.groupName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="admin-att-pill pill-present">{session.present}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`admin-att-pill ${session.excused > 0 ? 'pill-excused' : 'pill-muted'}`}>
                        {session.excused || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`admin-att-pill ${session.absent > 0 ? 'pill-absent' : 'pill-muted'}`}>
                        {session.absent}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`admin-att-pill ${session.late > 0 ? 'pill-late' : 'pill-muted'}`}>
                        {session.late}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`admin-rate-badge ${session.rate >= 85 ? 'rate-good' : session.rate >= 70 ? 'rate-avg' : 'rate-bad'}`}>
                        {session.rate}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm scale-active"
                        onClick={() => setSessionDetailModal(session)}
                      >
                        Batafsil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {sessionDetailModal && (
        <div className="modal-overlay" onClick={() => setSessionDetailModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '24px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSessionDetailModal(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header-section" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                  {formatUzbekDate(sessionDetailModal.date)}
                </h3>
                <span className="admin-teacher-tag">{sessionDetailModal.teacherLabel}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Guruh: <strong>{sessionDetailModal.groupName}</strong> • Qatnashuv: <strong>{sessionDetailModal.rate}%</strong>
              </p>
            </div>

            {/* Students Presence Status List */}
            <div className="admin-modal-students-list" style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessionDetailModal.students.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px 0' }}>
                  O'quvchilar ro'yxati topilmadi.
                </p>
              ) : (
                sessionDetailModal.students.map(s => (
                  <div key={s.id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar-circle" style={{ background: s.color || '#F3F4F6', width: 34, height: 34, fontSize: '1rem' }}>
                        {renderAvatar(s.emoji)}
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {s.name}
                      </span>
                    </div>

                    <div>
                      {s.status === 'present' && (
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: '#ECFDF5', color: '#059669' }}>
                          ✓ Keldi
                        </span>
                      )}
                      {s.status === 'excused' && (
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: '#EFF6FF', color: '#2563EB' }}>
                          ℹ Sababli
                        </span>
                      )}
                      {s.status === 'absent' && (
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: '#FEF2F2', color: '#DC2626' }}>
                          ✕ Kelmadi
                        </span>
                      )}
                      {s.status === 'late' && (
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: '#FFFBEB', color: '#D97706' }}>
                          ⏰ Kechikdi
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Styling */}
      <style>{`
        .admin-attendance-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .admin-att-filters-card {
          padding: 18px 20px;
          border-radius: var(--radius-lg);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .admin-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-att-controls-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .admin-filter-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-group-select {
          min-width: 240px;
          font-size: 0.86rem;
          padding: 8px 12px;
        }

        .admin-month-nav-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-current-month-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 140px;
          text-align: center;
        }

        .admin-att-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }

        .admin-btn-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .admin-print-header {
          display: none;
        }

        .admin-att-metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        @media (max-width: 900px) {
          .admin-att-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .admin-att-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .admin-metric-card {
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-metric-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .admin-metric-val {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Sessions Table */
        .admin-sessions-card {
          padding: 20px;
          border-radius: var(--radius-lg);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: var(--shadow-sm);
        }

        .admin-sessions-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .admin-sessions-table-wrapper {
          overflow-x: auto;
        }

        .admin-sessions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.86rem;
        }

        .admin-sessions-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }

        .admin-sessions-table td {
          padding: 12px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          vertical-align: middle;
        }

        .admin-sessions-table tr:hover td {
          background: rgba(0, 0, 0, 0.02);
        }

        .admin-date-cell {
          display: flex;
          flex-direction: column;
        }

        .admin-date-main {
          font-weight: 700;
          color: var(--text-primary);
        }

        .admin-date-sub {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .admin-group-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-group-mini-icon {
          display: flex;
          align-items: center;
        }

        .admin-group-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .admin-att-pill {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          min-width: 28px;
        }

        .pill-present {
          background: #ECFDF5;
          color: #059669;
        }

        .pill-excused {
          background: #EFF6FF;
          color: #2563EB;
        }

        .pill-absent {
          background: #FEF2F2;
          color: #DC2626;
        }

        .pill-late {
          background: #FFFBEB;
          color: #D97706;
        }

        .pill-muted {
          background: #F3F4F6;
          color: #9CA3AF;
        }

        .admin-rate-badge {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-full);
        }

        .rate-good {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .rate-avg {
          background: #FFFBEB;
          color: #D97706;
          border: 1px solid #FDE68A;
        }

        .rate-bad {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        /* Dark Mode */
        [data-theme="dark"] .admin-att-filters-card,
        [data-theme="dark"] .admin-metric-card,
        [data-theme="dark"] .admin-sessions-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .admin-sessions-table th {
          border-color: #3C4043;
        }

        [data-theme="dark"] .admin-sessions-table td {
          border-color: #3C4043;
        }

        [data-theme="dark"] .admin-sessions-table tr:hover td {
          background: rgba(255, 255, 255, 0.04);
        }

        [data-theme="dark"] .pill-muted {
          background: #3C4043;
          color: #9AA0A6;
        }

        /* Print Media Styles */
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }

          nav, header, aside, .sidebar, .sidebar-container, .navbar,
          .page-header, .admin-att-filters-card, .btn, button {
            display: none !important;
          }

          body, #root, .app-container, .main-layout, .main-content,
          .admin-attendance-container, .admin-sessions-card {
            background: #FFFFFF !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
          }

          .admin-print-header {
            display: block !important;
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 2px solid #000;
          }

          .print-school-title {
            font-size: 16pt;
            font-weight: bold;
            margin: 0 0 4px 0;
            color: #000;
          }

          .print-meta-info {
            font-size: 9pt;
            color: #444;
          }

          .admin-att-metrics-grid {
            display: grid !important;
            grid-template-columns: repeat(6, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 14px !important;
          }

          .admin-metric-card {
            border: 1px solid #666 !important;
            padding: 8px !important;
            background: #FAFAFA !important;
          }

          .admin-sessions-table th,
          .admin-sessions-table td {
            border: 1px solid #666 !important;
            padding: 4px 6px !important;
            color: #000 !important;
          }

          .admin-sessions-table th:last-child,
          .admin-sessions-table td:last-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminAttendance;
