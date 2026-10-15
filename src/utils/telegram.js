/**
 * Telegram Mini App Fullscreen & Safe Area Integration Utility
 * Compliant with Telegram Bot API 8.0+ Fullscreen Mode specification.
 * Handles safeAreaInset, contentSafeAreaInset, header coloring, BackButton, and orientation shifts.
 */

export function isTelegramWebApp() {
  if (typeof window === 'undefined') return false;
  const tg = window.Telegram?.WebApp;
  if (!tg) return false;

  // Strict verification: only returns true inside an actual Telegram client webview
  const hasInitData = typeof tg.initData === 'string' && tg.initData.trim().length > 0;
  const hasProxy = Boolean(
    window.TelegramWebviewProxy ||
    window.webkit?.messageHandlers?.telegramWebviewProxy ||
    window.webkit?.messageHandlers?.telegram
  );
  const isKnownPlatform = Boolean(tg.platform && tg.platform !== 'unknown');

  return Boolean(hasInitData || hasProxy || isKnownPlatform);
}

export function syncTelegramMetrics(theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const tg = window.Telegram?.WebApp;
  const isTMA = isTelegramWebApp();
  const isFullscreen = Boolean(tg?.isFullscreen);

  root.setAttribute('data-is-tma', isTMA ? 'true' : 'false');
  root.setAttribute('data-tg-fullscreen', isFullscreen ? 'true' : 'false');

  if (!isTMA) {
    // When opened in a standard mobile browser (Safari, Chrome, etc.),
    // remove all TMA-specific CSS variables to guarantee zero layout shifts or regressions.
    root.style.removeProperty('--tg-safe-top');
    root.style.removeProperty('--tg-safe-bottom');
    root.style.removeProperty('--tg-safe-left');
    root.style.removeProperty('--tg-safe-right');
    root.style.removeProperty('--tg-content-safe-top');
    root.style.removeProperty('--tg-content-safe-bottom');
    root.style.removeProperty('--tg-content-safe-left');
    root.style.removeProperty('--tg-content-safe-right');
    root.style.removeProperty('--student-header-total-height');
    root.style.removeProperty('--tma-header-height');
    return;
  }

  const saTop = Number(tg?.safeAreaInset?.top) || 0;
  const saBottom = Number(tg?.safeAreaInset?.bottom) || 0;
  const saLeft = Number(tg?.safeAreaInset?.left) || 0;
  const saRight = Number(tg?.safeAreaInset?.right) || 0;

  const csaTop = Number(tg?.contentSafeAreaInset?.top) || 0;
  const csaBottom = Number(tg?.contentSafeAreaInset?.bottom) || 0;
  const csaLeft = Number(tg?.contentSafeAreaInset?.left) || 0;
  const csaRight = Number(tg?.contentSafeAreaInset?.right) || 0;

  root.style.setProperty('--tg-safe-top', `${saTop}px`);
  root.style.setProperty('--tg-safe-bottom', `${saBottom}px`);
  root.style.setProperty('--tg-safe-left', `${saLeft}px`);
  root.style.setProperty('--tg-safe-right', `${saRight}px`);

  root.style.setProperty('--tg-content-safe-top', `${csaTop}px`);
  root.style.setProperty('--tg-content-safe-bottom', `${csaBottom}px`);
  root.style.setProperty('--tg-content-safe-left', `${csaLeft}px`);
  root.style.setProperty('--tg-content-safe-right', `${csaRight}px`);

  // Calculate reliable, collision-free header height for TMA on mobile (<= 900px)
  // In Fullscreen and TMA modes: Telegram displays native floating 'Close' (left) and '...' (right) capsules.
  // Their bottom edge ends around y = 88px..96px. Content must start strictly below this.
  let tmaHeaderHeight = 52;
  const isMobile = window.innerWidth <= 900;

  if (isMobile) {
    if (csaTop > 0) {
      tmaHeaderHeight = Math.max(csaTop, saTop + 48, 88);
    } else if (saTop > 0) {
      tmaHeaderHeight = Math.max(saTop + 48, 88);
    } else {
      // Safe fallback when safe area metrics have not yet been asynchronously reported
      tmaHeaderHeight = 90;
    }
  } else {
    tmaHeaderHeight = 56;
  }

  root.style.setProperty('--tma-header-height', `${tmaHeaderHeight}px`);
  root.style.setProperty('--student-header-total-height', `${tmaHeaderHeight}px`);

  // Synchronize Telegram native chrome colors to seamlessly blend with the application
  if (tg) {
    const currentTheme = theme || root.getAttribute('data-theme') || 'light';
    const isDark = currentTheme === 'dark';
    const bgHex = isDark ? '#202124' : '#F5F5F7';
    const bottomBarHex = isDark ? '#1C1C1E' : '#FFFFFF';

    try {
      tg.setHeaderColor?.(bgHex);
      tg.setBackgroundColor?.(bgHex);
      if (typeof tg.setBottomBarColor === 'function') {
        tg.setBottomBarColor(bottomBarHex);
      }
    } catch {}
  }
}

export function setupTelegramFullscreen(theme) {
  if (typeof window === 'undefined') return () => {};
  const tg = window.Telegram?.WebApp;
  if (!tg || !isTelegramWebApp()) {
    syncTelegramMetrics(theme);
    return () => {};
  }

  try {
    tg.ready?.();
    tg.expand?.();

    // Request Fullscreen in Telegram Bot API 8.0+
    if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('8.0')) {
      if (!tg.isFullscreen && typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }
    }
  } catch (err) {
    console.warn('Telegram requestFullscreen init notice:', err);
  }

  // Initial sync
  syncTelegramMetrics(theme);

  const handler = () => syncTelegramMetrics(theme);

  // Bind official Telegram Bot API 8.0 events
  try {
    tg.onEvent?.('safeAreaChanged', handler);
    tg.onEvent?.('contentSafeAreaChanged', handler);
    tg.onEvent?.('fullscreenChanged', handler);
    tg.onEvent?.('themeChanged', handler);
  } catch {}

  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);

  return () => {
    try {
      tg.offEvent?.('safeAreaChanged', handler);
      tg.offEvent?.('contentSafeAreaChanged', handler);
      tg.offEvent?.('fullscreenChanged', handler);
      tg.offEvent?.('themeChanged', handler);
    } catch {}
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
  };
}

/**
 * Binds a callback to Telegram's native BackButton.
 * Shows the native back button if inside TMA and returns a cleanup function to hide it.
 *
 * @param {Function} onBack - Handler to invoke when native back button is pressed.
 * @returns {Function} Cleanup function to unbind and hide BackButton.
 */
export function bindTelegramBackButton(onBack) {
  if (typeof window === 'undefined') return () => {};
  const tg = window.Telegram?.WebApp;
  if (!tg?.BackButton || !isTelegramWebApp() || typeof onBack !== 'function') {
    return () => {};
  }

  try {
    tg.BackButton.show();
    tg.BackButton.onClick(onBack);
  } catch {}

  return () => {
    try {
      tg.BackButton.offClick(onBack);
      tg.BackButton.hide();
    } catch {}
  };
}
