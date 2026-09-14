import React, { useState, useMemo, useEffect } from 'react';
import { getStartOfToday, getStartOfMonth, getStartOfLastMonth, getEndOfLastMonth } from '../../utils/db';
import { renderAvatar } from '../../utils/studentAvatars';
import { LikeIcon, CrownIcon, ZapIcon, FlameIcon, StarIcon } from './StudentIcons';

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const UZBEK_MONTH_SHORT = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
  'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
];

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

const formatTxDate = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  if (isToday) return `Bugun, ${timeStr}`;
  if (isYesterday) return `Kecha, ${timeStr}`;
  const day = d.getDate();
  const month = UZBEK_MONTH_SHORT[d.getMonth()];
  return `${day}-${month}, ${timeStr}`;
};

export default function StudentRatingView({
  students = [],
  transactions = [],
  pinnedStudentId = null,
  pinnedStudent = null,
  group = null,
  connectedGroups: _connectedGroups = [],
  onSwitchGroup: _onSwitchGroup,
  initialTimeframe = null,
}) {
  const activePinnedStudent = useMemo(() => {
    if (pinnedStudent) return pinnedStudent;
    if (!pinnedStudentId) return null;
    return (students || []).find((s) => String(s.id) === String(pinnedStudentId)) || null;
  }, [pinnedStudent, pinnedStudentId, students]);

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
    if (days.length === 0) return true;
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

  // Initial timeframe selection: if explicitly passed use it; otherwise today only if active likes exist today, else month
  const [timeframe, setTimeframe] = useState(() => {
    if (initialTimeframe) return initialTimeframe;
    return hasTransactionsToday ? 'today' : 'month';
  });

  useEffect(() => {
    if (initialTimeframe) {
      setTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);

  const studentMap = useMemo(() => {
    const map = new Map();
    (students || []).forEach((s) => {
      if (s) map.set(String(s.id), s);
    });
    return map;
  }, [students]);

  // High-performance score calculation
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

    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    let currentRank = 0;
    let lastScore = null;

    return list.map((s) => {
      if (s.score <= 0) {
        return { ...s, rank: null };
      }
      if (s.score !== lastScore) {
        currentRank += 1;
        lastScore = s.score;
      }
      return { ...s, rank: currentRank };
    });
  }, [students, transactions, timeframe]);

  const hasAnyPoints = useMemo(() => {
    return (rankedStudents || []).some((s) => s.score > 0);
  }, [rankedStudents]);

  const totalLikesInTimeframe = useMemo(() => {
    return (rankedStudents || []).reduce((sum, s) => sum + (s.score > 0 ? s.score : 0), 0);
  }, [rankedStudents]);

  const isTodayEmpty = useMemo(() => {
    if (timeframe !== 'today') return false;
    return !hasAnyPoints;
  }, [timeframe, hasAnyPoints]);

  // Top 3 Podium Students
  const podiumTop3 = useMemo(() => {
    if (!hasAnyPoints) {
      return { first: [], second: [], third: [] };
    }
    const first = rankedStudents.filter((s) => s.rank === 1 && s.score > 0);
    const second = rankedStudents.filter((s) => s.rank === 2 && s.score > 0);
    const third = rankedStudents.filter((s) => s.rank === 3 && s.score > 0);
    return { first, second, third };
  }, [hasAnyPoints, rankedStudents]);

  const currentPinnedId = useMemo(() => {
    return pinnedStudentId ? String(pinnedStudentId) : (activePinnedStudent ? String(activePinnedStudent.id) : null);
  }, [pinnedStudentId, activePinnedStudent]);

  const isFirstMe = useMemo(() => {
    if (!currentPinnedId) return false;
    return podiumTop3.first.some((s) => String(s.id) === currentPinnedId);
  }, [podiumTop3.first, currentPinnedId]);

  const isSecondMe = useMemo(() => {
    if (!currentPinnedId) return false;
    return podiumTop3.second.some((s) => String(s.id) === currentPinnedId);
  }, [podiumTop3.second, currentPinnedId]);

  const isThirdMe = useMemo(() => {
    if (!currentPinnedId) return false;
    return podiumTop3.third.some((s) => String(s.id) === currentPinnedId);
  }, [podiumTop3.third, currentPinnedId]);

  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'me'

  const historyTransactions = useMemo(() => {
    const pool = (transactions || []).filter((tx) => !tx.deleted);
    let filtered = pool;
    if (historyFilter === 'me' && currentPinnedId) {
      filtered = pool.filter((tx) => String(tx.studentId) === currentPinnedId);
    }
    return [...filtered].sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const tB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return tB - tA;
    }).slice(0, 60);
  }, [transactions, historyFilter, currentPinnedId]);

  const pinnedStudentRankInfo = useMemo(() => {
    if (!currentPinnedId) return null;
    const found = rankedStudents.find((s) => String(s.id) === currentPinnedId);
    if (!found) return null;
    return {
      rank: found.rank,
      score: found.score,
      name: found.name,
    };
  }, [currentPinnedId, rankedStudents]);

  return (
    <div className="student-rating-view">
      {/* Scope Navigation Segmented Bar */}
      <div className="rating-toolbar">
        <div className="rating-scope-nav" role="tablist">
          <button
            type="button"
            className={`rating-scope-tab ${scope === 'group' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setScope('group');
            }}
            role="tab"
            aria-selected={scope === 'group'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span>Guruh reytingi</span>
          </button>
          <button
            type="button"
            className={`rating-scope-tab ${scope === 'history' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setScope('history');
            }}
            role="tab"
            aria-selected={scope === 'history'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>Like'lar tarixi</span>
          </button>
        </div>

        {/* Timeframe Filter Pills */}
        {scope !== 'history' && (
          <div className="rating-timeframe-scroll">
            <div className="rating-timeframe-pills">
              <button
                type="button"
                className={`timeframe-pill ${timeframe === 'today' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setTimeframe('today');
                }}
              >
                Bugun
              </button>
              <button
                type="button"
                className={`timeframe-pill ${timeframe === 'month' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setTimeframe('month');
                }}
              >
                Bu oy
              </button>
              <button
                type="button"
                className={`timeframe-pill ${timeframe === 'lastMonth' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setTimeframe('lastMonth');
                }}
              >
                O'tgan oy
              </button>
              <button
                type="button"
                className={`timeframe-pill ${timeframe === 'all' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setTimeframe('all');
                }}
              >
                Barchasi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shohsupa / Podium Section (Shown when points exist) */}
      {scope !== 'history' && hasAnyPoints && (
        <div className="podium-glass-card">
          <div className="podium-card-header">
            <div className="podium-header-titles">
              <span className="live-like-pill-tag">
                <LikeIcon size={12} color="#0071E3" /> Jonli Like
              </span>
              <span className="podium-eyebrow">
                {timeframe === 'month' ? "Oylik Musobaqa" : timeframe === 'today' ? "Bugungi Dars Peshqadamlari" : "Peshqadamlar"}
              </span>
            </div>
            <span className="podium-timeframe-label">
              {timeframe === 'today' ? "Bugungi jonli Like'lar" : timeframe === 'month' ? "Bu oylik Like natijalari" : timeframe === 'lastMonth' ? "O'tgan oylik natijalar" : "Barcha davrlar"}
            </span>
          </div>

          <div className="podium-stage">
            {/* 2nd Place (Silver) */}
            <div className={`podium-column col-2 ${isSecondMe ? 'is-me-podium' : ''}`}>
              {podiumTop3.second.length > 0 ? (
                <>
                  <div className="podium-student-bubble">
                    <div className="podium-avatar-wrap silver-ring">
                      <div className="podium-avatar silver">
                        {podiumTop3.second[0].emoji
                          ? renderAvatar(podiumTop3.second[0].emoji, 38)
                          : podiumTop3.second[0].name.charAt(0).toUpperCase()}
                      </div>
                      <span className="podium-badge-icon silver">#2</span>
                    </div>

                    <span className="podium-student-name" title={podiumTop3.second.map(s => s.name).join(', ')}>
                      {podiumTop3.second[0].name.split(' ')[0]}
                      {podiumTop3.second.length > 1 && <span className="tie-count">+{podiumTop3.second.length - 1}</span>}
                    </span>

                    <div className="podium-points-chip silver-chip">
                      <LikeIcon size={12} color="#4B5563" />
                      <span>{podiumTop3.second[0].score}</span>
                      <span className="unit">Like</span>
                    </div>
                  </div>

                  <div className="podium-stand stand-2">
                    <span className="stand-rank">2</span>
                  </div>
                </>
              ) : (
                <div className="podium-empty-stand" />
              )}
            </div>

            {/* 1st Place (Gold / Champion) */}
            <div className={`podium-column col-1 ${isFirstMe ? 'is-me-podium' : ''}`}>
              {podiumTop3.first.length > 0 ? (
                <>
                  <div className="podium-student-bubble champion">
                    {timeframe === 'today' && podiumTop3.first[0].score > 0 && (
                      <div className="daily-star-crown">
                        <ZapIcon size={12} color="#FFFFFF" />
                        <span>Bugungi dars yetakchisi</span>
                      </div>
                    )}
                    {timeframe === 'month' && podiumTop3.first[0].score > 0 && (
                      <div className="daily-star-crown monthly-crown">
                        <CrownIcon size={13} color="#FFFFFF" />
                        <span>Oylik Like Chempioni</span>
                      </div>
                    )}
                    {(timeframe === 'all' || timeframe === 'lastMonth') && podiumTop3.first[0].score > 0 && (
                      <div className="daily-star-crown">
                        <StarIcon size={12} color="#FFFFFF" />
                        <span>Like Yetakchisi</span>
                      </div>
                    )}
                    <div className="podium-avatar-wrap gold-ring">
                      <div className="podium-avatar gold">
                        {podiumTop3.first[0].emoji
                          ? renderAvatar(podiumTop3.first[0].emoji, 46)
                          : podiumTop3.first[0].name.charAt(0).toUpperCase()}
                      </div>
                      <span className="podium-badge-icon gold">
                        <CrownIcon size={12} color="#FFFFFF" />
                      </span>
                    </div>

                    <span className="podium-student-name champion-name" title={podiumTop3.first.map(s => s.name).join(', ')}>
                      {podiumTop3.first[0].name.split(' ')[0]}
                      {podiumTop3.first.length > 1 && <span className="tie-count">+{podiumTop3.first.length - 1}</span>}
                    </span>

                    <div className="podium-points-chip gold-chip">
                      <LikeIcon size={12} color="#B45309" />
                      <span>{podiumTop3.first[0].score}</span>
                      <span className="unit">Like</span>
                    </div>
                  </div>

                  <div className="podium-stand stand-1">
                    <span className="stand-rank">1</span>
                  </div>
                </>
              ) : (
                <div className="podium-empty-stand" />
              )}
            </div>

            {/* 3rd Place (Bronze) */}
            <div className={`podium-column col-3 ${isThirdMe ? 'is-me-podium' : ''}`}>
              {podiumTop3.third.length > 0 ? (
                <>
                  <div className="podium-student-bubble">
                    <div className="podium-avatar-wrap bronze-ring">
                      <div className="podium-avatar bronze">
                        {podiumTop3.third[0].emoji
                          ? renderAvatar(podiumTop3.third[0].emoji, 38)
                          : podiumTop3.third[0].name.charAt(0).toUpperCase()}
                      </div>
                      <span className="podium-badge-icon bronze">#3</span>
                    </div>

                    <span className="podium-student-name" title={podiumTop3.third.map(s => s.name).join(', ')}>
                      {podiumTop3.third[0].name.split(' ')[0]}
                      {podiumTop3.third.length > 1 && <span className="tie-count">+{podiumTop3.third.length - 1}</span>}
                    </span>

                    <div className="podium-points-chip bronze-chip">
                      <LikeIcon size={12} color="#92400E" />
                      <span>{podiumTop3.third[0].score}</span>
                      <span className="unit">Like</span>
                    </div>
                  </div>

                  <div className="podium-stand stand-3">
                    <span className="stand-rank">3</span>
                  </div>
                </>
              ) : (
                <div className="podium-empty-stand" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Standing Banner */}
      {pinnedStudentRankInfo && scope !== 'history' && !isTodayEmpty && (
        <div className="personal-standing-card">
          <div className="personal-standing-left">
            <div className={`personal-rank-pill ${pinnedStudentRankInfo.rank && pinnedStudentRankInfo.rank <= 3 ? `top-${pinnedStudentRankInfo.rank}` : 'general'}`}>
              {pinnedStudentRankInfo.rank && pinnedStudentRankInfo.score > 0
                ? `#${pinnedStudentRankInfo.rank}`
                : '—'}
            </div>
            <div className="personal-standing-meta">
              <div className="standing-headline">
                <span className="standing-title">
                  {pinnedStudentRankInfo.score > 0 && pinnedStudentRankInfo.rank ? (
                    <>Siz <strong>{pinnedStudentRankInfo.rank}-o'rinda</strong>siz</>
                  ) : (
                    <span>Hozircha Like to'planmagan</span>
                  )}
                </span>
                <span className="standing-tag-you">Siz</span>
              </div>
              <span className="standing-subtitle">
                {pinnedStudentRankInfo.rank === 1
                  ? "Ajoyib natija! Guruhda 1-o'rinda peshqadamsiz"
                  : pinnedStudentRankInfo.rank && pinnedStudentRankInfo.rank <= 3
                  ? "Shohsupadasiz (Top-3)! 1-o'rin uchun yanada ko'proq Like to'plang!"
                  : pinnedStudentRankInfo.score > 0
                  ? "Oldinga intiling! Har bir faol dars oylik o'rningizni ko'taradi!"
                  : (group?.name ? `${group.name} Like reytingida` : "Guruh Like reytingida")}
              </span>
            </div>
          </div>
          <div className="personal-standing-points like-standing-points">
            <span className="standing-heart-pulse">
              <LikeIcon size={14} color="#FFFFFF" />
            </span>
            <span className="pts-number">{pinnedStudentRankInfo.score}</span>
            <span className="pts-unit">Like</span>
          </div>
        </div>
      )}

      {/* Unpinned Banner */}
      {!pinnedStudentId && scope !== 'history' && !isTodayEmpty && rankedStudents.length > 0 && (
        <div className="unpinned-prompt-card">
          <div className="prompt-left">
            <span className="prompt-icon">
              <LikeIcon size={18} color="#0071E3" />
            </span>
            <div className="prompt-text">
              <span className="prompt-title">O'z Like'laringiz va o'rningizni kuzatmoqchimisiz?</span>
              <span className="prompt-sub">Tepadagi profilingiz tugmasi orqali ismingizni tanlang</span>
            </div>
          </div>
        </div>
      )}

      {/* Group Ranking Table */}
      {scope !== 'history' && (
        <div className="rankings-table-card">
          <div className="rankings-card-header">
            <div className="header-text-col">
              <h3 className="rankings-title">
                {timeframe === 'today'
                  ? (group?.name ? `${group.name} — Bugungi Like'lar` : "Bugungi Jonli Like'lar")
                  : timeframe === 'month'
                  ? (group?.name ? `${group.name} — Oylik Reyting` : "Oylik Like Reytingi")
                  : (group?.name ? `${group.name} reytingi` : "Guruh Like reytingi")}
              </h3>
              <span className="rankings-subtitle">
                {isTodayEmpty ? "0 ta Like" : `${rankedStudents.length} nafar o'quvchi • Jami ${totalLikesInTimeframe} Like`}
              </span>
            </div>
            {timeframe === 'month' && (
              <span className="monthly-comp-badge">
                <FlameIcon size={12} color="#FF9500" />
                <span>Sog'lom raqobat</span>
              </span>
            )}
            {timeframe === 'today' && (
              <span className="live-session-badge">
                <ZapIcon size={12} color="#F59E0B" />
                <span>Jonli dars</span>
              </span>
            )}
          </div>

          <div className="rankings-list">
            {isTodayEmpty ? (
              <div className="rankings-empty-box">
                <div className="empty-icon-wrap">
                  {!isTodayClassDay ? <StarIcon size={32} color="#94A3B8" /> : <LikeIcon size={32} color="#0071E3" />}
                </div>
                <h4 className="empty-title">
                  {!isTodayClassDay ? "Bugun dars kuni emas" : "Bugun hali Like'lar berilmadi"}
                </h4>
                <p className="empty-desc">
                  {!isTodayClassDay
                    ? "Guruhning oylik ko'rsatkichlari va Like reytingini ko'rish uchun yuqoridagi tugmalardan \"Bu oy\" yoki \"Barchasi\"ni tanlang."
                    : "Ustoz dars davomida topshiriqlar va faollik uchun jonli Like'lar berishi bilan oylik reyting darhol yangilanadi va sog'lom raqobat boshlanadi."}
                </p>
                <button
                  type="button"
                  className="empty-action-btn"
                  onClick={() => setTimeframe('month')}
                >
                  <FlameIcon size={13} color="#FFFFFF" />
                  <span>Bu oylik natijalarni ko'rish</span>
                </button>
              </div>
            ) : rankedStudents.length > 0 ? (
              rankedStudents.map((st) => {
                const isMe = String(st.id) === String(pinnedStudentId);
                const isDailyStar = timeframe === 'today' && st.rank === 1 && st.score > 0;
                const isMonthlyLeader = timeframe === 'month' && st.rank === 1 && st.score > 0;
                const isTop3 = (timeframe === 'month' || timeframe === 'all') && st.rank && st.rank > 1 && st.rank <= 3 && st.score > 0;

                return (
                  <div
                    key={st.id}
                    className={`rank-item-row ${isMe ? 'is-me-row' : ''} ${isDailyStar || isMonthlyLeader ? 'is-leader-row' : ''}`}
                  >
                    {/* Rank Badge */}
                    <div className="rank-badge-col">
                      <span className={`rank-indicator-pill ${st.rank && st.rank <= 3 && st.score > 0 ? `top-${st.rank}` : 'standard'}`}>
                        {st.rank && st.score > 0 ? `#${st.rank}` : '—'}
                      </span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="rank-name-col">
                      <div className="rank-avatar-circle">
                        {st.emoji ? renderAvatar(st.emoji, 32) : (st.name ? st.name.charAt(0).toUpperCase() : 'O')}
                      </div>
                      <div className="rank-info-col">
                        <div className="rank-name-wrap">
                          <span className="rank-name-text">{st.name}</span>
                          {isMe && <span className="you-chip">Siz</span>}
                        </div>
                        {isDailyStar && (
                          <span className="daily-star-badge">
                            <ZapIcon size={11} color="#D97706" />
                            <span>Dars yetakchisi</span>
                          </span>
                        )}
                        {isMonthlyLeader && (
                          <span className="monthly-star-badge">
                            <CrownIcon size={11} color="#B45309" />
                            <span>Oylik peshqadam</span>
                          </span>
                        )}
                        {isTop3 && (
                          <span className="top3-star-badge">
                            <FlameIcon size={11} color="#C2410C" />
                            <span>Top Like</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Points Pill */}
                    <div className="rank-score-col">
                      <span className="score-capsule like-score-capsule">
                        <span className="row-heart-icon">
                          <LikeIcon size={12} color="#0071E3" />
                        </span>
                        <strong>{st.score}</strong>
                        <span className="unit">Like</span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rankings-empty-box">
                <p className="empty-desc">Guruhda hali o'quvchilar mavjud emas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Baholar Tarixi (History) */}
      {scope === 'history' && (
        <div className="history-container-card">
          <div className="history-top-bar">
            <div className="history-title-wrap">
              <h3 className="history-heading">
                <LikeIcon size={16} color="#0071E3" />
                <span>Jonli Like'lar Tarixi</span>
              </h3>
              <span className="history-count-tag">{historyTransactions.length} ta yozuv</span>
            </div>

            {activePinnedStudent && (
              <div className="history-subnav">
                <button
                  type="button"
                  className={`history-subnav-btn ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setHistoryFilter('all');
                  }}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  className={`history-subnav-btn ${historyFilter === 'me' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setHistoryFilter('me');
                  }}
                >
                  Mening Like'larim
                </button>
              </div>
            )}
          </div>

          {historyTransactions.length > 0 ? (
            <div className="history-stream">
              {historyTransactions.map((tx) => {
                const amountNum = Number(tx.amount) || 0;
                const isPositive = amountNum > 0;
                const studentName = studentMap.get(String(tx.studentId))?.name;
                const isMeTx = pinnedStudentId && String(tx.studentId) === String(pinnedStudentId);

                return (
                  <div key={tx.id} className={`history-event-card ${isMeTx ? 'is-me-event' : ''}`}>
                    <div className="event-left">
                      <div className={`event-badge-icon ${isPositive ? 'is-plus-like' : 'is-minus'}`}>
                        {isPositive ? <LikeIcon size={13} color="#0071E3" /> : <span style={{ fontWeight: 800, fontSize: '13px' }}>—</span>}
                      </div>
                      <div className="event-details">
                        <div className="event-header-line">
                          {studentName && (
                            <span className={`event-student-name ${isMeTx ? 'is-me' : ''}`}>
                              {studentName} {isMeTx ? '(Siz)' : ''}
                            </span>
                          )}
                          <span className="event-date-chip">{formatTxDate(tx.timestamp)}</span>
                        </div>
                        <p className="event-comment">{tx.comment || "Faollik uchun jonli Like"}</p>
                      </div>
                    </div>

                    <div className="event-right">
                      <span className={`event-amount-pill ${isPositive ? 'positive-like' : 'negative'}`}>
                        {isPositive ? `+${amountNum} Like` : `${amountNum} Like`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rankings-empty-box">
              <div className="empty-icon-wrap">
                <LikeIcon size={28} color="#94A3B8" />
              </div>
              <p className="empty-desc">
                {historyFilter === 'me'
                  ? "Sizga hozircha jonli Like'lar berilmagan."
                  : "Hozircha Like berish yozuvlari mavjud emas."}
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .student-rating-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Toolbar */
        .rating-toolbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rating-scope-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 4px;
          gap: 4px;
          box-shadow: var(--shadow-sm);
        }

        .rating-scope-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 9px 16px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
        }

        .rating-scope-tab.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          box-shadow: 0 1px 6px rgba(0, 113, 227, 0.28);
        }

        /* Timeframe Pills */
        .rating-timeframe-scroll {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 0;
          -webkit-overflow-scrolling: touch;
        }

        .rating-timeframe-scroll::-webkit-scrollbar {
          display: none;
        }

        .rating-timeframe-pills {
          display: inline-flex;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 3px;
          box-shadow: var(--shadow-sm);
        }

        .timeframe-pill {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          touch-action: manipulation;
        }

        .timeframe-pill.active {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
          color: var(--apple-blue);
          font-weight: 700;
        }

        /* Podium / Shohsupa */
        .podium-glass-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 22px);
          padding: 16px 14px 12px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .podium-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .podium-header-titles {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .live-like-pill-tag {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          background: rgba(255, 45, 85, 0.12);
          color: #FF2D55;
          border: 1px solid rgba(255, 45, 85, 0.28);
          animation: livePulseTag 2s infinite ease-in-out;
        }

        @keyframes livePulseTag {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .podium-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--apple-blue);
        }

        .podium-timeframe-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        .podium-stage {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1fr;
          align-items: flex-end;
          gap: 6px;
          min-height: 180px;
          padding-top: 10px;
        }

        .podium-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          min-width: 0;
        }

        .podium-student-bubble {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
          width: 100%;
        }

        .podium-student-bubble.champion {
          margin-bottom: 10px;
        }

        .daily-star-crown {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: #FFFFFF;
          font-size: 0.64rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          margin-bottom: 3px;
          box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
          white-space: nowrap;
          max-width: 96%;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          animation: pulseCrown 2s infinite ease-in-out;
        }

        .daily-star-crown.monthly-crown {
          background: linear-gradient(135deg, #FF2D55, #E11D48);
          box-shadow: 0 2px 8px rgba(255, 45, 85, 0.35);
        }

        .podium-chip-heart {
          font-size: 0.72rem;
          margin-right: 1px;
        }

        @keyframes pulseCrown {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .podium-avatar-wrap {
          position: relative;
          display: inline-block;
        }

        .podium-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.92rem;
          color: #FFFFFF;
        }

        .podium-avatar.gold {
          width: 46px;
          height: 46px;
          background: linear-gradient(135deg, #F59E0B, #B45309);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
          font-size: 1.1rem;
        }

        .podium-avatar.silver {
          background: linear-gradient(135deg, #9CA3AF, #4B5563);
          box-shadow: 0 3px 10px rgba(156, 163, 175, 0.25);
        }

        .podium-avatar.bronze {
          background: linear-gradient(135deg, #D97706, #92400E);
          box-shadow: 0 3px 10px rgba(217, 119, 6, 0.25);
        }

        .podium-badge-icon {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: 0.62rem;
          font-weight: 800;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px 5px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--bg-card);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }

        .podium-badge-icon.gold {
          background: #F59E0B;
          color: #FFFFFF;
        }

        .podium-badge-icon.silver {
          background: #64748B;
          color: #FFFFFF;
        }

        .podium-badge-icon.bronze {
          background: #D97706;
          color: #FFFFFF;
        }

        .podium-student-name {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 95%;
          text-align: center;
        }

        .podium-student-name.champion-name {
          font-size: 0.84rem;
          font-weight: 800;
        }

        .tie-count {
          font-size: 0.65rem;
          color: var(--text-tertiary);
          margin-left: 2px;
        }

        .podium-points-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.74rem;
          font-weight: 800;
        }

        .podium-points-chip .unit {
          font-size: 0.62rem;
          font-weight: 600;
          opacity: 0.85;
        }

        .gold-chip {
          background: rgba(245, 158, 11, 0.15);
          color: #B45309;
        }

        .silver-chip {
          background: rgba(156, 163, 175, 0.15);
          color: #4B5563;
        }

        .bronze-chip {
          background: rgba(217, 119, 6, 0.15);
          color: #92400E;
        }

        /* Pedestals */
        .podium-stand {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px 12px 0 0;
          font-weight: 900;
          user-select: none;
        }

        .stand-1 {
          height: 64px;
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.06));
          border: 1.5px solid rgba(245, 158, 11, 0.4);
          border-bottom: none;
        }
        .stand-1 .stand-rank {
          font-size: 1.6rem;
          color: #B45309;
        }

        .stand-2 {
          height: 48px;
          background: linear-gradient(180deg, rgba(156, 163, 175, 0.2), rgba(156, 163, 175, 0.05));
          border: 1.5px solid rgba(156, 163, 175, 0.35);
          border-bottom: none;
        }
        .stand-2 .stand-rank {
          font-size: 1.3rem;
          color: #4B5563;
        }

        .stand-3 {
          height: 36px;
          background: linear-gradient(180deg, rgba(217, 119, 6, 0.18), rgba(217, 119, 6, 0.05));
          border: 1.5px solid rgba(217, 119, 6, 0.35);
          border-bottom: none;
        }
        .stand-3 .stand-rank {
          font-size: 1.2rem;
          color: #92400E;
        }

        .podium-empty-stand {
          height: 20px;
          width: 100%;
        }

        .is-me-podium .podium-avatar {
          box-shadow: 0 0 0 3px #0071E3, 0 4px 14px rgba(0, 113, 227, 0.4) !important;
        }

        /* Personal Standing Banner */
        .personal-standing-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08), var(--bg-card));
          border: 1.5px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.28);
          border-radius: var(--radius-lg, 16px);
          padding: 10px 14px;
          box-shadow: 0 2px 10px rgba(0, 113, 227, 0.06);
          gap: 10px;
        }

        .personal-standing-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .personal-rank-pill {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 800;
          flex-shrink: 0;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
          color: var(--apple-blue);
        }

        .personal-rank-pill.top-1 {
          background: rgba(245, 158, 11, 0.18);
          color: #D97706;
          border: 1.5px solid rgba(245, 158, 11, 0.4);
        }

        .personal-rank-pill.top-2 {
          background: rgba(148, 163, 184, 0.2);
          color: #475569;
          border: 1.5px solid rgba(148, 163, 184, 0.4);
        }

        .personal-rank-pill.top-3 {
          background: rgba(217, 119, 6, 0.18);
          color: #B45309;
          border: 1.5px solid rgba(217, 119, 6, 0.4);
        }

        .personal-rank-pill.general {
          font-size: 0.92rem;
        }

        .standing-headline {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .standing-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .standing-tag-you {
          font-size: 0.65rem;
          font-weight: 800;
          color: #FFFFFF;
          background: var(--apple-blue);
          padding: 1px 6px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .standing-subtitle {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .personal-standing-points {
          display: flex;
          align-items: baseline;
          gap: 3px;
          background: var(--apple-blue);
          color: #FFFFFF;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        .personal-standing-points.like-standing-points {
          background: linear-gradient(135deg, #0071E3, #005BB5);
          box-shadow: 0 2px 10px rgba(0, 113, 227, 0.35);
          gap: 5px;
        }

        .standing-heart-pulse {
          display: inline-flex;
          align-items: center;
          font-size: 0.82rem;
          animation: livePulseTag 1.8s infinite ease-in-out;
        }

        .pts-number {
          font-size: 1.05rem;
          font-weight: 800;
          line-height: 1;
        }

        .pts-unit {
          font-size: 0.7rem;
          font-weight: 600;
          opacity: 0.9;
        }

        /* Unpinned Prompt */
        .unpinned-prompt-card {
          background: var(--bg-card);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-lg, 14px);
          padding: 12px 14px;
        }

        .prompt-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .prompt-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .prompt-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .prompt-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .prompt-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        /* Table Card */
        .rankings-table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 20px);
          padding: 16px 14px;
          box-shadow: var(--shadow-sm);
        }

        .rankings-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 0 4px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .monthly-comp-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #FF2D55;
          background: rgba(255, 45, 85, 0.1);
          border: 1px solid rgba(255, 45, 85, 0.25);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }

        .live-session-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }

        .header-text-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .rankings-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .rankings-subtitle {
          font-size: 0.74rem;
          color: var(--text-tertiary);
        }

        /* List Items */
        .rankings-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rank-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.04));
          border-radius: var(--radius-md, 12px);
          gap: 10px;
          transition: all var(--transition-fast);
        }

        .rank-item-row.is-me-row {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.35);
        }

        .rank-item-row.is-daily-star-row,
        .rank-item-row.is-leader-row {
          border-color: rgba(255, 45, 85, 0.35);
          background: linear-gradient(90deg, rgba(255, 45, 85, 0.08), var(--bg-card));
        }

        .rank-badge-col {
          flex-shrink: 0;
          width: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-indicator-pill {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          border-radius: 6px;
        }

        .rank-indicator-pill.top-1 {
          background: rgba(245, 158, 11, 0.18);
          color: #D97706;
          font-weight: 900;
        }

        .rank-indicator-pill.top-2 {
          background: rgba(148, 163, 184, 0.2);
          color: #475569;
          font-weight: 900;
        }

        .rank-indicator-pill.top-3 {
          background: rgba(217, 119, 6, 0.18);
          color: #B45309;
          font-weight: 900;
        }

        .rank-name-col {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .rank-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-primary);
          flex-shrink: 0;
        }

        .rank-info-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .rank-name-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rank-name-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .you-chip {
          font-size: 0.65rem;
          font-weight: 800;
          background: var(--apple-blue);
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .daily-star-badge {
          font-size: 0.66rem;
          font-weight: 700;
          color: #D97706;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .monthly-star-badge {
          font-size: 0.66rem;
          font-weight: 700;
          color: #B45309;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .top3-star-badge {
          font-size: 0.66rem;
          font-weight: 700;
          color: #C2410C;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .rank-score-col {
          flex-shrink: 0;
        }

        .score-capsule {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.84rem;
          color: var(--text-primary);
        }

        .score-capsule.like-score-capsule {
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08), var(--bg-card));
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.28);
          gap: 4px;
        }

        .score-capsule.like-score-capsule strong {
          color: var(--apple-blue);
          font-weight: 800;
        }

        .row-heart-icon {
          display: inline-flex;
          align-items: center;
          font-size: 0.72rem;
          line-height: 1;
        }

        .score-capsule strong {
          color: var(--apple-blue);
          font-weight: 800;
        }

        .score-capsule .unit {
          font-size: 0.68rem;
          color: var(--text-tertiary);
        }

        /* Empty State */
        .rankings-empty-box {
          padding: 32px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-icon-wrap {
          font-size: 2.4rem;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px;
        }

        .empty-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          max-width: 360px;
          line-height: 1.4;
          margin: 0 0 16px;
        }

        .empty-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* History */
        .history-container-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 20px);
          padding: 16px 14px;
          box-shadow: var(--shadow-sm);
        }

        .history-top-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
        }

        .history-title-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .history-heading {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .history-count-tag {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .history-subnav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 3px;
        }

        .history-subnav-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.76rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .history-subnav-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
          font-weight: 700;
        }

        .history-stream {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-event-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.04));
          border-radius: var(--radius-md, 12px);
          padding: 10px 12px;
          gap: 10px;
        }

        .history-event-card.is-me-event {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.07);
          border-color: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.28);
        }

        .event-left {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          min-width: 0;
        }

        .event-badge-icon {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          line-height: 1;
        }

        .event-badge-icon.is-plus-like {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
        }

        .event-badge-icon.is-minus {
          background: rgba(239, 68, 68, 0.12);
          color: #EF4444;
        }

        .event-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .event-header-line {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .event-student-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .event-student-name.is-me {
          color: var(--apple-blue);
        }

        .event-date-chip {
          font-size: 0.68rem;
          color: var(--text-tertiary);
        }

        .event-comment {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .event-amount-pill {
          font-size: 0.85rem;
          font-weight: 800;
          padding: 4px 9px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        .event-amount-pill.positive,
        .event-amount-pill.positive-like {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
          color: var(--apple-blue);
          font-weight: 800;
        }

        .event-amount-pill.negative {
          background: rgba(255, 59, 48, 0.14);
          color: #C62828;
        }

        @media (max-width: 420px) {
          .podium-stage {
            gap: 4px;
          }

          .daily-star-crown {
            font-size: 0.58rem;
            padding: 2px 5px;
            max-width: 98%;
          }

          .podium-points-chip {
            padding: 2px 6px;
            font-size: 0.68rem;
          }

          .podium-points-chip .unit {
            font-size: 0.56rem;
          }

          .podium-avatar {
            width: 34px;
            height: 34px;
            font-size: 0.84rem;
          }

          .podium-avatar.gold {
            width: 42px;
            height: 42px;
            font-size: 0.98rem;
          }

          .stand-1 { height: 56px; }
          .stand-2 { height: 42px; }
          .stand-3 { height: 32px; }

          .podium-student-name {
            font-size: 0.72rem;
          }
        }

        [data-theme="dark"] .podium-glass-card,
        [data-theme="dark"] .rankings-table-card,
        [data-theme="dark"] .history-container-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .stand-1 {
          background: linear-gradient(180deg, rgba(253, 214, 99, 0.22), rgba(253, 214, 99, 0.05));
          border-color: rgba(253, 214, 99, 0.4);
        }
        [data-theme="dark"] .stand-1 .stand-rank {
          color: #FDD663;
        }

        [data-theme="dark"] .gold-chip {
          background: rgba(253, 214, 99, 0.2);
          color: #FDD663;
        }

        [data-theme="dark"] .silver-chip {
          background: rgba(156, 163, 175, 0.2);
          color: #E5E7EB;
        }

        [data-theme="dark"] .bronze-chip {
          background: rgba(245, 158, 11, 0.2);
          color: #FBBF24;
        }

        [data-theme="dark"] .rank-item-row,
        [data-theme="dark"] .history-event-card {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .rank-item-row.is-me-row {
          background: rgba(138, 180, 248, 0.12);
          border-color: rgba(138, 180, 248, 0.4);
        }

        [data-theme="dark"] .rank-avatar-circle {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .score-capsule {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .event-amount-pill.positive,
        [data-theme="dark"] .event-amount-pill.positive-like {
          background: rgba(255, 45, 85, 0.22);
          color: #FF6482;
        }

        [data-theme="dark"] .event-amount-pill.negative {
          background: rgba(242, 139, 130, 0.18);
          color: #F28B82;
        }
      `}</style>
    </div>
  );
}
