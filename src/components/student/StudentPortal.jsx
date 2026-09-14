import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import StudentScheduleCard from './StudentScheduleCard';
import StudentAttendanceCalendar from './StudentAttendanceCalendar';
import StudentRatingView from './StudentRatingView';
import StudentShopComingSoon from './StudentShopComingSoon';

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

  useEffect(() => {
    localStorage.setItem('rsa_student_portal_tab', activeTab);
  }, [activeTab]);

  // Determine current student group (strictly from authorized connected groups or matched group)
  const currentGroup = useMemo(() => {
    if (studentGroupId) {
      const sId = String(studentGroupId);
      const found =
        (allConnectedGroups || []).find((g) => String(g.id) === sId) ||
        (groups || []).find((g) => String(g.id) === sId);
      if (found) return found;
    }
    return (allConnectedGroups && allConnectedGroups[0]) || (groups && groups.length > 0 && String(groups[0]?.id) === String(studentGroupId) ? groups[0] : null);
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

  // Sort connected groups so the active group is always first
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

  // Pinned Student Profile (strictly scoped to current group)
  const [pinnedStudentId, setPinnedStudentId] = useState(() => {
    if (!currentGroup?.id) return null;
    return localStorage.getItem(`rsa_pinned_student_${currentGroup.id}`) || null;
  });

  const [isChangingProfile, setIsChangingProfile] = useState(false);
  const [selectedStudentDraftId, setSelectedStudentDraftId] = useState('');
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsStudentPickerOpen(false);
      }
    };
    if (isStudentPickerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isStudentPickerOpen]);

  // Sync pinned student when current group changes/resolves
  useEffect(() => {
    if (!currentGroup?.id) {
      setPinnedStudentId(null);
      return;
    }
    const scopedKey = `rsa_pinned_student_${currentGroup.id}`;
    const saved = localStorage.getItem(scopedKey);
    if (saved && groupStudents.some((s) => String(s.id) === String(saved))) {
      setPinnedStudentId(saved);
    } else {
      setPinnedStudentId(null);
    }
  }, [currentGroup?.id, groupStudents]);

  // Validate that pinned student exists in current group
  const pinnedStudent = useMemo(() => {
    if (!pinnedStudentId) return null;
    const pId = String(pinnedStudentId);
    return groupStudents.find((s) => String(s.id) === pId) || null;
  }, [pinnedStudentId, groupStudents]);

  // Auto-init draft selection
  useEffect(() => {
    if (pinnedStudentId && groupStudents.some((s) => String(s.id) === String(pinnedStudentId))) {
      setSelectedStudentDraftId(String(pinnedStudentId));
    } else if (groupStudents.length > 0) {
      setSelectedStudentDraftId(String(groupStudents[0].id));
    }
  }, [pinnedStudentId, groupStudents]);

  const handleSaveProfilePin = (studentIdToPin) => {
    const targetId = studentIdToPin || selectedStudentDraftId;
    if (!targetId) return;

    const targetStr = String(targetId);
    if (currentGroup?.id) {
      localStorage.setItem(`rsa_pinned_student_${currentGroup.id}`, targetStr);
    }
    localStorage.setItem('rsa_pinned_student_id', targetStr);
    setPinnedStudentId(targetStr);
    setIsChangingProfile(false);
    setIsStudentPickerOpen(false);
    if (showToast) {
      const studentObj = groupStudents.find((s) => String(s.id) === targetStr);
      showToast(`Profil ${studentObj ? studentObj.name : ''} sifatida saqlandi!`, 'success');
    }
  };

  const handleClearProfilePin = () => {
    if (currentGroup?.id) {
      localStorage.removeItem(`rsa_pinned_student_${currentGroup.id}`);
    }
    localStorage.removeItem('rsa_pinned_student_id');
    setPinnedStudentId(null);
    setIsChangingProfile(true);
    setIsStudentPickerOpen(false);
    if (showToast) {
      showToast("Profil tanlovi bekor qilindi.", 'info');
    }
  };

  return (
    <div className="student-portal-root">
      {/* Sleek Unified Student Header Bar */}
      <div className="student-header-bar">
        {/* Left: Active Group Info with modal trigger */}
        <div
          className="student-group-chip"
          onClick={() => setIsGroupModalOpen(true)}
          title={connectedGroupsList.length > 1 ? "Guruhni almashtirish yoki yangi guruh ulash" : "Guruh ma'lumotlari"}
          role="button"
          tabIndex={0}
        >
          <div className="student-group-icon-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="student-group-text-col">
            <span className="student-group-title">{currentGroup?.name || "Guruh"}</span>
            <span className="student-group-switcher-hint">
              {connectedGroupsList.length > 1 ? `${connectedGroupsList.length} ta guruh ▾` : "Guruhim"}
            </span>
          </div>
        </div>

        {/* Center: Desktop Segmented Navigation (Hidden on Mobile) */}
        <div className="student-desktop-nav-wrap">
          <nav className="student-segmented-nav" aria-label="Student sahifalari">
            <button
              type="button"
              className={`student-nav-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              Asosiy
            </button>
            <button
              type="button"
              className={`student-nav-btn ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => setActiveTab('rating')}
            >
              Reyting
            </button>
            <button
              type="button"
              className={`student-nav-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => setActiveTab('shop')}
            >
              Do'kon
            </button>
          </nav>
        </div>

        {/* Right: Student Profile, Theme Toggle & Logout Actions */}
        <div className="student-header-right-actions">
          <div
            className={`student-profile-chip ${pinnedStudent ? 'has-profile' : 'no-profile'}`}
            onClick={() => setIsChangingProfile(true)}
            title="Profilingizni tanlang yoki o'zgartiring"
            role="button"
            tabIndex={0}
          >
            <div className="student-avatar-circle">
              {pinnedStudent ? (
                pinnedStudent.name.charAt(0).toUpperCase()
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="student-profile-text-col">
              <span className="student-profile-name">
                {pinnedStudent ? pinnedStudent.name : "Profilni tanlang"}
              </span>
              <span className="student-profile-sub">
                {pinnedStudent ? "Profilim" : "Belgilang"}
              </span>
            </div>
          </div>

          {toggleTheme && (
            <button
              type="button"
              className="student-header-action-btn theme-btn"
              onClick={toggleTheme}
              title="Mavzuni o'zgartirish"
              aria-label="Mavzuni o'zgartirish"
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
              className="student-header-action-btn logout"
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
      </div>

      {/* Multi-Groups Horizontal Quick Switcher (Shown only if connected to >1 groups) */}
      {connectedGroupsList.length > 1 && (
        <div className="multi-groups-quick-bar">
          <div className="multi-groups-scroll">
            {connectedGroupsList.map((grp) => {
              const isCurrent = String(grp.id) === String(currentGroup?.id);
              return (
                <button
                  key={grp.id}
                  type="button"
                  className={`multi-group-quick-pill ${isCurrent ? 'active' : ''}`}
                  onClick={() => {
                    if (!isCurrent && onSwitchGroup) onSwitchGroup(grp.id);
                  }}
                >
                  {isCurrent && <span className="pill-dot" />}
                  <span>{grp.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="multi-group-quick-pill add-btn"
              onClick={() => {
                setIsGroupModalOpen(true);
                setIsAddingGroup(true);
                setGroupAddError('');
              }}
              title="Yangi guruh ulash"
            >
              + Guruh
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="student-tab-content">
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

        {activeTab === 'rating' && (
          <div className="tab-pane-rating animate-fadeIn">
            <StudentRatingView
              students={groupStudents}
              transactions={groupTransactions}
              pinnedStudentId={pinnedStudentId}
              group={currentGroup}
              connectedGroups={connectedGroupsList}
              onSwitchGroup={onSwitchGroup}
            />
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="tab-pane-shop animate-fadeIn">
            <StudentShopComingSoon
              pinnedStudent={pinnedStudent}
              transactions={groupTransactions}
            />
          </div>
        )}
      </div>

      {/* Mobile Native App Bottom Navigation Bar (Portal to document.body, Immune to parent transforms/scrolling) */}
      {typeof document !== 'undefined' && createPortal(
        <nav className="student-mobile-bottom-bar" aria-label="Mobil navigatsiya">
          <div className="student-mobile-nav-inner">
            <button
              type="button"
              className={`student-mobile-tab-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              <div className="student-mobile-tab-icon">
                {activeTab === 'main' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
              </div>
              <span className="student-mobile-tab-label">Asosiy</span>
            </button>

            <button
              type="button"
              className={`student-mobile-tab-btn ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => setActiveTab('rating')}
            >
              <div className="student-mobile-tab-icon">
                {activeTab === 'rating' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                )}
              </div>
              <span className="student-mobile-tab-label">Reyting</span>
            </button>

            <button
              type="button"
              className={`student-mobile-tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => setActiveTab('shop')}
            >
              <div className="student-mobile-tab-icon">
                {activeTab === 'shop' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
                    <circle cx="12" cy="14" r="2" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                )}
              </div>
              <span className="student-mobile-tab-label">Do'kon</span>
            </button>
          </div>
        </nav>,
        document.body
      )}

      {/* Group Switcher / Add Group Modal */}
      {isGroupModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="student-modal-overlay" onClick={() => setIsGroupModalOpen(false)}>
          <div
            className="student-group-modal glass animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Guruhlarni boshqarish"
          >
            <div className="student-modal-header">
              <div>
                <h3 className="student-modal-title">Guruhlarim</h3>
                <p className="student-modal-subtitle">
                  {connectedGroupsList.length > 1
                    ? "Barcha ulangan kurs va guruhlaringiz"
                    : "Boshqa kurs yoki guruhlaringizni ulang"}
                </p>
              </div>
              <button
                type="button"
                className="student-modal-close-btn"
                onClick={() => setIsGroupModalOpen(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="student-modal-body">
              {/* Groups List */}
              <div className="student-groups-list">
                {sortedConnectedGroups.map((grp) => {
                  const isCurrent = String(grp.id) === String(currentGroup?.id);
                  const isConfirmingRemove = confirmRemoveId === grp.id;

                  return (
                    <div
                      key={grp.id}
                      className={`student-group-card-item ${isCurrent ? 'is-active' : ''}`}
                    >
                      <div
                        className="student-group-item-main"
                        onClick={() => {
                          if (!isCurrent && onSwitchGroup) {
                            onSwitchGroup(grp.id);
                          }
                          setIsGroupModalOpen(false);
                        }}
                      >
                        <div className="student-group-item-header">
                          <span className="student-group-item-title">{grp.name}</span>
                          {isCurrent && (
                            <span className="student-group-active-pill">Faol</span>
                          )}
                        </div>
                        {grp.schedule?.time && (
                          <div className="student-group-item-meta">
                            <span>{grp.schedule.time}</span>
                            {grp.room && <span> • {grp.room}</span>}
                          </div>
                        )}
                      </div>

                      <div className="student-group-item-actions">
                        {!isCurrent && (
                          <button
                            type="button"
                            className="student-group-switch-btn"
                            onClick={() => {
                              if (onSwitchGroup) onSwitchGroup(grp.id);
                              setIsGroupModalOpen(false);
                            }}
                          >
                            Faol qilish
                          </button>
                        )}
                        {connectedGroupsList.length > 1 && (
                          isConfirmingRemove ? (
                            <div className="group-remove-confirm">
                              <span className="confirm-text">O'chirish?</span>
                              <button
                                type="button"
                                className="confirm-btn-yes"
                                onClick={() => handleRemoveGroup(grp.id, grp.name)}
                              >
                                Ha
                              </button>
                              <button
                                type="button"
                                className="confirm-btn-no"
                                onClick={() => setConfirmRemoveId(null)}
                              >
                                Yo'q
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="student-group-delete-btn"
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

              {/* Add New Group Form or Trigger */}
              {isAddingGroup ? (
                <form className="student-add-group-form" onSubmit={handleAddNewGroup}>
                  <label className="add-group-label" htmlFor="new-group-password-modal">
                    Yangi guruh paroli
                  </label>
                  <div className="add-group-input-box">
                    <input
                      id="new-group-password-modal"
                      type="text"
                      className="add-group-input"
                      placeholder="Guruh paroli (masalan: rus2026)"
                      value={newGroupPassword}
                      onChange={(e) => {
                        setNewGroupPassword(e.target.value);
                        setGroupAddError('');
                      }}
                      autoFocus
                      disabled={isSubmittingGroup}
                    />
                    <button
                      type="submit"
                      className="add-group-submit-btn"
                      disabled={isSubmittingGroup || !newGroupPassword.trim()}
                    >
                      {isSubmittingGroup ? "Tekshirilmoqda..." : "Ulash"}
                    </button>
                  </div>
                  {groupAddError && (
                    <div className="add-group-error-msg">{groupAddError}</div>
                  )}
                  <button
                    type="button"
                    className="add-group-cancel-link"
                    onClick={() => {
                      setIsAddingGroup(false);
                      setGroupAddError('');
                    }}
                    disabled={isSubmittingGroup}
                  >
                    Bekor qilish
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="student-add-group-btn"
                  onClick={() => {
                    setIsAddingGroup(true);
                    setGroupAddError('');
                  }}
                >
                  <span className="plus-icon">+</span>
                  <span>Boshqa guruhni ulash (parol orqali)</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Selector Modal (Clean, quick 1-tap select) */}
      {isChangingProfile && typeof document !== 'undefined' && createPortal(
        <div className="student-modal-overlay" onClick={() => setIsChangingProfile(false)}>
          <div
            className="student-group-modal glass animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Profilingizni tanlang"
          >
            <div className="student-modal-header">
              <div>
                <h3 className="student-modal-title">Profilingizni tanlang</h3>
                <p className="student-modal-subtitle">
                  {currentGroup?.name ? `${currentGroup.name} guruhi o'quvchilari` : "Ismingizni tanlang"}
                </p>
              </div>
              <button
                type="button"
                className="student-modal-close-btn"
                onClick={() => setIsChangingProfile(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="student-modal-body">
              <div className="student-picker-list">
                {groupStudents.length > 0 ? (
                  groupStudents.map((st) => {
                    const isCurrent = String(st.id) === String(pinnedStudentId);
                    return (
                      <div
                        key={st.id}
                        className={`student-picker-item ${isCurrent ? 'is-selected' : ''}`}
                        onClick={() => handleSaveProfilePin(st.id)}
                      >
                        <div className="picker-item-avatar">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="picker-item-info">
                          <span className="picker-item-name">{st.name}</span>
                          {isCurrent && <span className="picker-item-current-tag">Tanlangan</span>}
                        </div>
                        {isCurrent ? (
                          <span className="picker-check-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        ) : (
                          <span className="picker-select-arrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="student-picker-empty">Guruhda o'quvchilar ro'yxati mavjud emas</div>
                )}
              </div>

              {pinnedStudent && (
                <div className="student-picker-footer">
                  <button
                    type="button"
                    className="student-picker-clear-btn"
                    onClick={() => handleClearProfilePin()}
                  >
                    Profil tanlovini bekor qilish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .student-portal-root {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 6px 0 40px;
          box-sizing: border-box;
        }

        /* Sleek Modern Unified Header Bar */
        .student-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg, 14px);
          padding: 8px 12px;
          margin-bottom: 12px;
          box-shadow: var(--shadow-sm);
          gap: 10px;
          position: sticky;
          top: 8px;
          z-index: 50;
        }

        .student-desktop-nav-wrap {
          display: none;
        }

        @media (min-width: 641px) {
          .student-desktop-nav-wrap {
            display: flex;
            align-items: center;
          }
        }

        .student-group-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 4px 10px 4px 6px;
          transition: all var(--transition-fast);
          user-select: none;
          min-width: 0;
          touch-action: manipulation;
        }

        .student-group-chip:hover {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
        }

        .student-group-icon-wrap {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .student-group-text-col {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          min-width: 0;
        }

        .student-group-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .student-group-switcher-hint {
          font-size: 0.65rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .student-header-right-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .student-profile-chip {
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
        }

        .student-profile-chip:hover {
          border-color: var(--apple-blue);
        }

        .student-avatar-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #34C759;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.74rem;
          flex-shrink: 0;
        }

        .student-profile-chip.no-profile .student-avatar-circle {
          background: var(--text-tertiary);
        }

        .student-profile-text-col {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          min-width: 0;
        }

        .student-profile-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 110px;
        }

        .student-profile-sub {
          font-size: 0.64rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .student-header-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          touch-action: manipulation;
          padding: 0;
          flex-shrink: 0;
        }

        .student-header-action-btn:hover {
          border-color: var(--apple-blue);
          color: var(--apple-blue);
        }

        .student-header-action-btn.logout {
          border-color: rgba(255, 59, 48, 0.25);
          background: rgba(255, 59, 48, 0.08);
          color: #FF3B30;
        }

        .student-header-action-btn.logout:hover {
          background: rgba(255, 59, 48, 0.16);
        }

        /* Multi-groups horizontal quick switcher */
        .multi-groups-quick-bar {
          margin-bottom: 12px;
        }

        .multi-groups-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }

        .multi-groups-scroll::-webkit-scrollbar {
          display: none;
        }

        .multi-group-quick-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 5px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all var(--transition-fast);
          touch-action: manipulation;
        }

        .multi-group-quick-pill:hover {
          color: var(--text-primary);
          border-color: var(--apple-blue);
        }

        .multi-group-quick-pill.active {
          background: var(--apple-blue);
          color: #ffffff;
          border-color: var(--apple-blue);
          box-shadow: 0 2px 8px rgba(0, 113, 227, 0.25);
        }

        .multi-group-quick-pill .pill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34C759;
        }

        .multi-group-quick-pill.add-btn {
          border-style: dashed;
          background: transparent;
          color: var(--apple-blue);
          padding: 5px 10px;
        }

        .multi-group-quick-pill.add-btn:hover {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
        }

        /* Multi Schedules Section Header */
        .multi-schedules-header {
          margin-bottom: 10px;
        }

        .multi-schedules-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .multi-schedules-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .multi-schedules-count-pill {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          padding: 1px 7px;
          border-radius: var(--radius-full);
        }

        /* Multi Schedules Section in Tab Main */
        .multi-schedules-section {
          margin-bottom: 20px;
        }

        .multi-schedules-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 12px;
        }

        .multi-schedules-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .multi-schedules-hint {
          font-size: 0.78rem;
          color: var(--text-tertiary);
        }

        .multi-schedules-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 700px) {
          .multi-schedules-grid {
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          }
        }

        /* Modal Overlay & Card */
        .student-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100000;
        }

        .student-group-modal {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl, 18px);
          width: 100%;
          max-width: 460px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .student-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .student-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 2px;
        }

        .student-modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .student-modal-close-btn {
          background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .student-modal-close-btn:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .student-modal-body {
          padding: 16px 20px 20px;
          max-height: 70vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .student-groups-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .student-group-card-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 10px);
          padding: 12px 14px;
          transition: all var(--transition-fast);
          gap: 12px;
        }

        .student-group-card-item.is-active {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
        }

        .student-group-item-main {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .student-group-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .student-group-item-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-group-active-pill {
          font-size: 0.68rem;
          font-weight: 700;
          color: #FFFFFF;
          background: #34C759;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .student-group-item-meta {
          font-size: 0.78rem;
          color: var(--text-tertiary);
        }

        .student-group-item-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .student-group-switch-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 5px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--apple-blue);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .student-group-switch-btn:hover {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        .student-group-delete-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .student-group-delete-btn:hover {
          color: #FF3B30;
          background: rgba(255, 59, 48, 0.1);
        }

        .group-remove-confirm {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
        }

        .confirm-text {
          color: #FF3B30;
          font-weight: 600;
        }

        .confirm-btn-yes {
          background: #FF3B30;
          color: #FFFFFF;
          border: none;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .confirm-btn-no {
          background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
          color: var(--text-secondary);
          border: none;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        /* Add Group Form in Modal */
        .student-add-group-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06);
          border: 1px dashed var(--apple-blue);
          border-radius: var(--radius-md, 10px);
          padding: 12px;
          color: var(--apple-blue);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .student-add-group-btn:hover {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12);
        }

        .student-add-group-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 10px);
          padding: 14px;
        }

        .add-group-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .add-group-input-box {
          display: flex;
          gap: 8px;
        }

        .add-group-input {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 8px);
          padding: 9px 12px;
          font-size: 0.88rem;
          color: var(--text-primary);
          outline: none;
        }

        .add-group-input:focus {
          border-color: var(--apple-blue);
        }

        .add-group-submit-btn {
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-md, 8px);
          padding: 9px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .add-group-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-group-error-msg {
          font-size: 0.78rem;
          color: #FF3B30;
          font-weight: 500;
        }

        .add-group-cancel-link {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 0.78rem;
          cursor: pointer;
          align-self: flex-start;
          padding: 0;
        }

        .add-group-cancel-link:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        /* Top Segmented Navigation (Desktop) */
        .student-desktop-nav-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          position: sticky;
          top: calc(var(--header-height, 64px) + 8px);
          z-index: 40;
        }

        .student-segmented-nav {
          display: inline-flex;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 4px;
          gap: 4px;
          box-shadow: var(--shadow-sm);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .student-nav-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 600;
          padding: 8px 24px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          user-select: none;
          white-space: nowrap;
          touch-action: manipulation;
        }

        .student-nav-btn.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14);
        }

        /* Mobile Bottom Tab Bar Hidden on Desktop */
        .student-mobile-bottom-bar {
          display: none;
        }

        /* Profile Picker Modal Styles */
        .student-picker-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 380px;
          overflow-y: auto;
          padding: 2px;
        }

        .student-picker-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.02));
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 10px);
          padding: 10px 14px;
          cursor: pointer;
          transition: all var(--transition-fast);
          gap: 10px;
        }

        .student-picker-item:hover {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.05);
        }

        .student-picker-item.is-selected {
          border-color: var(--apple-blue);
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
        }

        .picker-item-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.82rem;
          flex-shrink: 0;
        }

        .picker-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .picker-item-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .picker-item-current-tag {
          font-size: 0.68rem;
          color: #34C759;
          font-weight: 600;
        }

        .picker-check-icon {
          color: var(--apple-blue);
          display: flex;
          align-items: center;
          font-weight: bold;
        }

        .picker-select-arrow {
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
        }

        .student-picker-empty {
          padding: 24px;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .student-picker-footer {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: center;
        }

        .student-picker-clear-btn {
          background: transparent;
          border: none;
          color: #FF3B30;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
        }

        .student-picker-clear-btn:hover {
          background: rgba(255, 59, 48, 0.08);
        }


        .student-tab-content {
          width: 100%;
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .student-portal-root {
            padding-top: 0;
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)) !important;
          }

          .student-header-bar {
            top: 4px;
            padding: 6px 10px;
            margin-bottom: 8px;
            border-radius: var(--radius-md, 12px);
          }

          /* Fixed Native Mobile App Bottom Navigation Bar */
          .student-mobile-bottom-bar {
            display: block !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: calc(58px + env(safe-area-inset-bottom, 0px)) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            background: rgba(255, 255, 255, 0.96) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03) !important;
            z-index: 99999 !important;
            box-sizing: border-box !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            touch-action: manipulation !important;
            transform: translateZ(0) !important;
            -webkit-transform: translateZ(0) !important;
          }

          .student-mobile-nav-inner {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 58px;
            max-width: 500px;
            margin: 0 auto;
            padding: 0 12px;
          }

          .student-mobile-tab-btn {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            background: transparent;
            border: none;
            padding: 4px 0;
            color: #8E8E93;
            cursor: pointer;
            transition: color 0.15s ease, transform 0.12s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }

          .student-mobile-tab-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .student-mobile-tab-label {
            font-size: 0.68rem;
            font-weight: 500;
            letter-spacing: -0.01em;
            line-height: 1;
            white-space: nowrap;
            transition: color 0.15s ease, font-weight 0.15s ease;
          }

          .student-mobile-tab-btn.active {
            color: var(--apple-blue);
          }

          .student-mobile-tab-btn.active .student-mobile-tab-label {
            font-weight: 700;
            color: var(--apple-blue);
          }

          .student-mobile-tab-btn.active .student-mobile-tab-icon {
            transform: scale(1.06);
          }

          .student-mobile-tab-btn:active {
            transform: scale(0.92);
            opacity: 0.75;
          }

          .picker-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .custom-profile-picker-wrap {
            width: 100%;
          }

          .profile-save-btn,
          .profile-cancel-btn,
          .profile-clear-btn {
            width: 100%;
            text-align: center;
          }
        }

        [data-theme="dark"] .student-header-bar {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .student-group-chip,
        [data-theme="dark"] .student-profile-chip,
        [data-theme="dark"] .student-header-action-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
        }

        [data-theme="dark"] .student-header-action-btn.logout {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        [data-theme="dark"] .multi-group-quick-pill {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .student-segmented-nav,
        [data-theme="dark"] .pinned-profile-bar,
        [data-theme="dark"] .profile-picker-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .student-mobile-bottom-bar {
          background: rgba(26, 26, 30, 0.96) !important;
          border-top-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.35) !important;
        }

        [data-theme="dark"] .student-mobile-tab-btn {
          color: #8E8E93;
        }

        [data-theme="dark"] .student-mobile-tab-btn.active {
          color: #388BFD;
        }

        [data-theme="dark"] .student-mobile-tab-btn.active .student-mobile-tab-label {
          color: #388BFD;
        }

        [data-theme="dark"] .custom-profile-trigger,
        [data-theme="dark"] .profile-cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .custom-profile-menu {
          background: rgba(30, 30, 36, 0.96);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
        }

        [data-theme="dark"] .custom-profile-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .custom-profile-item.selected {
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.2);
          color: #60A5FA;
        }

        [data-theme="dark"] .item-check-icon {
          color: #60A5FA;
        }

        [data-theme="dark"] .student-group-bar,
        [data-theme="dark"] .student-group-pill,
        [data-theme="dark"] .student-group-modal {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .student-group-card-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .student-group-card-item.is-active {
          background: rgba(56, 139, 253, 0.12);
          border-color: #388BFD;
        }

        [data-theme="dark"] .student-add-group-form {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .add-group-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          color: #F0F6FC;
        }

        [data-theme="dark"] .student-group-switch-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}
