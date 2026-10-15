import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar } from '../../utils/studentAvatars';
import { getOrCreateDeviceId } from '../../utils/deviceId';
import { LockIcon, AlertTriangleIcon, LightbulbIcon } from './StudentIcons';
import useModalDismiss from '../../hooks/useModalDismiss';
import StudentAvatarPickerView from './StudentAvatarPickerView';

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
  _groupTransactions = [],
  onSwitchGroup = null,
  onAddGroup = null,
  onRemoveGroup = null,
  onUpdateAvatar = null,
  onSetStudentPin = null,
  _onClaimStudentDevice = null,
  onSelectProfile = null,
  _handleClearProfilePin = null,
  theme = 'light',
  toggleTheme = null,
  onLogout = null,
  showToast = null,
  isAvatarPickerOpen: externalPickerOpen,
  setIsAvatarPickerOpen: externalSetPickerOpen,
}) {
  // Avatar Picker View State
  const [internalPickerOpen, setInternalPickerOpen] = useState(false);
  const isAvatarPickerActive = externalPickerOpen !== undefined ? externalPickerOpen : internalPickerOpen;
  const setAvatarPickerActive = externalSetPickerOpen || setInternalPickerOpen;

  // Stable connected groups order
  const stableConnectedGroups = useMemo(() => {
    const list = sortedConnectedGroups && sortedConnectedGroups.length > 0
      ? sortedConnectedGroups
      : connectedGroupsList;
    if (!list || list.length <= 1) return list || [];
    return [...list].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  }, [sortedConnectedGroups, connectedGroupsList]);

  // Sub-views & Modals
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [isStudentListModalOpen, setIsStudentListModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupAddError, setGroupAddError] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // PIN Modal State: null | 'entry' | 'setup' | 'change'
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
    setIsGroupsModalOpen(false);
    setIsStudentListModalOpen(false);
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

  // Lock of background scroll and Escape key handler
  useModalDismiss(Boolean(pinModalMode || showLogoutConfirm || isGroupsModalOpen || isStudentListModalOpen), closeModals);

  // Reset student search query when sheet closes
  useEffect(() => {
    if (!isStudentListModalOpen) {
      setProfileSearchQuery('');
    }
  }, [isStudentListModalOpen]);

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

  // Current Device ID & Device Claimed Student
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
      if (exists && !exists.pin && !exists.deviceId) {
        try {
          localStorage.removeItem(`rsa_device_claimed_${gId}`);
        } catch {}
      } else if (exists) {
        return String(localClaimed);
      }
    }

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

  // Handle clicking student to pin / login
  const handleStudentClick = (st) => {
    if (!st) return;
    triggerHaptic('light');

    if (pinnedStudentId) {
      if (String(st.id) === String(pinnedStudentId)) {
        if (showToast) {
          showToast(`"${st.name}" - sizning faol profilingiz.`, 'info');
        }
        setIsStudentListModalOpen(false);
        return;
      }
    }

    if (!st.pin && deviceClaimedStudentId && String(deviceClaimedStudentId) !== String(st.id)) {
      const boundStudent = (groupStudents || []).find((s) => String(s.id) === String(deviceClaimedStudentId));
      const boundName = boundStudent?.name || "boshqa o'quvchi";
      triggerHaptic('heavy');
      if (showToast) {
        showToast(`Siz ushbu qurilmadan allaqachon "${boundName}" profiliga PIN o'rnatgansiz!`, 'error');
      }
      return;
    }

    setOldPinInput('');
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setShowForgotPinNotice(false);
    setPinTargetStudent(st);

    // Close the list modal so PIN modal is front-and-center
    setIsStudentListModalOpen(false);

    if (st.pin) {
      setPinModalMode('entry');
    } else {
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

  // -------------------------------------------------------------
  // CONDITIONAL RENDER: DEDICATED AVATAR PICKER SCREEN (Image 2)
  // -------------------------------------------------------------
  if (isAvatarPickerActive) {
    return (
      <StudentAvatarPickerView
        pinnedStudent={pinnedStudent}
        currentGroup={currentGroup}
        onSaveAvatar={onUpdateAvatar}
        onBack={() => setAvatarPickerActive(false)}
        showToast={showToast}
      />
    );
  }

  // -------------------------------------------------------------
  // MAIN PROFILE SCREEN (Compact Apple Settings Architecture)
  // -------------------------------------------------------------
  return (
    <div className="student-profile-main-page animate-fadeIn">
      {/* 1. Top User Profile Card */}
      <section className="account-user-card" aria-label="Profil kartasi">
        <div className="user-card-avatar-box">
          {pinnedStudent ? (
            <div className="user-card-avatar-inner">
              {renderAvatar(pinnedStudent.emoji, 58)}
            </div>
          ) : (
            <div className="user-card-avatar-inner placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        <div className="user-card-info">
          <h2 className="user-card-name">
            {pinnedStudent ? pinnedStudent.name : "Profil tanlanmagan"}
          </h2>
          <span className="user-card-group">
            {currentGroup?.name || "1-guruh"}
          </span>
        </div>

        {pinnedStudent ? (
          <button
            type="button"
            className="user-card-edit-btn"
            onClick={() => {
              triggerHaptic('light');
              setAvatarPickerActive(true);
            }}
            title="Profil rasmini almashtirish"
            aria-label="Profil rasmini almashtirish"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="user-card-pick-btn"
            onClick={() => {
              triggerHaptic('light');
              setIsStudentListModalOpen(true);
            }}
          >
            Tanlash ▾
          </button>
        )}
      </section>

      {/* 2. Sozlamalar va Bo'limlar (Clean Apple Minimalist List) */}
      <section className="account-settings-section" aria-label="Sozlamalar va bo'limlar">
        <h4 className="settings-section-heading">SOZLAMALAR VA BO'LIMLAR</h4>

        <div className="settings-menu-card">
          {/* Row 1: Profilni tanlash (Sheet modal trigger for clean UX) */}
          <button
            type="button"
            className="settings-menu-row"
            onClick={() => {
              triggerHaptic('light');
              setIsStudentListModalOpen(true);
            }}
          >
            <div className="settings-menu-icon-box green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="settings-menu-text">
              <span className="settings-menu-title">Profilni tanlash</span>
              <span className="settings-menu-subtitle">
                {pinnedStudent
                  ? `${pinnedStudent.name} faol • ${groupStudents.length} ta o'quvchi`
                  : `Guruhdagi ${groupStudents.length} ta o'quvchi`}
              </span>
            </div>
            <div className="settings-menu-chevron" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>

          <div className="settings-menu-divider" />

          {/* Row 2: Mening guruhlarim */}
          <button
            type="button"
            className="settings-menu-row"
            onClick={() => {
              triggerHaptic('light');
              setIsGroupsModalOpen(true);
            }}
          >
            <div className="settings-menu-icon-box purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="settings-menu-text">
              <span className="settings-menu-title">Mening guruhlarim</span>
              <span className="settings-menu-subtitle">
                {connectedGroupsList.length} ta guruh ulangan
              </span>
            </div>
            <div className="settings-menu-chevron" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>

          <div className="settings-menu-divider" />

          {/* Row 3: Xavfsizlik va parol */}
          <button
            type="button"
            className="settings-menu-row"
            onClick={() => {
              triggerHaptic('light');
              const freshPinned = (groupStudents || []).find((s) => String(s.id) === String(pinnedStudent?.id)) || pinnedStudent;
              if (!freshPinned) {
                showToast?.("Avval o'quvchi profilingizni tanlang!", "warning");
                setIsStudentListModalOpen(true);
                return;
              }
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
            <div className="settings-menu-icon-box blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="settings-menu-text">
              <span className="settings-menu-title">Xavfsizlik va parol</span>
              <span className="settings-menu-subtitle">Parolni yangilash</span>
            </div>
            <div className="settings-menu-chevron" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>

          {toggleTheme && (
            <button
              type="button"
              className="settings-menu-row"
              onClick={() => {
                triggerHaptic('light');
                toggleTheme();
              }}
            >
              <div className="settings-menu-icon-box purple">
                {theme === 'dark' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </div>
              <div className="settings-menu-text">
                <span className="settings-menu-title">Ilova mavzusi</span>
                <span className="settings-menu-subtitle">
                  {theme === 'dark' ? "Qorong'i rejim (Dark)" : "Yorug' rejim (Light)"}
                </span>
              </div>
              <div className="settings-menu-badge-val" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? "Dark" : "Light"}
              </div>
            </button>
          )}
        </div>
      </section>

      {/* 3. Tizimdan chiqish (Logout Button) */}
      <section className="account-logout-section" aria-label="Tizimdan chiqish">
        <button
          type="button"
          className="account-logout-card-btn"
          onClick={() => {
            triggerHaptic('heavy');
            setShowLogoutConfirm(true);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Tizimdan chiqish</span>
        </button>
      </section>

      {/* -------------------------------------------------------------
          MODALS & BOTTOM SHEETS
         ------------------------------------------------------------- */}

      {/* Modal 1: Guruhdagi o'quvchilar / Profilni tanlash Sheet Modal */}
      {isStudentListModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="sheet-backdrop animate-backdropFadeIn"
          onClick={() => setIsStudentListModalOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="sheet-container students-sheet-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="sheet-drag-zone">
              <div className="sheet-drag-handle" />
            </div>

            <div className="sheet-header">
              <div className="sheet-title-wrap">
                <h3 className="sheet-title">Profilni tanlash</h3>
                <p className="sheet-sub">
                  {currentGroup?.name ? `${currentGroup.name} • ` : ''}
                  {groupStudents.length} ta o'quvchi
                </p>
              </div>

              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsStudentListModalOpen(false)}
                aria-label="Yopish"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="sheet-body students-modal-body">
              {/* Real-time search bar */}
              <div className="students-search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-svg">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="students-search-input"
                  placeholder="Ismingizni qidiring..."
                  value={profileSearchQuery}
                  onChange={(e) => setProfileSearchQuery(e.target.value)}
                />
                {profileSearchQuery && (
                  <button
                    type="button"
                    className="students-search-clear"
                    onClick={() => setProfileSearchQuery('')}
                    aria-label="Tozalash"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Scrollable list of students */}
              <div className="students-modal-scroll-list">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, idx) => {
                    const isSelected = Boolean(pinnedStudentId && String(st.id) === String(pinnedStudentId));
                    const hasPin = Boolean(st.pin);
                    const colorPaletteClass = `avatar-tint-${idx % 6}`;

                    return (
                      <div
                        key={st.id}
                        className={`student-row-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleStudentClick(st)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleStudentClick(st);
                          }
                        }}
                      >
                        <div className={`student-row-avatar-box ${colorPaletteClass}`}>
                          {renderAvatar(st.emoji, 32)}
                        </div>

                        <div className="student-row-info">
                          <span className="student-row-name">{st.name}</span>
                          {hasPin ? (
                            <span className="student-status-badge badge-pin">
                              <LockIcon size={11} />
                              <span>PIN</span>
                            </span>
                          ) : (
                            <span className="student-status-badge badge-new">
                              <LockIcon size={11} />
                              <span>Yangi</span>
                            </span>
                          )}
                        </div>

                        <div className="student-row-action">
                          <button
                            type="button"
                            className="student-tanlash-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStudentClick(st);
                            }}
                          >
                            {isSelected ? "Faol" : "Tanlash ▾"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="students-empty-notice">
                    {profileSearchQuery ? "Bunday ismli o'quvchi topilmadi" : "O'quvchilar ro'yxati mavjud emas"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Mening guruhlarim Bottom Sheet */}
      {isGroupsModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="sheet-backdrop animate-backdropFadeIn"
          onClick={() => setIsGroupsModalOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="sheet-container groups-sheet-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="sheet-drag-zone">
              <div className="sheet-drag-handle" />
            </div>

            <div className="sheet-header">
              <div className="sheet-title-wrap">
                <h3 className="sheet-title">Mening guruhlarim</h3>
                <p className="sheet-sub">
                  {connectedGroupsList.length} ta guruh ulangan
                </p>
              </div>

              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsGroupsModalOpen(false)}
                aria-label="Yopish"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="sheet-body groups-modal-body">
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
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Faol</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="group-switch-btn"
                            onClick={() => {
                              triggerHaptic('light');
                              if (onSwitchGroup) onSwitchGroup(grp.id);
                              setIsGroupsModalOpen(false);
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

              {/* Add Group Toggle & Form */}
              <div className="modal-add-group-section">
                {!isAddingGroup ? (
                  <button
                    type="button"
                    className="modal-add-group-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsAddingGroup(true);
                      setGroupAddError('');
                    }}
                  >
                    + Yangi guruh qo'shish
                  </button>
                ) : (
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
                      <button
                        type="button"
                        className="add-group-cancel-link"
                        onClick={() => {
                          setIsAddingGroup(false);
                          setGroupAddError('');
                        }}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: PIN Entry / Setup / Change Sheet */}
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
                    <span className="student-pin-badge protected" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <LockIcon size={12} />
                      <span>PIN bilan himoyalangan</span>
                    </span>
                    <p className="pin-preview-hint">Profilga kirish uchun 4 xonali PIN-kodni tering</p>
                  </div>

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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangleIcon size={15} color="#EF4444" />
                        <span>{pinError}</span>
                      </span>
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
                        <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ marginTop: '2px', display: 'inline-flex' }}><LightbulbIcon size={16} color="#F59E0B" /></span>
                          <span><strong>Ustozingizga ayting:</strong> O'qituvchi o'z panelidan 1 bosish bilan PIN-kodingizni bekor qilib beradi va siz yangi PIN o'rnatib kirasiz.</span>
                        </span>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangleIcon size={15} color="#EF4444" />
                        <span>{pinError}</span>
                      </span>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangleIcon size={15} color="#EF4444" />
                        <span>{pinError}</span>
                      </span>
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

      {/* Modal 4: Logout Confirmation Dialog */}
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
