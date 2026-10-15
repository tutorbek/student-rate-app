import React, { useState, useMemo, useEffect } from 'react';
import { renderAvatar, STUDENT_AVATARS } from '../../utils/studentAvatars';
import { AVATAR_GALLERY_IMAGES } from '../../utils/avatarGallery';
import { bindTelegramBackButton } from '../../utils/telegram';

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

export default function StudentAvatarPickerView({
  pinnedStudent = null,
  currentGroup = null,
  onSaveAvatar = null,
  onBack = null,
  showToast = null,
}) {
  useEffect(() => {
    if (typeof onBack === 'function') {
      const unbind = bindTelegramBackButton(onBack);
      return unbind;
    }
  }, [onBack]);

  // Current working avatar (preview)
  const [selectedAvatar, setSelectedAvatar] = useState(
    pinnedStudent?.emoji || AVATAR_GALLERY_IMAGES[0]?.path
  );
  const [avatarTab, setAvatarTab] = useState('gallery'); // 'gallery' | 'avatars'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Derive series / collection name for selected avatar
  const seriesName = useMemo(() => {
    if (!selectedAvatar) return "«Standart» seriyasi";

    // 1. Check if it's an SVG avatar
    const svgMatch = STUDENT_AVATARS.find(
      (item) => item.id === selectedAvatar || item.label === selectedAvatar
    );
    if (svgMatch) {
      return `«${svgMatch.label}» seriyasi`;
    }

    // 2. Check if it's a gallery image
    const galleryIndex = AVATAR_GALLERY_IMAGES.findIndex(
      (img) =>
        img.path === selectedAvatar ||
        img.cdnPath === selectedAvatar ||
        img.id === selectedAvatar ||
        img.name === selectedAvatar
    );
    if (galleryIndex !== -1) {
      // If first image or panda
      if (galleryIndex === 0) {
        return "«Kiber Panda» seriyasi";
      }
      const galleryItem = AVATAR_GALLERY_IMAGES[galleryIndex];
      return `«${galleryItem.label || `Surat ${galleryIndex + 1}`}» to'plami`;
    }

    return "«Kiber Panda» seriyasi";
  }, [selectedAvatar]);

  // Filtered lists
  const filteredGallery = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return AVATAR_GALLERY_IMAGES;
    return AVATAR_GALLERY_IMAGES.filter(
      (img) =>
        (img.label || '').toLowerCase().includes(q) ||
        (img.name || '').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredAvatars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STUDENT_AVATARS;
    return STUDENT_AVATARS.filter(
      (item) =>
        (item.label || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (key) => {
    triggerHaptic('light');
    setSelectedAvatar(key);
  };

  const handleSave = () => {
    triggerHaptic('medium');
    if (onSaveAvatar && pinnedStudent) {
      onSaveAvatar(selectedAvatar, pinnedStudent.id, pinnedStudent.name);
    }
    if (showToast) {
      showToast("Profilingiz rasmi muvaffaqiyatli saqlandi!", "success");
    }
    if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
    }
  };

  const handleLockedRobotClick = () => {
    triggerHaptic('medium');
    if (showToast) {
      showToast("Ushbu to'plam darsdagi maxsus yutuqlar uchun tez kunda ochiladi! 🚀", "info");
    }
  };

  return (
    <div className="student-avatar-picker-page animate-fadeIn">
      {/* 1. Top Navigation Bar */}
      <header className="picker-top-bar" aria-label="Avatar sahifasi navigatsiyasi">
        <button
          type="button"
          className="picker-back-btn"
          onClick={handleCancel}
          aria-label="Profilga qaytish"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="picker-back-text">Profilga qaytish</span>
        </button>

        <div className="picker-counter-badge" aria-label="114 xil avatar mavjud">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          <span>114 xil avatar</span>
        </div>
      </header>

      {/* 2. Hero Selected Avatar Card */}
      <section className="picker-hero-card" aria-label="Joriy tanlangan avatar">
        <div className="picker-hero-avatar-wrap">
          <div className="picker-hero-avatar-squircle">
            {renderAvatar(selectedAvatar, 92)}
          </div>
          <div className="picker-hero-check-badge" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="picker-hero-details">
          <span className="picker-hero-sublabel">Joriy tanlangan avatar</span>
          <h2 className="picker-hero-name">
            {pinnedStudent?.name || "Profil tanlanmagan"}
          </h2>
          <span className="picker-hero-series-tag">{seriesName}</span>
        </div>
      </section>

      {/* 3. Avatar Selection Grid Card */}
      <section className="picker-selection-card" aria-label="Profil rasmlari to'plami">
        <div className="picker-selection-header">
          <div className="picker-header-titles">
            <h3 className="picker-selection-title">Profil rasmi yoki avatari</h3>
            <p className="picker-selection-subtitle">O'zingizga yoqqan rasmni tanlang</p>
          </div>

          <button
            type="button"
            className={`picker-search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery('');
            }}
            title="Qidirish"
            aria-label="Qidirish"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* Collapsible Search Bar */}
        {isSearchOpen && (
          <div className="picker-search-bar-row animate-slideDown">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="picker-search-input"
              placeholder="Avatarni qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="picker-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Tozalash"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Segmented Category Tabs */}
        <div className="picker-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={avatarTab === 'gallery'}
            className={`picker-tab-btn ${avatarTab === 'gallery' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setAvatarTab('gallery');
            }}
          >
            Suratlar ({AVATAR_GALLERY_IMAGES.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={avatarTab === 'avatars'}
            className={`picker-tab-btn ${avatarTab === 'avatars' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setAvatarTab('avatars');
            }}
          >
            3D Avatarlar ({STUDENT_AVATARS.length})
          </button>
        </div>

        {/* 4-Column Grid */}
        <div className="picker-grid-container">
          {avatarTab === 'gallery' ? (
            <div className="picker-gallery-grid-4col">
              {filteredGallery.map((img) => {
                const isSelected =
                  selectedAvatar === img.path ||
                  selectedAvatar === img.cdnPath ||
                  selectedAvatar === img.id ||
                  selectedAvatar === img.name;

                return (
                  <button
                    key={img.id}
                    type="button"
                    className={`picker-item-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(img.path)}
                    title={img.label || 'Surat'}
                    aria-label={img.label || 'Surat'}
                  >
                    <div className="picker-item-thumb">
                      <img
                        src={img.path}
                        alt={img.label || 'avatar'}
                        loading="lazy"
                        decoding="async"
                        className="picker-thumb-img"
                        onError={(e) => {
                          if (img.cdnPath && e.currentTarget.src !== img.cdnPath) {
                            e.currentTarget.src = img.cdnPath;
                          }
                        }}
                      />
                    </div>
                    {isSelected && (
                      <div className="picker-item-check-badge">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="picker-gallery-grid-4col">
              {filteredAvatars.map((item) => {
                const isSelected =
                  selectedAvatar === item.id ||
                  selectedAvatar === item.label;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`picker-item-btn svg-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(item.id)}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <div className="picker-item-thumb">
                      {item.svg(46)}
                    </div>
                    {isSelected && (
                      <div className="picker-item-check-badge">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {avatarTab === 'gallery' && filteredGallery.length === 0 && (
            <div className="picker-empty-results">Mos keluvchi surat topilmadi</div>
          )}
          {avatarTab === 'avatars' && filteredAvatars.length === 0 && (
            <div className="picker-empty-results">Mos keluvchi avatar topilmadi</div>
          )}
        </div>

        {/* Special Locked Pack Card */}
        <div
          className="picker-locked-pack-card"
          onClick={handleLockedRobotClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLockedRobotClick();
            }
          }}
        >
          <div className="locked-pack-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
          </div>

          <div className="locked-pack-text">
            <h4 className="locked-pack-title">EPCHIL Robot to'plami</h4>
            <p className="locked-pack-desc">Maxsus dars yutuqlari uchun ochiladi</p>
          </div>

          <div className="locked-pack-lock-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
      </section>

      {/* 4. Bottom Action Buttons */}
      <footer className="picker-actions-footer">
        <button
          type="button"
          className="picker-save-primary-btn"
          onClick={handleSave}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Tanlangan avatarni saqlash</span>
        </button>

        <button
          type="button"
          className="picker-cancel-link-btn"
          onClick={handleCancel}
        >
          Bekor qilish
        </button>
      </footer>
    </div>
  );
}
