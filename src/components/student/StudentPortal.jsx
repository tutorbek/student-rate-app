import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import StudentScheduleCard from './StudentScheduleCard';
import StudentTeacherShowcase from './StudentTeacherShowcase';
import StudentAttendanceCalendar from './StudentAttendanceCalendar';
import StudentCenterAddresses from './StudentCenterAddresses';
import StudentRatingView from './StudentRatingView';
import StudentShopComingSoon from './StudentShopComingSoon';
import StudentAccountView from './StudentAccountView';
import { renderAvatar } from '../../utils/studentAvatars';
import { scrollToWithOffset } from '../../utils/scrollOffset';
import './StudentPortal.css';

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const UZBEK_WEEKDAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
];

export default function StudentPortal({
  attendance = [],
  groups = [],
  students = [],
  transactions = [],
  allActiveGroups = [],
  allActiveStudents = [],
  allActiveTransactions = [],
  userRole: _userRole = 'student',
  studentGroupId = null,
  studentGroups = [],
  allConnectedGroups = [],
  onSwitchGroup,
  onAddGroup,
  onRemoveGroup,
  onLogout,
  onUpdateAvatar,
  onSetStudentPin,
  onClaimStudentDevice,
  showToast,
  theme = 'light',
  toggleTheme,
  teacherProfile = null,
  allTeachersData = {},
}) {
  // Navigation Tabs: 'main' (Asosiy) | 'rating' (Reyting) | 'shop' (Do'kon) | 'profile' (Profil)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('rsa_student_portal_tab');
    if (saved === 'main' || saved === 'rating' || saved === 'shop' || saved === 'profile') {
      return saved;
    }
    return 'main';
  });

  useEffect(() => {
    localStorage.setItem('rsa_student_portal_tab', activeTab);
  }, [activeTab]);

  // Determine current student group
  const currentGroup = useMemo(() => {
    if (studentGroupId) {
      const sId = String(studentGroupId);
      const found =
        (allConnectedGroups || []).find((g) => String(g.id) === sId) ||
        (groups || []).find((g) => String(g.id) === sId);
      if (found) return found;
    }
    return (allConnectedGroups && allConnectedGroups[0]) ||
      (groups && groups.length > 0 && String(groups[0]?.id) === String(studentGroupId) ? groups[0] : null);
  }, [studentGroupId, allConnectedGroups, groups]);

  // Resolve current active group's teacher profile
  const currentTeacherProfile = useMemo(() => {
    if (currentGroup?.teacherId && allTeachersData?.[currentGroup.teacherId]?.teacherProfile) {
      return allTeachersData[currentGroup.teacherId].teacherProfile;
    }
    return teacherProfile || null;
  }, [currentGroup, allTeachersData, teacherProfile]);

  // Unified list of connected groups
  const connectedGroupsList = useMemo(() => {
    if (allConnectedGroups && allConnectedGroups.length > 0) {
      return allConnectedGroups;
    }
    if (studentGroups && studentGroups.length > 0) {
      return studentGroups.map((sg) => {
        const found = groups.find((g) => String(g.id) === String(sg.groupId));
        return found || { id: sg.groupId, name: sg.groupName || 'Guruh' };
      });
    }
    return currentGroup ? [currentGroup] : [];
  }, [allConnectedGroups, studentGroups, groups, currentGroup]);

  // Keep connected groups in a strictly stable, predictable order (prevent cards from jumping/swapping rows on selection)
  const sortedConnectedGroups = useMemo(() => {
    if (!connectedGroupsList || connectedGroupsList.length <= 1) return connectedGroupsList || [];
    return [...connectedGroupsList].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  }, [connectedGroupsList]);

  // Group students strictly scoped to current group
  const groupStudents = useMemo(() => {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    const pool = (allActiveStudents && allActiveStudents.length > 0) ? allActiveStudents : students;
    return pool.filter((s) => String(s.groupId) === gId && !s.deleted);
  }, [currentGroup, allActiveStudents, students]);

  // Group transactions strictly scoped to current group students
  const groupTransactions = useMemo(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return [];
    const validStudentIds = new Set(groupStudents.map((s) => String(s.id)));
    const pool = (allActiveTransactions && allActiveTransactions.length > 0) ? allActiveTransactions : transactions;
    return pool.filter((t) => !t.deleted && validStudentIds.has(String(t.studentId)));
  }, [currentGroup, groupStudents, allActiveTransactions, transactions]);

  // Group attendance strictly scoped to current group
  const groupAttendance = useMemo(() => {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    return attendance.filter((a) => String(a.groupId) === gId);
  }, [attendance, currentGroup]);

  // Pinned Student Profile
  const [pinnedOverrides, setPinnedOverrides] = useState({});

  // Synchronously compute pinned student for the active group
  // Handle selecting / authenticating a student profile
  const handleSelectStudentProfile = (studentId, pin = null) => {
    if (!currentGroup?.id || !studentId) return;
    const gId = String(currentGroup.id);
    const targetStr = String(studentId);
    try {
      localStorage.setItem(`rsa_pinned_student_${gId}`, targetStr);
      if (pin) {
        localStorage.setItem(`rsa_pinned_student_pin_${gId}`, String(pin).trim());
      }
      localStorage.setItem('rsa_pinned_student_id', targetStr);
    } catch {}
    setPinnedOverrides((prev) => ({ ...prev, [gId]: targetStr }));
  };

  // Synchronously compute pinned student for the active group
  const pinnedStudent = useMemo(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return null;
    const gId = String(currentGroup.id);

    // 1. Session override
    const override = pinnedOverrides[gId];
    if (override === null) {
      // User explicitly cleared selection in this session for this group
      return null;
    }

    let candidateId = override;

    // 2. localStorage for this group
    if (candidateId === undefined) {
      try {
        candidateId = localStorage.getItem(`rsa_pinned_student_${gId}`) || null;
      } catch {
        candidateId = null;
      }
    }

    if (candidateId) {
      const found = groupStudents.find((s) => String(s.id) === String(candidateId));
      if (found) {
        return found;
      }
    }

    // 3. Smart Name Auto-Match across connected groups
    try {
      const savedName = localStorage.getItem('rsa_pinned_student_name');
      if (savedName) {
        const cleanSavedName = savedName.trim().toLowerCase();
        const matchByName = groupStudents.find(
          (s) => (s.name || '').trim().toLowerCase() === cleanSavedName
        );
        if (matchByName) {
          try {
            localStorage.setItem(`rsa_pinned_student_${gId}`, String(matchByName.id));
          } catch {}
          return matchByName;
        }
      }
    } catch {}

    return null;
  }, [currentGroup?.id, groupStudents, pinnedOverrides]);

  // Safe Remote Kickout listener: if teacher reset the student's PIN remotely in DB
  useEffect(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return;
    const gId = String(currentGroup.id);
    let storedId = null;
    let storedPin = null;
    try {
      storedId = localStorage.getItem(`rsa_pinned_student_${gId}`) || null;
      storedPin = localStorage.getItem(`rsa_pinned_student_pin_${gId}`) || null;
    } catch {}
    if (!storedId || !storedPin) return;

    const found = groupStudents.find((s) => String(s.id) === String(storedId));
    if (!found) return;

    // If student had a stored PIN and teacher actively cleared PIN in database (pin is now null):
    if (!found.pin) {
      try {
        localStorage.removeItem(`rsa_pinned_student_${gId}`);
        localStorage.removeItem(`rsa_pinned_student_pin_${gId}`);
        localStorage.removeItem('rsa_pinned_student_id');
        localStorage.removeItem('rsa_pinned_student_name');
      } catch {}
      setPinnedOverrides((prev) => ({ ...prev, [gId]: null }));
      if (showToast) {
        showToast("Ushbu profil PIN-kodi ustoz tomonidan bekor qilindi.", 'info');
      }
    }
  }, [currentGroup?.id, groupStudents, showToast]);

  const pinnedStudentId = useMemo(() => {
    return pinnedStudent ? String(pinnedStudent.id) : null;
  }, [pinnedStudent]);

  // Total points for pinned student
  const totalPinnedScore = useMemo(() => {
    if (!pinnedStudentId) return 0;
    const pId = String(pinnedStudentId);
    return groupTransactions
      .filter((t) => !t.deleted && String(t.studentId) === pId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [pinnedStudentId, groupTransactions]);

  // Rank calculation for pinned student (matches StudentRatingView ranking logic)
  const pinnedStudentRank = useMemo(() => {
    if (!pinnedStudentId || groupStudents.length === 0) return null;
    const scoreMap = new Map();
    groupStudents.forEach((s) => scoreMap.set(String(s.id), 0));
    groupTransactions.forEach((tx) => {
      const sId = String(tx.studentId);
      if (scoreMap.has(sId)) {
        scoreMap.set(sId, scoreMap.get(sId) + (Number(tx.amount) || 0));
      }
    });

    const pinnedScore = scoreMap.get(String(pinnedStudentId)) || 0;
    // Like to'planmagan bo'lsa (ball <= 0), reyting o'rni berilmaydi
    if (pinnedScore <= 0) return null;

    // Faqat 0 dan yuqori ball to'plagan o'quvchilar reytingda qatnashadi
    const scoredStudents = groupStudents
      .map((s) => ({ id: String(s.id), score: scoreMap.get(String(s.id)) || 0 }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // Dense ranking (teng ballar bir xil o'rinni egallaydi)
    let currentRank = 0;
    let lastScore = null;
    for (const st of scoredStudents) {
      if (st.score !== lastScore) {
        currentRank += 1;
        lastScore = st.score;
      }
      if (st.id === String(pinnedStudentId)) {
        return currentRank;
      }
    }

    return null;
  }, [pinnedStudentId, groupStudents, groupTransactions]);

  // Monthly attendance % for pinned student
  const pinnedAttendanceRate = useMemo(() => {
    if (!pinnedStudentId || !currentGroup?.id) return null;
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let present = 0;
    let absent = 0;
    let late = 0;
    groupAttendance.forEach((rec) => {
      if (rec.date && rec.date.startsWith(prefix)) {
        const st = rec.records?.[pinnedStudentId] ?? rec.records?.[pinnedStudent?.id];
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'late') late++;
      }
    });
    const total = present + absent + late;
    if (total === 0) return null;
    return `${Math.round(((present + late * 0.5) / total) * 100)}%`;
  }, [pinnedStudentId, currentGroup?.id, groupAttendance, pinnedStudent?.id]);

  // Group lessons count in current month (useful for unpinned state)
  const groupMonthLessonsCount = useMemo(() => {
    if (!currentGroup?.id || !groupAttendance.length) return 0;
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return groupAttendance.filter((rec) => rec.date && rec.date.startsWith(prefix)).length;
  }, [currentGroup?.id, groupAttendance]);

  const handleTabSelect = (newTab, targetSectionId = null) => {
    triggerHaptic('light');
    const isSameTab = newTab === activeTab;
    if (!isSameTab) {
      setActiveTab(newTab);
    }
    if (typeof window !== 'undefined') {
      if (targetSectionId) {
        setTimeout(() => {
          if (targetSectionId) {
            scrollToWithOffset(targetSectionId);
          } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        }, isSameTab ? 10 : 80);
      } else {
        window.scrollTo({ top: 0, behavior: isSameTab ? 'smooth' : 'instant' });
      }
    }
  };

  const handleClearProfilePin = () => {
    if (!currentGroup?.id) return;
    const gId = String(currentGroup.id);
    try {
      localStorage.removeItem(`rsa_pinned_student_${gId}`);
      localStorage.removeItem(`rsa_pinned_student_pin_${gId}`);
      localStorage.removeItem('rsa_pinned_student_id');
      localStorage.removeItem('rsa_pinned_student_name');
    } catch {}
    setPinnedOverrides((prev) => ({ ...prev, [gId]: null }));
    if (showToast) {
      showToast("Profil tanlovi bekor qilindi.", 'info');
    }
  };

  // Uzbek formatted date for welcome card
  const formattedToday = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = UZBEK_MONTHS[now.getMonth()];
    const weekday = UZBEK_WEEKDAYS[now.getDay()];
    return `Bugun, ${day}-${month}, ${weekday}`;
  }, []);

  return (
    <div className="student-portal-wrapper">
      {/* 1. Sleek Minimalist Top Navigation Header (Portaled to document.body so it is strictly fixed to viewport) */}
      {typeof document !== 'undefined' && createPortal(
        <header className="student-navbar" aria-label="Asosiy navigatsiya paneli">
          <div className="student-navbar-inner">
            {/* Left: Brand Identity */}
            <div className="navbar-brand-col">
              <button
                type="button"
                className="navbar-brand-btn"
                onClick={() => handleTabSelect('main')}
                title="Asosiy sahifa"
                aria-label="Asosiy sahifa"
              >
                <span className="navbar-logo-text">
                  EPCHIL <span className="logo-badge">ROBOT</span>
                </span>
              </button>
            </div>

            {/* Center: Desktop-only Segmented Navigation Tabs (4 Tabs) */}
            <div className="navbar-desktop-nav">
              <nav className="desktop-segmented-control" aria-label="Student sahifalari">
                <button
                  type="button"
                  className={`desktop-nav-btn ${activeTab === 'main' ? 'active' : ''}`}
                  onClick={() => handleTabSelect('main')}
                >
                  Asosiy
                </button>
                <button
                  type="button"
                  className={`desktop-nav-btn ${activeTab === 'rating' ? 'active' : ''}`}
                  onClick={() => handleTabSelect('rating')}
                >
                  Reyting
                </button>
                <button
                  type="button"
                  className={`desktop-nav-btn ${activeTab === 'shop' ? 'active' : ''}`}
                  onClick={() => handleTabSelect('shop')}
                >
                  Do'kon
                </button>
                <button
                  type="button"
                  className={`desktop-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleTabSelect('profile')}
                >
                  Profil
                </button>
              </nav>
            </div>

            {/* Right: Quick Profile Summary & Theme Icon */}
            <div className="navbar-actions-row">
              <button
                type="button"
                className="navbar-profile-pill"
                onClick={() => handleTabSelect('profile')}
                title="Profil sozlamalariga o'tish"
                aria-label="Profil"
              >
                {pinnedStudent ? (
                  <>
                    <div className="navbar-avatar-circle">
                      {renderAvatar(pinnedStudent.emoji, 26)}
                    </div>
                    <div className="navbar-profile-info">
                      <span className="navbar-user-name">
                        {pinnedStudent.name.split(' ')[0]}
                      </span>
                      <span className="navbar-likes-pill">
                        {totalPinnedScore} Like
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="navbar-avatar-circle unpinned">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="navbar-profile-info">
                      <span className="navbar-unpinned-text">
                        <span className="unpinned-text-full">Profil tanlash</span>
                        <span className="unpinned-text-short">Profil</span>
                      </span>
                    </div>
                  </>
                )}
              </button>

              {toggleTheme && (
                <button
                  type="button"
                  className="navbar-icon-btn"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleTheme();
                  }}
                  title="Mavzuni o'zgartirish"
                  aria-label="Mavzu"
                >
                  {theme === 'dark' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>,
        document.body
      )}

      {/* 2. Main Centered Content Container */}
      <div className="student-portal-container">
        <main className="student-content-view">
        {/* TAB 1: ASOSIY (Home) */}
        {activeTab === 'main' && (
          <div className="tab-pane-main animate-fadeIn">
            {/* Top Welcome & Quick Stats Hero */}
            <div className="home-welcome-hero">
              <div className="welcome-greeting-row">
                {pinnedStudent && (
                  <button
                    type="button"
                    className="welcome-avatar-btn"
                    onClick={() => handleTabSelect('profile')}
                    title="Profil sozlamalariga o'tish"
                    aria-label="Profil sozlamalari"
                  >
                    <div className="welcome-avatar-circle">
                      {renderAvatar(pinnedStudent.emoji, 48)}
                    </div>
                  </button>
                )}
                <div className="welcome-title-col">
                  <h2 className="welcome-title">
                    {pinnedStudent ? `Salom, ${pinnedStudent.name.split(' ')[0]}!` : "Assalomu alaykum!"}
                  </h2>
                  <span className="welcome-date-sub">{formattedToday}</span>
                </div>
              </div>

              {/* 3 Quick Stat Cards Row - Interactive */}
              <div className="home-stats-grid">
                <button
                  type="button"
                  className="home-stat-card is-clickable"
                  onClick={() => handleTabSelect('rating')}
                  title="Reyting sahifasiga o'tish"
                >
                  <span className="stat-card-eyebrow">Reyting</span>
                  <span className="stat-card-value">
                    {pinnedStudentRank ? `#${pinnedStudentRank} o'rin` : "—"}
                  </span>
                  <span className="stat-card-hint">
                    {totalPinnedScore} Like ›
                  </span>
                </button>

                <button
                  type="button"
                  className="home-stat-card is-clickable"
                  onClick={() => {
                    scrollToWithOffset('student-attendance-calendar');
                  }}
                  title="Davomat taqvimiga o'tish"
                >
                  <span className="stat-card-eyebrow">Davomat</span>
                  <span className="stat-card-value">
                    {pinnedStudent
                      ? (pinnedAttendanceRate || "—")
                      : (groupMonthLessonsCount > 0 ? `${groupMonthLessonsCount} ta dars` : "—")}
                  </span>
                  <span className="stat-card-hint">
                    {pinnedStudent
                      ? (pinnedAttendanceRate ? "Bu oyda ›" : "Tarix yo'q ›")
                      : (groupMonthLessonsCount > 0 ? "Profil tanlang ›" : "Dars yo'q ›")}
                  </span>
                </button>
              </div>
            </div>

            {/* Teacher Showcase Card */}
            <StudentTeacherShowcase teacherProfile={currentTeacherProfile} />

            {/* Active Group Schedule Card */}
            <StudentScheduleCard group={currentGroup} />

            {/* Monthly Attendance Calendar */}
            <StudentAttendanceCalendar
              attendance={groupAttendance}
              group={currentGroup}
              pinnedStudent={pinnedStudent}
              onOpenProfilePicker={() => handleTabSelect('profile')}
            />

            {/* Insight Plus Center Addresses & Contact Card */}
            <StudentCenterAddresses />
          </div>
        )}

        {/* TAB 2: REYTING (Ranking) */}
        {activeTab === 'rating' && (
          <div className="tab-pane-rating animate-fadeIn">
            <StudentRatingView
              key={currentGroup?.id || 'rating'}
              students={groupStudents}
              transactions={groupTransactions}
              allStudents={allActiveStudents && allActiveStudents.length > 0 ? allActiveStudents : students}
              allTransactions={allActiveTransactions && allActiveTransactions.length > 0 ? allActiveTransactions : transactions}
              allGroups={allActiveGroups && allActiveGroups.length > 0 ? allActiveGroups : groups}
              pinnedStudentId={pinnedStudentId}
              pinnedStudent={pinnedStudent}
              group={currentGroup}
              connectedGroups={connectedGroupsList}
              onSwitchGroup={onSwitchGroup}
              initialTimeframe="month"
            />
          </div>
        )}

        {/* TAB 3: DO'KON (Shop) */}
        {activeTab === 'shop' && (
          <div className="tab-pane-shop animate-fadeIn">
            <StudentShopComingSoon
              pinnedStudent={pinnedStudent}
              transactions={groupTransactions}
              showToast={showToast}
              onOpenProfilePicker={() => handleTabSelect('profile')}
            />
          </div>
        )}

        {/* TAB 4: PROFIL (Dedicated Account Section) */}
        {activeTab === 'profile' && (
          <div className="tab-pane-profile animate-fadeIn">
            <StudentAccountView
              currentGroup={currentGroup}
              connectedGroupsList={connectedGroupsList}
              sortedConnectedGroups={sortedConnectedGroups}
              pinnedStudent={pinnedStudent}
              pinnedStudentId={pinnedStudentId}
              groupStudents={groupStudents}
              groupTransactions={groupTransactions}
              onSwitchGroup={onSwitchGroup}
              onAddGroup={onAddGroup}
              onRemoveGroup={onRemoveGroup}
              onUpdateAvatar={onUpdateAvatar}
              onSetStudentPin={onSetStudentPin}
              onClaimStudentDevice={onClaimStudentDevice}
              onSelectProfile={handleSelectStudentProfile}
              handleClearProfilePin={handleClearProfilePin}
              theme={theme}
              toggleTheme={toggleTheme}
              onLogout={onLogout}
              showToast={showToast}
            />
          </div>
        )}
      </main>
      </div>

      {/* 3. Modern Clean Mobile Floating Bottom Navigation Dock (Portal to document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <nav className="student-mobile-dock" aria-label="Mobil navigatsiya paneli">
          <div className="mobile-dock-inner">
            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => handleTabSelect('main')}
              aria-label="Asosiy sahifa"
            >
              <div className="dock-tab-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'main' ? "2.6" : "2"} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="dock-tab-label">Asosiy</span>
            </button>

            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => handleTabSelect('rating')}
              aria-label="Reyting sahifasi"
            >
              <div className="dock-tab-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'rating' ? "2.6" : "2"} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <span className="dock-tab-label">Reyting</span>
            </button>

            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => handleTabSelect('shop')}
              aria-label="Do'kon sahifasi"
            >
              <div className="dock-tab-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'shop' ? "2.6" : "2"} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span className="dock-tab-label">Do'kon</span>
            </button>

            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabSelect('profile')}
              aria-label="Profil sahifasi"
            >
              <div className="dock-tab-icon">
                {pinnedStudent ? (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderAvatar(pinnedStudent.emoji, 22)}
                  </div>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'profile' ? "2.6" : "2"} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <span className="dock-tab-label">Profil</span>
            </button>
          </div>
        </nav>,
        document.body
      )}
    </div>
  );
}
