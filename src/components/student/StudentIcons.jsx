import React from 'react';

// Common Core SVGs
export const HeartIcon = ({ size = 16, className = '', color = '#FF2D55' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block' }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const LikeIcon = ({ size = 16, className = '', color = '#0071E3', filled = true }) => {
  if (!filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0 }}
      >
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={color}
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0 }}
    >
      <rect x="2" y="10" width="3.5" height="12" rx="1" />
      <path d="M7 10.5V22h10.5a2 2 0 0 0 1.92-1.44l2.33-8A2 2 0 0 0 19.83 10H14l.8-4.2a2 2 0 0 0-1.95-2.4 2 2 0 0 0-1.85 1.25L7 10.5z" />
    </svg>
  );
};

export const ThumbsUpIcon = LikeIcon;

export const CrownIcon = ({ size = 18, className = '', color = '#F59E0B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block', color }}
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
  </svg>
);

export const TrophyIcon = ({ size = 18, className = '', color = '#F59E0B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block' }}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const TargetIcon = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block' }}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const ZapIcon = ({ size = 16, className = '', color = '#F59E0B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block', color }}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const FlameIcon = ({ size = 16, className = '', color = '#FF3B30' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block', color }}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const StarIcon = ({ size = 16, className = '', color = '#F59E0B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block', color }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const CheckIcon = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block' }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const SearchIcon = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block' }}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const ShoppingBagIcon = ({ size = 16, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block' }}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// 13 Shop Rewards SVG Specifications with Themed Pastel Squircles
export const REWARD_VISUALS = {
  pen_set: {
    theme: 'blue',
    bg: 'rgba(0, 113, 227, 0.1)',
    color: '#0071E3',
    darkBg: 'rgba(0, 113, 227, 0.22)',
    darkColor: '#58A6FF',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
  },
  sticker_pack: {
    theme: 'purple',
    bg: 'rgba(175, 82, 222, 0.1)',
    color: '#AF52DE',
    darkBg: 'rgba(175, 82, 222, 0.22)',
    darkColor: '#D08BF8',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
  },
  notebook: {
    theme: 'amber',
    bg: 'rgba(255, 149, 0, 0.12)',
    color: '#FF9500',
    darkBg: 'rgba(255, 149, 0, 0.22)',
    darkColor: '#FFB340',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
        <path d="M6 14h6" />
      </svg>
    ),
  },
  brand_pen_notebook: {
    theme: 'teal',
    bg: 'rgba(0, 199, 190, 0.12)',
    color: '#00A39B',
    darkBg: 'rgba(0, 199, 190, 0.22)',
    darkColor: '#4DE6DC',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2v6" />
        <path d="M21 6V2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
        <path d="M18 10h-6" />
        <path d="M18 14h-6" />
        <path d="M8 18h4" />
      </svg>
    ),
  },
  book_dictionary: {
    theme: 'emerald',
    bg: 'rgba(52, 199, 89, 0.12)',
    color: '#28A745',
    darkBg: 'rgba(52, 199, 89, 0.22)',
    darkColor: '#4CD964',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  pizza_day: {
    theme: 'coral',
    bg: 'rgba(255, 59, 48, 0.12)',
    color: '#FF3B30',
    darkBg: 'rgba(255, 59, 48, 0.22)',
    darkColor: '#FF6459',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 11h.01" />
        <path d="M11 15h.01" />
        <path d="M16 16h.01" />
        <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z" />
        <path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4" />
      </svg>
    ),
  },
  full_writing_kit: {
    theme: 'cyan',
    bg: 'rgba(50, 173, 230, 0.12)',
    color: '#007AFF',
    darkBg: 'rgba(50, 173, 230, 0.22)',
    darkColor: '#5AC8FA',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" />
        <path d="M16 4 20 8" />
        <path d="m13 7 7-7 4 4-7 7" />
        <path d="M6 14l4 4" />
      </svg>
    ),
  },
  gaming_hour: {
    theme: 'indigo',
    bg: 'rgba(88, 86, 214, 0.12)',
    color: '#5856D6',
    darkBg: 'rgba(88, 86, 214, 0.22)',
    darkColor: '#7D7AFF',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
        <rect x="2" y="6" width="20" height="12" rx="4" />
      </svg>
    ),
  },
  school_backpack: {
    theme: 'blue',
    bg: 'rgba(0, 122, 255, 0.12)',
    color: '#007AFF',
    darkBg: 'rgba(0, 122, 255, 0.22)',
    darkColor: '#60A5FA',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
        <path d="M8 10h8" />
      </svg>
    ),
  },
  earbuds: {
    theme: 'pink',
    bg: 'rgba(255, 45, 85, 0.12)',
    color: '#FF2D55',
    darkBg: 'rgba(255, 45, 85, 0.22)',
    darkColor: '#FF6482',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
      </svg>
    ),
  },
  powerbank: {
    theme: 'orange',
    bg: 'rgba(255, 149, 0, 0.12)',
    color: '#FF9500',
    darkBg: 'rgba(255, 149, 0, 0.22)',
    darkColor: '#FFA726',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="m13 7-3 5h4l-3 5" />
      </svg>
    ),
  },
  smartwatch: {
    theme: 'slate',
    bg: 'rgba(94, 92, 230, 0.12)',
    color: '#5E5CE6',
    darkBg: 'rgba(94, 92, 230, 0.22)',
    darkColor: '#8E8CFA',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="5" width="12" height="14" rx="4" />
        <path d="M10 2h4" />
        <path d="M10 22h4" />
        <path d="M12 9v3l2 1" />
      </svg>
    ),
  },
  year_champion: {
    theme: 'gold',
    bg: 'linear-gradient(135deg, rgba(255, 214, 10, 0.28), rgba(255, 149, 0, 0.18))',
    color: '#D97706',
    darkBg: 'linear-gradient(135deg, rgba(255, 214, 10, 0.38), rgba(255, 149, 0, 0.28))',
    darkColor: '#FBBF24',
    svg: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
};

export const RewardSquircle = ({ rewardId, size = 44, iconSize = 22, className = '' }) => {
  const visual = REWARD_VISUALS[rewardId] || REWARD_VISUALS.pen_set;
  return (
    <div
      className={`reward-squircle-box theme-${visual.theme} ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: Math.round(size * 0.3),
        background: visual.bg,
        color: visual.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ width: iconSize, height: iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {visual.svg}
      </div>
    </div>
  );
};
