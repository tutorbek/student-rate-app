import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar, STUDENT_AVATARS } from '../../utils/studentAvatars';
import { AVATAR_GALLERY_IMAGES } from '../../utils/avatarGallery';
import { scrollToWithOffset } from '../../utils/scrollOffset';
import { getOrCreateDeviceId } from '../../utils/deviceId';

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

const EyeIcon = ({ isOpen }) => (
  isOpen ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
);

export default function StudentAccountView({
  currentGroup = null,
  connectedGroupsList = [],
  sortedConnectedGroups = [],
  pinnedStudent = null,
  pinnedStudentId = null,
  groupStudents = [],
  groupTransactions = [],
  onSwitchGroup = null,
  onAddGroup = null,
  onRemoveGroup = null,
  onUpdateAvatar = null,
  onSetStudentPin = null,
  onSelectProfile = null,
  _handleClearProfilePin = null,
  _theme = 'light',
  _toggleTheme = null,
  onLogout = null,
  showToast = null,
}) {
  // Keep connected groups in a strictly stable, predictable order (never swap rows on selection)
  const stableConnectedGroups = useMemo(() => {
    const list = sortedConnectedGroups && sortedConnectedGroups.length > 0
      ? sortedConnectedGroups
      : connectedGroupsList;
    if (!list || list.length <= 1) return list || [];
    return [...list].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  }, [sortedConnectedGroups, connectedGroupsList]);

  // Sub-views & Modals
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [avatarTab, setAvatarTab] = useState('gallery'); // 'gallery' | 'avatars'
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupAddError, setGroupAddError] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // PIN Modal State: null | 'confirm_select' | 'entry' | 'setup' | 'change'
  const [pinModalMode, setPinModalMode] = useState(null);
  const [pinTargetStudent, setPinTargetStudent] = useState(null);
  const [oldPinInput, setOldPinInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showForgotPinNotice, setShowForgotPinNotice] = useState(false);
  const pinInputRef = useRef(null);

  // Mobile sheet drag dismiss state
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetTouchStartY = useRef(0);

  // Logout confirm modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const closeModals = () => {
    setPinModalMode(null);
    setShowLogoutConfirm(false);
    setPinTargetStudent(null);
    setOldPinInput('');
    setPinInput('');
    setConfirmPinInput('');
    setShowOldPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
    setPinError('');
    setShowForgotPinNotice(false);
    setSheetDragY(0);
  };

  // Bulletproof lock of background scroll on Mobile (iOS Safari / Android / Telegram WebApp) & Desktop
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isModalOpen = Boolean(pinModalMode || showLogoutConfirm);
    if (!isModalOpen) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const originalBodyPos = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.position = originalBodyPos;
      document.body.style.top = originalBodyTop;
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = originalBodyWidth;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [pinModalMode, showLogoutConfirm]);

  // Escape key handler for open modals
  useEffect(() => {
    if (!pinModalMode && !showLogoutConfirm) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinModalMode, showLogoutConfirm]);

  // Auto focus input when opening PIN entry
  useEffect(() => {
    if (pinModalMode === 'entry') {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [pinModalMode]);

  const handleSheetTouchStart = (e) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e) => {
    const diff = e.touches[0].clientY - sheetTouchStartY.current;
    if (diff > 0) setSheetDragY(diff);
  };

  const handleSheetTouchEnd = () => {
    setIsSheetDragging(false);
    if (sheetDragY > 75) {
      triggerHaptic('light');
      closeModals();
    }
    setSheetDragY(0);
  };

  // Pinned student total points
  const totalScore = useMemo(() => {
    if (!pinnedStudentId) return 0;
    const pId = String(pinnedStudentId);
    return (groupTransactions || [])
      .filter((t) => !t.deleted && String(t.studentId) === pId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [pinnedStudentId, groupTransactions]);

  // Current Device ID & Device Claimed Student (2-Yechim: 1 Qurilmadan Faqat 1 Ta Profilga PIN O'rnatish)
  const currentDeviceId = useMemo(() => getOrCreateDeviceId(), []);
  const gId = currentGroup?.id ? String(currentGroup.id) : null;

  const deviceClaimedStudentId = useMemo(() => {
    if (!gId) return null;
    let localClaimed = null;
    try {
      localClaimed = localStorage.getItem(`rsa_device_claimed_${gId}`) || null;
    } catch {}

    if (localClaimed) {
      const exists = (groupStudents || []).find((s) => String(s.id) === String(localClaimed));
      // If teacher has reset both PIN and device binding for this student, release device lock
      if (exists && !exists.pin && !exists.deviceId) {
        try {
          localStorage.removeItem(`rsa_device_claimed_${gId}`);
        } catch {}
      } else if (exists) {
        return String(localClaimed);
      }
    }

    // Check if current device ID is bound to a student in this group in DB
    if (currentDeviceId) {
      const dbClaimed = (groupStudents || []).find(
        (s) => s.deviceId && String(s.deviceId) === String(currentDeviceId) && s.pin
      );
      if (dbClaimed) {
        try {
          localStorage.setItem(`rsa_device_claimed_${gId}`, String(dbClaimed.id));
        } catch {}
        return String(dbClaimed.id);
      }
    }

    return null;
  }, [gId, groupStudents, currentDeviceId]);

  // Filtered students for profile list
  const filteredStudents = useMemo(() => {
    const q = profileSearchQuery.trim().toLowerCase();
    if (!q) return groupStudents;
    return groupStudents.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [groupStudents, profileSearchQuery]);

  // Handle clicking student to pin / login (1 Student = 1 Account policy)
  const handleStudentClick = (st) => {
    if (!st) return;
    triggerHaptic('light');

    // 1. If student is currently logged in, they cannot switch to any other profile
    if (pinnedStudentId) {
      if (String(st.id) === String(pinnedStudentId)) {
        if (showToast) {
          showToast(`"${st.name}" - sizning faol profilingiz.`, 'info');
        }
      } else {
        if (showToast) {
          showToast("Siz allaqachon ushbu guruhda o'z profilingizga egasiz.", 'info');
        }
      }
      return;
    }

    // 2. 2-Yechim (Texnik Cheklov): Bir qurilmadan faqat 1 ta profilga PIN o'rnatish mumkin
    // If this device has already claimed another student profile, block claiming unclaimed classmate profiles
    if (!st.pin && deviceClaimedStudentId && String(deviceClaimedStudentId) !== String(st.id)) {
      const boundStudent = (groupStudents || []).find((s) => String(s.id) === String(deviceClaimedStudentId));
      const boundName = boundStudent?.name || "boshqa o'quvchi";
      triggerHaptic('heavy');
      if (showToast) {
        showToast(`⚠️ Siz ushbu qurilmadan allaqachon "${boundName}" profiliga PIN o'rnatgansiz! Bitta qurilmadan faqat 1 ta o'quvchiga PIN o'rnatish mumkin.`, 'error');
      }
      return;
    }

    setOldPinInput('');
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setShowForgotPinNotice(false);
    setPinTargetStudent(st);

    if (st.pin) {
      setPinModalMode('entry');
    } else {
      // Mandatory 4-digit PIN setup for first-time profile selection
      setPinModalMode('setup');
    }
  };

  // Submit new PIN setup
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

    const targetStudent = pinTargetStudent || pinnedStudent;
    if (!targetStudent || !currentGroup?.id) return;
    const freshTarget = (groupStudents || []).find((s) => String(s.id) === String(targetStudent.id)) || targetStudent;
    const targetStr = String(freshTarget.id);
    const gId = String(currentGroup.id);

    if (onSetStudentPin) {
      onSetStudentPin(freshTarget.id, cleanPin, freshTarget.name, currentDeviceId);
    }

    try {
      localStorage.setItem(`rsa_pinned_student_${gId}`, targetStr);
      localStorage.setItem(`rsa_pinned_student_pin_${gId}`, cleanPin);
      localStorage.setItem(`rsa_device_claimed_${gId}`, targetStr);
      if (freshTarget.name) {
        localStorage.setItem('rsa_pinned_student_name', freshTarget.name.trim());
      }
      localStorage.setItem('rsa_pinned_student_id', targetStr);
    } catch {}

    if (onSelectProfile) {
      onSelectProfile(freshTarget.id, cleanPin);
    }

    closeModals();
    triggerHaptic('medium');
    if (showToast) {
      showToast(`Xush kelibsiz, ${freshTarget.name}! Profilingiz PIN bilan himoyalandi.`, 'success');
    }
  };

  // Submit PIN change for existing pinned profile
  const handleSavePinChange = (e) => {
    if (e) e.preventDefault();
    const cleanOld = (oldPinInput || '').trim();
    const cleanNew = (pinInput || '').trim();
    const cleanConfirm = (confirmPinInput || '').trim();
    const targetStudent = pinTargetStudent || pinnedStudent;
    if (!targetStudent || !currentGroup?.id) return;

    // Resolve freshest data for student from groupStudents
    const freshTarget = (groupStudents || []).find((s) => String(s.id) === String(targetStudent.id)) || targetStudent;
    const currentActualPin = freshTarget.pin ? String(freshTarget.pin).trim() : '';

    if (currentActualPin && cleanOld !== currentActualPin) {
      setPinError("Joriy PIN-kod noto'g'ri kiritildi!");
      triggerHaptic('heavy');
      return;
    }

    if (cleanNew.length !== 4 || !/^\d{4}$/.test(cleanNew)) {
      setPinError("Yangi PIN-kod aynan 4 ta raqamdan iborat bo'lishi kerak!");
      triggerHaptic('heavy');
      return;
    }

    if (currentActualPin && cleanNew === cleanOld) {
      setPinError("Yangi PIN-kod joriy PIN-kodingiz bilan bir xil bo'lmasligi kerak!");
      triggerHaptic('heavy');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPinError("Kiritilgan yangi PIN-kodlar bir-biriga mos kelmadi!");
      triggerHaptic('heavy');
      return;
    }

    if (onSetStudentPin) {
      onSetStudentPin(freshTarget.id, cleanNew, freshTarget.name);
    }

    const targetStr = String(freshTarget.id);
    const gId = String(currentGroup.id);
    try {
      localStorage.setItem(`rsa_pinned_student_${gId}`, targetStr);
      localStorage.setItem(`rsa_pinned_student_pin_${gId}`, cleanNew);
      if (freshTarget.name) {
        localStorage.setItem('rsa_pinned_student_name', freshTarget.name.trim());
      }
      localStorage.setItem('rsa_pinned_student_id', targetStr);
    } catch {}

    if (onSelectProfile) {
      onSelectProfile(freshTarget.id, cleanNew);
    }

    closeModals();
    triggerHaptic('medium');
    if (showToast) {
      showToast("PIN-kodingiz muvaffaqiyatli o'zgartirildi!", 'success');
    }
  };

  // Verify PIN entry
  const handleVerifyPinEntry = (codeOverride) => {
    const cleanPin = String(codeOverride !== undefined ? codeOverride : pinInput || '').trim();
    if (!pinTargetStudent || !currentGroup?.id) return;

    if (cleanPin.length !== 4) {
      setPinError("4 xonali PIN-kodni kiriting!");
      triggerHaptic('heavy');
      return;
    }

    const freshTarget = (groupStudents || []).find((s) => String(s.id) === String(pinTargetStudent.id)) || pinTargetStudent;
    const targetPinRaw = freshTarget.pin !== undefined && freshTarget.pin !== null ? freshTarget.pin : pinTargetStudent?.pin;
    const actualPin = targetPinRaw !== undefined && targetPinRaw !== null ? String(targetPinRaw).trim() : '';

    if (actualPin && actualPin !== cleanPin && actualPin.padStart(4, '0') !== cleanPin) {
      setPinError("Noto'g'ri PIN-kod! Qayta urinib ko'ring.");
      triggerHaptic('heavy');
      setPinInput('');
      return;
    }

    const targetStr = String(freshTarget.id);
    const gId = String(currentGroup.id);
    try {
      localStorage.setItem(`rsa_pinned_student_${gId}`, targetStr);
      localStorage.setItem(`rsa_pinned_student_pin_${gId}`, cleanPin);
      localStorage.setItem(`rsa_device_claimed_${gId}`, targetStr);
      if (freshTarget.name) {
        localStorage.setItem('rsa_pinned_student_name', freshTarget.name.trim());
      }
      localStorage.setItem('rsa_pinned_student_id', targetStr);
    } catch {}

    // If student did not have deviceId registered yet, register current deviceId
    if (!freshTarget.deviceId && currentDeviceId && onSetStudentPin) {
      onSetStudentPin(freshTarget.id, cleanPin, freshTarget.name, currentDeviceId);
    }

    if (onSelectProfile) {
      onSelectProfile(freshTarget.id, cleanPin);
    }

    closeModals();
    triggerHaptic('medium');
    if (showToast) {
      showToast(`Xush kelibsiz, ${freshTarget.name}!`, 'success');
    }
  };


  // Add group handler
  const handleAddGroupSubmit = async (e) => {
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

  const handleGroupRemoveClick = (groupId, groupName) => {
    if (connectedGroupsList.length <= 1) {
      if (showToast) showToast("Yagona guruhni o'chirib bo'lmaydi!", 'warning');
      return;
    }
    if (onRemoveGroup) {
      onRemoveGroup(groupId, groupName);
      setConfirmRemoveId(null);
      if (showToast) {
        showToast(`"${groupName || 'Guruh'}" ro'yxatdan o'chirildi.`, 'info');
      }
    }
  };

  return (
    <div className="student-account-page animate-fadeIn">
      {/* 1. Hero Profile Card */}
      <section className="account-hero-card" aria-label="Profil ma'lumotlari">
        {pinnedStudent ? (
          <div className="account-hero-inner">
            <div className="account-avatar-wrapper">
              <div className="account-avatar-circle">
                {renderAvatar(pinnedStudent.emoji, 76)}
              </div>
              <button
                type="button"
                className="account-avatar-edit-btn"
                onClick={() => {
                  triggerHaptic('light');
                  scrollToWithOffset('account-avatar-picker-section');
                }}
                title="Rasmni almashtirish"
                aria-label="Rasmni almashtirish"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>

            <div className="account-hero-info">
              <div className="account-hero-badge-row">
                <span className="account-group-tag">{currentGroup?.name || "Guruh"}</span>
                <span className={`account-pin-status-tag ${pinnedStudent.pin ? 'has-pin' : 'no-pin'}`}>
                  {pinnedStudent.pin ? "🔒 PIN faol" : "🔓 PIN yo'q"}
                </span>
              </div>

              <h2 className="account-hero-name">{pinnedStudent.name}</h2>

              <div className="account-points-row">
                <div className="account-points-pill">
                  <span className="points-star">⭐</span>
                  <span className="points-number">{totalScore}</span>
                  <span className="points-label">Like to'plangan</span>
                </div>
              </div>
            </div>

            <div className="account-hero-actions">
              <button
                type="button"
                className="account-action-pill-btn secondary"
                onClick={() => {
                  triggerHaptic('light');
                  const freshPinned = (groupStudents || []).find((s) => String(s.id) === String(pinnedStudent?.id)) || pinnedStudent;
                  setPinTargetStudent(freshPinned);
                  setOldPinInput('');
                  setPinInput('');
                  setConfirmPinInput('');
                  setShowOldPin(false);
                  setShowNewPin(false);
                  setShowConfirmPin(false);
                  setPinError('');
                  setShowForgotPinNotice(false);
                  setPinModalMode(freshPinned.pin ? 'change' : 'setup');
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>{pinnedStudent.pin ? "PIN-kodni o'zgartirish" : "PIN-kod o'rnatish"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="account-unpinned-banner">
            <div className="account-avatar-wrapper">
              <div className="account-avatar-circle unpinned-hero-avatar">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            <div className="account-hero-info">
              <div className="account-hero-badge-row">
                <span className="account-group-tag">{currentGroup?.name || "Guruh"}</span>
                <span className="account-pin-status-tag no-pin">
                  🔓 Profil tanlanmagan
                </span>
              </div>

              <h2 className="account-hero-name">Profilingiz tanlanmagan</h2>

              <div className="account-points-row">
                <div className="account-unpinned-pill">
                  <span className="unpinned-info-icon">ℹ️</span>
                  <span className="unpinned-info-text">Ro'yxatdan tanlang</span>
                </div>
              </div>
            </div>

            <div className="account-hero-actions">
              <button
                type="button"
                className="account-action-pill-btn primary-pick"
                onClick={() => {
                  triggerHaptic('light');
                  scrollToWithOffset('account-student-list-section');
                  const el = document.getElementById('account-student-list-section');
                  if (el) {
                    const searchInput = el.querySelector('.account-search-input');
                    if (searchInput) {
                      setTimeout(() => searchInput.focus(), 350);
                    }
                  }
                }}
              >
                <span>Ismni tanlash ▾</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 2. Guruhlarim (My Groups) Section */}
      <section id="account-groups-section" className="account-section-card" aria-label="Guruhlarim">
        <div className="account-section-header">
          <div className="section-title-wrap">
            <h3 className="account-section-title">Guruhlarim</h3>
            <span className="account-section-sub">
              {connectedGroupsList.length} ta guruh ulangan
            </span>
          </div>
          <button
            type="button"
            className="account-section-action-btn"
            onClick={() => {
              triggerHaptic('light');
              setIsAddingGroup(!isAddingGroup);
              setGroupAddError('');
            }}
          >
            {isAddingGroup ? "Bekor qilish" : "+ Guruh qo'shish"}
          </button>
        </div>

        {/* Add Group Form */}
        {isAddingGroup && (
          <form className="account-add-group-form animate-slideDown" onSubmit={handleAddGroupSubmit}>
            <div className="add-group-input-wrap">
              <label htmlFor="account-group-pwd" className="add-group-label">
                Ustozingiz bergan guruh paroli:
              </label>
              <div className="add-group-row">
                <input
                  id="account-group-pwd"
                  type="text"
                  className="add-group-input"
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
                <button
                  type="submit"
                  className="add-group-submit-btn"
                  disabled={isSubmittingGroup || !newGroupPassword.trim()}
                >
                  {isSubmittingGroup ? "Ulanmoqda..." : "Ulash"}
                </button>
              </div>
              {groupAddError && (
                <div className="add-group-error-msg animate-shake">
                  {groupAddError}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Connected Groups List */}
        <div className="account-groups-grid">
          {stableConnectedGroups.map((grp) => {
            const isCurrent = String(grp.id) === String(currentGroup?.id);
            const isConfirmingRemove = confirmRemoveId === grp.id;

            return (
              <div
                key={grp.id}
                className={`account-group-card ${isCurrent ? 'is-active-group' : ''}`}
              >
                <div className="account-group-left">
                  <div className="group-title-row">
                    <span className="account-group-name">{grp.name}</span>
                  </div>
                  <div className="group-meta-row">
                    {grp.schedule?.time && <span>{grp.schedule.time}</span>}
                  </div>
                </div>

                <div className="account-group-right">
                  {isCurrent ? (
                    <span className="group-active-pill" aria-label="Faol guruh">
                      ✓ Faol
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="group-switch-btn"
                      onClick={() => {
                        triggerHaptic('light');
                        if (onSwitchGroup) onSwitchGroup(grp.id);
                      }}
                    >
                      Tanlash
                    </button>
                  )}

                  {connectedGroupsList.length > 1 && (
                    isConfirmingRemove ? (
                      <div className="group-remove-confirm-box">
                        <span className="remove-txt">O'chirilsinmi?</span>
                        <button
                          type="button"
                          className="remove-confirm-btn yes"
                          onClick={() => handleGroupRemoveClick(grp.id, grp.name)}
                        >
                          Ha
                        </button>
                        <button
                          type="button"
                          className="remove-confirm-btn no"
                          onClick={() => setConfirmRemoveId(null)}
                        >
                          Yo'q
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="group-delete-btn"
                        onClick={() => setConfirmRemoveId(grp.id)}
                        title="Guruhni ajratish"
                        aria-label="Guruhni ajratish"
                      >
                        O'chirish
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Guruhdagi o'quvchilar (Profile Picker & PIN Switch) */}
      <section
        id="account-student-list-section"
        className="account-section-card"
        aria-label="Profil tanlash"
      >
        <div className="account-section-header">
          <div className="section-title-wrap">
            <h3 className="account-section-title">Guruhdagi o'quvchilar</h3>
            <span className="account-section-sub">
              {currentGroup?.name ? `${currentGroup.name} o'quvchilari` : "Profilingizni tanlang"}
            </span>
          </div>
        </div>

        {/* Search */}
        {groupStudents.length > 4 && (
          <div className="account-search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-svg">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="account-search-input"
              placeholder="Ismingizni qidiring..."
              value={profileSearchQuery}
              onChange={(e) => setProfileSearchQuery(e.target.value)}
            />
            {profileSearchQuery && (
              <button
                type="button"
                className="account-search-clear"
                onClick={() => setProfileSearchQuery('')}
                aria-label="Tozalash"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Student items */}
        <div className="account-students-list">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((st) => {
              const isSelected = Boolean(pinnedStudentId && String(st.id) === String(pinnedStudentId));
              const hasActivePinSelection = Boolean(pinnedStudentId);
              const isPeer = hasActivePinSelection && !isSelected;
              const hasPin = Boolean(st.pin);
              const isDeviceClaimed = Boolean(
                !hasActivePinSelection &&
                deviceClaimedStudentId &&
                String(deviceClaimedStudentId) === String(st.id)
              );
              const isDeviceBlocked = Boolean(
                !hasActivePinSelection &&
                !hasPin &&
                deviceClaimedStudentId &&
                String(deviceClaimedStudentId) !== String(st.id)
              );

              return (
                <div
                  key={st.id}
                  className={`account-student-row ${isSelected ? 'is-selected' : ''} ${isPeer ? 'is-locked-peer' : ''} ${isDeviceBlocked ? 'is-device-blocked' : ''} ${isDeviceClaimed ? 'is-device-match' : ''}`}
                  onClick={() => handleStudentClick(st)}
                  role="button"
                  tabIndex={0}
                  aria-disabled={isPeer || isDeviceBlocked}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStudentClick(st);
                    }
                  }}
                >
                  <div className="student-row-avatar">
                    {renderAvatar(st.emoji, 32)}
                  </div>

                  <div className="student-row-info">
                    <div className="student-row-name-line">
                      <span className="student-row-name">{st.name}</span>
                      {hasPin ? (
                        <span className="student-pin-badge protected" title="4 xonali PIN bilan himoyalangan">
                          <span className="pin-icon" aria-hidden="true">🔒</span>
                          <span className="pin-text-full">Himoyalangan</span>
                          <span className="pin-text-short">PIN</span>
                        </span>
                      ) : (
                        <span className="student-pin-badge open" title="PIN belgilanmagan">
                          <span className="pin-icon" aria-hidden="true">🔓</span>
                          <span className="pin-text-full">Yangi profil</span>
                          <span className="pin-text-short">Yangi</span>
                        </span>
                      )}
                    </div>
                    {isDeviceClaimed && (
                      <span className="student-row-device-tag">
                        <span className="device-tag-text-full">Bu qurilmadagi profilingiz</span>
                        <span className="device-tag-text-short">Bu qurilmada</span>
                      </span>
                    )}
                  </div>

                  <div className="student-row-action">
                    {isSelected ? (
                      <span className="student-status-badge is-self">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="self-badge-text-full">Sizning profilingiz</span>
                        <span className="self-badge-text-short">Siz</span>
                      </span>
                    ) : isPeer ? (
                      <span className="student-status-badge is-peer">
                        Sinfdosh
                      </span>
                    ) : isDeviceBlocked ? (
                      <span className="student-status-badge is-device-locked" title="Boshqa profil biriktirilgan">
                        Cheklangan
                      </span>
                    ) : isDeviceClaimed ? (
                      <span className="select-action-text device-match">Kirish ▾</span>
                    ) : (
                      <span className="select-action-text">Tanlash ▾</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="account-empty-notice">
              {profileSearchQuery ? "Bunday ismli o'quvchi topilmadi" : "O'quvchilar ro'yxati mavjud emas"}
            </div>
          )}
        </div>
      </section>

      {/* 4. Avatar & Surat Tanlash */}
      <section
        id="account-avatar-picker-section"
        className="account-section-card"
        aria-label="Profil rasmi"
      >
        <div className="account-section-header">
          <div className="section-title-wrap">
            <h3 className="account-section-title">Profil rasmi yoki avatari</h3>
            <span className="account-section-sub">
              {pinnedStudent ? `${pinnedStudent.name} uchun yangi rasm tanlang` : "O'zingizga yoqqan rasmni tanlang"}
            </span>
          </div>
        </div>

        {/* Segmented Picker Tabs */}
        <div className="account-picker-tab-bar">
          <button
            type="button"
            className={`picker-tab-pill ${avatarTab === 'gallery' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setAvatarTab('gallery');
            }}
          >
            Suratlar ({AVATAR_GALLERY_IMAGES.length})
          </button>
          <button
            type="button"
            className={`picker-tab-pill ${avatarTab === 'avatars' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setAvatarTab('avatars');
            }}
          >
            3D Avatarlar ({STUDENT_AVATARS.length})
          </button>
        </div>

        {/* Gallery / Avatars Body */}
        <div className="account-avatar-grid-container">
          {avatarTab === 'gallery' ? (
            <div className="account-gallery-grid">
              {AVATAR_GALLERY_IMAGES.map((img) => {
                const isSelected = pinnedStudent && (
                  pinnedStudent.emoji === img.path ||
                  pinnedStudent.emoji === img.cdnPath ||
                  pinnedStudent.emoji === img.id ||
                  pinnedStudent.emoji === img.legacyPath ||
                  pinnedStudent.emoji === img.name
                );

                return (
                  <button
                    key={img.id}
                    type="button"
                    className={`gallery-grid-btn ${isSelected ? 'selected' : ''}`}
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
                      className="gallery-thumb-img"
                      onError={(e) => {
                        if (img.cdnPath && e.currentTarget.src !== img.cdnPath) {
                          e.currentTarget.src = img.cdnPath;
                        }
                      }}
                    />
                    {isSelected && (
                      <div className="avatar-check-badge">
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
            <div className="account-svg-grid">
              {STUDENT_AVATARS.map((item) => {
                const isSelected = pinnedStudent && (
                  pinnedStudent.emoji === item.id ||
                  pinnedStudent.emoji === item.label
                );

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`svg-grid-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      triggerHaptic('medium');
                      if (pinnedStudent && onUpdateAvatar) {
                        onUpdateAvatar(item.id, pinnedStudent.id, pinnedStudent.name);
                      }
                      showToast?.("Profilingiz avatari muvaffaqiyatli saqlandi!", "success");
                    }}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <div className="svg-item-icon">
                      {item.svg(42)}
                    </div>
                    <span className="svg-item-name">{item.label}</span>
                    {isSelected && (
                      <div className="avatar-check-badge">
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
        </div>
      </section>



      {/* 6. Chiqish (Logout) */}
      <section className="account-section-card danger-zone" aria-label="Tizimdan chiqish">
        <div className="account-section-header">
          <div className="section-title-wrap">
            <h3 className="account-section-title">Tizimdan chiqish</h3>
            <span className="account-section-sub">
              Barcha guruh va parollarni qurilmadan tozalash
            </span>
          </div>
        </div>

        <div className="account-logout-card">
          <p className="account-logout-desc">
            Agar boshqa qurilmaga o'tayotgan bo'lsangiz yoki qayta parollash kerak bo'lsa, tizimdan chiqishingiz mumkin.
          </p>
          <button
            type="button"
            className="account-logout-btn"
            onClick={() => {
              triggerHaptic('heavy');
              setShowLogoutConfirm(true);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Tizimdan butunlay chiqish</span>
          </button>
        </div>
      </section>

      {/* PIN Modals (Entry / Setup / Change) Rendered via Portal */}
      {pinModalMode && typeof document !== 'undefined' && createPortal(
        <div
          className="sheet-backdrop animate-backdropFadeIn"
          onClick={closeModals}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="sheet-container pin-sheet-modal"
            style={{
              transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
              transition: isSheetDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Pull Drag Indicator */}
            <div
              className="sheet-drag-zone"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="sheet-drag-handle" />
            </div>

            <div className="sheet-header">
              <div className="sheet-title-wrap">
                <h3 className="sheet-title">
                  {pinModalMode === 'entry'
                    ? "PIN-kodni kiriting"
                    : pinModalMode === 'change'
                    ? "PIN-kodni o'zgartirish"
                    : "PIN-kod o'rnatish"}
                </h3>
                <p className="sheet-sub">
                  {(pinTargetStudent || pinnedStudent)?.name} profili
                </p>
              </div>

              <button
                type="button"
                className="sheet-close-btn"
                onClick={closeModals}
                aria-label="Yopish"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="sheet-body pin-modal-body">
              {/* VIEW 1: PIN ENTRY */}
              {pinModalMode === 'entry' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyPinEntry();
                  }}
                  className="pin-form"
                >
                  <div className="pin-profile-preview">
                    <div className="pin-preview-avatar">
                      {renderAvatar((pinTargetStudent || pinnedStudent)?.emoji, 56)}
                    </div>
                    <h4 className="pin-preview-name">{(pinTargetStudent || pinnedStudent)?.name}</h4>
                    <span className="student-pin-badge protected">🔒 PIN bilan himoyalangan</span>
                    <p className="pin-preview-hint">Profilga kirish uchun 4 xonali PIN-kodni tering</p>
                  </div>

                  {/* Visual 4-Digit Indicator Boxes */}
                  <div className="pin-boxes-container">
                    <div
                      className="pin-boxes-row"
                      onClick={() => pinInputRef.current?.focus()}
                    >
                      {[0, 1, 2, 3].map((idx) => {
                        const isFilled = pinInput.length > idx;
                        const isCurrent = pinInput.length === idx;
                        return (
                          <div
                            key={idx}
                            className={`pin-digit-box ${isFilled ? 'filled' : ''} ${isCurrent ? 'active' : ''}`}
                          >
                            {isFilled ? '●' : ''}
                          </div>
                        );
                      })}
                    </div>
                    <input
                      ref={pinInputRef}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      className="pin-sr-only-input"
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPinInput(val);
                        setPinError('');
                        if (val.length === 4) {
                          handleVerifyPinEntry(val);
                        }
                      }}
                      autoFocus
                      autoComplete="current-password"
                      aria-label="4 xonali PIN-kod"
                    />
                  </div>

                  {pinError && (
                    <div className="pin-error-banner animate-shake">
                      <span>⚠️ {pinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="pin-primary-btn"
                    disabled={pinInput.length !== 4}
                  >
                    Profilga kirish
                  </button>

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
              )}

              {/* VIEW 2: PIN SETUP */}
              {pinModalMode === 'setup' && (
                <form onSubmit={handleSavePinSetup} className="pin-form">
                  <div className="pin-profile-preview">
                    <div className="pin-preview-avatar">
                      {renderAvatar((pinTargetStudent || pinnedStudent)?.emoji, 52)}
                    </div>
                    <h4 className="pin-preview-name">{(pinTargetStudent || pinnedStudent)?.name}</h4>
                  </div>

                  <div className="pin-notice-card">
                    <h4 className="pin-notice-title">Profil xavfsizligini ta'minlang</h4>
                    <p className="pin-notice-desc">
                      Boshqa o'quvchilar profilingizga kira olmasligi uchun 4 xonali shaxsiy PIN-kod belgilang.
                    </p>
                  </div>

                  <div className="pin-fields-list">
                    <div className="pin-field-item">
                      <label htmlFor="pin-setup-new" className="pin-field-label">4 xonali yangi PIN-kod:</label>
                      <div className="pin-field-input-wrap">
                        <input
                          id="pin-setup-new"
                          type={showNewPin ? "text" : "password"}
                          className="pin-clean-input"
                          placeholder="••••"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={pinInput}
                          onChange={(e) => {
                            setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError('');
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pin-eye-btn"
                          onClick={() => setShowNewPin(!showNewPin)}
                          aria-label={showNewPin ? "Yashirish" : "Ko'rsatish"}
                        >
                          <EyeIcon isOpen={showNewPin} />
                        </button>
                      </div>
                    </div>

                    <div className="pin-field-item">
                      <label htmlFor="pin-setup-confirm" className="pin-field-label">PIN-kodni tasdiqlang:</label>
                      <div className="pin-field-input-wrap">
                        <input
                          id="pin-setup-confirm"
                          type={showConfirmPin ? "text" : "password"}
                          className="pin-clean-input"
                          placeholder="••••"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={confirmPinInput}
                          onChange={(e) => {
                            setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError('');
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pin-eye-btn"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          aria-label={showConfirmPin ? "Yashirish" : "Ko'rsatish"}
                        >
                          <EyeIcon isOpen={showConfirmPin} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {pinError && (
                    <div className="pin-error-banner animate-shake">
                      <span>⚠️ {pinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="pin-primary-btn"
                    disabled={pinInput.length !== 4 || confirmPinInput.length !== 4}
                  >
                    PIN-kodni saqlash va faollashtirish
                  </button>
                </form>
              )}

              {/* VIEW 3: PIN CHANGE */}
              {pinModalMode === 'change' && (
                <form onSubmit={handleSavePinChange} className="pin-form">
                  <div className="pin-profile-preview">
                    <div className="pin-preview-avatar">
                      {renderAvatar((pinTargetStudent || pinnedStudent)?.emoji, 52)}
                    </div>
                    <h4 className="pin-preview-name">{(pinTargetStudent || pinnedStudent)?.name}</h4>
                    <p className="pin-preview-hint">Joriy PIN-kodni tasdiqlang va yangi 4 xonali PIN kiriting</p>
                  </div>

                  <div className="pin-fields-list">
                    <div className="pin-field-item">
                      <label htmlFor="pin-change-old" className="pin-field-label">Joriy (eski) PIN-kod:</label>
                      <div className="pin-field-input-wrap">
                        <input
                          id="pin-change-old"
                          type={showOldPin ? "text" : "password"}
                          className="pin-clean-input"
                          placeholder="••••"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={oldPinInput}
                          onChange={(e) => {
                            setOldPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError('');
                          }}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="pin-eye-btn"
                          onClick={() => setShowOldPin(!showOldPin)}
                          aria-label={showOldPin ? "Yashirish" : "Ko'rsatish"}
                        >
                          <EyeIcon isOpen={showOldPin} />
                        </button>
                      </div>
                    </div>

                    <div className="pin-field-item">
                      <label htmlFor="pin-change-new" className="pin-field-label">Yangi 4 xonali PIN-kod:</label>
                      <div className="pin-field-input-wrap">
                        <input
                          id="pin-change-new"
                          type={showNewPin ? "text" : "password"}
                          className="pin-clean-input"
                          placeholder="••••"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={pinInput}
                          onChange={(e) => {
                            setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError('');
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pin-eye-btn"
                          onClick={() => setShowNewPin(!showNewPin)}
                          aria-label={showNewPin ? "Yashirish" : "Ko'rsatish"}
                        >
                          <EyeIcon isOpen={showNewPin} />
                        </button>
                      </div>
                    </div>

                    <div className="pin-field-item">
                      <label htmlFor="pin-change-confirm" className="pin-field-label">Yangi PIN-kodni tasdiqlang:</label>
                      <div className="pin-field-input-wrap">
                        <input
                          id="pin-change-confirm"
                          type={showConfirmPin ? "text" : "password"}
                          className="pin-clean-input"
                          placeholder="••••"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={confirmPinInput}
                          onChange={(e) => {
                            setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError('');
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pin-eye-btn"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          aria-label={showConfirmPin ? "Yashirish" : "Ko'rsatish"}
                        >
                          <EyeIcon isOpen={showConfirmPin} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {pinError && (
                    <div className="pin-error-banner animate-shake">
                      <span>⚠️ {pinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="pin-primary-btn"
                    disabled={oldPinInput.length !== 4 || pinInput.length !== 4 || confirmPinInput.length !== 4}
                  >
                    PIN-kodni yangilash
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirmation Modal Rendered via Portal */}
      {showLogoutConfirm && typeof document !== 'undefined' && createPortal(
        <div
          className="sheet-backdrop animate-backdropFadeIn"
          onClick={() => setShowLogoutConfirm(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="sheet-container logout-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="logout-dialog-header">
              <h3 className="logout-dialog-title">Chiqishni tasdiqlaysizmi?</h3>
              <p className="logout-dialog-desc">
                Portal hisobidan chiqqaningizdan so'ng, qayta kirish uchun guruh parolini qayta kiritishingiz kerak bo'ladi.
              </p>
            </div>
            <div className="logout-dialog-actions">
              <button
                type="button"
                className="dialog-btn cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="dialog-btn confirm"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
