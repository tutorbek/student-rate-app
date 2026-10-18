import React, { useEffect, useRef, useState } from 'react';
import { getLandingText } from './landingTranslations';
import './LandingPage.css';

export default function LoginPage({
  lang: propLang,
  onSelectLang: propOnSelectLang,
  handleLoginSubmit,
  loginPassword,
  setLoginPassword,
  loginError,
  loginLoading,
  showPassword,
  setShowPassword,
  showToast,
  onBackToLanding,
}) {
  const langDropdownRef = useRef(null);
  const [localLang, setLocalLang] = useState(() => {
    try {
      const saved = localStorage.getItem('rsa_landing_lang');
      if (saved === 'ru' || saved === 'en' || saved === 'uz') return saved;
    } catch (e) {}
    return 'en';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const activeLang = propLang || localLang;
  const t = (key) => getLandingText(key, activeLang);

  const handleSelectLang = (selectedLang) => {
    if (propOnSelectLang) {
      propOnSelectLang(selectedLang);
    } else {
      setLocalLang(selectedLang);
      try {
        localStorage.setItem('rsa_landing_lang', selectedLang);
        document.documentElement.lang = selectedLang;
      } catch (e) {}
    }
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    document.documentElement.classList.add('landing-page-active');
    try {
      document.documentElement.lang = activeLang;
    } catch (e) {}
    return () => {
      document.documentElement.classList.remove('landing-page-active');
    };
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
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangMenuOpen]);

  const handleGoogleLogin = () => {
    if (typeof showToast === 'function') {
      showToast(t('login_google_toast'), "info");
    }
  };

  return (
    <div className="landing-root login-root w-full min-h-screen min-h-[100dvh] bg-white dark:bg-[#000000] text-[var(--text-primary)] select-none relative flex flex-col justify-between font-sans antialiased overflow-x-hidden selection:bg-[#0171E3] selection:text-white">
      {/* 1. Top Navigation Bar (Identical in size and layout to Landing Page) */}
      <header className="nav shrink-0" data-scene="nav">
        <div className="nav-in">
          {/* Logo Brand */}
          <div
            className="nav-brand"
            onClick={onBackToLanding}
            role="button"
            tabIndex={0}
            aria-label="EPCHIL COM: sahifaga qaytish"
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
          </div>

          {/* Right Header: Minimal Language Selector & Back to Landing button */}
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

            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="nav-btn nav-btn-back"
                aria-label={t('login_back')}
              >
                <span className="nav-lab">{t('login_back')}</span>
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
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content (Seamlessly unified with background, perfectly centered) */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-5 w-full">
        <div className="w-full max-w-[380px] sm:max-w-[400px] mx-auto py-1 sm:py-2">
          {/* Heading & Subtitle */}
          <div className="mb-4 sm:mb-5">
            <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[var(--text-primary)] mb-1.5 font-display">
              {t('login_title')}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal leading-relaxed">
              {t('login_subtitle')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="loginPassword"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                {t('login_pass_label')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  name="password"
                  placeholder={t('login_pass_ph')}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  autoComplete="current-password"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 border border-black/15 dark:border-white/15 focus:border-black/30 dark:focus:border-white/30 rounded-2xl px-4 py-3.5 pr-11 text-base sm:text-sm font-medium outline-none focus:outline-none focus:ring-0 focus-visible:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? t('login_pass_hide') : t('login_pass_show')}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 text-center text-xs font-semibold text-red-600 dark:text-red-400 animate-shake">
                {loginError}
              </div>
            )}

            {/* Primary Action Button (Clean, simple white button without effects) */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-12 px-6 rounded-full bg-white dark:bg-[#1C1C1E] text-[#0D0E03] dark:text-white border border-black/15 dark:border-white/20 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] active:bg-black/[0.06] transition-colors duration-150 flex items-center justify-center cursor-pointer font-semibold text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {loginLoading ? t('login_btn_loading') : t('login_btn_submit')}
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
              <span className="absolute bg-white dark:bg-[#000000] px-3 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {t('login_divider_or')}
              </span>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group w-full h-12 px-4 rounded-full bg-white dark:bg-[#1C1C1E] text-[var(--text-primary)] border border-black/12 dark:border-white/15 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-[0.99] font-medium text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('login_google_btn')}</span>
            </button>

            {/* Telegram Support Link */}
            <div className="pt-2 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                {t('login_help_text')}{' '}
                <a
                  href={`https://t.me/bkzd19?text=${encodeURIComponent(t('login_tg_msg'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0171E3] hover:underline font-semibold"
                >
                  {t('login_contact_admin')}
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* 3. Bottom Page Footer */}
      <footer className="w-full py-3.5 sm:py-4 px-4 text-center border-t border-black/[0.06] dark:border-white/[0.08] shrink-0 mt-auto">
        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium leading-relaxed tracking-wide">
          {new Date().getFullYear()} • {t('login_foot_copy')}
        </p>
      </footer>
    </div>
  );
}
