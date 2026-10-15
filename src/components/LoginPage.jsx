import React, { useEffect } from 'react';
import { bindTelegramBackButton } from '../utils/telegram';

export default function LoginPage({
  handleLoginSubmit,
  loginPassword,
  setLoginPassword,
  loginError,
  loginLoading,
  showPassword,
  setShowPassword,
  onBackToLanding,
}) {
  useEffect(() => {
    document.documentElement.classList.add('landing-page-active');
    return () => {
      document.documentElement.classList.remove('landing-page-active');
    };
  }, []);

  useEffect(() => {
    if (typeof onBackToLanding === 'function') {
      const unbind = bindTelegramBackButton(onBackToLanding);
      return unbind;
    }
  }, [onBackToLanding]);

  return (
    <div className="landing-root login-root w-full min-h-screen min-h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] select-none relative flex flex-col justify-between font-sans antialiased overflow-hidden selection:bg-[#0171E3] selection:text-white">

      {/* 1. Top Navigation Bar (Brand Header matching Landing Page exactly) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[var(--bg-primary)]/90 dark:bg-[#202124]/90 border-b border-[var(--border-color)] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex items-center justify-between h-16 sm:h-20 xl:h-22 gap-2 min-w-0">
          
          {/* Logo Brand */}
          <div
            className="navbar-brand-section scale-active cursor-pointer shrink-0 min-h-[44px] flex items-center select-none"
            onClick={onBackToLanding}
          >
            <h1 className="navbar-logo-text text-lg min-[360px]:text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              EPCHIL <span className="logo-badge">ROBOT</span>
            </h1>
          </div>

          {/* Right Header: Back to Landing button */}
          {onBackToLanding && (
            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 shrink-0">
              <button
                type="button"
                onClick={onBackToLanding}
                className="group h-10 sm:h-11 xl:h-12 p-1 pr-3.5 pl-1.5 sm:pr-6 sm:pl-2 xl:pr-7 xl:pl-2.5 rounded-full bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] transition-all duration-300 ease-out flex items-center gap-2 sm:gap-3 xl:gap-3.5 cursor-pointer shadow-md active:scale-95 min-h-[44px]"
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 xl:w-9 xl:h-9 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-x-0.5 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </span>
                <span className="text-xs sm:text-sm xl:text-base font-semibold tracking-wide uppercase">Bosh sahifa</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Canvas (Centered Login Card) */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full my-auto min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] xl:min-h-[calc(100dvh-5.5rem)]">
        <div className="w-full max-w-[440px] rounded-3xl sm:rounded-[32px] bg-white dark:bg-[#1C1C1E] p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-black/[0.08] dark:border-white/[0.12] transition-all">

          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#0171E3]/10 dark:bg-[#0171E3]/20 text-[#0171E3] flex items-center justify-center mb-5 shadow-xs">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1.5">
              Tizimga kirish
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal leading-relaxed">
              Platformadan to'liq foydalanish uchun parolingizni kiriting.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="loginPassword"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  name="password"
                  placeholder="Parolni kiriting"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3.5 pr-11 text-base sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#0171E3]/20 focus:border-[#0171E3] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Signature Project Action Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="group w-full h-12 sm:h-13 p-1 pl-6 pr-2 rounded-full bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] transition-all duration-300 ease-out flex items-center justify-between cursor-pointer shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">
                {loginLoading ? "Tekshirilmoqda..." : "Tizimga kirish"}
              </span>
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </button>

            {/* Telegram Support Link */}
            <div className="pt-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                Kirishda qiyinchilik bormi?{' '}
                <a
                  href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20platformasiga%20kirish%20paroli%20bo'yicha%20bog'lanayotgan%20edim."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0171E3] hover:underline font-semibold"
                >
                  Admin bilan bog'lanish
                </a>
              </p>
            </div>
          </form>

          {/* Minimal Card Footer */}
          <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] text-center">
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              EPCHIL ROBOT © {new Date().getFullYear()} • Barcha huquqlar himoyalangan.
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}
