import React, { useState, useMemo, useEffect } from 'react';
import { getStartOfToday, getStartOfMonth, getStartOfLastMonth, getEndOfLastMonth, getGroupCategory } from '../../utils/db';
import { renderAvatar } from '../../utils/studentAvatars';

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
  allStudents = [],
  allTransactions = [],
  allGroups = [],
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
    const pool = (allStudents && allStudents.length > 0) ? allStudents : students;
    return (pool || []).find((s) => String(s.id) === String(pinnedStudentId)) || null;
  }, [pinnedStudent, pinnedStudentId, allStudents, students]);

  // Scopes: 'top10' (Top 10 across all students in same category) | 'group' (current group) | 'history' (Like activity)
  const [scope, setScope] = useState('top10');

  // Category of current student's group ('kids' | 'teens')
  const currentCategory = useMemo(() => {
    return getGroupCategory(group);
  }, [group]);

  // Fast map of group ID -> category
  const groupCategoryMap = useMemo(() => {
    const map = new Map();
    (allGroups || []).forEach((g) => {
      if (g) map.set(String(g.id), getGroupCategory(g));
    });
    if (group?.id) {
      map.set(String(group.id), currentCategory);
    }
    return map;
  }, [allGroups, group, currentCategory]);

  const groupNameMap = useMemo(() => {
    const map = new Map();
    (allGroups || []).forEach((g) => {
      if (g) map.set(String(g.id), g.name);
    });
    if (group?.id) {
      map.set(String(group.id), group.name);
    }
    return map;
  }, [allGroups, group]);

  // Active student pool:
  // - 'group': only current group's students
  // - 'top10': all students belonging to the SAME category ('teens' or 'kids') - NEVER mixed!
  const activeStudentsPool = useMemo(() => {
    if (scope === 'top10') {
      const pool = (allStudents && allStudents.length > 0) ? allStudents : students;
      return pool.filter((s) => {
        const cat = groupCategoryMap.get(String(s.groupId)) || currentCategory;
        return cat === currentCategory;
      });
    }
    return students;
  }, [scope, allStudents, students, groupCategoryMap, currentCategory]);

  const activeTransactionsPool = useMemo(() => {
    if (scope === 'top10') {
      return (allTransactions && allTransactions.length > 0) ? allTransactions : transactions;
    }
    return transactions;
  }, [scope, allTransactions, transactions]);

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
    return (activeTransactionsPool || []).some((tx) => {
      if (tx.deleted) return false;
      const tMs = typeof tx.timestamp === 'number' ? tx.timestamp : new Date(tx.timestamp).getTime();
      return tMs >= startOfTodayMs;
    });
  }, [activeTransactionsPool]);

  const [timeframe, setTimeframe] = useState(() => {
    if (initialTimeframe) return initialTimeframe;
    return hasTransactionsToday ? 'today' : 'month';
  });

  useEffect(() => {
    if (initialTimeframe) {
      setTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);

  const { rankedStudents, fullRankedList } = useMemo(() => {
    const startOfTodayMs = timeframe === 'today' ? getStartOfToday().getTime() : 0;
    const startOfMonthMs = timeframe === 'month' ? getStartOfMonth().getTime() : 0;
    const startOfLastMonthMs = timeframe === 'lastMonth' ? getStartOfLastMonth().getTime() : 0;
    const endOfLastMonthMs = timeframe === 'lastMonth' ? getEndOfLastMonth().getTime() : 0;

    const scoreMap = new Map();
    (activeStudentsPool || []).forEach((s) => scoreMap.set(String(s.id), 0));

    (activeTransactionsPool || []).forEach((tx) => {
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

    const list = (activeStudentsPool || []).map((s) => ({
      ...s,
      score: scoreMap.get(String(s.id)) || 0,
      groupName: groupNameMap.get(String(s.groupId)) || (group && String(group.id) === String(s.groupId) ? group.name : ''),
    }));

    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    let currentRank = 0;
    let lastScore = null;

    const fullRanked = list.map((s) => {
      if (s.score <= 0) {
        return { ...s, rank: null };
      }
      if (s.score !== lastScore) {
        currentRank += 1;
        lastScore = s.score;
      }
      return { ...s, rank: currentRank };
    });

    const displayed = scope === 'top10'
      ? fullRanked.filter((s) => s.score > 0).slice(0, 10)
      : fullRanked;

    return { rankedStudents: displayed, fullRankedList: fullRanked };
  }, [activeStudentsPool, activeTransactionsPool, timeframe, groupNameMap, group, scope]);

  const hasAnyPoints = useMemo(() => {
    return (fullRankedList || []).some((s) => s.score > 0);
  }, [fullRankedList]);

  const totalLikesInTimeframe = useMemo(() => {
    return (fullRankedList || []).reduce((sum, s) => sum + (s.score > 0 ? s.score : 0), 0);
  }, [fullRankedList]);

  const isTodayEmpty = useMemo(() => {
    if (timeframe !== 'today') return false;
    return !hasAnyPoints;
  }, [timeframe, hasAnyPoints]);

  const podiumTop3 = useMemo(() => {
    if (!hasAnyPoints) {
      return { first: null, second: null, third: null };
    }
    const first = (fullRankedList || []).find((s) => s.rank === 1 && s.score > 0) || null;
    const second = (fullRankedList || []).find((s) => s.rank === 2 && s.score > 0) || null;
    const third = (fullRankedList || []).find((s) => s.rank === 3 && s.score > 0) || null;
    return { first, second, third };
  }, [hasAnyPoints, fullRankedList]);

  const currentPinnedId = useMemo(() => {
    return pinnedStudentId ? String(pinnedStudentId) : (activePinnedStudent ? String(activePinnedStudent.id) : null);
  }, [pinnedStudentId, activePinnedStudent]);

  const studentMap = useMemo(() => {
    const map = new Map();
    (allStudents || []).forEach((s) => map.set(String(s.id), s));
    (students || []).forEach((s) => map.set(String(s.id), s));
    return map;
  }, [allStudents, students]);

  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'me'

  const historyTransactions = useMemo(() => {
    const startOfTodayMs = timeframe === 'today' ? getStartOfToday().getTime() : 0;
    const startOfMonthMs = timeframe === 'month' ? getStartOfMonth().getTime() : 0;
    const startOfLastMonthMs = timeframe === 'lastMonth' ? getStartOfLastMonth().getTime() : 0;
    const endOfLastMonthMs = timeframe === 'lastMonth' ? getEndOfLastMonth().getTime() : 0;

    const allowedStudentIdSet = new Set((activeStudentsPool || []).map((s) => String(s.id)));

    const pool = (activeTransactionsPool || []).filter((tx) => {
      if (tx.deleted) return false;
      if (!allowedStudentIdSet.has(String(tx.studentId))) return false;
      const txMs = typeof tx.timestamp === 'number' ? tx.timestamp : new Date(tx.timestamp).getTime();
      if (timeframe === 'today') return txMs >= startOfTodayMs;
      if (timeframe === 'month') return txMs >= startOfMonthMs;
      if (timeframe === 'lastMonth') return txMs >= startOfLastMonthMs && txMs <= endOfLastMonthMs;
      return true;
    });

    let filtered = pool;
    if (historyFilter === 'me' && currentPinnedId) {
      filtered = pool.filter((tx) => String(tx.studentId) === currentPinnedId);
    }
    return [...filtered].sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const tB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return tB - tA;
    }).slice(0, 80);
  }, [activeTransactionsPool, activeStudentsPool, historyFilter, currentPinnedId, timeframe]);

  const pinnedStudentRankInfo = useMemo(() => {
    if (!currentPinnedId) return null;
    const found = (fullRankedList || []).find((s) => String(s.id) === currentPinnedId);
    if (!found) return null;

    const top10WithScore = (fullRankedList || []).filter((s) => s.score > 0).slice(0, 10);
    const isInTop10 = top10WithScore.some((s) => String(s.id) === currentPinnedId);

    let pointsToTop10 = 0;
    if (scope === 'top10') {
      if (!isInTop10) {
        if (top10WithScore.length < 10) {
          // If fewer than 10 students have points, 1 point enters top 10
          pointsToTop10 = (found.score || 0) > 0 ? 1 : 1;
        } else {
          const tenthScore = top10WithScore[9]?.score || 0;
          pointsToTop10 = Math.max(1, (tenthScore + 1) - (found.score || 0));
        }
      }
    }

    return {
      rank: found.rank,
      score: found.score,
      name: found.name,
      groupName: found.groupName,
      isInTop10,
      pointsToTop10,
      totalTopStudentsWithPoints: top10WithScore.length,
    };
  }, [currentPinnedId, fullRankedList, scope]);

  return (
    <div className="native-rating-container animate-fadeIn">
      {/* Radiant Golden Hero Section for Ranking (Inter Nation vibe) */}
      <div className="native-rating-hero">
        <div className="native-hero-header">
          <div className="native-hero-title-wrap">
            <span className="native-hero-eyebrow">
              {scope === 'top10' 
                ? `UMUMIY REYTING • ${currentCategory === 'kids' ? 'KIDS' : 'TEENS'}` 
                : scope === 'history' 
                ? "LIKELAR VA FAOLLIK" 
                : "GURUH REYTINGI"}
            </span>
            <h1 className="native-hero-title">
              {scope === 'top10' 
                ? `Top 10 Yetakchilar (${currentCategory === 'kids' ? 'Kids' : 'Teens'})` 
                : scope === 'history' 
                ? "Ballar Tarixi" 
                : (group?.name ? `${group.name} Yetakchilari` : "Guruh Yetakchilari")}
            </h1>
          </div>
          <span className="native-hero-badge">
            {timeframe === 'today' ? "Bugun" : timeframe === 'month' ? "Bu oy" : timeframe === 'lastMonth' ? "O'tgan oy" : "Barchasi"}
          </span>
        </div>

        {/* Hero Card Body: History Summary OR Podium OR Empty State (Constant Height & Symmetrical) */}
        {scope === 'history' ? (
          <div className="native-hero-history-summary">
            <div className="hero-history-stats-grid">
              {/* Left Column: Total Likes */}
              <div className="hero-history-stat-box stat-box-left">
                <div className="stat-box-icon-ring ring-silver">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <span className="hero-stat-value">{totalLikesInTimeframe}</span>
                <span className="hero-stat-label">Jami Like'lar</span>
                <span className="stat-box-sub-pill">Umumiy yig'indi</span>
              </div>

              {/* Center Column: Your Balance (Elevated Champion Card) */}
              <div className="hero-history-stat-box stat-box-center highlight">
                <div className="stat-box-icon-ring ring-gold">
                  {activePinnedStudent ? (
                    <div className="stat-box-avatar-inner">
                      {renderAvatar(activePinnedStudent.emoji, 44)}
                    </div>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>
                <span className="hero-stat-value champion-val">
                  {pinnedStudentRankInfo ? pinnedStudentRankInfo.score : '—'}
                </span>
                <span className="hero-stat-label champion-lbl">Sizning balansingiz</span>
                <span className="stat-box-sub-pill champion-pill">
                  {pinnedStudentRankInfo ? (activePinnedStudent?.name ? activePinnedStudent.name.split(' ')[0] : 'Shaxsiy hisob') : 'Profil tanlang'}
                </span>
              </div>

              {/* Right Column: Operations Count */}
              <div className="hero-history-stat-box stat-box-right">
                <div className="stat-box-icon-ring ring-bronze">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span className="hero-stat-value">{historyTransactions.length}</span>
                <span className="hero-stat-label">Operatsiyalar</span>
                <span className="stat-box-sub-pill">Dars yozuvlari</span>
              </div>
            </div>
          </div>
        ) : hasAnyPoints ? (
          <div className="native-podium-stage">
            {/* 2nd Place (Left) */}
            <div className="podium-col podium-col-2">
              {podiumTop3.second ? (
                <div className="podium-card">
                  <div className="podium-avatar-ring ring-silver">
                    <div className="podium-avatar-inner inner-2">
                      {renderAvatar(podiumTop3.second.emoji, 56)}
                    </div>
                  </div>
                  <span className="podium-name" title={podiumTop3.second.name}>
                    {podiumTop3.second.name.split(' ')[0]}
                  </span>
                  {(podiumTop3.second.groupName || group?.name) && (
                    <span className="podium-group-tag" title={podiumTop3.second.groupName || group?.name}>
                      {podiumTop3.second.groupName || group?.name}
                    </span>
                  )}
                  <span className="podium-points-tag">
                    {podiumTop3.second.score} Like
                  </span>
                  <div className="podium-pedestal pedestal-2">
                    <div className="pedestal-number-circle">
                      <span>2</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="podium-card empty-card">
                  <div className="podium-avatar-placeholder">
                    <span>—</span>
                  </div>
                  <span className="podium-name empty">—</span>
                  <span className="podium-group-tag empty" style={{ visibility: 'hidden' }}>—</span>
                  <span className="podium-points-tag empty">0 Like</span>
                  <div className="podium-pedestal pedestal-2 empty">
                    <div className="pedestal-number-circle">
                      <span>2</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 1st Place (Center - Elevated Highest) */}
            <div className="podium-col podium-col-1">
              {podiumTop3.first ? (
                <div className="podium-card champion-card">
                  <div className="podium-avatar-ring ring-gold">
                    <div className="podium-avatar-inner inner-1">
                      {renderAvatar(podiumTop3.first.emoji, 68)}
                    </div>
                  </div>
                  <span className="podium-name champion-name" title={podiumTop3.first.name}>
                    {podiumTop3.first.name.split(' ')[0]}
                  </span>
                  {(podiumTop3.first.groupName || group?.name) && (
                    <span className="podium-group-tag champion-group-tag" title={podiumTop3.first.groupName || group?.name}>
                      {podiumTop3.first.groupName || group?.name}
                    </span>
                  )}
                  <span className="podium-points-tag champion-tag">
                    {podiumTop3.first.score} Like
                  </span>
                  <div className="podium-pedestal pedestal-1">
                    <div className="pedestal-number-circle">
                      <span>1</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="podium-card empty-card">
                  <div className="podium-avatar-placeholder">
                    <span>—</span>
                  </div>
                  <span className="podium-name empty">—</span>
                  <span className="podium-group-tag empty" style={{ visibility: 'hidden' }}>—</span>
                  <span className="podium-points-tag empty">0 Like</span>
                  <div className="podium-pedestal pedestal-1 empty">
                    <div className="pedestal-number-circle">
                      <span>1</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3rd Place (Right) */}
            <div className="podium-col podium-col-3">
              {podiumTop3.third ? (
                <div className="podium-card">
                  <div className="podium-avatar-ring ring-bronze">
                    <div className="podium-avatar-inner inner-3">
                      {renderAvatar(podiumTop3.third.emoji, 52)}
                    </div>
                  </div>
                  <span className="podium-name" title={podiumTop3.third.name}>
                    {podiumTop3.third.name.split(' ')[0]}
                  </span>
                  {(podiumTop3.third.groupName || group?.name) && (
                    <span className="podium-group-tag" title={podiumTop3.third.groupName || group?.name}>
                      {podiumTop3.third.groupName || group?.name}
                    </span>
                  )}
                  <span className="podium-points-tag">
                    {podiumTop3.third.score} Like
                  </span>
                  <div className="podium-pedestal pedestal-3">
                    <div className="pedestal-number-circle">
                      <span>3</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="podium-card empty-card">
                  <div className="podium-avatar-placeholder">
                    <span>—</span>
                  </div>
                  <span className="podium-name empty">—</span>
                  <span className="podium-group-tag empty" style={{ visibility: 'hidden' }}>—</span>
                  <span className="podium-points-tag empty">0 Like</span>
                  <div className="podium-pedestal pedestal-3 empty">
                    <div className="pedestal-number-circle">
                      <span>3</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="native-hero-empty-state">
            <div className="empty-state-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34" />
                <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34" />
                <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <span className="empty-state-badge">Reyting faolligi</span>
            <p className="empty-state-desc">
              {scope === 'top10'
                ? (timeframe === 'today'
                    ? "Bugun hali hech kimga Like berilmadi. Darsda birinchi bo'lib Like to'plang va shohsupaga chiqing!"
                    : "Hozircha hech kim Like to'plamagan. O'quvchilar darsda Like to'plashi bilan shohsupa avtomatik shakllanadi.")
                : (!isTodayClassDay && timeframe === 'today'
                    ? "Bugun dars kuni emas. Oylik reytingni ko'rish uchun quyidagi \"Bu oy\" tugmasini tanlang."
                    : "Dars davomida o'quvchilar Like to'plashi bilan shohsupa avtomatik yangilanadi.")}
            </p>
          </div>
        )}
      </div>

      {/* Main Segmented Navigation Bar (Inter Nation Style) */}
      <div className="native-segmented-section">
        {/* Primary Scope Switcher */}
        <div className="native-segmented-control" role="tablist">
          <button
            type="button"
            className={`native-segment-btn ${scope === 'top10' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setScope('top10');
            }}
            role="tab"
            aria-selected={scope === 'top10'}
          >
            Top 10
          </button>
          <button
            type="button"
            className={`native-segment-btn ${scope === 'group' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setScope('group');
            }}
            role="tab"
            aria-selected={scope === 'group'}
          >
            Guruhim
          </button>
          <button
            type="button"
            className={`native-segment-btn ${scope === 'history' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setScope('history');
            }}
            role="tab"
            aria-selected={scope === 'history'}
          >
            Like tarixi
          </button>
        </div>

        {/* Secondary Timeframe Pills (Consistent and persistent across all views) */}
        <div className="native-timeframe-bar">
          <button
            type="button"
            className={`native-pill-btn ${timeframe === 'today' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setTimeframe('today');
            }}
          >
            Bugun
          </button>
          <button
            type="button"
            className={`native-pill-btn ${timeframe === 'month' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setTimeframe('month');
            }}
          >
            Bu oy
          </button>
          <button
            type="button"
            className={`native-pill-btn ${timeframe === 'lastMonth' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setTimeframe('lastMonth');
            }}
          >
            O'tgan oy
          </button>
          <button
            type="button"
            className={`native-pill-btn ${timeframe === 'all' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setTimeframe('all');
            }}
          >
            Barchasi
          </button>
        </div>
      </div>

      {/* Personal Standing Card (Clean Native Card) */}
      {pinnedStudentRankInfo && scope !== 'history' && !isTodayEmpty && (
        <div className="native-standing-card">
          <div className="standing-rank-badge">
            <span className="standing-hash">#</span>
            <span className="standing-num">{pinnedStudentRankInfo.rank || '—'}</span>
          </div>
          <div className="standing-info-col">
            <div className="standing-title-row">
              <span className="standing-name">{pinnedStudentRankInfo.name}</span>
              <span className="standing-you-chip">Siz</span>
              {scope === 'top10' && pinnedStudentRankInfo.isInTop10 && (
                <span className="standing-top10-chip">Top 10 da</span>
              )}
            </div>
            <span className="standing-status-desc">
              {scope === 'top10' ? (
                pinnedStudentRankInfo.isInTop10 ? (
                  pinnedStudentRankInfo.rank === 1
                    ? "Barcha o'quvchilar orasida 1-o'rinda peshqadamsiz!"
                    : pinnedStudentRankInfo.rank <= 3
                    ? "Umumiy shohsupadasiz (Top-3)!"
                    : "Tabriklaymiz, siz umumiy Top 10 talikdasiz!"
                ) : pinnedStudentRankInfo.totalTopStudentsWithPoints === 0 ? (
                  "Hozircha hech kim Like to'plamagan. Birinchi bo'lib Like to'plang va Top 10 ga kiring!"
                ) : pinnedStudentRankInfo.pointsToTop10 > 0 ? (
                  `Top 10 ga kirish uchun yana ${pinnedStudentRankInfo.pointsToTop10} ta Like kerak`
                ) : (
                  "Faol ishtirok eting va Top 10 ga kiring!"
                )
              ) : (
                pinnedStudentRankInfo.rank === 1
                  ? "Guruhda 1-o'rinda peshqadamsiz!"
                  : pinnedStudentRankInfo.rank && pinnedStudentRankInfo.rank <= 3
                  ? "Shohsupadasiz (Top-3)!"
                  : pinnedStudentRankInfo.score > 0
                  ? "Faol ishtirok eting va o'rningizni ko'taring"
                  : "Hozircha Like to'planmagan"
              )}
            </span>
          </div>
          <div className="standing-score-badge">
            <span className="score-val">{pinnedStudentRankInfo.score}</span>
            <span className="score-lbl">Like</span>
          </div>
        </div>
      )}

      {/* Unpinned Friendly Notice */}
      {!pinnedStudentId && scope !== 'history' && !isTodayEmpty && (
        <div className="native-unpinned-card">
          <span className="unpinned-title">O'z o'rningizni bilishni xohlaysizmi?</span>
          <span className="unpinned-sub">Profil bo'limi orqali ismingizni tanlang</span>
        </div>
      )}

      {/* Group / Top 10 Ranking List Card */}
      {(scope === 'top10' || scope === 'group') && (
        <div className="native-list-card">
          <div className="list-card-header">
            <div className="header-titles">
              <h2 className="header-main-title">
                {scope === 'top10'
                  ? (timeframe === 'today'
                    ? "Top 10 • Bugun"
                    : timeframe === 'month'
                    ? "Top 10 • Bu oy"
                    : timeframe === 'lastMonth'
                    ? "Top 10 • O'tgan oy"
                    : "Top 10 • Barchasi")
                  : (timeframe === 'today'
                    ? (group?.name ? `${group.name} • Bugun` : "Bugungi Like'lar")
                    : timeframe === 'month'
                    ? (group?.name ? `${group.name} • Oylik` : "Oylik Reyting")
                    : (group?.name ? `${group.name} reytingi` : "Guruh reytingi"))}
              </h2>
              <span className="header-sub-count">
                {scope === 'top10'
                  ? (rankedStudents.length === 0
                    ? "Hozircha yetakchilar yo'q"
                    : `${rankedStudents.length} nafar yetakchi • Barcha o'quvchilar bo'yicha`)
                  : (!hasAnyPoints
                    ? "0 Like"
                    : `${rankedStudents.length} nafar o'quvchi • Jami ${totalLikesInTimeframe} Like`)}
              </span>
            </div>
          </div>

          <div className="native-student-rows">
            {scope === 'top10' ? (
              rankedStudents.length === 0 ? (
                <div className="native-empty-box">
                  <span className="empty-box-title">Hozircha Like'lar to'planmagan</span>
                  <p className="empty-box-text">
                    {timeframe === 'today'
                      ? "Bugun hali hech kimga Like berilmadi. Oylik reytingni ko'rish uchun yuqoridagi \"Bu oy\" tugmasini bosing."
                      : "Darslarda faol qatnashib, birinchi bo'lib Like to'plang va Top 10 yetakchiga aylaning!"}
                  </p>
                  {timeframe === 'today' && (
                    <button
                      type="button"
                      className="native-empty-action-btn"
                      onClick={() => setTimeframe('month')}
                    >
                      Bu oylik natijalarni ko'rish
                    </button>
                  )}
                </div>
              ) : (
                rankedStudents.map((st) => {
                  const isMe = String(st.id) === String(pinnedStudentId);
                  const isTop1 = st.rank === 1 && st.score > 0;
                  const isTop2 = st.rank === 2 && st.score > 0;
                  const isTop3 = st.rank === 3 && st.score > 0;

                  return (
                    <div
                      key={st.id}
                      className={`native-student-row ${isMe ? 'is-me-row' : ''}`}
                    >
                      {/* Clean Rank Number Badge */}
                      <div className="row-rank-col">
                        {isTop1 ? (
                          <div className="rank-badge-capsule gold" title="1-o'rin">
                            <span>1</span>
                          </div>
                        ) : isTop2 ? (
                          <div className="rank-badge-capsule silver" title="2-o'rin">
                            <span>2</span>
                          </div>
                        ) : isTop3 ? (
                          <div className="rank-badge-capsule bronze" title="3-o'rin">
                            <span>3</span>
                          </div>
                        ) : (
                          <span className="rank-standard-number">
                            {st.rank || '—'}
                          </span>
                        )}
                      </div>

                      {/* Circular Avatar */}
                      <div className="row-avatar-col">
                        <div className="row-avatar-wrap">
                          {renderAvatar(st.emoji, 44)}
                        </div>
                      </div>

                      {/* Name & Subtitle */}
                      <div className="row-name-col">
                        <div className="name-line">
                          <span className="student-name-text">{st.name}</span>
                          {(isTop1 || isTop2 || isTop3) && (
                            <svg className="verified-check-svg" width="15" height="15" viewBox="0 0 24 24" fill="#0071E3" aria-label="Yetakchi">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                          {isMe && <span className="you-chip">Siz</span>}
                        </div>
                        <span className="group-meta-sub">
                          {st.groupName
                            ? `${st.groupName} • ${isTop1 ? "1-o'rin" : isTop2 ? "2-o'rin" : isTop3 ? "3-o'rin" : `${st.rank}-o'rin`}`
                            : `Yetakchi #${st.rank}`}
                        </span>
                      </div>

                      {/* Pure Clean Score */}
                      <div className="row-score-col">
                        <div className="score-capsule">
                          <span className="score-number">{st.score}</span>
                          <span className="score-unit">Like</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* scope === 'group' */
              !hasAnyPoints ? (
                <div className="native-empty-box">
                  <span className="empty-box-title">
                    {timeframe === 'today' && !isTodayClassDay
                      ? "Bugun dars kuni emas"
                      : "Hozircha Like berilmadi"}
                  </span>
                  <p className="empty-box-text">
                    {timeframe === 'today' && !isTodayClassDay
                      ? "Guruhning oylik ko'rsatkichlarini ko'rish uchun yuqoridagi \"Bu oy\" tugmasini bosing."
                      : "Ustoz dars davomida bergan Like'lar bu yerda darhol aks etadi."}
                  </p>
                  {timeframe === 'today' && (
                    <button
                      type="button"
                      className="native-empty-action-btn"
                      onClick={() => setTimeframe('month')}
                    >
                      Bu oylik natijalarni ko'rish
                    </button>
                  )}
                </div>
              ) : (
                rankedStudents.map((st) => {
                  const isMe = String(st.id) === String(pinnedStudentId);
                  const isTop1 = st.rank === 1 && st.score > 0;
                  const isTop2 = st.rank === 2 && st.score > 0;
                  const isTop3 = st.rank === 3 && st.score > 0;

                  return (
                    <div
                      key={st.id}
                      className={`native-student-row ${isMe ? 'is-me-row' : ''}`}
                    >
                      {/* Clean Rank Number Badge */}
                      <div className="row-rank-col">
                        {isTop1 ? (
                          <div className="rank-badge-capsule gold" title="1-o'rin">
                            <span>1</span>
                          </div>
                        ) : isTop2 ? (
                          <div className="rank-badge-capsule silver" title="2-o'rin">
                            <span>2</span>
                          </div>
                        ) : isTop3 ? (
                          <div className="rank-badge-capsule bronze" title="3-o'rin">
                            <span>3</span>
                          </div>
                        ) : (
                          <span className="rank-standard-number">
                            {st.rank && st.score > 0 ? st.rank : '—'}
                          </span>
                        )}
                      </div>

                      {/* Circular Avatar */}
                      <div className="row-avatar-col">
                        <div className="row-avatar-wrap">
                          {renderAvatar(st.emoji, 44)}
                        </div>
                      </div>

                      {/* Name & Subtitle */}
                      <div className="row-name-col">
                        <div className="name-line">
                          <span className="student-name-text">{st.name}</span>
                          {(isTop1 || isTop2 || isTop3) && (
                            <svg className="verified-check-svg" width="15" height="15" viewBox="0 0 24 24" fill="#0071E3" aria-label="Yetakchi">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                          {isMe && <span className="you-chip">Siz</span>}
                        </div>
                        <span className="group-meta-sub">
                          {isTop1 ? "1-o'rin peshqadami" : isTop2 || isTop3 ? "Shohsupa sovrindori" : group?.name || "O'quvchi"}
                        </span>
                      </div>

                      {/* Pure Clean Score */}
                      <div className="row-score-col">
                        <div className="score-capsule">
                          <span className="score-number">{st.score}</span>
                          <span className="score-unit">Like</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      )}

      {/* History Feed (When in History View) */}
      {scope === 'history' && (
        <div className="native-history-card">
          <div className="history-header-bar">
            <div>
              <h2 className="header-main-title">Like'lar Tarixi</h2>
              <span className="header-sub-count">{historyTransactions.length} ta yozuv</span>
            </div>

            {activePinnedStudent && (
              <div className="history-filter-toggle">
                <button
                  type="button"
                  className={`history-toggle-btn ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setHistoryFilter('all');
                  }}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  className={`history-toggle-btn ${historyFilter === 'me' ? 'active' : ''}`}
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

          <div className="history-stream">
            {historyTransactions.length > 0 ? (
              historyTransactions.map((tx) => {
                const amountNum = Number(tx.amount) || 0;
                const isPositive = amountNum > 0;
                const studentName = studentMap.get(String(tx.studentId))?.name;
                const isMeTx = pinnedStudentId && String(tx.studentId) === String(pinnedStudentId);

                return (
                  <div key={tx.id} className={`history-row ${isMeTx ? 'is-me-history' : ''}`}>
                    <div className="history-row-left">
                      <div className="history-name-line">
                        <span className="history-student-name">
                          {studentName || "O'quvchi"} {isMeTx ? '(Siz)' : ''}
                        </span>
                        <span className="history-time-stamp">{formatTxDate(tx.timestamp)}</span>
                      </div>
                      <p className="history-comment-text">{tx.comment || "Faollik uchun Like"}</p>
                    </div>

                    <div className="history-row-right">
                      <span className={`history-amount-badge ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? `+${amountNum}` : `${amountNum}`} Like
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="native-empty-box">
                <span className="empty-box-title">Yozuvlar yo'q</span>
                <p className="empty-box-text">Hozircha bu guruhda berilgan Like'lar mavjud emas.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
