/**
 * Telegram Mini App Fullscreen & Safe Area Integration Utility
 * Compliant with Telegram Bot API 8.0+ Fullscreen Mode specification.
 * Handles safeAreaInset, contentSafeAreaInset, header coloring, and orientation shifts.
 */

export function isTelegramWebApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Telegram?.WebApp?.initData ||
    window.TelegramWebviewProxy ||
    (window.Telegram?.WebApp?.platform && window.Telegram.WebApp.platform !== 'unknown')
  );
}

export function syncTelegramMetrics(theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const tg = window.Telegram?.WebApp;
  const isTMA = isTelegramWebApp();
  const isFullscreen = Boolean(tg?.isFullscreen);

  root.setAttribute('data-is-tma', isTMA ? 'true' : 'false');
  root.setAttribute('data-tg-fullscreen', isFullscreen ? 'true' : 'false');

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

  // Calculate total header height for Student Portal
  // In Fullscreen mode: Telegram draws native floating 'Close' (left) and '...' (right) pills.
  // Their bottom edge ends around y = 88px..96px. Content must start below this.
  let totalHeaderHeight = 52;
  const isMobile = window.innerWidth <= 900;

  if (isMobile) {
    if (isFullscreen || isTMA) {
      if (csaTop > 0) {
        // contentSafeAreaInset.top reports the full clearance from the screen top
        totalHeaderHeight = Math.max(csaTop, saTop + 46, 88);
      } else if (saTop > 0) {
        // Hardware safe area (notch/status bar) + navbar content row height
        totalHeaderHeight = saTop + 48;
      } else if (isFullscreen) {
        // Reliable fallback in fullscreen before Telegram insets are dispatched
        totalHeaderHeight = 92;
      } else {
        totalHeaderHeight = 52;
      }
    } else {
      totalHeaderHeight = 52;
    }
  } else {
    totalHeaderHeight = 56;
  }

  root.style.setProperty('--student-header-total-height', `${totalHeaderHeight}px`);

  // Synchronize Telegram native window background and header chrome colors
  if (tg) {
    const currentTheme = theme || root.getAttribute('data-theme') || 'light';
    const bgHex = currentTheme === 'dark' ? '#202124' : '#F5F5F7';
    try {
      tg.setHeaderColor?.(bgHex);
      tg.setBackgroundColor?.(bgHex);
    } catch {}
  }
}

export function setupTelegramFullscreen(theme) {
  if (typeof window === 'undefined') return () => {};
  const tg = window.Telegram?.WebApp;
  if (!tg) {
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
