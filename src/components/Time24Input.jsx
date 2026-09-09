import React, { useState, useRef, useEffect } from 'react';

const COMMON_TIMES_24 = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

/**
 * Format string as user types in 24h format (HH:MM)
 */
const formatInput24 = (raw) => {
  if (!raw) return '';
  // Convert dots/commas to colon, remove illegal chars
  let clean = raw.replace(/[.,]/g, ':').replace(/[^0-9:]/g, '');

  if (!clean.includes(':')) {
    if (clean.length === 3) {
      if (parseInt(clean.slice(0, 2), 10) > 23) {
        clean = '0' + clean[0] + ':' + clean.slice(1);
      } else {
        clean = clean.slice(0, 2) + ':' + clean.slice(2);
      }
    } else if (clean.length >= 4) {
      clean = clean.slice(0, 2) + ':' + clean.slice(2, 4);
    }
  }

  const parts = clean.split(':');
  let h = parts[0] || '';
  let m = parts[1] !== undefined ? parts[1] : null;

  if (h.length > 2) h = h.slice(0, 2);
  if (h.length === 2 && parseInt(h, 10) > 23) h = '23';

  if (m !== null) {
    if (m.length > 2) m = m.slice(0, 2);
    if (m.length === 2 && parseInt(m, 10) > 59) m = '59';
    return `${h}:${m}`;
  }
  return h;
};

/**
 * Normalize to valid HH:MM when user leaves the input
 */
const normalizeOnBlur = (raw) => {
  if (!raw || !raw.trim()) return '';
  let val = raw.trim().replace(/[.,]/g, ':').replace(/[^0-9:]/g, '');
  if (!val) return '';

  if (!val.includes(':')) {
    if (val.length <= 2) {
      let h = Math.min(23, parseInt(val, 10) || 0);
      return `${String(h).padStart(2, '0')}:00`;
    } else if (val.length === 3) {
      val = val[0] + ':' + val.slice(1);
    } else {
      val = val.slice(0, 2) + ':' + val.slice(2, 4);
    }
  }

  const [hPart, mPart] = val.split(':');
  let h = Math.min(23, parseInt(hPart || '0', 10));
  let m = Math.min(59, parseInt(mPart || '0', 10));

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const Time24Input = ({
  value = '',
  onChange = () => {},
  placeholder = '15:30',
  className = '',
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        e.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const formatted = formatInput24(e.target.value);
    onChange(formatted);
  };

  const handleBlur = () => {
    const normalized = normalizeOnBlur(value);
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  const handleSelectTime = (timeStr) => {
    onChange(timeStr);
    setIsOpen(false);
  };

  return (
    <div className="time24-input-container" ref={containerRef}>
      <div className="time24-input-wrap">
        <input
          type="text"
          inputMode="numeric"
          className={`form-input time24-input-field ${className}`}
          placeholder={placeholder}
          maxLength={5}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          className={`time24-trigger-btn ${isOpen ? 'active' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          tabIndex={-1}
          title="24 soatlik vaqtni tanlash"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="time24-dropdown glass-card">
          <div className="time24-dropdown-header">
            <span>24 soatlik vaqt (soat:daqiqa)</span>
          </div>
          <div className="time24-dropdown-grid">
            {COMMON_TIMES_24.map((t) => (
              <button
                key={t}
                type="button"
                className={`time24-slot-btn ${value === t ? 'selected' : ''}`}
                onClick={() => handleSelectTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .time24-input-container {
          position: relative;
          width: 100%;
        }

        .time24-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .time24-input-field {
          width: 100%;
          padding-right: 36px !important;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
          font-weight: 600;
        }

        .time24-trigger-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .time24-trigger-btn:hover,
        .time24-trigger-btn.active {
          color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.08);
        }

        .time24-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 220px;
          max-height: 220px;
          overflow-y: auto;
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 2100;
          padding: 8px;
          animation: fadeInScale 0.12s ease-out;
        }

        .time24-dropdown-header {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-tertiary, #86868B);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 4px 6px 6px;
          border-bottom: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.06));
          margin-bottom: 6px;
        }

        .time24-dropdown-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        .time24-slot-btn {
          padding: 6px 4px;
          font-size: 0.82rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.08));
          border-radius: 6px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
        }

        .time24-slot-btn:hover {
          background: rgba(0, 113, 227, 0.08);
          border-color: var(--apple-blue);
          color: var(--apple-blue);
        }

        .time24-slot-btn.selected {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }

        [data-theme="dark"] .time24-dropdown {
          background: #292A2D;
          border-color: #3C4043;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
        }

        [data-theme="dark"] .time24-slot-btn {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .time24-slot-btn:hover {
          background: #35363A;
          color: #8AB4F8;
          border-color: #8AB4F8;
        }

        [data-theme="dark"] .time24-slot-btn.selected {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }
      `}</style>
    </div>
  );
};

export default Time24Input;
