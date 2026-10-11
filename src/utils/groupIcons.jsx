import React from 'react';
import { normalizeIconUrl, AVATAR_GALLERY_IMAGES } from './avatarGallery';

// Clean, high-contrast Neo-Brutalist SVG icons for Groups
export const GROUP_SVG_ICONS = [
  {
    id: 'folder',
    label: 'Jild',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'laptop',
    label: 'Noutbuk',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: 'code',
    label: 'Dasturlash',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
  {
    id: 'palette',
    label: 'Dizayn',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'rocket',
    label: 'Startap',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
  {
    id: 'book',
    label: 'Ta\'lim',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'target',
    label: 'Maqsad',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'bulb',
    label: 'G\'oya',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5h6.18z" />
      </svg>
    ),
  },
  {
    id: 'flask',
    label: 'Laboratoriya',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31L4.66 18.2A2 2 0 0 0 6.38 21h11.24a2 2 0 0 0 1.72-2.8L14 9.31V2" />
        <line x1="8.5" y1="2" x2="15.5" y2="2" />
        <line x1="6.5" y1="15" x2="17.5" y2="15" />
      </svg>
    ),
  },
  {
    id: 'cpu',
    label: 'Robototexnika',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  {
    id: 'chart',
    label: 'Analitika',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: 'briefcase',
    label: 'Biznes',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: 'globe',
    label: 'Xalqaro / Til',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: 'trophy',
    label: 'G\'olib',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
        <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    id: 'zap',
    label: 'Tezkor',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: 'shield',
    label: 'Xavfsizlik',
    svg: (size = 20) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

// Map legacy emoji to corresponding modern SVG icon id
const EMOJI_TO_SVG_MAP = {
  '📁': 'folder',
  '💻': 'laptop',
  '🎨': 'palette',
  '🚀': 'rocket',
  '📚': 'book',
  '🎯': 'target',
  '💡': 'bulb',
  '🧪': 'flask',
  '🧬': 'cpu',
  '📊': 'chart',
  '💼': 'briefcase',
  '🏠': 'folder',
  '🏆': 'trophy',
  '⚡': 'zap',
  '🛡️': 'shield',
};

// 16 Distinct, Vibrant Light Pastel Card Color Tones (Identical in Light & Dark mode, no colored border outlines)
export const GROUP_COLOR_OPTIONS = [
  { value: '#FFFFFF', name: 'Klassik Oq', border: 'rgba(0, 0, 0, 0.08)', darkBg: '#FFFFFF', darkBorder: 'rgba(0, 0, 0, 0.08)' },
  { value: '#DBEAFE', name: 'Moviy Osmon', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#DBEAFE', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#DCFCE7', name: 'Yalpiz Yashil', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#DCFCE7', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#EDE9FE', name: 'Nafis Lavanda', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#EDE9FE', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#FEF3C7', name: 'Quyosh Nuri', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#FEF3C7', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#FFE4E6', name: 'Atirgul Pushti', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#FFE4E6', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#CCFBF1', name: 'Firuza Zangori', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#CCFBF1', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#FFEDD5', name: 'Iliq Shaftoli', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#FFEDD5', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#CFFAFE', name: 'Tiniq Sian', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#CFFAFE', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#D1FAE5', name: 'Tog\' Zumradi', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#D1FAE5', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#ECFCCB', name: 'Bahor Laymi', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#ECFCCB', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#FEF9C3', name: 'Limon Sariq', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#FEF9C3', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#FEE2E2', name: 'Marjon Qizil', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#FEE2E2', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#FAE8FF', name: 'Yorqin Fuchsiya', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#FAE8FF', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#E0E7FF', name: 'Nilufar Indigo', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#E0E7FF', darkBorder: 'rgba(0, 0, 0, 0.06)' },
  { value: '#F1F5F9', name: 'Neytral Po\'lat', border: 'rgba(0, 0, 0, 0.06)', darkBg: '#F1F5F9', darkBorder: 'rgba(0, 0, 0, 0.06)' },
];

export const OLD_COLOR_MAP = {
  // Old hexes to new light palette mapping
  '#007AFF': '#DBEAFE',
  '#34C759': '#DCFCE7',
  '#FF9500': '#FFEDD5',
  '#AF52DE': '#EDE9FE',
  '#FF2D55': '#FFE4E6',
  '#5856D6': '#E0E7FF',
  '#00C7BE': '#CCFBF1',
  '#F5F5DC': '#FEF9C3',
  '#F4A460': '#FFEDD5',
  '#E35336': '#FEE2E2',
  '#A0522D': '#FEF3C7',
  '#F7F5EF': '#FEF3C7',
  '#EBF2F7': '#DBEAFE',
  '#EDF4ED': '#DCFCE7',
  '#F3F4F6': '#F1F5F9',
  '#FAF3EE': '#FFEDD5',
  '#F5F2F8': '#EDE9FE',
  '#EFECE6': '#ECFCCB',
};

export const getGroupColorOption = (colorValue) => {
  if (!colorValue) return GROUP_COLOR_OPTIONS[0];
  const direct = GROUP_COLOR_OPTIONS.find((c) => c.value.toLowerCase() === colorValue.toLowerCase());
  if (direct) return direct;
  const mappedValue = OLD_COLOR_MAP[colorValue.toUpperCase()] || OLD_COLOR_MAP[colorValue];
  if (mappedValue) {
    const found = GROUP_COLOR_OPTIONS.find((c) => c.value === mappedValue);
    if (found) return found;
  }
  return GROUP_COLOR_OPTIONS[0];
};

export const renderGroupIcon = (iconKey, size = 20) => {
  const normalizedKey = normalizeIconUrl(iconKey);

  if (!normalizedKey) {
    const defaultIcon = GROUP_SVG_ICONS[0];
    return defaultIcon.svg(size);
  }

  // If it's a URL, gallery image path, or uploaded base64 data image
  if (typeof normalizedKey === 'string' && (normalizedKey.startsWith('http') || normalizedKey.startsWith('data:image') || normalizedKey.includes('/') || normalizedKey.includes('.'))) {
    const galleryMatch = AVATAR_GALLERY_IMAGES.find((img) => img.path === normalizedKey || img.cdnPath === normalizedKey || (img.name && normalizedKey.includes(img.name)));
    const cdnFallback = galleryMatch?.cdnPath;

    return (
      <img
        src={normalizedKey}
        alt="group-icon"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (cdnFallback && e.currentTarget.src !== cdnFallback) {
            e.currentTarget.src = cdnFallback;
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  // Check if it's a legacy emoji
  const mappedId = EMOJI_TO_SVG_MAP[normalizedKey] || normalizedKey;

  // Look up in GROUP_SVG_ICONS
  const found = GROUP_SVG_ICONS.find((item) => item.id === mappedId);
  if (found) {
    return found.svg(size);
  }

  // Default fallback
  return GROUP_SVG_ICONS[0].svg(size);
};
