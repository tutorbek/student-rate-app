import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { renderAvatar, STUDENT_AVATARS } from '../../utils/studentAvatars';
import {
  AVATAR_GALLERY_IMAGES,
  getAvatarGalleryPrice,
  isAvatarGalleryFree,
  isAvatarUnlockedForStudent,
  sanitizeStudentAvatar,
  getGalleryAvatarIndex,
  FREE_GALLERY_AVATAR_COUNT,
} from '../../utils/avatarGallery';
import { preloadAvatars, markAvatarLoaded, isAvatarLoaded } from '../../utils/avatarCache';
import { ProjectLikeIcon, LockIcon, UnlockIcon, XIcon } from './StudentIcons';

// Pre-create instant O(1) lookup map for gallery items
const GALLERY_ITEM_MAP = new Map(
  AVATAR_GALLERY_IMAGES.map((img, idx) => [
    img.id,
    {
      index: idx,
      price: getAvatarGalleryPrice(idx),
      isFree: isAvatarGalleryFree(idx),
    },
  ])
);

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
  onUnlockAvatar = null,
  totalScore = 0,
  onBack = null,
  showToast = null,
}) {
  // Current working avatar (preview, strictly free by default unless unlocked)
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return sanitizeStudentAvatar(pinnedStudent) || AVATAR_GALLERY_IMAGES[0]?.path;
  });
  const [avatarTab, setAvatarTab] = useState('gallery'); // 'gallery' | 'avatars'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Unlocked avatars tracking for this student (loaded once into memory)
  const [localUnlockedAvatars, setLocalUnlockedAvatars] = useState(() => {
    const s = new Set();
    if (pinnedStudent?.unlockedAvatars && Array.isArray(pinnedStudent.unlockedAvatars)) {
      pinnedStudent.unlockedAvatars.forEach((k) => s.add(k));
    }
    if (pinnedStudent?.id) {
      try {
        const cached = localStorage.getItem(`rsa_unlocked_avatars_${pinnedStudent.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach((k) => s.add(k));
          }
        }
      } catch {}
    }
    return s;
  });

  // Modal item for unlocking
  const [unlockModalItem, setUnlockModalItem] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const overlayRef = useRef(null);

  // Standard modal dismissal & zero-shift body + html scroll locking
  useModalDismiss(Boolean(unlockModalItem), () => {
    if (!isUnlocking) {
      setUnlockModalItem(null);
    }
  });

  // Non-passive event listener on the modal overlay to prevent touchmove & wheel event leakage to background
  useEffect(() => {
    if (!unlockModalItem) return;
    const el = overlayRef.current;
    if (!el) return;

    const preventTouch = (e) => {
      // If the event target is the overlay itself or within a non-scrolling modal, block the gesture
      if (e.target === el || !e.target.closest?.('.picker-scrollable')) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchmove', preventTouch, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventTouch);
    };
  }, [unlockModalItem]);

  // Helper: check if a gallery item is unlocked (pure in-memory O(1) checks)
  const isItemUnlocked = (img, originalIndex) => {
    if (isAvatarGalleryFree(originalIndex)) return true;
    if (localUnlockedAvatars.has(img.path) || localUnlockedAvatars.has(img.cdnPath) || localUnlockedAvatars.has(img.id)) {
      return true;
    }
    return isAvatarUnlockedForStudent(pinnedStudent, img.path, originalIndex, true);
  };

  const handleItemClick = (img, originalIndex, price, isUnlocked) => {
    if (isUnlocked) {
      handleSelect(img.path);
    } else {
      triggerHaptic('light');
      setUnlockModalItem({
        ...img,
        price,
        index: originalIndex,
        seriesName: img.label ? `«${img.label}» to'plami` : `Surat ${originalIndex + 1}`,
      });
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockModalItem || !pinnedStudent) return;
    if ((totalScore || 0) < unlockModalItem.price) {
      if (showToast) showToast("Yetarli Like mavjud emas!", "warning");
      return;
    }

    setIsUnlocking(true);
    triggerHaptic('medium');

    try {
      if (onUnlockAvatar) {
        await onUnlockAvatar(
          unlockModalItem.path,
          unlockModalItem.price,
          pinnedStudent.id,
          unlockModalItem.label || `Surat ${unlockModalItem.index + 1}`,
          pinnedStudent.name
        );
      } else if (onSaveAvatar) {
        onSaveAvatar(unlockModalItem.path, pinnedStudent.id, pinnedStudent.name);
      }

      setLocalUnlockedAvatars((prev) => {
        const next = new Set(prev);
        next.add(unlockModalItem.path);
        return next;
      });

      setSelectedAvatar(unlockModalItem.path);

      if (showToast) {
        showToast(`«${unlockModalItem.label || 'Avatar'}» muvaffaqiyatli ochildi!`, 'success');
      }

      setUnlockModalItem(null);
    } catch (err) {
      console.error('Failed to unlock avatar:', err);
      if (showToast) {
        showToast("Xatolik yuz berdi, qaytadan urinib ko'ring", "error");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  // Preload initial batch of gallery avatars immediately
  useEffect(() => {
    const initialBatch = AVATAR_GALLERY_IMAGES.slice(0, 16).map((img) => img.path);
    preloadAvatars(initialBatch);
  }, []);


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
    // Paid gallery avatars cannot be saved unless purchased
    const galleryIdx = getGalleryAvatarIndex(selectedAvatar);
    if (galleryIdx >= FREE_GALLERY_AVATAR_COUNT) {
      const unlocked =
        localUnlockedAvatars.has(selectedAvatar) ||
        isAvatarUnlockedForStudent(pinnedStudent, selectedAvatar, galleryIdx, true);
      if (!unlocked) {
        if (showToast) showToast("Ushbu avatar qulflangan, avval Like evaziga ochish lozim!", "warning");
        return;
      }
    }
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
      showToast("Ushbu to'plam darsdagi maxsus yutuqlar uchun tez kunda ochiladi!", "info");
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="picker-balance-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '12px', background: 'rgba(52, 199, 89, 0.12)', border: '1px solid rgba(52, 199, 89, 0.28)', fontSize: '0.82rem', fontWeight: 700, color: '#248A3D' }}>
            <ProjectLikeIcon size={13} color="#248A3D" />
            <span>{totalScore || 0} Like</span>
          </div>
        </div>
      </header>

      {/* 2. Hero Selected Avatar Card */}
      <section className="picker-hero-card" aria-label="Joriy tanlangan avatar">
        <div className="picker-hero-avatar-wrap">
          <div className="picker-hero-avatar-squircle">
            {renderAvatar(selectedAvatar, 92, { priority: 'high', eager: true })}
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

        {/* Primary Save Button moved directly under selected avatar info */}
        <button
          type="button"
          className="picker-save-primary-btn scale-active"
          onClick={handleSave}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Tanlangan avatarni saqlash</span>
        </button>
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
              {filteredGallery.map((img, idx) => {
                const meta = GALLERY_ITEM_MAP.get(img.id) || { index: idx, price: 0, isFree: true };
                const price = meta.price;
                const isUnlocked = meta.isFree || isItemUnlocked(img, meta.index);

                const isSelected =
                  selectedAvatar === img.path ||
                  selectedAvatar === img.cdnPath ||
                  selectedAvatar === img.id ||
                  selectedAvatar === img.name;
                const isCached = isAvatarLoaded(img.path);
                const shouldBeEager = idx < 12 || isCached;

                return (
                  <button
                    key={img.id}
                    type="button"
                    className={`picker-item-btn ${isSelected ? 'is-selected' : ''} ${!isUnlocked ? 'is-locked' : ''}`}
                    onClick={() => handleItemClick(img, meta.index, price, isUnlocked)}
                    aria-label={`${img.label || 'Surat'}${!isUnlocked ? ` (${price} Like)` : ''}`}
                  >
                    <div className="picker-item-thumb">
                      <img
                        src={img.path}
                        alt={img.label || 'avatar'}
                        loading={shouldBeEager ? 'eager' : 'lazy'}
                        decoding={isCached ? 'sync' : 'async'}
                        className="picker-thumb-img"
                        onLoad={() => markAvatarLoaded(img.path)}
                        onError={(e) => {
                          if (img.cdnPath && e.currentTarget.src !== img.cdnPath) {
                            e.currentTarget.src = img.cdnPath;
                          }
                        }}
                      />
                    </div>

                    {/* Locked Indicators */}
                    {!isUnlocked && (
                      <>
                        <div className="picker-item-lock-badge" aria-label="Qulflangan">
                          <LockIcon size={11} color="#FFF" />
                        </div>
                        <div className="picker-item-price-badge">
                          <ProjectLikeIcon size={9} color="#FFD60A" />
                          <span>{price} Like</span>
                        </div>
                      </>
                    )}

                    {/* Selected Check Badge (Only if unlocked) */}
                    {isUnlocked && isSelected && (
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

      {/* 4. Unlock Confirmation Pop-up Modal rendered via Portal to document.body */}
      {typeof document !== 'undefined' && unlockModalItem && createPortal(
        <div
          ref={overlayRef}
          className="modal-overlay avatar-unlock-modal-overlay animate-fadeIn"
          onClick={() => !isUnlocking && setUnlockModalItem(null)}
          onWheel={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-modal-title"
        >
          <div
            className="avatar-unlock-modal animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="avatar-unlock-modal-header">
              <h3 id="unlock-modal-title" className="avatar-unlock-modal-title">
                Avatarni ochish
              </h3>
              <button
                type="button"
                className="avatar-unlock-close-btn"
                disabled={isUnlocking}
                onClick={() => setUnlockModalItem(null)}
                aria-label="Yopish"
              >
                <XIcon size={14} />
              </button>
            </div>

            <div className="avatar-unlock-modal-body">
              {/* Natural / Standard Size Avatar Image (not huge!) */}
              <div className="avatar-unlock-preview-squircle">
                <img
                  src={unlockModalItem.path}
                  alt={unlockModalItem.label || 'Avatar'}
                  className="avatar-unlock-preview-img"
                />
              </div>

              <h4 className="avatar-unlock-item-name">
                {unlockModalItem.label || `Surat ${unlockModalItem.index + 1}`}
              </h4>
              <span className="avatar-unlock-series-tag">
                {unlockModalItem.seriesName}
              </span>

              {/* Price & Balance Box */}
              <div className="avatar-unlock-info-box">
                <div className="avatar-unlock-price-row">
                  <span className="avatar-unlock-price-label">Narxi:</span>
                  <span className="avatar-unlock-price-val">
                    <ProjectLikeIcon size={15} color="#FF9500" />
                    <span>{unlockModalItem.price} Like</span>
                  </span>
                </div>

                <div className="avatar-unlock-balance-row">
                  <span className="avatar-unlock-balance-label">Sizning balansingiz:</span>
                  <span className="avatar-unlock-balance-val">
                    <ProjectLikeIcon size={13} color="#34C759" />
                    <span>{totalScore || 0} Like</span>
                  </span>
                </div>

                <div className="avatar-unlock-status-note">
                  {(totalScore || 0) >= unlockModalItem.price ? (
                    <span className="status-sufficient">
                      Ochilgandan so'ng: <strong>{(totalScore || 0) - unlockModalItem.price} Like</strong> qoladi
                    </span>
                  ) : (
                    <span className="status-insufficient">
                      Yetarli Like mavjud emas (yana <strong>{unlockModalItem.price - (totalScore || 0)} Like</strong> kerak)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="avatar-unlock-modal-actions">
                {(totalScore || 0) >= unlockModalItem.price ? (
                  <button
                    type="button"
                    className="avatar-unlock-action-primary-btn scale-active"
                    disabled={isUnlocking}
                    onClick={handleConfirmUnlock}
                  >
                    <UnlockIcon size={15} color="#FFF" />
                    <span>{isUnlocking ? "Ochilmoqda..." : `${unlockModalItem.price} Like evaziga ochish`}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="avatar-unlock-action-disabled-btn"
                    disabled
                  >
                    <LockIcon size={15} color="var(--text-tertiary)" />
                    <span>Yetarli Like yo'q</span>
                  </button>
                )}

                <button
                  type="button"
                  className="avatar-unlock-cancel-btn"
                  disabled={isUnlocking}
                  onClick={() => setUnlockModalItem(null)}
                >
                  Bekor qilish
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
