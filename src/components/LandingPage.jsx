import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getLandingText, getPricingBreakdown } from '../constants/landingTranslations';
import './LandingPage.css';

export default function LandingPage({
  onNavigateToLogin,
  lang: propLang,
  onSelectLang: propOnSelectLang,
}) {
  const containerRef = useRef(null);
  const langDropdownRef = useRef(null);
  const [tutorCount, setTutorCount] = useState(1);
  const [localLang, setLocalLang] = useState(() => {
    try {
      const saved = localStorage.getItem('rsa_landing_lang');
      if (saved === 'ru' || saved === 'en' || saved === 'uz') return saved;
    } catch {}
    return 'en';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const activeLang = propLang || localLang;
  const t = (key) => getLandingText(key, activeLang);

  // Smooth scroll directly so section top lands flush against sticky navbar bottom
  const scrollToTarget = useCallback((hash) => {
    if (!hash || hash.length <= 1) return;

    if (hash === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.querySelector(hash);
    if (!target) return;

    const navEl = document.querySelector('.nav');
    const navH = navEl ? Math.round(navEl.getBoundingClientRect().height) : 60;
    const pageY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0;
    const destY = Math.max(0, Math.round(target.getBoundingClientRect().top + pageY - navH));

    window.scrollTo({
      top: destY,
      behavior: 'smooth',
    });
  }, []);

  const handleNavClick = (e, hash) => {
    e.preventDefault();
    scrollToTarget(hash);
  };

  const handleSelectLang = (selectedLang) => {
    if (propOnSelectLang) {
      propOnSelectLang(selectedLang);
    } else {
      setLocalLang(selectedLang);
      try {
        localStorage.setItem('rsa_landing_lang', selectedLang);
        document.documentElement.lang = selectedLang;
      } catch {}
    }
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    try {
      document.documentElement.lang = activeLang;
    } catch {}
  }, [activeLang]);

  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangMenuOpen]);

  const displayCount = typeof tutorCount === 'number' && tutorCount >= 1 ? tutorCount : 1;
  const calculatedTotal = (16.95 + Math.max(0, displayCount - 1) * 4.95).toFixed(2);
  const pricingBreakdown = getPricingBreakdown(activeLang, displayCount, ((displayCount - 1) * 4.95).toFixed(2));

  const handleDecrement = () => {
    setTutorCount((prev) => Math.max(1, (typeof prev === 'number' ? prev : 1) - 1));
  };

  const handleIncrement = () => {
    setTutorCount((prev) => Math.min(500, (typeof prev === 'number' ? prev : 1) + 1));
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      setTutorCount('');
    } else {
      const num = parseInt(val, 10);
      setTutorCount(Math.min(500, Math.max(1, num)));
    }
  };

  const handleInputBlur = () => {
    if (!tutorCount || tutorCount < 1) {
      setTutorCount(1);
    }
  };

  useEffect(() => {
    const H = document.documentElement;
    H.classList.add('landing-page-active');

    window.dataLayer = window.dataLayer || [];

    const rootEl = containerRef.current;
    if (!rootEl) return;

    // Navigation and Action links
    const handleCtaClick = (e) => {
      const a = e.target.closest('a[data-app], a[href^="https://t.me"], a[href^="tel:"], a[href*="instagram.com"]');
      if (!a) return;

      const isApp = a.hasAttribute('data-app');
      const k = isApp
        ? a.hasAttribute('data-cta')
          ? 'cta'
          : 'login'
        : a.href.startsWith('tel')
        ? 'phone'
        : a.href.includes('instagram')
        ? 'instagram'
        : 'telegram';

      const s = a.closest('[data-scene]');
      const scene = s ? s.dataset.scene : '';

      if (window.dataLayer) {
        window.dataLayer.push({
          event: isApp ? 'app_click' : 'contact_click',
          type: k,
          scene,
        });
      }

      if (window.posthog) {
        window.posthog.capture(isApp ? 'landing_app_click' : 'landing_contact_click', {
          type: k,
          scene,
        });
      }

      if (isApp && onNavigateToLogin) {
        e.preventDefault();
        onNavigateToLogin();
      }
    };

    rootEl.addEventListener('click', handleCtaClick);

    return () => {
      rootEl.removeEventListener('click', handleCtaClick);
      H.classList.remove('landing-page-active');
    };
  }, [onNavigateToLogin]);

  return (
    <div ref={containerRef} className="landing-root">
      {/* Navbar: 1:1 copy of epchil.com */}
      <header className="nav" data-scene="nav">
        <div className="nav-in">
          <a
            className="nav-brand"
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            aria-label="EPCHIL COM: sahifa boshiga"
          >
            <span className="nav-logo">
              <img
                src="/apple-touch-icon.png"
                alt="Epchil Logo"
                className="nav-logo-icon"
                width="28"
                height="28"
              />
              EPCHIL <span className="logo-badge">COM</span>
            </span>
          </a>

          {/* Section Navigation Buttons (Desktop) */}
          <nav className="nav-links" aria-label="Asosiy bo'limlar">
            <a
              href="#imkoniyatlar"
              onClick={(e) => handleNavClick(e, '#imkoniyatlar')}
              className="nav-link-btn"
            >
              {t('nav_sec_modules')}
            </a>
            <a
              href="#narx"
              onClick={(e) => handleNavClick(e, '#narx')}
              className="nav-link-btn"
            >
              {t('nav_sec_pricing')}
            </a>
            <a
              href="#savollar"
              onClick={(e) => handleNavClick(e, '#savollar')}
              className="nav-link-btn"
            >
              {t('nav_sec_faq')}
            </a>
            <a
              href="#aloqa"
              onClick={(e) => handleNavClick(e, '#aloqa')}
              className="nav-link-btn"
            >
              {t('nav_sec_contact')}
            </a>
          </nav>

          <div className="nav-actions">
            {/* Language Selector: Minimal, text + single arrow only, options: uz / ru / eng */}
            <div className="nav-lang-dropdown" ref={langDropdownRef}>
              <button
                type="button"
                className="nav-lang-btn"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                aria-expanded={isLangMenuOpen}
                aria-haspopup="menu"
                aria-label="Tilni tanlash / Выбор языка / Select language"
              >
                <span className="nav-lang-current">{activeLang.toUpperCase()}</span>
                <svg
                  className={`nav-lang-arrow ${isLangMenuOpen ? 'open' : ''}`}
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isLangMenuOpen && (
                <div className="nav-lang-menu" role="menu">
                  <button
                    type="button"
                    className={`nav-lang-item ${activeLang === 'en' ? 'active' : ''}`}
                    onClick={() => handleSelectLang('en')}
                    role="menuitem"
                  >
                    ENG
                  </button>
                  <button
                    type="button"
                    className={`nav-lang-item ${activeLang === 'uz' ? 'active' : ''}`}
                    onClick={() => handleSelectLang('uz')}
                    role="menuitem"
                  >
                    UZ
                  </button>
                  <button
                    type="button"
                    className={`nav-lang-item ${activeLang === 'ru' ? 'active' : ''}`}
                    onClick={() => handleSelectLang('ru')}
                    role="menuitem"
                  >
                    RU
                  </button>
                </div>
              )}
            </div>

            <a
              className="nav-btn"
              href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
              data-app
              rel="noopener"
            >
              <span className="nav-lab">{t('nav_login')}</span>
              <span className="nav-circ">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>
        </div>

      </header>

      <main>
        {/* 1. HERO (white): who it is for, what it does, one action + visual showcase */}
        <section className="sc hero" id="top" data-bg="w" data-scene="hero">
          <div className="hero-main">
            <div className="hero-copy">
              <p className="lab kick">{t('hero_kick')}</p>
              <h1>
                {t('hero_title_p1')}{' '}
                <span className="acc">{t('hero_title_acc')}</span>{' '}
                {t('hero_title_p2')}
              </h1>
              <p className="sub">
                {t('hero_sub_s1')} {t('hero_sub_s2')}
              </p>
              <div className="ctas">
                <a
                  className="lnk lg"
                  href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
                  data-app
                  data-cta
                  rel="noopener"
                >
                  <span>{t('hero_cta')}</span>
                </a>
              </div>
            </div>

            {/* Visual SaaS Showcase: Calendar Wireframe + Students Card (TutorBird authentic style) */}
            <div className="hero-showcase" aria-hidden="true">
              <div className="hero-dots" />
              <div className="hero-blob" />

              {/* Hand-drawn Accent 1: Soft curved ribbon (inspired by user screenshot 1) */}
              <svg className="hero-doodle-curve" width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 92 C26 62 38 28 66 24 C90 20 96 46 76 66 C54 86 46 95 66 102"
                  stroke="#38BDF8"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeOpacity="0.22"
                />
              </svg>

              {/* Hand-drawn Accent 2: Confetti Sprinkles (inspired by user screenshot 2) */}
              <svg className="hero-doodle-confetti" width="130" height="145" viewBox="0 0 130 145" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="22" y="10" width="6.5" height="17" rx="3.25" transform="rotate(-20 22 10)" fill="#0284C7" fillOpacity="0.55" />
                <rect x="62" y="8" width="7" height="15" rx="3.5" transform="rotate(15 62 8)" fill="#0B3BFF" fillOpacity="0.4" />
                <rect x="100" y="22" width="6.5" height="18" rx="3.25" transform="rotate(8 100 22)" fill="#0284C7" fillOpacity="0.5" />
                <rect x="14" y="40" width="6.5" height="16" rx="3.25" transform="rotate(10 14 40)" fill="#D8F10A" />
                <rect x="46" y="36" width="6.5" height="18" rx="3.25" transform="rotate(-5 46 36)" fill="#0B3BFF" fillOpacity="0.45" />
                <rect x="82" y="42" width="7" height="17" rx="3.5" transform="rotate(25 82 42)" fill="#0284C7" fillOpacity="0.6" />
                <rect x="112" y="55" width="6.5" height="16" rx="3.25" transform="rotate(-12 112 55)" fill="#94A3B8" fillOpacity="0.4" />
                <rect x="30" y="68" width="7" height="20" rx="3.5" transform="rotate(-15 30 68)" fill="#0284C7" fillOpacity="0.55" />
                <rect x="66" y="65" width="6.5" height="18" rx="3.25" transform="rotate(8 66 65)" fill="#0B3BFF" fillOpacity="0.35" />
                <rect x="94" y="78" width="6.5" height="18" rx="3.25" transform="rotate(-8 94 78)" fill="#D8F10A" />
                <rect x="12" y="96" width="6.5" height="17" rx="3.25" transform="rotate(22 12 96)" fill="#0B3BFF" fillOpacity="0.4" />
                <rect x="50" y="100" width="7" height="19" rx="3.5" transform="rotate(-25 50 100)" fill="#0284C7" fillOpacity="0.55" />
                <rect x="78" y="108" width="6.5" height="17" rx="3.25" transform="rotate(12 78 108)" fill="#94A3B8" fillOpacity="0.4" />
                <rect x="108" y="114" width="7" height="17" rx="3.5" transform="rotate(-15 108 114)" fill="#0B3BFF" fillOpacity="0.4" />
                <rect x="34" y="128" width="6.5" height="16" rx="3.25" transform="rotate(18 34 128)" fill="#0284C7" fillOpacity="0.5" />
                <rect x="68" y="130" width="7" height="15" rx="3.5" transform="rotate(-8 68 130)" fill="#D8F10A" />
              </svg>

              {/* Hand-drawn Accent 3: Triple zigzag lines (inspired by user screenshot 3) */}
              <svg className="hero-doodle-zigzag" width="120" height="96" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 90 L10 52 C10 40 22 36 32 44 L54 62 C62 68 70 60 74 46 L82 22 C86 10 96 12 102 24 L114 44"
                  stroke="#F59E0B"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 93 L19 58 C19 48 28 45 36 51 L58 69 C66 75 74 68 78 54 L86 30 C90 20 98 22 104 32 L116 52"
                  stroke="#F59E0B"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M28 96 L28 64 C28 56 34 54 40 58 L62 76 C70 82 78 76 82 62 L90 38 C94 30 100 32 106 40 L118 60"
                  stroke="#F59E0B"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Main Calendar Card (No dense text, pure wireframe skeleton cards) */}
              <div className="mock-card mock-calendar">
                <div className="mock-head">
                  <div className="mock-title">
                    <span className="mock-app-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <b>{t('hero_mock_cal')}</b>
                  </div>
                  <svg className="mock-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>

                <div className="mock-filters">
                  <span className="mock-pill-active" />
                  <span className="mock-pill-outline" />
                  <span className="mock-pill-outline" />
                  <span className="mock-pill-outline" />
                </div>

                <div className="mock-cal-grid">
                  <div className="mock-col">
                    <div className="mock-event ev-blue">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-orange">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-purple">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-blue">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-volt">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                  </div>

                  <div className="mock-col">
                    <div className="mock-event ev-orange">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-gray">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-volt">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-blue">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-purple">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                  </div>

                  <div className="mock-col">
                    <div className="mock-event ev-blue">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-purple">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-orange">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-blue">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-orange">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                  </div>

                  <div className="mock-col">
                    <div className="mock-event ev-gray">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-volt">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-blue">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-orange">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                    <div className="mock-event ev-gray">
                      <span className="mock-line ln-short" />
                      <span className="mock-line ln-long" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Students Card (Abstract wireframe list matching 2-screenshot) */}
              <div className="mock-card mock-students-card">
                <div className="mock-st-head">
                  <b>{t('hero_mock_students')}</b>
                  <span className="mock-st-badge" />
                </div>

                <div className="mock-students-list">
                  <div className="mock-st-row">
                    <span className="st-avatar av-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7" r="4.5" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <div className="st-lines">
                      <span className="st-ln-top" />
                      <span className="st-ln-bot" />
                    </div>
                    <span className="mock-cb" />
                  </div>

                  <div className="mock-st-row">
                    <span className="st-avatar av-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7" r="4.5" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <div className="st-lines">
                      <span className="st-ln-top" />
                      <span className="st-ln-bot" />
                    </div>
                    <span className="mock-cb" />
                  </div>

                  <div className="mock-st-row">
                    <span className="st-avatar av-3">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7" r="4.5" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <div className="st-lines">
                      <span className="st-ln-top" />
                      <span className="st-ln-bot" />
                    </div>
                    <span className="mock-cb" />
                  </div>

                  <div className="mock-st-row">
                    <span className="st-avatar av-4">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7" r="4.5" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <div className="st-lines">
                      <span className="st-ln-top" />
                      <span className="st-ln-bot" />
                    </div>
                    <span className="mock-cb" />
                  </div>

                  <div className="mock-st-row">
                    <span className="st-avatar av-5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7" r="4.5" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <div className="st-lines">
                      <span className="st-ln-top" />
                      <span className="st-ln-bot" />
                    </div>
                    <span className="mock-cb" />
                  </div>

                  <div className="mock-st-row">
                    <span className="st-avatar av-6">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7" r="4.5" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <div className="st-lines">
                      <span className="st-ln-top" />
                      <span className="st-ln-bot" />
                    </div>
                    <span className="mock-cb" />
                  </div>
                </div>
              </div>

              {/* Floating Gamification Card */}
              <div className="mock-card mock-gamify-card">
                <div className="mock-gamify-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
                  </svg>
                </div>
                <div className="mock-gamify-content">
                  <div className="mock-gamify-row">
                    <span className="mock-gamify-pill-amber" />
                    <span className="mock-gamify-pill-blue" />
                  </div>
                  <span className="mock-gamify-bar-title" />
                </div>
              </div>
            </div>
          </div>

          <div className="giant" aria-hidden="true">
            EPCHIL
          </div>
        </section>

        {/* 2. FORK: Designed for tutors of all kinds */}
        <section className="sc fork" id="kim" data-bg="w" data-scene="fork">
          <div className="fork-dots" aria-hidden="true" />
          <h2 className="lab">{t('fork_lab')}</h2>
          <h3 className="fork-title">
            {t('fork_title_p1')} <span className="fork-hl">{t('fork_title_hl')}</span> {t('fork_title_p2')}
          </h3>
          <p className="fork-subtitle">{t('fork_subtitle')}</p>

          <div className="fork-grid">
            <div className="fork-card">
              <div className="fork-icon-wrap">
                <span className="fork-blob blob-blue" />
                <svg className="fork-svg" width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 21L24 7L41 21" />
                  <path d="M12 18.5V39C12 40.1 12.9 41 14 41H25" />
                  <path d="M36 41H34" />
                  <path d="M36 24V18.5" />
                  <path d="M32 13.5V9H36V16.8" />
                  <rect x="17" y="24" width="9" height="9" rx="1" />
                  <line x1="21.5" y1="24" x2="21.5" y2="33" />
                  <line x1="17" y1="28.5" x2="26" y2="28.5" />
                  <path d="M28 34C31 32.5 35 32.5 39 34V42C35 40.5 31 40.5 28 42V34Z" />
                  <path d="M28 34C25 32.5 21 32.5 17 34V42C21 40.5 25 40.5 28 42" />
                </svg>
              </div>
              <b className="fork-name">
                {t('fork_c1_title')}
                <span className="fork-sub">{t('fork_c1_sub')}</span>
              </b>
            </div>

            <div className="fork-card">
              <div className="fork-icon-wrap">
                <span className="fork-blob blob-orange" />
                <svg className="fork-svg" width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="24" y1="5" x2="24" y2="13" />
                  <path d="M24 6C27 4.8 29 7 32 6V11C29 12 27 9.8 24 11" fill="currentColor" fillOpacity="0.15" />
                  <path d="M11 20L24 12L37 20" />
                  <rect x="14" y="20" width="20" height="21" rx="1" />
                  <rect x="18" y="24" width="3.5" height="5" rx="0.75" />
                  <rect x="26.5" y="24" width="3.5" height="5" rx="0.75" />
                  <path d="M21 41V33H27V41" />
                  <line x1="9" y1="41" x2="39" y2="41" />
                </svg>
              </div>
              <b className="fork-name">
                {t('fork_c2_title')}
                <span className="fork-sub">{t('fork_c2_sub')}</span>
              </b>
            </div>

            <div className="fork-card">
              <div className="fork-icon-wrap">
                <span className="fork-blob blob-purple" />
                <svg className="fork-svg" width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="7" y="9" width="34" height="25" rx="3" />
                  <line x1="24" y1="34" x2="24" y2="40" />
                  <line x1="16" y1="40" x2="32" y2="40" />
                  <circle cx="18" cy="18" r="3.5" />
                  <path d="M12 28C12 25 15 23 18 23C21 23 24 25 24 28" />
                  <circle cx="33" cy="17" r="2.8" />
                  <circle cx="31" cy="26" r="2.8" />
                  <path d="M27 21C27 19.5 28.5 18 30 18" />
                </svg>
              </div>
              <b className="fork-name">
                {t('fork_c3_title')}
                <span className="fork-sub">{t('fork_c3_sub')}</span>
              </b>
            </div>
          </div>

          <a
            className="lnk lg more"
            href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
            data-app
            data-cta
            rel="noopener"
          >
            <span>{t('hero_cta')}</span>
          </a>
        </section>

        {/* 3. STATEMENT (white) */}
        <section className="sc stm" data-bg="w" data-scene="statement">
          <div className="ghost ol" aria-hidden="true">
            {t('stm_ghost')}
          </div>
          <h2 className="sr">Nega Epchil</h2>
          <p>
            {t('stm_s1')} {t('stm_s2')} {t('stm_s3')}
          </p>

          <div className="stm-compare" aria-label="Eski usul va Epchil taqqoslanishi">
            <div className="stm-card stm-before">
              <div className="stm-card-header">
                <span className="stm-badge stm-badge-old">
                  {t('stm_before_badge')}
                </span>
              </div>
              <ul className="stm-list">
                <li className="stm-item">
                  <span className="stm-item-icon stm-icon-before" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="stm-item-text">{t('stm_before_b1')}</span>
                </li>
                <li className="stm-item">
                  <span className="stm-item-icon stm-icon-before" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="stm-item-text">{t('stm_before_b2')}</span>
                </li>
                <li className="stm-item">
                  <span className="stm-item-icon stm-icon-before" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="stm-item-text">{t('stm_before_b3')}</span>
                </li>
              </ul>
            </div>

            <div className="stm-card stm-after">
              <div className="stm-card-header">
                <span className="stm-badge stm-badge-new">
                  {t('stm_after_badge')}
                </span>
              </div>
              <ul className="stm-list">
                <li className="stm-item">
                  <span className="stm-item-icon stm-icon-after" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="stm-item-text">{t('stm_after_b1')}</span>
                </li>
                <li className="stm-item">
                  <span className="stm-item-icon stm-icon-after" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="stm-item-text">{t('stm_after_b2')}</span>
                </li>
                <li className="stm-item">
                  <span className="stm-item-icon stm-icon-after" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="stm-item-text">{t('stm_after_b3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. STEPS (white) */}
        <section className="sc how" data-bg="w" data-scene="steps">
          {/* Hand-drawn Growth Zigzag Accent (Image 3 inspired) */}
          <div className="how-zigzag-wrap" aria-hidden="true">
            <svg className="how-zigzag-svg" width="180" height="240" viewBox="0 0 180 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="howZigzagGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              <path
                d="M20 220 L20 160 C20 142 36 126 50 130 C64 134 70 152 78 154 C86 156 100 96 112 86 C122 78 126 104 134 108 C142 112 154 36 166 28 C172 24 176 34 176 44"
                stroke="url(#howZigzagGrad)"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M29 224 L29 168 C29 152 43 138 56 142 C68 146 74 160 81 162 C88 164 102 106 114 96 C124 88 128 112 135 116 C143 120 154 48 166 40 C172 36 176 44 176 54"
                stroke="url(#howZigzagGrad)"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M38 228 L38 176 C38 162 50 150 62 154 C72 158 78 168 84 170 C90 172 104 116 116 106 C126 98 130 120 136 124 C144 128 154 60 166 52 C172 48 176 54 176 64"
                stroke="url(#howZigzagGrad)"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="lab">{t('how_lab')}</h2>
          <div className="step">
            <span className="hl" aria-hidden="true" />
            <p>{t('how_s1')}</p>
          </div>
          <div className="step">
            <span className="hl" aria-hidden="true" />
            <p>{t('how_s2')}</p>
          </div>
          <div className="step">
            <span className="hl" aria-hidden="true" />
            <p>{t('how_s3')}</p>
          </div>
          <a
            className="lnk lg more"
            href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
            data-app
            data-cta
            rel="noopener"
          >
            <span>{t('hero_cta')}</span>
          </a>
        </section>

        {/* 5. ONLAYN TOʻLOVLAR VA TOʻLOVLAR NAZORATI (light) */}
        <section className="sc pay-sc" id="tolovlar" data-bg="g" data-scene="payments">
          {/* Giant Hand-drawn Organic Backdrop Blob (Image inspired) */}
          <div className="pay-organic-blob-wrap" aria-hidden="true">
            <svg
              className="pay-organic-blob-svg"
              viewBox="0 0 1024 768"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="payBlobGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0B3BFF" stopOpacity="0.08" />
                  <stop offset="45%" stopColor="#0EA5E9" stopOpacity="0.065" />
                  <stop offset="80%" stopColor="#14B8A6" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.015" />
                </linearGradient>
              </defs>
              <path
                d="M 46 0 C 46 75, 100 140, 230 162 C 360 184, 440 230, 475 325 C 510 420, 488 540, 512 620 C 535 700, 630 710, 770 692 C 890 675, 965 650, 1024 610 L 1024 0 Z"
                fill="url(#payBlobGrad)"
                stroke="rgba(11, 59, 255, 0.07)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div className="ghost ol" aria-hidden="true">
            {t('pay_ghost')}
          </div>
          <p className="lab">{t('pay_lab')}</p>
          <h2>{t('pay_title')}</h2>
          <p className="sub-lead">
            {t('pay_sub_s1')} {t('pay_sub_s2')}
          </p>
          <div className="pay-methods">
            <span className="pay-tag">Payme</span>
            <span className="pay-tag">Click</span>
            <span className="pay-tag">Uzum Bank</span>
            <span className="pay-tag">{t('pay_tag_cards')}</span>
            <span className="pay-tag">{t('pay_tag_cash')}</span>
          </div>
          <div className="pay-grid">
            <div className="pay-card">
              <span className="pay-num">01</span>
              <b>{t('pay_c1_title')}</b>
              <p>{t('pay_c1_desc')}</p>
            </div>
            <div className="pay-card">
              <span className="pay-num">02</span>
              <b>{t('pay_c2_title')}</b>
              <p>{t('pay_c2_desc')}</p>
            </div>
            <div className="pay-card">
              <span className="pay-num">03</span>
              <b>{t('pay_c3_title')}</b>
              <p>{t('pay_c3_desc')}</p>
            </div>
          </div>
          <a
            className="lnk lg more"
            href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
            data-app
            data-cta
            rel="noopener"
          >
            <span>{t('hero_cta')}</span>
          </a>
        </section>

        {/* 6. MODULES (blue, index list) */}
        <section className="sc idx-sc" id="imkoniyatlar" data-bg="b" data-scene="modules">
          <h2 className="lab">{t('mod_lab')}</h2>
          <ul className="idx">
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">01</span>
                <h3>{t('mod_1_t')}</h3>
                <p>{t('mod_1_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">02</span>
                <h3>{t('mod_2_t')}</h3>
                <p>{t('mod_2_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">03</span>
                <h3>{t('mod_3_t')}</h3>
                <p>{t('mod_3_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">04</span>
                <h3>{t('mod_4_t')}</h3>
                <p>{t('mod_4_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">05</span>
                <h3>{t('mod_5_t')}</h3>
                <p>{t('mod_5_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">06</span>
                <h3>{t('mod_6_t')}</h3>
                <p>{t('mod_6_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">07</span>
                <h3>{t('mod_7_t')}</h3>
                <p>{t('mod_7_d')}</p>
              </div>
            </li>
            <li>
              <span className="hl" aria-hidden="true" />
              <div className="row">
                <span className="n">08</span>
                <h3>{t('mod_8_t')}</h3>
                <p>{t('mod_8_d')}</p>
              </div>
            </li>
          </ul>
        </section>


        {/* 8. PRICING: horizontal interactive layout adapted to our design */}
        <section className="sc price-sc" id="narx" data-bg="w" data-scene="pricing">
          <div className="price-head">
            <h2 className="lab">{t('price_lab')}</h2>
            <p className="tq">{t('price_sub')}</p>
          </div>

          <div className="price-horizontal-card">
            {/* Left: Interactive Calculator */}
            <div className="price-calc-col">
              <div className="price-plan-badge">{t('price_badge')}</div>

              <div className="price-main-display">
                <span className="price-currency">$</span>
                <span className="price-amount">{calculatedTotal}</span>
                <span className="price-period">{t('price_period')}</span>
              </div>

              <p className="price-calc-breakdown">
                {displayCount === 1 ? (
                  <span>{pricingBreakdown.baseLabel}<b>{pricingBreakdown.baseAmount}</b>{pricingBreakdown.extraText}</span>
                ) : (
                  <span>
                    {pricingBreakdown.baseLabel}<b>{pricingBreakdown.baseAmount}</b>{pricingBreakdown.extraText}<b>{pricingBreakdown.extraAmount}</b>
                  </span>
                )}
              </p>

              <div className="price-stepper-box">
                <label htmlFor="inputRangePricing" className="price-stepper-label">
                  {t('price_stepper_label')}{' '}
                  <small>{t('price_stepper_sub')}</small>
                </label>
                <div className="price-stepper-controls">
                  <button
                    type="button"
                    className="price-step-btn minus"
                    onClick={handleDecrement}
                    disabled={displayCount <= 1}
                    aria-label={t('price_stepper_minus')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <input
                    id="inputRangePricing"
                    className="price-step-input"
                    type="text"
                    inputMode="numeric"
                    value={tutorCount}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    aria-label={t('price_stepper_input_aria')}
                  />
                  <button
                    type="button"
                    className="price-step-btn plus"
                    onClick={handleIncrement}
                    aria-label={t('price_stepper_plus')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="price-cta-wrap">
                <a
                  href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
                  className="price-primary-btn"
                  data-app
                  data-cta
                  rel="noopener"
                >
                  {t('price_cta')}
                </a>
                <p className="price-guarantee-note">
                  {t('price_guarantee')}
                </p>
              </div>
            </div>

            {/* Right: What's included */}
            <div className="price-features-col">
              <h3 className="price-features-title">{t('price_feat_title')}</h3>
              <p className="price-features-sub">{t('price_feat_sub')}</p>
              <ul className="price-features-list">
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f1_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f1_d')}</span>
                  </div>
                </li>
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f2_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f2_d')}</span>
                  </div>
                </li>
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f3_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f3_d')}</span>
                  </div>
                </li>
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f4_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f4_d')}</span>
                  </div>
                </li>
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f5_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f5_d')}</span>
                  </div>
                </li>
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f6_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f6_d')}</span>
                  </div>
                </li>
                <li className="price-feature-item">
                  <span className="price-feature-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="price-feature-text">
                    <b className="price-feature-title">{t('price_f7_t')}</b>{' '}
                    <span className="price-feature-desc">{t('price_f7_d')}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 9. FAQ (white) */}
        <section className="sc faqsc" id="savollar" data-bg="w" data-scene="faq">
          {/* Hand-drawn Squiggly Ribbon Accent (Image 1 inspired) */}
          <div className="faq-ribbon-wrap" aria-hidden="true">
            <svg className="faq-ribbon-svg" width="220" height="260" viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="faqRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0B3BFF" stopOpacity="0.18" />
                  <stop offset="60%" stopColor="#0B3BFF" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#0B3BFF" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path
                d="M 32 245 C 32 190, 180 195, 185 135 C 190 75, 55 90, 50 48 C 45 15, 150 25, 190 18"
                stroke="url(#faqRibbonGrad)"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="lab">{t('faq_lab')}</h2>
          <div className="faq">
            <details>
              <summary>
                <span>{t('faq_q1')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a1')}</p>
              </div>
            </details>
            <details>
              <summary>
                <span>{t('faq_q2')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a2')}</p>
              </div>
            </details>
            <details>
              <summary>
                <span>{t('faq_q3')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a3')}</p>
              </div>
            </details>
            <details>
              <summary>
                <span>{t('faq_q4')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a4')}</p>
              </div>
            </details>
            <details>
              <summary>
                <span>{t('faq_q5')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a5')}</p>
              </div>
            </details>
            <details>
              <summary>
                <span>{t('faq_q6')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a6')}</p>
              </div>
            </details>
            <details>
              <summary>
                <span>{t('faq_q7')}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="faq-ans">
                <p>{t('faq_a7')}</p>
              </div>
            </details>
          </div>
          <a
            className="lnk lg more"
            href="https://t.me/bkzd19"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t('faq_support_btn')}</span>
          </a>
        </section>

        {/* 10. FINAL CTA + FOOTER (white) */}
        <section className="sc cta" id="boglanish" data-bg="w" data-scene="final">
          {/* Bottom Organic Teal Wave Blob Accent (User inspired) */}
          <div className="cta-organic-blob-wrap" aria-hidden="true">
            <svg
              className="cta-organic-blob-svg"
              viewBox="0 0 1024 768"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="ctaOrganicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3FC5C6" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#2BB8B9" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#1E9E9F" stopOpacity="0.80" />
                </linearGradient>
              </defs>
              <path
                d="M 1024 160 C 960 115, 880 85, 760 72 C 620 58, 530 80, 505 165 C 480 250, 502 360, 470 455 C 435 550, 350 595, 220 620 C 90 645, 40 705, 35 768 L 1024 768 Z"
                fill="url(#ctaOrganicGrad)"
              />
              <path
                d="M 1024 220 C 970 185, 900 155, 800 145 C 680 135, 600 155, 570 230 C 540 310, 560 410, 530 495 C 495 580, 420 620, 310 650 C 190 680, 140 725, 120 768"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <div className="cta-main">
            <h2 className="cta-headline">
              {t('final_cta_h2_p1')}{' '}
              <span className="cta-hl">
                {t('final_cta_h2_hl')}
                <svg className="cta-swoosh-svg" viewBox="0 0 240 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M 4 11 C 60 5, 170 4, 236 10" stroke="#0B3BFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
                </svg>
              </span>{' '}
              {t('final_cta_h2_p2')}
            </h2>
            <div className="cta-action-wrap">
              <div className="cta-btn-box">
                <a
                  className="lnk lg more"
                  href={onNavigateToLogin ? '#login' : 'https://epchilrobot.uz/'}
                  data-app
                  data-cta
                  rel="noopener"
                >
                  <span>{t('hero_cta')}</span>
                </a>
              </div>
              <p className="cta-subnote">{t('final_cta_sub')}</p>
            </div>
          </div>
          <footer className="foot" id="aloqa">
            <div className="foot-inner">
              <p className="lab">{t('foot_lab')}</p>
              <nav aria-label={t('foot_lab')}>
                <a className="lnk" href="https://t.me/bkzd19" target="_blank" rel="noopener noreferrer">
                  <span>Telegram</span>
                </a>
                <a className="lnk" href="https://instagram.com/epchilrobot" target="_blank" rel="noopener noreferrer">
                  <span>Instagram</span>
                </a>
                <a className="lnk" href="tel:+998332220301">
                  <span>+998 (33) 222-03-01</span>
                </a>
              </nav>
              <small className="foot-copy">{t('foot_copy')}</small>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
