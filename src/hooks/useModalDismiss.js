import { useEffect, useRef } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

/**
 * Universal hook for modal dismissal on Escape and zero-shift background scroll locking.
 * @param {boolean|any} isOpen - Whether the modal/dialog is currently active
 * @param {Function} onClose - Callback invoked when Escape key is pressed
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.closeOnEscape=true] - Whether Escape key should invoke onClose
 */
export function useModalDismiss(isOpen, onClose, options = {}) {
  const { closeOnEscape = true } = options;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isModalOpen = Boolean(isOpen);

  useEffect(() => {
    if (!isModalOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isModalOpen, closeOnEscape]);
}

export default useModalDismiss;
