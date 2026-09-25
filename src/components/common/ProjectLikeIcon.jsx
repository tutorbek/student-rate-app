import React from 'react';

export default function ProjectLikeIcon({ size = 16, className = '', glow = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`project-like-icon ${className}`}
      style={{
        verticalAlign: 'middle',
        display: 'inline-block',
        flexShrink: 0,
        filter: glow
          ? 'drop-shadow(0 2px 6px rgba(255, 184, 0, 0.45))'
          : 'drop-shadow(0 1px 2px rgba(217, 119, 6, 0.25))',
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="projectLikeGoldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="45%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="projectLikeCuffGrad" x1="2" y1="10" x2="7" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Base Cuff / Sleeve */}
      <rect
        x="2"
        y="10.5"
        width="4"
        height="10.5"
        rx="1.5"
        fill="url(#projectLikeCuffGrad)"
      />
      {/* Thumb & Hand */}
      <path
        d="M7.5 11.2V21h8.8c1.1 0 2.1-.7 2.4-1.8l2-7.2c.4-1.4-.7-2.8-2.2-2.8h-4.6c.3-1.6.8-3.9.5-5.2-.4-1.6-1.8-2-2.7-1.8-.7.2-1.2.9-1.3 1.6-.2 1.3-.7 3.3-2.9 6.2Z"
        fill="url(#projectLikeGoldGrad)"
      />
      {/* Subtle highlight sheen */}
      <path
        d="M13.2 2.8c-.3 0-.6.2-.7.6-.2 1.3-.7 3.3-2.9 6.2l-.6.8v2.6l1.2-1.6c2.2-2.8 2.8-4.8 3-6.2.1-.8.6-1.5 1.3-1.7-.4-.5-.9-.7-1.3-.7Z"
        fill="#FFFFFF"
        opacity="0.45"
      />
      {/* Finger separator accents */}
      <path
        d="M15 11.5h3.5M14.5 14.5h3.8M14 17.5h3.5"
        stroke="#B45309"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export { ProjectLikeIcon };
