import React, { useMemo } from 'react';
import { getStudentScore } from '../utils/db';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const Dashboard = ({ setActiveTab, onSelectGroup, groups = [], students = [], transactions = [] }) => {

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
            <h4 className="stat-label">Guruhlar</h4>
            <p className="stat-value">{totalGroups}</p>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <h4 className="stat-label">Talabalar</h4>
            <p className="stat-value">{totalStudents}</p>
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
          <div className="spotlight-grid">
            {/* Last Week's Winner */}
            <div className="glass-card spotlight-card last-week">
              <div className="spotlight-glow last-week-glow"></div>
              <div className="spotlight-badge badge-last-week">🏆 O'TGAN HAFTALIK G'OLIB</div>
              {lastWeekSpotlight ? (
                <div className="spotlight-user">
                  <div className="avatar-circle spotlight-avatar" style={{ background: lastWeekSpotlight.color, overflow: 'hidden' }}>
                    {renderAvatar(lastWeekSpotlight.emoji)}
                  </div>
                  <h4 className="spotlight-name" style={{ fontSize: lastWeekSpotlight.isTie ? '1rem' : '1.25rem' }}>{lastWeekSpotlight.name}</h4>
                  <p className="spotlight-group">{lastWeekSpotlight.groupName}</p>
                  <div className="spotlight-score">+{lastWeekSpotlight.score} Likelar</div>
                </div>
              ) : (
                <div className="spotlight-empty">
                  <div className="empty-icon">🏆</div>
                  <p className="empty-text">O'tgan haftada hech kim like olmagan.</p>
                </div>
              )}
            </div>

            {/* Last Month's Winner */}
            <div className="glass-card spotlight-card weekly">
              <div className="spotlight-glow weekly-glow"></div>
              <div className="spotlight-badge badge-week">🥇 O'TGAN OY G'OLIBI</div>
              {lastMonthSpotlight ? (
                <div className="spotlight-user">
                  <div className="avatar-circle spotlight-avatar" style={{ background: lastMonthSpotlight.color, overflow: 'hidden' }}>
                    {renderAvatar(lastMonthSpotlight.emoji)}
                  </div>
                  <h4 className="spotlight-name" style={{ fontSize: lastMonthSpotlight.isTie ? '1rem' : '1.25rem' }}>{lastMonthSpotlight.name}</h4>
                  <p className="spotlight-group">{lastMonthSpotlight.groupName}</p>
                  <div className="spotlight-score">+{lastMonthSpotlight.score} Likelar</div>
                </div>
              ) : (
                <div className="spotlight-empty">
                  <div className="empty-icon">🎖️</div>
                  <p className="empty-text">O'tgan oyda hech kim like olmagan.</p>
                </div>
              )}
            </div>

            {/* Last Month's Winner Group */}
            <div className="glass-card spotlight-card monthly">
              <div className="spotlight-glow monthly-glow"></div>
              <div className="spotlight-badge badge-month">🏢 O'TGAN OY G'OLIB GURUHI</div>
              {lastMonthGroupSpotlight ? (
                <div className="spotlight-user">
                  <div className="avatar-circle spotlight-avatar" style={{ background: '#ffffff', border: '1px solid #000000', overflow: 'hidden' }}>
                    {renderAvatar(lastMonthGroupSpotlight.emoji)}
                  </div>
                  <h4 className="spotlight-name">{lastMonthGroupSpotlight.name}</h4>
                  <p className="spotlight-group">Guruh umumiy natijasi</p>
                  <div className="spotlight-score">+{lastMonthGroupSpotlight.score} Likelar</div>
                </div>
              ) : (
                <div className="spotlight-empty">
                  <div className="empty-icon">👑</div>
                  <p className="empty-text">O'tgan oyda hech bir guruh like olmagan.</p>
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
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-top: none;
          border-left: none;
          border-bottom: none;
          border-right: 2px solid #000000;
        }

        .stat-icon {
          width: 54px;
          height: 54px;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          background: #ffffff;
          border: 1px solid #000000;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          margin-top: 4px;
          color: #000000;
        }

        .dashboard-content-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
        }

        @media (max-width: 1100px) {
          .dashboard-content-layout {
            grid-template-columns: 1fr;
          }
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 800;
          margin-bottom: 20px;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: -0.3px;
        }

        .spotlight-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 1000px) {
          .spotlight-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .spotlight-grid {
            grid-template-columns: 1fr;
          }
        }

        .spotlight-card {
          position: relative;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          height: 480px;
          border: 1px solid #000000;
        }

        .spotlight-glow {
          display: none;
        }

        .spotlight-badge {
          position: relative;
          z-index: 1;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 4px 10px;
          border-radius: 0;
          margin-bottom: 24px;
          background: #ffffff;
          border: 1px solid #000000;
          color: #000000;
        }

        .badge-week {
          background: #ffffff;
          border: 1px solid #000000;
          color: #000000;
        }

        .badge-month {
          background: #ffffff;
          border: 1px solid #000000;
          color: #000000;
        }

        .badge-last-week {
          background: #000000;
          border: 1px solid #000000;
          color: #E7FF56;
          font-weight: 800;
        }

        .spotlight-user {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .spotlight-avatar {
          width: 72px;
          height: 72px;
          font-size: 2.2rem;
          margin-bottom: 16px;
        }

        .spotlight-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
        }

        .spotlight-group {
          font-size: 0.85rem;
          color: #000000;
          margin-top: 4px;
          font-weight: 500;
        }

        .spotlight-score {
          font-size: 1.1rem;
          font-weight: 800;
          color: #ffffff;
          background: #000000;
          padding: 6px 14px;
          border-radius: 0;
          margin-top: 18px;
          border: 1px solid #000000;
        }

        .spotlight-empty {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
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
