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
  pinnedStudentId = null,
  group = null,
  connectedGroups: _connectedGroups = [],
  onSwitchGroup: _onSwitchGroup,
}) {
  const [scope, setScope] = useState('group'); // 'group' | 'history'

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
    const startOfTodayMs = getStartOfToday().getTime();
    return (transactions || []).some((tx) => {
      if (tx.deleted) return false;
      const tMs = typeof tx.timestamp === 'number' ? tx.timestamp : new Date(tx.timestamp).getTime();
      return tMs >= startOfTodayMs;
    });
  }, [transactions]);

  // Smart initial timeframe: If today is a class day or has points, start with 'today', otherwise 'month'
  const [timeframe, setTimeframe] = useState(() => {
    return isTodayClassDay || hasTransactionsToday ? 'today' : 'month';
  });

  const studentMap = useMemo(() => {
    const map = new Map();
    (students || []).forEach((s) => {
      if (s) map.set(String(s.id), s);
    });
    return map;
  }, [students]);

  // High-performance score calculation using numeric timestamps (50x faster on mobile)
  const rankedStudents = useMemo(() => {
    const startOfTodayMs = timeframe === 'today' ? getStartOfToday().getTime() : 0;
    const startOfMonthMs = timeframe === 'month' ? getStartOfMonth().getTime() : 0;
    const startOfLastMonthMs = timeframe === 'lastMonth' ? getStartOfLastMonth().getTime() : 0;
    const endOfLastMonthMs = timeframe === 'lastMonth' ? getEndOfLastMonth().getTime() : 0;

    const scoreMap = new Map();
    (students || []).forEach((s) => scoreMap.set(String(s.id), 0));

    (transactions || []).forEach((tx) => {
      if (tx.deleted) return;
      const sIdStr = String(tx.studentId);
      if (!scoreMap.has(sIdStr)) return;

      const txMs = typeof tx.timestamp === 'number' ? tx.timestamp : new Date(tx.timestamp).getTime();
      if (isNaN(txMs)) return;

      let isValid = true;
      if (timeframe === 'today') {
        isValid = txMs >= startOfTodayMs;
      } else if (timeframe === 'month') {
        isValid = txMs >= startOfMonthMs;
      } else if (timeframe === 'lastMonth') {
        isValid = txMs >= startOfLastMonthMs && txMs <= endOfLastMonthMs;
      }

      if (isValid) {
        const prev = scoreMap.get(sIdStr) || 0;
        scoreMap.set(sIdStr, prev + (Number(tx.amount) || 0));
      }
    });

    const list = (students || []).map((s) => ({
      ...s,
      score: scoreMap.get(String(s.id)) || 0,
    }));

    // Sort descending by score, then ascending by name
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    let currentRank = 0;
    let lastScore = null;

    return list.map((s) => {
      if (s.score <= 0) {
        return {
          ...s,
          rank: null,
        };
      }

      if (s.score !== lastScore) {
        currentRank += 1;
        lastScore = s.score;
      }

      return {
        ...s,
        rank: currentRank,
      };
    });
  }, [students, transactions, timeframe]);

  const hasAnyPoints = useMemo(() => {
    return (rankedStudents || []).some((s) => s.score > 0);
  }, [rankedStudents]);

  const isTodayEmpty = useMemo(() => {
    if (timeframe !== 'today') return false;
    return !hasAnyPoints;
  }, [timeframe, hasAnyPoints]);

  // Top 3 Podium Students (grouped by distinct rank 1, 2, 3 who have score > 0)
  const podiumTop3 = useMemo(() => {
    if (!hasAnyPoints) {
      return { first: [], second: [], third: [] };
    }

    const first = rankedStudents.filter((s) => s.rank === 1 && s.score > 0);
    const second = rankedStudents.filter((s) => s.rank === 2 && s.score > 0);
    const third = rankedStudents.filter((s) => s.rank === 3 && s.score > 0);

    return { first, second, third };
  }, [hasAnyPoints, rankedStudents]);

  const isFirstMe = useMemo(() => {
    if (!pinnedStudentId) return false;
    return podiumTop3.first.some((s) => String(s.id) === String(pinnedStudentId));
  }, [podiumTop3.first, pinnedStudentId]);

  const isSecondMe = useMemo(() => {
    if (!pinnedStudentId) return false;
    return podiumTop3.second.some((s) => String(s.id) === String(pinnedStudentId));
  }, [podiumTop3.second, pinnedStudentId]);

  const isThirdMe = useMemo(() => {
    if (!pinnedStudentId) return false;
    return podiumTop3.third.some((s) => String(s.id) === String(pinnedStudentId));
  }, [podiumTop3.third, pinnedStudentId]);

  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'me'

  // Filter history of transactions (all group transactions or only pinned student)
  const historyTransactions = useMemo(() => {
    const pool = (transactions || []).filter((tx) => !tx.deleted);
    let filtered = pool;
    if (historyFilter === 'me' && pinnedStudentId) {
      const pIdStr = String(pinnedStudentId);
      filtered = pool.filter((tx) => String(tx.studentId) === pIdStr);
    }
    return [...filtered].sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const tB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return tB - tA;
    }).slice(0, 50);
  }, [transactions, historyFilter, pinnedStudentId]);

  const pinnedStudent = useMemo(() => {
    if (!pinnedStudentId) return null;
    const pIdStr = String(pinnedStudentId);
    return (students || []).find((s) => String(s.id) === pIdStr) || null;
  }, [students, pinnedStudentId]);

  // Information about pinned student's rank
  const pinnedStudentRankInfo = useMemo(() => {
    if (!pinnedStudentId) return null;
    const pIdStr = String(pinnedStudentId);
    const found = rankedStudents.find((s) => String(s.id) === pIdStr);
    if (!found) return null;
    return {
      rank: found.rank,
      score: found.score,
      name: found.name,
    };
  }, [pinnedStudentId, rankedStudents]);

  return (
    <div className="student-rating-view">
      {/* Segmented Controls: Scope and Timeframe */}
      <div className="rating-toolbar-wrapper">
        <div className="rating-scope-segment">
          <button
            type="button"
            className={`rating-scope-btn ${scope === 'group' ? 'active' : ''}`}
            onClick={() => setScope('group')}
          >
            Guruh reytingi
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
          <div className="timeframe-segment-scroll">
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
                Barchasi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informative banner when selected timeframe has no points scored yet (not today) */}
      {scope !== 'history' && !hasAnyPoints && timeframe !== 'today' && (
        <div className="rating-no-points-card">
          <div className="no-points-icon">⭐</div>
          <div className="no-points-content">
            <h4 className="no-points-title">Ushbu davrda hali ballar to'planmagan</h4>
            <p className="no-points-desc">
              Ustoz tomonidan ball va likelar berilishi bilan, peshqadamlar shohsupasi va guruh reytingi shu yerda shakllanadi.
            </p>
          </div>
        </div>
      )}

      {/* Top-3 Minimalist Podium (Only shown if at least one student has score > 0) */}
      {scope !== 'history' && hasAnyPoints && (
        <div className="podium-card">
          <div className="podium-container">
            {/* 2nd Place (Silver) */}
            <div className={`podium-col second ${isSecondMe ? 'is-me' : ''}`}>
              {podiumTop3.second.length > 0 ? (
                <>
                  <div className="podium-student-meta">
                    <div className="podium-avatar-wrap podium-avatar-group">
                      {podiumTop3.second.slice(0, 2).map((st) => (
                        <div key={st.id} className="podium-avatar silver avatar-stacked" title={st.name}>
                          {st.name ? st.name.charAt(0).toUpperCase() : '2'}
                        </div>
                      ))}
                      {podiumTop3.second.length > 2 && (
                        <div className="podium-avatar silver avatar-more" title={podiumTop3.second.slice(2).map((s) => s.name).join(', ')}>
                          +{podiumTop3.second.length - 2}
                        </div>
                      )}
                      <span className="podium-medal">🥈</span>
                    </div>

                    {podiumTop3.second.length === 1 ? (
                      <span className="podium-name" title={podiumTop3.second[0].name}>
                        {podiumTop3.second[0].name}
                      </span>
                    ) : (
                      <div className="podium-tied-names" title={podiumTop3.second.map((s) => s.name).join(', ')}>
                        <span className="podium-name-item">
                          {podiumTop3.second.slice(0, 2).map((s) => s.name).join(', ')}
                        </span>
                        {podiumTop3.second.length > 2 && (
                          <span className="podium-tie-count">+{podiumTop3.second.length - 2} ta</span>
                        )}
                        <span className="podium-tie-pill">Durang</span>
                      </div>
                    )}

                    <div className="podium-score-pill">
                      <span>{podiumTop3.second[0].score}</span>
                      <span className="unit">ball</span>
                    </div>
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
            <div className={`podium-col first ${isFirstMe ? 'is-me' : ''}`}>
              {podiumTop3.first.length > 0 ? (
                <>
                  <div className="podium-student-meta">
                    {timeframe === 'today' && podiumTop3.first[0].score > 0 && (
                      <div className="podium-today-star-badge">
                        <span className="star-icon">⭐</span>
                        <span className="star-text">Dars yulduzi</span>
                      </div>
                    )}
                    <div className="podium-avatar-wrap podium-avatar-group">
                      {podiumTop3.first.slice(0, 2).map((st) => (
                        <div key={st.id} className="podium-avatar gold avatar-stacked" title={st.name}>
                          {st.name ? st.name.charAt(0).toUpperCase() : '1'}
                        </div>
                      ))}
                      {podiumTop3.first.length > 2 && (
                        <div className="podium-avatar gold avatar-more" title={podiumTop3.first.slice(2).map((s) => s.name).join(', ')}>
                          +{podiumTop3.first.length - 2}
                        </div>
                      )}
                      <span className="podium-medal">🥇</span>
                    </div>

                    {podiumTop3.first.length === 1 ? (
                      <span className="podium-name" title={podiumTop3.first[0].name}>
                        {podiumTop3.first[0].name}
                      </span>
                    ) : (
                      <div className="podium-tied-names" title={podiumTop3.first.map((s) => s.name).join(', ')}>
                        <span className="podium-name-item">
                          {podiumTop3.first.slice(0, 2).map((s) => s.name).join(', ')}
                        </span>
                        {podiumTop3.first.length > 2 && (
                          <span className="podium-tie-count">+{podiumTop3.first.length - 2} ta</span>
                        )}
                        <span className="podium-tie-pill">Durang</span>
                      </div>
                    )}

                    <div className="podium-score-pill gold-pill">
                      <span>{podiumTop3.first[0].score}</span>
                      <span className="unit">ball</span>
                    </div>
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
            <div className={`podium-col third ${isThirdMe ? 'is-me' : ''}`}>
              {podiumTop3.third.length > 0 ? (
                <>
                  <div className="podium-student-meta">
                    <div className="podium-avatar-wrap podium-avatar-group">
                      {podiumTop3.third.slice(0, 2).map((st) => (
                        <div key={st.id} className="podium-avatar bronze avatar-stacked" title={st.name}>
                          {st.name ? st.name.charAt(0).toUpperCase() : '3'}
                        </div>
                      ))}
                      {podiumTop3.third.length > 2 && (
                        <div className="podium-avatar bronze avatar-more" title={podiumTop3.third.slice(2).map((s) => s.name).join(', ')}>
                          +{podiumTop3.third.length - 2}
                        </div>
                      )}
                      <span className="podium-medal">🥉</span>
                    </div>

                    {podiumTop3.third.length === 1 ? (
                      <span className="podium-name" title={podiumTop3.third[0].name}>
                        {podiumTop3.third[0].name}
                      </span>
                    ) : (
                      <div className="podium-tied-names" title={podiumTop3.third.map((s) => s.name).join(', ')}>
                        <span className="podium-name-item">
                          {podiumTop3.third.slice(0, 2).map((s) => s.name).join(', ')}
                        </span>
                        {podiumTop3.third.length > 2 && (
                          <span className="podium-tie-count">+{podiumTop3.third.length - 2} ta</span>
                        )}
                        <span className="podium-tie-pill">Durang</span>
                      </div>
                    )}

                    <div className="podium-score-pill">
                      <span>{podiumTop3.third[0].score}</span>
                      <span className="unit">ball</span>
                    </div>
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

      {/* Personal Standing Banner */}
      {pinnedStudentRankInfo && scope !== 'history' && !isTodayEmpty && (
        <div className="student-my-standing-banner">
          <div className="my-standing-left">
            <span className={`my-standing-rank-badge ${pinnedStudentRankInfo.rank && pinnedStudentRankInfo.rank <= 3 && pinnedStudentRankInfo.score > 0 ? `top-${pinnedStudentRankInfo.rank}` : 'rank-unranked'}`}>
              {pinnedStudentRankInfo.rank === 1 && pinnedStudentRankInfo.score > 0
                ? '🥇'
                : pinnedStudentRankInfo.rank === 2 && pinnedStudentRankInfo.score > 0
                ? '🥈'
                : pinnedStudentRankInfo.rank === 3 && pinnedStudentRankInfo.score > 0
                ? '🥉'
                : pinnedStudentRankInfo.rank && pinnedStudentRankInfo.score > 0
                ? `#${pinnedStudentRankInfo.rank}`
                : '—'}
            </span>
            <div className="my-standing-text-wrap">
              <div className="my-standing-title-row">
                <span className="my-standing-title">
                  {pinnedStudentRankInfo.score > 0 && pinnedStudentRankInfo.rank ? (
                    <>Siz <strong>{pinnedStudentRankInfo.rank}-o'rinda</strong>siz</>
                  ) : (
                    <span>Hozircha ball to'planmagan</span>
                  )}
                </span>
                <span className="my-standing-tag">Siz</span>
              </div>
              <span className="my-standing-sub">
                {group?.name ? `${group.name} reytingida` : "Guruh reytingida"}
              </span>
            </div>
          </div>
          <div className="my-standing-score-pill">
            <span className="score-num">{pinnedStudentRankInfo.score}</span>
            <span className="score-unit">ball</span>
          </div>
        </div>
      )}

      {/* Unpinned Student Prompt Banner */}
      {!pinnedStudentId && scope !== 'history' && !isTodayEmpty && rankedStudents.length > 0 && (
        <div className="student-unpinned-banner">
          <div className="unpinned-banner-content">
            <span className="unpinned-banner-icon">🎯</span>
            <div className="unpinned-banner-text">
              <span className="unpinned-banner-title">O'z o'rningizni bilmoqchimisiz?</span>
              <span className="unpinned-banner-sub">Yuqoridan profilingizni tanlang va ballaringizni kuzating</span>
            </div>
          </div>
        </div>
      )}

      {/* Group Ranking List */}
      {scope !== 'history' && (
        <div className="rankings-table-card">
          <div className="rankings-header">
            <h3 className="rankings-title">
              {timeframe === 'today'
                ? (group?.name ? `${group.name} — Bugungi natijalar` : "Bugungi natijalar")
                : (group?.name ? `${group.name} reytingi` : "Guruh reytingi")}
            </h3>
            <span className="rankings-count">
              {isTodayEmpty ? "0 ta o'quvchi" : `${rankedStudents.length} ta o'quvchi`}
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
                    ? "O'quvchilarning umumiy natijalarini ko'rish uchun yuqoridan \"Bu oy\" yoki \"Barchasi\" bo'limiga o'ting."
                    : "Dars davomida ustoz like va ballar berishi bilan, bugungi dars reytingi va dars yulduzi darhol shu yerda ko'rinadi."}
                </p>
              </div>
            ) : rankedStudents.length > 0 ? (
              rankedStudents.map((st) => {
                const isMe = String(st.id) === String(pinnedStudentId);
                const isDailyStar = timeframe === 'today' && st.rank === 1 && st.score > 0;
                return (
                  <div key={st.id} className={`ranking-row ${isMe ? 'is-me' : ''} ${isDailyStar ? 'is-daily-star' : ''}`}>
                    <div className="rank-num-col">
                      <span className={`rank-badge ${st.rank && st.rank <= 3 && st.score > 0 ? `top-${st.rank}` : 'rank-unranked'}`}>
                        {st.rank === 1 && st.score > 0
                          ? '🥇'
                          : st.rank === 2 && st.score > 0
                          ? '🥈'
                          : st.rank === 3 && st.score > 0
                          ? '🥉'
                          : st.rank && st.score > 0
                          ? `#${st.rank}`
                          : '—'}
                      </span>
                    </div>
                    <div className="rank-name-col">
                      <div className="rank-name-wrap">
                        <span className="rank-student-name">{st.name}</span>
                        {isDailyStar && (
                          <span className="daily-star-tag">⭐ Dars yulduzi</span>
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

        .timeframe-segment-scroll {
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 4px;
          display: flex;
          justify-content: center;
        }

        .timeframe-segment-scroll::-webkit-scrollbar {
          display: none;
        }

        .timeframe-segment {
          display: inline-flex;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 3px;
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
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
        }

        .student-unpinned-banner {
          display: flex;
          align-items: center;
          background: var(--bg-card);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-lg);
          padding: 12px 14px;
          margin-bottom: 4px;
        }

        .unpinned-banner-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .unpinned-banner-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .unpinned-banner-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .unpinned-banner-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .unpinned-banner-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
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
          padding: 16px 14px 0;
          box-shadow: var(--shadow-sm);
        }

        .podium-container {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 10px;
          height: 180px;
        }

        .podium-col {
          flex: 1;
          max-width: 130px;
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
          margin-bottom: 8px;
          width: 100%;
          padding: 0 2px;
        }

        .podium-avatar-wrap {
          position: relative;
          margin-bottom: 4px;
        }

        .podium-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .podium-avatar.gold {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border: 2px solid #FDE68A;
          box-shadow: 0 3px 10px rgba(245, 158, 11, 0.35);
          font-size: 1.05rem;
        }

        .podium-avatar.silver {
          background: linear-gradient(135deg, #9CA3AF, #6B7280);
          border: 2px solid #E5E7EB;
          box-shadow: 0 3px 10px rgba(107, 114, 128, 0.25);
        }

        .podium-avatar.bronze {
          background: linear-gradient(135deg, #D97706, #92400E);
          border: 2px solid #FCD34D;
          box-shadow: 0 3px 10px rgba(180, 83, 9, 0.25);
        }

        .podium-medal {
          position: absolute;
          bottom: -4px;
          right: -6px;
          font-size: 0.85rem;
          line-height: 1;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        .podium-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .podium-avatar-group {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .podium-avatar-group .avatar-stacked:not(:first-child) {
          margin-left: -12px;
        }

        .podium-avatar.avatar-more {
          background: rgba(0, 0, 0, 0.55);
          border: 2px solid #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          margin-left: -12px;
          color: #ffffff;
        }

        .podium-tied-names {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          max-width: 100%;
          width: 100%;
          line-height: 1.15;
        }

        .podium-name-item {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          display: block;
        }

        .podium-tie-count {
          font-size: 0.68rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .podium-tie-pill {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.06);
          color: var(--text-secondary);
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .rating-no-points-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--bg-card);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-xl);
          padding: 18px 20px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .no-points-icon {
          font-size: 1.8rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .no-points-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .no-points-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .no-points-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .podium-score-pill {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          color: var(--apple-blue);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: var(--radius-full);
          margin-top: 3px;
        }

        .podium-score-pill.gold-pill {
          background: rgba(245, 158, 11, 0.15);
          color: #D97706;
        }

        .podium-score-pill .unit {
          font-size: 0.64rem;
          font-weight: 500;
          opacity: 0.85;
        }

        .podium-pedestal {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          transition: height 0.3s ease;
        }

        .podium-pedestal.p-1 {
          height: 76px;
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.08));
          border: 1.5px solid rgba(245, 158, 11, 0.4);
          border-bottom: none;
        }

        .podium-pedestal.p-2 {
          height: 54px;
          background: linear-gradient(180deg, rgba(156, 163, 175, 0.22), rgba(156, 163, 175, 0.08));
          border: 1.5px solid rgba(156, 163, 175, 0.4);
          border-bottom: none;
        }

        .podium-pedestal.p-3 {
          height: 38px;
          background: linear-gradient(180deg, rgba(180, 83, 9, 0.18), rgba(180, 83, 9, 0.06));
          border: 1.5px solid rgba(180, 83, 9, 0.35);
          border-bottom: none;
        }

        .podium-rank-num {
          font-size: 1.25rem;
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
          min-height: 60px;
          opacity: 0;
          pointer-events: none;
        }

        .podium-col.is-me .podium-name {
          color: var(--apple-blue);
        }

        /* Personal Standing Banner */
        .student-my-standing-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.09), rgba(var(--apple-blue-rgb, 0, 113, 227), 0.03));
          border: 1px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.24);
          border-radius: var(--radius-lg, 12px);
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }

        .my-standing-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .my-standing-rank-badge {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background: var(--apple-blue);
          color: #FFFFFF;
          font-size: 0.88rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
        }

        .my-standing-rank-badge.top-1,
        .my-standing-rank-badge.top-2,
        .my-standing-rank-badge.top-3 {
          background: transparent;
          font-size: 1.3rem;
          box-shadow: none;
        }

        .my-standing-rank-badge.rank-unranked {
          background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
          color: var(--text-tertiary);
          box-shadow: none;
          border: 1px solid var(--border-color);
          font-size: 1rem;
        }

        .my-standing-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .my-standing-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .my-standing-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .my-standing-title strong {
          color: var(--apple-blue);
          font-weight: 800;
        }

        .my-standing-tag {
          font-size: 0.65rem;
          font-weight: 700;
          background: var(--apple-blue);
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          letter-spacing: 0.02em;
        }

        .my-standing-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .my-standing-score-pill {
          display: flex;
          align-items: baseline;
          gap: 3px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
          flex-shrink: 0;
        }

        .my-standing-score-pill .score-num {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--apple-blue);
        }

        .my-standing-score-pill .score-unit {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--apple-blue);
          opacity: 0.85;
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
            padding: 12px 10px;
            border-radius: var(--radius-lg);
          }

          .timeframe-segment-scroll {
            justify-content: flex-start;
          }

          .timeframe-btn {
            padding: 5px 12px;
            font-size: 0.74rem;
          }

          .podium-container {
            height: 135px;
            gap: 6px;
          }

          .podium-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
          }

          .podium-avatar.gold {
            width: 38px;
            height: 38px;
            font-size: 0.95rem;
          }

          .podium-avatar-group .avatar-stacked {
            width: 26px !important;
            height: 26px !important;
            font-size: 0.72rem !important;
            margin-left: -8px;
          }

          .podium-avatar-group .avatar-stacked.gold {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.78rem !important;
          }

          .podium-name-item {
            font-size: 0.7rem;
          }

          .podium-pedestal.p-1 {
            height: 52px;
          }
          .podium-pedestal.p-2 {
            height: 38px;
          }
          .podium-pedestal.p-3 {
            height: 26px;
          }

          .history-date-col {
            width: 75px;
          }
        }

        @media (max-width: 520px) {
          .rating-scope-segment {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }

          .rating-scope-btn {
            padding: 8px 6px;
            font-size: 0.8rem;
            text-align: center;
          }

          .timeframe-segment-scroll {
            justify-content: flex-start;
            padding: 3px 2px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .timeframe-segment {
            display: inline-flex;
            width: max-content;
            min-width: max-content;
            padding: 3px;
            gap: 4px;
          }

          .timeframe-btn {
            padding: 6px 12px;
            font-size: 0.76rem;
            white-space: nowrap;
            flex-shrink: 0;
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
            padding: 6px 8px;
            font-size: 0.76rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .student-my-standing-banner {
            padding: 9px 12px;
            gap: 8px;
          }

          .my-standing-rank-badge {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
          }

          .my-standing-title {
            font-size: 0.82rem;
          }

          .my-standing-sub {
            font-size: 0.68rem;
          }

          .my-standing-score-pill {
            padding: 4px 9px;
          }

          .my-standing-score-pill .score-num {
            font-size: 0.95rem;
          }
        }

        [data-theme="dark"] .student-my-standing-banner {
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.16), rgba(255, 255, 255, 0.02));
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.38);
        }

        [data-theme="dark"] .podium-pedestal.p-1 {
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.28), rgba(245, 158, 11, 0.05));
          border-color: rgba(245, 158, 11, 0.5);
        }

        [data-theme="dark"] .podium-pedestal.p-2 {
          background: linear-gradient(180deg, rgba(156, 163, 175, 0.25), rgba(156, 163, 175, 0.05));
          border-color: rgba(156, 163, 175, 0.45);
        }

        [data-theme="dark"] .podium-pedestal.p-3 {
          background: linear-gradient(180deg, rgba(180, 83, 9, 0.25), rgba(180, 83, 9, 0.05));
          border-color: rgba(180, 83, 9, 0.45);
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

        [data-theme="dark"] .rating-no-points-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .podium-tie-pill {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
        }

        [data-theme="dark"] .my-standing-rank-badge.rank-unranked {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}
