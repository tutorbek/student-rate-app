import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AVATAR_GALLERY_IMAGES } from '../utils/avatarGallery';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import './TeacherProfile.css';

/**
 * Teacher Profile — Compact Instagram-Style Redesign
 *
 * Strictly adheres to project rules:
 * - ZERO icons (no SVG, no Lucide, no emojis)
 * - NO pulsing/blinking live animations
 * - Compact, Apple Minimalist, high usability (UI/UX)
 */

const SUGGESTED_ACHIEVEMENTS = [
  "5+ yil tajriba",
  "500+ bitiruvchilar",
  "IELTS 8.5",
  "Xalqaro olimpiada murabbiyi",
  "Magistr darajasi",
  "Top universitetlar talabasi",
  "Oliy toifali pedagog",
  "Sertifikatlangan mutaxassis"
];

const getInitials = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

export default function TeacherProfile({
  teacherProfile = null,
  onSaveTeacherProfile,
  onLogout,
  groups = [],
  students = [],
  showToast = () => {}
}) {
  // Form & Profile State
  const [profileFullName, setProfileFullName] = useState(teacherProfile?.fullName || '');
  const [profileTitle, setProfileTitle] = useState(teacherProfile?.title || '');
  const [profileAvatar, setProfileAvatar] = useState(teacherProfile?.avatar || '');
  const [profileEducation, setProfileEducation] = useState(teacherProfile?.education || '');
  const [profileMotto, setProfileMotto] = useState(teacherProfile?.motto || '');
  const [profileAchievements, setProfileAchievements] = useState(teacherProfile?.achievements || []);
  const [profileCertificates, setProfileCertificates] = useState(teacherProfile?.certificates || []);
  const [profileTelegram, setProfileTelegram] = useState(teacherProfile?.social?.telegram || '');
  const [profileInstagram, setProfileInstagram] = useState(teacherProfile?.social?.instagram || '');

  // Sub-tabs: 'certificates' | 'edit' | 'achievements'
  const [activeSubTab, setActiveSubTab] = useState('certificates');

  // Modals state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [lightboxCert, setLightboxCert] = useState(null);

  // New certificate inputs
  const [certTitleInput, setCertTitleInput] = useState('');
  const [certYearInput, setCertYearInput] = useState('');
  const [certImageInput, setCertImageInput] = useState('');

  // New achievement input
  const [newAchievementText, setNewAchievementText] = useState('');

  // Status flags
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isUserDirtyRef = useRef(false);
  const autoSaveTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);

  // Stats calculation
  const groupsCount = useMemo(() => (groups || []).filter((g) => !g.deleted).length, [groups]);
  const studentsCount = useMemo(() => (students || []).filter((s) => !s.deleted).length, [students]);

  // Sync from props if user has not modified locally
  useEffect(() => {
    if (teacherProfile && !isUserDirtyRef.current) {
      setProfileFullName(teacherProfile.fullName || '');
      setProfileTitle(teacherProfile.title || '');
      setProfileAvatar(teacherProfile.avatar || '');
      setProfileEducation(teacherProfile.education || '');
      setProfileMotto(teacherProfile.motto || '');
      setProfileAchievements(teacherProfile.achievements || []);
      setProfileCertificates(teacherProfile.certificates || []);
      setProfileTelegram(teacherProfile.social?.telegram || '');
      setProfileInstagram(teacherProfile.social?.instagram || '');
    }
  }, [teacherProfile]);

  // Modal dismissal and background scroll lock
  const isAnyModalOpen = Boolean(showAvatarMenu || showGalleryModal || showAddCertModal || lightboxCert);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAvatarMenu(false);
        setShowGalleryModal(false);
        setShowAddCertModal(false);
        setLightboxCert(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isAnyModalOpen]);

  // Debounced auto-save to cloud & instant local backup
  useEffect(() => {
    if (!isUserDirtyRef.current) return;

    setIsDirty(true);

    const updated = {
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      avatar: profileAvatar,
      education: profileEducation.trim(),
      motto: profileMotto.trim(),
      achievements: profileAchievements.filter(Boolean),
      certificates: profileCertificates.filter(Boolean),
      social: {
        telegram: profileTelegram.trim().replace(/^@/, ''),
        instagram: profileInstagram.trim().replace(/^@/, '')
      }
    };

    try {
      const tId = localStorage.getItem('rsa_teacher_id');
      if (tId) {
        localStorage.setItem(`rsa_teacher_profile_${tId}`, JSON.stringify(updated));
      }
    } catch {}

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (onSaveTeacherProfile) {
        try {
          await onSaveTeacherProfile(updated);
          setIsDirty(false);
        } catch {}
      }
    }, 900);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    profileFullName,
    profileTitle,
    profileAvatar,
    profileEducation,
    profileMotto,
    profileAchievements,
    profileCertificates,
    profileTelegram,
    profileInstagram,
    onSaveTeacherProfile
  ]);

  // Manual save handler
  const handleSaveProfile = useCallback(async () => {
    if (!profileFullName.trim()) {
      showToast("Iltimos, ism-familiyangizni kiriting!", "warning");
      setActiveSubTab('edit');
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    triggerHaptic('medium');
    setIsSaving(true);

    const updated = {
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      avatar: profileAvatar,
      education: profileEducation.trim(),
      motto: profileMotto.trim(),
      achievements: profileAchievements.filter(Boolean),
      certificates: profileCertificates.filter(Boolean),
      social: {
        telegram: profileTelegram.trim().replace(/^@/, ''),
        instagram: profileInstagram.trim().replace(/^@/, '')
      }
    };

    try {
      const tId = localStorage.getItem('rsa_teacher_id');
      if (tId) {
        localStorage.setItem(`rsa_teacher_profile_${tId}`, JSON.stringify(updated));
      }
    } catch {}

    if (onSaveTeacherProfile) {
      await onSaveTeacherProfile(updated);
    }

    setIsSaving(false);
    setIsDirty(false);
    isUserDirtyRef.current = false;
    showToast("Profil ma'lumotlari saqlandi!", "success");
  }, [
    profileFullName,
    profileTitle,
    profileAvatar,
    profileEducation,
    profileMotto,
    profileAchievements,
    profileCertificates,
    profileTelegram,
    profileInstagram,
    onSaveTeacherProfile,
    showToast
  ]);

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (!isSaving) {
          handleSaveProfile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, handleSaveProfile]);

  // Avatar Upload Handlers
  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      showToast("Rasm hajmi 2.5MB dan oshmasligi kerak", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        isUserDirtyRef.current = true;
        setProfileAvatar(dataUrl);
        setShowAvatarMenu(false);
        showToast("Yangi surat yuklandi", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    triggerHaptic('light');
    isUserDirtyRef.current = true;
    setProfileAvatar('');
    setShowAvatarMenu(false);
    showToast("Surat olib tashlandi", "info");
  };

  // Certificate Handlers
  const handleCertFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      showToast("Sertifikat rasmi 3.5MB dan oshmasligi kerak", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setCertImageInput(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCertificateSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!certTitleInput.trim() && !certImageInput) {
      showToast("Sertifikat nomi yoki rasmini kiriting", "warning");
      return;
    }

    const newCert = {
      id: `cert_${Date.now()}`,
      title: certTitleInput.trim(),
      year: certYearInput.trim(),
      image: certImageInput
    };

    isUserDirtyRef.current = true;
    setProfileCertificates((prev) => [newCert, ...prev]);
    setCertTitleInput('');
    setCertYearInput('');
    setCertImageInput('');
    setShowAddCertModal(false);
    showToast("Yangi sertifikat qo'shildi", "success");
  };

  const handleRemoveCertificate = (certIdOrIndex) => {
    triggerHaptic('light');
    isUserDirtyRef.current = true;
    setProfileCertificates((prev) =>
      prev.filter((c, idx) => (c.id ? c.id !== certIdOrIndex : idx !== certIdOrIndex))
    );
    if (lightboxCert) setLightboxCert(null);
    showToast("Sertifikat o'chirildi", "info");
  };

  // Achievement Handlers
  const handleAddAchievement = (textToAdd) => {
    const clean = (textToAdd || newAchievementText).trim();
    if (!clean) return;
    if (profileAchievements.includes(clean)) {
      showToast("Ushbu yutuq allaqachon qo'shilgan", "info");
      return;
    }
    triggerHaptic('light');
    isUserDirtyRef.current = true;
    setProfileAchievements((prev) => [...prev, clean]);
    setNewAchievementText('');
  };

  const handleRemoveAchievement = (index) => {
    triggerHaptic('light');
    isUserDirtyRef.current = true;
    setProfileAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  // Social Links clean formatting
  const cleanTg = (profileTelegram || '').trim().replace(/^@/, '');
  const tgUrl = cleanTg
    ? cleanTg.startsWith('http')
      ? cleanTg
      : `https://t.me/${cleanTg}`
    : null;

  const cleanIg = (profileInstagram || '').trim().replace(/^@/, '');
  const igUrl = cleanIg
    ? cleanIg.startsWith('http')
      ? cleanIg
      : `https://instagram.com/${cleanIg}`
    : null;

  return (
    <div className="teacher-profile-insta-wrap fade-in">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileUpload}
        style={{ display: 'none' }}
      />

      {/* Main Instagram Profile Card */}
      <div className="insta-profile-card">
        {/* Top Header: Avatar + 3 Stats */}
        <div className="insta-header-row">
          <div className="insta-avatar-col">
            <div
              className="insta-avatar-ring"
              onClick={() => {
                triggerHaptic('light');
                setShowAvatarMenu(true);
              }}
              title="Suratni o'zgartirish"
            >
              <div className="insta-avatar-disc">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="Ustoz" className="insta-avatar-img" />
                ) : (
                  <span className="insta-avatar-initials">{getInitials(profileFullName)}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="insta-avatar-micro-btn"
              onClick={() => {
                triggerHaptic('light');
                setShowAvatarMenu(true);
              }}
            >
              Suratni o'zgartirish
            </button>
          </div>

          <div className="insta-stats-cluster">
            <div
              className="insta-stat-col"
              onClick={() => {
                triggerHaptic('light');
                setActiveSubTab('certificates');
              }}
            >
              <span className="insta-stat-value">{groupsCount}</span>
              <span className="insta-stat-label">guruhlar</span>
            </div>

            <div
              className="insta-stat-col"
              onClick={() => {
                triggerHaptic('light');
                setActiveSubTab('certificates');
              }}
            >
              <span className="insta-stat-value">{studentsCount}</span>
              <span className="insta-stat-label">o'quvchilar</span>
            </div>

            <div
              className="insta-stat-col"
              onClick={() => {
                triggerHaptic('light');
                setActiveSubTab('certificates');
              }}
            >
              <span className="insta-stat-value">{profileCertificates.length}</span>
              <span className="insta-stat-label">sertifikatlar</span>
            </div>
          </div>
        </div>

        {/* Bio Details */}
        <div className="insta-bio-block">
          <h1 className="insta-bio-name">{profileFullName || "Ustoz Ismi"}</h1>
          <div className="insta-bio-title">{profileTitle || "Katta o'qituvchi va murabbiy"}</div>
          {profileEducation && <div className="insta-bio-edu">{profileEducation}</div>}
          {profileMotto && <blockquote className="insta-bio-motto">“{profileMotto}”</blockquote>}

          {/* Social Links */}
          {(tgUrl || igUrl) && (
            <div className="insta-social-pills">
              {tgUrl && (
                <a
                  href={tgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insta-social-pill"
                >
                  <span className="insta-social-pill-prefix">Telegram:</span>
                  <span>@{cleanTg}</span>
                </a>
              )}
              {igUrl && (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insta-social-pill"
                >
                  <span className="insta-social-pill-prefix">Instagram:</span>
                  <span>@{cleanIg}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="insta-action-bar">
          <button
            type="button"
            className="insta-btn insta-btn-primary"
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab((prev) => (prev === 'edit' ? 'certificates' : 'edit'));
            }}
          >
            {activeSubTab === 'edit' ? "Ko'rish" : "Tahrirlash"}
          </button>

          <button
            type="button"
            className="insta-btn insta-btn-secondary"
            onClick={() => {
              triggerHaptic('light');
              setShowAvatarMenu(true);
            }}
          >
            Surat
          </button>

          <button
            type="button"
            className={`insta-btn insta-btn-save ${!isDirty && !isSaving ? 'is-saved' : ''}`}
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? "Saqlanmoqda..." : isDirty ? "Saqlash" : "Saqlangan"}
          </button>

          <button
            type="button"
            className="insta-btn insta-btn-danger"
            onClick={() => {
              triggerHaptic('medium');
              if (onLogout) onLogout();
            }}
          >
            Chiqish
          </button>
        </div>

        {/* Story Highlights: Achievements */}
        <div className="insta-highlights-strip">
          <div className="insta-highlights-head">
            <span className="insta-highlights-title">Yutuqlar va Tajriba</span>
            <button
              type="button"
              className="insta-avatar-micro-btn"
              onClick={() => {
                triggerHaptic('light');
                setActiveSubTab('achievements');
              }}
            >
              Barchasini ko'rish ({profileAchievements.length})
            </button>
          </div>

          <div className="insta-highlights-scroll">
            {profileAchievements.map((ach, idx) => (
              <span key={idx} className="insta-highlight-chip">
                <span>{ach}</span>
                {activeSubTab === 'edit' && (
                  <button
                    type="button"
                    className="insta-highlight-remove"
                    onClick={() => handleRemoveAchievement(idx)}
                    title="O'chirish"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            <button
              type="button"
              className="insta-highlight-add-btn"
              onClick={() => {
                triggerHaptic('light');
                setActiveSubTab('achievements');
              }}
            >
              + Yangi yutuq
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Instagram style) */}
        <div className="insta-tabs-bar">
          <button
            type="button"
            className={`insta-tab-btn ${activeSubTab === 'certificates' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('certificates');
            }}
          >
            SERTIFIKATLAR ({profileCertificates.length})
          </button>

          <button
            type="button"
            className={`insta-tab-btn ${activeSubTab === 'edit' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('edit');
            }}
          >
            MA'LUMOTLAR
          </button>

          <button
            type="button"
            className={`insta-tab-btn ${activeSubTab === 'achievements' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('achievements');
            }}
          >
            YUTUQLAR ({profileAchievements.length})
          </button>
        </div>

        {/* TAB 1: Sertifikatlar Grid (Instagram 3x3 photo grid) */}
        {activeSubTab === 'certificates' && (
          <div className="insta-tab-pane">
            <div className="insta-feed-grid">
              {/* Add New Certificate Tile */}
              <div
                className="insta-grid-add-tile"
                onClick={() => {
                  triggerHaptic('light');
                  setShowAddCertModal(true);
                }}
              >
                <span className="insta-grid-add-plus">+</span>
                <span className="insta-grid-add-text">Sertifikat qo'shish</span>
              </div>

              {/* Certificates items */}
              {profileCertificates.map((cert, index) => (
                <div
                  key={cert.id || index}
                  className="insta-grid-item"
                  onClick={() => {
                    triggerHaptic('light');
                    setLightboxCert(cert);
                  }}
                >
                  {cert.image ? (
                    <img src={cert.image} alt={cert.title || 'Sertifikat'} className="insta-grid-img" />
                  ) : (
                    <div className="insta-grid-typographic">
                      <span className="insta-grid-typo-badge">Sertifikat</span>
                      <span className="insta-grid-typo-title">{cert.title || "Nomsiz sertifikat"}</span>
                      {cert.year && <span className="insta-grid-typo-year">{cert.year}</span>}
                    </div>
                  )}

                  <div className="insta-grid-hover-overlay">
                    <span className="insta-grid-hover-title">{cert.title || "Sertifikat"}</span>
                    {cert.year && <span className="insta-grid-hover-year">{cert.year}</span>}
                  </div>
                </div>
              ))}
            </div>

            {profileCertificates.length === 0 && (
              <div className="insta-empty-state" style={{ marginTop: '12px' }}>
                <h4 className="insta-empty-title">Hozircha sertifikatlar mavjud emas</h4>
                <p className="insta-empty-sub">Erishgan diplom va sertifikatlaringizni yuklab profilingizni boyiting</p>
                <button
                  type="button"
                  className="insta-btn insta-btn-primary"
                  onClick={() => setShowAddCertModal(true)}
                >
                  Sertifikat yuklash
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Compact Form Editor */}
        {activeSubTab === 'edit' && (
          <div className="insta-tab-pane">
            <div className="insta-form-compact">
              <div className="insta-form-field">
                <label className="insta-form-label">Ism va Familiya *</label>
                <input
                  type="text"
                  className="insta-input"
                  placeholder="Masalan: Bekzod Raxmonov"
                  value={profileFullName}
                  onChange={(e) => {
                    isUserDirtyRef.current = true;
                    setProfileFullName(e.target.value);
                  }}
                />
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Mutaxassislik / Unvon</label>
                <input
                  type="text"
                  className="insta-input"
                  placeholder="Masalan: Katta Matematika ustozi"
                  value={profileTitle}
                  onChange={(e) => {
                    isUserDirtyRef.current = true;
                    setProfileTitle(e.target.value);
                  }}
                />
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Ta'lim / Universitet</label>
                <input
                  type="text"
                  className="insta-input"
                  placeholder="Masalan: O'zbekiston Milliy Universiteti"
                  value={profileEducation}
                  onChange={(e) => {
                    isUserDirtyRef.current = true;
                    setProfileEducation(e.target.value);
                  }}
                />
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Motivatsion shior / Fikringiz</label>
                <textarea
                  className="insta-textarea"
                  rows={2}
                  placeholder="O'quvchilarga ilhom beruvchi shior..."
                  value={profileMotto}
                  onChange={(e) => {
                    isUserDirtyRef.current = true;
                    setProfileMotto(e.target.value);
                  }}
                />
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Telegram (username yoki havola)</label>
                <div className="insta-input-with-prefix">
                  <span className="insta-prefix-badge">@</span>
                  <input
                    type="text"
                    className="insta-input-clean"
                    placeholder="username yoki t.me/havola"
                    value={profileTelegram}
                    onChange={(e) => {
                      isUserDirtyRef.current = true;
                      setProfileTelegram(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Instagram (username)</label>
                <div className="insta-input-with-prefix">
                  <span className="insta-prefix-badge">@</span>
                  <input
                    type="text"
                    className="insta-input-clean"
                    placeholder="username"
                    value={profileInstagram}
                    onChange={(e) => {
                      isUserDirtyRef.current = true;
                      setProfileInstagram(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="insta-form-status-bar">
                <span className="insta-form-notice">
                  {isSaving ? "Saqlanmoqda..." : isDirty ? "O'zgarishlar kiritildi..." : "Barcha o'zgarishlar saqlangan"}
                </span>
                <button
                  type="button"
                  className="insta-btn insta-btn-primary"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Achievements Management */}
        {activeSubTab === 'achievements' && (
          <div className="insta-tab-pane">
            <div className="insta-achievements-manager">
              <form
                className="insta-ach-add-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddAchievement();
                }}
              >
                <input
                  type="text"
                  className="insta-input"
                  style={{ flex: 1 }}
                  placeholder="Yangi yutuq (masalan: 5+ yil tajriba)"
                  value={newAchievementText}
                  onChange={(e) => setNewAchievementText(e.target.value)}
                />
                <button
                  type="submit"
                  className="insta-btn insta-btn-primary"
                  disabled={!newAchievementText.trim()}
                >
                  Qo'shish
                </button>
              </form>

              <div className="insta-suggestions-box">
                <span className="insta-suggestions-title">Tezkor tavsiyalar (bosib qo'shing):</span>
                <div className="insta-suggestions-chips">
                  {SUGGESTED_ACHIEVEMENTS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      className="insta-sug-chip"
                      onClick={() => handleAddAchievement(sug)}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="insta-ach-list">
                {profileAchievements.map((ach, idx) => (
                  <div key={idx} className="insta-ach-item">
                    <span>{ach}</span>
                    <button
                      type="button"
                      className="insta-ach-item-del"
                      onClick={() => handleRemoveAchievement(idx)}
                    >
                      O'chirish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Avatar Actions Bottom Sheet */}
      {showAvatarMenu && typeof document !== 'undefined' && createPortal(
        <div className="insta-modal-overlay" onClick={() => setShowAvatarMenu(false)}>
          <div className="insta-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="insta-modal-header">
              <h3 className="insta-modal-title">Profil suratini tanlash</h3>
              <button
                type="button"
                className="insta-modal-close-text"
                onClick={() => setShowAvatarMenu(false)}
              >
                Yopish
              </button>
            </div>

            <div className="insta-avatar-actions-list">
              <button
                type="button"
                className="insta-avatar-action-row primary-action"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                Fayldan yangi rasm yuklash
              </button>

              <button
                type="button"
                className="insta-avatar-action-row"
                onClick={() => {
                  setShowAvatarMenu(false);
                  setShowGalleryModal(true);
                }}
              >
                Tayyor galereyadan tanlash
              </button>

              {profileAvatar && (
                <button
                  type="button"
                  className="insta-avatar-action-row danger-action"
                  onClick={handleRemoveAvatar}
                >
                  Suratni olib tashlash
                </button>
              )}

              <button
                type="button"
                className="insta-avatar-action-row"
                onClick={() => setShowAvatarMenu(false)}
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Gallery Modal */}
      {showGalleryModal && typeof document !== 'undefined' && createPortal(
        <div className="insta-modal-overlay" onClick={() => setShowGalleryModal(false)}>
          <div className="insta-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="insta-modal-header">
              <h3 className="insta-modal-title">Galereyadan surat tanlang</h3>
              <button
                type="button"
                className="insta-modal-close-text"
                onClick={() => setShowGalleryModal(false)}
              >
                Yopish
              </button>
            </div>

            <div className="insta-gallery-grid">
              {AVATAR_GALLERY_IMAGES.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`insta-gallery-item ${profileAvatar === img.path ? 'is-active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light');
                    isUserDirtyRef.current = true;
                    setProfileAvatar(img.path);
                    setShowGalleryModal(false);
                    showToast("Surat tanlandi", "success");
                  }}
                  title={img.label}
                >
                  <img src={img.path} alt={img.label} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Add Certificate Modal */}
      {showAddCertModal && typeof document !== 'undefined' && createPortal(
        <div className="insta-modal-overlay" onClick={() => setShowAddCertModal(false)}>
          <div className="insta-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="insta-modal-header">
              <h3 className="insta-modal-title">Yangi sertifikat qo'shish</h3>
              <button
                type="button"
                className="insta-modal-close-text"
                onClick={() => setShowAddCertModal(false)}
              >
                Yopish
              </button>
            </div>

            <form onSubmit={handleAddCertificateSubmit} className="insta-form-compact">
              <input
                ref={certFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCertFileUpload}
                style={{ display: 'none' }}
              />

              <div className="insta-form-field">
                <label className="insta-form-label">Sertifikat nomi *</label>
                <input
                  type="text"
                  className="insta-input"
                  placeholder="Masalan: IELTS 8.5 yoki Oliy Toifa Diplomi"
                  value={certTitleInput}
                  onChange={(e) => setCertTitleInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Berilgan yili</label>
                <input
                  type="text"
                  className="insta-input"
                  placeholder="Masalan: 2024"
                  value={certYearInput}
                  onChange={(e) => setCertYearInput(e.target.value)}
                />
              </div>

              <div className="insta-form-field">
                <label className="insta-form-label">Sertifikat rasmi</label>
                {certImageInput ? (
                  <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    <img src={certImageInput} alt="Sertifikat" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <button
                      type="button"
                      className="insta-btn insta-btn-danger"
                      style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '0.74rem' }}
                      onClick={() => setCertImageInput('')}
                    >
                      O'chirish
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="insta-btn insta-btn-secondary"
                    onClick={() => {
                      if (certFileInputRef.current) certFileInputRef.current.click();
                    }}
                  >
                    Rasm faylini yuklash
                  </button>
                )}
              </div>

              <div className="insta-form-status-bar" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="insta-btn insta-btn-secondary"
                  onClick={() => setShowAddCertModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="insta-btn insta-btn-primary"
                  disabled={!certTitleInput.trim() && !certImageInput}
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: Certificate Lightbox Preview */}
      {lightboxCert && typeof document !== 'undefined' && createPortal(
        <div className="insta-modal-overlay" onClick={() => setLightboxCert(null)}>
          <div className="insta-cert-lightbox-card" onClick={(e) => e.stopPropagation()}>
            {lightboxCert.image && (
              <div className="insta-cert-lightbox-img-wrap">
                <img
                  src={lightboxCert.image}
                  alt={lightboxCert.title || 'Sertifikat'}
                  className="insta-cert-lightbox-img"
                />
              </div>
            )}

            <div className="insta-cert-lightbox-info">
              <h3 className="insta-cert-lightbox-title">{lightboxCert.title || "Sertifikat"}</h3>
              {lightboxCert.year && (
                <div className="insta-cert-lightbox-year">Berilgan yili: {lightboxCert.year}</div>
              )}

              <div className="insta-cert-lightbox-actions">
                <button
                  type="button"
                  className="insta-btn insta-btn-danger"
                  onClick={() => handleRemoveCertificate(lightboxCert.id)}
                >
                  O'chirish
                </button>
                <button
                  type="button"
                  className="insta-btn insta-btn-secondary"
                  onClick={() => setLightboxCert(null)}
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
