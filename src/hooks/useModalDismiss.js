import { useEffect, useRef } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import { useKeyboardAware } from './useKeyboardAware';

/**
 * Universal hook for modal dismissal on Escape, zero-shift background scroll locking,
 * and mobile virtual keyboard awareness.
 * 
 * @param {boolean|any} isOpen - Whether the modal/dialog is currently active
 * @param {Function} onClose - Callback invoked when Escape key is pressed
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.closeOnEscape=true] - Whether Escape key should invoke onClose
 * @param {boolean} [options.keyboardAware=true] - Whether to activate visualViewport keyboard tracking
 */
export function useModalDismiss(isOpen, onClose, options = {}) {
  const { closeOnEscape = true, keyboardAware = true } = options;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isModalOpen = Boolean(isOpen);

  // Automatically track mobile virtual keyboard when modal is open
  useKeyboardAware(isModalOpen && keyboardAware);

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
