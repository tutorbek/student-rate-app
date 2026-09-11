import React, { useState, useMemo, useRef, useEffect } from 'react';
import { renderAvatar } from '../../utils/studentAvatars';
import { renderGroupIcon } from '../../utils/groupIcons';
import { calculateSessionAttendance, calculateAttendanceRate } from '../../utils/attendanceUtils';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

// SVG Icons
const IconTeachers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconGroups = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconStudents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconAttendance = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconCalendar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconRefresh = ({ spinning }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.5s ease',
      transform: spinning ? 'rotate(360deg)' : 'none'
    }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const TEACHER_IDS = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
const TEACHER_LABELS = {
  'teacher1': 'Teacher 1',
  'teacher2': 'Teacher 2',
  'teacher3': 'Teacher 3',
  'teacher4': 'Teacher 4'
};

const AdminDashboard = ({
  allTeachersData = {},
  onSelectTeacher,
  setActiveTab,
  onRefresh,
  isSyncing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Aggregated Stats calculation
  const aggregatedStats = useMemo(() => {
    let totalGroups = 0;
    let totalStudents = 0;
    let totalAttendanceRecordsCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let totalSessions = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let monthlySessions = 0;
    let monthlyPresent = 0;
    let monthlyAbsent = 0;
    let monthlyLate = 0;

    TEACHER_IDS.forEach(tId => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter(g => !g.deleted);
      const students = (tData.students || []).filter(s => !s.deleted);
      const attendance = tData.attendance || [];

      totalGroups += groups.length;
      totalStudents += students.length;
      totalSessions += attendance.length;

      attendance.forEach(rec => {
        let isCurrentMonth = false;
        if (rec.date) {
          const parts = rec.date.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            if (y === currentYear && m === currentMonth) {
              isCurrentMonth = true;
              monthlySessions++;
            }
          }
        }

        const breakdown = calculateSessionAttendance(rec, students);
        totalAttendanceRecordsCount += breakdown.totalMarked;
        presentCount += breakdown.present;
        absentCount += breakdown.absent;
        lateCount += breakdown.late;
        if (isCurrentMonth) {
          monthlyPresent += breakdown.present;
          monthlyAbsent += breakdown.absent;
          monthlyLate += breakdown.late;
        }
      });
    });

    const attendanceRate = totalAttendanceRecordsCount > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalAttendanceRecordsCount) * 100)
      : 100;

    const monthlyTotalMarked = monthlyPresent + monthlyAbsent + monthlyLate;
    const monthlyRate = monthlyTotalMarked > 0
      ? Math.round(((monthlyPresent + monthlyLate * 0.5) / monthlyTotalMarked) * 100)
      : 100;

    return {
      totalTeachers: TEACHER_IDS.length,
      totalGroups,
      totalStudents,
      totalSessions,
      attendanceRate,
      presentCount,
      absentCount,
      lateCount,
      monthlySessions,
      monthlyPresent,
      monthlyAbsent,
      monthlyLate,
      monthlyRate
    };
  }, [allTeachersData]);

  // Clean relative time formatting without locale bugs
  const formatActivityTime = (dateStr) => {
    if (!dateStr) return "Hali faollik yo'q";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 5) return "Hozirgina";
      if (diffMins < 60) return `${diffMins} daqiqa oldin`;
      
      const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (isToday) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `Bugun, ${hours}:${mins}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
      if (isYesterday) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `Kecha, ${hours}:${mins}`;
      }

      const day = d.getDate();
      const month = UZBEK_MONTHS[d.getMonth()] || '';
      return `${day}-${month}`;
    } catch {
      return dateStr;
    }
  };

  // Per-Teacher Breakdown (Focusing on attendance & groups)
  const teachersSummary = useMemo(() => {
    return TEACHER_IDS.map(tId => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter(g => !g.deleted);
      const students = (tData.students || []).filter(s => !s.deleted);
      const attendance = tData.attendance || [];

      let teacherPresent = 0;
      let teacherAbsent = 0;
      let teacherLate = 0;

      let teacherExcused = 0;

      attendance.forEach(rec => {
        const breakdown = calculateSessionAttendance(rec, students);
        teacherPresent += breakdown.present;
        teacherAbsent += breakdown.absent;
        teacherLate += breakdown.late;
        teacherExcused += breakdown.excused;
      });

      const totalAccountable = teacherPresent + teacherAbsent + teacherLate;
      const totalMarked = totalAccountable + teacherExcused;
      const attRate = calculateAttendanceRate(teacherPresent, teacherAbsent, teacherLate, totalMarked, teacherExcused);

      // Find last attendance activity timestamp
      let lastActivity = null;
      let lastActivityType = '';

      if (attendance.length > 0) {
        const sortedAtt = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastActivity = sortedAtt[0].date;
        lastActivityType = "Davomad olindi";
      }

      return {
        id: tId,
        label: TEACHER_LABELS[tId] || tId,
        groupsCount: groups.length,
        studentsCount: students.length,
        sessionsCount: attendance.length,
        attendanceRate: attRate,
        lastActivity,
        lastActivityType,
        hasData: groups.length > 0 || students.length > 0
      };
    });
  }, [allTeachersData]);

  // Global Quick Search across all teachers
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || query.length < 2) return [];

    const results = [];

    TEACHER_IDS.forEach(tId => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter(g => !g.deleted);
      const students = (tData.students || []).filter(s => !s.deleted);

      // Match Groups
      groups.forEach(g => {
        if (g.name && g.name.toLowerCase().includes(query)) {
          const groupStudents = students.filter(s => s.groupId === g.id);
          results.push({
            type: 'group',
            id: g.id,
            name: g.name,
            icon: g.icon,
            teacherId: tId,
            teacherLabel: TEACHER_LABELS[tId],
            studentsCount: groupStudents.length
          });
        }
      });

      // Match Students
      students.forEach(s => {
        if (s.name && s.name.toLowerCase().includes(query)) {
          const group = groups.find(g => g.id === s.groupId);
          results.push({
            type: 'student',
            id: s.id,
            name: s.name,
            emoji: s.emoji,
            color: s.color,
            teacherId: tId,
            teacherLabel: TEACHER_LABELS[tId],
            groupName: group ? group.name : 'Guruhsiz',
            groupId: s.groupId
          });
        }
      });
    });

    return results.slice(0, 10);
  }, [searchQuery, allTeachersData]);

  return (
    <div className="admin-dashboard-container">
      {/* Page Header */}
      <div className="page-header admin-header-row">
        <div>
          <div className="admin-title-badge-row">
            <h2 className="page-title">Admin Dashboard</h2>
            <span className="admin-pill-badge">Barcha Ustozlar</span>
          </div>
          <p className="page-subtitle">Markazning barcha 4 ta ustozi, guruhlari va markaziy davomat ko'rsatkichlari</p>
        </div>

        {onRefresh && (
          <button
            type="button"
            className="btn btn-secondary scale-active admin-refresh-btn"
            onClick={onRefresh}
            disabled={isSyncing}
          >
            <IconRefresh spinning={isSyncing} />
            <span>{isSyncing ? "Yangilanmoqda..." : "Yangilash"}</span>
          </button>
        )}
      </div>

      {/* Global Quick Search Bar */}
      <div className="admin-search-wrapper" ref={searchWrapperRef}>
        <div className="admin-search-input-box glass-card">
          <IconSearch />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Markaz bo'yicha tezkor qidiruv (o'quvchi ismi yoki guruh)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            name="admin_search_query_no_autofill"
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              aria-label="Tozalash"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="admin-search-results-dropdown glass-card">
            <div className="admin-search-results-header">
              Topilgan natijalar ({searchResults.length})
            </div>
            <div className="admin-search-results-list">
              {searchResults.map((item, idx) => (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  className="admin-search-result-item scale-active"
                  onClick={() => {
                    if (onSelectTeacher) onSelectTeacher(item.teacherId);
                    if (setActiveTab) setActiveTab('groups');
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                >
                  <div className="admin-search-result-avatar">
                    {item.type === 'student' ? (
                      <div className="avatar-circle" style={{ background: item.color || '#E5E7EB', width: 34, height: 34, fontSize: '1rem' }}>
                        {renderAvatar(item.emoji)}
                      </div>
                    ) : (
                      <div className="avatar-circle" style={{ background: '#F3F4F6', width: 34, height: 34 }}>
                        {renderGroupIcon(item.icon, 18)}
                      </div>
                    )}
                  </div>
                  <div className="admin-search-result-info">
                    <div className="admin-search-result-name-row">
                      <span className="admin-search-result-name">{item.name}</span>
                      <span className="admin-teacher-tag">{item.teacherLabel}</span>
                    </div>
                    <span className="admin-search-result-sub">
                      {item.type === 'student'
                        ? `Guruh: ${item.groupName}`
                        : `Guruh • ${item.studentsCount} ta o'quvchi`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global 4 Core Stat Cards */}
      <section className="admin-stats-grid">
        {/* Card 1: Teachers */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-icon stat-icon-purple">
            <IconTeachers />
          </div>
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">O'qituvchilar</h4>
            <p className="admin-stat-value">{aggregatedStats.totalTeachers} <span className="admin-stat-unit">faol</span></p>
          </div>
        </div>

        {/* Card 2: Groups */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-icon stat-icon-blue">
            <IconGroups />
          </div>
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Jami Guruhlar</h4>
            <p className="admin-stat-value">{aggregatedStats.totalGroups} <span className="admin-stat-unit">ta</span></p>
          </div>
        </div>

        {/* Card 3: Students */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-icon stat-icon-indigo">
            <IconStudents />
          </div>
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Jami O'quvchilar</h4>
            <p className="admin-stat-value">{aggregatedStats.totalStudents} <span className="admin-stat-unit">ta</span></p>
          </div>
        </div>

        {/* Card 4: Overall Attendance Rate */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-icon stat-icon-green">
            <IconAttendance />
          </div>
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Umumiy Davomat</h4>
            <p className="admin-stat-value" style={{ color: aggregatedStats.attendanceRate >= 80 ? '#059669' : '#D97706' }}>
              {aggregatedStats.attendanceRate}%
            </p>
          </div>
        </div>
      </section>

      {/* Central Attendance Overview Widget (Bu oygi davomad ko'rsatkichlari) */}
      <section className="admin-attendance-overview-wrapper">
        <div className="glass-card admin-att-overview-card">
          <div className="admin-att-overview-header">
            <div className="admin-att-overview-title-row">
              <div className="admin-att-icon-badge">
                <IconCalendar size={18} />
              </div>
              <div>
                <h3 className="admin-att-overview-title">
                  Bu Oygi Markaziy Davomat Nazorati ({UZBEK_MONTHS[new Date().getMonth()]} {new Date().getFullYear()})
                </h3>
                <p className="admin-att-overview-subtitle">
                  Oylik qatnashuv foizi: <strong>{aggregatedStats.monthlyRate}%</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm scale-active admin-view-full-att-btn"
              onClick={() => {
                if (setActiveTab) setActiveTab('attendance');
              }}
            >
              Markaziy Davomad Jurnali →
            </button>
          </div>

          <div className="admin-att-metrics-subgrid">
            <div className="admin-submetric-item">
              <span className="admin-submetric-label">O'tkazilgan darslar</span>
              <span className="admin-submetric-val">{aggregatedStats.monthlySessions} ta</span>
            </div>
            <div className="admin-submetric-item">
              <span className="admin-submetric-label">Kelganlar (Qatnashuv)</span>
              <span className="admin-submetric-val" style={{ color: '#059669' }}>
                {aggregatedStats.monthlyPresent}
              </span>
            </div>
            <div className="admin-submetric-item">
              <span className="admin-submetric-label">Kelmaganlar</span>
              <span className="admin-submetric-val" style={{ color: '#DC2626' }}>
                {aggregatedStats.monthlyAbsent}
              </span>
            </div>
            <div className="admin-submetric-item">
              <span className="admin-submetric-label">Kechikkanlar</span>
              <span className="admin-submetric-val" style={{ color: '#D97706' }}>
                {aggregatedStats.monthlyLate}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Per-Teacher Activity & Attendance Section */}
      <section className="admin-teachers-section">
        <div className="section-header-row">
          <h3 className="section-title-main">
            <IconTeachers />
            <span>O'qituvchilar Faolligi va Davomati (Teacher 1 - 4)</span>
          </h3>
        </div>

        <div className="admin-teachers-grid">
          {teachersSummary.map((t) => (
            <div key={t.id} className="glass-card admin-teacher-card">
              <div className="admin-teacher-card-top">
                <div className="admin-teacher-title-wrap">
                  <div className="admin-teacher-avatar-badge">
                    {t.id.replace('teacher', 'T')}
                  </div>
                  <div>
                    <h4 className="admin-teacher-name">{t.label}</h4>
                    <span className="admin-teacher-id-subtitle">{t.id}</span>
                  </div>
                </div>
                <div className={`admin-status-indicator ${t.hasData ? 'status-active' : 'status-empty'}`}>
                  {t.hasData ? 'Faol' : "Bo'sh"}
                </div>
              </div>

              {/* Stats Mini Grid */}
              <div className="admin-teacher-stats-row">
                <div className="admin-mini-stat">
                  <span className="admin-mini-stat-label">Guruhlar</span>
                  <span className="admin-mini-stat-val">{t.groupsCount}</span>
                </div>
                <div className="admin-mini-stat">
                  <span className="admin-mini-stat-label">O'quvchilar</span>
                  <span className="admin-mini-stat-val">{t.studentsCount}</span>
                </div>
                <div className="admin-mini-stat">
                  <span className="admin-mini-stat-label">Davomad %</span>
                  <span
                    className="admin-mini-stat-val"
                    style={{
                      color: t.attendanceRate >= 80 ? '#059669' : t.attendanceRate > 0 ? '#D97706' : 'inherit'
                    }}
                  >
                    {t.sessionsCount > 0 ? `${t.attendanceRate}%` : "Yo'q"}
                  </span>
                </div>
              </div>

              {/* Last Activity Footer */}
              <div className="admin-teacher-activity-footer">
                <div className="admin-activity-info">
                  <span className={`admin-activity-dot ${t.hasData ? 'dot-active' : 'dot-empty'}`}></span>
                  <span className="admin-activity-text">
                    {t.lastActivity
                      ? `${t.lastActivityType}: ${formatActivityTime(t.lastActivity)}`
                      : "Hali davomad olinmagan"}
                  </span>
                </div>
                <div className="admin-teacher-btn-group">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm scale-active admin-view-teacher-btn"
                    onClick={() => {
                      if (onSelectTeacher) onSelectTeacher(t.id);
                      if (setActiveTab) setActiveTab('attendance');
                    }}
                  >
                    Davomad →
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm scale-active admin-view-teacher-btn"
                    onClick={() => {
                      if (onSelectTeacher) onSelectTeacher(t.id);
                      if (setActiveTab) setActiveTab('groups');
                    }}
                  >
                    Guruhlar →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fully Scoped CSS Styles for Admin Dashboard */}
      <style>{`
        .admin-dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 22px;
          width: 100%;
        }

        .admin-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .admin-title-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-pill-badge {
          background: var(--apple-blue);
          color: #FFFFFF;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .admin-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 0.84rem;
          font-weight: 600;
        }

        /* Search Box */
        .admin-search-wrapper {
          position: relative;
          width: 100%;
          z-index: 100;
        }

        .admin-search-input-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          color: var(--text-secondary);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .admin-search-input-box:focus-within {
          border-color: rgba(0, 0, 0, 0.18);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .admin-search-input {
          flex: 1;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          font-family: var(--font-family);
          font-size: 0.94rem;
          font-weight: 500;
          color: var(--text-primary);
          padding: 0 !important;
          margin: 0 !important;
          -webkit-appearance: none;
          appearance: none;
        }

        .admin-search-input:focus,
        .admin-search-input:focus-visible,
        .admin-search-input:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .admin-search-input::placeholder {
          color: var(--text-tertiary);
        }

        .admin-search-clear {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .admin-search-clear:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.06);
        }

        .admin-search-results-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-height: 360px;
          overflow-y: auto;
          z-index: 1000;
          padding: 8px;
        }

        .admin-search-results-header {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-secondary);
          padding: 6px 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .admin-search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .admin-search-result-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .admin-search-result-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-search-result-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-search-result-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .admin-teacher-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue);
        }

        .admin-search-result-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        /* 4 Core Stat Grid */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          width: 100%;
        }

        @media (max-width: 900px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .admin-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-stat-card {
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          min-width: 0;
        }

        .admin-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon-purple {
          background: rgba(139, 92, 246, 0.12);
          color: #8B5CF6;
        }

        .stat-icon-blue {
          background: rgba(0, 113, 227, 0.12);
          color: #0071E3;
        }

        .stat-icon-indigo {
          background: rgba(99, 102, 241, 0.12);
          color: #6366F1;
        }

        .stat-icon-green {
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
        }

        .admin-stat-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .admin-stat-label {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
        }

        .admin-stat-value {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-top: 2px;
          white-space: nowrap;
        }

        .admin-stat-unit {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* Central Attendance Overview Widget */
        .admin-att-overview-card {
          padding: 18px 22px;
          background: #FFFFFF;
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-att-overview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .admin-att-overview-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-att-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-att-overview-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .admin-att-overview-subtitle {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 2px 0 0 0;
        }

        .admin-view-full-att-btn {
          font-size: 0.82rem;
          padding: 7px 14px;
        }

        .admin-att-metrics-subgrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: #F5F5F7;
          padding: 12px 16px;
          border-radius: var(--radius-md);
        }

        @media (max-width: 700px) {
          .admin-att-metrics-subgrid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        .admin-submetric-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-submetric-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .admin-submetric-val {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Teachers Section */
        .admin-teachers-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title-main {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }

        .admin-teachers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .admin-teachers-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-teacher-card {
          padding: 18px 20px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: box-shadow var(--transition-fast);
        }

        .admin-teacher-card:hover {
          box-shadow: var(--shadow-md);
        }

        .admin-teacher-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-teacher-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-teacher-avatar-badge {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: #1D1D1F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .admin-teacher-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .admin-teacher-id-subtitle {
          font-size: 0.74rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .admin-status-indicator {
          font-size: 0.74rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }

        .status-active {
          background: #ECFDF5;
          color: #059669;
        }

        .status-empty {
          background: #F3F4F6;
          color: #6B7280;
        }

        .admin-teacher-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #F5F5F7;
          padding: 10px 14px;
          border-radius: var(--radius-md);
        }

        .admin-mini-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-mini-stat-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .admin-mini-stat-val {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .admin-teacher-activity-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .admin-activity-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-activity-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .dot-active {
          background: #10B981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
        }

        .dot-empty {
          background: #9CA3AF;
        }

        .admin-activity-text {
          font-size: 0.76rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .admin-teacher-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-view-teacher-btn {
          font-size: 0.78rem;
          padding: 5px 10px;
        }

        /* Dark Mode Adjustments */
        [data-theme="dark"] .admin-search-input-box,
        [data-theme="dark"] .admin-search-results-dropdown,
        [data-theme="dark"] .admin-stat-card,
        [data-theme="dark"] .admin-teacher-card,
        [data-theme="dark"] .admin-att-overview-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .admin-att-metrics-subgrid,
        [data-theme="dark"] .admin-teacher-stats-row {
          background: #202124;
        }

        [data-theme="dark"] .admin-teacher-avatar-badge {
          background: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .admin-search-result-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .status-empty {
          background: #3C4043;
          color: #9AA0A6;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
