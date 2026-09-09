import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getStudentScore, getStartOfMonth, getStartOfLastMonth, getEndOfLastMonth } from '../utils/db';
import { renderAvatar } from '../utils/studentAvatars';

const IconTrophy = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconScroll = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M15 8h-5" />
    <path d="M15 12h-5" />
  </svg>
);

const IconCrown = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
  </svg>
);

const IconCalendar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconClock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const Leaderboard = ({
  groups = [],
  students = [],
  transactions = [],
  allActiveGroups,
  allActiveStudents,
  allActiveTransactions,
  userRole,
  onDeleteTransaction,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'history'
  const [timeframe, setTimeframe] = useState('month'); // 'month', 'lastMonth', 'all'
  
  const initialGroupId = useMemo(() => {
    if (userRole === 'student') {
      return 'top10_all';
    }
    return 'all';
  }, [userRole]);

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);
  const [selectedHistoryStudentId, setSelectedHistoryStudentId] = useState('all');

  useEffect(() => {
    setSelectedGroupId(initialGroupId);
  }, [initialGroupId]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryStudentDropdownOpen, setIsHistoryStudentDropdownOpen] = useState(false);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [profileStudent, setSelectedProfileStudent] = useState(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState(null);

  // Active pools (support all groups/students in student top 10 mode)
  const activeStudentsPool = useMemo(() => {
    if (userRole === 'student') {
      if (selectedGroupId === 'top10_all') {
        return (allActiveStudents && allActiveStudents.length > 0) ? allActiveStudents : students;
      }
      return students;
    }
    return students;
  }, [userRole, selectedGroupId, allActiveStudents, students]);

  const activeGroupsPool = useMemo(() => {
    if (userRole === 'student') {
      if (selectedGroupId === 'top10_all') {
        return (allActiveGroups && allActiveGroups.length > 0) ? allActiveGroups : groups;
      }
      return groups;
    }
    return groups;
  }, [userRole, selectedGroupId, allActiveGroups, groups]);

  const activeTransactionsPool = useMemo(() => {
    if (userRole === 'student') {
      if (selectedGroupId === 'top10_all') {
        return (allActiveTransactions && allActiveTransactions.length > 0) ? allActiveTransactions : transactions;
      }
      return transactions;
    }
    return transactions;
  }, [userRole, selectedGroupId, allActiveTransactions, transactions]);

  // Fast group lookup map O(G)
  const groupNameMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < activeGroupsPool.length; i++) {
      map.set(activeGroupsPool[i].id, activeGroupsPool[i].name);
    }
    return map;
  }, [activeGroupsPool]);

  // Fast pre-calculated scores map in O(T) single pass
  const studentScoreMap = useMemo(() => {
    const map = new Map();
    const startOfMonth = timeframe === 'month' ? getStartOfMonth() : null;
    const startOfLastMonth = timeframe === 'lastMonth' ? getStartOfLastMonth() : null;
    const endOfLastMonth = timeframe === 'lastMonth' ? getEndOfLastMonth() : null;

    for (let i = 0; i < activeTransactionsPool.length; i++) {
      const tx = activeTransactionsPool[i];
      if (tx.deleted) continue;

      let isValid = true;
      if (timeframe === 'month') {
        isValid = new Date(tx.timestamp) >= startOfMonth;
      } else if (timeframe === 'lastMonth') {
        const txDate = new Date(tx.timestamp);
        isValid = txDate >= startOfLastMonth && txDate <= endOfLastMonth;
      }

      if (isValid) {
        map.set(tx.studentId, (map.get(tx.studentId) || 0) + (tx.amount || 0));
      }
    }

    return map;
  }, [activeTransactionsPool, timeframe]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedProfileStudent(null);
        setConfirmDeleteTxId(null);
        setIsDropdownOpen(false);
        setIsHistoryStudentDropdownOpen(false);
        setIsTimeframeDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedGroupId !== 'all' && selectedGroupId !== 'top10_all') {
      const student = activeStudentsPool.find((s) => s.id === selectedHistoryStudentId);
      if (student && student.groupId !== selectedGroupId) {
        setSelectedHistoryStudentId('all');
      }
    }
  }, [selectedGroupId, selectedHistoryStudentId, activeStudentsPool]);

  const filteredStudentsForDropdown = useMemo(() => {
    if (selectedGroupId === 'all' || selectedGroupId === 'top10_all') {
      return activeStudentsPool;
    }
    return activeStudentsPool.filter((s) => s.groupId === selectedGroupId);
  }, [activeStudentsPool, selectedGroupId]);

  const studentTxs = useMemo(() => {
    if (!profileStudent) return [];
    return activeTransactionsPool.filter(t => t.studentId === profileStudent.id);
  }, [activeTransactionsPool, profileStudent]);

  // Lazy computation for history tab - 0ms cost when viewing standings
  const processedTransactions = useMemo(() => {
    if (activeTab !== 'history') return [];

    const studentMap = new Map();
    for (let i = 0; i < activeStudentsPool.length; i++) {
      studentMap.set(activeStudentsPool[i].id, activeStudentsPool[i]);
    }

    const data = [];
    for (let i = 0; i < activeTransactionsPool.length; i++) {
      const tx = activeTransactionsPool[i];
      if (tx.deleted) continue;

      const student = studentMap.get(tx.studentId);
      const groupId = student ? student.groupId : null;

      if (selectedGroupId !== 'all' && selectedGroupId !== 'top10_all' && groupId !== selectedGroupId) {
        continue;
      }
      if (selectedHistoryStudentId !== 'all' && tx.studentId !== selectedHistoryStudentId) {
        continue;
      }

      data.push({
        ...tx,
        studentName: student ? student.name : "O'chirilgan talaba",
        studentEmoji: student ? student.emoji : '❓',
        studentColor: student ? student.color : '#8e8e93',
        groupId: groupId,
        groupName: groupId ? (groupNameMap.get(groupId) || "O'chirilgan guruh") : "O'chirilgan guruh",
      });
    }

    return data;
  }, [activeTab, activeTransactionsPool, activeStudentsPool, groupNameMap, selectedGroupId, selectedHistoryStudentId]);

  const HISTORY_PAGE_SIZE = 20;
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(HISTORY_PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleHistoryCount(HISTORY_PAGE_SIZE);
  }, [activeTab, selectedGroupId, selectedHistoryStudentId]);

  useEffect(() => {
    if (activeTab !== 'history') return;
    if (visibleHistoryCount >= processedTransactions.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          setVisibleHistoryCount((prev) => Math.min(prev + HISTORY_PAGE_SIZE, processedTransactions.length));
        }
      },
      { rootMargin: '300px' }
    );

    const el = sentinelRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
      observer.disconnect();
    };
  }, [activeTab, visibleHistoryCount, processedTransactions.length]);

  const visibleTransactions = useMemo(() => {
    return processedTransactions.slice(0, visibleHistoryCount);
  }, [processedTransactions, visibleHistoryCount]);

  // Ultra-fast O(N) standings calculation
  const standings = useMemo(() => {
    const isStudentTop10 = userRole === 'student' && selectedGroupId === 'top10_all';

    let data = activeStudentsPool;
    if (!isStudentTop10 && selectedGroupId !== 'all') {
      data = data.filter((s) => s.groupId === selectedGroupId);
    }

    const scored = data.map((s) => {
      const score = studentScoreMap.get(s.id) || 0;
      const groupName = groupNameMap.get(s.groupId) || 'Guruhsiz';
      return {
        ...s,
        score,
        groupName,
      };
    });

    const sorted = scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    const finalData = isStudentTop10 ? sorted.slice(0, 10) : sorted;

    let currentRank = 0;
    let lastScore = null;
    return finalData.map((student) => {
      if (student.score !== lastScore) {
        currentRank += 1;
        lastScore = student.score;
      }
      return {
        ...student,
        rank: currentRank,
      };
    });
  }, [activeStudentsPool, groupNameMap, studentScoreMap, selectedGroupId, userRole]);

  const hasAnyPoints = useMemo(() => {
    return standings.some((s) => s.score !== 0);
  }, [standings]);

  const handleDeleteTx = (id) => {
    if (onDeleteTransaction) {
      onDeleteTransaction(id);
      setConfirmDeleteTxId(null);
      if (showToast) {
        showToast("Baholash harakati muvaffaqiyatli bekor qilindi!", "success");
      }
    }
  };

  const historyGridStyle = {
    gridTemplateColumns: userRole === 'student'
      ? '130px 1.6fr 1.2fr 2fr 80px'
      : '130px 1.6fr 1.2fr 2fr 80px 105px'
  };

  return (
    <div className="leaderboard-container">
      <div className="page-header flex-col-mobile">
        <div>
          <h2 className="page-title">{activeTab === 'standings' ? 'Leaderboard' : 'Ballar Tarixi'}</h2>
        </div>

        <div className="tab-control-brutalist">
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            <IconTrophy size={15} />
            <span>Reyting</span>
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <IconScroll size={15} />
            <span>Ballar Tarixi</span>
          </button>
        </div>
      </div>

      <div className={`glass-card filters-toolbar ${userRole === 'student' ? 'student-filters-toolbar' : ''}`}>
        {userRole === 'student' ? (
          <div className="filter-item student-scope-filter-item">
            <label className="form-label">Ko'rinish</label>
            <div className="student-scope-toggle">
              <button
                type="button"
                className={`student-scope-btn scale-active ${selectedGroupId === 'top10_all' ? 'active' : ''}`}
                onClick={() => setSelectedGroupId('top10_all')}
              >
                Umumiy TOP 10
              </button>
              <button
                type="button"
                className={`student-scope-btn scale-active ${selectedGroupId !== 'top10_all' ? 'active' : ''}`}
                onClick={() => setSelectedGroupId(groups[0]?.id || 'my_group')}
              >
                Mening guruhim
              </button>
            </div>
          </div>
        ) : (
          <div className="filter-item">
            <label className="form-label">Guruh</label>
            <div className="custom-dropdown-container">
              <button 
                type="button" 
                className="filter-select-btn" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{selectedGroupId === 'all' ? 'Barcha guruhlar' : (groups.find(g => g.id === selectedGroupId)?.name || 'Guruhsiz')}</span>
                <span className="dropdown-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              {isDropdownOpen && (
                <>
                  <div className="custom-select-overlay" onClick={() => setIsDropdownOpen(false)} />
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
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'standings' ? (
          <div className="filter-item filter-right-item">
            <label className="form-label">Davr</label>
            
            <div className="timeframe-toggle-desktop-wrapper">
              <div className="timeframe-toggle-wrapper">
                <div className="timeframe-toggle glass">
                  <button
                    type="button"
                    className={`toggle-btn ${timeframe === 'month' ? 'active' : ''}`}
                    onClick={() => setTimeframe('month')}
                  >
                    Bu oy
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${timeframe === 'lastMonth' ? 'active' : ''}`}
                    onClick={() => setTimeframe('lastMonth')}
                  >
                    O'tgan oy
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${timeframe === 'all' ? 'active' : ''}`}
                    onClick={() => setTimeframe('all')}
                  >
                    Kurs davomida
                  </button>
                </div>
              </div>
            </div>

            <div className="timeframe-dropdown-container">
              <button 
                type="button" 
                className="filter-select-btn" 
                onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
              >
                <span>{
                  timeframe === 'month' ? 'Bu oy' :
                  timeframe === 'lastMonth' ? "O'tgan oy" :
                  'Kurs davomida'
                }</span>
                <span className="dropdown-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              {isTimeframeDropdownOpen && (
                <>
                  <div className="custom-select-overlay" onClick={() => setIsTimeframeDropdownOpen(false)} />
                  <div className="custom-dropdown-list glass">
                    <div 
                      className={`custom-dropdown-item ${timeframe === 'month' ? 'active' : ''}`}
                      onClick={() => { setTimeframe('month'); setIsTimeframeDropdownOpen(false); }}
                    >
                      Bu oy
                    </div>
                    <div 
                      className={`custom-dropdown-item ${timeframe === 'lastMonth' ? 'active' : ''}`}
                      onClick={() => { setTimeframe('lastMonth'); setIsTimeframeDropdownOpen(false); }}
                    >
                      O'tgan oy
                    </div>
                    <div 
                      className={`custom-dropdown-item ${timeframe === 'all' ? 'active' : ''}`}
                      onClick={() => { setTimeframe('all'); setIsTimeframeDropdownOpen(false); }}
                    >
                      Kurs davomida
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="filter-item">
            <label className="form-label">Talaba</label>
            <div className="custom-dropdown-container">
              <button 
                type="button" 
                className="filter-select-btn" 
                onClick={() => setIsHistoryStudentDropdownOpen(!isHistoryStudentDropdownOpen)}
              >
                <span>{selectedHistoryStudentId === 'all' ? 'Barcha talabalar' : (students.find(s => s.id === selectedHistoryStudentId)?.name || 'Talabasiz')}</span>
                <span className="dropdown-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              {isHistoryStudentDropdownOpen && (
                <>
                  <div className="custom-select-overlay" onClick={() => setIsHistoryStudentDropdownOpen(false)} />
                  <div className="custom-dropdown-list glass">
                    <div 
                      className={`custom-dropdown-item ${selectedHistoryStudentId === 'all' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedHistoryStudentId('all');
                        setIsHistoryStudentDropdownOpen(false);
                      }}
                    >
                      Barcha talabalar
                    </div>
                    {filteredStudentsForDropdown.map((student) => (
                      <div 
                        key={student.id} 
                        className={`custom-dropdown-item ${selectedHistoryStudentId === student.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedHistoryStudentId(student.id);
                          setIsHistoryStudentDropdownOpen(false);
                        }}
                      >
                        {student.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'standings' ? (
        standings.length > 0 ? (
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
                const isFirst = rank === 1 && hasAnyPoints;
                return (
                  <div 
                    key={student.id} 
                    className={`standings-row ${isFirst ? 'row-rank-1' : isTop3 ? 'row-top3' : ''} clickable-row`}
                    onClick={() => {
                      setSelectedProfileStudent(student);
                    }}
                  >
                    <span className="td-rank">
                      <span className={`rank-badge ${rank === 1 && isTop3 ? 'rank-gold' : rank === 2 && isTop3 ? 'rank-silver' : rank === 3 && isTop3 ? 'rank-bronze' : ''}`}>
                        {rank}
                      </span>
                    </span>
                    <span className="td-student">
                      <div className="table-avatar-wrapper">
                        {isFirst && (
                          <span className="premium-crown table-crown">
                            <IconCrown size={11} />
                          </span>
                        )}
                        <div 
                          className={`avatar-circle table-avatar ${isFirst ? 'first-place-avatar' : ''}`} 
                          style={{ background: student.color, width: 34, height: 34, fontSize: '1.05rem', overflow: 'hidden' }}
                        >
                          {renderAvatar(student.emoji)}
                        </div>
                      </div>
                      <div className="student-info-meta">
                        <span className={`student-table-name ${isFirst ? 'font-bold' : ''}`}>
                          {student.name}
                        </span>
                        <span className="student-mobile-group">{student.groupName}</span>
                      </div>
                    </span>
                    <span className="td-group">
                      <span className="group-name-text">{student.groupName}</span>
                    </span>
                    <span className={`td-score text-right font-bold ${student.score >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {student.score >= 0 ? `+${student.score}` : student.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-card empty-leaderboard-placeholder">
            <div className="placeholder-icon">
              <IconTrophy size={36} />
            </div>
            <h3>Reyting natijalari bo'sh</h3>
            <p>Tanlangan guruhda talabalar mavjud emas.</p>
          </div>
        )
      ) : (
        <div className="glass-card history-card">
          {processedTransactions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="history-table desktop-history-view">
                <div className="history-header" style={historyGridStyle}>
                  <span className="th-time">Vaqt</span>
                  <span className="th-student">Talaba</span>
                  <span className="th-group">Guruh</span>
                  <span className="th-comment">Izoh</span>
                  <span className="th-amount text-right">Like</span>
                  {userRole !== 'student' && <span className="th-action text-right">Amal</span>}
                </div>
                <div className="history-body">
                  {visibleTransactions.map((tx) => {
                    const date = new Date(tx.timestamp);
                    const formattedDate = date.toLocaleDateString();
                    const formattedTime = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });

                    return (
                      <div key={tx.id} className="history-row" style={historyGridStyle}>
                        <span className="td-time">
                          <span className="date-text">{formattedDate}</span>
                          <span className="time-text">{formattedTime}</span>
                        </span>
                        <span className="td-student">
                          <div className="avatar-circle table-avatar" style={{ background: tx.studentColor, width: 28, height: 28, fontSize: '0.9rem', overflow: 'hidden' }}>
                            {renderAvatar(tx.studentEmoji)}
                          </div>
                          <span className="student-table-name">{tx.studentName}</span>
                        </span>
                        <span className="td-group">{tx.groupName}</span>
                        <span className="td-comment">
                          {tx.comment ? `"${tx.comment}"` : <span className="no-comment">—</span>}
                        </span>
                        <span className={`td-amount text-right font-bold ${tx.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                        {userRole !== 'student' && (
                          <span className="td-action text-right">
                            <button
                              type="button"
                              className="btn-delete-tx scale-active"
                              onClick={() => setConfirmDeleteTxId(tx.id)}
                            >
                              Bekor qilish
                            </button>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Card List View (<= 768px) */}
              <div className="mobile-history-view">
                {visibleTransactions.map((tx) => {
                  const date = new Date(tx.timestamp);
                  const formattedDate = date.toLocaleDateString();
                  const formattedTime = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });

                  return (
                    <div key={tx.id} className="history-mobile-card">
                      <div className="history-mobile-top">
                        <div className="history-mobile-student">
                          <div className="avatar-circle table-avatar" style={{ background: tx.studentColor, width: 32, height: 32, fontSize: '1rem', overflow: 'hidden' }}>
                            {renderAvatar(tx.studentEmoji)}
                          </div>
                          <div className="history-mobile-name-col">
                            <strong className="student-table-name">{tx.studentName}</strong>
                            <span className="history-mobile-group-tag">{tx.groupName}</span>
                          </div>
                        </div>
                        <span className={`history-mobile-score font-bold ${tx.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </div>

                      {tx.comment && (
                        <p className="history-mobile-comment">"{tx.comment}"</p>
                      )}

                      <div className="history-mobile-bottom">
                        <span className="history-mobile-time">
                          <IconCalendar size={12} /> {formattedDate} • <IconClock size={12} /> {formattedTime}
                        </span>
                        {userRole !== 'student' && (
                          <button
                            type="button"
                            className="btn-delete-tx scale-active"
                            onClick={() => setConfirmDeleteTxId(tx.id)}
                          >
                            Bekor qilish
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite Scroll Sentinel & Load More Section */}
              {visibleHistoryCount < processedTransactions.length && (
                <div ref={sentinelRef} className="history-load-more-section">
                  <button
                    type="button"
                    className="btn btn-secondary scale-active btn-load-more"
                    onClick={() => setVisibleHistoryCount((prev) => Math.min(prev + HISTORY_PAGE_SIZE, processedTransactions.length))}
                  >
                    <span>Ko'proq yuklash ({visibleTransactions.length} / {processedTransactions.length})</span>
                    <span className="load-more-arrow">↓</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-history">
              <div className="placeholder-icon">⏳</div>
              <h3>Harakatlar topilmadi</h3>
              <p>Hali hech qanday talaba baholanmagan.</p>
            </div>
          )}
        </div>
      )}

      {confirmDeleteTxId && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmDeleteTxId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setConfirmDeleteTxId(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title">Baholashni bekor qilish</h3>
            <p className="modal-warning-text">
              Ushbu baholash harakatini bekor qilmoqchimisiz? Talabaning umumiy likelari mos ravishda qayta hisoblanadi.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setConfirmDeleteTxId(null)}>
                Orqaga
              </button>
              <button
                className="btn btn-danger scale-active"
                onClick={() => handleDeleteTx(confirmDeleteTxId)}
              >
                Ha, bekor qilinsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {profileStudent && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedProfileStudent(null)}>
          <div className="modal-content glass profile-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setSelectedProfileStudent(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="profile-modal-header">
              <div className="avatar-circle profile-avatar" style={{ background: profileStudent.color, overflow: 'hidden' }}>
                {renderAvatar(profileStudent.emoji)}
              </div>
              <h3 className="profile-modal-name">{profileStudent.name}</h3>
              <p className="profile-modal-group">{(groupNameMap.get(profileStudent.groupId) || 'Guruhsiz')} Guruhi</p>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(activeTransactionsPool, profileStudent.id, 'month')}</span>
                <span className="profile-stat-lbl">Bu Oy</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(activeTransactionsPool, profileStudent.id, 'lastMonth')}</span>
                <span className="profile-stat-lbl">O'tgan Oy</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(activeTransactionsPool, profileStudent.id, 'all')}</span>
                <span className="profile-stat-lbl">Kurs Davomida</span>
              </div>
            </div>

            <div className="profile-timeline-section">
              <h4 className="profile-timeline-title">
                <IconScroll size={15} />
                <span>Baholash Tarixi</span>
              </h4>
              <div className="profile-timeline-list">
                {studentTxs.length > 0 ? (
                  studentTxs.map((tx) => {
                    const date = new Date(tx.timestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
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
                              type="button"
                              className="profile-timeline-item-delete scale-active"
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                if (showToast) {
                                  showToast("Baholash harakati bekor qilindi!", "success");
                                }
                              }}
                            >
                              <IconTrash size={13} />
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
          animation: fade-in 0.3s ease-out;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .flex-col-mobile {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .tab-control-brutalist {
          display: inline-flex;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .tab-btn-brutalist {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .tab-btn-brutalist:hover {
          color: var(--text-primary);
        }

        .tab-btn-brutalist.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }

        .filters-toolbar {
          position: relative;
          z-index: 100;
          padding: 12px 18px;
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
          max-width: 320px;
          flex: 0 1 320px;
        }

        .filter-right-item {
          flex: 0 0 auto;
          min-width: unset;
          max-width: none;
          margin-left: auto;
        }

        .student-scope-filter-item {
          flex: 0 0 auto;
          min-width: unset;
          max-width: none;
        }

        .student-scope-toggle {
          display: inline-flex;
          align-items: center;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .student-scope-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .student-scope-btn:hover {
          color: var(--text-primary);
        }

        .student-scope-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }

        .custom-dropdown-container {
          position: relative;
          width: 100%;
        }

        .custom-select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 990;
          background: transparent;
        }

        .filter-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 14px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .filter-select-btn:hover {
          border-color: var(--apple-blue);
        }

        .dropdown-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          flex-shrink: 0;
          color: var(--text-secondary);
        }

        .custom-dropdown-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 100%;
          max-height: 240px;
          overflow-y: auto;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        .custom-dropdown-item {
          padding: 10px 14px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          border-bottom: 1px solid var(--border-color-subtle);
          transition: background var(--transition-fast);
        }

        .custom-dropdown-item:hover, .custom-dropdown-item.active {
          background: #F5F5F7;
          color: var(--apple-blue);
          font-weight: 600;
        }

        .timeframe-toggle-desktop-wrapper {
          display: block;
        }

        .timeframe-toggle-wrapper {
          position: relative;
        }

        .timeframe-toggle {
          display: inline-flex;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .toggle-btn {
          padding: 7px 14px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          color: var(--text-secondary);
          touch-action: manipulation;
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          box-sizing: border-box;
          white-space: nowrap;
        }

        .toggle-btn:last-child {
          border-right: none;
        }

        .toggle-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }

        .timeframe-dropdown-container {
          display: none;
          position: relative;
          width: 100%;
        }

        /* Standings Table Card */
        .standings-card {
          padding: 0;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          background: #FFFFFF;
          overflow: hidden;
        }

        .standings-header {
          display: grid;
          grid-template-columns: 60px minmax(0, 1.8fr) minmax(0, 1.4fr) 90px;
          padding: 12px 18px;
          background: #FAFAFC;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-secondary);
        }

        .standings-body {
          display: flex;
          flex-direction: column;
        }

        .standings-row {
          display: grid;
          grid-template-columns: 60px minmax(0, 1.8fr) minmax(0, 1.4fr) 90px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-color-subtle);
          align-items: center;
          font-size: 0.88rem;
          transition: background var(--transition-fast);
          content-visibility: auto;
          contain-intrinsic-size: 0 54px;
        }

        .standings-row:last-child {
          border-bottom: none;
        }

        .standings-row:hover {
          background: #FAFAFC;
        }

        .standings-row.clickable-row {
          cursor: pointer;
        }

        .standings-row.clickable-row:active {
          background: #F5F5F7;
        }

        .row-rank-1 {
          background: linear-gradient(90deg, rgba(255, 191, 0, 0.20) 0%, rgba(255, 215, 0, 0.08) 100%) !important;
          border-bottom: 1px solid rgba(255, 191, 0, 0.35) !important;
          box-shadow: inset 4px 0 0 #FFBF00;
        }

        .row-rank-1:hover {
          background: linear-gradient(90deg, rgba(255, 191, 0, 0.28) 0%, rgba(255, 215, 0, 0.14) 100%) !important;
        }

        .row-rank-1 .student-table-name {
          color: #1D1D1F !important;
          font-weight: 700;
        }

        .row-rank-1 .group-name-text,
        .row-rank-1 .student-mobile-group {
          color: #7A5300 !important;
          font-weight: 600;
        }

        .row-rank-1 .td-score {
          color: #92400E !important;
          font-weight: 800;
        }

        .row-rank-1 .first-place-avatar {
          box-shadow: 0 0 12px rgba(255, 191, 0, 0.5) !important;
          border: 1.5px solid #FFBF00 !important;
        }

        .row-rank-1 .table-crown {
          background: #FFBF00 !important;
          color: #2D1E00 !important;
          border: 1.5px solid #FFFFFF !important;
          box-shadow: 0 2px 6px rgba(255, 191, 0, 0.6) !important;
        }

        .td-rank {
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 4px;
          font-size: 0.84rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #F5F5F7;
          color: var(--text-primary);
        }

        .rank-badge.rank-gold {
          background: linear-gradient(135deg, #FFD700 0%, #FFBF00 100%) !important;
          color: #3B2400 !important;
          border: 1px solid #E5A800 !important;
          box-shadow: 0 2px 6px rgba(255, 191, 0, 0.35);
          font-weight: 800;
        }

        .rank-badge.rank-silver {
          background: #F1F5F9;
          color: #475569;
          border-color: #E2E8F0;
        }

        .rank-badge.rank-bronze {
          background: #FFEDD5;
          color: #9A3412;
          border-color: #FED7AA;
        }

        .td-student {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .table-avatar-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .table-crown {
          position: absolute;
          top: -8px;
          background: #1D1D1F;
          color: #FFFFFF;
          border: 1.5px solid #FFFFFF;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          box-shadow: var(--shadow-sm);
          pointer-events: none;
        }

        .table-avatar {
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .first-place-avatar {
          border-radius: var(--radius-md);
          box-shadow: 0 0 10px rgba(255, 204, 0, 0.35);
        }

        .student-info-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .student-table-name {
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-mobile-group {
          display: none;
          font-size: 0.74rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .td-group {
          font-size: 0.84rem;
          color: var(--text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 0;
        }

        .group-name-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .td-score {
          font-size: 0.95rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .text-positive {
          color: var(--apple-green);
        }

        .text-negative {
          color: var(--apple-red);
        }

        /* History Card */
        .history-card {
          padding: 0;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          background: #FFFFFF;
          overflow: hidden;
        }

        .desktop-history-view {
          display: block;
        }

        .mobile-history-view {
          display: none;
        }

        .history-table {
          width: 100%;
        }

        .history-header {
          display: grid;
          padding: 12px 18px;
          background: #FAFAFC;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: -0.01em;
        }

        .history-body {
          display: flex;
          flex-direction: column;
        }

        .history-row {
          display: grid;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-color-subtle);
          align-items: center;
          font-size: 0.86rem;
          transition: background var(--transition-fast);
        }

        .history-row:hover {
          background: #FAFAFC;
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .td-time {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .date-text {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .time-text {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .td-comment {
          font-size: 0.84rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 8px;
        }

        .no-comment {
          color: var(--text-tertiary);
          font-style: italic;
        }

        .td-amount {
          font-size: 0.92rem;
          font-weight: 700;
        }

        .btn-delete-tx {
          padding: 5px 10px;
          font-size: 0.76rem;
          font-weight: 600;
          background: #FEE2E2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-sm);
          color: #DC2626;
          cursor: pointer;
          transition: all var(--transition-fast);
          touch-action: manipulation;
        }

        .btn-delete-tx:hover {
          background: #FCA5A5;
        }

        /* Mobile History Cards */
        .history-mobile-card {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color-subtle);
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #FFFFFF;
        }

        .history-mobile-card:last-child {
          border-bottom: none;
        }

        .history-mobile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .history-mobile-student {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .history-mobile-name-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .history-mobile-group-tag {
          font-size: 0.74rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .history-mobile-score {
          font-size: 1.05rem;
          font-weight: 700;
          padding: 3px 10px;
          background: #F5F5F7;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
        }

        .history-mobile-comment {
          font-size: 0.84rem;
          color: var(--text-secondary);
          margin: 0;
          background: #F5F5F7;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }

        .history-mobile-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .history-mobile-time {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .history-load-more-section {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px 20px;
          background: #FAFAFC;
          border-top: 1px solid var(--border-color);
        }

        .btn-load-more {
          width: 100%;
          max-width: 320px;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 0.86rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-load-more:hover {
          background: #F5F5F7;
        }

        .load-more-arrow {
          font-size: 1rem;
          font-weight: 700;
        }

        .empty-leaderboard-placeholder, .empty-history {
          padding: 48px 24px;
          text-align: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .placeholder-icon {
          font-size: 2.5rem;
        }

        /* Profile Modal */
        .profile-modal {
          max-width: 460px;
          padding: 24px;
        }

        .profile-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
        }

        .profile-avatar {
          width: 56px;
          height: 56px;
          font-size: 1.6rem;
          margin-bottom: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: var(--shadow-sm);
        }

        .profile-modal-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .profile-modal-group {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .profile-stat-box {
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          padding: 10px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #FAFAFC;
        }

        .profile-stat-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .profile-stat-lbl {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 2px;
          text-align: center;
          line-height: 1.2;
        }

        .profile-timeline-section {
          margin-bottom: 14px;
        }

        .profile-timeline-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--text-primary);
        }

        .profile-timeline-list {
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          background: #FFFFFF;
        }

        .profile-timeline-item {
          display: flex;
          flex-direction: column;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color-subtle);
        }

        .profile-timeline-item:last-child {
          border-bottom: none;
        }

        .profile-timeline-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.74rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text-secondary);
        }

        .profile-timeline-item-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .profile-timeline-comment {
          font-size: 0.82rem;
          font-style: italic;
          color: #000000;
          font-weight: 600;
        }

        .profile-timeline-item-delete {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px 4px;
          touch-action: manipulation;
        }

        .profile-timeline-empty {
          padding: 24px;
          text-align: center;
          font-size: 0.84rem;
          color: #666666;
        }

        /* Mobile Breakpoints */
        @media (max-width: 768px) {
          .flex-col-mobile {
            flex-direction: column;
            align-items: stretch;
          }

          .tab-control-brutalist {
            display: flex;
            width: 100%;
          }

          .tab-btn-brutalist {
            flex: 1 1 0px;
            justify-content: center;
            text-align: center;
            padding: 9px 6px;
            font-size: 0.78rem;
            white-space: nowrap;
          }

          .filters-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px;
          }

          .filter-item {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            flex: none;
          }

          .filter-right-item {
            width: 100%;
            margin-left: 0;
            flex: none;
          }

          .student-scope-filter-item {
            width: 100%;
            max-width: 100%;
            flex: none;
          }

          .student-scope-toggle {
            width: 100%;
            display: flex;
          }

          .student-scope-btn {
            flex: 1 1 0px;
            justify-content: center;
            padding: 8px 6px;
            white-space: nowrap;
          }

          .timeframe-toggle-desktop-wrapper {
            display: none;
          }

          .timeframe-dropdown-container {
            display: block;
          }

          .desktop-history-view {
            display: none;
          }

          .mobile-history-view {
            display: block;
          }

          .standings-header {
            grid-template-columns: 46px 1fr 68px;
            padding: 8px 12px;
          }

          .standings-row {
            grid-template-columns: 46px 1fr 68px;
            padding: 10px 12px;
          }

          .row-rank-1 {
            background: linear-gradient(90deg, rgba(255, 191, 0, 0.20) 0%, rgba(255, 215, 0, 0.08) 100%) !important;
            border-bottom-color: rgba(255, 191, 0, 0.35) !important;
          }

          .row-rank-1:hover {
            background: linear-gradient(90deg, rgba(255, 191, 0, 0.28) 0%, rgba(255, 215, 0, 0.14) 100%) !important;
          }

          .th-group, .td-group {
            display: none;
          }

          .student-mobile-group {
            display: block;
          }

          .profile-modal {
            padding: 14px 16px;
          }

          .profile-avatar {
            width: 46px;
            height: 46px;
            font-size: 1.4rem;
          }

          .profile-modal-name {
            font-size: 1.05rem;
          }

          .profile-stat-val {
            font-size: 1.1rem;
          }
        }

        /* 1st Place Gold Dark Mode Styling */
        [data-theme="dark"] .row-rank-1 {
          background: linear-gradient(90deg, rgba(255, 191, 0, 0.22) 0%, rgba(255, 191, 0, 0.07) 100%) !important;
          border-bottom: 1px solid rgba(255, 191, 0, 0.32) !important;
          box-shadow: inset 4px 0 0 #FFBF00 !important;
        }

        [data-theme="dark"] .row-rank-1:hover {
          background: linear-gradient(90deg, rgba(255, 191, 0, 0.30) 0%, rgba(255, 191, 0, 0.12) 100%) !important;
        }

        [data-theme="dark"] .row-rank-1 .student-table-name {
          color: #FFF6D6 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          font-weight: 700;
        }

        [data-theme="dark"] .row-rank-1 .group-name-text,
        [data-theme="dark"] .row-rank-1 .student-mobile-group {
          color: #F6D06E !important;
          font-weight: 600;
        }

        [data-theme="dark"] .row-rank-1 .td-score {
          color: #FFD54F !important;
          text-shadow: 0 0 10px rgba(255, 191, 0, 0.5);
          font-weight: 800;
        }

        [data-theme="dark"] .row-rank-1 .first-place-avatar {
          box-shadow: 0 0 14px rgba(255, 191, 0, 0.6) !important;
          border: 1.5px solid #FFBF00 !important;
        }

        [data-theme="dark"] .row-rank-1 .table-crown {
          background: #FFBF00 !important;
          color: #1A1200 !important;
          border: 1.5px solid #202124 !important;
          box-shadow: 0 0 10px rgba(255, 191, 0, 0.8) !important;
        }

        [data-theme="dark"] .rank-badge.rank-gold {
          background: linear-gradient(135deg, #FFD700 0%, #FFBF00 100%) !important;
          color: #2D1A00 !important;
          border: 1px solid #FFE082 !important;
          box-shadow: 0 0 10px rgba(255, 191, 0, 0.5);
          font-weight: 800;
        }

        /* Leaderboard Profile Modal Dark Mode Styles */
        [data-theme="dark"] .profile-stat-box {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .profile-timeline-list {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .profile-timeline-item {
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .profile-timeline-time {
          color: #9AA0A6;
        }

        [data-theme="dark"] .profile-timeline-amount {
          color: #81C995;
        }

        [data-theme="dark"] .profile-timeline-comment {
          color: #E8EAED;
        }

        [data-theme="dark"] .profile-timeline-item-delete:hover {
          color: #F28B82;
        }

        /* History Tab Dark Mode Overrides */
        [data-theme="dark"] .history-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .history-header {
          background: #202124;
          border-bottom-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .history-row {
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .history-row:hover {
          background: #303134 !important;
        }

        [data-theme="dark"] .date-text {
          color: #E8EAED;
        }

        [data-theme="dark"] .time-text {
          color: #9AA0A6;
        }

        [data-theme="dark"] .td-comment {
          color: #E8EAED;
        }

        [data-theme="dark"] .btn-delete-tx {
          background: rgba(242, 139, 130, 0.15) !important;
          color: #F28B82 !important;
          border: 1px solid rgba(242, 139, 130, 0.35) !important;
        }

        [data-theme="dark"] .btn-delete-tx:hover {
          background: rgba(242, 139, 130, 0.25) !important;
          border-color: rgba(242, 139, 130, 0.5) !important;
        }

        [data-theme="dark"] .history-mobile-card {
          background: #292A2D;
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .history-mobile-score {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .history-mobile-comment {
          background: #202124;
          color: #E8EAED;
        }

        [data-theme="dark"] .custom-dropdown-list {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .custom-dropdown-item {
          color: #E8EAED;
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .custom-dropdown-item:hover,
        [data-theme="dark"] .custom-dropdown-item.active {
          background: #303134;
          color: #8AB4F8;
        }

        [data-theme="dark"] .filter-select-btn {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        /* Leaderboard Standings Table & Timeframe Dark Mode Overrides */
        [data-theme="dark"] .standings-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .standings-header {
          background: #202124;
          border-bottom-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .standings-row {
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .standings-row:hover {
          background: #303134 !important;
        }

        [data-theme="dark"] .standings-row.clickable-row:active {
          background: #3C4043 !important;
        }

        [data-theme="dark"] .student-table-name {
          color: #E8EAED;
        }

        [data-theme="dark"] .group-name-text,
        [data-theme="dark"] .student-mobile-group {
          color: #9AA0A6;
        }

        [data-theme="dark"] .rank-badge {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .rank-badge.rank-silver {
          background: #303134;
          color: #E8EAED;
          border-color: #494C50;
        }

        [data-theme="dark"] .rank-badge.rank-bronze {
          background: rgba(230, 81, 0, 0.2);
          color: #FFB74D;
          border-color: rgba(230, 81, 0, 0.4);
        }

        [data-theme="dark"] .timeframe-toggle {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .toggle-btn {
          color: #9AA0A6;
        }

        [data-theme="dark"] .toggle-btn.active {
          background: #303134;
          color: #E8EAED;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
