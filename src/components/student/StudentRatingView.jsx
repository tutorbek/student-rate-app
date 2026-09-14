import React, { useState, useMemo } from 'react';
import { getStartOfToday, getStartOfMonth, getStartOfLastMonth, getEndOfLastMonth } from '../../utils/db';

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const UZBEK_MONTH_SHORT = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
  'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
];

const formatTxDate = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = UZBEK_MONTH_SHORT[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}, ${hours}:${minutes}`;
};

export default function StudentRatingView({
  students = [],
  transactions = [],
  allStudents = [],
  allTransactions = [],
  allGroups = [],
  pinnedStudentId = null,
  group = null,
  connectedGroups = [],
  onSwitchGroup,
}) {
  const [scope, setScope] = useState('top10'); // 'top10' | 'group' | 'history'

  // Determine if today is a scheduled class day for this group
  const isTodayClassDay = useMemo(() => {
    let days = Array.isArray(group?.schedule?.days) ? [...group.schedule.days] : [];
    if (days.length === 0 && group?.name) {
      const lower = group.name.toLowerCase();
      if (lower.includes('dushanba')) days = ['mon'];
      else if (lower.includes('seshanba')) days = ['tue'];
      else if (lower.includes('chorshanba')) days = ['wed'];
      else if (lower.includes('payshanba')) days = ['thu'];
      else if (lower.includes('juma')) days = ['fri'];
      else if (lower.includes('shanba')) days = ['sat'];
      else if (lower.includes('yakshanba')) days = ['sun'];
    }
    if (days.length === 0) return true; // If no schedule defined, allow today
    const currentDayKey = DAY_ORDER[new Date().getDay()];
    return days.includes(currentDayKey);
  }, [group]);

  const hasTransactionsToday = useMemo(() => {
    const startOfToday = getStartOfToday();
    return (transactions || []).some((tx) => !tx.deleted && new Date(tx.timestamp) >= startOfToday);
  }, [transactions]);

  // Smart initial timeframe: If today is a class day or has points, start with 'today', otherwise 'month'
  const [timeframe, setTimeframe] = useState(() => {
    return isTodayClassDay || hasTransactionsToday ? 'today' : 'month';
  });

  const groupNameMap = useMemo(() => {
    const map = new Map();
    (allGroups || []).forEach((g) => {
      if (g && g.id) map.set(String(g.id), g.name);
    });
    if (group?.id) map.set(String(group.id), group.name);
    return map;
  }, [allGroups, group]);

  const activeStudentsPool = useMemo(() => {
    if (scope === 'top10') {
      return allStudents.length > 0 ? allStudents : students;
    }
    return students;
  }, [scope, allStudents, students]);

  const activeTransactionsPool = useMemo(() => {
    if (scope === 'top10') {
      return allTransactions.length > 0 ? allTransactions : transactions;
    }
    return transactions;
  }, [scope, allTransactions, transactions]);

  const studentMap = useMemo(() => {
    const map = new Map();
    (allStudents.length > 0 ? allStudents : students).forEach((s) => {
      if (s) map.set(String(s.id), s);
    });
    return map;
  }, [allStudents, students]);

  // Pre-calculate scores for all students in active pool according to timeframe
  const rankedStudents = useMemo(() => {
    const startOfToday = timeframe === 'today' ? getStartOfToday() : null;
    const startOfMonth = timeframe === 'month' ? getStartOfMonth() : null;
    const startOfLastMonth = timeframe === 'lastMonth' ? getStartOfLastMonth() : null;
    const endOfLastMonth = timeframe === 'lastMonth' ? getEndOfLastMonth() : null;

    const scoreMap = new Map();
    activeStudentsPool.forEach((s) => scoreMap.set(String(s.id), 0));

    activeTransactionsPool.forEach((tx) => {
      if (tx.deleted) return;
      const sIdStr = String(tx.studentId);
      if (!scoreMap.has(sIdStr)) return;

      let isValid = true;
      if (timeframe === 'today') {
        isValid = new Date(tx.timestamp) >= startOfToday;
      } else if (timeframe === 'month') {
        isValid = new Date(tx.timestamp) >= startOfMonth;
      } else if (timeframe === 'lastMonth') {
        const txDate = new Date(tx.timestamp);
        isValid = txDate >= startOfLastMonth && txDate <= endOfLastMonth;
      }

      if (isValid) {
        const prev = scoreMap.get(sIdStr) || 0;
        scoreMap.set(sIdStr, prev + (Number(tx.amount) || 0));
      }
    });

    const list = activeStudentsPool.map((s) => ({
      ...s,
      score: scoreMap.get(String(s.id)) || 0,
    }));

    // Sort descending by score, then ascending by name
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    return list.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [activeStudentsPool, activeTransactionsPool, timeframe]);

  const isTodayEmpty = useMemo(() => {
    if (timeframe !== 'today') return false;
    return !rankedStudents.some((s) => s.score > 0);
  }, [timeframe, rankedStudents]);

  // Displayed list (Top 10 for 'top10', full group for 'group')
  const displayedRankedStudents = useMemo(() => {
    if (scope === 'top10') {
      return rankedStudents.slice(0, 10);
    }
    return rankedStudents;
  }, [rankedStudents, scope]);

  // Top 3 Podium Students
  const podiumTop3 = useMemo(() => {
    const first = rankedStudents[0] || null;
    const second = rankedStudents[1] || null;
    const third = rankedStudents[2] || null;
    return { first, second, third };
  }, [rankedStudents]);

  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'me'

  // Filter history of transactions (all group transactions or only pinned student)
  const historyTransactions = useMemo(() => {
    const pool = (transactions || []).filter((tx) => !tx.deleted);
    let filtered = pool;
    if (historyFilter === 'me' && pinnedStudentId) {
      const pIdStr = String(pinnedStudentId);
      filtered = pool.filter((tx) => String(tx.studentId) === pIdStr);
    }
    // Sort descending by timestamp
    return [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
  }, [transactions, historyFilter, pinnedStudentId]);

  const pinnedStudent = useMemo(() => {
    if (!pinnedStudentId) return null;
    const pIdStr = String(pinnedStudentId);
    return (allStudents.length > 0 ? allStudents : students).find((s) => String(s.id) === pIdStr) || null;
  }, [allStudents, students, pinnedStudentId]);

  // Information about pinned student's rank if not in displayed Top 10
  const pinnedStudentRankInfo = useMemo(() => {
    if (!pinnedStudentId) return null;
    const pIdStr = String(pinnedStudentId);
    const found = rankedStudents.find((s) => String(s.id) === pIdStr);
    if (!found) return null;
    const isInsideDisplayed = displayedRankedStudents.some((s) => String(s.id) === pIdStr);
    return {
      rank: found.rank,
      score: found.score,
      name: found.name,
      isInsideDisplayed,
    };
  }, [pinnedStudentId, rankedStudents, displayedRankedStudents]);

  return (
    <div className="student-rating-view">
      {/* Segmented Controls: Scope and Timeframe */}
      <div className="rating-toolbar-wrapper">
        <div className="rating-scope-segment">
          <button
            type="button"
            className={`rating-scope-btn ${scope === 'top10' ? 'active' : ''}`}
            onClick={() => setScope('top10')}
          >
            Umumiy TOP 10
          </button>
          <button
            type="button"
            className={`rating-scope-btn ${scope === 'group' ? 'active' : ''}`}
            onClick={() => setScope('group')}
          >
            Mening guruhim
          </button>
          <button
            type="button"
            className={`rating-scope-btn ${scope === 'history' ? 'active' : ''}`}
            onClick={() => setScope('history')}
          >
            Baholar tarixi
          </button>
        </div>

        {scope !== 'history' && (
          <div className="timeframe-segment">
            <button
              type="button"
              className={`timeframe-btn ${timeframe === 'today' ? 'active' : ''}`}
              onClick={() => setTimeframe('today')}
            >
              Bugun
            </button>
            <button
              type="button"
              className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => setTimeframe('month')}
            >
              Bu oy
            </button>
            <button
              type="button"
              className={`timeframe-btn ${timeframe === 'lastMonth' ? 'active' : ''}`}
              onClick={() => setTimeframe('lastMonth')}
            >
              O'tgan oy
            </button>
            <button
              type="button"
              className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              Kurs davomida
            </button>
          </div>
        )}
      </div>

      {/* Quick Group Switcher for Multi-Group Students */}
      {scope === 'group' && connectedGroups.length > 1 && (
        <div className="rating-group-switcher">
          <span className="rating-group-label">Guruh:</span>
          <div className="rating-group-pills">
            {connectedGroups.map((grp) => {
              const isCurrent = String(grp.id) === String(group?.id);
              return (
                <button
                  key={grp.id}
                  type="button"
                  className={`rating-group-pill ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    if (!isCurrent && onSwitchGroup) {
                      onSwitchGroup(grp.id);
                    }
                  }}
                >
                  {isCurrent && <span className="rating-pill-dot" />}
                  <span>{grp.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top-3 Minimalist Podium */}
      {scope !== 'history' && rankedStudents.length > 0 && !isTodayEmpty && (
        <div className="podium-card">
          <div className="podium-container">
            {/* 2nd Place (Silver) */}
            <div className={`podium-col second ${String(podiumTop3.second?.id) === String(pinnedStudentId) ? 'is-me' : ''}`}>
              {podiumTop3.second ? (
                <>
                  <div className="podium-student-meta">
                    <span className="podium-name" title={podiumTop3.second.name}>{podiumTop3.second.name}</span>
                    <span className="podium-score">{podiumTop3.second.score} ball</span>
                  </div>
                  <div className="podium-pedestal p-2">
                    <span className="podium-rank-num">2</span>
                  </div>
                </>
              ) : (
                <div className="podium-empty" />
              )}
            </div>

            {/* 1st Place (Gold) */}
            <div className={`podium-col first ${String(podiumTop3.first?.id) === String(pinnedStudentId) ? 'is-me' : ''}`}>
              {podiumTop3.first ? (
                <>
                  <div className="podium-student-meta">
                    {timeframe === 'today' && podiumTop3.first.score > 0 && (
                      <div className="podium-today-star-badge">
                        <span className="star-icon">⭐</span>
                        <span className="star-text">Bugungi dars yulduzi</span>
                      </div>
                    )}
                    <span className="podium-name" title={podiumTop3.first.name}>{podiumTop3.first.name}</span>
                    <span className="podium-score">{podiumTop3.first.score} ball</span>
                  </div>
                  <div className="podium-pedestal p-1">
                    <span className="podium-rank-num">1</span>
                  </div>
                </>
              ) : (
                <div className="podium-empty" />
              )}
            </div>

            {/* 3rd Place (Bronze) */}
            <div className={`podium-col third ${String(podiumTop3.third?.id) === String(pinnedStudentId) ? 'is-me' : ''}`}>
              {podiumTop3.third ? (
                <>
                  <div className="podium-student-meta">
                    <span className="podium-name" title={podiumTop3.third.name}>{podiumTop3.third.name}</span>
                    <span className="podium-score">{podiumTop3.third.score} ball</span>
                  </div>
                  <div className="podium-pedestal p-3">
                    <span className="podium-rank-num">3</span>
                  </div>
                </>
              ) : (
                <div className="podium-empty" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group or Top 10 Ranking List */}
      {scope !== 'history' && (
        <div className="rankings-table-card">
          <div className="rankings-header">
            <h3 className="rankings-title">
              {timeframe === 'today'
                ? (scope === 'top10' ? "Bugungi TOP 10 Reyting" : (group?.name ? `${group.name} — Bugungi natijalar` : "Bugungi natijalar"))
                : (scope === 'top10' ? "Umumiy TOP 10 Reyting" : (group?.name ? `${group.name} reytingi` : "Guruh reytingi"))}
            </h3>
            <span className="rankings-count">
              {isTodayEmpty
                ? "0 ta o'quvchi"
                : (scope === 'top10' ? `${displayedRankedStudents.length} ta o'quvchi` : `${rankedStudents.length} ta o'quvchi`)}
            </span>
          </div>

          <div className="rankings-list">
            {isTodayEmpty ? (
              <div className="history-empty today-empty-card">
                <div className="today-empty-icon">{!isTodayClassDay ? '📅' : '⭐'}</div>
                <h4 className="today-empty-title">
                  {!isTodayClassDay ? "Bugun ushbu guruhda dars kuni emas" : "Bugungi darsda hali ballar berilmadi"}
                </h4>
                <p className="today-empty-desc">
                  {!isTodayClassDay
                    ? "O'quvchilarning umumiy natijalarini ko'rish uchun yuqoridan \"Bu oy\" yoki \"Kurs davomida\" bo'limiga o'ting."
                    : "Dars davomida ustoz like va ballar berishi bilan, bugungi dars reytingi va dars yulduzi darhol shu yerda ko'rinadi."}
                </p>
              </div>
            ) : displayedRankedStudents.length > 0 ? (
              displayedRankedStudents.map((st) => {
                const isMe = String(st.id) === String(pinnedStudentId);
                const groupName = scope === 'top10' && st.groupId ? groupNameMap.get(String(st.groupId)) : null;
                const isDailyStar = timeframe === 'today' && st.rank === 1 && st.score > 0;
                return (
                  <div key={st.id} className={`ranking-row ${isMe ? 'is-me' : ''} ${isDailyStar ? 'is-daily-star' : ''}`}>
                    <div className="rank-num-col">
                      <span className={`rank-badge ${st.rank <= 3 ? `top-${st.rank}` : ''}`}>
                        {st.rank}
                      </span>
                    </div>
                    <div className="rank-name-col">
                      <div className="rank-name-wrap">
                        <span className="rank-student-name">{st.name}</span>
                        {isDailyStar && (
                          <span className="daily-star-tag">⭐ Dars yulduzi</span>
                        )}
                        {groupName && (
                          <span className="rank-group-subtext">{groupName}</span>
                        )}
                      </div>
                      {isMe && <span className="rank-me-tag">Siz</span>}
                    </div>
                    <div className="rank-score-col">
                      <span className="rank-score-val">{st.score}</span>
                      <span className="rank-score-unit">ball</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="history-empty">
                <p className="history-empty-text">Hozircha reyting ro'yxati mavjud emas</p>
              </div>
            )}
          </div>

          {scope === 'top10' && !isTodayEmpty && pinnedStudentRankInfo && !pinnedStudentRankInfo.isInsideDisplayed && (
            <div className="pinned-student-rank-footer">
              <div className="footer-rank-left">
                <span className="footer-rank-badge">{pinnedStudentRankInfo.rank}</span>
                <div className="footer-rank-meta">
                  <span className="footer-rank-name">{pinnedStudentRankInfo.name}</span>
                  <span className="footer-rank-desc">Sizning umumiy reytingdagi o'rningiz</span>
                </div>
              </div>
              <div className="footer-rank-right">
                <span className="footer-rank-score">{pinnedStudentRankInfo.score}</span>
                <span className="footer-rank-unit">ball</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Points & Evaluations History */}
      {scope === 'history' && (
        <div className="history-section-card">
          <div className="history-header">
            <div className="history-header-left">
              <h3 className="history-title">Guruh baholar tarixi</h3>
              <span className="history-count">{historyTransactions.length} ta yozuv</span>
            </div>
            {pinnedStudent && (
              <div className="history-subfilter-segment">
                <button
                  type="button"
                  className={`history-subfilter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('all')}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  className={`history-subfilter-btn ${historyFilter === 'me' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('me')}
                >
                  Mening ballarim
                </button>
              </div>
            )}
          </div>

          {historyTransactions.length > 0 ? (
            <div className="history-list">
              {historyTransactions.map((tx) => {
                const amountNum = Number(tx.amount) || 0;
                const isPositive = amountNum > 0;
                const studentName = studentMap.get(String(tx.studentId))?.name;
                const isMeTx = pinnedStudentId && String(tx.studentId) === String(pinnedStudentId);
                return (
                  <div key={tx.id} className={`history-row ${isMeTx ? 'is-me-tx' : ''}`}>
                    <div className="history-date-col">
                      <span className="history-date">{formatTxDate(tx.timestamp)}</span>
                    </div>
                    <div className="history-desc-col">
                      {studentName && (
                        <span className={`history-student-tag ${isMeTx ? 'is-me' : ''}`}>
                          {studentName}{isMeTx ? ' (Siz)' : ''}:{' '}
                        </span>
                      )}
                      <span className="history-comment">{tx.comment || "Baholash"}</span>
                    </div>
                    <div className="history-amount-col">
                      <span className={`history-amount ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? `+${amountNum}` : amountNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="history-empty">
              <p className="history-empty-text">Hozircha baholar yozuvlari mavjud emas</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .student-rating-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .rating-toolbar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .rating-scope-segment {
          display: inline-flex;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 4px;
          gap: 4px;
          box-shadow: var(--shadow-sm);
        }

        .rating-scope-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.84rem;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          white-space: nowrap;
        }

        .rating-scope-btn.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
        }

        .timeframe-segment {
          display: inline-flex;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 3px;
          box-shadow: var(--shadow-sm);
        }

        .timeframe-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          white-space: nowrap;
        }

        .timeframe-btn.active {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
          color: var(--apple-blue);
        }

        .rank-name-wrap {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .rank-group-subtext {
          font-size: 0.74rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .pinned-student-rank-footer {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
          border: 1px dashed rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-rank-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-rank-badge {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--apple-blue);
          color: #FFFFFF;
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .footer-rank-meta {
          display: flex;
          flex-direction: column;
        }

        .footer-rank-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .footer-rank-desc {
          font-size: 0.74rem;
          color: var(--text-secondary);
        }

        .footer-rank-right {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .footer-rank-score {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--apple-blue);
        }

        .footer-rank-unit {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        /* Minimal Podium */
        .podium-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 24px 16px 0;
          box-shadow: var(--shadow-sm);
        }

        .podium-container {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 12px;
          height: 220px;
        }

        .podium-col {
          flex: 1;
          max-width: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }

        .podium-student-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 10px;
          width: 100%;
          padding: 0 4px;
        }

        .podium-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .podium-score {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--apple-blue);
          margin-top: 2px;
        }

        .podium-pedestal {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top-left-radius: var(--radius-md);
          border-top-right-radius: var(--radius-md);
          transition: height 0.3s ease;
        }

        .podium-pedestal.p-1 {
          height: 120px;
          background: rgba(245, 158, 11, 0.14);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-bottom: none;
        }

        .podium-pedestal.p-2 {
          height: 85px;
          background: rgba(156, 163, 175, 0.14);
          border: 1px solid rgba(156, 163, 175, 0.3);
          border-bottom: none;
        }

        .podium-pedestal.p-3 {
          height: 60px;
          background: rgba(180, 83, 9, 0.12);
          border: 1px solid rgba(180, 83, 9, 0.25);
          border-bottom: none;
        }

        .podium-rank-num {
          font-size: 1.4rem;
          font-weight: 800;
          line-height: 1;
        }

        .p-1 .podium-rank-num {
          color: #D97706;
        }

        .p-2 .podium-rank-num {
          color: #6B7280;
        }

        .p-3 .podium-rank-num {
          color: #B45309;
        }

        .podium-empty {
          width: 100%;
          height: 100%;
          min-height: 80px;
          opacity: 0;
          pointer-events: none;
        }

        .podium-col.is-me .podium-name {
          color: var(--apple-blue);
        }

        /* Rankings Table */
        .rankings-table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          box-shadow: var(--shadow-sm);
        }

        .rankings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .rankings-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .rankings-count {
          font-size: 0.78rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .rankings-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ranking-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
          transition: background var(--transition-fast);
        }

        .ranking-row.is-me {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.25);
        }

        .rank-num-col {
          width: 36px;
          flex-shrink: 0;
        }

        .rank-badge {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-tertiary);
        }

        .rank-badge.top-1 {
          color: #D97706;
        }

        .rank-badge.top-2 {
          color: #6B7280;
        }

        .rank-badge.top-3 {
          color: #B45309;
        }

        .rank-name-col {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .rank-student-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ranking-row.is-me .rank-student-name {
          color: var(--apple-blue);
          font-weight: 700;
        }

        .rank-me-tag {
          font-size: 0.68rem;
          font-weight: 700;
          background: var(--apple-blue);
          color: #FFFFFF;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .rank-score-col {
          display: flex;
          align-items: baseline;
          gap: 3px;
          flex-shrink: 0;
        }

        .rank-score-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .rank-score-unit {
          font-size: 0.72rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        /* History Section */
        .history-section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          box-shadow: var(--shadow-sm);
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .history-header-left {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .history-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .history-count {
          font-size: 0.78rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .history-subfilter-segment {
          display: inline-flex;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 3px;
        }

        .history-subfilter-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.76rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          white-space: nowrap;
        }

        .history-subfilter-btn.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
          gap: 12px;
          transition: border-color var(--transition-fast);
        }

        .history-row.is-me-tx {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.05);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
        }

        .history-date-col {
          width: 90px;
          flex-shrink: 0;
        }

        .history-date {
          font-size: 0.76rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .history-desc-col {
          flex: 1;
          min-width: 0;
        }

        .history-comment {
          font-size: 0.86rem;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }

        .history-student-tag {
          font-weight: 700;
          color: var(--apple-blue);
          font-size: 0.82rem;
        }

        .history-amount-col {
          flex-shrink: 0;
        }

        .history-amount {
          font-size: 0.92rem;
          font-weight: 700;
        }

        .history-amount.positive {
          color: #2E7D32;
        }

        .history-amount.negative {
          color: #C62828;
        }

        .history-empty {
          text-align: center;
          padding: 24px 12px;
        }

        .history-empty-text {
          font-size: 0.86rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Today Daily Star & Today Empty States */
        .podium-today-star-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(251, 191, 36, 0.28));
          border: 1px solid rgba(245, 158, 11, 0.45);
          color: #B45309;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          margin-bottom: 6px;
          box-shadow: 0 1px 4px rgba(245, 158, 11, 0.15);
          animation: starPulse 2.4s ease-in-out infinite;
        }

        @keyframes starPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .star-icon {
          font-size: 0.72rem;
          line-height: 1;
        }

        .star-text {
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .ranking-row.is-daily-star {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.08), var(--bg-primary));
          border-color: rgba(245, 158, 11, 0.35);
        }

        .daily-star-tag {
          font-size: 0.68rem;
          font-weight: 700;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #FFFFFF;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(217, 119, 6, 0.25);
        }

        .today-empty-card {
          padding: 36px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .today-empty-icon {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }

        .today-empty-title {
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }

        .today-empty-desc {
          font-size: 0.84rem;
          color: var(--text-secondary);
          max-width: 420px;
          line-height: 1.45;
          margin: 0;
        }

        @media (max-width: 640px) {
          .podium-card,
          .rankings-table-card,
          .history-section-card {
            padding: 16px 14px;
            border-radius: var(--radius-lg);
          }

          .timeframe-btn {
            padding: 6px 12px;
            font-size: 0.76rem;
          }

          .podium-container {
            height: 190px;
            gap: 8px;
          }

          .podium-pedestal.p-1 {
            height: 100px;
          }
          .podium-pedestal.p-2 {
            height: 70px;
          }
          .podium-pedestal.p-3 {
            height: 50px;
          }

          .history-date-col {
            width: 75px;
          }
        }

        @media (max-width: 520px) {
          .rating-scope-segment {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            width: 100%;
          }

          .rating-scope-btn {
            padding: 8px 4px;
            font-size: 0.74rem;
            text-align: center;
          }

          .history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .history-subfilter-segment {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            text-align: center;
          }

          .history-subfilter-btn {
            text-align: center;
            padding: 6px 4px;
          }
        }

        /* Multi-Group Quick Switcher in Rating */
        .rating-group-switcher {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding: 8px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg, 12px);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .rating-group-switcher::-webkit-scrollbar {
          display: none;
        }

        .rating-group-label {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .rating-group-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: nowrap;
        }

        .rating-group-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 5px 12px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .rating-group-pill:hover {
          color: var(--text-primary);
          border-color: var(--apple-blue);
        }

        .rating-group-pill.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
          box-shadow: 0 2px 6px rgba(0, 113, 227, 0.25);
        }

        .rating-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34C759;
        }

        [data-theme="dark"] .rating-group-switcher {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .rating-group-pill {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .podium-card,
        [data-theme="dark"] .rankings-table-card,
        [data-theme="dark"] .history-section-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .ranking-row,
        [data-theme="dark"] .history-row {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .history-subfilter-segment {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .history-row.is-me-tx {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.4);
        }

        [data-theme="dark"] .podium-today-star-badge {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(251, 191, 36, 0.18));
          border-color: rgba(245, 158, 11, 0.5);
          color: #FBBF24;
        }

        [data-theme="dark"] .ranking-row.is-daily-star {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.14), rgba(255, 255, 255, 0.02));
          border-color: rgba(245, 158, 11, 0.4);
        }

        [data-theme="dark"] .p-1 .podium-rank-num {
          color: #FBBF24;
        }

        [data-theme="dark"] .p-2 .podium-rank-num {
          color: #E5E7EB;
        }

        [data-theme="dark"] .p-3 .podium-rank-num {
          color: #F59E0B;
        }

        [data-theme="dark"] .history-amount.positive {
          color: #81C995;
        }

        [data-theme="dark"] .history-amount.negative {
          color: #F28B82;
        }
      `}</style>
    </div>
  );
}
