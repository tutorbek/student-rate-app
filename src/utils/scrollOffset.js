/**
 * Safely scrolls to an element leaving a clean gap below the sticky navbar.
 * @param {string|HTMLElement} target - ID of the element or element itself.
 * @param {number} [desktopOffset=80] - Distance in px below viewport top for desktop.
 * @param {number} [mobileOffset=72] - Distance in px below viewport top for mobile.
 */
export function scrollToWithOffset(target, desktopOffset = 80, mobileOffset = 72) {
  if (typeof window === 'undefined') return;
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;

  const isMobile = window.innerWidth <= 680;
  const offset = isMobile ? mobileOffset : desktopOffset;
  const elementPosition = el.getBoundingClientRect().top;
  const targetY = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth'
  });
}
