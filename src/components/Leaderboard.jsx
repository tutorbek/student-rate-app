import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getStudentScore } from '../utils/db';

const Confetti = ({ trigger }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const colors = [
      '#FF2D55', '#FF9500', '#FFCC00', '#4CD964', 
      '#5AC8FA', '#007AFF', '#5856D6', '#E7FF56'
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = () => {
      const fromLeft = Math.random() > 0.5;
      return {
        x: fromLeft ? -10 : canvas.width + 10,
        y: canvas.height * (0.6 + Math.random() * 0.25),
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (fromLeft ? 1 : -1) * (Math.random() * 12 + 10),
        speedY: -(Math.random() * 18 + 12),
        gravity: 0.35,
        friction: 0.985,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
        opacity: 1
      };
    };

    // Shoot particles!
    for (let i = 0; i < 120; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let alive = false;
      particles.forEach((p) => {
        if (p.opacity <= 0) return;

        p.speedX *= p.friction;
        p.speedY += p.gravity;
        p.speedY *= p.friction;
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        if (p.y > canvas.height * 0.4) {
          p.opacity -= 0.012;
        }

        if (p.opacity > 0 && p.x >= -100 && p.x <= canvas.width + 100 && p.y <= canvas.height + 100) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          
          if (Math.random() > 0.5) {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const Leaderboard = ({ groups, students, transactions, userRole, onDeleteTransaction, showToast }) => {
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'lastWeek', 'month', 'lastMonth', 'all'
  
  // If student, select their first group automatically, otherwise default to 'all'
  const initialGroupId = useMemo(() => {
    if (userRole === 'student' && groups.length > 0) {
      return groups[0].id;
    }
    return 'all';
  }, [userRole, groups]);

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);

  // Keep selectedGroupId in sync if initialGroupId changes (e.g. when groups load dynamically)
  useEffect(() => {
    setSelectedGroupId(initialGroupId);
  }, [initialGroupId]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [profileStudent, setSelectedProfileStudent] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.custom-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedProfileStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter transactions for profile student
  const studentTxs = useMemo(() => {
    if (!profileStudent) return [];
    return transactions.filter(t => t.studentId === profileStudent.id);
  }, [transactions, profileStudent]);

  // Compute standings
  const standings = useMemo(() => {
    const data = students
      .filter((s) => selectedGroupId === 'all' || s.groupId === selectedGroupId)
      .map((s) => {
        const score = getStudentScore(transactions, s.id, timeframe);
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

  // Get only 1st place(s) for podium
  const firstPlaces = useMemo(() => {
    return standings.filter((s) => s.rank === 1);
  }, [standings]);

  const hasAnyPoints = useMemo(() => {
    return standings.some((s) => s.score !== 0);
  }, [standings]);

  useEffect(() => {
    if (hasAnyPoints) {
      setConfettiTrigger((prev) => prev + 1);
    }
  }, [timeframe, selectedGroupId, hasAnyPoints]);

  return (
    <div className="leaderboard-container">
      <Confetti trigger={confettiTrigger} />
      <div className="page-header flex-col-mobile">
        <div>
          <h2 className="page-title">Leaderboard</h2>
          <p className="page-subtitle">Haftalik, oylik va umumiy reyting natijalari</p>
        </div>

        {/* Filters */}
        <div className="leaderboard-filters">
          {!(userRole === 'student' && groups.length === 1) && (
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
                    {userRole !== 'student' && (
                      <div 
                        className={`custom-dropdown-item ${selectedGroupId === 'all' ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedGroupId('all');
                          setIsDropdownOpen(false);
                        }}
                      >
                        Barcha guruhlar
                      </div>
                    )}
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
          )}
          {userRole === 'student' && groups.length === 1 && (
            <div className="filter-group">
              <div className="student-group-static-label">
                👥 {groups[0].name}
              </div>
            </div>
          )}

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
              className={`toggle-btn ${timeframe === 'lastMonth' ? 'active' : ''}`}
              onClick={() => setTimeframe('lastMonth')}
            >
              O'tgan oy
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
          {hasAnyPoints && (
            <div className="podium-wrapper">
              <div className="podium-container-horizontal">
                {firstPlaces.map((student) => (
                  <div 
                    key={student.id} 
                    className="premium-podium-card glass"
                    onClick={() => {
                      setConfettiTrigger(prev => prev + 1);
                      setSelectedProfileStudent(student);
                    }}
                    title="Batafsil profilni ko'rish / Tabriklash 🎉"
                  >
                    <div className="podium-crown-container">
                      <span className="premium-crown">👑</span>
                      <div className="avatar-circle podium-avatar first-place-avatar" style={{ background: student.color, overflow: 'hidden' }}>
                        {renderAvatar(student.emoji)}
                      </div>
                    </div>
                    <div className="podium-details-horizontal">
                      <h4 className="podium-name">{student.name}</h4>
                      <p className="podium-group">{student.groupName}</p>
                    </div>
                    <div className="podium-score-badge">
                      +{student.score} Likelar
                    </div>
                  </div>
                ))}
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
                  <div 
                    key={student.id} 
                    className={`standings-row ${isTop3 ? 'row-top3' : ''} clickable-row`}
                    onClick={() => setSelectedProfileStudent(student)}
                    title="Batafsil profilni ko'rish"
                  >
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

      {profileStudent && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedProfileStudent(null)}>
          <div className="modal-content glass profile-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setSelectedProfileStudent(null)}
              title="Yopish"
            >
              ✕
            </button>
            {/* Profile Header */}
            <div className="profile-modal-header">
              <div className="avatar-circle profile-avatar" style={{ background: profileStudent.color, overflow: 'hidden' }}>
                {renderAvatar(profileStudent.emoji)}
              </div>
              <h3 className="profile-modal-name">{profileStudent.name}</h3>
              <p className="profile-modal-group">{(groups.find(g => g.id === profileStudent.groupId)?.name || 'Guruhsiz')} Guruhi</p>
            </div>

            {/* Profile Stats Grid */}
            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'week')}</span>
                <span className="profile-stat-lbl">Yangi hafta</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'lastWeek')}</span>
                <span className="profile-stat-lbl">O'tgan hafta</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'month')}</span>
                <span className="profile-stat-lbl">Oylik</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'lastMonth')}</span>
                <span className="profile-stat-lbl">O'tgan Oy</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'all')}</span>
                <span className="profile-stat-lbl">Kurs</span>
              </div>
            </div>

            {/* Timeline / History */}
            <div className="profile-timeline-section">
              <h4 className="profile-timeline-title">📜 Baholash Tarixi</h4>
              <div className="profile-timeline-list">
                {studentTxs.length > 0 ? (
                  studentTxs.map((tx) => {
                    const date = new Date(tx.timestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={tx.id} className="profile-timeline-item">
                        <div className="profile-timeline-item-meta">
                          <span className="profile-timeline-time">{formattedDate}</span>
                          <span className="profile-timeline-amount font-bold">
                            {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                          </span>
                        </div>
                        <div className="profile-timeline-item-body">
                          <span className="profile-timeline-comment">
                            {tx.comment ? `"${tx.comment}"` : '—'}
                          </span>
                          {userRole === 'teacher' && (
                            <button
                              className="profile-timeline-item-delete scale-active"
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                if (showToast) {
                                  showToast("Baholash harakati bekor qilindi!", "success");
                                }
                              }}
                              title="Bahoni o'chirish"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="profile-timeline-empty">Hozircha baholash tarixi mavjud emas.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setSelectedProfileStudent(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .leaderboard-container {
          animation: fade-in 0.4s ease-out;
        }

        .clickable-row {
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .clickable-row:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        /* Profile Modal styles */
        .profile-modal {
          max-width: 500px;
        }

        .profile-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          border-bottom: 2px solid #000000;
          padding-bottom: 20px;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .profile-modal-name {
          font-size: 1.4rem;
          font-weight: 800;
          color: #000000;
          text-transform: uppercase;
        }

        .profile-modal-group {
          font-size: 0.85rem;
          font-weight: 700;
          color: #000000;
          opacity: 0.6;
          text-transform: uppercase;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        .profile-stat-box {
          border: 1px solid #000000;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #ffffff;
        }

        .profile-stat-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: #000000;
        }

        .profile-stat-lbl {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #000000;
          opacity: 0.6;
          margin-top: 4px;
        }

        .profile-timeline-section {
          margin-bottom: 24px;
        }

        .profile-timeline-title {
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 12px;
          color: #000000;
        }

        .profile-timeline-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #000000;
          background: #ffffff;
        }

        .profile-timeline-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          border-bottom: 1px solid #000000;
        }

        .profile-timeline-item:last-child {
          border-bottom: none;
        }

        .profile-timeline-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #000000;
          opacity: 0.6;
        }

        .profile-timeline-item-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .profile-timeline-comment {
          font-size: 0.9rem;
          font-style: italic;
          color: #000000;
          font-weight: 600;
        }

        .profile-timeline-item-delete {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: transform var(--transition-fast);
          padding: 2px 6px;
        }

        .profile-timeline-item-delete:hover {
          transform: scale(1.2);
          background: #E7FF56;
        }

        .profile-timeline-empty {
          padding: 30px;
          text-align: center;
          font-size: 0.9rem;
          color: #000000;
          opacity: 0.5;
        }

        @media (max-width: 600px) {
          .profile-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
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
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE/Edge */
        }

        .timeframe-toggle::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .toggle-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-family);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .student-group-static-label {
          background: #000000;
          color: #E7FF56;
          border: 2px solid #000000;
          padding: 10px 18px;
          font-family: var(--font-family);
          font-size: 0.95rem;
          font-weight: 800;
          text-transform: uppercase;
          box-shadow: 4px 4px 0px #000000;
          display: inline-flex;
          align-items: center;
          gap: 8px;
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
          margin: 30px 0 40px 0;
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .podium-container-horizontal {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 1200px;
          padding: 10px;
          z-index: 2;
          position: relative;
        }

        /* Extra Compact Premium Podium Card */
        .premium-podium-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: #ffffff;
          border: 3px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          position: relative;
          min-width: 240px;
          max-width: 320px;
          width: 100%;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
        }

        .premium-podium-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #000000;
          background: #E7FF56;
        }

        .podium-crown-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .premium-crown {
          position: absolute;
          top: -15px;
          font-size: 1.6rem;
          z-index: 10;
          filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.2));
          animation: crown-float 2s ease-in-out infinite alternate;
        }

        @keyframes crown-float {
          0% { transform: translateY(0) rotate(-3deg); }
          100% { transform: translateY(-4px) rotate(3deg); }
        }

        .podium-avatar {
          position: relative;
          width: 36px;
          height: 36px;
          font-size: 1.2rem;
        }

        .first-place-avatar {
          width: 42px;
          height: 42px;
          font-size: 1.3rem;
          box-shadow: 0 0 10px rgba(255, 204, 0, 0.2);
          border: 2px solid #000000;
        }

        .podium-details-horizontal {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .podium-details-horizontal .podium-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #000000;
          margin: 0;
        }

        .podium-details-horizontal .podium-group {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.6);
          margin: 0;
        }

        .podium-score-badge {
          background: #000000;
          color: #E7FF56;
          font-size: 0.9rem;
          font-weight: 900;
          padding: 4px 10px;
          border: 2px solid #000000;
          box-shadow: 1px 1px 0px #000000;
          white-space: nowrap;
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

          .toggle-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
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
