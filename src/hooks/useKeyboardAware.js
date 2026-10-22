import { useEffect, useRef } from 'react';

/**
 * Hook to handle mobile virtual keyboard appearance and adjust modal viewports.
 * Listens to window.visualViewport resize/scroll, calculates keyboard height,
 * updates CSS variable --kb-height, and smoothly scrolls focused inputs into center.
 * 
 * @param {boolean} isOpen - Whether the modal or interactive popup is currently active
 * @param {Object} [options]
 * @param {React.RefObject} [options.containerRef] - Optional ref to the modal container
 */
export function useKeyboardAware(isOpen = true, options = {}) {
  const { containerRef } = options;
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const rootEl = document.documentElement;
    const bodyEl = document.body;

    const updateKeyboardMetrics = () => {
      if (typeof window === 'undefined') return;

      let kbHeight = 0;
      if (window.visualViewport) {
        // Layout viewport height vs visual viewport height
        const layoutHeight = window.innerHeight;
        const visualHeight = window.visualViewport.height;
        const diff = layoutHeight - visualHeight;

        // A difference greater than ~60px indicates software keyboard on mobile
        if (diff > 60) {
          kbHeight = Math.max(0, Math.round(diff));
        }
      }

      rootEl.style.setProperty('--kb-height', `${kbHeight}px`);

      if (kbHeight > 0) {
        bodyEl.classList.add('has-keyboard-open');
        rootEl.classList.add('has-keyboard-open');
      } else {
        bodyEl.classList.remove('has-keyboard-open');
        rootEl.classList.remove('has-keyboard-open');
      }
    };

    const handleFocusIn = (e) => {
      const target = e.target;
      if (!target || !target.tagName) return;

      const tagName = target.tagName.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      if (!isInput) return;

      const inputType = (target.type || '').toLowerCase();
      if (['checkbox', 'radio', 'hidden', 'file', 'button', 'submit', 'reset'].includes(inputType)) {
        return;
      }

      // If containerRef is supplied, only handle inputs inside this container
      if (containerRef && containerRef.current && !containerRef.current.contains(target)) {
        return;
      }

      // Delay ~300ms to allow mobile OS keyboard slide-in animation to complete
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        try {
          target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        } catch {
          target.scrollIntoView(false);
        }
      }, 300);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardMetrics, { passive: true });
      window.visualViewport.addEventListener('scroll', updateKeyboardMetrics, { passive: true });
      updateKeyboardMetrics();
    }

    document.addEventListener('focusin', handleFocusIn, { passive: true });

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardMetrics);
        window.visualViewport.removeEventListener('scroll', updateKeyboardMetrics);
      }
      document.removeEventListener('focusin', handleFocusIn);

      // Clean up variables & classes
      rootEl.style.setProperty('--kb-height', '0px');
      bodyEl.classList.remove('has-keyboard-open');
      rootEl.classList.remove('has-keyboard-open');
    };
  }, [isOpen, containerRef]);
}

export default useKeyboardAware;
