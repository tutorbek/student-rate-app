import React, { useState, useEffect, useRef } from 'react';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  const isDraggingRef = useRef(false);
  const PULL_THRESHOLD = 75; // px required to trigger refresh

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only trigger if user is at the top of the page
      if (window.scrollY <= 2) {
        touchStartRef.current = e.touches[0].clientY;
        isDraggingRef.current = true;
      } else {
        isDraggingRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartRef.current;

      if (distance > 0 && window.scrollY <= 2) {
        // Apply resistance curve
        const pull = Math.min(distance * 0.45, 110);
        setPullDistance(pull);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);

        // Haptic feedback if supported
        if (navigator.vibrate) {
          try {
            navigator.vibrate(20);
          } catch (_) {
            // ignore vibrate error
          }
        }

        try {
          if (onRefresh) {
            await onRefresh();
          }
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 600);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div className="ptr-wrapper">
      {/* Pull Indicator Badge */}
      <div 
        className={`ptr-indicator ${isRefreshing ? 'is-refreshing' : ''}`}
        style={{
          transform: `translate3d(-50%, ${pullDistance - 50}px, 0)`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0
        }}
      >
        <div className="ptr-content">
          <span className={`ptr-spinner ${isRefreshing ? 'spinning' : ''}`}>
            🔄
          </span>
          <span className="ptr-text">
            {isRefreshing ? "Sinxronlanmoqda..." : pullDistance >= PULL_THRESHOLD ? "Quyiga qo'yib yuboring" : "Yangilash uchun suring"}
          </span>
        </div>
      </div>

      {children}

      <style jsx>{`
        .ptr-wrapper {
          position: relative;
          width: 100%;
          min-height: 100%;
        }

        .ptr-indicator {
          position: fixed;
          top: 12px;
          left: 50%;
          z-index: 9999;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          padding: 8px 16px;
          border-radius: 30px;
          pointer-events: none;
          transition: opacity 0.15s ease, transform 0.15s ease-out;
        }

        .ptr-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ptr-spinner {
          display: inline-block;
          font-size: 1rem;
          transition: transform 0.2s ease;
        }

        .ptr-spinner.spinning {
          animation: ptrSpin 0.75s linear infinite;
        }

        .ptr-text {
          font-size: 0.82rem;
          font-weight: 800;
          color: #000000;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: -0.2px;
        }

        @keyframes ptrSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;
