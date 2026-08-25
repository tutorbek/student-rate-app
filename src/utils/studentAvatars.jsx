import React from 'react';
import { normalizeIconUrl } from './avatarGallery';

// Ultra-vibrant, high-detail, expressive SVG avatars for students
export const STUDENT_AVATARS = [
  // --- Animals (Original + 7 New Animals) ---
  {
    id: 'lion',
    label: 'Arslon',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="#F59E0B" />
        <circle cx="16" cy="16.5" r="9.5" fill="#FEF3C7" />
        <circle cx="8" cy="8" r="3.2" fill="#D97706" />
        <circle cx="24" cy="8" r="3.2" fill="#D97706" />
        <circle cx="8" cy="8" r="1.6" fill="#FDE68A" />
        <circle cx="24" cy="8" r="1.6" fill="#FDE68A" />
        <circle cx="12" cy="15" r="1.8" fill="#1E293B" />
        <circle cx="20" cy="15" r="1.8" fill="#1E293B" />
        <circle cx="11.4" cy="14.3" r="0.6" fill="#FFF" />
        <circle cx="19.4" cy="14.3" r="0.6" fill="#FFF" />
        <polygon points="16,17.2 13.8,19.2 18.2,19.2" fill="#B45309" />
        <path d="M14 20.8c.8.8 3.2.8 4 0" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="9.5" cy="18" r="1.5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="22.5" cy="18" r="1.5" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'tiger',
    label: 'Yo\'lbars',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#F97316" />
        <circle cx="6.5" cy="7.5" r="3.8" fill="#EA580C" />
        <circle cx="25.5" cy="7.5" r="3.8" fill="#EA580C" />
        <circle cx="6.5" cy="7.5" r="1.8" fill="#FEF3C7" />
        <circle cx="25.5" cy="7.5" r="1.8" fill="#FEF3C7" />
        <ellipse cx="16" cy="20.5" rx="7.2" ry="5.5" fill="#FEF3C7" />
        <path d="M16 3.5v4M12.5 4.5l2.5 3M19.5 4.5l-2.5 3M4.5 15.5h4.5M23 15.5h4.5" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="14" r="1.8" fill="#1E293B" />
        <circle cx="20" cy="14" r="1.8" fill="#1E293B" />
        <circle cx="11.4" cy="13.3" r="0.6" fill="#FFF" />
        <circle cx="19.4" cy="13.3" r="0.6" fill="#FFF" />
        <polygon points="16,18 14,20.2 18,20.2" fill="#EA580C" />
        <path d="M14.5 21.8c.6.6 2.4.6 3 0" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="9" cy="19" r="1.5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="23" cy="19" r="1.5" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'panda',
    label: 'Panda',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="7.5" cy="7.5" r="4.8" fill="#0F172A" />
        <circle cx="24.5" cy="7.5" r="4.8" fill="#0F172A" />
        <circle cx="16" cy="17" r="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
        <ellipse cx="11.2" cy="15" rx="3.2" ry="4" transform="rotate(-15 11.2 15)" fill="#0F172A" />
        <ellipse cx="20.8" cy="15" rx="3.2" ry="4" transform="rotate(15 20.8 15)" fill="#0F172A" />
        <circle cx="11.5" cy="14.5" r="1.3" fill="#FFFFFF" />
        <circle cx="20.5" cy="14.5" r="1.3" fill="#FFFFFF" />
        <circle cx="11.7" cy="14.3" r="0.7" fill="#0F172A" />
        <circle cx="20.3" cy="14.3" r="0.7" fill="#0F172A" />
        <circle cx="11.3" cy="14" r="0.3" fill="#FFF" />
        <circle cx="20.7" cy="14" r="0.3" fill="#FFF" />
        <ellipse cx="16" cy="20" rx="2.2" ry="1.5" fill="#0F172A" />
        <path d="M14.5 22.2c.6.6 2.4.6 3 0" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7.5" cy="19.5" r="1.8" fill="#FDA4AF" opacity="0.6" />
        <circle cx="24.5" cy="19.5" r="1.8" fill="#FDA4AF" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'koala',
    label: 'Koala',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="6" cy="9.5" r="5.2" fill="#94A3B8" />
        <circle cx="26" cy="9.5" r="5.2" fill="#94A3B8" />
        <circle cx="6" cy="9.5" r="2.8" fill="#F1F5F9" />
        <circle cx="26" cy="9.5" r="2.8" fill="#F1F5F9" />
        <circle cx="16" cy="18" r="11.5" fill="#94A3B8" />
        <circle cx="11.5" cy="15" r="1.8" fill="#0F172A" />
        <circle cx="20.5" cy="15" r="1.8" fill="#0F172A" />
        <circle cx="11" cy="14.4" r="0.6" fill="#FFF" />
        <circle cx="20" cy="14.4" r="0.6" fill="#FFF" />
        <ellipse cx="16" cy="18.5" rx="3.6" ry="4.8" fill="#334155" />
        <ellipse cx="16" cy="17" rx="1.4" ry="1.6" fill="#64748B" />
        <circle cx="8" cy="20" r="1.6" fill="#FDA4AF" opacity="0.6" />
        <circle cx="24" cy="20" r="1.6" fill="#FDA4AF" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'fox',
    label: 'Tulki',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="5,3 12,14 3,12" fill="#EA580C" />
        <polygon points="27,3 29,12 20,14" fill="#EA580C" />
        <polygon points="6.5,5.5 11,13 4.5,11" fill="#FEF3C7" />
        <polygon points="25.5,5.5 27.5,11 21,13" fill="#FEF3C7" />
        <circle cx="16" cy="18" r="11.5" fill="#EA580C" />
        <path d="M4.5 18c0 6 5 11 11.5 11s11.5-5 11.5-11c0-4-4-2-7-1-2 .8-3.5 3-4.5 3s-2.5-2.2-4.5-3c-3-1-7-3-7 1z" fill="#FFFFFF" />
        <circle cx="11.5" cy="16.5" r="1.8" fill="#1E293B" />
        <circle cx="20.5" cy="16.5" r="1.8" fill="#1E293B" />
        <circle cx="11" cy="15.8" r="0.6" fill="#FFF" />
        <circle cx="20" cy="15.8" r="0.6" fill="#FFF" />
        <circle cx="16" cy="23.5" r="1.8" fill="#1E293B" />
        <circle cx="8" cy="21" r="1.5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="24" cy="21" r="1.5" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'rabbit',
    label: 'Quyon',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <ellipse cx="10.5" cy="7.5" rx="3.2" ry="7.5" fill="#E2E8F0" />
        <ellipse cx="21.5" cy="7.5" rx="3.2" ry="7.5" fill="#E2E8F0" />
        <ellipse cx="10.5" cy="7.5" rx="1.8" ry="5.5" fill="#F472B6" />
        <ellipse cx="21.5" cy="7.5" rx="1.8" ry="5.5" fill="#F472B6" />
        <circle cx="16" cy="19.5" r="10.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="12" cy="18.5" r="1.8" fill="#0F172A" />
        <circle cx="20" cy="18.5" r="1.8" fill="#0F172A" />
        <circle cx="11.4" cy="17.8" r="0.6" fill="#FFF" />
        <circle cx="19.4" cy="17.8" r="0.6" fill="#FFF" />
        <polygon points="16,21 14.8,22.8 17.2,22.8" fill="#F43F5E" />
        <path d="M14 24c.8.6 3.2.6 4 0" stroke="#F43F5E" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7.5" cy="21.5" r="2.2" fill="#FECDD3" />
        <circle cx="24.5" cy="21.5" r="2.2" fill="#FECDD3" />
      </svg>
    ),
  },
  {
    id: 'cat',
    label: 'Mushuk',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="5,5 13,14 4,14" fill="#FBBF24" />
        <polygon points="27,5 28,14 19,14" fill="#FBBF24" />
        <polygon points="6.5,7.5 11.5,13 5.5,13" fill="#F472B6" />
        <polygon points="25.5,7.5 26.5,13 20.5,13" fill="#F472B6" />
        <circle cx="16" cy="18.5" r="11.5" fill="#FBBF24" />
        <circle cx="11.5" cy="17.5" r="1.8" fill="#1E293B" />
        <circle cx="20.5" cy="17.5" r="1.8" fill="#1E293B" />
        <circle cx="11" cy="16.8" r="0.6" fill="#FFF" />
        <circle cx="20" cy="16.8" r="0.6" fill="#FFF" />
        <polygon points="16,20.5 14.5,22 17.5,22" fill="#F43F5E" />
        <path d="M14.5 23.5c.6.6 2.4.6 3 0M5 19h4M5 21.5h4M23 19h4M23 21.5h4" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="8" cy="20" r="1.6" fill="#FCA5A5" opacity="0.6" />
        <circle cx="24" cy="20" r="1.6" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'dog',
    label: 'Kuchuk',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <ellipse cx="5.5" cy="13.5" rx="3.5" ry="7" transform="rotate(15 5.5 13.5)" fill="#92400E" />
        <ellipse cx="26.5" cy="13.5" rx="3.5" ry="7" transform="rotate(-15 26.5 13.5)" fill="#92400E" />
        <circle cx="16" cy="17.5" r="11.5" fill="#D97706" />
        <ellipse cx="16" cy="21.5" rx="6.5" ry="5.5" fill="#FEF3C7" />
        <circle cx="11.5" cy="15.5" r="1.8" fill="#1E293B" />
        <circle cx="20.5" cy="15.5" r="1.8" fill="#1E293B" />
        <circle cx="11" cy="14.8" r="0.6" fill="#FFF" />
        <circle cx="20" cy="14.8" r="0.6" fill="#FFF" />
        <ellipse cx="16" cy="20" rx="2.6" ry="1.8" fill="#1E293B" />
        <path d="M14.5 22.8c.6.8 2.4.8 3 0" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="8" cy="19.5" r="1.6" fill="#FCA5A5" opacity="0.6" />
        <circle cx="24" cy="19.5" r="1.6" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'owl',
    label: 'Boyo\'g\'li',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#78350F" />
        <polygon points="6.5,3.5 12,8 5,11" fill="#92400E" />
        <polygon points="25.5,3.5 27,11 20,8" fill="#92400E" />
        <ellipse cx="16" cy="22" rx="7" ry="6" fill="#FDE68A" />
        <circle cx="11" cy="14" r="4.5" fill="#F8FAFC" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="21" cy="14" r="4.5" fill="#F8FAFC" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="11" cy="14" r="2.4" fill="#0284C7" />
        <circle cx="21" cy="14" r="2.4" fill="#0284C7" />
        <circle cx="11" cy="14" r="1.2" fill="#0F172A" />
        <circle cx="21" cy="14" r="1.2" fill="#0F172A" />
        <circle cx="10.4" cy="13.2" r="0.6" fill="#FFF" />
        <circle cx="20.4" cy="13.2" r="0.6" fill="#FFF" />
        <polygon points="16,16.5 13.8,20 18.2,20" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    id: 'parrot',
    label: 'To\'tiqush',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="15" cy="16" r="12.5" fill="#16A34A" />
        <path d="M12 3.5c5 0 10 4 10 11.5 0 7-5 12.5-10 12.5" fill="#22C55E" />
        <circle cx="18" cy="12" r="3.2" fill="#FFFFFF" />
        <circle cx="18" cy="12" r="1.6" fill="#0F172A" />
        <circle cx="17.4" cy="11.4" r="0.5" fill="#FFF" />
        <path d="M22 12c3 0 6.5 2 6.5 6-2.5 1-4.5 1-6.5 0v-6z" fill="#F59E0B" />
        <path d="M22 17c1.5 0 3.2.5 3.2 2-1.2.8-2.2.8-3.2 0v-2z" fill="#D97706" />
        <ellipse cx="8.5" cy="19" rx="4" ry="7" fill="#EAB308" />
        <ellipse cx="5.5" cy="20" rx="3" ry="6" fill="#DC2626" />
      </svg>
    ),
  },
  {
    id: 'eagle',
    label: 'Burgut',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#78350F" />
        <circle cx="16" cy="13.5" r="10" fill="#FFFFFF" />
        <polygon points="16,13.5 26.5,17 16,21.5" fill="#F59E0B" />
        <polygon points="16,17 24.5,18.5 16,20.5" fill="#D97706" />
        <circle cx="13" cy="12" r="2.2" fill="#F59E0B" />
        <circle cx="13" cy="12" r="1.2" fill="#0F172A" />
        <circle cx="12.6" cy="11.5" r="0.4" fill="#FFF" />
        <line x1="9.5" y1="8.5" x2="16" y2="10" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'penguin',
    label: 'Pingvin',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <ellipse cx="16" cy="16" rx="12" ry="14" fill="#0F172A" />
        <ellipse cx="16" cy="18" rx="8.5" ry="11.5" fill="#FFFFFF" />
        <circle cx="12" cy="12.5" r="1.8" fill="#0F172A" />
        <circle cx="20" cy="12.5" r="1.8" fill="#0F172A" />
        <circle cx="11.4" cy="11.8" r="0.6" fill="#FFF" />
        <circle cx="19.4" cy="11.8" r="0.6" fill="#FFF" />
        <polygon points="16,14 13,17.5 19,17.5" fill="#F97316" />
        <ellipse cx="10.5" cy="29.2" rx="3.8" ry="1.8" fill="#F97316" />
        <ellipse cx="21.5" cy="29.2" rx="3.8" ry="1.8" fill="#F97316" />
        <circle cx="7.5" cy="16" r="1.6" fill="#FDA4AF" opacity="0.7" />
        <circle cx="24.5" cy="16" r="1.6" fill="#FDA4AF" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'butterfly',
    label: 'Kapalak',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M15 13c-4-8-12-8-12 0 0 5 6 9.5 12 4z" fill="#0284C7" />
        <path d="M17 13c4-8 12-8 12 0 0 5-6 9.5-12 4z" fill="#0284C7" />
        <path d="M15 15.5c-3 2-8 5-7 9.5 1 3 6.5 1 7-5.5z" fill="#38BDF8" />
        <path d="M17 15.5c3 2 8 5 7 9.5-1 3-6.5 1-7-5.5z" fill="#38BDF8" />
        <ellipse cx="16" cy="16" rx="1.8" ry="8.5" fill="#1E1B4B" />
        <circle cx="8.5" cy="9.5" r="2.8" fill="#BAE6FD" />
        <circle cx="23.5" cy="9.5" r="2.8" fill="#BAE6FD" />
        <path d="M15 7.5c-1-3-3-4-5-4M17 7.5c1-3 3-4 5-4" stroke="#1E1B4B" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'bee',
    label: 'Asalari',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <ellipse cx="10.5" cy="9.5" rx="5" ry="7.5" transform="rotate(-30 10.5 9.5)" fill="#BAE6FD" opacity="0.85" stroke="#7DD3FC" strokeWidth="0.8" />
        <ellipse cx="21.5" cy="9.5" rx="5" ry="7.5" transform="rotate(30 21.5 9.5)" fill="#BAE6FD" opacity="0.85" stroke="#7DD3FC" strokeWidth="0.8" />
        <ellipse cx="16" cy="18" rx="9.5" ry="11.5" fill="#FACC15" />
        <path d="M7 14.5h18M6.5 18.5h19M7.5 22.5h17" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="12.5" cy="11.5" r="1.8" fill="#0F172A" />
        <circle cx="19.5" cy="11.5" r="1.8" fill="#0F172A" />
        <circle cx="12" cy="10.8" r="0.6" fill="#FFF" />
        <circle cx="19" cy="10.8" r="0.6" fill="#FFF" />
        <polygon points="16,29.5 14,27 18,27" fill="#0F172A" />
        <circle cx="8" cy="15" r="1.5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="24" cy="15" r="1.5" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'ladybug',
    label: 'Xonqizi',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="9.5" r="5.2" fill="#0F172A" />
        <circle cx="16" cy="18" r="11.5" fill="#EF4444" />
        <line x1="16" y1="6.5" x2="16" y2="29.5" stroke="#0F172A" strokeWidth="2" />
        <circle cx="10.5" cy="14" r="2.2" fill="#0F172A" />
        <circle cx="21.5" cy="14" r="2.2" fill="#0F172A" />
        <circle cx="9.5" cy="21.5" r="2" fill="#0F172A" />
        <circle cx="22.5" cy="21.5" r="2" fill="#0F172A" />
        <circle cx="13" cy="8.5" r="0.8" fill="#FFF" />
        <circle cx="19" cy="8.5" r="0.8" fill="#FFF" />
        <path d="M13 5.5c-2-2-4-3-6-2M19 5.5c2-2 4-3 6-2" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'unicorn',
    label: 'Yakkashox',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="16,1.5 13.5,12 18.5,12" fill="#F59E0B" />
        <polygon points="16,3 14.5,10 17.5,10" fill="#FEF08A" />
        <circle cx="16" cy="18" r="11.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
        <path d="M5.5 13.5c2-5.5 6.5-8.5 10.5-8.5M4.5 17.5c1-4.5 4.5-6.5 7.5-6.5" stroke="#EC4899" strokeWidth="2.8" strokeLinecap="round" />
        <polygon points="7.5,6.5 12,12 5.5,12" fill="#F472B6" />
        <circle cx="12" cy="16.5" r="1.8" fill="#0F172A" />
        <circle cx="20" cy="16.5" r="1.8" fill="#0F172A" />
        <circle cx="11.4" cy="15.8" r="0.6" fill="#FFF" />
        <circle cx="19.4" cy="15.8" r="0.6" fill="#FFF" />
        <ellipse cx="16" cy="22.8" rx="4.2" ry="2.6" fill="#FCE7F3" />
        <circle cx="14.2" cy="22.8" r="0.8" fill="#EC4899" />
        <circle cx="17.8" cy="22.8" r="0.8" fill="#EC4899" />
        <circle cx="8" cy="19.5" r="1.6" fill="#FDA4AF" opacity="0.7" />
        <circle cx="24" cy="19.5" r="1.6" fill="#FDA4AF" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'dino',
    label: 'Dinozavr',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M6 26c0-9 4.5-16.5 14-16.5h4.5v6.5c0 4.5-3.5 8-8 8H6z" fill="#22C55E" />
        <polygon points="18,4.5 21.5,9.5 14.5,9.5" fill="#15803D" />
        <polygon points="11.5,6.5 15,11.5 8.5,11.5" fill="#15803D" />
        <circle cx="19.5" cy="13.5" r="2" fill="#0F172A" />
        <circle cx="19" cy="12.8" r="0.7" fill="#FFF" />
        <ellipse cx="23.5" cy="15.5" rx="1.2" ry="1.6" fill="#15803D" />
        <path d="M15.5 21h7.5" stroke="#15803D" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="13" cy="19.5" r="1.5" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'dragon',
    label: 'Ajdaho',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12.5" fill="#10B981" />
        <polygon points="8.5,3.5 12,9.5 5.5,9.5" fill="#F59E0B" />
        <polygon points="23.5,3.5 26.5,9.5 20,9.5" fill="#F59E0B" />
        <ellipse cx="11.5" cy="14" rx="2.2" ry="2.8" fill="#F59E0B" />
        <ellipse cx="20.5" cy="14" rx="2.2" ry="2.8" fill="#F59E0B" />
        <circle cx="11.5" cy="14" r="1.2" fill="#0F172A" />
        <circle cx="20.5" cy="14" r="1.2" fill="#0F172A" />
        <circle cx="11" cy="13.3" r="0.4" fill="#FFF" />
        <circle cx="20" cy="13.3" r="0.4" fill="#FFF" />
        <ellipse cx="16" cy="21.5" rx="5.5" ry="3.8" fill="#059669" />
        <circle cx="13.8" cy="21" r="1.1" fill="#0F172A" />
        <circle cx="18.2" cy="21" r="1.1" fill="#0F172A" />
        <path d="M13 25.5c1.8 2.2 4.2 2.2 6 0" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'bear',
    label: 'Ayiqcha',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="7.5" cy="7.5" r="4.2" fill="#B45309" />
        <circle cx="24.5" cy="7.5" r="4.2" fill="#B45309" />
        <circle cx="7.5" cy="7.5" r="2.2" fill="#FDE68A" />
        <circle cx="24.5" cy="7.5" r="2.2" fill="#FDE68A" />
        <circle cx="16" cy="18" r="11.5" fill="#B45309" />
        <ellipse cx="16" cy="21.5" rx="5.5" ry="4.5" fill="#FDE68A" />
        <circle cx="12" cy="15" r="1.8" fill="#1E293B" />
        <circle cx="20" cy="15" r="1.8" fill="#1E293B" />
        <circle cx="11.4" cy="14.3" r="0.6" fill="#FFF" />
        <circle cx="19.4" cy="14.3" r="0.6" fill="#FFF" />
        <ellipse cx="16" cy="19.8" rx="2.2" ry="1.6" fill="#1E293B" />
        <circle cx="8" cy="19.5" r="1.6" fill="#FDA4AF" opacity="0.6" />
        <circle cx="24" cy="19.5" r="1.6" fill="#FDA4AF" opacity="0.6" />
      </svg>
    ),
  },

  // --- 7 NEW ANIMAL ICONS ---
  {
    id: 'dolphin',
    label: 'Delfin',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M4 22c2-8 10-16 19-14 3 .7 5 3.5 5 6.5 0 5-6 9-13 11-4 1-8-1-11-3.5z" fill="#0284C7" />
        <path d="M12 18c3-4 8-8 14-6.5 1 .3 2 1.5 2 3 0 4-4.5 7-10 8.5-3 .8-4-1-6-5z" fill="#38BDF8" />
        <path d="M15 8c2-4 5-5 7-4-1 2-2 4-4 5-1 .5-2 0-3-1z" fill="#0369A1" />
        <path d="M4 22c-2-2-3-4-2-6 1.5 1 2.5 3 2 6zM4 22c-2 2-3 4-2 6 1.5-1 2.5-3 2-6z" fill="#0369A1" />
        <circle cx="22" cy="12.5" r="1.6" fill="#0F172A" />
        <circle cx="21.5" cy="11.9" r="0.5" fill="#FFF" />
        <circle cx="18" cy="16" r="1.4" fill="#FDA4AF" opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'giraffe',
    label: 'Jirafa',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="13.5" y="16" width="5" height="13" rx="2.5" fill="#FBBF24" />
        <circle cx="16" cy="13" r="8.5" fill="#FBBF24" />
        <line x1="12" y1="6" x2="13.5" y2="2" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="20" y1="6" x2="18.5" y2="2" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="13.5" cy="2" r="1.2" fill="#B45309" />
        <circle cx="18.5" cy="2" r="1.2" fill="#B45309" />
        <polygon points="7,8 10,13 6,12" fill="#F59E0B" />
        <polygon points="25,8 26,12 22,13" fill="#F59E0B" />
        <circle cx="12.5" cy="11.5" r="1.6" fill="#1E293B" />
        <circle cx="19.5" cy="11.5" r="1.6" fill="#1E293B" />
        <circle cx="12" cy="10.9" r="0.5" fill="#FFF" />
        <circle cx="19" cy="10.9" r="0.5" fill="#FFF" />
        <ellipse cx="16" cy="16" rx="5.2" ry="3.5" fill="#FEF3C7" />
        <circle cx="14" cy="15.8" r="0.9" fill="#B45309" />
        <circle cx="18" cy="15.8" r="0.9" fill="#B45309" />
        <circle cx="14" cy="22" r="1.5" fill="#B45309" />
        <circle cx="18" cy="26" r="1.3" fill="#B45309" />
        <circle cx="9" cy="14" r="1.3" fill="#FCA5A5" opacity="0.6" />
        <circle cx="23" cy="14" r="1.3" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'raccoon',
    label: 'Yenot',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="5,4 12,13 4,13" fill="#64748B" />
        <polygon points="27,4 28,13 20,13" fill="#64748B" />
        <polygon points="6.5,6.5 11,12 5.5,12" fill="#F1F5F9" />
        <polygon points="25.5,6.5 26.5,12 21,12" fill="#F1F5F9" />
        <circle cx="16" cy="18" r="11.5" fill="#94A3B8" />
        <path d="M5.5 16c2-4 7-6 10.5-6s8.5 2 10.5 6c-2 3-6 4-10.5 4s-8.5-1-10.5-4z" fill="#1E293B" />
        <circle cx="11.5" cy="15.5" r="2.2" fill="#FFFFFF" />
        <circle cx="20.5" cy="15.5" r="2.2" fill="#FFFFFF" />
        <circle cx="11.5" cy="15.5" r="1.4" fill="#0F172A" />
        <circle cx="20.5" cy="15.5" r="1.4" fill="#0F172A" />
        <circle cx="11" cy="14.9" r="0.5" fill="#FFF" />
        <circle cx="20" cy="14.9" r="0.5" fill="#FFF" />
        <ellipse cx="16" cy="22" rx="4.5" ry="3.2" fill="#F8FAFC" />
        <circle cx="16" cy="20.5" r="1.5" fill="#0F172A" />
        <path d="M14.5 23c.6.5 2.4.5 3 0" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'hedgehog',
    label: 'Kirpi',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="15" cy="16" r="12.5" fill="#78350F" />
        <path d="M4 14l3-3M4 18l3 0M6 8l4 2M8 24l3-2M10 5l3 3M15 4l1 4M20 5l-2 3M24 8l-3 2" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="19" cy="19.5" rx="8.5" ry="7.5" fill="#FED7AA" />
        <circle cx="21" cy="17" r="1.8" fill="#1E293B" />
        <circle cx="20.4" cy="16.3" r="0.6" fill="#FFF" />
        <circle cx="26.5" cy="19" r="1.8" fill="#1E293B" />
        <path d="M22 22c1 .8 3 .8 4 0" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="17.5" cy="21" r="1.6" fill="#FDA4AF" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: 'monkey',
    label: 'Maymun',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="5" cy="16" r="4.5" fill="#92400E" />
        <circle cx="27" cy="16" r="4.5" fill="#92400E" />
        <circle cx="5" cy="16" r="2.5" fill="#FDE68A" />
        <circle cx="27" cy="16" r="2.5" fill="#FDE68A" />
        <circle cx="16" cy="16" r="11.5" fill="#92400E" />
        <ellipse cx="12.5" cy="14" rx="4.5" ry="4.5" fill="#FED7AA" />
        <ellipse cx="19.5" cy="14" rx="4.5" ry="4.5" fill="#FED7AA" />
        <ellipse cx="16" cy="20" rx="7.5" ry="5.5" fill="#FED7AA" />
        <circle cx="12.5" cy="13.5" r="1.8" fill="#1E293B" />
        <circle cx="19.5" cy="13.5" r="1.8" fill="#1E293B" />
        <circle cx="12" cy="12.8" r="0.6" fill="#FFF" />
        <circle cx="19" cy="12.8" r="0.6" fill="#FFF" />
        <ellipse cx="16" cy="18.5" rx="1.8" ry="1.2" fill="#92400E" />
        <path d="M13.5 21.5c1 1.2 4 1.2 5 0" stroke="#92400E" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="9" cy="18.5" r="1.5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="23" cy="18.5" r="1.5" fill="#FCA5A5" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'shark',
    label: 'Akula',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M16 4c3 4 5 7 5 9h-10c0-2 2-6 5-9z" fill="#334155" />
        <ellipse cx="16" cy="18" rx="12" ry="10" fill="#475569" />
        <path d="M6 20c2 5 6 8 10 8s8-3 10-8c-3-2-7-3-10-3s-7 1-10 3z" fill="#F8FAFC" />
        <circle cx="11.5" cy="15" r="1.8" fill="#0F172A" />
        <circle cx="20.5" cy="15" r="1.8" fill="#0F172A" />
        <circle cx="11" cy="14.3" r="0.6" fill="#FFF" />
        <circle cx="20" cy="14.3" r="0.6" fill="#FFF" />
        <path d="M12 22l1-1.5 1 1.5 1-1.5 1 1.5 1-1.5 1 1.5" stroke="#0F172A" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  {
    id: 'flamingo',
    label: 'Flamingo',
    category: 'animal',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="14" cy="16" r="12" fill="#FB7185" />
        <path d="M14 6c5 0 8 3 8 7 0 5-4 9-8 9s-8-4-8-9c0-4 3-7 8-7z" fill="#FDA4AF" />
        <path d="M18 10c4 0 9 2 9 6-2 1.5-4 1.5-6 0v-6z" fill="#F43F5E" />
        <path d="M23 13.5c2 0 4 .5 4 2.5-1.5.5-2.5.5-4 0v-2.5z" fill="#0F172A" />
        <circle cx="15.5" cy="11.5" r="1.6" fill="#0F172A" />
        <circle cx="15" cy="11" r="0.5" fill="#FFF" />
        <circle cx="11.5" cy="14" r="1.6" fill="#F43F5E" opacity="0.6" />
      </svg>
    ),
  },

  // --- Fun, Objects, Food & Symbols ---
  {
    id: 'clover',
    label: 'Omad',
    category: 'nature',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="11" cy="11" r="5.8" fill="#16A34A" />
        <circle cx="21" cy="11" r="5.8" fill="#16A34A" />
        <circle cx="11" cy="21" r="5.8" fill="#16A34A" />
        <circle cx="21" cy="21" r="5.8" fill="#16A34A" />
        <circle cx="11" cy="11" r="3.5" fill="#22C55E" />
        <circle cx="21" cy="11" r="3.5" fill="#22C55E" />
        <circle cx="11" cy="21" r="3.5" fill="#22C55E" />
        <circle cx="21" cy="21" r="3.5" fill="#22C55E" />
        <circle cx="16" cy="16" r="3.8" fill="#4ADE80" />
        <path d="M16 19v9" stroke="#15803D" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'flower',
    label: 'Gul',
    category: 'nature',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="7.5" r="5.5" fill="#F472B6" />
        <circle cx="24.5" cy="13" r="5.5" fill="#F472B6" />
        <circle cx="22.5" cy="22.5" r="5.5" fill="#F472B6" />
        <circle cx="9.5" cy="22.5" r="5.5" fill="#F472B6" />
        <circle cx="7.5" cy="13" r="5.5" fill="#F472B6" />
        <circle cx="16" cy="16" r="5" fill="#FACC15" stroke="#EAB308" strokeWidth="1" />
        <circle cx="14.5" cy="14.5" r="1.2" fill="#FEF08A" />
      </svg>
    ),
  },
  {
    id: 'balloon',
    label: 'Shar',
    category: 'toy',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <ellipse cx="16" cy="13" rx="10.5" ry="12.5" fill="#EF4444" />
        <ellipse cx="12" cy="8.5" rx="3.5" ry="5.5" fill="#FCA5A5" opacity="0.65" />
        <polygon points="16,25.5 13.5,28 18.5,28" fill="#DC2626" />
        <path d="M16 28c0 2-2 3.5-1 5.5" stroke="#71717A" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'crown',
    label: 'Toj',
    category: 'symbol',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="3.5,24 28.5,24 27.5,9.5 20,17 16,6.5 12,17 4.5,9.5" fill="#F59E0B" />
        <rect x="3.5" y="24" width="25" height="4.5" rx="1.2" fill="#D97706" />
        <circle cx="4.5" cy="9.5" r="2" fill="#EF4444" />
        <circle cx="16" cy="6.5" r="2.5" fill="#3B82F6" />
        <circle cx="27.5" cy="9.5" r="2" fill="#10B981" />
        <circle cx="9.5" cy="26" r="1.2" fill="#FFFFFF" />
        <circle cx="16" cy="26" r="1.2" fill="#FFFFFF" />
        <circle cx="22.5" cy="26" r="1.2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'wizard',
    label: 'Sehrgar',
    category: 'character',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="18" r="8.5" fill="#FED7AA" />
        <polygon points="16,2 5.5,15 26.5,15" fill="#7C3AED" />
        <ellipse cx="16" cy="15" rx="12.5" ry="3.2" fill="#6D28D9" />
        <polygon points="16,6 17.2,8.5 19.5,8.5 17.8,9.8 18.5,12 16,10.8 13.5,12 14.2,9.8 12.5,8.5 14.8,8.5" fill="#FACC15" />
        <circle cx="13" cy="17.5" r="1.4" fill="#0F172A" />
        <circle cx="19" cy="17.5" r="1.4" fill="#0F172A" />
        <path d="M11.5 20.5c0 4.5 2.5 8 4.5 8s4.5-3.5 4.5-8" fill="#E2E8F0" />
      </svg>
    ),
  },
  {
    id: 'alien',
    label: 'O\'yin',
    category: 'game',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="5.5" y="7.5" width="21" height="17" rx="4.5" fill="#8B5CF6" />
        <rect x="8.5" y="11.5" width="4.5" height="4.5" rx="1" fill="#22C55E" />
        <rect x="19" y="11.5" width="4.5" height="4.5" rx="1" fill="#22C55E" />
        <rect x="10.5" y="19" width="11" height="2.5" rx="1" fill="#0F172A" />
        <rect x="9.5" y="3.5" width="2.5" height="4.5" rx="1" fill="#A78BFA" />
        <rect x="20" y="3.5" width="2.5" height="4.5" rx="1" fill="#A78BFA" />
      </svg>
    ),
  },
  {
    id: 'rocket',
    label: 'Raketa',
    category: 'space',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M16 3.5c6.5 4.5 9.5 11 9.5 17.5l-9.5-4.5-9.5 4.5c0-6.5 3-13 9.5-17.5z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.2" />
        <polygon points="16,3.5 11.5,9.5 20.5,9.5" fill="#EF4444" />
        <polygon points="6.5,21 3.5,25.5 10,24" fill="#EF4444" />
        <polygon points="25.5,21 28.5,25.5 22,24" fill="#EF4444" />
        <circle cx="16" cy="13.5" r="3.2" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.2" />
        <circle cx="15.2" cy="12.5" r="0.8" fill="#FFF" />
        <polygon points="16,29.5 12.5,23 19.5,23" fill="#F97316" />
        <polygon points="16,27 14,23 18,23" fill="#FACC15" />
      </svg>
    ),
  },
  {
    id: 'palette',
    label: 'Rassom',
    category: 'art',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M16 3.5C8.5 3.5 3.5 8.5 3.5 16c0 7.5 5.5 12.5 12.5 12.5 1.8 0 2.8-1.2 2.8-2.8 0-.8-.3-1.5-.8-2-.5-.5-.8-1.2-.8-2 0-1.5 1.2-2.8 2.8-2.8h3.8C27 19 28.5 17.5 28.5 14.5 28.5 8.4 22.8 3.5 16 3.5z" fill="#F59E0B" />
        <circle cx="9.5" cy="11.5" r="2.2" fill="#EF4444" />
        <circle cx="16" cy="8.5" r="2.2" fill="#3B82F6" />
        <circle cx="22.5" cy="11.5" r="2.2" fill="#10B981" />
        <circle cx="9.5" cy="18.5" r="2.2" fill="#8B5CF6" />
      </svg>
    ),
  },
  {
    id: 'guitar',
    label: 'Gitara',
    category: 'music',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="22.5" cy="22.5" r="7.5" fill="#EF4444" />
        <circle cx="17" cy="17" r="5.5" fill="#EF4444" />
        <circle cx="20.5" cy="20.5" r="3.2" fill="#1E293B" />
        <rect x="6.5" y="6.5" width="15" height="3.2" transform="rotate(-45 6.5 6.5)" fill="#D97706" />
        <polygon points="4.5,4.5 9,1.5 6.5,8" fill="#1E293B" />
      </svg>
    ),
  },
  {
    id: 'gamepad',
    label: 'Geymer',
    category: 'game',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M7.5 9.5h17a6.5 6.5 0 0 1 6.5 6.5v4.5a6.5 6.5 0 0 1-9.5 5.6l-3.2-2.4h-4.6l-3.2 2.4a6.5 6.5 0 0 1-9.5-5.6V16a6.5 6.5 0 0 1 6.5-6.5z" fill="#334155" />
        <rect x="8.5" y="14.5" width="2.4" height="6.5" rx="1.2" fill="#94A3B8" />
        <rect x="6.5" y="16.5" width="6.5" height="2.4" rx="1.2" fill="#94A3B8" />
        <circle cx="23.5" cy="15.5" r="1.4" fill="#EF4444" />
        <circle cx="25.5" cy="17.5" r="1.4" fill="#3B82F6" />
        <circle cx="21.5" cy="17.5" r="1.4" fill="#10B981" />
        <circle cx="23.5" cy="19.5" r="1.4" fill="#FACC15" />
      </svg>
    ),
  },
  {
    id: 'skateboard',
    label: 'Skeytbord',
    category: 'sport',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="3.5" y="12.5" width="25" height="6.5" rx="3.2" transform="rotate(-15 16 16)" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1.2" />
        <circle cx="8.5" cy="22.5" r="2.8" fill="#F97316" />
        <circle cx="23.5" cy="18.5" r="2.8" fill="#F97316" />
        <circle cx="8.5" cy="22.5" r="1.2" fill="#FFFFFF" />
        <circle cx="23.5" cy="18.5" r="1.2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'strawberry',
    label: 'Qulupnay',
    category: 'food',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M16 28.5c-6.5-3.2-11-9.5-11-16 0-4.2 3.2-7.5 11-7.5s11 3.3 11 7.5c0 6.5-4.5 12.8-11 16z" fill="#EF4444" />
        <polygon points="16,3.5 11.5,8 20.5,8" fill="#16A34A" />
        <polygon points="9.5,5.5 14,8 7.5,10.5" fill="#16A34A" />
        <polygon points="22.5,5.5 24.5,10.5 18,8" fill="#16A34A" />
        <circle cx="11.5" cy="12.5" r="0.9" fill="#FEF08A" />
        <circle cx="16" cy="11.5" r="0.9" fill="#FEF08A" />
        <circle cx="20.5" cy="12.5" r="0.9" fill="#FEF08A" />
        <circle cx="13.5" cy="17" r="0.9" fill="#FEF08A" />
        <circle cx="18.5" cy="17" r="0.9" fill="#FEF08A" />
        <circle cx="16" cy="21.5" r="0.9" fill="#FEF08A" />
      </svg>
    ),
  },
  {
    id: 'cherry',
    label: 'Olcha',
    category: 'food',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="9.5" cy="22.5" r="6.5" fill="#DC2626" />
        <circle cx="22.5" cy="20.5" r="6.5" fill="#DC2626" />
        <circle cx="7.5" cy="19.5" r="1.6" fill="#F87171" />
        <circle cx="20.5" cy="17.5" r="1.6" fill="#F87171" />
        <path d="M9.5 16C9.5 8.5 14 4.5 18 4.5M22.5 14C22.5 8.5 19 5.5 18 4.5" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 4.5c2.2-2.2 6.5-2.2 8.5 0-2.2 2.2-6.5 2.2-8.5 0z" fill="#22C55E" />
      </svg>
    ),
  },
  {
    id: 'watermelon',
    label: 'Tarvuz',
    category: 'food',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M4.5 11.5c0 10.5 7.5 17 17 17v-17H4.5z" transform="rotate(-45 16 16)" fill="#F43F5E" />
        <path d="M3.5 10.5c0 12 9 18.5 18.5 18.5" transform="rotate(-45 16 16)" stroke="#16A34A" strokeWidth="3.8" />
        <circle cx="13.5" cy="13.5" r="1" fill="#0F172A" />
        <circle cx="18.5" cy="13.5" r="1" fill="#0F172A" />
        <circle cx="16" cy="18.5" r="1" fill="#0F172A" />
      </svg>
    ),
  },
  {
    id: 'donut',
    label: 'Pishiriq',
    category: 'food',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12.5" fill="#D97706" />
        <path d="M16 4.5c5.5 0 11 3.5 11 9 0 2.2-2.2 3.2-3.2 2.2-2.2-1.2-3.2 2.2-5.5 1.2-2.2-1.2-3.2 1.2-5.5 0s-3.2 1.2-4.5 0c-1.2-1.2-3.2 1.2-3.2-3.2 0-5.5 5.5-9.2 10.9-9.2z" fill="#EC4899" />
        <circle cx="16" cy="16" r="4.8" fill="#FFFFFF" />
        <rect x="10.5" y="8.5" width="2.2" height="1.2" rx="0.6" fill="#FEF08A" />
        <rect x="18.5" y="7.5" width="2.2" height="1.2" rx="0.6" fill="#38BDF8" />
        <rect x="22.5" y="12" width="1.2" height="2.2" rx="0.6" fill="#4ADE80" />
      </svg>
    ),
  },
  {
    id: 'icecream',
    label: 'Muzqaymoq',
    category: 'food',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="16,30.5 8.5,15.5 23.5,15.5" fill="#D97706" />
        <path d="M8.5 15.5c0-4.5 3.5-7.5 7.5-7.5s7.5 3 7.5 7.5z" fill="#FDA4AF" />
        <circle cx="16" cy="8.5" r="4.5" fill="#F43F5E" />
        <circle cx="16" cy="4.5" r="2.2" fill="#DC2626" />
      </svg>
    ),
  },
  {
    id: 'pizza',
    label: 'Pitsa',
    category: 'food',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="16,28.5 5.5,7.5 26.5,7.5" fill="#FBBF24" />
        <path d="M5.5 7.5c5.5-2.2 15.5-2.2 21 0" stroke="#B45309" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="13.5" cy="14" r="2.2" fill="#DC2626" />
        <circle cx="19.5" cy="17.5" r="2" fill="#DC2626" />
        <circle cx="14" cy="21.5" r="1.6" fill="#DC2626" />
        <rect x="17" y="11" width="2.2" height="2.2" rx="0.6" fill="#16A34A" />
      </svg>
    ),
  },
  {
    id: 'star',
    label: 'Yulduz',
    category: 'symbol',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="16,2.5 20.2,11 29.5,12 22.8,18.8 24.8,28 16,23.5 7.2,28 9.2,18.8 2.5,12 11.8,11" fill="#FACC15" stroke="#EAB308" strokeWidth="1.2" />
        <polygon points="16,4.5 19.2,12 26.5,13 21.2,18.2 22.8,25.5 16,21.5" fill="#FEF08A" opacity="0.65" />
      </svg>
    ),
  },
  {
    id: 'lightning',
    label: 'Chaqmoq',
    category: 'symbol',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <polygon points="18.5,1.5 5.5,17 16.5,17 13.5,30.5 26.5,13.5 16.5,13.5" fill="#FACC15" stroke="#EAB308" strokeWidth="1.2" />
      </svg>
    ),
  },
];

// Mapping of legacy OS emoji to modern vibrant SVG avatar ID
const EMOJI_TO_AVATAR_MAP = {
  '🦁': 'lion',
  '🐯': 'tiger',
  '🐼': 'panda',
  '🐨': 'koala',
  '🦊': 'fox',
  '🐰': 'rabbit',
  '🐱': 'cat',
  '🐶': 'dog',
  '🦉': 'owl',
  '🦜': 'parrot',
  '🦅': 'eagle',
  '🐧': 'penguin',
  '🦋': 'butterfly',
  '🐝': 'bee',
  '🐞': 'ladybug',
  '🦄': 'unicorn',
  '🦖': 'dino',
  '🐉': 'dragon',
  '🍀': 'clover',
  '🌸': 'flower',
  '🧸': 'bear',
  '🎈': 'balloon',
  '👑': 'crown',
  '🧙‍♂️': 'wizard',
  '👾': 'alien',
  '🚀': 'rocket',
  '🎨': 'palette',
  '🎸': 'guitar',
  '🎮': 'gamepad',
  '🛹': 'skateboard',
  '🍓': 'strawberry',
  '🍒': 'cherry',
  '🍉': 'watermelon',
  '🍩': 'donut',
  '🍦': 'icecream',
  '🍕': 'pizza',
  '⭐': 'star',
  '⚡': 'lightning',
  // New animals emoji fallbacks if encountered
  '🐬': 'dolphin',
  '🦒': 'giraffe',
  '🦝': 'raccoon',
  '🦔': 'hedgehog',
  '🐵': 'monkey',
  '🦈': 'shark',
  '🦩': 'flamingo',
};

export const renderStudentAvatar = (avatarKey, size = 24) => {
  const normalizedKey = normalizeIconUrl(avatarKey);

  if (!normalizedKey) {
    return STUDENT_AVATARS[0].svg(size);
  }

  // If it's a URL, gallery image path, or base64 image
  if (typeof normalizedKey === 'string' && (normalizedKey.startsWith('http') || normalizedKey.startsWith('data:image') || normalizedKey.includes('/') || normalizedKey.includes('.'))) {
    return <img src={normalizedKey} alt="avatar" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
  }

  // Check if it's a legacy emoji
  const mappedId = EMOJI_TO_AVATAR_MAP[normalizedKey] || normalizedKey;

  const found = STUDENT_AVATARS.find((item) => item.id === mappedId);
  if (found) {
    return found.svg(size);
  }

  // Default fallback
  return STUDENT_AVATARS[0].svg(size);
};

export const renderAvatar = renderStudentAvatar;
