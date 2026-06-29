import React, { useState, useMemo, useEffect } from 'react';
import { getStudentScore } from '../utils/db';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const Leaderboard = ({ groups, students, transactions }) => {
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'all'
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.custom-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Compute standings
  const standings = useMemo(() => {
    const data = students
      .filter((s) => selectedGroupId === 'all' || s.groupId === selectedGroupId)
      .map((s) => {
        const score = getStudentScore(s.id, timeframe);
        const groupName = groups.find((g) => g.id === s.groupId)?.name || 'Guruhsiz';
        return {
          ...s,
          score,
          groupName,
        };
      });

    // Sort: 1. Score descending, 2. Name ascending
    const sorted = data.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    // Assign dense rank
    let currentRank = 0;
    let lastScore = null;
    return sorted.map((student) => {
      if (student.score !== lastScore) {
        currentRank += 1;
        lastScore = student.score;
      }
      return {
        ...student,
        rank: currentRank,
      };
    });
  }, [students, groups, timeframe, selectedGroupId, transactions]);

  // Separate Top 3 from the rest
  const topThree = useMemo(() => {
    const list = standings.slice(0, 3);
    // Arrange in order: 2nd place, 1st place, 3rd place for podium display
    const podium = [null, null, null]; // [2nd, 1st, 3rd]
    if (list[0]) podium[1] = { ...list[0] };
    if (list[1]) podium[0] = { ...list[1] };
    if (list[2]) podium[2] = { ...list[2] };
    return podium;
  }, [standings]);

  const hasAnyPoints = useMemo(() => {
    return standings.some((s) => s.score !== 0);
  }, [standings]);

  return (
    <div className="leaderboard-container">
      <div className="page-header flex-col-mobile">
        <div>
          <h2 className="page-title">Leaderboard</h2>
          <p className="page-subtitle">Haftalik, oylik va umumiy reyting natijalari</p>
        </div>

        {/* Filters */}
        <div className="leaderboard-filters">
          <div className="filter-group">
            <div className="custom-dropdown-container">
              <button 
                type="button" 
                className="filter-select-btn" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{selectedGroupId === 'all' ? 'Barcha guruhlar' : (groups.find(g => g.id === selectedGroupId)?.name || 'Guruhsiz')}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {isDropdownOpen && (
                <div className="custom-dropdown-list glass">
                  <div 
                    className={`custom-dropdown-item ${selectedGroupId === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedGroupId('all');
                      setIsDropdownOpen(false);
                    }}
                  >
                    Barcha guruhlar
                  </div>
                  {groups.map((g) => (
                    <div 
                      key={g.id} 
                      className={`custom-dropdown-item ${selectedGroupId === g.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {g.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="timeframe-toggle glass">
            <button
              className={`toggle-btn ${timeframe === 'week' ? 'active' : ''}`}
              onClick={() => setTimeframe('week')}
            >
              Yangi hafta
            </button>
            <button
              className={`toggle-btn ${timeframe === 'lastWeek' ? 'active' : ''}`}
              onClick={() => setTimeframe('lastWeek')}
            >
              O'tgan hafta
            </button>
            <button
              className={`toggle-btn ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => setTimeframe('month')}
            >
              Oylik
            </button>
            <button
              className={`toggle-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              Kurs
            </button>
          </div>
        </div>
      </div>

      {standings.length > 0 ? (
        <>
          {/* Podium for Top 3 */}
          {hasAnyPoints && (
            <div className="podium-wrapper">
              <div className="podium-container">
                {/* 2nd Place */}
                {topThree[0] && (
                  <div className="podium-spot spot-2">
                    <div className="avatar-circle podium-avatar" style={{ background: topThree[0].color, overflow: 'hidden' }}>
                      {renderAvatar(topThree[0].emoji)}
                      <span className={`rank-badge rank-${topThree[0].rank}`}>{topThree[0].rank}</span>
                    </div>
                    <div className="podium-details">
                      <h4 className="podium-name">{topThree[0].name}</h4>
                      <p className="podium-group">{topThree[0].groupName}</p>
                    </div>
                    <div className="podium-bar bar-2">
                      <span className="podium-score">+{topThree[0].score}</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[1] && (
                  <div className="podium-spot spot-1">
                    <div className="podium-crown">👑</div>
                    <div className="avatar-circle podium-avatar first-place-avatar" style={{ background: topThree[1].color, overflow: 'hidden' }}>
                      {renderAvatar(topThree[1].emoji)}
                      <span className={`rank-badge rank-${topThree[1].rank}`}>{topThree[1].rank}</span>
                    </div>
                    <div className="podium-details">
                      <h4 className="podium-name">{topThree[1].name}</h4>
                      <p className="podium-group">{topThree[1].groupName}</p>
                    </div>
                    <div className="podium-bar bar-1">
                      <span className="podium-score">+{topThree[1].score}</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="podium-spot spot-3">
                    <div className="avatar-circle podium-avatar" style={{ background: topThree[2].color, overflow: 'hidden' }}>
                      {renderAvatar(topThree[2].emoji)}
                      <span className={`rank-badge rank-${topThree[2].rank}`}>{topThree[2].rank}</span>
                    </div>
                    <div className="podium-details">
                      <h4 className="podium-name">{topThree[2].name}</h4>
                      <p className="podium-group">{topThree[2].groupName}</p>
                    </div>
                    <div className="podium-bar bar-3">
                      <span className="podium-score">+{topThree[2].score}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standings List */}
          <div className="glass-card standings-card">
            <div className="standings-header">
              <span className="th-rank">O'rin</span>
              <span className="th-student">Talaba</span>
              <span className="th-group">Guruh</span>
              <span className="th-score text-right">Likelar</span>
            </div>
            <div className="standings-body">
              {standings.map((student) => {
                const rank = student.rank;
                const isTop3 = rank <= 3 && hasAnyPoints;
                return (
                  <div key={student.id} className={`standings-row ${isTop3 ? 'row-top3' : ''}`}>
                    <span className="td-rank">
                      {isTop3 ? (
                        rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
                      ) : (
                        rank
                      )}
                    </span>
                    <span className="td-student">
                      <div className="avatar-circle table-avatar" style={{ background: student.color, width: 32, height: 32, fontSize: '1rem', overflow: 'hidden' }}>
                        {renderAvatar(student.emoji)}
                      </div>
                      <div className="student-info-meta">
                        <span className="student-table-name">{student.name}</span>
                        <span className="student-mobile-group">{student.groupName}</span>
                      </div>
                    </span>
                    <span className="td-group">{student.groupName}</span>
                    <span className={`td-score text-right font-bold ${student.score >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {student.score >= 0 ? `+${student.score}` : student.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card empty-leaderboard-placeholder">
          <div className="placeholder-icon">🏆</div>
          <h3>Reyting natijalari bo'sh</h3>
          <p>Tanlangan guruhda talabalar mavjud emas.</p>
        </div>
      )}

      <style>{`
        .leaderboard-container {
          animation: fade-in 0.4s ease-out;
        }

        .flex-col-mobile {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .flex-col-mobile {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .leaderboard-filters {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        @media (max-width: 600px) {
          .leaderboard-filters {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .custom-dropdown-container {
          position: relative;
          width: 200px;
        }

        .filter-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #000000;
          padding: 10px 14px;
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 0.95rem;
          font-weight: 700;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .filter-select-btn:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .dropdown-arrow {
          font-size: 0.65rem;
          margin-left: 8px;
          transition: transform var(--transition-fast);
        }

        .custom-dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          max-height: 180px;
          overflow-y: auto;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          z-index: 100;
          margin-top: 4px;
          border-radius: 0;
        }

        .custom-dropdown-item {
          padding: 10px 14px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          color: #000000;
          transition: all var(--transition-fast);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .custom-dropdown-item:last-child {
          border-bottom: none;
        }

        .custom-dropdown-item:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .custom-dropdown-item.active {
          background: #000000;
          color: #ffffff;
        }

        .custom-dropdown-item.active:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .timeframe-toggle {
          display: flex;
          padding: 4px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
        }

        .toggle-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .toggle-btn:hover {
          background: #E7FF56;
          color: #000000;
          border: 1px solid #000000;
        }

        .toggle-btn.active {
          background: #E7FF56;
          color: #000000;
          border: 1px solid #000000;
          box-shadow: var(--shadow-sm);
        }

        /* Podium styles */
        .podium-wrapper {
          display: flex;
          justify-content: center;
          margin: 40px 0 50px 0;
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .podium-container {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 16px;
          width: 100%;
          max-width: 650px;
          height: 300px;
          padding-bottom: 10px;
        }

        .podium-spot {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
        }

        .podium-avatar {
          position: relative;
          width: 56px;
          height: 56px;
          font-size: 1.8rem;
          margin-bottom: 12px;
        }

        .first-place-avatar {
          width: 72px;
          height: 72px;
          font-size: 2.2rem;
          box-shadow: 0 0 20px rgba(255, 204, 0, 0.3);
          border: 2px solid var(--apple-yellow);
        }

        .rank-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: #fff;
          border: 2px solid var(--bg-primary);
        }

        .rank-1 { background: #E35336; color: #ffffff; border: 2px solid #000000; }
        .rank-2 { background: #F4A460; color: #000000; border: 2px solid #000000; }
        .rank-3 { background: #A0522D; color: #ffffff; border: 2px solid #000000; }

        .podium-crown {
          display: none;
        }

        .podium-details {
          text-align: center;
          margin-bottom: 10px;
          max-width: 140px;
        }

        .podium-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #000000;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .podium-group {
          font-size: 0.75rem;
          color: #000000;
          margin-top: 2px;
          font-weight: 500;
        }

        .podium-bar {
          width: 100%;
          border-radius: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 16px;
          position: relative;
          overflow: hidden;
          border: 2px solid #000000;
        }

        .bar-1 {
          height: 160px;
          background: #E35336;
        }

        .bar-2 {
          height: 110px;
          background: #F4A460;
        }

        .bar-3 {
          height: 80px;
          background: #A0522D;
        }

        .bar-1 .podium-score {
          color: #ffffff;
          text-shadow: 1px 1px 0px #000000;
        }

        .bar-2 .podium-score {
          color: #000000;
        }

        .bar-3 .podium-score {
          color: #ffffff;
          text-shadow: 1px 1px 0px #000000;
        }

        .podium-score {
          font-size: 1.1rem;
          font-weight: 800;
        }

        /* Standings Table */
        .standings-card {
          padding: 10px 24px;
          overflow-x: auto;
        }

        .standings-header {
          display: grid;
          grid-template-columns: 80px 2fr 1.5fr 1fr;
          padding: 18px 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .standings-row {
          display: grid;
          grid-template-columns: 80px 2fr 1.5fr 1fr;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-color);
          align-items: center;
          font-size: 0.95rem;
          transition: background var(--transition-fast);
        }

        .standings-row:last-child {
          border-bottom: none;
        }

        .row-top3 {
          background: rgba(255, 255, 255, 0.01);
        }

        .td-rank {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-secondary);
          padding-left: 8px;
        }

        .td-student {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .student-info-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .student-table-name {
          font-weight: 700;
          color: #000000;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .student-mobile-group {
          display: none;
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .td-group {
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .text-right {
          text-align: right;
        }

        .font-bold {
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .standings-card {
            padding: 8px 12px;
            overflow-x: visible;
          }

          .standings-header {
            grid-template-columns: 48px 1fr 70px;
            padding: 12px 0;
          }

          .standings-row {
            grid-template-columns: 48px 1fr 70px;
            padding: 12px 0;
          }

          .th-group, .td-group {
            display: none;
          }

          .student-mobile-group {
            display: block;
          }

          .td-rank {
            font-size: 0.95rem;
            padding-left: 4px;
          }

          .student-table-name {
            font-size: 0.9rem;
            white-space: normal;
            word-break: break-word;
          }

          .student-mobile-group {
            white-space: normal;
            word-break: break-word;
          }

          .td-student {
            gap: 8px;
          }
        }

        .empty-leaderboard-placeholder {
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        @media (max-width: 480px) {
          .podium-container {
            height: 240px;
            gap: 8px;
          }
          .bar-1 { height: 120px; }
          .bar-2 { height: 85px; }
          .bar-3 { height: 60px; }
          .podium-avatar {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
          }
          .first-place-avatar {
            width: 60px;
            height: 60px;
            font-size: 1.8rem;
          }
          .podium-name {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
