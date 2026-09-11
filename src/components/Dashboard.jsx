import React, { useState, useMemo } from 'react';
import { getStudentScore } from '../utils/db';
import { renderGroupIcon, GROUP_COLOR_OPTIONS } from '../utils/groupIcons';
import { renderAvatar } from '../utils/studentAvatars';
import { calculateStudentAttendanceStats } from '../utils/attendanceUtils';

// Clean SVG Vector Icons (Minimalist black & white)
const IconGroups = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconStudents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconTrophy = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconCrown = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
  </svg>
);

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAYS_UZ = [
  { key: 'sun', name: 'Yakshanba' },
  { key: 'mon', name: 'Dushanba' },
  { key: 'tue', name: 'Seshanba' },
  { key: 'wed', name: 'Chorshanba' },
  { key: 'thu', name: 'Payshanba' },
  { key: 'fri', name: 'Juma' },
  { key: 'sat', name: 'Shanba' },
];

const Dashboard = ({ setActiveTab, onSelectGroup, onOpenSchedule, groups = [], students = [], transactions = [], attendance = [] }) => {
  const [showGroupCount, setShowGroupCount] = useState(false);
  const [showStudentCount, setShowStudentCount] = useState(false);

  // Today's schedule calculation
  const todayKey = useMemo(() => {
    const dayIdx = new Date().getDay();
    return DAY_KEYS[dayIdx];
  }, []);

  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    const dayNum = now.getDate();
    const monthsUz = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    const month = monthsUz[now.getMonth()];
    const dayObj = WEEKDAYS_UZ.find((d) => d.key === todayKey) || { name: 'Bugun' };
    return `${dayNum}-${month}, ${dayObj.name}`;
  }, [todayKey]);

  const todayClasses = useMemo(() => {
    return groups
      .filter((g) => g.schedule?.days?.includes(todayKey))
      .sort((a, b) => (a.schedule?.startTime || '00:00').localeCompare(b.schedule?.startTime || '00:00'));
  }, [groups, todayKey]);

  // Stats
  const totalGroups = groups.length;
  const totalStudents = students.length;
  const totalPoints = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const activeTransactionsCount = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return transactions.filter(tx => new Date(tx.timestamp) >= startOfMonth).length;
  }, [transactions]);

  // Find Spotlight: Most Absent Student (Eng ko'p dars qoldirgan o'quvchi)
  const mostAbsentSpotlight = useMemo(() => {
    if (students.length === 0 || attendance.length === 0) return null;

    const activeStudents = students.filter(s => !s.deleted);
    if (activeStudents.length === 0) return null;

    const studentAbsents = activeStudents.map(student => {
      // Calculate overall absences across all groups the student attended (preserves history if transferred)
      const stats = calculateStudentAttendanceStats(student, attendance, null);
      return {
        ...student,
        absentCount: stats.absentCount
      };
    }).filter(s => s.absentCount > 0);

    if (studentAbsents.length === 0) return null;

    studentAbsents.sort((a, b) => b.absentCount - a.absentCount);
    const maxAbsent = studentAbsents[0].absentCount;
    const topAbsentees = studentAbsents.filter(s => s.absentCount === maxAbsent);

    if (topAbsentees.length === 1) {
      const topStudent = topAbsentees[0];
      const groupName = groups.find(g => g.id === topStudent.groupId)?.name || 'Guruhsiz';
      return {
        id: topStudent.id,
        groupId: topStudent.groupId,
        isTie: false,
        name: topStudent.name,
        emoji: topStudent.emoji,
        color: topStudent.color,
        absentCount: maxAbsent,
        groupName
      };
    } else {
      const names = topAbsentees.map(w => w.name).join(' & ');
      const groupNames = topAbsentees.map(w => groups.find(g => g.id === w.groupId)?.name || 'Guruhsiz');
      const uniqueGroupNames = [...new Set(groupNames)].join(' & ');
      return {
        isTie: true,
        name: names,
        emoji: '⚠️',
        color: '#FEF2F2',
        absentCount: maxAbsent,
        groupName: uniqueGroupNames
      };
    }
  }, [students, groups, attendance]);

  // Find Spotlight: This Month's Current 1st Place Leader (Student)
  const thisMonthSpotlight = useMemo(() => {
    if (students.length === 0) return null;
    const scoredStudents = students
      .filter(s => !s.deleted)
      .map(s => ({
        ...s,
        score: getStudentScore(transactions, s.id, 'month')
      }))
      .filter(s => s.score > 0);

    if (scoredStudents.length === 0) return null;
    scoredStudents.sort((a, b) => b.score - a.score);
    const topScore = scoredStudents[0].score;
    const winners = scoredStudents.filter(s => s.score === topScore);

    if (winners.length === 1) {
      const topStudent = winners[0];
      const groupName = groups.find(g => g.id === topStudent.groupId)?.name || 'Guruhsiz';
      return {
        id: topStudent.id,
        groupId: topStudent.groupId,
        isTie: false,
        name: topStudent.name,
        emoji: topStudent.emoji,
        color: topStudent.color,
        score: topScore,
        groupName
      };
    } else {
      const names = winners.map(w => w.name).join(' & ');
      const groupNames = winners.map(w => groups.find(g => g.id === w.groupId)?.name || 'Guruhsiz');
      const uniqueGroupNames = [...new Set(groupNames)].join(' & ');
      return {
        isTie: true,
        name: names,
        emoji: '👑',
        color: '#f4f4f5',
        score: topScore,
        groupName: uniqueGroupNames
      };
    }
  }, [students, groups, transactions]);

  // Find Spotlight: Last Month's Winner (Student)
  const lastMonthSpotlight = useMemo(() => {
    if (students.length === 0) return null;
    const scoredStudents = students.map(s => ({
      ...s,
      score: getStudentScore(transactions, s.id, 'lastMonth')
    })).filter(s => s.score > 0);

    if (scoredStudents.length === 0) return null;
    scoredStudents.sort((a, b) => b.score - a.score);
    const topScore = scoredStudents[0].score;
    const winners = scoredStudents.filter(s => s.score === topScore);

    if (winners.length === 1) {
      const topStudent = winners[0];
      const groupName = groups.find(g => g.id === topStudent.groupId)?.name || 'Guruhsiz';
      return {
        id: topStudent.id,
        groupId: topStudent.groupId,
        isTie: false,
        name: topStudent.name,
        emoji: topStudent.emoji,
        color: topStudent.color,
        score: topScore,
        groupName
      };
    } else {
      const names = winners.map(w => w.name).join(' & ');
      const groupNames = winners.map(w => groups.find(g => g.id === w.groupId)?.name || 'Guruhsiz');
      const uniqueGroupNames = [...new Set(groupNames)].join(' & ');
      return {
        isTie: true,
        name: names,
        emoji: '🏆',
        color: '#f4f4f5',
        score: topScore,
        groupName: uniqueGroupNames
      };
    }
  }, [students, groups, transactions]);

  // Find Spotlight: Last Month's Winner Group
  const lastMonthGroupSpotlight = useMemo(() => {
    if (groups.length === 0) return null;
    const scoredGroups = groups.map(g => {
      const groupStudents = students.filter(s => s.groupId === g.id && !s.deleted);
      const score = groupStudents.reduce((sum, s) => {
        return sum + getStudentScore(transactions, s.id, 'lastMonth');
      }, 0);
      return {
        ...g,
        score
      };
    }).filter(g => g.score > 0);

    if (scoredGroups.length === 0) return null;
    scoredGroups.sort((a, b) => b.score - a.score);
    const topScore = scoredGroups[0].score;
    const winners = scoredGroups.filter(g => g.score === topScore);

    if (winners.length === 1) {
      const topGroup = winners[0];
      return {
        id: topGroup.id,
        isTie: false,
        name: topGroup.name,
        emoji: topGroup.icon || '📁',
        score: topScore
      };
    } else {
      const names = winners.map(w => w.name).join(' & ');
      return {
        isTie: true,
        name: names,
        emoji: '📁',
        score: topScore
      };
    }
  }, [groups, students, transactions]);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon">
            <IconGroups />
          </div>
          <div className="stat-info">
            <div className="stat-label-row">
              <h4 className="stat-label">Guruhlar</h4>
              <button
                type="button"
                className="stat-toggle-btn"
                onClick={() => setShowGroupCount(!showGroupCount)}
              >
                {showGroupCount ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            <p className="stat-value">{showGroupCount ? totalGroups : '••••'}</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">
            <IconStudents />
          </div>
          <div className="stat-info">
            <div className="stat-label-row">
              <h4 className="stat-label">Talabalar</h4>
              <button
                type="button"
                className="stat-toggle-btn"
                onClick={() => setShowStudentCount(!showStudentCount)}
              >
                {showStudentCount ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            <p className="stat-value">{showStudentCount ? totalStudents : '••••'}</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">
            <IconStar />
          </div>
          <div className="stat-info">
            <h4 className="stat-label">Jami Likelar</h4>
            <p className="stat-value">{totalPoints >= 0 ? `+${totalPoints}` : totalPoints}</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">
            <IconActivity />
          </div>
          <div className="stat-info">
            <h4 className="stat-label">Oylik Faollik</h4>
            <p className="stat-value">{activeTransactionsCount} ta baho</p>
          </div>
        </div>
      </section>

      {/* Middle Layer (2nd Row): Today's Classes (Bugungi darslar) */}
      <section className="dashboard-today-section">
        <div className="glass-card dashboard-today-card">
          <div className="dashboard-today-header">
            <div className="dashboard-today-title-col">
              <div className="dashboard-today-badge-row">
                <span className="dashboard-today-badge">Bugungi darslar</span>
                <span className="dashboard-today-date">{formattedTodayDate}</span>
              </div>
            </div>
            <div className="dashboard-today-actions">
              <span className={`dashboard-today-count-pill ${todayClasses.length > 0 ? 'active' : ''}`}>
                {todayClasses.length > 0 ? `${todayClasses.length} ta dars` : 'Dars yo\'q'}
              </span>
              {(onOpenSchedule || setActiveTab) && (
                <button
                  type="button"
                  className="dashboard-today-view-all-btn scale-active"
                  onClick={() => {
                    if (onOpenSchedule) {
                      onOpenSchedule();
                    } else if (setActiveTab) {
                      setActiveTab('schedule');
                    }
                  }}
                  title="Dars jadvalini ochish"
                >
                  Jadvalni ko'rish →
                </button>
              )}
            </div>
          </div>

          {todayClasses.length > 0 ? (
            <div className="dashboard-today-grid">
              {todayClasses.map((group) => {
                const count = students.filter(s => s.groupId === group.id && !s.deleted).length;
                const opt = GROUP_COLOR_OPTIONS.find(c => c.value === group.color) || GROUP_COLOR_OPTIONS[0];
                const cardStyle = {
                  '--card-bg-light': opt.value || '#FFFFFF',
                  '--card-border-light': opt.border || 'rgba(0, 0, 0, 0.08)',
                  '--card-bg-dark': opt.darkBg || '#292A2D',
                  '--card-border-dark': opt.darkBorder || '#3C4043',
                };

                return (
                  <div
                    key={group.id}
                    className="dashboard-lesson-item scale-active"
                    style={cardStyle}
                    onClick={() => onSelectGroup ? onSelectGroup(group.id) : null}
                    title={`${group.name} guruhiga o'tish`}
                  >
                    <div className="dashboard-lesson-left">
                      <div className="dashboard-lesson-icon avatar-circle">
                        {renderGroupIcon(group.icon, 20)}
                      </div>
                      <div className="dashboard-lesson-info">
                        <div className="dashboard-lesson-name-row">
                          <span className="dashboard-lesson-name">{group.name}</span>
                          {group.schedule?.room && (
                            <span className="dashboard-lesson-room">{group.schedule.room}</span>
                          )}
                        </div>
                        <div className="dashboard-lesson-meta">
                          <span className="dashboard-lesson-time">
                            {group.schedule?.startTime}
                            {group.schedule?.endTime ? ` - ${group.schedule.endTime}` : ''}
                          </span>
                          <span className="dashboard-lesson-students">{count} ta o'quvchi</span>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-lesson-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-today-empty">
              <div className="dashboard-today-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="dashboard-today-empty-text">
                <p className="empty-title">Bugun uchun darslar rejalashtirilmagan</p>
                <p className="empty-subtitle">Barcha guruhlar dars jadvalini "Guruhlar" bo'limida ko'rishingiz mumkin.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Spotlight Section */}
      <section className="spotlight-section-wrapper">
        <div className="spotlight-grid">
          {/* This Month's Current 1st Place Leader */}
          <div className="glass-card spotlight-card">
            <div className="spotlight-header-row">
              <span className="spotlight-badge">Hozircha BU OY 1-O'RIN</span>
              {thisMonthSpotlight && (
                <span className="spotlight-score-pill">+{thisMonthSpotlight.score} Likelar</span>
              )}
            </div>

            {thisMonthSpotlight ? (
              <div className="spotlight-content">
                <div className="table-avatar-wrapper">
                  <span className="dashboard-crown">
                    <IconCrown size={14} />
                  </span>
                  <div className="avatar-circle spotlight-avatar first-place-avatar" style={{ background: thisMonthSpotlight.color, overflow: 'hidden' }}>
                    {renderAvatar(thisMonthSpotlight.emoji)}
                  </div>
                </div>
                <div className="spotlight-info">
                  <h4 className="spotlight-name">{thisMonthSpotlight.name}</h4>
                  <p className="spotlight-group">{thisMonthSpotlight.groupName}</p>
                </div>
              </div>
            ) : (
              <div className="spotlight-empty">
                <p className="spotlight-empty-text">Bu oyda hali hech kim like olmagan.</p>
              </div>
            )}
          </div>

          {/* Last Month's Winner (Student) */}
          <div className="glass-card spotlight-card">
            <div className="spotlight-header-row">
              <span className="spotlight-badge">O'TGAN OY G'OLIBI</span>
              {lastMonthSpotlight && (
                <span className="spotlight-score-pill">+{lastMonthSpotlight.score} Likelar</span>
              )}
            </div>

            {lastMonthSpotlight ? (
              <div className="spotlight-content">
                <div className="avatar-circle spotlight-avatar" style={{ background: lastMonthSpotlight.color, overflow: 'hidden' }}>
                  {renderAvatar(lastMonthSpotlight.emoji)}
                </div>
                <div className="spotlight-info">
                  <h4 className="spotlight-name">{lastMonthSpotlight.name}</h4>
                  <p className="spotlight-group">{lastMonthSpotlight.groupName}</p>
                </div>
              </div>
            ) : (
              <div className="spotlight-empty">
                <p className="spotlight-empty-text">O'tgan oyda hech kim like olmagan.</p>
              </div>
            )}
          </div>

          {/* Last Month's Winner Group */}
          <div className="glass-card spotlight-card">
            <div className="spotlight-header-row">
              <span className="spotlight-badge">O'TGAN OY G'OLIB GURUHI</span>
              {lastMonthGroupSpotlight && (
                <span className="spotlight-score-pill">+{lastMonthGroupSpotlight.score} Likelar</span>
              )}
            </div>

            {lastMonthGroupSpotlight ? (
              <div className="spotlight-content">
                <div className="avatar-circle spotlight-avatar" style={{ background: '#F5F5F7', border: '1px solid rgba(0, 0, 0, 0.06)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderGroupIcon(lastMonthGroupSpotlight.emoji, 22)}
                </div>
                <div className="spotlight-info">
                  <h4 className="spotlight-name">{lastMonthGroupSpotlight.name}</h4>
                  <p className="spotlight-group">Guruh umumiy natijasi</p>
                </div>
              </div>
            ) : (
              <div className="spotlight-empty">
                <p className="spotlight-empty-text">O'tgan oyda hech bir guruh like olmagan.</p>
              </div>
            )}
          </div>

          {/* Most Absent Student */}
          <div className="glass-card spotlight-card">
            <div className="spotlight-header-row">
              <span className="spotlight-badge spotlight-badge-absent">ENG KO'P DARS QOLDIRGAN</span>
              {mostAbsentSpotlight && (
                <span className="spotlight-score-pill pill-absent-danger">{mostAbsentSpotlight.absentCount} ta dars</span>
              )}
            </div>

            {mostAbsentSpotlight ? (
              <div className="spotlight-content">
                <div className="avatar-circle spotlight-avatar absent-avatar-highlight" style={{ background: mostAbsentSpotlight.color, overflow: 'hidden' }}>
                  {renderAvatar(mostAbsentSpotlight.emoji)}
                </div>
                <div className="spotlight-info">
                  <h4 className="spotlight-name">{mostAbsentSpotlight.name}</h4>
                  <p className="spotlight-group">{mostAbsentSpotlight.groupName}</p>
                </div>
              </div>
            ) : (
              <div className="spotlight-empty">
                <p className="spotlight-empty-text">Hozircha hech kim dars qoldirmagan.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-card {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .stat-card:hover {
          box-shadow: var(--shadow-md);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
          color: var(--text-primary);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .stat-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          width: 100%;
        }

        .stat-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-toggle-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 2px;
          line-height: 1;
          opacity: 0.6;
          transition: opacity 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .stat-toggle-btn:hover {
          opacity: 1;
          color: var(--text-primary);
        }

        .stat-value {
          font-size: 1.45rem;
          font-weight: 700;
          margin-top: 2px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .stat-card {
            padding: 14px 14px;
            gap: 10px;
            border-radius: var(--radius-md);
          }

          .stat-icon {
            width: 36px;
            height: 36px;
          }

          .stat-icon svg {
            width: 18px;
            height: 18px;
          }

          .stat-value {
            font-size: 1.2rem;
          }

          .stat-label {
            font-size: 0.74rem;
          }
        }

        /* Middle Layer (2nd Row): Today's Classes (Bugungi darslar) */
        .dashboard-today-section {
          display: flex;
          flex-direction: column;
        }

        .dashboard-today-card {
          padding: 18px 20px;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .dashboard-today-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .dashboard-today-title-col {
          display: flex;
          align-items: center;
        }

        .dashboard-today-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .dashboard-today-badge {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .dashboard-today-date {
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.04);
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .dashboard-today-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dashboard-today-count-pill {
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .dashboard-today-count-pill.active {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
          border-color: rgba(16, 185, 129, 0.25);
        }

        .dashboard-today-view-all-btn {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary-color, #2563EB);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .dashboard-today-view-all-btn:hover {
          background: rgba(37, 99, 235, 0.08);
        }

        .dashboard-today-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .dashboard-lesson-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: var(--card-bg-light, var(--bg-card));
          border: 1px solid var(--card-border-light, var(--border-color));
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .dashboard-lesson-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        }

        .dashboard-lesson-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .dashboard-lesson-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.04);
        }

        .dashboard-lesson-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }

        .dashboard-lesson-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dashboard-lesson-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dashboard-lesson-room {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          white-space: nowrap;
        }

        .dashboard-lesson-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .dashboard-lesson-time {
          font-weight: 600;
          color: var(--text-primary);
        }

        .dashboard-lesson-students {
          font-size: 0.74rem;
        }

        .dashboard-lesson-arrow {
          color: var(--text-secondary);
          opacity: 0.45;
          margin-left: 8px;
          flex-shrink: 0;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .dashboard-lesson-item:hover .dashboard-lesson-arrow {
          opacity: 1;
          transform: translateX(2px);
          color: var(--text-primary);
        }

        .dashboard-today-empty {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 16px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-color);
        }

        .dashboard-today-empty-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .dashboard-today-empty-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dashboard-today-empty-text .empty-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .dashboard-today-empty-text .empty-subtitle {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }

        @media (max-width: 680px) {
          .dashboard-today-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .dashboard-today-card {
            padding: 14px 14px;
          }
        }

        /* Spotlight Section */
        .spotlight-section-wrapper {
          display: flex;
          flex-direction: column;
          gap: 14px;
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

        .spotlight-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 680px) {
          .spotlight-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .spotlight-card {
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow var(--transition-fast);
        }

        @media (hover: hover) and (pointer: fine) {
          .spotlight-card:hover {
            box-shadow: var(--shadow-md);
          }
        }

        .spotlight-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .spotlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 4px 10px;
          background: #1D1D1F;
          color: #FFFFFF;
          border-radius: var(--radius-full);
        }

        .spotlight-badge-absent {
          background: #DC2626;
          color: #FFFFFF;
        }

        .spotlight-score-pill {
          font-size: 0.82rem;
          font-weight: 700;
          color: #059669;
          background: #ECFDF5;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          border: 1px solid #A7F3D0;
          white-space: nowrap;
        }

        .pill-absent-danger {
          color: #DC2626;
          background: #FEF2F2;
          border-color: rgba(220, 38, 38, 0.2);
        }

        .absent-avatar-highlight {
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.35);
        }

        .spotlight-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .table-avatar-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dashboard-crown {
          position: absolute;
          top: -8px;
          background: #1D1D1F;
          color: #FFFFFF;
          border: 1.5px solid #FFFFFF;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          box-shadow: var(--shadow-sm);
          pointer-events: none;
        }

        .first-place-avatar {
          border-radius: var(--radius-md);
          box-shadow: 0 0 12px rgba(255, 204, 0, 0.25);
        }

        .spotlight-avatar {
          width: 48px;
          height: 48px;
          font-size: 1.4rem;
          flex-shrink: 0;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .spotlight-info {
          flex: 1;
          min-width: 0;
        }

        .spotlight-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotlight-group {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin: 2px 0 0 0;
        }

        .spotlight-empty {
          padding: 8px 0;
        }

        .spotlight-empty-text {
          font-size: 0.84rem;
          color: var(--text-tertiary);
          margin: 0;
          font-style: italic;
        }

        /* Dashboard Dark Mode Styles */
        [data-theme="dark"] .stat-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .stat-icon {
          background: #202124;
          border-color: #3C4043;
          color: #8AB4F8;
        }

        [data-theme="dark"] .stat-toggle-btn {
          color: #9AA0A6;
        }

        [data-theme="dark"] .stat-toggle-btn:hover {
          color: #E8EAED;
        }

        [data-theme="dark"] .spotlight-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .spotlight-score-pill {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
          border-color: rgba(129, 201, 149, 0.3);
        }

        [data-theme="dark"] .pill-absent-danger {
          background: rgba(242, 139, 130, 0.15);
          color: #F28B82;
          border-color: rgba(242, 139, 130, 0.3);
        }

        [data-theme="dark"] .spotlight-badge {
          background: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .spotlight-avatar {
          border-color: rgba(255, 255, 255, 0.12);
        }

        [data-theme="dark"] .dashboard-crown {
          background: #202124;
          color: #FDD663;
          border-color: #3C4043;
        }

        [data-theme="dark"] .dashboard-today-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .dashboard-today-date {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .dashboard-today-count-pill {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .dashboard-today-count-pill.active {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
          border-color: rgba(129, 201, 149, 0.3);
        }

        [data-theme="dark"] .dashboard-today-view-all-btn {
          color: #8AB4F8;
        }

        [data-theme="dark"] .dashboard-today-view-all-btn:hover {
          background: rgba(138, 180, 248, 0.1);
        }

        [data-theme="dark"] .dashboard-lesson-item {
          background: var(--card-bg-dark, #292A2D);
          border-color: var(--card-border-dark, #3C4043);
        }

        [data-theme="dark"] .dashboard-lesson-icon {
          background: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .dashboard-lesson-room {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .dashboard-today-empty {
          background: rgba(255, 255, 255, 0.02);
          border-color: #3C4043;
        }

        [data-theme="dark"] .dashboard-today-empty-icon {
          background: rgba(255, 255, 255, 0.04);
          color: #9AA0A6;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
