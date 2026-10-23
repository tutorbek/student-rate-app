import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import StudentScheduleCard from './StudentScheduleCard';
import StudentTeacherShowcase from './StudentTeacherShowcase';
import StudentAttendanceCalendar from './StudentAttendanceCalendar';
import StudentRatingView from './StudentRatingView';
import StudentRewardView from './StudentRewardView';
import StudentAccountView from './StudentAccountView';
import StudentProfileSelectView from './StudentProfileSelectView';
import { renderAvatar } from '../../utils/studentAvatars';
import { preloadAvatars, idlePreloadGalleryAvatars } from '../../utils/avatarCache';
import { scrollToWithOffset } from '../../utils/scrollOffset';
import { isStudentTargetedByExtraLesson } from '../../utils/scheduleUtils';
import { ZapIcon, CalendarIcon, MapPinIcon } from './StudentIcons';
import { sanitizeStudentAvatar } from '../../utils/avatarGallery';
import { setupTelegramFullscreen, syncTelegramMetrics } from '../../utils/telegram';
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

const formatExtraLessonDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) return 'Bugun';
  if (dateStr === tomorrowStr) return 'Ertaga';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parseInt(parts[2], 10)}-${UZBEK_MONTHS[mIdx] || parts[1]}`;
  }
  return dateStr;
};

const formatExtraLessonFullDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayName = UZBEK_WEEKDAYS[dt.getDay()] || '';
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${dayName}, ${parseInt(parts[2], 10)}-${UZBEK_MONTHS[mIdx] || parts[1]}`;
  }
  return dateStr;
};

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
  onUnlockAvatar,
  onSetStudentPin,
  onClaimStudentDevice,
  showToast,
  theme = 'light',
  toggleTheme,
  teacherProfile = null,
  allTeachersData = {},
  extraLessons = [],
  rewards = null,
  onRequestGift = null,
}) {
  // Navigation Tabs: 'main' (Asosiy) | 'rating' (Reyting) | 'shop' (Sovg'a) | 'profile' (Profil)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('rsa_student_portal_tab');
    if (saved === 'main' || saved === 'rating' || saved === 'shop' || saved === 'reward' || saved === 'profile') {
      return saved === 'reward' ? 'shop' : saved;
    }
    return 'main';
  });

  useEffect(() => {
    localStorage.setItem('rsa_student_portal_tab', activeTab);
  }, [activeTab]);

  // Synchronize Telegram Fullscreen Mode, safe area CSS metrics and header colors
  useEffect(() => {
    const cleanup = setupTelegramFullscreen(theme);
    return cleanup;
  }, [theme]);

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

  // All active data for the current group's teacher
  const currentTeacherData = useMemo(() => {
    if (currentGroup?.teacherId && allTeachersData?.[currentGroup.teacherId]) {
      return allTeachersData[currentGroup.teacherId];
    }
    return null;
  }, [currentGroup, allTeachersData]);

  // Current active teacher rewards for gifts
  const currentRewards = useMemo(() => {
    if (rewards && (rewards.kids || rewards.teens || (Array.isArray(rewards.requests) && rewards.requests.length > 0))) {
      return rewards;
    }
    if (currentTeacherData?.rewards) {
      return currentTeacherData.rewards;
    }
    if (currentGroup?.teacherId && allTeachersData?.[currentGroup.teacherId]?.rewards) {
      return allTeachersData[currentGroup.teacherId].rewards;
    }
    const firstTeacher = Object.values(allTeachersData || {})[0];
    if (firstTeacher?.rewards) {
      return firstTeacher.rewards;
    }
    return { kids: null, teens: null, requests: [] };
  }, [rewards, currentTeacherData, currentGroup, allTeachersData]);

  const teacherAllGroups = useMemo(() => {
    if (currentTeacherData?.groups && currentTeacherData.groups.length > 0) {
      return currentTeacherData.groups.filter((g) => !g.deleted);
    }
    return (allActiveGroups && allActiveGroups.length > 0) ? allActiveGroups : groups;
  }, [currentTeacherData, allActiveGroups, groups]);

  const teacherAllStudents = useMemo(() => {
    if (currentTeacherData?.students && currentTeacherData.students.length > 0) {
      return currentTeacherData.students.filter((s) => !s.deleted);
    }
    return (allActiveStudents && allActiveStudents.length > 0) ? allActiveStudents : students;
  }, [currentTeacherData, allActiveStudents, students]);

  const teacherAllTransactions = useMemo(() => {
    if (currentTeacherData?.transactions && currentTeacherData.transactions.length > 0) {
      return currentTeacherData.transactions.filter((t) => !t.deleted);
    }
    return (allActiveTransactions && allActiveTransactions.length > 0) ? allActiveTransactions : transactions;
  }, [currentTeacherData, allActiveTransactions, transactions]);

  // Group students strictly scoped to current group
  const groupStudents = useMemo(() => {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    const pool = teacherAllStudents;
    return pool.filter((s) => String(s.groupId) === gId && !s.deleted);
  }, [currentGroup, teacherAllStudents]);

  // Group transactions strictly scoped to current group students
  const groupTransactions = useMemo(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return [];
    const validStudentIds = new Set(groupStudents.map((s) => String(s.id)));
    const pool = teacherAllTransactions;
    return pool.filter((t) => !t.deleted && validStudentIds.has(String(t.studentId)));
  }, [currentGroup, groupStudents, teacherAllTransactions]);

  // Group attendance strictly scoped to current group
  const groupAttendance = useMemo(() => {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    return attendance.filter((a) => String(a.groupId) === gId);
  }, [attendance, currentGroup]);

  // Pinned Student Profile
  const [pinnedOverrides, setPinnedOverrides] = useState({});
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

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

    // 2. localStorage for this group or global pinned id
    if (candidateId === undefined) {
      try {
        candidateId = localStorage.getItem(`rsa_pinned_student_${gId}`) || localStorage.getItem('rsa_pinned_student_id') || null;
      } catch {
        candidateId = null;
      }
    }

    if (candidateId) {
      const found = groupStudents.find((s) => String(s.id) === String(candidateId));
      if (found) {
        return { ...found, emoji: sanitizeStudentAvatar(found) };
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
          return { ...matchByName, emoji: sanitizeStudentAvatar(matchByName) };
        }
      }
    } catch {}

    return null;
  }, [currentGroup?.id, groupStudents, pinnedOverrides]);

  // High-performance avatar preloading into memory cache
  useEffect(() => {
    const avatars = [];
    if (pinnedStudent?.emoji) avatars.push(pinnedStudent.emoji);
    if (Array.isArray(groupStudents)) {
      groupStudents.forEach((st) => {
        if (st.emoji) avatars.push(st.emoji);
      });
    }
    if (avatars.length > 0) {
      preloadAvatars(avatars);
    }
    idlePreloadGalleryAvatars();
  }, [groupStudents, pinnedStudent]);

  // Upcoming Extra Lesson for currentGroup
  const upcomingGroupExtraLesson = useMemo(() => {
    if (!currentGroup?.id || !Array.isArray(extraLessons) || extraLessons.length === 0) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const future = extraLessons
      .filter((el) => {
        if (!el || String(el.groupId) !== String(currentGroup.id) || el.date < todayStr) return false;
        if (pinnedStudent?.id && !isStudentTargetedByExtraLesson(el, pinnedStudent.id)) return false;
        return true;
      })
      .sort((a, b) => {
        const c = (a.date || '').localeCompare(b.date || '');
        if (c !== 0) return c;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
    return future.length > 0 ? future[0] : null;
  }, [currentGroup?.id, extraLessons, pinnedStudent?.id]);

  // Safe Remote Kickout listener: ONLY kick out if teacher ACTIVELY reset the student's PIN remotely in DB
  useEffect(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return;
    const gId = String(currentGroup.id);
    let storedId = null;
    let storedPin = null;
    try {
      storedId = localStorage.getItem(`rsa_pinned_student_${gId}`) || localStorage.getItem('rsa_pinned_student_id') || null;
      storedPin = localStorage.getItem(`rsa_pinned_student_pin_${gId}`) || null;
    } catch {}
    if (!storedId || !storedPin) return;

    const found = groupStudents.find((s) => String(s.id) === String(storedId));
    if (!found) return;

    // Check if teacher actively reset PIN remotely (found.pinResetAt exists and is after pinUpdatedAt):
    const isActivelyResetByTeacher = Boolean(
      !found.pin && found.pinResetAt && (!found.pinUpdatedAt || new Date(found.pinResetAt) >= new Date(found.pinUpdatedAt))
    );

    if (isActivelyResetByTeacher) {
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
    } else if (!found.pin && storedPin && onSetStudentPin) {
      // Self-healing: client has valid storedPin for this student, but DB was temporarily missing it -> sync back to DB!
      onSetStudentPin(found.id, storedPin, found.name, null, currentGroup.teacherId);
    }
  }, [currentGroup?.id, currentGroup?.teacherId, groupStudents, onSetStudentPin, showToast]);

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

    // Standard Competition Ranking (1, 2, 2, 4...)
    let currentRank = 1;
    for (let i = 0; i < scoredStudents.length; i++) {
      const st = scoredStudents[i];
      if (i > 0 && st.score < scoredStudents[i - 1].score) {
        currentRank = i + 1;
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

  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  const handleTabSelect = (newTab, targetSectionId = null) => {
    triggerHaptic('light');
    setIsAvatarPickerOpen(false);
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

  if (!pinnedStudent || isSwitchingProfile) {
    return (
      <StudentProfileSelectView
        currentGroup={currentGroup}
        groupStudents={groupStudents}
        onSelectProfile={(studentId, pin) => {
          handleSelectStudentProfile(studentId, pin);
          setIsSwitchingProfile(false);
        }}
        onSetStudentPin={onSetStudentPin}
        onLogout={onLogout}
        onCancel={pinnedStudent ? () => setIsSwitchingProfile(false) : null}
        theme={theme}
        toggleTheme={toggleTheme}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="student-portal-wrapper">
      {/* 1. Sleek Minimalist Top Navigation Header (Portaled to document.body so it is strictly fixed to viewport) */}
      {!(activeTab === 'profile' && isAvatarPickerOpen) && typeof document !== 'undefined' && createPortal(
        <header className="student-navbar" aria-label="Asosiy navigatsiya paneli">
          <div className="student-navbar-inner">
            {/* Left: Brand Identity */}
            <div className="navbar-brand-col">
              <button
                type="button"
                className="navbar-brand-btn"
                onClick={() => handleTabSelect('main')}
                aria-label="Asosiy sahifa"
              >
                <span className="navbar-logo-text">
                  <img
                    src={theme === 'dark' ? "/apple-touch-icon-dark.png" : "/apple-touch-icon.png"}
                    alt="Epchil Logo"
                    className="navbar-logo-icon"
                  />
                  EPCHIL <span className="logo-badge">COM</span>
                </span>
              </button>
            </div>

            {/* Center: Desktop-only Segmented Navigation Tabs (3 Tabs) */}
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
                  Sovg'a
                </button>
              </nav>
            </div>

            {/* Right: Quick Profile Summary & Theme Icon */}
            <div className="navbar-actions-row">
              {toggleTheme && (
                <button
                  type="button"
                  className="navbar-icon-btn"
                  onClick={() => {
                    triggerHaptic('light');
                    toggleTheme();
                  }}
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

              <button
                type="button"
                className={`navbar-profile-avatar-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabSelect('profile')}
                aria-label={pinnedStudent ? `${pinnedStudent.name} profili` : "Profil"}
              >
                {pinnedStudent ? (
                  <div className="navbar-avatar-circle">
                    {renderAvatar(pinnedStudent.emoji, 30, { priority: 'high', eager: true })}
                  </div>
                ) : (
                  <div className="navbar-avatar-circle unpinned">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </button>
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
            {/* Top Welcome Hero */}
            <div className="home-welcome-hero">
              <div className="welcome-greeting-row">
                <button
                  type="button"
                  className="welcome-avatar-btn"
                  onClick={() => handleTabSelect('profile')}
                  aria-label="Profil sozlamalari"
                >
                  <div className="welcome-avatar-circle">
                    {renderAvatar(pinnedStudent?.emoji, 48, { priority: 'high', eager: true })}
                  </div>
                </button>
                <div className="welcome-title-col">
                  <h2 className="welcome-title">
                    {`Salom, ${pinnedStudent?.name ? pinnedStudent.name.split(' ')[0] : ''}!`}
                  </h2>
                </div>
              </div>
            </div>

            {/* Upcoming Extra Lesson Announcement Banner */}
            {upcomingGroupExtraLesson && (
              <div className="student-extra-lesson-banner scale-active">
                <div className="extra-banner-top">
                  <span className="extra-banner-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ZapIcon size={12} color="#7C3AED" />
                    <span>Extra Dars</span>
                  </span>
                  <span className="extra-banner-date-badge">
                    {formatExtraLessonDateLabel(upcomingGroupExtraLesson.date)}
                  </span>
                </div>
                <div className="extra-banner-body">
                  <h4 className="extra-banner-title">
                    {upcomingGroupExtraLesson.topic || "Qo'shimcha dars rejalashtirildi"}
                  </h4>
                  <div className="extra-banner-meta">
                    <span className="extra-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarIcon size={13} />
                      <strong>{formatExtraLessonFullDate(upcomingGroupExtraLesson.date)}</strong>
                    </span>
                    <span className="extra-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <strong>{upcomingGroupExtraLesson.startTime}{upcomingGroupExtraLesson.endTime ? ` — ${upcomingGroupExtraLesson.endTime}` : ''}</strong>
                    </span>
                    {upcomingGroupExtraLesson.room && (
                      <span className="extra-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <MapPinIcon size={13} />
                        <strong>{upcomingGroupExtraLesson.room}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Showcase Card */}
            <StudentTeacherShowcase teacherProfile={currentTeacherProfile} />

            {/* Active Group Schedule Card */}
            <StudentScheduleCard
              group={currentGroup}
              extraLessons={extraLessons}
              studentId={pinnedStudent?.id}
            />

            {/* Monthly Attendance Calendar */}
            <StudentAttendanceCalendar
              attendance={groupAttendance}
              group={currentGroup}
              pinnedStudent={pinnedStudent}
              onOpenProfilePicker={() => handleTabSelect('profile')}
              extraLessons={extraLessons}
            />

          </div>
        )}

        {/* TAB 2: REYTING (Ranking) */}
        {activeTab === 'rating' && (
          <div className="tab-pane-rating animate-fadeIn">
            <StudentRatingView
              key={currentGroup?.id || 'rating'}
              students={groupStudents}
              transactions={groupTransactions}
              allStudents={teacherAllStudents}
              allTransactions={teacherAllTransactions}
              allGroups={teacherAllGroups}
              pinnedStudentId={pinnedStudentId}
              pinnedStudent={pinnedStudent}
              group={currentGroup}
              connectedGroups={connectedGroupsList}
              onSwitchGroup={onSwitchGroup}
              initialTimeframe="month"
              attendanceRate={pinnedAttendanceRate}
              onOpenProfilePicker={() => handleTabSelect('profile')}
            />
          </div>
        )}

        {/* TAB 3: SOVG'A (Monthly Race & Reward) */}
        {(activeTab === 'shop' || activeTab === 'reward') && (
          <div className="tab-pane-reward animate-fadeIn">
            <StudentRewardView
              pinnedStudent={pinnedStudent}
              currentGroup={currentGroup}
              allStudents={teacherAllStudents}
              allTransactions={teacherAllTransactions}
              allGroups={teacherAllGroups}
              rewards={currentRewards}
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
              onUnlockAvatar={onUnlockAvatar}
              totalPinnedScore={totalPinnedScore}
              onSetStudentPin={onSetStudentPin}
              onClaimStudentDevice={onClaimStudentDevice}
              onSelectProfile={handleSelectStudentProfile}
              onSwitchProfile={() => setIsSwitchingProfile(true)}
              handleClearProfilePin={handleClearProfilePin}
              theme={theme}
              toggleTheme={toggleTheme}
              onLogout={onLogout}
              showToast={showToast}
              isAvatarPickerOpen={isAvatarPickerOpen}
              setIsAvatarPickerOpen={setIsAvatarPickerOpen}
            />
          </div>
        )}
      </main>
      </div>

      {/* 3. Modern Clean Mobile Floating Bottom Navigation Dock (Portal to document.body) */}
      {!(activeTab === 'profile' && isAvatarPickerOpen) && typeof document !== 'undefined' && createPortal(
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
              className={`dock-tab-btn ${activeTab === 'shop' || activeTab === 'reward' ? 'active' : ''}`}
              onClick={() => handleTabSelect('shop')}
              aria-label="Sovg'a sahifasi"
            >
              <div className="dock-tab-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'shop' || activeTab === 'reward' ? "2.6" : "2"} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <span className="dock-tab-label">Sovg'a</span>
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
                    {renderAvatar(pinnedStudent.emoji, 22, { eager: true })}
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
