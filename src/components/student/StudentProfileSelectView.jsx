import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar } from '../../utils/studentAvatars';
import { getOrCreateDeviceId } from '../../utils/deviceId';
import { LockIcon, XIcon, LightbulbIcon } from './StudentIcons';

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

export default function StudentProfileSelectView({
  currentGroup = null,
  groupStudents = [],
  onSelectProfile = null,
  onSetStudentPin = null,
  onLogout = null,
  onCancel = null,
  theme = 'light',
  toggleTheme = null,
  showToast = null,
}) {
  const [nameInput, setNameInput] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const [initialLoading, setInitialLoading] = useState(groupStudents.length === 0);

  const nameInputRef = useRef(null);
  const pinInputRef = useRef(null);
  const confirmPinInputRef = useRef(null);

  // Keyboard navigation & Escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedStudent) {
        handleBackToList();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent]);

  useEffect(() => {
    try {
      setCurrentDeviceId(getOrCreateDeviceId());
    } catch {}
  }, []);

  useEffect(() => {
    // Auto-focus name input on mount
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Snappy response for name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(nameInput.trim().toLowerCase());
    }, 50);
    return () => clearTimeout(timer);
  }, [nameInput]);

  useEffect(() => {
    if (groupStudents.length > 0) {
      setInitialLoading(false);
    } else {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [groupStudents.length]);

  // Strict prefix matching:
  // Returns empty array when nameInput is empty (no list rendered by default)
  // When input is provided, matches starting letter(s) of the full name or any word part
  const filteredStudents = useMemo(() => {
    const query = (debouncedName || '').replace(/[ʻʼ`’]/g, "'");
    if (!query || !groupStudents || groupStudents.length === 0) return [];

    return groupStudents
      .filter((st) => {
        const cleanName = (st.name || '').toLowerCase().trim().replace(/[ʻʼ`’]/g, "'");
        // 1. Matches beginning of full name (e.g. "Ru" -> "Ruxshona")
        if (cleanName.startsWith(query)) return true;
        // 2. Matches beginning of any word (e.g. "Karimova Ruxshona" -> "Ru")
        const words = cleanName.split(/\s+/);
        return words.some((word) => word.startsWith(query));
      })
      .sort((a, b) => {
        const aName = (a.name || '').toLowerCase().trim().replace(/[ʻʼ`’]/g, "'");
        const bName = (b.name || '').toLowerCase().trim().replace(/[ʻʼ`]/g, "'");
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      });
  }, [groupStudents, debouncedName]);

  // When a student card is chosen
  const handleStudentClick = (st) => {
    triggerHaptic('light');
    setSelectedStudent(st);
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setShowForgotNotice(false);
    setShowPin(false);
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 150);
  };

  const handleBackToList = () => {
    triggerHaptic('light');
    setSelectedStudent(null);
    setPinInput('');
    setConfirmPinInput('');
    setPinError('');
    setShowForgotNotice(false);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  // Submit PIN for existing student
  const handleVerifyPin = (codeOverride) => {
    const cleanPin = String(codeOverride !== undefined ? codeOverride : pinInput || '').trim();
    if (!selectedStudent || !currentGroup?.id) return;

    if (cleanPin.length !== 4) {
      setPinError("4 xonali PIN-kodni kiriting!");
      triggerHaptic('heavy');
      return;
    }

    const freshTarget = (groupStudents || []).find((s) => String(s.id) === String(selectedStudent.id)) || selectedStudent;
    const targetPinRaw = freshTarget.pin !== undefined && freshTarget.pin !== null ? freshTarget.pin : selectedStudent?.pin;
    const actualPin = targetPinRaw !== undefined && targetPinRaw !== null ? String(targetPinRaw).trim() : '';

    if (actualPin && actualPin !== cleanPin && actualPin.padStart(4, '0') !== cleanPin) {
      setPinError("Noto'g'ri PIN-kod! Qayta urinib ko'ring.");
      triggerHaptic('heavy');
      setPinInput('');
      return;
    }

    const targetStr = String(freshTarget.id);
    const gId = String(currentGroup.id);
    const teacherId = currentGroup.teacherId || null;

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
      onSetStudentPin(freshTarget.id, cleanPin, freshTarget.name, currentDeviceId, teacherId);
    }

    triggerHaptic('medium');
    if (showToast) {
      showToast(`Xush kelibsiz, ${freshTarget.name}!`, 'success');
    }

    if (onSelectProfile) {
      onSelectProfile(freshTarget.id, cleanPin);
    }
  };

  // Setup PIN for new student
  const handleSavePinSetup = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

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

    if (!selectedStudent || !currentGroup?.id) return;
    const freshTarget = (groupStudents || []).find((s) => String(s.id) === String(selectedStudent.id)) || selectedStudent;
    const targetStr = String(freshTarget.id);
    const gId = String(currentGroup.id);
    const teacherId = currentGroup.teacherId || null;

    setIsSubmitting(true);
    setPinError('');

    try {
      if (onSetStudentPin) {
        const success = await onSetStudentPin(freshTarget.id, cleanPin, freshTarget.name, currentDeviceId, teacherId);
        if (success === false) {
          setPinError("Serverga ulanishda xatolik yuz berdi. Qayta urinib ko'ring.");
          triggerHaptic('heavy');
          setIsSubmitting(false);
          return;
        }
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

      triggerHaptic('medium');
      if (showToast) {
        showToast(`Xush kelibsiz, ${freshTarget.name}! Profilingiz PIN bilan himoyalandi.`, 'success');
      }

      if (onSelectProfile) {
        onSelectProfile(freshTarget.id, cleanPin);
      }
    } catch (err) {
      console.error('[PIN Setup] Error:', err);
      setPinError("Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.");
      triggerHaptic('heavy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPin = Boolean(selectedStudent?.pin);

  return (
    <div className="profile-select-screen" data-theme={theme}>
      {/* Top Navigation Bar */}
      <header className="profile-select-navbar">
        <div className="profile-select-navbar-inner">
          <div className="profile-select-nav-left">
            {onCancel ? (
              <button
                type="button"
                className="profile-select-back-btn scale-active"
                onClick={onCancel}
                aria-label="Orqaga qaytish"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Orqaga</span>
              </button>
            ) : (
              <div className="profile-select-group-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{currentGroup?.name || "Guruh"}</span>
              </div>
            )}
          </div>

          <div className="profile-select-nav-right">
            {toggleTheme && (
              <button
                type="button"
                className="profile-select-theme-btn scale-active"
                onClick={() => {
                  triggerHaptic('light');
                  toggleTheme();
                }}
                aria-label="Mavzuni almashtirish"
              >
                {theme === 'dark' ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                className="profile-select-logout-btn scale-active"
                onClick={onLogout}
                aria-label="Guruhdan chiqish"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Chiqish</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="profile-select-body">
        <div className="profile-select-container animate-fadeIn">
          {/* Hero Header */}
          <div className="profile-select-hero">
            <h1 className="profile-select-title">Ismingiz nima?</h1>
            <p className="profile-select-subtitle">
              {currentGroup?.name || "Guruh"} • Davom etish uchun ismingizni kiriting
            </p>
          </div>

          {/* Dedicated Name Input Box (Not search-styled) */}
          <div className="profile-name-input-card">
            <input
              ref={nameInputRef}
              type="text"
              className="profile-name-input"
              placeholder="Ismingizni kiriting..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              aria-label="Ismingiz"
            />
            {nameInput && (
              <button
                type="button"
                className="profile-name-clear-btn scale-active"
                onClick={() => {
                  setNameInput('');
                  nameInputRef.current?.focus();
                }}
                aria-label="Tozalash"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>

          {/* Results Area */}
          <div className="profile-select-list">
            {initialLoading ? (
              <div className="profile-select-empty-box">
                <div className="profile-select-spinner" />
                <p className="profile-select-empty-desc" style={{ marginTop: 12 }}>
                  O'quvchilar ro'yxati yuklanmoqda...
                </p>
              </div>
            ) : groupStudents.length === 0 ? (
              <div className="profile-select-empty-box">
                <div className="profile-select-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="profile-select-empty-title">Guruhda o'quvchilar yo'q</h3>
                <p className="profile-select-empty-desc">
                  Bu guruhda hozircha o'quvchilar ro'yxati shakllanmagan. Ustozingiz sizni guruhga qo'shishini kuting.
                </p>
                {onLogout && (
                  <button type="button" className="profile-select-empty-btn scale-active" onClick={onLogout}>
                    Boshqa guruh kodini kiritish
                  </button>
                )}
              </div>
            ) : !nameInput.trim() ? (
              /* When nothing is typed yet, render nothing (no pre-rendered list) */
              null
            ) : filteredStudents.length > 0 ? (
              /* Matched students list */
              <div className="profile-results-section animate-fadeIn">
                <div className="profile-select-cards-stream">
                  {filteredStudents.map((st, idx) => {
                    const colorIdx = idx % 6;
                    const hasExistingPin = Boolean(st.pin);

                    return (
                      <div
                        key={st.id}
                        className="profile-student-card scale-active"
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
                        <div className={`profile-student-avatar-box avatar-tint-${colorIdx}`}>
                          {renderAvatar(st.emoji, 42)}
                        </div>

                        <div className="profile-student-info">
                          <span className="profile-student-name">{st.name}</span>
                          <div className="profile-student-badge-wrap">
                            {hasExistingPin ? (
                              <span className="profile-pin-badge badge-pin">
                                <LockIcon size={11} />
                                <span>PIN bilan</span>
                              </span>
                            ) : (
                              <span className="profile-pin-badge badge-new">
                                <span>Yangi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="profile-student-action">
                          <button
                            type="button"
                            className="profile-student-select-btn scale-active"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStudentClick(st);
                            }}
                          >
                            <span>Tanlash</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* PIN Verification / Setup Modal */}
      {selectedStudent && typeof document !== 'undefined' && createPortal(
        <div
          className="profile-pin-overlay modal-overlay animate-fadeIn"
          data-theme={theme}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleBackToList();
          }}
        >
          <div
            className="profile-pin-modal animate-modalScale"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-pin-header">
              <button
                type="button"
                className="profile-pin-back-btn scale-active"
                onClick={handleBackToList}
                aria-label="Orqaga qaytish"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Orqaga</span>
              </button>

              <button
                type="button"
                className="profile-pin-close-btn scale-active"
                onClick={handleBackToList}
                aria-label="Yopish"
              >
                <XIcon size={14} />
              </button>
            </div>

            <div className="profile-pin-body">
              {/* Target Student Identity Pill */}
              <div className="profile-pin-student-card">
                <div className="profile-pin-avatar">
                  {renderAvatar(selectedStudent.emoji, 54)}
                </div>
                <h3 className="profile-pin-student-name">{selectedStudent.name}</h3>
                <span className="profile-pin-student-sub">
                  {currentGroup?.name || "Guruh"}
                </span>
              </div>

              {/* Title & Instructions */}
              <h2 className="profile-pin-title">
                {hasPin ? "PIN-kodni kiriting" : "Yangi PIN-kod o'rnating"}
              </h2>
              <p className="profile-pin-desc">
                {hasPin
                  ? "Profilingizga kirish uchun 4 xonali shaxsiy PIN-kodingizni kiriting."
                  : "Profilingiz faqat o'zingizga tegishli bo'lishi uchun 4 xonali PIN o'rnating."}
              </p>

              {pinError && (
                <div className="profile-pin-error-box animate-shake" role="alert">
                  <span>{pinError}</span>
                </div>
              )}

              {/* MODE 1: VERIFY EXISTING PIN */}
              {hasPin ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyPin();
                  }}
                  className="profile-pin-form"
                >
                  <div className="profile-pin-boxes-container">
                    <div
                      className="profile-pin-boxes-row"
                      onClick={() => pinInputRef.current?.focus()}
                    >
                      {[0, 1, 2, 3].map((idx) => {
                        const isFilled = pinInput.length > idx;
                        const isCurrent = pinInput.length === idx;
                        return (
                          <div
                            key={idx}
                            className={`profile-pin-digit-box ${isFilled ? 'filled' : ''} ${isCurrent ? 'active' : ''}`}
                          >
                            {isFilled ? (showPin ? pinInput[idx] : '●') : ''}
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
                      className="profile-pin-sr-input"
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPinInput(val);
                        setPinError('');
                        if (val.length === 4) {
                          handleVerifyPin(val);
                        }
                      }}
                      autoComplete="one-time-code"
                      autoFocus
                      aria-label="4 xonali PIN-kod"
                    />
                  </div>

                  <div className="profile-pin-toggle-wrap">
                    <button
                      type="button"
                      className="profile-pin-toggle-btn scale-active"
                      onClick={() => {
                        triggerHaptic('light');
                        setShowPin(!showPin);
                      }}
                      aria-label={showPin ? "PIN-kodni yashirish" : "PIN-kodni ko'rsatish"}
                    >
                      <EyeIcon isOpen={showPin} />
                      <span>{showPin ? "PIN-kodni yashirish" : "PIN-kodni ko'rsatish"}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="profile-pin-submit-btn scale-active"
                    disabled={pinInput.length !== 4}
                  >
                    <span>Kirish</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  <div className="profile-pin-forgot-wrap">
                    <button
                      type="button"
                      className="profile-pin-forgot-btn"
                      onClick={() => setShowForgotNotice(!showForgotNotice)}
                    >
                      PIN-kodni unutdingizmi?
                    </button>

                    {showForgotNotice && (
                      <div className="profile-pin-forgot-box animate-fadeIn">
                        <div className="profile-pin-forgot-icon">
                          <LightbulbIcon size={16} />
                        </div>
                        <p className="profile-pin-forgot-text">
                          Ustozingizga murojaat qiling. Ustoz o'z boshqaruv panelidan profilingiz PIN-kodini darhol tiklab bera oladi.
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                /* MODE 2: SETUP NEW PIN */
                <form onSubmit={handleSavePinSetup} className="profile-pin-form">
                  <div className="profile-pin-field-group">
                    <label className="profile-pin-field-label">4 xonali yangi PIN-kod:</label>
                    <div className="profile-pin-boxes-container">
                      <div
                        className="profile-pin-boxes-row"
                        onClick={() => pinInputRef.current?.focus()}
                      >
                        {[0, 1, 2, 3].map((idx) => {
                          const isFilled = pinInput.length > idx;
                          const isCurrent = pinInput.length === idx;
                          return (
                            <div
                              key={idx}
                              className={`profile-pin-digit-box ${isFilled ? 'filled' : ''} ${isCurrent ? 'active' : ''}`}
                            >
                              {isFilled ? (showPin ? pinInput[idx] : '●') : ''}
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
                        className="profile-pin-sr-input"
                        value={pinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPinInput(val);
                          setPinError('');
                          if (val.length === 4) {
                            confirmPinInputRef.current?.focus();
                          }
                        }}
                        autoFocus
                        autoComplete="new-password"
                        aria-label="Yangi PIN-kod"
                      />
                    </div>
                  </div>

                  <div className="profile-pin-field-group">
                    <label className="profile-pin-field-label">PIN-kodni tasdiqlang:</label>
                    <div className="profile-pin-boxes-container">
                      <div
                        className="profile-pin-boxes-row"
                        onClick={() => confirmPinInputRef.current?.focus()}
                      >
                        {[0, 1, 2, 3].map((idx) => {
                          const isFilled = confirmPinInput.length > idx;
                          const isCurrent = confirmPinInput.length === idx;
                          return (
                            <div
                              key={idx}
                              className={`profile-pin-digit-box ${isFilled ? 'filled' : ''} ${isCurrent ? 'active' : ''}`}
                            >
                              {isFilled ? (showPin ? confirmPinInput[idx] : '●') : ''}
                            </div>
                          );
                        })}
                      </div>
                      <input
                        ref={confirmPinInputRef}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        className="profile-pin-sr-input"
                        value={confirmPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setConfirmPinInput(val);
                          setPinError('');
                        }}
                        autoComplete="new-password"
                        aria-label="PIN-kodni tasdiqlang"
                      />
                    </div>
                  </div>

                  <div className="profile-pin-toggle-wrap">
                    <button
                      type="button"
                      className="profile-pin-toggle-btn scale-active"
                      onClick={() => {
                        triggerHaptic('light');
                        setShowPin(!showPin);
                      }}
                      aria-label={showPin ? "PIN-kodni yashirish" : "PIN-kodni ko'rsatish"}
                    >
                      <EyeIcon isOpen={showPin} />
                      <span>{showPin ? "PIN-kodni yashirish" : "PIN-kodni ko'rsatish"}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="profile-pin-submit-btn scale-active"
                    disabled={isSubmitting || pinInput.length !== 4 || confirmPinInput.length !== 4}
                  >
                    {isSubmitting ? (
                      <span>Saqlanmoqda...</span>
                    ) : (
                      <>
                        <span>PIN-kodni saqlash va kirish</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped Styles using Global Design System CSS Variables */}
      <style>{`
        .profile-select-screen {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Top Navbar */
        .profile-select-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          padding-top: max(env(safe-area-inset-top, 0px), var(--tg-safe-top, 0px));
        }

        [data-theme="dark"] .profile-select-navbar {
          background: rgba(41, 42, 45, 0.85);
          border-bottom-color: var(--border-color);
        }

        .profile-select-navbar-inner {
          max-width: 680px;
          margin: 0 auto;
          height: 56px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .profile-select-nav-left,
        .profile-select-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-select-group-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .profile-select-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--apple-blue, #0171E3);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          transition: opacity 0.15s ease;
        }

        .profile-select-back-btn:hover {
          opacity: 0.75;
        }

        .profile-select-theme-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .profile-select-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid rgba(239, 68, 68, 0.28);
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .profile-select-logout-btn:hover {
          background: rgba(239, 68, 68, 0.18);
        }

        /* Body & Container */
        .profile-select-body {
          flex: 1;
          padding: 32px 16px 40px;
          display: flex;
          justify-content: center;
          background-color: var(--bg-primary);
        }

        .profile-select-container {
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Hero */
        .profile-select-hero {
          text-align: center;
          padding: 8px 12px 2px;
        }

        .profile-select-title {
          font-size: 1.65rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          margin: 0;
          color: var(--text-primary);
        }

        .profile-select-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 6px;
          margin-bottom: 0;
          font-weight: 500;
        }

        /* Dedicated Name Input Box - Clean Apple Minimalist without glowing rings */
        .profile-name-input-card {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 0 16px;
          box-shadow: none !important;
          outline: none !important;
          transition: border-color 0.15s ease;
        }

        .profile-name-input-card:focus-within {
          border-color: rgba(255, 255, 255, 0.24) !important;
          box-shadow: none !important;
          outline: none !important;
        }

        [data-theme="light"] .profile-name-input-card:focus-within {
          border-color: rgba(0, 0, 0, 0.25) !important;
          box-shadow: none !important;
          outline: none !important;
        }

        .profile-name-input,
        .profile-name-input:focus,
        .profile-name-input:focus-visible,
        [data-theme="dark"] .profile-name-input,
        [data-theme="dark"] .profile-name-input:focus,
        [data-theme="dark"] .profile-name-input:focus-visible {
          flex: 1;
          height: 48px;
          border: none !important;
          background: transparent !important;
          font-size: 1rem;
          font-weight: 450;
          color: var(--text-primary);
          outline: none !important;
          box-shadow: none !important;
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
        }

        .profile-name-input::placeholder {
          color: var(--text-secondary);
          font-size: 0.98rem;
          font-weight: 400;
        }

        .profile-name-clear-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-left: 8px;
          flex-shrink: 0;
          transition: transform 0.1s ease, color 0.15s ease;
        }

        .profile-name-clear-btn:hover {
          color: var(--text-primary);
        }

        /* Students List Cards */
        .profile-select-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .profile-student-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          box-shadow: none;
          transition: transform 0.12s ease, background-color 0.15s ease, border-color 0.15s ease;
        }

        .profile-student-card:hover {
          background: var(--bg-card-hover);
        }

        .profile-student-avatar-box {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
        }

        .profile-student-avatar-box.avatar-tint-0 { background: #FEF3C7; }
        .profile-student-avatar-box.avatar-tint-1 { background: #FEE2E2; }
        .profile-student-avatar-box.avatar-tint-2 { background: #D1FAE5; }
        .profile-student-avatar-box.avatar-tint-3 { background: #E0E7FF; }
        .profile-student-avatar-box.avatar-tint-4 { background: #FCE7F3; }
        .profile-student-avatar-box.avatar-tint-5 { background: #CFFAFE; }

        [data-theme="dark"] .profile-student-avatar-box.avatar-tint-0 { background: rgba(245, 158, 11, 0.22); }
        [data-theme="dark"] .profile-student-avatar-box.avatar-tint-1 { background: rgba(239, 68, 68, 0.22); }
        [data-theme="dark"] .profile-student-avatar-box.avatar-tint-2 { background: rgba(16, 185, 129, 0.22); }
        [data-theme="dark"] .profile-student-avatar-box.avatar-tint-3 { background: rgba(99, 102, 241, 0.24); }
        [data-theme="dark"] .profile-student-avatar-box.avatar-tint-4 { background: rgba(236, 72, 153, 0.22); }
        [data-theme="dark"] .profile-student-avatar-box.avatar-tint-5 { background: rgba(6, 182, 212, 0.22); }

        .profile-student-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .profile-student-name {
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-student-badge-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .profile-pin-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .profile-pin-badge.badge-pin {
          background: rgba(1, 113, 227, 0.12);
          color: var(--apple-blue, #0171E3);
          border: 1px solid rgba(1, 113, 227, 0.22);
        }

        .profile-pin-badge.badge-new {
          background: rgba(52, 199, 89, 0.12);
          color: var(--apple-green, #34C759);
          border: 1px solid rgba(52, 199, 89, 0.22);
        }

        .profile-student-action {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .profile-student-select-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: var(--apple-blue, #0171E3);
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          font-size: 0.84rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(1, 113, 227, 0.2);
        }

        .profile-student-select-btn:hover {
          background: #0060C0;
          box-shadow: 0 3px 10px rgba(1, 113, 227, 0.35);
        }

        .profile-student-select-btn:active {
          transform: scale(0.96);
        }

        .profile-student-chevron {
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .profile-student-card:hover .profile-student-chevron {
          color: var(--apple-blue, #0171E3);
          transform: translateX(2px);
        }

        /* Debounce Typing Hint */
        .profile-select-typing-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 500;
        }

        .profile-select-mini-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(1, 113, 227, 0.25);
          border-top-color: var(--apple-blue, #0171E3);
          animation: spin 0.6s linear infinite;
        }

        /* Results Stream Section */
        .profile-results-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .profile-results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 6px;
        }

        .profile-results-title {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }

        .profile-results-count {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--apple-blue, #0171E3);
          background: rgba(1, 113, 227, 0.1);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .profile-select-cards-stream {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Empty Box */
        .profile-select-spinner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2.5px solid rgba(1, 113, 227, 0.25);
          border-top-color: var(--apple-blue, #0171E3);
          animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .profile-select-empty-box {
          text-align: center;
          padding: 36px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
        }

        .profile-select-empty-icon {
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .profile-select-empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 6px;
          color: var(--text-primary);
        }

        .profile-select-empty-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.45;
        }

        .profile-select-empty-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 14px;
          padding: 9px 18px;
          border-radius: 12px;
          background: var(--apple-blue, #0171E3);
          color: #FFFFFF;
          font-size: 0.88rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }

        /* PIN Modal & Overlay (Portaled to document.body) */
        .profile-pin-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          padding-top: max(16px, env(safe-area-inset-top, 0px));
          padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
          box-sizing: border-box;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .profile-pin-modal {
          width: 100%;
          max-width: 400px;
          max-height: calc(100dvh - 32px);
          background: var(--bg-card);
          border-radius: 24px;
          box-shadow: var(--shadow-modal, 0 20px 48px rgba(0, 0, 0, 0.45));
          border: 1px solid var(--border-color);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          color: var(--text-primary);
        }

        .profile-pin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-color);
        }

        .profile-pin-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: none;
          color: var(--apple-blue, #0171E3);
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
        }

        .profile-pin-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .profile-pin-body {
          padding: 24px 20px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .profile-pin-student-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 14px;
        }

        .profile-pin-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 8px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
        }

        .profile-pin-student-name {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0 0 2px;
          color: var(--text-primary);
        }

        .profile-pin-student-sub {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .profile-pin-title {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
          color: var(--text-primary);
        }

        .profile-pin-desc {
          font-size: 0.86rem;
          color: var(--text-secondary);
          margin: 0 0 18px;
          line-height: 1.4;
          max-width: 290px;
        }

        .profile-pin-error-box {
          width: 100%;
          padding: 9px 14px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #EF4444;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .profile-pin-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .profile-pin-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }

        .profile-pin-field-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* 4 Discrete PIN Digit Boxes */
        .profile-pin-boxes-container {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          margin: 4px 0 10px;
        }

        .profile-pin-boxes-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }

        .profile-pin-digit-box {
          width: 52px;
          height: 56px;
          border-radius: 14px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--text-primary);
          transition: border-color 0.15s ease, background-color 0.15s ease;
          user-select: none;
          -webkit-user-select: none;
        }

        @media (max-width: 380px) {
          .profile-pin-boxes-row {
            gap: 8px;
          }
          .profile-pin-digit-box {
            width: 44px;
            height: 48px;
            border-radius: 11px;
            font-size: 1.25rem;
          }
        }

        .profile-pin-digit-box.active {
          border-color: var(--apple-blue, #0171E3);
          background: var(--bg-card);
        }

        .profile-pin-digit-box.filled {
          border-color: var(--apple-blue, #0171E3);
          color: var(--apple-blue, #0171E3);
        }

        [data-theme="dark"] .profile-pin-digit-box {
          background: #202124;
          border-color: #3C4043;
          color: #FFFFFF;
        }

        [data-theme="dark"] .profile-pin-digit-box.active {
          border-color: #8AB4F8;
          background: #292A2D;
        }

        [data-theme="dark"] .profile-pin-digit-box.filled {
          border-color: #8AB4F8;
          color: #8AB4F8;
        }

        .profile-pin-sr-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          z-index: 2;
          font-size: 16px !important;
          background: transparent;
          border: none;
          outline: none;
          color: transparent;
        }

        .profile-pin-toggle-wrap {
          display: flex;
          justify-content: center;
          margin: -4px 0 6px;
        }

        .profile-pin-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.15s ease;
        }

        .profile-pin-toggle-btn:hover {
          color: var(--text-primary);
        }

        [data-theme="dark"] .profile-pin-toggle-btn:hover {
          color: #FFFFFF;
        }

        .profile-pin-submit-btn {
          width: 100%;
          height: 48px;
          border-radius: 14px;
          background: var(--apple-blue, #0171E3);
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.18s ease, transform 0.12s ease;
        }

        .profile-pin-submit-btn:hover:not(:disabled) {
          background: var(--apple-blue-hover, #0155AB);
        }

        [data-theme="dark"] .profile-pin-submit-btn {
          background: #1A73E8;
          color: #FFFFFF;
        }

        [data-theme="dark"] .profile-pin-submit-btn:hover:not(:disabled) {
          background: #1557B0;
        }

        .profile-pin-submit-btn:disabled {
          background: var(--bg-secondary);
          color: var(--text-tertiary);
          border: 1px solid var(--border-color);
          cursor: not-allowed;
          opacity: 0.85;
        }

        [data-theme="dark"] .profile-pin-submit-btn:disabled {
          background: #202124;
          border-color: #363739;
          color: #80868B;
        }

        .profile-pin-forgot-wrap {
          margin-top: 4px;
        }

        .profile-pin-forgot-btn {
          background: transparent;
          border: none;
          color: var(--apple-blue, #0171E3);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }

        .profile-pin-forgot-btn:hover {
          text-decoration: underline;
        }

        .profile-pin-forgot-box {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          text-align: left;
        }

        .profile-pin-forgot-icon {
          color: var(--apple-blue, #0171E3);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .profile-pin-forgot-text {
          font-size: 0.78rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin: 0;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes modalScale {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-modalScale {
          animation: modalScale 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }

        .scale-active:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}
