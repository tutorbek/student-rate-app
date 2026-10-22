import React, { useMemo } from 'react';
import { getGroupCategory, getStartOfMonth } from '../../utils/db';
import { renderAvatar } from '../../utils/studentAvatars';
import './StudentRewardView.css';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

export default function StudentRewardView({
  pinnedStudent = null,
  currentGroup = null,
  allStudents = [],
  allTransactions = [],
  allGroups = [],
  rewards = { kids: null, teens: null },
}) {
  // Category of current student's group strictly ('kids' | 'teens')
  const studentCategory = useMemo(() => {
    return getGroupCategory(currentGroup);
  }, [currentGroup]);

  // Date and month metrics
  const { currentMonthName, daysRemaining, startOfMonth } = useMemo(() => {
    const today = new Date();
    const start = getStartOfMonth();
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remaining = Math.max(0, end.getDate() - today.getDate());
    const monthName = UZ_MONTHS[today.getMonth()];
    return {
      startOfMonth: start,
      daysRemaining: remaining,
      currentMonthName: monthName,
    };
  }, []);

  // Groups map
  const groupsMap = useMemo(() => {
    const map = {};
    (allGroups || []).forEach((g) => {
      map[g.id] = g;
    });
    return map;
  }, [allGroups]);

  // Calculate monthly scores per student (transactions from this month)
  const studentMonthlyScores = useMemo(() => {
    const scores = {};
    (allStudents || []).forEach((s) => {
      scores[s.id] = 0;
    });
    (allTransactions || []).forEach((t) => {
      if (!t.studentId) return;
      const txTime = new Date(t.timestamp);
      if (txTime >= startOfMonth) {
        const pts = Number(t.points) || Number(t.amount) || 0;
        scores[t.studentId] = (scores[t.studentId] || 0) + pts;
      }
    });
    return scores;
  }, [allStudents, allTransactions, startOfMonth]);

  // Rank students for Kids and Teens separately
  const { kidsRanking, teensRanking } = useMemo(() => {
    const kids = [];
    const teens = [];

    (allStudents || []).forEach((s) => {
      if (s.deleted) return;
      const group = groupsMap[s.groupId];
      const cat = getGroupCategory(group);
      const monthlyScore = studentMonthlyScores[s.id] || 0;
      const item = {
        ...s,
        groupName: group?.name || 'Guruh',
        category: cat,
        monthlyScore,
      };
      if (cat === 'kids') {
        kids.push(item);
      } else {
        teens.push(item);
      }
    });

    kids.sort((a, b) => b.monthlyScore - a.monthlyScore);
    teens.sort((a, b) => b.monthlyScore - a.monthlyScore);

    return { kidsRanking: kids, teensRanking: teens };
  }, [allStudents, groupsMap, studentMonthlyScores]);

  // Active ranking strictly according to student's category (Kids or Teens only)
  const activeRanking = studentCategory === 'kids' ? kidsRanking : teensRanking;
  const leader = activeRanking[0] && activeRanking[0].monthlyScore > 0 ? activeRanking[0] : (activeRanking[0] || null);

  // Current student rank in their category
  const studentRankIndex = useMemo(() => {
    if (!pinnedStudent) return -1;
    return activeRanking.findIndex((s) => String(s.id) === String(pinnedStudent.id));
  }, [activeRanking, pinnedStudent]);

  const studentRank = studentRankIndex >= 0 ? studentRankIndex + 1 : null;
  const studentMonthlyScore = pinnedStudent ? (studentMonthlyScores[pinnedStudent.id] || 0) : 0;
  const isStudentLeader = studentRank === 1 && studentMonthlyScore > 0;
  const pointsBehind = leader && studentMonthlyScore < leader.monthlyScore
    ? leader.monthlyScore - studentMonthlyScore
    : 0;

  // Active gift strictly for this student's category
  const activeGift = useMemo(() => {
    return rewards?.[studentCategory] || null;
  }, [rewards, studentCategory]);

  return (
    <div className="student-reward-page animate-fadeIn">
      {/* 1. Header Row (Clean, no decorative icon box) */}
      <div className="reward-page-header">
        <div className="reward-page-title-wrap">
          <h2 className="reward-page-title">Oylik Sovg'a Musobaqasi</h2>
        </div>

        {/* Month countdown pill */}
        <div className="student-countdown-pill">
          <span className="countdown-pill-label">{currentMonthName} oyi:</span>
          <span className="countdown-pill-value">{daysRemaining} kun qoldi</span>
        </div>
      </div>

      {/* 2. Main Gift Card (Strictly student's category) */}
      {activeGift ? (
        <div className="gift-hero-showcase-card">
          <div className="gift-hero-visual-col">
            <div className="gift-image-squircle-wrap">
              <img
                src={activeGift.image}
                alt={activeGift.title}
                loading="lazy"
                className="gift-showcase-img"
              />
              <span className={`gift-category-floating-badge ${studentCategory === 'kids' ? 'badge-kids' : 'badge-teens'}`}>
                {studentCategory === 'kids' ? 'Kids' : 'Teens'}
              </span>
            </div>
          </div>

          <div className="gift-hero-info-col">
            <div className="gift-badge-and-target-row">
              <span className="target-points-volt-pill">
                1-O'rin Sovg'asi
              </span>
              <span className="eligible-status-tag active">
                {studentCategory === 'kids' ? 'Kids Toifasi' : 'Teens Toifasi'}
              </span>
            </div>

            <h3 className="gift-headline-title">{activeGift.title}</h3>

            {activeGift.description ? (
              <p className="gift-description-text">{activeGift.description}</p>
            ) : null}

            {/* Current Leader Banner */}
            <div className="gift-leader-preview-banner">
              <div className="leader-preview-avatar">
                {leader ? renderAvatar(leader.emoji, 40) : null}
              </div>
              <div className="leader-preview-info">
                <span className="leader-preview-subtitle">Hozirgi 1-o'rin da'vogari:</span>
                <strong className="leader-preview-name">
                  {leader && leader.monthlyScore > 0
                    ? `${leader.name} (${leader.monthlyScore} Like)`
                    : "Hozircha Like berilmagan"}
                </strong>
                {leader && leader.monthlyScore > 0 && (
                  <span className="leader-preview-group">{leader.groupName}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="gift-empty-notice-card">
          <div className="empty-gift-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <h3 className="empty-gift-title">
            Hozircha {studentCategory === 'kids' ? 'Kids' : 'Teens'} uchun sovg'a belgilanmagan
          </h3>
          <p className="empty-gift-subtitle">
            Ustozingiz tez orada ushbu toifa uchun yangi sovg'a belgilaydi. Darslarda faol bo'ling va 1-o'rin sari Like to'plashda davom eting!
          </p>
        </div>
      )}

      {/* 3. Student's Standing in this Month's Race */}
      {pinnedStudent && (
        <div className="student-standing-card">
          <div className="standing-card-header">
            <span className="standing-badge">Sizning Natijangiz</span>
            <span className="standing-month-tag">{currentMonthName} oyi</span>
          </div>

          {isStudentLeader ? (
            <div className="standing-leader-highlight">
              <div className="standing-trophy-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
                </svg>
              </div>
              <div className="standing-text">
                <h4 className="standing-title">Siz hozir 1-o'rindasiz! ({studentMonthlyScore} Like)</h4>
                <p className="standing-desc">
                  Ajoyib natija! Yetakchilikni oy oxirigacha boy bermang va sovg'ani o'zingiz yutib oling!
                </p>
              </div>
            </div>
          ) : studentRank ? (
            <div className="standing-chaser-box">
              <div className="standing-rank-circle">
                <span>{studentRank}</span>
              </div>
              <div className="standing-text">
                <h4 className="standing-title">
                  Siz hozir <strong>{studentRank}-o'rindasiz</strong> ({studentMonthlyScore} Like)
                </h4>
                <p className="standing-desc">
                  {leader && pointsBehind > 0
                    ? `1-o'rindagi ${leader.name}dan yana ${pointsBehind} Like ortdasiz. Darslarda faol bo'lib yetib oling!`
                    : "1-o'ringa yetish uchun darslarda faol bo'ling va Like to'plang!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="standing-chaser-box">
              <div className="standing-rank-circle">
                <span>-</span>
              </div>
              <div className="standing-text">
                <h4 className="standing-title">Bu oyda hali Like to'plamadingiz</h4>
                <p className="standing-desc">
                  Darslarda faol qatnashib Like to'plashni boshlang va 1-o'rin uchun kurashing!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Top 5 Contenders Leaderboard */}
      <div className="category-top5-card">
        <div className="top5-header-row">
          <h4 className="top5-title">
            {studentCategory === 'kids' ? 'Kids' : 'Teens'} Top 5 Da'vogarlari
          </h4>
          <span className="top5-subtitle">Faqat 1-o'rin sovg'ani oladi</span>
        </div>

        {activeRanking.length > 0 && activeRanking.some((s) => s.monthlyScore > 0) ? (
          <div className="top5-items-list">
            {activeRanking.slice(0, 5).map((student, idx) => {
              const isPinned = pinnedStudent && String(student.id) === String(pinnedStudent.id);
              return (
                <div key={student.id} className={`top5-item ${idx === 0 ? 'is-champion' : ''} ${isPinned ? 'is-me' : ''}`}>
                  <span className={`top5-rank-badge rank-${idx + 1}`}>
                    {idx + 1}
                  </span>
                  <div className="top5-avatar">
                    {renderAvatar(student.emoji, 32)}
                  </div>
                  <div className="top5-info">
                    <span className="top5-name">
                      {student.name} {isPinned && <span className="top5-me-tag">Siz</span>}
                    </span>
                    <span className="top5-group">{student.groupName}</span>
                  </div>
                  <div className="top5-points-box">
                    <span className="top5-points-value">{student.monthlyScore} Like</span>
                    {idx === 0 && (
                      <span className="top5-leader-tag">Peshqadam</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="top5-empty-state">
            <p>Ushbu toifada bu oyda hali Like to'plagan o'quvchilar yo'q.</p>
          </div>
        )}
      </div>
    </div>
  );
}
