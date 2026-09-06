import React from 'react';

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
  return (
    <div className="login-root-container w-full min-h-screen h-[100dvh] bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] select-none relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-sans antialiased">

      {/* Top Floating Back Link (Apple Minimal Style) */}
      {onBackToLanding && (
        <div className="absolute top-5 left-5 sm:top-7 sm:left-8 z-30">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <span>←</span>
            <span>Bosh sahifa</span>
          </button>
        </div>
      )}

      {/* Apple Minimalist Login Card (Centered) */}
      <div className="w-full max-w-[420px] rounded-[32px] sm:rounded-[36px] bg-[#FFFFFF] dark:bg-[#161617] p-8 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-black/[0.06] dark:border-white/[0.08] relative z-10 flex flex-col justify-between animate-fadeIn">

        {/* Top Meta Row */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
            TIZIMGA KIRISH
          </span>
        </div>

        {/* Heading & Subtitle */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5">
            Xush kelibsiz
          </h1>
          <p className="text-xs sm:text-[13px] text-[#86868B] font-normal leading-relaxed">
            Platformaga kirish uchun parolingizni kiriting.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
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
              className="w-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl px-4 py-3.5 pr-11 text-base sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors p-1 cursor-pointer"
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

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-3 py-2 text-center text-xs font-medium text-red-600 dark:text-red-400 animate-shake">
              {loginError}
            </div>
          )}

          {/* Continue Apple Blue Button */}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3.5 px-4 rounded-2xl text-white font-medium text-xs sm:text-sm tracking-normal bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.99] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <span>{loginLoading ? "Tekshirilmoqda..." : "Kirish"}</span>
          </button>
        </form>

        {/* Minimal Footer */}
        <div className="mt-8 pt-5 border-t border-black/[0.05] dark:border-white/[0.06] text-center">
          <p className="text-[10.5px] text-[#86868B] leading-relaxed">
            Epchil Robot platformasi © {new Date().getFullYear()}
          </p>
        </div>

      </div>

    </div>
  );
}
