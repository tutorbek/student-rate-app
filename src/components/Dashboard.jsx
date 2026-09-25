import React, { useState, useMemo } from 'react';
import { getStudentScore, getGroupCategory } from '../utils/db';
import { renderGroupIcon } from '../utils/groupIcons';
import { renderAvatar } from '../utils/studentAvatars';
import { calculateStudentAttendanceStats } from '../utils/attendanceUtils';
import ProjectLikeIcon from './common/ProjectLikeIcon';

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

const Dashboard = ({ setActiveTab, onSelectGroup, onOpenSchedule, groups = [], students = [], transactions = [], attendance = [] }) => {
  const [showGroupCount, setShowGroupCount] = useState(false);
  const [showStudentCount, setShowStudentCount] = useState(false);

  // Stats
  const totalGroups = groups.length;
  const totalStudents = students.length;

  const groupCategoryMap = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      map[g.id] = getGroupCategory(g);
    });
    return map;
  }, [groups]);

  const kidsStudentsCount = useMemo(() => {
    return students.filter((s) => !s.deleted && groupCategoryMap[s.groupId] === 'kids').length;
  }, [students, groupCategoryMap]);

  const teensStudentsCount = useMemo(() => {
    return students.filter((s) => !s.deleted && groupCategoryMap[s.groupId] !== 'kids').length;
  }, [students, groupCategoryMap]);

  const kidsGroupsCount = useMemo(() => {
    return groups.filter((g) => getGroupCategory(g) === 'kids').length;
  }, [groups]);

  const teensGroupsCount = useMemo(() => {
    return groups.filter((g) => getGroupCategory(g) !== 'kids').length;
  }, [groups]);

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
            <div className="stat-value-container">
              <p className="stat-value">{showGroupCount ? totalGroups : '••••'}</p>
              <div className="stat-category-pills">
                <span className="stat-cat-pill stat-cat-kids">
                  Kids: {showGroupCount ? kidsGroupsCount : '••'}
                </span>
                <span className="stat-cat-pill stat-cat-teens">
                  Teens: {showGroupCount ? teensGroupsCount : '••'}
                </span>
              </div>
            </div>
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
            <div className="stat-value-container">
              <p className="stat-value">{showStudentCount ? totalStudents : '••••'}</p>
              <div className="stat-category-pills">
                <span className="stat-cat-pill stat-cat-kids">
                  Kids: {showStudentCount ? kidsStudentsCount : '••'}
                </span>
                <span className="stat-cat-pill stat-cat-teens">
                  Teens: {showStudentCount ? teensStudentsCount : '••'}
                </span>
              </div>
            </div>
          </div>
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
                <span className="spotlight-score-pill">
                  <ProjectLikeIcon size={14} />
                  <span>+{thisMonthSpotlight.score} Like</span>
                </span>
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
                <p className="spotlight-empty-text">Bu oyda hali hech kim Like olmagan.</p>
              </div>
            )}
          </div>

          {/* Last Month's Winner (Student) */}
          <div className="glass-card spotlight-card">
            <div className="spotlight-header-row">
              <span className="spotlight-badge">O'TGAN OY G'OLIBI</span>
              {lastMonthSpotlight && (
                <span className="spotlight-score-pill">
                  <ProjectLikeIcon size={14} />
                  <span>+{lastMonthSpotlight.score} Like</span>
                </span>
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
                <p className="spotlight-empty-text">O'tgan oyda hech kim Like olmagan.</p>
              </div>
            )}
          </div>

          {/* Last Month's Winner Group */}
          <div className="glass-card spotlight-card">
            <div className="spotlight-header-row">
              <span className="spotlight-badge">O'TGAN OY G'OLIB GURUHI</span>
              {lastMonthGroupSpotlight && (
                <span className="spotlight-score-pill">
                  <ProjectLikeIcon size={14} />
                  <span>+{lastMonthGroupSpotlight.score} Like</span>
                </span>
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
                <p className="spotlight-empty-text">O'tgan oyda hech bir guruh Like olmagan.</p>
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
          grid-template-columns: repeat(2, 1fr);
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

        .stat-value-container {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .stat-value {
          font-size: 1.45rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .stat-category-pills {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .stat-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full, 9999px);
          user-select: none;
          line-height: 1.25;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .stat-cat-pill.stat-cat-kids {
          background: rgba(255, 149, 0, 0.12);
          color: #d97706;
          border: 1px solid rgba(255, 149, 0, 0.28);
        }

        .stat-cat-pill.stat-cat-teens {
          background: rgba(88, 86, 214, 0.12);
          color: #4f46e5;
          border: 1px solid rgba(88, 86, 214, 0.28);
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
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

          .stat-cat-pill {
            font-size: 0.68rem;
            padding: 2px 6px;
          }

          .stat-label {
            font-size: 0.74rem;
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
          display: inline-flex;
          align-items: center;
          gap: 4px;
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

        [data-theme="dark"] .stat-cat-pill.stat-cat-kids {
          background: rgba(255, 159, 10, 0.16);
          color: #fbbf24;
          border-color: rgba(255, 159, 10, 0.35);
        }

        [data-theme="dark"] .stat-cat-pill.stat-cat-teens {
          background: rgba(99, 102, 241, 0.16);
          color: #a5b4fc;
          border-color: rgba(99, 102, 241, 0.35);
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
