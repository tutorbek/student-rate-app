import React, { useState, useMemo } from 'react';
import { getStudentScore } from '../utils/db';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const Dashboard = ({ setActiveTab, onSelectGroup, groups = [], students = [], transactions = [] }) => {

  const [showGroupCount, setShowGroupCount] = useState(false);
  const [showStudentCount, setShowStudentCount] = useState(false);

  // Stats
  const totalGroups = groups.length;
  const totalStudents = students.length;
  const totalPoints = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const activeTransactionsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return transactions.filter(tx => new Date(tx.timestamp) >= sevenDaysAgo).length;
  }, [transactions]);

  // Find Spotlight: Last Week's Winner (Student)
  const lastWeekSpotlight = useMemo(() => {
    if (students.length === 0) return null;
    const scoredStudents = students.map(s => ({
      ...s,
      score: getStudentScore(transactions, s.id, 'lastWeek')
    })).filter(s => s.score > 0);

    if (scoredStudents.length === 0) return null;
    scoredStudents.sort((a, b) => b.score - a.score);
    const topScore = scoredStudents[0].score;
    const winners = scoredStudents.filter(s => s.score === topScore);

    if (winners.length === 1) {
      const topStudent = winners[0];
      const groupName = groups.find(g => g.id === topStudent.groupId)?.name || 'Guruhsiz';
      return {
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
        color: '#E7FF56',
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
        color: '#E7FF56',
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

  // Recent 10 transactions
  const recentActivities = useMemo(() => {
    return transactions.slice(0, 10).map(tx => {
      const student = students.find(s => s.id === tx.studentId);
      const groupName = student ? (groups.find(g => g.id === student.groupId)?.name || 'Guruhsiz') : '';
      return {
        ...tx,
        studentName: student ? student.name : 'O\'chirilgan talaba',
        studentEmoji: student ? student.emoji : '❓',
        studentColor: student ? student.color : '#8e8e93',
        groupId: student ? student.groupId : null,
        groupName
      };
    });
  }, [transactions, students, groups]);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Umumiy ko'rsatkichlar va o'tgan davr peshqadamlari</p>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-label-row">
              <h4 className="stat-label">Guruhlar</h4>
              <button
                type="button"
                className="stat-toggle-btn"
                onClick={() => setShowGroupCount(!showGroupCount)}
                title={showGroupCount ? "Yashirish" : "Ko'rsatish"}
              >
                {showGroupCount ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <div className="stat-label-row">
              <h4 className="stat-label">Talabalar</h4>
              <button
                type="button"
                className="stat-toggle-btn"
                onClick={() => setShowStudentCount(!showStudentCount)}
                title={showStudentCount ? "Yashirish" : "Ko'rsatish"}
              >
                {showStudentCount ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h4 className="stat-label">Jami Likelar</h4>
            <p className="stat-value">{totalPoints >= 0 ? `+${totalPoints}` : totalPoints}</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h4 className="stat-label">Haftalik Faollik</h4>
            <p className="stat-value">{activeTransactionsCount} ta baho</p>
          </div>
        </div>
      </section>

      {/* Spotlight & Recent Activity */}
      <div className="dashboard-content-layout">
        {/* Spotlight Section */}
        <section className="spotlight-section">
          <h3 className="section-title">🏆 O'tgan Davr Qahramonlari</h3>
          <div className="spotlight-list">
            {/* Last Week's Winner */}
            <div className="glass-card spotlight-card-compact">
              <div className="spotlight-header-row">
                <span className="spotlight-badge badge-last-week">🏆 O'TGAN HAFTALIK G'OLIB</span>
              </div>
              {lastWeekSpotlight ? (
                <div className="spotlight-body-row">
                  <div className="avatar-circle spotlight-avatar-sm" style={{ background: lastWeekSpotlight.color, overflow: 'hidden' }}>
                    {renderAvatar(lastWeekSpotlight.emoji)}
                  </div>
                  <div className="spotlight-info">
                    <h4 className="spotlight-name-sm">{lastWeekSpotlight.name}</h4>
                    <p className="spotlight-group-sm">{lastWeekSpotlight.groupName}</p>
                  </div>
                  <div className="spotlight-score-pill">+{lastWeekSpotlight.score} Likelar</div>
                </div>
              ) : (
                <div className="spotlight-empty-sm">
                  <p className="empty-text-sm">O'tgan haftada hech kim like olmagan.</p>
                </div>
              )}
            </div>

            {/* Last Month's Winner */}
            <div className="glass-card spotlight-card-compact">
              <div className="spotlight-header-row">
                <span className="spotlight-badge badge-week">🥇 O'TGAN OY G'OLIBI</span>
              </div>
              {lastMonthSpotlight ? (
                <div className="spotlight-body-row">
                  <div className="avatar-circle spotlight-avatar-sm" style={{ background: lastMonthSpotlight.color, overflow: 'hidden' }}>
                    {renderAvatar(lastMonthSpotlight.emoji)}
                  </div>
                  <div className="spotlight-info">
                    <h4 className="spotlight-name-sm">{lastMonthSpotlight.name}</h4>
                    <p className="spotlight-group-sm">{lastMonthSpotlight.groupName}</p>
                  </div>
                  <div className="spotlight-score-pill">+{lastMonthSpotlight.score} Likelar</div>
                </div>
              ) : (
                <div className="spotlight-empty-sm">
                  <p className="empty-text-sm">O'tgan oyda hech kim like olmagan.</p>
                </div>
              )}
            </div>

            {/* Last Month's Winner Group */}
            <div className="glass-card spotlight-card-compact">
              <div className="spotlight-header-row">
                <span className="spotlight-badge badge-month">🏢 O'TGAN OY G'OLIB GURUHI</span>
              </div>
              {lastMonthGroupSpotlight ? (
                <div className="spotlight-body-row">
                  <div className="avatar-circle spotlight-avatar-sm" style={{ background: '#ffffff', border: '1px solid #000000', overflow: 'hidden' }}>
                    {renderAvatar(lastMonthGroupSpotlight.emoji)}
                  </div>
                  <div className="spotlight-info">
                    <h4 className="spotlight-name-sm">{lastMonthGroupSpotlight.name}</h4>
                    <p className="spotlight-group-sm">Guruh umumiy natijasi</p>
                  </div>
                  <div className="spotlight-score-pill">+{lastMonthGroupSpotlight.score} Likelar</div>
                </div>
              ) : (
                <div className="spotlight-empty-sm">
                  <p className="empty-text-sm">O'tgan oyda hech bir guruh like olmagan.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Activity Log */}
        <section className="activity-section">
          <h3 className="section-title">⚡ Oxirgi harakatlar</h3>
          <div className="glass-card activity-log-card">
            {recentActivities.length > 0 ? (
              <div className="activity-list">
                {recentActivities.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="activity-item"
                  >
                    <div className="avatar-circle activity-avatar" style={{ background: tx.studentColor, width: 36, height: 36, fontSize: '1.1rem', overflow: 'hidden' }}>
                      {renderAvatar(tx.studentEmoji)}
                    </div>
                    <div className="activity-details">
                      <div className="activity-row">
                        <span className="activity-student">{tx.studentName}</span>
                        <span className={`activity-amount ${tx.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </div>
                      <div className="activity-subrow">
                        <span className="activity-group">{tx.groupName}</span>
                        <span className="activity-time">{new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      {tx.comment && <div className="activity-comment">"{tx.comment}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-log">
                <p>Hozircha harakatlar tarixi bo'sh.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .dashboard-container {
          animation: fade-in 0.4s ease-out;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 3px 3px 0px #000000;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          background: #ffffff;
          border: 1px solid #000000;
          flex-shrink: 0;
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
          font-size: 0.72rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-toggle-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .stat-toggle-btn:hover {
          opacity: 1;
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: 800;
          margin-top: 2px;
          color: #000000;
          line-height: 1.1;
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .stat-card {
            padding: 10px 12px;
            gap: 10px;
            box-shadow: 2px 2px 0px #000000;
          }

          .stat-icon {
            width: 34px;
            height: 34px;
            font-size: 1rem;
          }

          .stat-label {
            font-size: 0.68rem;
          }

          .stat-value {
            font-size: 1.15rem;
          }
        }

        .dashboard-content-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-content-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .activity-section {
            display: none;
          }
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 800;
          margin-bottom: 16px;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: -0.3px;
        }

        .spotlight-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .spotlight-card-compact {
          padding: 12px 16px;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 3px 3px 0px #000000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .spotlight-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .spotlight-badge {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border: 1px solid #000000;
          text-transform: uppercase;
        }

        .badge-last-week {
          background: #000000;
          color: #E7FF56;
        }

        .badge-week {
          background: #E7FF56;
          color: #000000;
        }

        .badge-month {
          background: #ffffff;
          color: #000000;
        }

        .spotlight-body-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .spotlight-avatar-sm {
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
          flex-shrink: 0;
          border: 1.5px solid #000000;
        }

        .spotlight-info {
          flex: 1;
          min-width: 0;
        }

        .spotlight-name-sm {
          font-size: 0.95rem;
          font-weight: 800;
          color: #000000;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spotlight-group-sm {
          font-size: 0.78rem;
          color: #555555;
          margin: 2px 0 0 0;
          font-weight: 600;
        }

        .spotlight-score-pill {
          font-size: 0.85rem;
          font-weight: 800;
          color: #000000;
          background: #E7FF56;
          padding: 4px 10px;
          border: 1.5px solid #000000;
          white-space: nowrap;
        }

        .spotlight-empty-sm {
          padding: 4px 0;
        }

        .empty-text-sm {
          font-size: 0.8rem;
          color: #777777;
          margin: 0;
          font-style: italic;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .empty-text {
          font-size: 0.85rem;
          color: #000000;
        }

        /* Activity Log */
        .activity-log-card {
          padding: 24px;
          height: 480px;      /* Fixed height for stability */
          overflow-y: auto;   /* Internal scroll */
          border: 1px solid #000000;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid #000000;
        }


        .activity-item:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .activity-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .activity-student {
          font-weight: 700;
          font-size: 0.95rem;
          color: #000000;
        }

        .activity-amount {
          font-weight: 800;
          font-size: 0.95rem;
        }

        .text-positive {
          color: #000000;
        }

        .text-negative {
          color: #000000;
          text-decoration: line-through;
        }

        .activity-subrow {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #000000;
          opacity: 0.6;
          margin-top: 2px;
        }

        .activity-comment {
          font-size: 0.85rem;
          color: #000000;
          font-style: italic;
          margin-top: 6px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 0;
          display: inline-block;
          border-left: 2px solid #000000;
        }

        .empty-log {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 250px;
          color: #000000;
          opacity: 0.6;
          gap: 16px;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
