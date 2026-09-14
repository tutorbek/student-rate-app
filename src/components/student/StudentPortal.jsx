import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import StudentScheduleCard from './StudentScheduleCard';
import StudentAttendanceCalendar from './StudentAttendanceCalendar';
import StudentRatingView from './StudentRatingView';
import StudentShopComingSoon from './StudentShopComingSoon';
import { renderAvatar, STUDENT_AVATARS } from '../../utils/studentAvatars';
import { AVATAR_GALLERY_IMAGES } from '../../utils/avatarGallery';

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

export default function StudentPortal({
  attendance = [],
  groups = [],
  students = [],
  transactions = [],
  allActiveGroups: _allActiveGroups = [],
  allActiveStudents: _allActiveStudents = [],
  allActiveTransactions: _allActiveTransactions = [],
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
}) {

  // Navigation Tabs: 'main' (Asosiy) | 'rating' (Reyting) | 'shop' (Do'kon)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('rsa_student_portal_tab');
    if (saved === 'main' || saved === 'rating' || saved === 'shop') {
      return saved;
    }
    return 'main';
  });

  const [ratingInitialTimeframe] = useState('month');

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

  // Sort connected groups so current active group is first
  const sortedConnectedGroups = useMemo(() => {
    if (!currentGroup) return connectedGroupsList;
    return [...connectedGroupsList].sort((a, b) => {
      if (String(a.id) === String(currentGroup.id)) return -1;
      if (String(b.id) === String(currentGroup.id)) return 1;
      return 0;
    });
  }, [connectedGroupsList, currentGroup]);

  // Group Switcher & Add Group Modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupAddError, setGroupAddError] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const handleAddNewGroup = async (e) => {
    if (e) e.preventDefault();
    const cleanPwd = (newGroupPassword || '').trim();
    if (!cleanPwd) {
      setGroupAddError("Parolni kiriting!");
      return;
    }
    setIsSubmittingGroup(true);
    setGroupAddError('');

    try {
      if (onAddGroup) {
        const res = await onAddGroup(cleanPwd);
        if (res.success) {
          if (showToast) {
            showToast(
              res.alreadyConnected
                ? `"${res.group?.groupName || 'Guruh'}" allaqachon ulangan va tanlandi.`
                : `"${res.group?.groupName || 'Guruh'}" muvaffaqiyatli qo'shildi!`,
              'success'
            );
          }
          setNewGroupPassword('');
          setIsAddingGroup(false);
          setIsGroupModalOpen(false);
        } else {
          setGroupAddError(res.message || "Noto'g'ri guruh paroli!");
        }
      }
    } catch (err) {
      console.error(err);
      setGroupAddError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleRemoveGroup = (groupId, groupName) => {
    if (connectedGroupsList.length <= 1) {
      if (showToast) showToast("Yagona guruhni o'chirib bo'lmaydi!", 'warning');
      return;
    }
    if (onRemoveGroup) {
      onRemoveGroup(groupId);
      setConfirmRemoveId(null);
      if (showToast) {
        showToast(`"${groupName || 'Guruh'}" ro'yxatdan o'chirildi.`, 'info');
      }
    }
  };

  // Group students strictly scoped to current group
  const groupStudents = useMemo(() => {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    return students.filter((s) => String(s.groupId) === gId && !s.deleted);
  }, [currentGroup, students]);

  // Group transactions strictly scoped to current group students
  const groupTransactions = useMemo(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return [];
    const validStudentIds = new Set(groupStudents.map((s) => String(s.id)));
    return transactions.filter((t) => !t.deleted && validStudentIds.has(String(t.studentId)));
  }, [currentGroup, groupStudents, transactions]);

  // Group attendance strictly scoped to current group
  const groupAttendance = useMemo(() => {
    if (!currentGroup?.id) return [];
    const gId = String(currentGroup.id);
    return attendance.filter((a) => String(a.groupId) === gId);
  }, [attendance, currentGroup]);

  // Pinned Student Profile (Synchronous resolution to eliminate frame-lag and layout shift)
  const [pinnedOverrides, setPinnedOverrides] = useState({});

  const [isChangingProfile, setIsChangingProfile] = useState(false);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');

  // Lock background scroll when any bottom sheet is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isGroupModalOpen || isChangingProfile) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isGroupModalOpen, isChangingProfile]);

  // Bottom sheet touch drag dismiss logic for Group Modal
  const [groupSheetDragY, setGroupSheetDragY] = useState(0);
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const groupTouchStartY = useRef(0);

  const handleGroupTouchStart = (e) => {
    groupTouchStartY.current = e.touches[0].clientY;
    setIsGroupDragging(true);
  };
  const handleGroupTouchMove = (e) => {
    const diff = e.touches[0].clientY - groupTouchStartY.current;
    if (diff > 0) setGroupSheetDragY(diff);
  };
  const handleGroupTouchEnd = () => {
    setIsGroupDragging(false);
    if (groupSheetDragY > 75) {
      triggerHaptic('light');
      setIsGroupModalOpen(false);
    }
    setGroupSheetDragY(0);
  };

  // Bottom sheet touch drag dismiss logic for Profile Modal
  const [profileSheetDragY, setProfileSheetDragY] = useState(0);
  const [isProfileDragging, setIsProfileDragging] = useState(false);
  const profileTouchStartY = useRef(0);

  const handleProfileTouchStart = (e) => {
    profileTouchStartY.current = e.touches[0].clientY;
    setIsProfileDragging(true);
  };
  const handleProfileTouchMove = (e) => {
    const diff = e.touches[0].clientY - profileTouchStartY.current;
    if (diff > 0) setProfileSheetDragY(diff);
  };
  const handleProfileTouchEnd = () => {
    setIsProfileDragging(false);
    if (profileSheetDragY > 75) {
      triggerHaptic('light');
      setIsChangingProfile(false);
      setProfileSheetView('list');
    }
    setProfileSheetDragY(0);
  };

  // Profile Sheet internal view: 'list' | 'avatar' | 'pin_setup' | 'pin_entry'
  const [profileSheetView, setProfileSheetView] = useState('list');
  const [avatarTab, setAvatarTab] = useState('gallery'); // 'gallery' | 'avatars'

  // PIN authentication & setup state
  const [pinTargetStudent, setPinTargetStudent] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showForgotPinNotice, setShowForgotPinNotice] = useState(false);

  const handleTabSelect = (newTab) => {
    if (newTab === activeTab) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    triggerHaptic('light');
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleScrollToAttendance = () => {
    triggerHaptic('light');
    if (typeof document !== 'undefined') {
      const el = document.getElementById('student-attendance-calendar');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (profileSheetView === 'avatar' || profileSheetView === 'pin_setup' || profileSheetView === 'pin_entry') {
          setProfileSheetView('list');
          setPinError('');
          setPinInput('');
          setConfirmPinInput('');
        } else {
          setIsChangingProfile(false);
          setIsGroupModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileSheetView]);

  // Synchronously compute pinned student for the active group (no 1-frame lag or flicker)
  const pinnedStudent = useMemo(() => {
    if (!currentGroup?.id || groupStudents.length === 0) return null;
    const gId = String(currentGroup.id);

    // 1. Check in-memory session override (if explicitly chosen or cleared in this session)
    let candidateId = pinnedOverrides[gId];

    // 2. Check localStorage for this specific group
    if (candidateId === undefined) {
      try {
        candidateId = localStorage.getItem(`rsa_pinned_student_${gId}`) || null;
      } catch {
        candidateId = null;
      }
    }

    // Explicitly unpinned
    if (candidateId === null) {
      return null;
    }

    // 3. Match candidateId in current group's students
    if (candidateId) {
      const found = groupStudents.find((s) => String(s.id) === String(candidateId));
      if (found) return found;
    }

    // 4. Smart Name Auto-Match:
    // If the student previously pinned their profile in any connected group, automatically connect to same-named student
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

  const pinnedStudentId = useMemo(() => {
    return pinnedStudent ? String(pinnedStudent.id) : null;
  }, [pinnedStudent]);

  // Triggered when a student row is clicked in the profile modal
  const handleSelectStudentForPin = (st) => {
    if (!st) return;
    triggerHaptic('light');
    setPinError('');
    setPinInput('');
    setConfirmPinInput('');
    setShowForgotPinNotice(false);
    setPinTargetStudent(st);

    // If student clicks their own currently pinned profile, just close modal
    if (pinnedStudentId && String(st.id) === String(pinnedStudentId)) {
      setIsChangingProfile(false);
      return;
    }

    if (st.pin) {
      setProfileSheetView('pin_entry');
    } else {
      setProfileSheetView('pin_setup');
    }
  };

  // Submit new 4-digit PIN setup
  const handleSavePinSetup = (e) => {
    if (e) e.preventDefault();
    const cleanPin = (pinInput || '').trim();
    const cleanConfirm = (confirmPinInput || '').trim();

    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setPinError("PIN-kod aynan 4 ta raqamdan iborat bo'lishi kerak!");
      triggerHaptic('heavy');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setPinError("Kiritilgan PIN-kodlar bir-biriga mos kelmadi!");
      triggerHaptic('heavy');
      return;
    }

    if (!pinTargetStudent || !currentGroup?.id) return;
    const targetStr = String(pinTargetStudent.id);
    const gId = String(currentGroup.id);

    // Persist PIN
    if (onSetStudentPin) {
      onSetStudentPin(pinTargetStudent.id, cleanPin, pinTargetStudent.name);
    } else if (onClaimStudentDevice) {
      onClaimStudentDevice(pinTargetStudent.id, cleanPin, pinTargetStudent.name);
    }

    try {
      localStorage.setItem(`rsa_pinned_student_${gId}`, targetStr);
      if (pinTargetStudent.name) {
        localStorage.setItem('rsa_pinned_student_name', pinTargetStudent.name.trim());
      }
      localStorage.setItem('rsa_pinned_student_id', targetStr);
    } catch {}

    setPinnedOverrides((prev) => ({ ...prev, [gId]: targetStr }));
    setIsChangingProfile(false);
    setProfileSheetView('list');
    setPinTargetStudent(null);
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
    triggerHaptic('medium');
    if (showToast) {
      showToast(`Xush kelibsiz, ${pinTargetStudent.name}! Profilingiz PIN bilan himoyalandi.`, 'success');
    }
  };

  // Verify existing PIN entry
  const handleVerifyPinEntry = (e) => {
    if (e) e.preventDefault();
    const cleanPin = (pinInput || '').trim();

    if (!pinTargetStudent || !currentGroup?.id) return;

    if (cleanPin.length !== 4) {
      setPinError("4 xonali PIN-kodni kiriting!");
      triggerHaptic('heavy');
      return;
    }

    if (String(pinTargetStudent.pin).trim() !== cleanPin) {
      setPinError("Noto'g'ri PIN-kod! Qayta urinib ko'ring.");
      triggerHaptic('heavy');
      return;
    }

    // PIN matched!
    const targetStr = String(pinTargetStudent.id);
    const gId = String(currentGroup.id);
    try {
      localStorage.setItem(`rsa_pinned_student_${gId}`, targetStr);
      if (pinTargetStudent.name) {
        localStorage.setItem('rsa_pinned_student_name', pinTargetStudent.name.trim());
      }
      localStorage.setItem('rsa_pinned_student_id', targetStr);
    } catch {}

    setPinnedOverrides((prev) => ({ ...prev, [gId]: targetStr }));
    setIsChangingProfile(false);
    setProfileSheetView('list');
    setPinTargetStudent(null);
    setPinInput('');
    setPinError('');
    triggerHaptic('medium');
    if (showToast) {
      showToast(`Xush kelibsiz, ${pinTargetStudent.name}!`, 'success');
    }
  };

  const handleClearProfilePin = () => {
    if (!currentGroup?.id) return;
    const gId = String(currentGroup.id);
    try {
      localStorage.removeItem(`rsa_pinned_student_${gId}`);
      localStorage.removeItem('rsa_pinned_student_id');
    } catch {}
    setPinnedOverrides((prev) => ({ ...prev, [gId]: null }));
    setIsChangingProfile(false);
    setProfileSheetView('list');
    setProfileSearchQuery('');
    if (showToast) {
      showToast("Profil tanlovi bekor qilindi.", 'info');
    }
  };

  // Filter students for profile search in modal
  const filteredModalStudents = useMemo(() => {
    const q = profileSearchQuery.trim().toLowerCase();
    if (!q) return groupStudents;
    return groupStudents.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [groupStudents, profileSearchQuery]);



  return (
    <div className="student-portal-container">
      {/* Sleek Minimalist Top Navigation Header */}
      <header className="student-navbar">
        {/* Left: Active Group Chip */}
        <button
          type="button"
          className="navbar-group-pill"
          onClick={() => setIsGroupModalOpen(true)}
          title={connectedGroupsList.length > 1 ? "Guruhni almashtirish yoki yangi guruh ulash" : "Guruh ma'lumotlari"}
          aria-label="Guruhlar menyusi"
        >
          <div className="navbar-group-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="navbar-group-text">
            <span className="navbar-group-name">{currentGroup?.name || "Guruh"}</span>
            <span className="navbar-group-hint">
              {connectedGroupsList.length > 1 ? `${connectedGroupsList.length} ta guruh ▾` : "Guruhim ▾"}
            </span>
          </div>
        </button>

        {/* Center: Desktop-only Navigation Tabs (Hidden on Mobile) */}
        <div className="navbar-desktop-nav">
          <nav className="desktop-segmented-control" aria-label="Student sahifalari">
            <button
              type="button"
              className={`desktop-nav-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              Asosiy
            </button>
            <button
              type="button"
              className={`desktop-nav-btn ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => setActiveTab('rating')}
            >
              Reyting
            </button>
            <button
              type="button"
              className={`desktop-nav-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => setActiveTab('shop')}
            >
              Do'kon
            </button>
          </nav>
        </div>

        {/* Right: Profile Chip & Controls */}
        <div className="navbar-actions-row">
          <button
            type="button"
            className={`navbar-profile-pill ${pinnedStudent ? 'has-profile' : 'no-profile'}`}
            onClick={() => {
              setProfileSheetView('list');
              setIsChangingProfile(true);
            }}
            title="Profilingizni tanlang yoki almashtiring"
            aria-label="Student profili"
          >
            <div className="navbar-avatar">
              {pinnedStudent ? (
                renderAvatar(pinnedStudent.emoji, 26)
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="navbar-profile-text">
              <span className="navbar-student-name">
                {pinnedStudent ? pinnedStudent.name.split(' ')[0] : "Profil tanlash"}
              </span>
              <span className="navbar-student-sub">
                {pinnedStudent ? "Profilim ▾" : "Belgilang ▾"}
              </span>
            </div>
          </button>

          {toggleTheme && (
            <button
              type="button"
              className="navbar-icon-btn theme-toggle"
              onClick={toggleTheme}
              title="Mavzuni o'zgartirish"
              aria-label="Mavzu"
            >
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              className="navbar-icon-btn logout-btn"
              onClick={onLogout}
              title="Tizimdan chiqish"
              aria-label="Chiqish"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Multi-Group Quick Switcher Strip (if connected to >1 groups) */}
      {connectedGroupsList.length > 1 && (
        <div className="connected-groups-strip">
          <div className="connected-groups-scroll">
            {connectedGroupsList.map((grp) => {
              const isCurrent = String(grp.id) === String(currentGroup?.id);
              return (
                <button
                  key={grp.id}
                  type="button"
                  className={`group-chip-pill ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    if (!isCurrent && onSwitchGroup) {
                      triggerHaptic('light');
                      onSwitchGroup(grp.id);
                    }
                  }}
                  aria-pressed={isCurrent}
                >
                  <span>{grp.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="group-chip-pill add-new"
              onClick={() => {
                setIsGroupModalOpen(true);
                setIsAddingGroup(true);
                setGroupAddError('');
              }}
              title="Yangi guruh ulash"
            >
              + Guruh ulash
            </button>
          </div>
        </div>
      )}

      {/* Tab Content Container */}
      <main className="student-content-view">
        {/* Main Tab: Asosiy */}
        {activeTab === 'main' && (
          <div className="tab-pane-main animate-fadeIn">
            {/* Active Group Schedule Card */}
            <StudentScheduleCard group={currentGroup} />

            {/* Monthly Attendance Calendar */}
            <StudentAttendanceCalendar
              attendance={groupAttendance}
              group={currentGroup}
              pinnedStudent={pinnedStudent}
              onOpenProfilePicker={() => setIsChangingProfile(true)}
            />
          </div>
        )}

        {/* Rating Tab: Reyting */}
        {activeTab === 'rating' && (
          <div className="tab-pane-rating animate-fadeIn">
            <StudentRatingView
              key={currentGroup?.id || 'rating'}
              students={groupStudents}
              transactions={groupTransactions}
              pinnedStudentId={pinnedStudentId}
              pinnedStudent={pinnedStudent}
              group={currentGroup}
              connectedGroups={connectedGroupsList}
              onSwitchGroup={onSwitchGroup}
              initialTimeframe={ratingInitialTimeframe}
            />
          </div>
        )}

        {/* Shop Tab: Do'kon */}
        {activeTab === 'shop' && (
          <div className="tab-pane-shop animate-fadeIn">
            <StudentShopComingSoon
              pinnedStudent={pinnedStudent}
              transactions={groupTransactions}
              showToast={showToast}
              onOpenProfilePicker={() => {
                triggerHaptic('light');
                setIsChangingProfile(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Modern Mobile Bottom Navigation Dock (Portal to document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <nav className="student-mobile-dock" aria-label="Mobil navigatsiya">
          <div className="mobile-dock-inner">
            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => handleTabSelect('main')}
              aria-label="Asosiy sahifa"
            >
              <div className="dock-icon-wrap">
                {activeTab === 'main' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
              </div>
              <span className="dock-tab-label">Asosiy</span>
            </button>

            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => handleTabSelect('rating')}
              aria-label="Reyting sahifasi"
            >
              <div className="dock-icon-wrap">
                {activeTab === 'rating' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                )}
              </div>
              <span className="dock-tab-label">Reyting</span>
            </button>

            <button
              type="button"
              className={`dock-tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => handleTabSelect('shop')}
              aria-label="Do'kon sahifasi"
            >
              <div className="dock-icon-wrap">
                {activeTab === 'shop' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
                    <circle cx="12" cy="14" r="2" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                )}
              </div>
              <span className="dock-tab-label">Do'kon</span>
            </button>
          </div>
        </nav>,
        document.body
      )}

      {/* Group Switcher Bottom Sheet Modal */}
      {isGroupModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setIsGroupModalOpen(false)}>
          <div
            className="sheet-container animate-slideUpSheet"
            style={{
              transform: groupSheetDragY > 0 ? `translateY(${groupSheetDragY}px)` : undefined,
              transition: isGroupDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Guruhlarim"
          >
            {/* Pull indicator bar */}
            <div
              className="sheet-drag-zone"
              onTouchStart={handleGroupTouchStart}
              onTouchMove={handleGroupTouchMove}
              onTouchEnd={handleGroupTouchEnd}
            >
              <div className="sheet-drag-handle" />
            </div>

            <div
              className="sheet-header"
              onTouchStart={handleGroupTouchStart}
              onTouchMove={handleGroupTouchMove}
              onTouchEnd={handleGroupTouchEnd}
            >
              <div className="sheet-title-wrap">
                <h3 className="sheet-title">Guruhlarim</h3>
                <p className="sheet-sub">
                  {connectedGroupsList.length > 1
                    ? "Barcha ulangan kurs va guruhlaringiz"
                    : "Boshqa kurs yoki guruhlaringizni ulang"}
                </p>
              </div>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsGroupModalOpen(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="sheet-body">
              {/* Groups List */}
              <div className="sheet-groups-list">
                {sortedConnectedGroups.map((grp) => {
                  const isCurrent = String(grp.id) === String(currentGroup?.id);
                  const isConfirmingRemove = confirmRemoveId === grp.id;

                  return (
                    <div
                      key={grp.id}
                      className={`sheet-group-card ${isCurrent ? 'is-active' : ''}`}
                    >
                      <div
                        className="sheet-group-main"
                        onClick={() => {
                          if (!isCurrent && onSwitchGroup) {
                            onSwitchGroup(grp.id);
                          }
                          setIsGroupModalOpen(false);
                        }}
                      >
                        <div className="sheet-group-header-row">
                          <span className="sheet-group-name">{grp.name}</span>
                          {isCurrent && (
                            <span className="sheet-active-tag">Faol</span>
                          )}
                        </div>
                        {grp.schedule?.time && (
                          <div className="sheet-group-meta">
                            <span>{grp.schedule.time}</span>
                            {grp.room && <span> • {grp.room}</span>}
                          </div>
                        )}
                      </div>

                      <div className="sheet-group-actions">
                        {!isCurrent && (
                          <button
                            type="button"
                            className="sheet-switch-btn"
                            onClick={() => {
                              if (onSwitchGroup) onSwitchGroup(grp.id);
                              setIsGroupModalOpen(false);
                            }}
                          >
                            Tanlash
                          </button>
                        )}
                        {connectedGroupsList.length > 1 && (
                          isConfirmingRemove ? (
                            <div className="sheet-remove-confirm">
                              <span className="remove-confirm-txt">O'chirish?</span>
                              <button
                                type="button"
                                className="remove-btn-yes"
                                onClick={() => handleRemoveGroup(grp.id, grp.name)}
                              >
                                Ha
                              </button>
                              <button
                                type="button"
                                className="remove-btn-no"
                                onClick={() => setConfirmRemoveId(null)}
                              >
                                Yo'q
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="sheet-delete-btn"
                              title="Guruhni ajratish"
                              onClick={() => setConfirmRemoveId(grp.id)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Group Section */}
              {isAddingGroup ? (
                <form className="sheet-add-group-box" onSubmit={handleAddNewGroup}>
                  <div className="add-box-header">
                    <span className="add-box-title">Guruh paroli</span>
                    <span className="add-box-hint">Ustoz bergan kod</span>
                  </div>
                  <input
                    id="modal-new-group-password"
                    type="text"
                    className="add-box-input"
                    placeholder="Masalan: rus2026"
                    value={newGroupPassword}
                    onChange={(e) => {
                      setNewGroupPassword(e.target.value);
                      setGroupAddError('');
                    }}
                    autoFocus
                    disabled={isSubmittingGroup}
                    autoComplete="off"
                    autoCapitalize="none"
                  />
                  {groupAddError && (
                    <div className="add-box-error">
                      <span>⚠️ {groupAddError}</span>
                    </div>
                  )}
                  <div className="add-box-actions">
                    <button
                      type="button"
                      className="add-box-cancel-btn"
                      onClick={() => {
                        setIsAddingGroup(false);
                        setGroupAddError('');
                      }}
                      disabled={isSubmittingGroup}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="add-box-submit-btn"
                      disabled={isSubmittingGroup || !newGroupPassword.trim()}
                    >
                      {isSubmittingGroup ? "Ulanmoqda..." : "Ulash"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="sheet-add-trigger-btn"
                  onClick={() => {
                    setIsAddingGroup(true);
                    setGroupAddError('');
                  }}
                >
                  <span className="trigger-plus">+</span>
                  <span>Boshqa guruhni ulash (parol orqali)</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Student Profile & Avatar Bottom Sheet Modal */}
      {isChangingProfile && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => { setIsChangingProfile(false); setProfileSheetView('list'); }}>
          <div
            className="sheet-container animate-slideUpSheet"
            style={{
              transform: profileSheetDragY > 0 ? `translateY(${profileSheetDragY}px)` : undefined,
              transition: isProfileDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={profileSheetView === 'avatar' ? "Profil rasmini tanlash" : "Profilingizni tanlang"}
          >
            {/* Pull indicator bar */}
            <div
              className="sheet-drag-zone"
              onTouchStart={handleProfileTouchStart}
              onTouchMove={handleProfileTouchMove}
              onTouchEnd={handleProfileTouchEnd}
            >
              <div className="sheet-drag-handle" />
            </div>

            {profileSheetView === 'avatar' ? (
              <>
                <div
                  className="sheet-header"
                  onTouchStart={handleProfileTouchStart}
                  onTouchMove={handleProfileTouchMove}
                  onTouchEnd={handleProfileTouchEnd}
                >
                  <button
                    type="button"
                    className="sheet-back-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setProfileSheetView('list');
                    }}
                    aria-label="Ortga"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span>Ortga</span>
                  </button>

                  <div className="sheet-title-wrap sheet-title-center">
                    <h3 className="sheet-title">Rasm tanlash</h3>
                    <p className="sheet-sub">
                      {pinnedStudent ? `${pinnedStudent.name} uchun yangi rasm` : "Rasmni tanlang"}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="sheet-close-btn"
                    onClick={() => {
                      setIsChangingProfile(false);
                      setProfileSheetView('list');
                    }}
                    aria-label="Yopish"
                  >
                    ✕
                  </button>
                </div>

                {/* Segmented Tab Switch */}
                <div className="avatar-picker-tabs-row">
                  <button
                    type="button"
                    className={`avatar-tab-btn ${avatarTab === 'gallery' ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setAvatarTab('gallery');
                    }}
                  >
                    <span className="tab-icon">📸</span>
                    <span>Suratlar ({AVATAR_GALLERY_IMAGES.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`avatar-tab-btn ${avatarTab === 'avatars' ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setAvatarTab('avatars');
                    }}
                  >
                    <span className="tab-icon">🦄</span>
                    <span>Avatarlar ({STUDENT_AVATARS.length})</span>
                  </button>
                </div>

                {/* Avatars Grid Body */}
                <div className="sheet-body avatar-picker-body">
                  {avatarTab === 'gallery' ? (
                    <div className="avatar-grid-gallery">
                      {AVATAR_GALLERY_IMAGES.map((img) => {
                        const isSelected = pinnedStudent && (
                          pinnedStudent.emoji === img.path ||
                          pinnedStudent.emoji === img.id ||
                          pinnedStudent.emoji === img.legacyPath ||
                          pinnedStudent.emoji === img.name
                        );

                        return (
                          <button
                            key={img.id}
                            type="button"
                            className={`avatar-grid-item gallery-item ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => {
                              triggerHaptic('medium');
                              if (pinnedStudent && onUpdateAvatar) {
                                onUpdateAvatar(img.path, pinnedStudent.id, pinnedStudent.name);
                              }
                              showToast?.("Profilingiz rasmi muvaffaqiyatli saqlandi!", "success");
                            }}
                            title={img.label || 'Surat'}
                            aria-label={img.label || 'Surat'}
                          >
                            <img
                              src={img.path}
                              alt={img.label || 'avatar'}
                              loading="lazy"
                              decoding="async"
                              className="avatar-grid-img"
                            />
                            {isSelected && (
                              <div className="avatar-selected-check">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="avatar-grid-svg">
                      {STUDENT_AVATARS.map((item) => {
                        const isSelected = pinnedStudent && (
                          pinnedStudent.emoji === item.id ||
                          pinnedStudent.emoji === item.label
                        );

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`avatar-grid-item svg-item ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => {
                              triggerHaptic('medium');
                              if (pinnedStudent && onUpdateAvatar) {
                                onUpdateAvatar(item.id, pinnedStudent.id, pinnedStudent.name);
                              }
                              showToast?.("Profilingiz avatarisi muvaffaqiyatli saqlandi!", "success");
                            }}
                            title={item.label}
                            aria-label={item.label}
                          >
                            <div className="avatar-svg-wrap">
                              {item.svg(42)}
                            </div>
                            <span className="avatar-item-label">{item.label}</span>
                            {isSelected && (
                              <div className="avatar-selected-check">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="avatar-done-wrap">
                    <button
                      type="button"
                      className="avatar-done-btn"
                      onClick={() => {
                        triggerHaptic('light');
                        setProfileSheetView('list');
                      }}
                    >
                      Saqlash va qaytish
                    </button>
                  </div>
                </div>
              </>
            ) : profileSheetView === 'pin_setup' ? (
              <>
                <div
                  className="sheet-header"
                  onTouchStart={handleProfileTouchStart}
                  onTouchMove={handleProfileTouchMove}
                  onTouchEnd={handleProfileTouchEnd}
                >
                  <button
                    type="button"
                    className="sheet-back-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setProfileSheetView('list');
                      setPinError('');
                      setPinInput('');
                      setConfirmPinInput('');
                    }}
                    aria-label="Ortga"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span>Ortga</span>
                  </button>

                  <div className="sheet-title-wrap sheet-title-center">
                    <h3 className="sheet-title">PIN-kod o'rnatish</h3>
                    <p className="sheet-sub">
                      {pinTargetStudent?.name} profili
                    </p>
                  </div>

                  <button
                    type="button"
                    className="sheet-close-btn"
                    onClick={() => {
                      setIsChangingProfile(false);
                      setProfileSheetView('list');
                      setPinError('');
                      setPinInput('');
                      setConfirmPinInput('');
                    }}
                    aria-label="Yopish"
                  >
                    ✕
                  </button>
                </div>

                <div className="sheet-body pin-sheet-body">
                  <div className="pin-notice-card">
                    <div className="pin-notice-icon">🛡️</div>
                    <div className="pin-notice-content">
                      <h4 className="pin-notice-title">Siz haqiqatdan ham "{pinTargetStudent?.name}"misiz?</h4>
                      <p className="pin-notice-desc">
                        Profilingizni faqat o'zingiz boshqarishingiz va boshqalar kira olmasligi uchun 4 xonali shaxsiy PIN-kod o'rnating.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePinSetup} className="pin-form">
                    <div className="pin-input-group">
                      <label className="pin-label">4 xonali yangi PIN-kod:</label>
                      <input
                        type="password"
                        className="pin-numeric-input"
                        placeholder="••••"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="pin-input-group">
                      <label className="pin-label">PIN-kodni tasdiqlang:</label>
                      <input
                        type="password"
                        className="pin-numeric-input"
                        placeholder="••••"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        autoComplete="new-password"
                      />
                    </div>

                    {pinError && (
                      <div className="pin-error-banner animate-shake">
                        <span>⚠️ {pinError}</span>
                      </div>
                    )}

                    <div className="pin-form-actions">
                      <button
                        type="submit"
                        className="pin-primary-btn"
                        disabled={pinInput.length !== 4 || confirmPinInput.length !== 4}
                      >
                        PIN-kodni saqlash va kirish
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : profileSheetView === 'pin_entry' ? (
              <>
                <div
                  className="sheet-header"
                  onTouchStart={handleProfileTouchStart}
                  onTouchMove={handleProfileTouchMove}
                  onTouchEnd={handleProfileTouchEnd}
                >
                  <button
                    type="button"
                    className="sheet-back-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setProfileSheetView('list');
                      setPinError('');
                      setPinInput('');
                    }}
                    aria-label="Ortga"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span>Ortga</span>
                  </button>

                  <div className="sheet-title-wrap sheet-title-center">
                    <h3 className="sheet-title">PIN-kodni kiriting</h3>
                    <p className="sheet-sub">
                      {pinTargetStudent?.name} profili
                    </p>
                  </div>

                  <button
                    type="button"
                    className="sheet-close-btn"
                    onClick={() => {
                      setIsChangingProfile(false);
                      setProfileSheetView('list');
                      setPinError('');
                      setPinInput('');
                    }}
                    aria-label="Yopish"
                  >
                    ✕
                  </button>
                </div>

                <div className="sheet-body pin-sheet-body">
                  <div className="pin-profile-preview">
                    <div className="pin-preview-avatar">
                      {pinTargetStudent?.emoji ? renderAvatar(pinTargetStudent.emoji, 48) : (
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--apple-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
                          {pinTargetStudent?.name ? pinTargetStudent.name.charAt(0).toUpperCase() : 'O'}
                        </div>
                      )}
                    </div>
                    <h4 className="pin-preview-name">{pinTargetStudent?.name}</h4>
                    <p className="pin-preview-hint">Ushbu profil 4 xonali PIN bilan himoyalangan</p>
                  </div>

                  <form onSubmit={handleVerifyPinEntry} className="pin-form">
                    <div className="pin-input-group">
                      <label className="pin-label">4 xonali PIN-kod:</label>
                      <input
                        type="password"
                        className="pin-numeric-input"
                        placeholder="••••"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        autoComplete="current-password"
                      />
                    </div>

                    {pinError && (
                      <div className="pin-error-banner animate-shake">
                        <span>⚠️ {pinError}</span>
                      </div>
                    )}

                    <div className="pin-form-actions">
                      <button
                        type="submit"
                        className="pin-primary-btn"
                        disabled={pinInput.length !== 4}
                      >
                        Profilga kirish
                      </button>
                    </div>

                    <div className="pin-forgot-wrap">
                      <button
                        type="button"
                        className="pin-forgot-link"
                        onClick={() => setShowForgotPinNotice(!showForgotPinNotice)}
                      >
                        PIN-kodni unutdingizmi?
                      </button>
                      {showForgotPinNotice && (
                        <div className="pin-forgot-box animate-fadeIn">
                          <span>💡 <strong>Ustozingizga ayting:</strong> O'qituvchi o'z panelidan 1 bosish bilan PIN-kodingizni bekor qilib beradi va siz yangi PIN o'rnatib kirasiz.</span>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <>
                <div
                  className="sheet-header"
                  onTouchStart={handleProfileTouchStart}
                  onTouchMove={handleProfileTouchMove}
                  onTouchEnd={handleProfileTouchEnd}
                >
                  <div className="sheet-title-wrap">
                    <h3 className="sheet-title">Profilingizni tanlang</h3>
                    <p className="sheet-sub">
                      {currentGroup?.name ? `${currentGroup.name} guruhi o'quvchilari` : "Ismingizni tanlang"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="sheet-close-btn"
                    onClick={() => {
                      setIsChangingProfile(false);
                      setProfileSheetView('list');
                    }}
                    aria-label="Yopish"
                  >
                    ✕
                  </button>
                </div>

                <div className="sheet-body">
                  {/* Active Profile Card with Avatar & Change Button */}
                  {pinnedStudent && (
                    <div className="active-profile-card">
                      <div className="active-profile-left">
                        <div className="active-profile-avatar-wrap">
                          <div className="active-profile-avatar">
                            {renderAvatar(pinnedStudent.emoji, 46)}
                          </div>
                          <button
                            type="button"
                            className="avatar-change-badge-btn"
                            onClick={() => {
                              triggerHaptic('light');
                              setProfileSheetView('avatar');
                            }}
                            title="Rasmni almashtirish"
                            aria-label="Rasmni almashtirish"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                              <circle cx="12" cy="13" r="4"/>
                            </svg>
                          </button>
                        </div>
                        <div className="active-profile-info">
                          <div className="picker-name-row">
                            <span className="active-profile-badge">Faol profilingiz</span>
                            <span className="picker-pin-badge">
                              {pinnedStudent.pin ? "🔒 PIN faol" : "🔓 PIN belgilanmagan"}
                            </span>
                          </div>
                          <span className="active-profile-name">{pinnedStudent.name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="choose-avatar-action-btn"
                        onClick={() => {
                          triggerHaptic('light');
                          setProfileSheetView('avatar');
                        }}
                      >
                        <span>Rasm tanlash</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Quick Search Input */}
                  {groupStudents.length > 5 && (
                    <div className="sheet-search-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="sheet-search-input"
                        placeholder="Ismingizni qidiring..."
                        value={profileSearchQuery}
                        onChange={(e) => setProfileSearchQuery(e.target.value)}
                      />
                      {profileSearchQuery && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={() => setProfileSearchQuery('')}
                          aria-label="Tozalash"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}

                  {/* Students Picker List */}
                  <div className="sheet-students-list">
                    {filteredModalStudents.length > 0 ? (
                      filteredModalStudents.map((st) => {
                        const isCurrent = String(st.id) === String(pinnedStudentId);
                        const hasPin = Boolean(st.pin);

                        return (
                          <div
                            key={st.id}
                            className={`student-picker-row ${isCurrent ? 'is-selected' : ''}`}
                            onClick={() => handleSelectStudentForPin(st)}
                          >
                            <div className="picker-avatar-circle">
                              {st.emoji ? renderAvatar(st.emoji, 32) : (st.name ? st.name.charAt(0).toUpperCase() : 'O')}
                            </div>

                            <div className="picker-info-col">
                              <div className="picker-name-row">
                                <span className="picker-name">{st.name}</span>
                                {hasPin ? (
                                  <span className="picker-has-pin-badge" title="4 xonali PIN bilan himoyalangan">
                                    🔒 Himoyalangan
                                  </span>
                                ) : (
                                  <span className="picker-no-pin-badge" title="PIN hali o'rnatilmagan">
                                    🔓 Yangi profil
                                  </span>
                                )}
                              </div>
                              {isCurrent && (
                                <span className="picker-active-badge">Tanlangan profil</span>
                              )}
                            </div>

                            {isCurrent ? (
                              <span className="picker-check">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            ) : (
                              <span className="picker-arrow">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="sheet-empty-notice">
                        {profileSearchQuery ? "Bunday ismli o'quvchi topilmadi" : "Guruhda o'quvchilar ro'yxati mavjud emas"}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {pinnedStudent && (
                    <div className="sheet-footer">
                      <button
                        type="button"
                        className="sheet-clear-pin-btn"
                        onClick={() => handleClearProfilePin()}
                      >
                        Profil tanlovini bekor qilish
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* PIN Code Sheet Styles */
        .pin-sheet-body {
          padding: 16px 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pin-notice-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(0, 113, 227, 0.06);
          border: 1px solid rgba(0, 113, 227, 0.15);
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .pin-notice-icon {
          font-size: 24px;
          flex-shrink: 0;
          line-height: 1;
        }

        .pin-notice-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .pin-notice-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .pin-profile-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          text-align: center;
        }

        .pin-preview-avatar {
          margin-bottom: 8px;
        }

        .pin-preview-name {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .pin-preview-hint {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .pin-form {
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pin-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pin-label {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .pin-numeric-input {
          width: 100%;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 12px;
          text-align: center;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: 14px;
          color: var(--text-primary);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .pin-numeric-input:focus {
          border-color: var(--apple-blue, #0071E3);
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
        }

        .pin-error-banner {
          background: rgba(255, 59, 48, 0.08);
          border: 1px solid rgba(255, 59, 48, 0.2);
          color: #FF3B30;
          font-size: 0.82rem;
          padding: 8px 12px;
          border-radius: 10px;
          text-align: center;
        }

        .pin-form-actions {
          margin-top: 4px;
        }

        .pin-primary-btn {
          width: 100%;
          padding: 13px 18px;
          border-radius: 14px;
          background: var(--apple-blue, #0071E3);
          color: #FFFFFF;
          font-size: 0.92rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s, background-color 0.15s;
        }

        .pin-primary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .pin-primary-btn:not(:disabled):active {
          transform: scale(0.98);
        }

        .pin-forgot-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
        }

        .pin-forgot-link {
          background: none;
          border: none;
          color: var(--apple-blue, #0071E3);
          font-size: 0.82rem;
          cursor: pointer;
          text-decoration: underline;
          padding: 4px 8px;
        }

        .pin-forgot-box {
          margin-top: 10px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.4;
          text-align: left;
        }

        .picker-has-pin-badge {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 2px 7px;
          border-radius: 8px;
          background: rgba(52, 199, 89, 0.12);
          color: #248A3D;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .picker-no-pin-badge {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 2px 7px;
          border-radius: 8px;
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue, #0071E3);
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .picker-pin-badge {
          font-size: 0.72rem;
          color: var(--text-tertiary, #8E8E93);
          font-weight: 500;
        }

        .student-portal-container {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          padding: 4px 0 24px;
          box-sizing: border-box;
        }

        /* Sleek Top Navbar */
        .student-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 18px);
          padding: 8px 14px;
          margin-bottom: 12px;
          box-shadow: var(--shadow-sm);
          gap: 8px;
          position: sticky;
          top: max(env(safe-area-inset-top, 0px), 6px);
          z-index: 50;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        /* Group Pill */
        .navbar-group-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 5px 12px 5px 6px;
          transition: all var(--transition-fast);
          user-select: none;
          min-width: 0;
          touch-action: manipulation;
        }

        .navbar-group-pill:hover {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
        }

        .navbar-group-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .navbar-group-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          min-width: 0;
        }

        .navbar-group-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .navbar-group-hint {
          font-size: 0.68rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        /* Desktop Nav */
        .navbar-desktop-nav {
          display: none;
        }

        @media (min-width: 681px) {
          .navbar-desktop-nav {
            display: flex;
            align-items: center;
          }
        }

        .desktop-segmented-control {
          display: inline-flex;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 3px;
          gap: 3px;
        }

        .desktop-nav-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.84rem;
          font-weight: 600;
          padding: 6px 18px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .desktop-nav-btn.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 113, 227, 0.3);
        }

        /* Right Actions */
        .navbar-actions-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .navbar-profile-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 4px 10px 4px 5px;
          transition: all var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
          min-width: 0;
        }

        .navbar-profile-pill:hover {
          border-color: var(--apple-blue);
        }

        .navbar-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
          background: #34C759;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.78rem;
          flex-shrink: 0;
        }

        .navbar-profile-pill.no-profile .navbar-avatar {
          background: var(--text-tertiary);
        }

        .navbar-profile-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          min-width: 0;
        }

        .navbar-student-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }

        .navbar-student-sub {
          font-size: 0.66rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .navbar-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          padding: 0;
          flex-shrink: 0;
          touch-action: manipulation;
        }

        .navbar-icon-btn:hover {
          border-color: var(--apple-blue);
          color: var(--apple-blue);
        }

        .navbar-icon-btn.logout-btn {
          color: #FF3B30;
          border-color: rgba(255, 59, 48, 0.2);
          background: rgba(255, 59, 48, 0.06);
        }

        .navbar-icon-btn.logout-btn:hover {
          background: rgba(255, 59, 48, 0.14);
        }

        /* Connected Groups Strip */
        .connected-groups-strip {
          margin-bottom: 12px;
        }

        .connected-groups-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 2px 4px;
        }

        .connected-groups-scroll::-webkit-scrollbar {
          display: none;
        }

        .group-chip-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          touch-action: manipulation;
        }

        .group-chip-pill:hover {
          color: var(--text-primary);
          border-color: var(--apple-blue);
        }

        .group-chip-pill.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
          box-shadow: 0 2px 8px rgba(0, 113, 227, 0.25);
        }

        .group-chip-pill.add-new {
          border-style: dashed;
          background: transparent;
          color: var(--apple-blue);
        }

        /* Content Area */
        .student-content-view {
          width: 100%;
        }

        .animate-fadeIn {
          animation: tabFadeIn 0.18s ease-out;
        }

        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Bottom Dock (Hidden on Desktop) */
        .student-mobile-dock {
          display: none;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 680px) {
          .student-portal-container {
            padding-top: 0;
            padding-bottom: 8px !important;
          }

          .student-navbar {
            padding: 6px 10px;
            margin-bottom: 8px;
            border-radius: var(--radius-lg, 14px);
          }

          .navbar-group-name {
            max-width: 85px;
          }

          .navbar-student-name {
            max-width: 75px;
          }



          /* Fixed Native-App Mobile Dock */
          .student-mobile-dock {
            display: block !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: calc(58px + env(safe-area-inset-bottom, 0px)) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            background: rgba(255, 255, 255, 0.88) !important;
            backdrop-filter: blur(20px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
            border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
            box-shadow: 0 -2px 14px rgba(0, 0, 0, 0.04) !important;
            z-index: 99999 !important;
            user-select: none !important;
            touch-action: manipulation !important;
          }

          .mobile-dock-inner {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 58px;
            max-width: 480px;
            margin: 0 auto;
            padding: 0 8px;
          }

          .dock-tab-btn {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            background: transparent;
            border: none;
            color: #8E8E93;
            cursor: pointer;
            transition: color 0.15s ease, transform 0.1s ease;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .dock-icon-wrap {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .dock-tab-label {
            font-size: 0.68rem;
            font-weight: 500;
            line-height: 1;
            letter-spacing: -0.01em;
          }

          .dock-tab-btn.active {
            color: var(--apple-blue);
          }

          .dock-tab-btn.active .dock-tab-label {
            font-weight: 700;
            color: var(--apple-blue);
          }

          .dock-tab-btn.active .dock-icon-wrap {
            transform: scale(1.08);
          }

          .dock-tab-btn:active {
            transform: scale(0.92);
          }
        }

        @media (max-width: 380px) {
          .navbar-group-name {
            max-width: 65px;
          }
          .navbar-student-name {
            max-width: 58px;
          }
        }

        /* Bottom Sheet Modals */
        .sheet-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100000;
          padding: 0;
          overscroll-behavior: contain;
        }

        .sheet-container {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-width: 540px;
          max-height: 85vh;
          box-shadow: 0 -8px 36px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: sheetSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1);
          overscroll-behavior: contain;
        }

        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .sheet-drag-zone {
          padding: 10px 0 4px;
          width: 100%;
          display: flex;
          justify-content: center;
          cursor: grab;
          touch-action: none;
          flex-shrink: 0;
        }

        .sheet-drag-handle {
          width: 38px;
          height: 4px;
          border-radius: 2px;
          background: rgba(0, 0, 0, 0.18);
          margin: 0 auto;
          flex-shrink: 0;
        }

        .sheet-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px 18px 10px;
          border-bottom: 1px solid var(--border-color);
        }

        .sheet-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sheet-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .sheet-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .sheet-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sheet-body {
          padding: 14px 18px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 70vh;
        }

        /* Sheet Search Input */
        .sheet-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
          padding: 8px 12px;
        }

        .search-icon {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        .sheet-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 16px;
          color: var(--text-primary);
          outline: none;
        }

        .search-clear-btn {
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.8rem;
        }

        /* Group Card in Sheet */
        .sheet-groups-list,
        .sheet-students-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sheet-group-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
          padding: 12px 14px;
          gap: 10px;
        }

        .sheet-group-card.is-active {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
        }

        .sheet-group-main {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .sheet-group-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .sheet-group-name {
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sheet-active-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #FFFFFF;
          background: #34C759;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .sheet-group-meta {
          font-size: 0.76rem;
          color: var(--text-tertiary);
        }

        .sheet-group-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .sheet-switch-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 5px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--apple-blue);
          cursor: pointer;
        }

        .sheet-delete-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 6px;
        }

        .sheet-remove-confirm {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .remove-confirm-txt {
          font-size: 0.72rem;
          color: #FF3B30;
          font-weight: 700;
        }

        .remove-btn-yes {
          background: #FF3B30;
          color: #FFFFFF;
          border: none;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.74rem;
          cursor: pointer;
        }

        .remove-btn-no {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: none;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.74rem;
          cursor: pointer;
        }

        /* Add Group in Sheet */
        .sheet-add-trigger-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
          border: 1.5px dashed var(--apple-blue);
          border-radius: var(--radius-md, 12px);
          padding: 12px;
          color: var(--apple-blue);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .sheet-add-group-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
          padding: 12px;
        }

        .add-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .add-box-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .add-box-hint {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .add-box-input {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md, 8px);
          padding: 9px 12px;
          font-size: 16px;
          color: var(--text-primary);
          outline: none;
        }

        .add-box-input:focus {
          border-color: var(--apple-blue);
        }

        .add-box-error {
          font-size: 0.76rem;
          color: #FF3B30;
        }

        .add-box-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .add-box-cancel-btn {
          flex: 1;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .add-box-submit-btn {
          flex: 1;
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* Active Profile Showcase Card in Sheet */
        .active-profile-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08), rgba(var(--apple-blue-rgb, 0, 113, 227), 0.02));
          border: 1.5px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.22);
          border-radius: var(--radius-lg, 16px);
          padding: 12px 14px;
          margin-bottom: 12px;
        }

        .active-profile-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .active-profile-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .active-profile-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--apple-blue);
          box-shadow: 0 4px 12px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-change-badge-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: #FFFFFF;
          border: 2px solid var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast);
        }

        .avatar-change-badge-btn:hover {
          transform: scale(1.15);
        }

        .active-profile-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .active-profile-badge {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--apple-blue);
        }

        .active-profile-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .choose-avatar-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-full, 9999px);
          padding: 8px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.25);
          transition: all var(--transition-fast);
        }

        .choose-avatar-action-btn:active {
          transform: scale(0.96);
        }

        .sheet-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--apple-blue);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          margin-left: -6px;
          flex-shrink: 0;
          transition: opacity var(--transition-fast);
        }

        .sheet-back-btn:active {
          opacity: 0.65;
        }

        .sheet-title-center {
          flex: 1;
          text-align: center;
        }

        .avatar-done-wrap {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
          position: sticky;
          bottom: 0;
          background: var(--bg-card);
        }

        .avatar-done-btn {
          width: 100%;
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-md, 12px);
          padding: 11px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.28);
          transition: transform var(--transition-fast);
        }

        .avatar-done-btn:active {
          transform: scale(0.98);
        }

        /* Avatar Picker in Sheet */
        .avatar-picker-tabs-row {
          display: flex;
          gap: 8px;
          padding: 0 16px 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .avatar-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: var(--radius-full, 9999px);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .avatar-tab-btn .tab-icon {
          font-size: 1rem;
        }

        .avatar-tab-btn.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
          box-shadow: 0 2px 8px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
        }

        .avatar-picker-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          -webkit-overflow-scrolling: touch;
        }

        .avatar-grid-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
          gap: 12px;
          justify-items: center;
        }

        .avatar-grid-svg {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
          gap: 12px;
          justify-items: center;
        }

        .avatar-grid-item {
          position: relative;
          width: 62px;
          height: 62px;
          border-radius: 16px;
          border: 2.5px solid transparent;
          background: var(--bg-card);
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .avatar-grid-item:active {
          transform: scale(0.92);
        }

        .avatar-grid-item.is-selected {
          border-color: var(--apple-blue);
          box-shadow: 0 0 0 2px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.35), var(--shadow-md);
          transform: scale(1.05);
        }

        .avatar-grid-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .avatar-grid-item.svg-item {
          width: 76px;
          height: 82px;
          border-radius: 16px;
          padding: 6px 4px 4px;
          background: var(--bg-secondary);
        }

        .avatar-svg-wrap {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-item-label {
          font-size: 0.66rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          margin-top: 2px;
        }

        .avatar-selected-check {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        }

        /* Student Picker in Sheet */
        .student-picker-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
          padding: 10px 14px;
          cursor: pointer;
          transition: all var(--transition-fast);
          gap: 10px;
        }

        .student-picker-row:hover {
          border-color: var(--apple-blue);
        }

        .student-picker-row.is-selected {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
        }

        .picker-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--apple-blue);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.82rem;
          flex-shrink: 0;
        }

        .picker-info-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .picker-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .picker-active-badge {
          font-size: 0.68rem;
          font-weight: 600;
          color: #34C759;
        }

        .picker-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .student-picker-row.is-locked-other {
          opacity: 0.65;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.015);
        }

        .student-picker-row.is-locked-other:hover {
          border-color: rgba(255, 59, 48, 0.35);
          background: rgba(255, 59, 48, 0.04);
        }

        .picker-locked-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.66rem;
          font-weight: 600;
          color: #FF3B30;
          background: rgba(255, 59, 48, 0.1);
          padding: 2px 6px;
          border-radius: 6px;
          line-height: 1.2;
        }

        .picker-my-device-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.66rem;
          font-weight: 600;
          color: #34C759;
          background: rgba(52, 199, 89, 0.1);
          padding: 2px 6px;
          border-radius: 6px;
          line-height: 1.2;
        }

        .picker-lock-icon {
          color: #FF3B30;
          display: flex;
          align-items: center;
          opacity: 0.75;
        }

        .profile-locked-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #FF3B30;
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.2);
          border-radius: 20px;
          padding: 6px 12px;
        }

        .picker-check {
          color: var(--apple-blue);
        }

        .picker-arrow {
          color: var(--text-tertiary);
        }

        .sheet-empty-notice {
          text-align: center;
          padding: 24px;
          color: var(--text-secondary);
          font-size: 0.84rem;
        }

        .sheet-footer {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: center;
        }

        .sheet-clear-pin-btn {
          background: transparent;
          border: none;
          color: #FF3B30;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 14px;
        }

        /* Dark Mode */
        [data-theme="dark"] .student-navbar {
          background: rgba(41, 42, 45, 0.85);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .navbar-group-pill,
        [data-theme="dark"] .navbar-profile-pill,
        [data-theme="dark"] .navbar-icon-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
        }

        [data-theme="dark"] .group-chip-pill {
          background: var(--bg-card);
          border-color: var(--border-color);
        }


        [data-theme="dark"] .student-mobile-dock {
          background: rgba(26, 26, 30, 0.88) !important;
          border-top-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4) !important;
        }

        [data-theme="dark"] .sheet-drag-handle {
          background: rgba(255, 255, 255, 0.2);
        }

        [data-theme="dark"] .sheet-container {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .sheet-group-card,
        [data-theme="dark"] .student-picker-row {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .sheet-group-card.is-active {
          background: rgba(138, 180, 248, 0.12);
          border-color: #8AB4F8;
        }

        [data-theme="dark"] .student-picker-row.is-selected {
          background: rgba(138, 180, 248, 0.12);
          border-color: #8AB4F8;
        }

        [data-theme="dark"] .student-picker-row.is-locked-other {
          opacity: 0.55;
          background: rgba(255, 255, 255, 0.015);
        }

        [data-theme="dark"] .student-picker-row.is-locked-other:hover {
          border-color: rgba(255, 69, 58, 0.3);
          background: rgba(255, 69, 58, 0.06);
        }

        [data-theme="dark"] .picker-locked-badge {
          color: #FF453A;
          background: rgba(255, 69, 58, 0.15);
        }

        [data-theme="dark"] .picker-my-device-badge {
          color: #32D74B;
          background: rgba(50, 215, 75, 0.15);
        }

        [data-theme="dark"] .profile-locked-pill {
          color: #FF453A;
          background: rgba(255, 69, 58, 0.15);
          border-color: rgba(255, 69, 58, 0.3);
        }

        [data-theme="dark"] .sheet-search-wrap,
        [data-theme="dark"] .sheet-add-group-box {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .add-box-input {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          color: #F0F6FC;
        }

        [data-theme="dark"] .active-profile-card {
          background: linear-gradient(135deg, rgba(138, 180, 248, 0.12), rgba(255, 255, 255, 0.02));
          border-color: rgba(138, 180, 248, 0.28);
        }

        [data-theme="dark"] .avatar-change-badge-btn {
          border-color: var(--bg-card);
        }

        [data-theme="dark"] .avatar-tab-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
        }

        [data-theme="dark"] .avatar-tab-btn.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        [data-theme="dark"] .avatar-grid-item {
          background: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .avatar-grid-item.svg-item {
          background: rgba(255, 255, 255, 0.04);
        }

        [data-theme="dark"] .avatar-grid-item.is-selected {
          border-color: #8AB4F8;
          box-shadow: 0 0 0 2px rgba(138, 180, 248, 0.4), var(--shadow-md);
        }
      `}</style>
    </div>
  );
}
