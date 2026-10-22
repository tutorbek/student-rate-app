/**
 * Zero-layout-shift body scroll lock utility.
 * Prevents background scrolling while avoiding layout shifts, coordinate jumps,
 * or breaking desktop zoom (e.g. zoom: 0.9).
 */

let lockCount = 0;
let originalStyles = null;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount++;
  if (lockCount === 1) {
    originalStyles = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverscrollBehavior: document.body.style.overscrollBehavior,
      htmlOverscrollBehavior: document.documentElement.style.overscrollBehavior,
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';
  }
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && originalStyles) {
    document.documentElement.style.overflow = originalStyles.htmlOverflow || '';
    document.body.style.overflow = originalStyles.bodyOverflow || '';
    document.documentElement.style.overscrollBehavior = originalStyles.htmlOverscrollBehavior || '';
    document.body.style.overscrollBehavior = originalStyles.bodyOverscrollBehavior || '';
    originalStyles = null;
  }
}
