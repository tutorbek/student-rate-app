import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../../utils/scrollLock';

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

const ADDRESS_ITEMS = [
  {
    id: 'instagram',
    title: "Instagram sahifamiz",
    handle: "@insightplus_lc",
    url: "https://www.instagram.com/insightplus_lc/",
    type: 'instagram',
    badgeText: "Kuzatish",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
    id: 'telegram_channel',
    title: "Telegram kanalimiz",
    handle: "@insightlc",
    url: "https://t.me/insightlc",
    type: 'telegram',
    badgeText: "A'zo bo'lish",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
    )
  },
  {
    id: 'telegram_admin',
    title: "Administrator bilan aloqa",
    handle: "@Insight_plus_admin",
    url: "https://t.me/Insight_plus_admin",
    type: 'telegram_admin',
    badgeText: "Yozish",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  },
  {
    id: 'google_map',
    title: "Google Xarita (Lokatsiya)",
    handle: "Insight Plus o'quv markazi",
    url: "https://maps.app.goo.gl/U6oHK28upvYSoHbF7",
    type: 'map',
    badgeText: "Xaritada",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    )
  },
  {
    id: 'phone',
    title: "Qo'ng'iroq qilish",
    handle: "+998 90 812 43 41",
    url: "tel:+998908124341",
    type: 'phone',
    badgeText: "Bog'lanish",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  }
];

export default function StudentCenterAddresses() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  // Close on Escape key and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isOpen, isClosing]);

  const handleOpenLink = (url) => {
    triggerHaptic('light');
    if (url.startsWith('tel:')) {
      window.location.href = url;
    } else if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* 1. MINIMALIST CARD ON STUDENT HOME TAB */}
      <div
        className="center-addresses-card"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label="Bizning Manzillarimiz - Ijtimoiy tarmoqlar va aloqa"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <div className="center-addresses-card-left">
          <div className="center-addresses-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="center-addresses-text-block">
            <h3 className="center-addresses-title">Bizning Manzillar</h3>
            <span className="center-addresses-subtitle">Ijtimoiy tarmoqlar va aloqa ma'lumotlari</span>
          </div>
        </div>

        <div className="center-addresses-action-cue">
          <span>Ochish</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* 2. MINIMALIST BOTTOM SHEET / MODAL POPUP */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={`sheet-backdrop ${isClosing ? 'is-closing' : 'animate-backdropFadeIn'}`}
          onClick={handleClose}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className={`sheet-container center-addresses-sheet ${isClosing ? 'is-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="center-addresses-modal-title"
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

            <div className="center-addresses-modal-inner">
              {/* Header */}
              <div className="center-addresses-header">
                <h3 id="center-addresses-modal-title" className="center-addresses-modal-title">
                  Bizning Barcha Manzillarimiz
                </h3>
                <span className="center-addresses-modal-sub">
                  Insight Plus o'quv markazining rasmiy sahifalari
                </span>
              </div>

              {/* Action Buttons List */}
              <div className="center-addresses-buttons-grid">
                {ADDRESS_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`address-action-item ${item.type}`}
                    onClick={() => handleOpenLink(item.url)}
                  >
                    <div className="address-item-left">
                      <div className={`address-item-icon-box ${item.type}`}>
                        {item.icon}
                      </div>
                      <div className="address-item-meta">
                        <span className="address-item-name">{item.title}</span>
                        <span className="address-item-handle">{item.handle}</span>
                      </div>
                    </div>

                    <div className="address-item-right">
                      <span className="address-item-badge">{item.badgeText}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
