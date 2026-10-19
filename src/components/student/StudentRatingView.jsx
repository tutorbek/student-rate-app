import React, { useState, useMemo, useEffect } from 'react';
import { getStartOfToday, getStartOfMonth, getStartOfLastMonth, getEndOfLastMonth, getGroupCategory } from '../../utils/db';
import { renderAvatar } from '../../utils/studentAvatars';

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

// SVG Icons tailored to match design mockup
const RedHeartIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F43F5E" stroke="#F43F5E" strokeWidth="0.5" style={{ flexShrink: 0 }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const CrownIcon = ({ size = 32 }) => (
  <div className="realistic-animated-crown" title="1-o'rin Toji">
    <svg
      width={size}
      height={Math.round(size * 0.78)}
      viewBox="0 0 48 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="crown-svg-animated"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        {/* Rich Multilayered Gold Gradients */}
        <linearGradient id="crownGoldBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7B8" />
          <stop offset="25%" stopColor="#FFD700" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        <linearGradient id="crownGoldRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="20%" stopColor="#FFE57F" />
          <stop offset="50%" stopColor="#FFFCE8" />
          <stop offset="80%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Royal Purple Velvet Cap */}
        <linearGradient id="crownVelvetCap" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#3B0764" stopOpacity="0.85" />
        </linearGradient>

        {/* Diamond Crystalline Gradient */}
        <linearGradient id="crownDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E0F2FE" />
          <stop offset="70%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Ruby Gem Gradient */}
        <linearGradient id="crownRuby" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="40%" stopColor="#FB7185" />
          <stop offset="80%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Emerald Gem Gradient */}
        <linearGradient id="crownEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D1FAE5" />
          <stop offset="40%" stopColor="#34D399" />
          <stop offset="80%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>

      {/* Royal Crown Velvet Cap */}
      <path
        d="M9 28 C9 18 16 13.5 24 13.5 C32 13.5 39 18 39 28 Z"
        fill="url(#crownVelvetCap)"
      />

      {/* Main Gold Crown Peaks & Body */}
      <path
        d="M6 29 L7.5 13.5 L15 21 L24 6 L33 21 L40.5 13.5 L42 29 Z"
        fill="url(#crownGoldBody)"
        stroke="#78350F"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Golden Highlight Facets */}
      <path
        d="M24 6 L21 28 L24 28 L27 28 Z"
        fill="#FFE57F"
        opacity="0.6"
      />
      <path
        d="M7.5 13.5 L12 28 L15 21 Z"
        fill="#FFF2A3"
        opacity="0.45"
      />
      <path
        d="M40.5 13.5 L36 28 L33 21 Z"
        fill="#B45309"
        opacity="0.45"
      />

      {/* Bottom Gold Headband / Rim */}
      <rect
        x="5"
        y="27.5"
        width="38"
        height="6.8"
        rx="2"
        fill="url(#crownGoldRim)"
        stroke="#78350F"
        strokeWidth="0.8"
      />
      <line x1="6" y1="28.7" x2="42" y2="28.7" stroke="#FFFDE6" strokeWidth="0.75" opacity="0.9" />
      <line x1="6" y1="33.3" x2="42" y2="33.3" stroke="#78350F" strokeWidth="0.75" opacity="0.85" />

      {/* 5 Peaks Golden Pearls / Spheres */}
      <circle cx="7.5" cy="13" r="2.2" fill="#FFE57F" stroke="#92400E" strokeWidth="0.6" />
      <circle cx="7.5" cy="13" r="1.1" fill="#FFFFFF" opacity="0.85" />

      <circle cx="15" cy="20.5" r="1.8" fill="#FFE57F" stroke="#92400E" strokeWidth="0.5" />
      <circle cx="15" cy="20.5" r="0.9" fill="#FFFFFF" opacity="0.85" />

      {/* Central Peak Large Diamond Star */}
      <circle cx="24" cy="5.5" r="3" fill="#FFE57F" stroke="#92400E" strokeWidth="0.6" />
      <polygon
        points="24,1.8 26.8,5.5 24,9.2 21.2,5.5"
        fill="url(#crownDiamond)"
        stroke="#FFFFFF"
        strokeWidth="0.5"
      />
      <circle cx="23.4" cy="4.3" r="0.75" fill="#FFFFFF" />

      <circle cx="33" cy="20.5" r="1.8" fill="#FFE57F" stroke="#92400E" strokeWidth="0.5" />
      <circle cx="33" cy="20.5" r="0.9" fill="#FFFFFF" opacity="0.85" />

      <circle cx="40.5" cy="13" r="2.2" fill="#FFE57F" stroke="#92400E" strokeWidth="0.6" />
      <circle cx="40.5" cy="13" r="1.1" fill="#FFFFFF" opacity="0.85" />

      {/* Center Crown Brilliant Diamond */}
      <polygon
        points="24,14 28,19 24,24.5 20,19"
        fill="url(#crownDiamond)"
        stroke="#FFFFFF"
        strokeWidth="0.6"
      />
      <line x1="24" y1="14" x2="24" y2="24.5" stroke="#BAE6FD" strokeWidth="0.4" />
      <line x1="20" y1="19" x2="28" y2="19" stroke="#BAE6FD" strokeWidth="0.4" />
      <circle cx="23" cy="17.2" r="0.85" fill="#FFFFFF" opacity="0.95" />

      {/* Flanking Gemstones (Rubies & Emeralds) */}
      <circle cx="15.5" cy="24" r="1.8" fill="url(#crownRuby)" stroke="#FECDD3" strokeWidth="0.4" />
      <circle cx="15" cy="23.5" r="0.6" fill="#FFFFFF" opacity="0.85" />

      <circle cx="32.5" cy="24" r="1.8" fill="url(#crownEmerald)" stroke="#A7F3D0" strokeWidth="0.4" />
      <circle cx="32" cy="23.5" r="0.6" fill="#FFFFFF" opacity="0.85" />

      {/* 5 Embedded Gemstones along the Golden Headband */}
      <circle cx="9.5" cy="30.9" r="1.6" fill="url(#crownRuby)" stroke="#FECDD3" strokeWidth="0.4" />
      <circle cx="9.1" cy="30.4" r="0.5" fill="#FFFFFF" />

      <polygon points="16.5,29.3 18.3,30.9 16.5,32.5 14.7,30.9" fill="url(#crownDiamond)" stroke="#FFFFFF" strokeWidth="0.4" />
      <circle cx="16.2" cy="30.4" r="0.45" fill="#FFFFFF" />

      <polygon points="24,28.8 26.4,30.9 24,33 21.6,30.9" fill="url(#crownDiamond)" stroke="#FFFFFF" strokeWidth="0.5" />
      <circle cx="23.4" cy="30.2" r="0.65" fill="#FFFFFF" />

      <polygon points="31.5,29.3 33.3,30.9 31.5,32.5 29.7,30.9" fill="url(#crownDiamond)" stroke="#FFFFFF" strokeWidth="0.4" />
      <circle cx="31.2" cy="30.4" r="0.45" fill="#FFFFFF" />

      <circle cx="38.5" cy="30.9" r="1.6" fill="url(#crownEmerald)" stroke="#A7F3D0" strokeWidth="0.4" />
      <circle cx="38.1" cy="30.4" r="0.5" fill="#FFFFFF" />

      {/* Twinkling Diamond Sparkle Stars */}
      <g className="crown-sparkle-star sparkle-top">
        <path d="M24 -1 L24.8 1.2 L27 2 L24.8 2.8 L24 5 L23.2 2.8 L21 2 L23.2 1.2 Z" fill="#FFFFFF" />
      </g>
      <g className="crown-sparkle-star sparkle-left">
        <path d="M7.5 9 L8 10.3 L9.3 10.8 L8 11.3 L7.5 12.6 L7 11.3 L5.7 10.8 L7 10.3 Z" fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="crown-sparkle-star sparkle-right">
        <path d="M40.5 9 L41 10.3 L42.3 10.8 L41 11.3 L40.5 12.6 L40 11.3 L38.7 10.8 L40 10.3 Z" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  </div>
);

const TrophyIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0171E3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34" />
    <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
  </svg>
);

const StarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#94A3B8" stroke="#94A3B8" strokeWidth="1" style={{ flexShrink: 0 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const MedalCheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ZapIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0171E3" stroke="#0171E3" strokeWidth="1" style={{ flexShrink: 0 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const formatPodiumName = (student, isPinned) => {
  if (!student) return '—';
  if (isPinned) return 'Siz';
  const parts = (student.name || '').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return parts[0] || "O'quvchi";
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
  attendanceRate = null,
  onOpenProfilePicker = null,
}) {
  const activePinnedStudent = useMemo(() => {
    if (pinnedStudent) return pinnedStudent;
    if (!pinnedStudentId) return null;
    const pool = (allStudents && allStudents.length > 0) ? allStudents : students;
    return (pool || []).find((s) => String(s.id) === String(pinnedStudentId)) || null;
  }, [pinnedStudent, pinnedStudentId, allStudents, students]);

  // Scopes: 'top10' (Top 10 across all same-category groups) | 'group' (current group)
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

  // Active student pool
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

  const podiumTop3 = useMemo(() => {
    if (!hasAnyPoints) {
      return { first: null, second: null, third: null };
    }
    const first = (fullRankedList || []).find((s) => s.rank === 1 && s.score > 0) || null;
    const second = (fullRankedList || []).find((s) => s.rank === 2 && s.score > 0) || null;
    const third = (fullRankedList || []).find((s) => s.rank === 3 && s.score > 0) || null;
    return { first, second, third };
  }, [hasAnyPoints, fullRankedList]);

  const otherStudents = useMemo(() => {
    if (scope === 'top10') {
      return (rankedStudents || []).filter((s) => s.rank && s.rank >= 4 && s.score > 0);
    }
    return (rankedStudents || []).filter((s) => s.rank && s.rank >= 4);
  }, [rankedStudents, scope]);

  const currentPinnedId = useMemo(() => {
    return pinnedStudentId ? String(pinnedStudentId) : (activePinnedStudent ? String(activePinnedStudent.id) : null);
  }, [pinnedStudentId, activePinnedStudent]);

  const pinnedStudentRankInfo = useMemo(() => {
    if (!currentPinnedId) return null;
    const found = (fullRankedList || []).find((s) => String(s.id) === currentPinnedId);
    if (!found) return null;

    const top10WithScore = (fullRankedList || []).filter((s) => s.score > 0).slice(0, 10);
    const isInTop10 = top10WithScore.some((s) => String(s.id) === currentPinnedId);

    return {
      rank: found.rank,
      score: found.score,
      name: found.name,
      groupName: found.groupName,
      isInTop10,
    };
  }, [currentPinnedId, fullRankedList]);

  const percentileBadge = useMemo(() => {
    if (!pinnedStudentRankInfo?.rank) return null;
    const r = pinnedStudentRankInfo.rank;
    if (r === 1) return 'Lider';
    if (r <= 3) return 'Top 5%';
    const total = fullRankedList.length || 1;
    const pct = Math.round((r / total) * 100);
    if (pct <= 10) return 'Top 10%';
    if (pct <= 20) return 'Top 20%';
    return `Top ${pct}%`;
  }, [pinnedStudentRankInfo, fullRankedList]);

  const motivationData = useMemo(() => {
    if (!pinnedStudentRankInfo?.rank) {
      return {
        title: "Reytingda yuqoriga ko'tariling",
        sub: "Uy vazifasini vaqtida topshirib yana Like oling!",
      };
    }
    const r = pinnedStudentRankInfo.rank;
    if (r === 1) {
      return {
        title: "1-o'rinda peshqadamsiz! Barakalla!",
        sub: "O'rningizni saqlab qolish uchun faol bo'lishda davom eting!",
      };
    }
    const aheadStudent = (fullRankedList || []).find((s) => s.rank === r - 1);
    const needed = aheadStudent ? Math.max(1, (aheadStudent.score + 1) - (pinnedStudentRankInfo.score || 0)) : 1;
    return {
      title: `${r - 1}-o'ringa chiqish uchun +${needed} Like kerak`,
      sub: "Uy vazifasini vaqtida topshirib yana Like oling!",
    };
  }, [pinnedStudentRankInfo, fullRankedList]);

  const otherHeaderTitle = useMemo(() => {
    if (scope === 'top10') {
      const maxRank = otherStudents.length > 0 ? Math.min(10, Math.max(...otherStudents.map((s) => s.rank || 0))) : 10;
      return `Boshqa o'rinlar (#4 – #${maxRank})`;
    }
    const maxRank = otherStudents.length > 0 ? Math.max(...otherStudents.map((s) => s.rank || 0)) : 4;
    return `Boshqa o'rinlar (#4 – #${maxRank})`;
  }, [scope, otherStudents]);

  return (
    <div className="rating-view-wrapper animate-fadeIn">
      {/* 1. Top Segmented Control (Top 10 vs Guruhim) */}
      <div className="rating-scope-segmented-bar" role="tablist">
        <button
          type="button"
          className={`rating-scope-tab-btn ${scope === 'top10' ? 'active' : ''}`}
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
          className={`rating-scope-tab-btn ${scope === 'group' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setScope('group');
          }}
          role="tab"
          aria-selected={scope === 'group'}
        >
          Guruhim
        </button>
      </div>

      {/* 2. Timeframe Filter Pills */}
      <div className="rating-timeframe-pills-row">
        <button
          type="button"
          className={`rating-timeframe-pill-btn ${timeframe === 'today' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setTimeframe('today');
          }}
        >
          Bugun
        </button>
        <button
          type="button"
          className={`rating-timeframe-pill-btn ${timeframe === 'month' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setTimeframe('month');
          }}
        >
          Bu oy
        </button>
        <button
          type="button"
          className={`rating-timeframe-pill-btn ${timeframe === 'lastMonth' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setTimeframe('lastMonth');
          }}
        >
          O'tgan oy
        </button>
        <button
          type="button"
          className={`rating-timeframe-pill-btn ${timeframe === 'all' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setTimeframe('all');
          }}
        >
          Barchasi
        </button>
      </div>

      {/* 3. Eyebrow Subtitle */}
      <p className="rating-eyebrow-subtitle">
        {scope === 'top10'
          ? "Ustozning barcha guruhlari bo'yicha TOP 10"
          : `${group?.name || 'Guruh'} bo'yicha reyting`}
      </p>

      {/* 4. White Podium Stage Card */}
      <div className="rating-podium-card">
        {/* 2nd Place (Left) */}
        <div className="podium-pillar pillar-2">
          <div className="podium-avatar-wrapper ring-silver">
            {podiumTop3.second ? (
              renderAvatar(podiumTop3.second.emoji, 52, { priority: 'high', eager: true })
            ) : (
              <div className="podium-empty-avatar">—</div>
            )}
          </div>
          <span className="podium-person-name" title={podiumTop3.second?.name || ''}>
            {formatPodiumName(podiumTop3.second, currentPinnedId && String(podiumTop3.second?.id) === currentPinnedId)}
          </span>
          <div className="podium-score-pill">
            <RedHeartIcon size={13} />
            <span className="podium-score-num">{podiumTop3.second?.score || 0}</span>
          </div>
          <div className="podium-pedestal-box pedestal-silver">
            <StarIcon size={18} />
            <span className="pedestal-rank-tag">2-o'rin</span>
          </div>
        </div>

        {/* 1st Place (Center - Elevated) */}
        <div className="podium-pillar pillar-1">
          <div className="podium-crown-badge">
            <CrownIcon size={32} />
          </div>
          <div className="podium-avatar-wrapper ring-gold">
            {podiumTop3.first ? (
              renderAvatar(podiumTop3.first.emoji, 66, { priority: 'high', eager: true })
            ) : (
              <div className="podium-empty-avatar">—</div>
            )}
          </div>
          <span className="podium-person-name name-first" title={podiumTop3.first?.name || ''}>
            {formatPodiumName(podiumTop3.first, currentPinnedId && String(podiumTop3.first?.id) === currentPinnedId)}
          </span>
          <div className="podium-score-pill">
            <RedHeartIcon size={13} />
            <span className="podium-score-num">{podiumTop3.first?.score || 0}</span>
          </div>
          <div className="podium-pedestal-box pedestal-gold">
            <TrophyIcon size={20} />
            <span className="pedestal-rank-tag tag-leader">Lider</span>
          </div>
        </div>

        {/* 3rd Place (Right) */}
        <div className="podium-pillar pillar-3">
          <div className="podium-avatar-wrapper ring-bronze">
            {podiumTop3.third ? (
              renderAvatar(podiumTop3.third.emoji, 52, { priority: 'high', eager: true })
            ) : (
              <div className="podium-empty-avatar">—</div>
            )}
          </div>
          <span className="podium-person-name" title={podiumTop3.third?.name || ''}>
            {formatPodiumName(podiumTop3.third, currentPinnedId && String(podiumTop3.third?.id) === currentPinnedId)}
          </span>
          <div className="podium-score-pill">
            <RedHeartIcon size={13} />
            <span className="podium-score-num">{podiumTop3.third?.score || 0}</span>
          </div>
          <div className="podium-pedestal-box pedestal-bronze">
            <MedalCheckIcon size={18} />
            <span className="pedestal-rank-tag">3-o'rin</span>
          </div>
        </div>
      </div>

      {/* 5. Personal Standing Hero Card (Blue Gradient) */}
      {pinnedStudentRankInfo ? (
        <div className="rating-blue-hero-card">
          <div className="blue-hero-top-row">
            <div className="blue-hero-user-info">
              <div className="blue-hero-avatar">
                {renderAvatar(activePinnedStudent?.emoji || pinnedStudent?.emoji, 44, { priority: 'high', eager: true })}
              </div>
              <div className="blue-hero-titles">
                <h3 className="blue-hero-name">{pinnedStudentRankInfo.name}</h3>
                <span className="blue-hero-rank-sub">
                  {`Sizning o'rningiz: #${pinnedStudentRankInfo.rank || '—'} o'rin`}
                </span>
              </div>
            </div>
            {percentileBadge && (
              <span className="blue-hero-badge">
                {percentileBadge}
              </span>
            )}
          </div>

          <div className="blue-hero-stats-box">
            <div className="blue-hero-stat-col">
              <span className="blue-stat-label">Jami Like</span>
              <span className="blue-stat-val">{pinnedStudentRankInfo.score || 0}</span>
            </div>
            <div className="blue-hero-stat-col">
              <span className="blue-stat-label">Davomat</span>
              <span className="blue-stat-val val-cyan">{attendanceRate || "—"}</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rating-unpinned-prompt-card"
          onClick={() => {
            triggerHaptic('light');
            if (onOpenProfilePicker) onOpenProfilePicker();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="unpinned-prompt-avatar-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="unpinned-prompt-text-wrap">
            <h4 className="unpinned-prompt-title">Profilingizni tanlang</h4>
            <p className="unpinned-prompt-desc">O'z o'rningiz va ballaringizni ko'rish uchun profilingizni belgilang</p>
          </div>
        </div>
      )}

      {/* 6. Section Header */}
      <div className="new-other-ranks-header">
        <h3 className="new-other-ranks-title">{otherHeaderTitle}</h3>
      </div>

      {/* 7. Rankings List Cards (#4 through #10) */}
      <div className="rating-items-stream">
        {otherStudents.length > 0 ? (
          otherStudents.map((st) => {
            const isMe = currentPinnedId && String(st.id) === currentPinnedId;
            return (
              <div key={st.id} className={`rating-item-card ${isMe ? 'is-me' : ''}`}>
                <div className="item-card-left">
                  <span className="item-card-rank">#{st.rank}</span>
                  <div className="item-card-avatar">
                    {renderAvatar(st.emoji, 38)}
                  </div>
                  <div className="item-card-text">
                    <span className="item-card-name">
                      {st.name} {isMe ? '(Siz)' : ''}
                    </span>
                    <span className="item-card-group">
                      {st.groupName || group?.name || 'Guruh'}
                    </span>
                  </div>
                </div>
                <div className="item-card-score-pill">
                  <RedHeartIcon size={13} />
                  <span className="item-card-score-num">{st.score}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rating-item-card empty-card" style={{ justifyContent: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
            <span>Boshqa o'rinlar mavjud emas</span>
          </div>
        )}
      </div>

      {/* 8. Motivational Hint Card (Bottom) */}
      <div className="rating-hint-motivation-card">
        <div className="motivation-zap-circle">
          <ZapIcon size={18} />
        </div>
        <div className="motivation-text-wrap">
          <span className="motivation-title-line">{motivationData.title}</span>
          <span className="motivation-sub-line">{motivationData.sub}</span>
        </div>
      </div>
    </div>
  );
}
