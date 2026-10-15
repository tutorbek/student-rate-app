import { useEffect, useRef } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import { bindTelegramBackButton } from '../utils/telegram';

/**
 * Universal hook for modal dismissal on Escape, Telegram native BackButton, and zero-shift background scroll locking.
 * @param {boolean|any} isOpen - Whether the modal/dialog is currently active
 * @param {Function} onClose - Callback invoked when Escape key or Telegram BackButton is pressed
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.closeOnEscape=true] - Whether Escape key should invoke onClose
 * @param {boolean} [options.enableTelegramBack=true] - Whether Telegram BackButton should invoke onClose
 */
export function useModalDismiss(isOpen, onClose, options = {}) {
  const { closeOnEscape = true, enableTelegramBack = true } = options;
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

    let unbindTg = null;
    if (enableTelegramBack) {
      unbindTg = bindTelegramBackButton(() => {
        onCloseRef.current?.();
      });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unbindTg?.();
      unlockBodyScroll();
    };
  }, [isModalOpen, closeOnEscape, enableTelegramBack]);
}

export default useModalDismiss;
