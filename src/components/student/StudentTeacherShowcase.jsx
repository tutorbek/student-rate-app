import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar } from '../../utils/studentAvatars';

export default function StudentTeacherShowcase({ teacherProfile, isPreview = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [lightboxCert, setLightboxCert] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const triggerHaptic = (style = 'light') => {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {}
  };

  const handleOpen = () => {
    triggerHaptic('light');
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isClosing) return;
    triggerHaptic('light');
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 240);
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    if (e.changedTouches && e.changedTouches[0]) {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchEndY - touchStartY > 65) {
        handleClose();
      }
    }
    setTouchStartY(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen && !lightboxCert) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxCert) {
          setLightboxCert(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, lightboxCert]);

  // If teacher profile is not filled out, do not display anything!
  if (!teacherProfile || !teacherProfile.fullName || !teacherProfile.fullName.trim()) {
    return null;
  }

  const {
    fullName = '',
    title = '',
    avatar = '',
    education = '',
    motto = '',
    achievements = [],
    certificates = [],
    social = {}
  } = teacherProfile;

  const validAchievements = (achievements || []).filter((a) => typeof a === 'string' && a.trim().length > 0);
  const validCertificates = (certificates || []).filter((c) => c && (c.image || c.title));
  const hasSocial = Boolean(social?.telegram?.trim() || social?.instagram?.trim());

  const cleanTelegram = (social?.telegram || '').trim();
  const telegramUrl = cleanTelegram
    ? cleanTelegram.startsWith('http')
      ? cleanTelegram
      : `https://t.me/${cleanTelegram.replace('@', '')}`
    : null;

  const cleanInstagram = (social?.instagram || '').trim();
  const instagramUrl = cleanInstagram
    ? cleanInstagram.startsWith('http')
      ? cleanInstagram
      : `https://instagram.com/${cleanInstagram.replace('@', '').replace('/', '')}`
    : null;

  return (
    <>
      {/* 1. COMPACT APPLE-STYLE SHOWCASE CARD (MINIMALIST, NO ICONS) */}
      <div
        className={`teacher-showcase-card ${isPreview ? 'is-preview-mode' : ''}`}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label={`${fullName} - Ustoz haqida ma'lumot`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <div className="showcase-card-inner">
          {/* Avatar (Clean circle, no cluttered badges) */}
          <div className="showcase-avatar-circle">
            {renderAvatar(avatar || '👤', 48)}
          </div>

          {/* Info Details */}
          <div className="showcase-info-col">
            <div className="showcase-header-line">
              <div className="showcase-name-wrap">
                <h3 className="showcase-teacher-name">{fullName}</h3>
                <span className="showcase-role-tag">Ustoz</span>
              </div>
              <span className="showcase-action-cue">Batafsil</span>
            </div>

            {title.trim() && (
              <p className="showcase-teacher-title">{title}</p>
            )}

            {/* Achievement Badges without icons */}
            {validAchievements.length > 0 && (
              <div className="showcase-chips-wrap">
                {validAchievements.slice(0, 3).map((ach, idx) => {
                  const cleanText = ach.replace(/^[\s✨🏆📜🎓⭐]+/u, '').trim();
                  return (
                    <span key={idx} className="showcase-text-pill">
                      {cleanText}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. FULL MODAL / BOTTOM SHEET DIALOG */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`sheet-backdrop ${isClosing ? 'is-closing' : 'animate-backdropFadeIn'}`}
          onClick={handleClose}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className={`sheet-container teacher-detail-sheet ${isClosing ? 'is-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-modal-name"
          >
            {/* Top Right Close Button */}
            <button
              type="button"
              className="teacher-sheet-close-btn"
              onClick={handleClose}
              aria-label="Yopish"
              title="Yopish"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="teacher-sheet-scrollable-content">
              {/* Header Hero Section */}
              <div className="teacher-modal-hero">
                <div className="teacher-modal-avatar-box">
                  {renderAvatar(avatar || '👤', 76)}
                </div>

                <span className="teacher-modal-role-pill">Guruh Ustozi</span>

                <h3 id="teacher-modal-name" className="teacher-modal-name">
                  {fullName}
                </h3>

                {title.trim() && (
                  <p className="teacher-modal-title">{title}</p>
                )}

                {/* Education Badge (Clean text, no icon) */}
                {education.trim() && (
                  <div className="teacher-modal-edu-badge">
                    <span>{education}</span>
                  </div>
                )}
              </div>

              {/* Motto / Bio Quote Card */}
              {motto.trim() && (
                <div className="teacher-modal-quote-card">
                  <span className="quote-icon-mark">“</span>
                  <p className="quote-text-content">{motto}</p>
                </div>
              )}

              {/* Key Achievements Chips (No icons) */}
              {validAchievements.length > 0 && (
                <div className="teacher-modal-section">
                  <h4 className="teacher-section-header-title">
                    Yutuqlar va tajriba
                  </h4>
                  <div className="teacher-achievements-chips-wrap">
                    {validAchievements.map((ach, idx) => {
                      const cleanText = ach.replace(/^[\s✨🏆📜🎓⭐]+/u, '').trim();
                      return (
                        <div key={idx} className="teacher-achievement-chip">
                          <span className="achievement-chip-text">{cleanText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Certificates & Diplomas Gallery */}
              {validCertificates.length > 0 && (
                <div className="teacher-modal-section">
                  <h4 className="teacher-section-header-title">
                    Sertifikat va diplomlar <span className="section-count-badge">{validCertificates.length}</span>
                  </h4>
                  <div className="teacher-certificates-scroll-row">
                    {validCertificates.map((cert) => (
                      <div
                        key={cert.id || cert.title}
                        className="teacher-cert-card"
                        onClick={() => setLightboxCert(cert)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${cert.title || 'Sertifikat'}ni kattalashtirib ko'rish`}
                      >
                        <div className="cert-card-img-wrap">
                          {cert.image ? (
                            <img
                              src={cert.image}
                              alt={cert.title || 'Sertifikat'}
                              loading="lazy"
                            />
                          ) : (
                            <div className="cert-placeholder">
                              <span>📜</span>
                            </div>
                          )}
                          <div className="cert-zoom-overlay">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              <line x1="11" y1="8" x2="11" y2="14" />
                              <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                          </div>
                        </div>
                        {cert.title && (
                          <div className="cert-card-caption">
                            <span className="cert-card-title">{cert.title}</span>
                            {cert.year && <span className="cert-card-year">{cert.year}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social and Contact Links */}
              {hasSocial && (
                <div className="teacher-modal-section">
                  <h4 className="teacher-section-header-title">
                    Ijtimoiy tarmoqlar
                  </h4>
                  <div className="teacher-social-links-grid">
                    {telegramUrl && (
                      <a
                        href={telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="teacher-social-action-btn telegram"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.942z"/>
                        </svg>
                        <span>Telegram</span>
                      </a>
                    )}

                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="teacher-social-action-btn instagram"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <span>Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. LIGHTBOX FOR FULLSCREEN CERTIFICATE ZOOM */}
      {lightboxCert && typeof document !== 'undefined' && createPortal(
        <div
          className="cert-lightbox-backdrop animate-backdropFadeIn"
          onClick={() => setLightboxCert(null)}
        >
          <div
            className="cert-lightbox-container animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cert-lightbox-close-btn"
              onClick={() => setLightboxCert(null)}
              aria-label="Yopish"
            >
              ✕
            </button>
            <div className="cert-lightbox-img-wrap">
              {lightboxCert.image ? (
                <img
                  src={lightboxCert.image}
                  alt={lightboxCert.title || 'Sertifikat'}
                />
              ) : (
                <div className="cert-lightbox-placeholder">📜</div>
              )}
            </div>
            {lightboxCert.title && (
              <div className="cert-lightbox-footer">
                <h4 className="cert-lightbox-title">{lightboxCert.title}</h4>
                {lightboxCert.year && (
                  <span className="cert-lightbox-year">{lightboxCert.year}</span>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
