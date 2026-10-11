import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { exportDatabase, DEFAULT_QUICK_TAGS, normalizeQuickTags } from '../utils/db';
import { renderAvatar } from '../utils/studentAvatars';
import { AVATAR_GALLERY_IMAGES } from '../utils/avatarGallery';
import ProjectLikeIcon from './common/ProjectLikeIcon';
import { useModalDismiss } from '../hooks/useModalDismiss';

// Minimalist SVG Icons
const IconTag = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const IconTrash = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconCloud = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconShield = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconDownload = ({ size = 16, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconUpload = ({ size = 16, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconRotateCcw = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const IconEdit = ({ size = 14, strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconPlus = ({ size = 15, strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconX = ({ size = 14, strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconCheck = ({ size = 15, strokeWidth = 2.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlert = ({ size = 16, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconUser = ({ size = 16, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLogOut = ({ size = 16, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconCamera = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconSparkles = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 4.673a3 3 0 0 0 1.742 1.742L20.327 11.327a1 1 0 0 1 0 1.346l-4.673 1.912a3 3 0 0 0-1.742 1.742L12 21l-1.912-4.673a3 3 0 0 0-1.742-1.742L3.673 12.673a1 1 0 0 1 0-1.346l4.673-1.912a3 3 0 0 0 1.742-1.742L12 3z" />
  </svg>
);

const IconAward = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const IconBriefcase = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconGraduation = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconQuote = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
  </svg>
);

const IconSend = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconInstagram = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const formatMoneyUz = (num) => {
  const n = Math.round(Number(num) || 0);
  return n.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
};

const POINT_PRESETS = [85, 50, 20, 10, -10, -20, -30, -40];

const Settings = ({
  quickTags,
  setQuickTags,
  onImportDatabase,
  onResetDatabase,
  showToast,
  groups = [],
  students = [],
  transactions = [],
  attendance = [],
  onRestoreGroup,
  onRestoreStudent,
  onPermanentlyDeleteGroup,
  onPermanentlyDeleteStudent,
  snapshots = [],
  onRollback,
  userRole,
  onLogout,
  syncStatus = 'saved',
  isSyncing = false,
  theme: _theme,
  setTheme: _setTheme,
  teacherProfile = null,
  onSaveTeacherProfile
}) => {
  // Tabs: 'profile', 'tags', 'trash', 'backup', 'danger'
  const [activeTab, setActiveTab] = useState('profile');

  // Teacher Profile State
  const [profileFullName, setProfileFullName] = useState(teacherProfile?.fullName || '');
  const [profileTitle, setProfileTitle] = useState(teacherProfile?.title || '');
  const [profileAvatar, setProfileAvatar] = useState(teacherProfile?.avatar || '');
  const [profileEducation, setProfileEducation] = useState(teacherProfile?.education || '');
  const [profileMotto, setProfileMotto] = useState(teacherProfile?.motto || '');
  const [profileAchievements, setProfileAchievements] = useState(teacherProfile?.achievements || []);
  const [profileCertificates, setProfileCertificates] = useState(teacherProfile?.certificates || []);
  const [profileTelegram, setProfileTelegram] = useState(teacherProfile?.social?.telegram || '');
  const [profileInstagram, setProfileInstagram] = useState(teacherProfile?.social?.instagram || '');

  const isUserDirtyRef = React.useRef(false);
  const autoSaveTimerRef = React.useRef(null);

  const [newAchievementText, setNewAchievementText] = useState('');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [certTitleInput, setCertTitleInput] = useState('');
  const [certYearInput, setCertYearInput] = useState('');
  const [certImageInput, setCertImageInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync from props only if user has not actively edited the local form
  useEffect(() => {
    if (teacherProfile && !isUserDirtyRef.current) {
      setProfileFullName(teacherProfile.fullName || '');
      setProfileTitle(teacherProfile.title || '');
      setProfileAvatar(teacherProfile.avatar || '');
      setProfileEducation(teacherProfile.education || '');
      setProfileMotto(teacherProfile.motto || '');
      setProfileAchievements(teacherProfile.achievements || []);
      setProfileCertificates(teacherProfile.certificates || []);
      setProfileTelegram(teacherProfile.social?.telegram || '');
      setProfileInstagram(teacherProfile.social?.instagram || '');
    }
  }, [teacherProfile]);

  // Debounced auto-save to cloud & instant localStorage backup
  useEffect(() => {
    if (!isUserDirtyRef.current) return;

    const updated = {
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      avatar: profileAvatar,
      education: profileEducation.trim(),
      motto: profileMotto.trim(),
      achievements: profileAchievements.filter(Boolean),
      certificates: profileCertificates.filter(Boolean),
      social: {
        telegram: profileTelegram.trim(),
        instagram: profileInstagram.trim()
      }
    };

    // Immediate 0ms local storage backup
    try {
      const tId = localStorage.getItem('rsa_teacher_id');
      if (tId) {
        localStorage.setItem(`rsa_teacher_profile_${tId}`, JSON.stringify(updated));
      }
    } catch {}

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (onSaveTeacherProfile) {
        onSaveTeacherProfile(updated);
      }
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    profileFullName,
    profileTitle,
    profileAvatar,
    profileEducation,
    profileMotto,
    profileAchievements,
    profileCertificates,
    profileTelegram,
    profileInstagram,
    onSaveTeacherProfile
  ]);

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Rasm hajmi 2MB dan oshmasligi kerak", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setProfileAvatar(dataUrl);
        isUserDirtyRef.current = true;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCertFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Sertifikat rasmi 3MB dan oshmasligi kerak", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setCertImageInput(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAchievement = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = newAchievementText.trim();
    if (!clean) return;
    if (profileAchievements.includes(clean)) {
      showToast("Ushbu yutuq allaqachon qo'shilgan", "info");
      return;
    }
    isUserDirtyRef.current = true;
    setProfileAchievements([...profileAchievements, clean]);
    setNewAchievementText('');
  };

  const handleAddSuggestedAchievement = (text) => {
    if (profileAchievements.includes(text)) {
      showToast("Ushbu yutuq allaqachon mavjud", "info");
      return;
    }
    isUserDirtyRef.current = true;
    setProfileAchievements([...profileAchievements, text]);
  };

  const handleRemoveAchievement = (index) => {
    isUserDirtyRef.current = true;
    setProfileAchievements(profileAchievements.filter((_, i) => i !== index));
  };

  const handleAddCertificateSubmit = () => {
    if (!certTitleInput.trim() && !certImageInput) {
      showToast("Sertifikat nomi yoki rasmini kiriting", "warning");
      return;
    }
    const newCert = {
      id: `cert_${Date.now()}`,
      title: certTitleInput.trim(),
      year: certYearInput.trim(),
      image: certImageInput
    };
    isUserDirtyRef.current = true;
    setProfileCertificates([...profileCertificates, newCert]);
    setCertTitleInput('');
    setCertYearInput('');
    setCertImageInput('');
    setShowAddCertModal(false);
  };

  const handleRemoveCertificate = (index) => {
    isUserDirtyRef.current = true;
    setProfileCertificates(profileCertificates.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    if (!profileFullName.trim()) {
      showToast("Iltimos, ism-familiyangizni kiriting!", "warning");
      return;
    }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setIsSavingProfile(true);
    const updated = {
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      avatar: profileAvatar,
      education: profileEducation.trim(),
      motto: profileMotto.trim(),
      achievements: profileAchievements.filter(Boolean),
      certificates: profileCertificates.filter(Boolean),
      social: {
        telegram: profileTelegram.trim(),
        instagram: profileInstagram.trim()
      }
    };
    try {
      const tId = localStorage.getItem('rsa_teacher_id');
      if (tId) {
        localStorage.setItem(`rsa_teacher_profile_${tId}`, JSON.stringify(updated));
      }
    } catch {}
    if (onSaveTeacherProfile) {
      await onSaveTeacherProfile(updated);
    }
    setIsSavingProfile(false);
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to quickly save profile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (activeTab === 'profile' && !isSavingProfile) {
          handleSaveProfile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isSavingProfile, handleSaveProfile]);

  // Quick Tags State
  const [newTagText, setNewTagText] = useState('');
  const [newTagPoints, setNewTagPoints] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editTagText, setEditTagText] = useState('');
  const [editTagPoints, setEditTagPoints] = useState('');

  // Trash & Filter State
  const [trashFilter, setTrashFilter] = useState('all'); // 'all', 'groups', 'students'
  const [trashSearch, setTrashSearch] = useState('');

  // Custom Modal States (replacing window.confirm)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { type: 'group'|'student', id, name }
  const [rollbackConfirmModal, setRollbackConfirmModal] = useState(null); // { snapshot }
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Memos
  const deletedGroups = useMemo(() => groups.filter((g) => g.deleted), [groups]);
  const deletedStudents = useMemo(() => students.filter((s) => s.deleted), [students]);
  const activeGroups = useMemo(() => groups.filter((g) => !g.deleted), [groups]);

  // Calculator State & Memos
  const activeStudentsCount = useMemo(() => students.filter((s) => !s.deleted).length, [students]);

  const [calcStudentCount, setCalcStudentCount] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_student_count');
    if (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) return Number(saved);
    return 25;
  });

  const [calcPricePerStudent, setCalcPricePerStudent] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_price');
    return (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) ? Number(saved) : 400000;
  });

  const [calcTeacherPercent, setCalcTeacherPercent] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_percent');
    return (saved !== null && !isNaN(Number(saved)) && Number(saved) >= 0 && Number(saved) <= 100) ? Number(saved) : 50;
  });

  useEffect(() => {
    try {
      if (calcStudentCount !== '' && Number(calcStudentCount) > 0) {
        localStorage.setItem('teacher_calc_student_count', String(calcStudentCount));
      }
    } catch {
      // ignore
    }
  }, [calcStudentCount]);

  useEffect(() => {
    try {
      if (calcPricePerStudent !== '') {
        localStorage.setItem('teacher_calc_price', String(calcPricePerStudent));
      }
    } catch {
      // ignore
    }
  }, [calcPricePerStudent]);

  useEffect(() => {
    try {
      localStorage.setItem('teacher_calc_percent', String(calcTeacherPercent));
    } catch {
      // ignore
    }
  }, [calcTeacherPercent]);

  const grossTotal = Math.max(0, (Number(calcStudentCount) || 0) * (Number(calcPricePerStudent) || 0));
  const teacherShare = Math.round(grossTotal * ((Number(calcTeacherPercent) || 0) / 100));
  const centerShare = Math.max(0, grossTotal - teacherShare);
  const perStudentTeacherShare = Math.round((Number(calcPricePerStudent) || 0) * ((Number(calcTeacherPercent) || 0) / 100));
  const dailyTeacherShare = Math.round(teacherShare / 30);

  const groupsBreakdown = useMemo(() => {
    return activeGroups.map((g) => {
      const gStudents = students.filter((s) => s.groupId === g.id && !s.deleted);
      const count = gStudents.length;
      const gGross = count * (Number(calcPricePerStudent) || 0);
      const gTeacherShare = Math.round(gGross * ((Number(calcTeacherPercent) || 0) / 100));
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        count,
        gross: gGross,
        teacherShare: gTeacherShare,
      };
    });
  }, [activeGroups, students, calcPricePerStudent, calcTeacherPercent]);

  const totalGroupsStudents = useMemo(() => {
    return groupsBreakdown.reduce((sum, g) => sum + g.count, 0);
  }, [groupsBreakdown]);

  const totalGroupsTeacherShare = useMemo(() => {
    return groupsBreakdown.reduce((sum, g) => sum + g.teacherShare, 0);
  }, [groupsBreakdown]);

  const totalGroupsGross = useMemo(() => {
    return groupsBreakdown.reduce((sum, g) => sum + g.gross, 0);
  }, [groupsBreakdown]);

  const normalizedTags = useMemo(() => {
    return normalizeQuickTags(quickTags);
  }, [quickTags]);

  const filteredDeletedGroups = useMemo(() => {
    if (trashFilter === 'students') return [];
    if (!trashSearch.trim()) return deletedGroups;
    return deletedGroups.filter(g => g.name.toLowerCase().includes(trashSearch.toLowerCase()));
  }, [deletedGroups, trashFilter, trashSearch]);

  const filteredDeletedStudents = useMemo(() => {
    if (trashFilter === 'groups') return [];
    let list = deletedStudents;
    if (trashSearch.trim()) {
      const q = trashSearch.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [deletedStudents, trashFilter, trashSearch]);

  const totalTrashCount = deletedGroups.length + deletedStudents.length;

  // Escape key and background scroll lock handler for all modals (including cert and gallery)
  const isAnySettingsModalOpen = Boolean(
    showResetConfirm ||
    deleteConfirmModal ||
    rollbackConfirmModal ||
    editingTagIndex !== null ||
    showAddCertModal ||
    showGalleryModal
  );

  useModalDismiss(isAnySettingsModalOpen, () => {
    if (showGalleryModal) {
      setShowGalleryModal(false);
    } else if (showAddCertModal) {
      setShowAddCertModal(false);
    } else if (editingTagIndex !== null) {
      handleCloseEditModal();
    } else if (rollbackConfirmModal) {
      setRollbackConfirmModal(null);
    } else if (deleteConfirmModal) {
      setDeleteConfirmModal(null);
    } else if (showResetConfirm) {
      setShowResetConfirm(false);
    }
  });

  // Quick Tags Actions
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTagText.trim()) {
      showToast("Izoh shablon matnini kiriting!", "error");
      return;
    }

    const pts = Number(newTagPoints) || 0;
    const tagObj = { text: newTagText.trim(), points: pts };

    if (normalizedTags.some(t => t.text.toLowerCase() === tagObj.text.toLowerCase())) {
      showToast("Ushbu izoh shabloni allaqachon mavjud!", "error");
      return;
    }

    const updatedTags = [...normalizedTags, tagObj];
    setQuickTags(updatedTags);
    setNewTagText('');
    setNewTagPoints('');
    showToast("Yangi izoh shabloni muvaffaqiyatli qo'shildi!", "success");
  };

  const handleDeleteTag = (textToDelete) => {
    const updatedTags = normalizedTags.filter(t => t.text !== textToDelete);
    setQuickTags(updatedTags);
    if (editingTagIndex !== null) setEditingTagIndex(null);
    showToast("Izoh shabloni o'chirildi!", "success");
  };

  const handleStartEditTag = (index, tagObj) => {
    setEditingTagIndex(index);
    setEditTagText(tagObj.text);
    setEditTagPoints(String(tagObj.points));
  };

  const handleCloseEditModal = () => {
    setEditingTagIndex(null);
    setEditTagText('');
    setEditTagPoints('');
  };

  const handleSaveEditTag = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (editingTagIndex === null) return;
    if (!editTagText.trim()) {
      showToast("Izoh shablon matnini kiriting!", "error");
      return;
    }
    const pts = Number(editTagPoints) || 0;
    const updated = [...normalizedTags];
    updated[editingTagIndex] = { text: editTagText.trim(), points: pts };
    setQuickTags(updated);
    handleCloseEditModal();
    showToast("Izoh shabloni yangilandi!", "success");
  };

  const handleResetDefaultTags = () => {
    setQuickTags(DEFAULT_QUICK_TAGS);
    setEditingTagIndex(null);
    showToast("Tezkor shablonlar standart holatga keltirildi!", "info");
  };

  const handleClearAllTags = () => {
    setQuickTags([]);
    if (editingTagIndex !== null) setEditingTagIndex(null);
    showToast("Barcha izoh shablonlari tozalandi!", "info");
  };

  // Backup Export
  const handleExport = () => {
    try {
      const dataStr = exportDatabase(groups, students, transactions, quickTags, attendance);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const timestamp = new Date().toISOString().slice(0, 10);
      const exportFileDefaultName = `rate_student_backup_${timestamp}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      showToast("Ma'lumotlar muvaffaqiyatli zaxiralandi!", "success");
    } catch (e) {
      showToast("Zaxiralashda xatolik yuz berdi: " + e.message, "error");
    }
  };

  // Backup Import
  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const jsonContent = event.target.result;
        const success = await onImportDatabase(jsonContent);
        if (success) {
          e.target.value = '';
        }
      } catch (error) {
        showToast(error.message, "error");
      }
    };
    fileReader.readAsText(file, "UTF-8");
  };

  // Trash Delete Execution
  const handleExecutePermanentDelete = () => {
    if (!deleteConfirmModal) return;
    if (deleteConfirmModal.type === 'group') {
      onPermanentlyDeleteGroup(deleteConfirmModal.id);
      showToast(`"${deleteConfirmModal.name}" guruhi butunlay o'chirildi!`, "info");
    } else {
      onPermanentlyDeleteStudent(deleteConfirmModal.id);
      showToast(`"${deleteConfirmModal.name}" o'quvchisi butunlay o'chirildi!`, "info");
    }
    setDeleteConfirmModal(null);
  };

  // Rollback Execution
  const handleExecuteRollback = () => {
    if (!rollbackConfirmModal) return;
    onRollback(rollbackConfirmModal.snapshot.data);
    setRollbackConfirmModal(null);
  };

  // Reset database
  const handleReset = () => {
    onResetDatabase();
    setShowResetConfirm(false);
  };

  // Student mode: simplified clean profile & logout
  if (userRole === 'student') {
    return (
      <div className="settings-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">Profil</h2>
            <p className="page-subtitle">Akkaunt va tizim ma'lumotlari</p>
          </div>
        </div>

        <div className="settings-single-col-feed">
          <section className="glass-card settings-card">
            <div className="student-profile-hero">
              <div className="profile-avatar-box">
                <IconUser size={24} />
              </div>
              <div className="profile-info-block">
                <span className="role-pill-badge">Talaba</span>
                <h3 className="profile-name">Talaba Kabineti</h3>
                <p className="profile-desc">Guruh reytingi va Like'laringizni kuzatib borasiz.</p>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="student-profile-actions">
              <button className="btn btn-danger scale-active" onClick={onLogout}>
                <IconLogOut size={16} />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Top Page Header with Tabs */}
      <div className="page-header settings-page-header">
        <div>
          <h2 className="page-title">Profil</h2>
        </div>

        <div className="tab-control-brutalist">
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-label-desktop">Profil</span>
            <span className="tab-label-mobile">Profil</span>
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <span className="tab-label-desktop">Kalkulyator</span>
            <span className="tab-label-mobile">Hisob</span>
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <span className="tab-label-desktop">Izohlar</span>
            <span className="tab-label-mobile">Izoh</span>
            <span className="tab-count-badge">{normalizedTags.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <span className="tab-label-desktop">Tizim & Zaxira</span>
            <span className="tab-label-mobile">Tizim</span>
            {totalTrashCount > 0 && <span className="tab-count-badge badge-red">{totalTrashCount}</span>}
          </button>
        </div>
      </div>

      {/* Unified Hero Identity Banner */}
      <section className="glass-card modern-hero-identity-card">
        <div className="hero-identity-main">
          {/* Avatar with Camera Overlay */}
          <div className="hero-avatar-wrapper">
            <div className="hero-avatar-disc" onClick={() => setShowGalleryModal(true)} title="Suratni tanlash">
              {profileAvatar ? renderAvatar(profileAvatar, 82) : <IconUser size={34} />}
            </div>
            <button
              type="button"
              className="hero-avatar-camera-btn scale-active"
              onClick={() => setShowGalleryModal(true)}
              title="Suratni o'zgartirish"
              aria-label="Suratni o'zgartirish"
            >
              <IconCamera size={14} />
            </button>
          </div>

          {/* Profile Name & Title */}
          <div className="hero-identity-details">
            <h3 className="hero-teacher-name">{profileFullName || "Ustoz Ismi"}</h3>
            <p className="hero-teacher-title">{profileTitle || "Katta o'qituvchi va murabbiy"}</p>

            {/* Quick avatar buttons row */}
            <div className="hero-avatar-actions-quick">
              <label className="hero-quick-btn scale-active">
                <IconCamera size={13} />
                <span>Rasm yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                className="hero-quick-btn scale-active"
                onClick={() => setShowGalleryModal(true)}
              >
                <span>Galereya</span>
              </button>
              {profileAvatar && (
                <button
                  type="button"
                  className="hero-quick-remove-btn"
                  onClick={() => setProfileAvatar('')}
                >
                  Suratni olib tashlash
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero Right Actions: Single Save button for profile */}
        <div className="hero-actions-cluster">
          {activeTab === 'profile' && (
            <button
              type="button"
              className="hero-primary-save-btn scale-active"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              title="O'zgarishlarni saqlash (Ctrl+S / Cmd+S)"
            >
              {isSavingProfile ? (
                <>
                  <span className="btn-spinner" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <IconCheck size={15} />
                  <span>Saqlash</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className="hero-danger-logout-btn scale-active"
            onClick={onLogout}
            title="Tizimdan chiqish"
          >
            <IconLogOut size={15} />
            <span>Chiqish</span>
          </button>
        </div>
      </section>

      {/* Tab 0: Ustoz Shaxsiy Portfoliosi va Profili */}
      {activeTab === 'profile' && (
        <div className="settings-tab-content fade-in">
          <div className="profile-workspace-layout">
            {/* Left Column: Form & Portfolio Editor */}
            <div className="profile-editor-column">
              {/* Section 1: Asosiy Ma'lumotlar */}
              <section className="glass-card modern-profile-card">
                <div className="card-header-clean">
                  <div className="card-header-icon-wrap user-icon-wrap">
                    <IconUser size={18} />
                  </div>
                  <div>
                    <h3 className="card-title">Asosiy ma'lumotlar</h3>
                  </div>
                </div>

                <div className="profile-fields-grid">
                  <div className="profile-field-item">
                    <label className="input-field-label">
                      <IconUser size={12} />
                      <span>Ism va Familiya *</span>
                    </label>
                    <input
                      type="text"
                      className="modern-text-input"
                      placeholder="Masalan: Bekzod Raxmonov"
                      value={profileFullName}
                      onChange={(e) => {
                        setProfileFullName(e.target.value);
                        isUserDirtyRef.current = true;
                      }}
                    />
                  </div>

                  <div className="profile-field-item">
                    <label className="input-field-label">
                      <IconBriefcase size={12} />
                      <span>Mutaxassislik / Unvon</span>
                    </label>
                    <input
                      type="text"
                      className="modern-text-input"
                      placeholder="Masalan: Katta Matematika va Mantiq ustozi"
                      value={profileTitle}
                      onChange={(e) => {
                        setProfileTitle(e.target.value);
                        isUserDirtyRef.current = true;
                      }}
                    />
                  </div>

                  <div className="profile-field-item full-width">
                    <label className="input-field-label">
                      <IconGraduation size={12} />
                      <span>O'qigan joyi (Universitet / Ta'lim)</span>
                    </label>
                    <input
                      type="text"
                      className="modern-text-input"
                      placeholder="Masalan: O'zbekiston Milliy Universiteti, Magistratura"
                      value={profileEducation}
                      onChange={(e) => {
                        setProfileEducation(e.target.value);
                        isUserDirtyRef.current = true;
                      }}
                    />
                  </div>

                  <div className="profile-field-item full-width">
                    <label className="input-field-label">
                      <IconQuote size={12} />
                      <span>Motivatsion shior / Fikringiz</span>
                    </label>
                    <textarea
                      className="modern-textarea-input"
                      rows={2}
                      placeholder="O'quvchilaringizga ilhom beruvchi shior yoki fikringiz..."
                      value={profileMotto}
                      onChange={(e) => {
                        setProfileMotto(e.target.value);
                        isUserDirtyRef.current = true;
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Ijtimoiy Tarmoqlar va Aloqa */}
              <section className="glass-card modern-profile-card">
                <div className="card-header-clean">
                  <div className="card-header-icon-wrap social-icon-wrap">
                    <IconSend size={17} />
                  </div>
                  <div>
                    <h3 className="card-title">Ijtimoiy tarmoqlar va Aloqa</h3>
                  </div>
                </div>

                <div className="social-inputs-grid">
                  <div className="social-input-item">
                    <label className="input-field-label">
                      <IconSend size={12} />
                      <span>Telegram (username yoki kanal)</span>
                    </label>
                    <div className="social-input-wrap">
                      <span className="social-input-prefix tg-prefix">@</span>
                      <input
                        type="text"
                        className="social-clean-input"
                        placeholder="username yoki t.me/havola"
                        value={profileTelegram}
                        onChange={(e) => {
                          setProfileTelegram(e.target.value);
                          isUserDirtyRef.current = true;
                        }}
                      />
                    </div>
                  </div>

                  <div className="social-input-item">
                    <label className="input-field-label">
                      <IconInstagram size={12} />
                      <span>Instagram (username)</span>
                    </label>
                    <div className="social-input-wrap">
                      <span className="social-input-prefix ig-prefix">@</span>
                      <input
                        type="text"
                        className="social-clean-input"
                        placeholder="username"
                        value={profileInstagram}
                        onChange={(e) => {
                          setProfileInstagram(e.target.value);
                          isUserDirtyRef.current = true;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Yutuqlar va Tajriba */}
              <section className="glass-card modern-profile-card">
                <div className="card-header-clean">
                  <div className="card-header-icon-wrap sparkles-icon-wrap">
                    <IconSparkles size={17} />
                  </div>
                  <div>
                    <h3 className="card-title">Yutuqlar va Tajriba</h3>
                  </div>
                </div>

                {/* Existing achievements list */}
                <div className="achievements-editor-chips-wrap">
                  {profileAchievements.map((ach, idx) => (
                    <span key={idx} className="achievement-edit-pill">
                      <span>{ach}</span>
                      <button
                        type="button"
                        className="achievement-remove-x"
                        onClick={() => handleRemoveAchievement(idx)}
                        aria-label="O'chirish"
                        title="O'chirish"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new achievement row */}
                <form onSubmit={handleAddAchievement} className="add-achievement-row">
                  <input
                    type="text"
                    className="modern-text-input flex-1"
                    placeholder="Yangi yutuq (masalan: 6+ yil tajriba)"
                    value={newAchievementText}
                    onChange={(e) => setNewAchievementText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="add-achievement-submit-btn scale-active"
                    disabled={!newAchievementText.trim()}
                  >
                    <IconPlus size={14} />
                    <span>Qo'shish</span>
                  </button>
                </form>

                {/* Fast-pick recommendations */}
                <div className="achievement-suggestions-block">
                  <span className="suggestions-label">Tezkor tavsiyalar (bosib qo'shing):</span>
                  <div className="suggestions-chips-row">
                    {[
                      "5+ yil tajriba",
                      "500+ bitiruvchilar",
                      "IELTS 8.5",
                      "Xalqaro olimpiada murabbiyi",
                      "Magistr darajasi",
                      "Top universitetlar talabasi",
                      "Sertifikatlangan mutaxassis"
                    ].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        className="suggestion-chip-btn scale-active"
                        onClick={() => handleAddSuggestedAchievement(sug)}
                      >
                        <IconPlus size={11} />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section 4: Sertifikatlar va Diplomlar */}
              <section className="glass-card modern-profile-card">
                <div className="card-header-flex">
                  <div className="card-header-clean" style={{ margin: 0 }}>
                    <div className="card-header-icon-wrap cert-icon-wrap">
                      <IconAward size={18} />
                    </div>
                    <div>
                      <h3 className="card-title">Sertifikat va Diplomlar</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="add-cert-trigger-btn scale-active"
                    onClick={() => setShowAddCertModal(true)}
                  >
                    <IconPlus size={13} />
                    <span>Sertifikat qo'shish</span>
                  </button>
                </div>

                <div className="certificates-edit-grid">
                  {profileCertificates.map((cert, index) => (
                    <div key={cert.id || index} className="cert-edit-item-card">
                      <div className="cert-edit-thumbnail">
                        {cert.image ? (
                          <img src={cert.image} alt={cert.title || 'Sertifikat'} />
                        ) : (
                          <span className="cert-placeholder-emoji">📜</span>
                        )}
                      </div>
                      <div className="cert-edit-details">
                        <h5 className="cert-edit-title">{cert.title || "Nomsiz sertifikat"}</h5>
                        {cert.year && <span className="cert-edit-year">{cert.year}</span>}
                      </div>
                      <button
                        type="button"
                        className="cert-edit-delete-btn"
                        onClick={() => handleRemoveCertificate(index)}
                        title="O'chirish"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="cert-add-dashed-card scale-active"
                    onClick={() => setShowAddCertModal(true)}
                  >
                    <div className="cert-add-icon-circle">
                      <IconPlus size={18} />
                    </div>
                    <span className="cert-add-text">Yangi sertifikat qo'shish</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Tab: O'qituvchi Daromadi Kalkulyatori */}
      {activeTab === 'calculator' && (
        <div className="settings-tab-content fade-in">
          {/* Main Calculator Card */}
          <section className="glass-card settings-card calc-main-card">
            <div className="card-header-flex calc-header-clean">
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Daromad hisobi</h3>
              </div>

              {activeStudentsCount > 0 && (
                <button
                  type="button"
                  className="calc-sync-pill scale-active"
                  onClick={() => {
                    setCalcStudentCount(activeStudentsCount);
                    showToast(`Faol o'quvchilar soni (${activeStudentsCount}) o'rnatildi`, 'success');
                  }}
                  title="Tizimdagi faol o'quvchilar sonini kiritish"
                >
                  Tizimdan: {activeStudentsCount}
                </button>
              )}
            </div>

            {/* 2-Column Split: Controls on Left, Results on Right */}
            <div className="calc-split-container">
              {/* Left Column: Parameter Inputs */}
              <div className="calc-controls-col">
                {/* 1. O'quvchilar soni */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">O'quvchilar soni</span>
                    <span className="calc-field-val">
                      {calcStudentCount === '' ? '0 ta' : `${calcStudentCount} ta`}
                    </span>
                  </div>

                  <div className="calc-stepper-row">
                    <button
                      type="button"
                      className="calc-step-btn scale-active"
                      onClick={() => setCalcStudentCount((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                      disabled={Number(calcStudentCount) <= 1}
                      aria-label="Kamaytirish"
                    >
                      −
                    </button>
                    <div className="calc-step-input-wrap">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        className="calc-step-input"
                        value={calcStudentCount}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setCalcStudentCount('');
                            return;
                          }
                          const cleanVal = val.replace(/^0+(?=\d)/, '');
                          const num = parseInt(cleanVal, 10);
                          setCalcStudentCount(isNaN(num) ? '' : Math.max(0, num));
                        }}
                        onBlur={() => {
                          if (calcStudentCount === '' || Number(calcStudentCount) < 1) {
                            setCalcStudentCount(1);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="calc-step-btn scale-active"
                      onClick={() => setCalcStudentCount((prev) => (Number(prev) || 0) + 1)}
                      aria-label="Oshirish"
                    >
                      +
                    </button>
                  </div>

                  <div className="calc-chips-scroll">
                    {[10, 15, 20, 25, 30, 40, 50, 75, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`calc-chip-clean scale-active ${Number(calcStudentCount) === num ? 'active' : ''}`}
                        onClick={() => setCalcStudentCount(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Oylik to'lov */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">Oylik to'lov</span>
                    <span className="calc-field-val">
                      {formatMoneyUz(Number(calcPricePerStudent) || 0)}
                    </span>
                  </div>

                  <div className="calc-price-input-wrap">
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      className="calc-price-input"
                      value={calcPricePerStudent}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCalcPricePerStudent('');
                          return;
                        }
                        const cleanVal = val.replace(/^0+(?=\d)/, '');
                        const num = parseInt(cleanVal, 10);
                        setCalcPricePerStudent(isNaN(num) ? '' : Math.max(0, num));
                      }}
                      onBlur={() => {
                        if (calcPricePerStudent === '') {
                          setCalcPricePerStudent(0);
                        }
                      }}
                    />
                    <span className="calc-suffix-text">so'm</span>
                  </div>

                  <div className="calc-chips-scroll">
                    {[
                      { label: "250k", val: 250000 },
                      { label: "300k", val: 300000 },
                      { label: "350k", val: 350000 },
                      { label: "400k", val: 400000 },
                      { label: "450k", val: 450000 },
                      { label: "500k", val: 500000 },
                      { label: "600k", val: 600000 },
                      { label: "800k", val: 800000 },
                      { label: "1M", val: 1000000 }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        className={`calc-chip-clean scale-active ${Number(calcPricePerStudent) === preset.val ? 'active' : ''}`}
                        onClick={() => setCalcPricePerStudent(preset.val)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Ulush */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">O'qituvchi ulushi</span>
                    <span className="calc-field-val">{calcTeacherPercent}%</span>
                  </div>

                  <div className="calc-slider-wrap">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="calc-range-slider"
                      value={calcTeacherPercent}
                      onChange={(e) => setCalcTeacherPercent(Number(e.target.value))}
                    />
                    <div className="calc-slider-ticks">
                      {[0, 25, 50, 75, 100].map((t) => (
                        <span
                          key={t}
                          className={`calc-tick-mark ${calcTeacherPercent === t ? 'active' : ''}`}
                          style={{
                            left: `${t}%`,
                            transform: t === 0 ? 'none' : t === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
                          }}
                          onClick={() => setCalcTeacherPercent(t)}
                        >
                          {t}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="calc-chips-scroll">
                    {[30, 40, 50, 60].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`calc-chip-clean scale-active ${calcTeacherPercent === pct ? 'active' : ''}`}
                        onClick={() => setCalcTeacherPercent(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Calculated Results */}
              <div className="calc-results-col">
                {/* Hero Card: Teacher's Take-Home */}
                <div className="calc-hero-clean">
                  <div className="calc-hero-top">
                    <span className="calc-hero-label">O'qituvchi daromadi</span>
                    <span className="calc-hero-pct">{calcTeacherPercent}%</span>
                  </div>
                  <div className="calc-hero-val">
                    {formatMoneyUz(teacherShare)}
                  </div>
                  <div className="calc-hero-meta">
                    1 o'quvchidan: {formatMoneyUz(perStudentTeacherShare)}
                  </div>
                </div>

                {/* Secondary Stats */}
                <div className="calc-stats-dual">
                  <div className="calc-stat-clean">
                    <span className="calc-stat-lbl">Jami tushum</span>
                    <span className="calc-stat-num">{formatMoneyUz(grossTotal)}</span>
                    <span className="calc-stat-sub">{Number(calcStudentCount) || 0} ta o'quvchi</span>
                  </div>

                  <div className="calc-stat-clean">
                    <span className="calc-stat-lbl">Markaz ulushi ({100 - calcTeacherPercent}%)</span>
                    <span className="calc-stat-num">{formatMoneyUz(centerShare)}</span>
                    <span className="calc-stat-sub">{formatMoneyUz(grossTotal - teacherShare)}</span>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="calc-ratio-clean">
                  <div className="calc-ratio-row">
                    <span>O'qituvchi ({calcTeacherPercent}%)</span>
                    <span>Markaz ({100 - calcTeacherPercent}%)</span>
                  </div>
                  <div className="calc-bar-track">
                    <div
                      className="calc-bar-teacher"
                      style={{ width: `${Math.min(100, Math.max(0, calcTeacherPercent))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Real Guruhlar Bo'yicha Minimalist Ro'yxat */}
          {activeGroups.length > 0 && (
            <section className="glass-card settings-card calc-groups-clean-card">
              <div className="card-header-flex calc-groups-head">
                <div>
                  <h4 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Guruhlar bo'yicha</h4>
                  <span className="calc-groups-head-sub">{activeGroups.length} ta guruh</span>
                </div>
                <span className="calc-groups-count-badge">{totalGroupsStudents} ta o'quvchi</span>
              </div>

              <div className="calc-groups-table">
                {groupsBreakdown.map((grp) => (
                  <div key={grp.id} className="calc-group-row">
                    <div className="calc-group-row-info">
                      <span className="calc-group-row-name">{grp.name}</span>
                      <span className="calc-group-row-count">{grp.count} ta o'quvchi</span>
                    </div>
                    <div className="calc-group-row-amounts">
                      <span className="calc-group-row-gross">{formatMoneyUz(grp.gross)}</span>
                      <span className="calc-group-row-share">+{formatMoneyUz(grp.teacherShare)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="calc-groups-total-bar">
                <span className="lbl">Jami o'qituvchiga:</span>
                <span className="val">+{formatMoneyUz(totalGroupsTeacherShare)}</span>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Tab 1: Tezkor Izoh Shablonlari */}
      {activeTab === 'tags' && (
        <div className="settings-tab-content fade-in">
          {/* Add Tag Card */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Yangi Izoh Shabloni Qo'shish</h3>
              </div>
            </div>

            <form onSubmit={handleAddTag} className="add-tag-form-modern">
              <div className="tag-form-inputs-row">
                <div className="tag-input-group flex-2">
                  <label className="input-field-label">Shablon matni (Izoh)</label>
                  <input
                    type="text"
                    className="form-input tag-input-modern"
                    placeholder="Masalan: Faol ishtirok etdi"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                  />
                </div>

                <div className="tag-input-group flex-1">
                  <label className="input-field-label">Like qiymati (+ / -)</label>
                  <input
                    type="number"
                    className="form-input tag-pts-modern"
                    placeholder="Like (+/-)"
                    value={newTagPoints}
                    onChange={(e) => setNewTagPoints(e.target.value)}
                  />
                </div>

                <div className="tag-submit-group">
                  <button type="submit" className="btn btn-primary scale-active add-tag-submit-btn">
                    <IconPlus size={15} />
                    <span>Qo'shish</span>
                  </button>
                </div>
              </div>

              {/* Point Preset Quick Buttons */}
              <div className="points-presets-container">
                <span className="presets-label">Tezkor Like'lar:</span>
                <div className="presets-chips-list">
                  {POINT_PRESETS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      className={`preset-chip-btn ${pts > 0 ? 'preset-pos' : 'preset-neg'} ${Number(newTagPoints) === pts ? 'active' : ''}`}
                      onClick={() => setNewTagPoints(String(pts))}
                    >
                      {pts > 0 ? `+${pts}` : pts}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </section>

          {/* Tag List Card */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Mavjud Izoh Shablonlari</h3>
                <p className="card-desc">Jami {normalizedTags.length} ta tezkor shablon</p>
              </div>
              <div className="card-actions-row">
                {normalizedTags.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary scale-active btn-sm text-red"
                    onClick={handleClearAllTags}
                  >
                    Barchasini tozalash
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary scale-active btn-sm"
                  onClick={handleResetDefaultTags}
                >
                  <IconRotateCcw size={13} />
                  <span>Standartga qaytarish</span>
                </button>
              </div>
            </div>

            {normalizedTags.length > 0 ? (
              <div className="tags-grid-modern">
                {normalizedTags.map((tagObj, idx) => (
                  <div key={idx} className="tag-card-modern">
                    <div className="tag-display-row">
                      <span className="tag-name-text" title={tagObj.text}>{tagObj.text}</span>
                      <div className="tag-right-controls">
                        <span className={`tag-pts-pill ${tagObj.points >= 0 ? 'pts-pos' : 'pts-neg'}`}>
                          {tagObj.points >= 0 ? `+${tagObj.points}` : tagObj.points}
                        </span>
                        <button
                          type="button"
                          className="tag-icon-action"
                          onClick={() => handleStartEditTag(idx, tagObj)}
                          title="Tahrirlash"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="tag-icon-action delete-act"
                          onClick={() => handleDeleteTag(tagObj.text)}
                          title="O'chirish"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-subtle-box">
                <IconTag size={28} />
                <p>Hozircha tezkor izoh shablonlari mavjud emas.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetDefaultTags}>
                  Standart shablonlarni yuklash
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab 4: Tizim & Zaxira (JSON Backup, Snapshots, Savat, Xavfsizlik) */}
      {activeTab === 'system' && (
        <div className="settings-tab-content fade-in">
          {/* JSON Export / Import Cards */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Faylli Zaxiralash (JSON Backup & Restore)</h3>
              </div>
            </div>

            <div className="backup-action-grid">
              <div className="backup-action-card">
                <div className="backup-card-icon-box">
                  <IconDownload size={22} />
                </div>
                <div className="backup-card-text">
                  <strong className="backup-card-title">Zaxira yuklab olish</strong>
                  <p className="backup-card-desc">Tizimning joriy holatini .json fayl sifatida kompyuteringizga saqlab qo'yadi.</p>
                </div>
                <button type="button" className="btn btn-primary scale-active backup-card-btn" onClick={handleExport}>
                  <IconDownload size={15} />
                  <span>JSON Zaxira Yuklab Olish</span>
                </button>
              </div>

              <div className="backup-action-card">
                <div className="backup-card-icon-box import-icon-box">
                  <IconUpload size={22} />
                </div>
                <div className="backup-card-text">
                  <strong className="backup-card-title">Zaxiradan tiklash</strong>
                  <p className="backup-card-desc">Avval yuklab olingan .json zaxira faylni yuklab, tizim ma'lumotlarini tiklaydi.</p>
                </div>
                <label htmlFor="import-file-settings-tab" className="btn btn-secondary scale-active backup-card-btn import-card-label">
                  <IconUpload size={15} />
                  <span>JSON Faylni Yuklash</span>
                </label>
                <input
                  id="import-file-settings-tab"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </section>

          {/* Cloud Snapshots Card */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Bulutli Zaxira Nuqtalari (Snapshots)</h3>
                <p className="card-desc">O'zgarishlar kiritilganda avtomatik saqlanadigan xavfsizlik nuqtalari</p>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <div className="empty-subtle-box">
                <IconCloud size={28} />
                <p>Hozircha saqlangan bulutli zaxira nuqtalari mavjud emas.</p>
              </div>
            ) : (
              <div className="snapshots-list-modern">
                {snapshots.map((snap, idx) => {
                  const snapGroupsCount = snap.data && snap.data.groups ? snap.data.groups.filter((g) => !g.deleted).length : 0;
                  const snapStudentsCount = snap.data && snap.data.students ? snap.data.students.filter((s) => !s.deleted).length : 0;
                  return (
                    <div key={idx} className="snapshot-row-modern">
                      <div className="snapshot-left">
                        <div className="snapshot-num-badge">#{idx + 1}</div>
                        <div className="snapshot-text">
                          <strong className="snapshot-date">
                            {snap.timestamp ? new Date(snap.timestamp).toLocaleString() : "Noma'lum"}
                          </strong>
                          <span className="snapshot-meta-info">
                            {snapGroupsCount} ta guruh • {snapStudentsCount} ta o'quvchi
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary scale-active btn-sm snapshot-rollback-btn"
                        onClick={() => setRollbackConfirmModal({ snapshot: snap })}
                      >
                        <IconRotateCcw size={13} />
                        <span>Holatni Tiklash</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Savat (Recycle Bin) */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Savat (Recycle Bin)</h3>
                <p className="card-desc">O'chirilgan guruhlar va o'quvchilarni qayta tiklash yoki butunlay o'chirish</p>
              </div>

              {/* Segmented Filter Control */}
              <div className="trash-segmented-filter">
                <button
                  type="button"
                  className={`trash-seg-btn ${trashFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTrashFilter('all')}
                >
                  Barchasi ({totalTrashCount})
                </button>
                <button
                  type="button"
                  className={`trash-seg-btn ${trashFilter === 'groups' ? 'active' : ''}`}
                  onClick={() => setTrashFilter('groups')}
                >
                  Guruhlar ({deletedGroups.length})
                </button>
                <button
                  type="button"
                  className={`trash-seg-btn ${trashFilter === 'students' ? 'active' : ''}`}
                  onClick={() => setTrashFilter('students')}
                >
                  O'quvchilar ({deletedStudents.length})
                </button>
              </div>
            </div>

            {totalTrashCount > 0 && (
              <div className="trash-search-row">
                <input
                  type="text"
                  className="form-input trash-search-input"
                  placeholder="Savatdan qidirish..."
                  value={trashSearch}
                  onChange={(e) => setTrashSearch(e.target.value)}
                />
              </div>
            )}

            {filteredDeletedGroups.length === 0 && filteredDeletedStudents.length === 0 ? (
              <div className="empty-subtle-box">
                <IconTrash size={28} />
                <p>
                  {trashSearch.trim()
                    ? "Qidiruv bo'yicha o'chirilgan ma'lumot topilmadi."
                    : "Savat bo'sh! Hech qanday guruh yoki o'quvchi o'chirilmagan."}
                </p>
              </div>
            ) : (
              <div className="trash-items-scrollable">
                {/* Deleted Groups */}
                {filteredDeletedGroups.map((group) => (
                  <div key={group.id} className="trash-item-row">
                    <div className="trash-item-left">
                      <div className="trash-item-icon-box group-icon-box">
                        <IconShield size={18} />
                      </div>
                      <div className="trash-item-text">
                        <strong className="trash-item-title">{group.name}</strong>
                        <span className="trash-item-meta">
                          Guruh • {group.deletedAt ? new Date(group.deletedAt).toLocaleDateString() : "Noma'lum sana"}
                        </span>
                      </div>
                    </div>
                    <div className="trash-item-btns">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm scale-active restore-btn"
                        onClick={() => {
                          onRestoreGroup(group.id);
                          showToast(`"${group.name}" guruhi qayta tiklandi!`, "success");
                        }}
                      >
                        <IconRotateCcw size={13} />
                        <span>Tiklash</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm scale-active perm-delete-btn"
                        onClick={() => setDeleteConfirmModal({ type: 'group', id: group.id, name: group.name })}
                      >
                        <IconTrash size={13} />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Deleted Students */}
                {filteredDeletedStudents.map((student) => {
                  const group = groups.find((g) => g.id === student.groupId);
                  const groupName = group ? group.name : "Noma'lum guruh";
                  return (
                    <div key={student.id} className="trash-item-row">
                      <div className="trash-item-left">
                        <div className="trash-item-icon-box student-icon-box">
                          {student.emoji && student.emoji.length <= 4 ? (
                            <span>{student.emoji}</span>
                          ) : (
                            <IconUser size={18} />
                          )}
                        </div>
                        <div className="trash-item-text">
                          <strong className="trash-item-title">{student.name}</strong>
                          <span className="trash-item-meta">
                            {groupName} • {student.deletedAt ? new Date(student.deletedAt).toLocaleDateString() : "Noma'lum sana"}
                          </span>
                        </div>
                      </div>
                      <div className="trash-item-btns">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm scale-active restore-btn"
                          onClick={() => {
                            onRestoreStudent(student.id);
                            showToast(`"${student.name}" qayta tiklandi!`, "success");
                          }}
                        >
                          <IconRotateCcw size={13} />
                          <span>Tiklash</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm scale-active perm-delete-btn"
                          onClick={() => setDeleteConfirmModal({ type: 'student', id: student.id, name: student.name })}
                        >
                          <IconTrash size={13} />
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Xavfli Hudud (Danger Zone) */}
          <section className="glass-card settings-card danger-zone-card">
            <div className="danger-header">
              <div className="danger-icon-title">
                <div className="danger-alert-box">
                  <IconAlert size={22} />
                </div>
                <div>
                  <h3 className="card-title text-red">Xavfli Hudud (Danger Zone)</h3>
                  <p className="card-desc text-red" style={{ marginBottom: 0 }}>
                    Barcha guruhlar, talabalar, baholash tarixi va davomatni butunlay tozalash
                  </p>
                </div>
              </div>
            </div>

            <div className="danger-zone-body">
              <div className="danger-notice-box">
                <IconAlert size={18} />
                <p>
                  <strong>Diqqat!</strong> Ushbu amal hisobingizdagi barcha ma'lumotlarni tozalaydi va tizimni boshlang'ich holatiga qaytaradi.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-danger scale-active danger-action-btn"
                onClick={() => {
                  setShowResetConfirm(true);
                }}
              >
                <IconTrash size={16} />
                <span>Barcha Ma'lumotlarni Butunlay O'chirish</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* MODAL 1: Reset Database Confirmation */}
      {showResetConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content glass modal-confirm" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setShowResetConfirm(false)}>
              <IconX />
            </button>
            <div className="modal-danger-header">
              <div className="danger-alert-box-sm">
                <IconAlert size={20} />
              </div>
              <h3 className="modal-title text-red" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Butunlay tozalashni tasdiqlang
              </h3>
            </div>
            <p className="modal-warning-text" style={{ fontSize: '0.88rem', lineHeight: 1.5, margin: '14px 0 20px', color: 'var(--text-primary)' }}>
              Haqiqatan ham barcha ma'lumotlarni (guruhlar, talabalar, baholar, davomat) o'chirib yubormoqchimisiz? Tizim boshlang'ich holatga qaytadi.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary scale-active" onClick={() => setShowResetConfirm(false)}>
                Bekor qilish
              </button>
              <button type="button" className="btn btn-danger scale-active" onClick={handleReset}>
                Ha, butunlay o'chirilsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Permanent Delete Item Confirmation */}
      {deleteConfirmModal && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteConfirmModal(null)}>
          <div className="modal-content glass modal-confirm" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setDeleteConfirmModal(null)}>
              <IconX />
            </button>
            <h3 className="modal-title text-red" style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '12px' }}>
              Doimiy o'chirishni tasdiqlang
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              {deleteConfirmModal.type === 'group'
                ? `"${deleteConfirmModal.name}" guruhini va unga tegishli barcha talabalarni BUTUNLAY o'chirmoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.`
                : `"${deleteConfirmModal.name}" o'quvchisini BUTUNLAY o'chirmoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.`}
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary scale-active" onClick={() => setDeleteConfirmModal(null)}>
                Bekor qilish
              </button>
              <button type="button" className="btn btn-danger scale-active" onClick={handleExecutePermanentDelete}>
                Ha, butunlay o'chirish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Rollback Snapshot Confirmation */}
      {rollbackConfirmModal && createPortal(
        <div className="modal-overlay" onClick={() => setRollbackConfirmModal(null)}>
          <div className="modal-content glass modal-confirm" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setRollbackConfirmModal(null)}>
              <IconX />
            </button>
            <h3 className="modal-title" style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '12px' }}>
              Zaxira nuqtasiga qaytish
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Haqiqatan ham tizimni <strong>{rollbackConfirmModal.snapshot.timestamp ? new Date(rollbackConfirmModal.snapshot.timestamp).toLocaleString() : 'avvalgi'}</strong> holatiga qaytarmoqchimisiz?
            </p>
            <div className="modal-note-box" style={{ padding: '10px 14px', background: '#F5F5F7', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              💡 Joriy holat xavfsizlik uchun avtomatik JSON zaxira sifatida yuklab beriladi.
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary scale-active" onClick={() => setRollbackConfirmModal(null)}>
                Bekor qilish
              </button>
              <button type="button" className="btn btn-primary scale-active" onClick={handleExecuteRollback}>
                Holatni tiklash
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: Edit Quick Tag */}
      {editingTagIndex !== null && createPortal(
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content glass modal-confirm" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={handleCloseEditModal}>
              <IconX />
            </button>
            <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
              Izoh shablonini tahrirlash
            </h3>
            <form onSubmit={handleSaveEditTag}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="input-field-label">Shablon matni (Izoh)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.92rem' }}
                  placeholder="Masalan: Faol qatnashdi"
                  value={editTagText}
                  onChange={(e) => setEditTagText(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="input-field-label" style={{ margin: 0 }}>Like qiymati (+ / -)</label>
                  <span className={`tag-pts-pill ${Number(editTagPoints) >= 0 ? 'pts-pos' : 'pts-neg'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ProjectLikeIcon size={12} />
                    <span>{Number(editTagPoints) >= 0 ? `+${Number(editTagPoints) || 0}` : Number(editTagPoints)} Like</span>
                  </span>
                </div>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.92rem' }}
                  placeholder="Masalan: 50 yoki -20"
                  value={editTagPoints}
                  onChange={(e) => setEditTagPoints(e.target.value)}
                  required
                />
              </div>

              {/* Quick presets in edit modal */}
              <div className="points-presets-container" style={{ marginBottom: '20px' }}>
                <span className="presets-label">Tezkor tanlov:</span>
                <div className="presets-chips-list">
                  {POINT_PRESETS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      className={`preset-chip-btn ${pts > 0 ? 'preset-pos' : 'preset-neg'} ${Number(editTagPoints) === pts ? 'active' : ''}`}
                      onClick={() => setEditTagPoints(String(pts))}
                    >
                      {pts > 0 ? `+${pts}` : pts}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary scale-active" onClick={handleCloseEditModal}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary scale-active">
                  <IconCheck size={14} />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 5: Yangi sertifikat qo'shish */}
      {showAddCertModal && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop animate-backdropFadeIn" onClick={() => setShowAddCertModal(false)}>
          <div className="sheet-container cert-add-dialog animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-header">
              <h3 className="cert-modal-title">Yangi sertifikat qo'shish</h3>
              <button
                type="button"
                className="sheet-close-x-btn"
                onClick={() => setShowAddCertModal(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="cert-modal-body">
              {/* Image Preview & Upload */}
              <div className="cert-upload-area">
                {certImageInput ? (
                  <div className="cert-upload-preview">
                    <img src={certImageInput} alt="Preview" />
                    <button
                      type="button"
                      className="cert-upload-change-btn"
                      onClick={() => setCertImageInput('')}
                    >
                      Boshqa rasm tanlash
                    </button>
                  </div>
                ) : (
                  <label className="cert-dropzone-label">
                    <span className="dropzone-text">Sertifikat rasmini yuklang</span>
                    <span className="dropzone-sub">PNG, JPG, WEBP (maks. 3MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCertFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <div className="cert-form-field">
                <label className="input-field-label">Sertifikat yoki diplom nomi *</label>
                <input
                  type="text"
                  className="modern-text-input"
                  placeholder="Masalan: IELTS 8.5 yoki Yil O'qituvchisi"
                  value={certTitleInput}
                  onChange={(e) => setCertTitleInput(e.target.value)}
                />
              </div>

              <div className="cert-form-field">
                <label className="input-field-label">Yil / Berilgan tashkilot (ixtiyoriy)</label>
                <input
                  type="text"
                  className="modern-text-input"
                  placeholder="Masalan: 2024, British Council"
                  value={certYearInput}
                  onChange={(e) => setCertYearInput(e.target.value)}
                />
              </div>
            </div>

            <div className="cert-modal-actions">
              <button
                type="button"
                className="dialog-btn cancel"
                onClick={() => setShowAddCertModal(false)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="dialog-btn confirm"
                onClick={handleAddCertificateSubmit}
                disabled={!certTitleInput.trim() && !certImageInput}
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 6: Avatar Galereyasi */}
      {showGalleryModal && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop animate-backdropFadeIn" onClick={() => setShowGalleryModal(false)}>
          <div className="sheet-container avatar-gallery-dialog animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-header">
              <h3 className="cert-modal-title">Galereyadan surat tanlang</h3>
              <button
                type="button"
                className="sheet-close-x-btn"
                onClick={() => setShowGalleryModal(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="settings-gallery-grid">
              {AVATAR_GALLERY_IMAGES.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`settings-gallery-item ${profileAvatar === img.path ? 'is-selected' : ''}`}
                  onClick={() => {
                    setProfileAvatar(img.path);
                    setShowGalleryModal(false);
                  }}
                  title={img.label}
                >
                  <img src={img.path} alt={img.label} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Scoped Apple Minimalist / Brutalist Styles for Settings */}
      <style>{`
        .settings-page {
          width: 100%;
          padding-bottom: 40px;
          display: flex;
          flex-direction: column;
        }

        .settings-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tab-control-brutalist {
          display: inline-flex;
          align-items: center;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .tab-btn-brutalist {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 14px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          touch-action: manipulation;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .tab-btn-brutalist:hover {
          color: var(--text-primary);
        }

        .tab-btn-brutalist.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }

        .tab-label-mobile {
          display: none;
        }

        .tab-label-desktop {
          display: inline;
        }

        .tab-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 1px 6px;
          background: rgba(0, 0, 0, 0.08);
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          margin-left: 4px;
        }

        .tab-count-badge.badge-red {
          background: rgba(239, 68, 68, 0.15);
          color: var(--apple-red);
        }

        /* Modern Hero Identity Banner */
        .modern-hero-identity-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-identity-main {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          flex: 1;
          min-width: 280px;
        }

        .hero-avatar-wrapper {
          position: relative;
          width: 82px;
          height: 82px;
          flex-shrink: 0;
        }

        .hero-avatar-disc {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          overflow: hidden;
          background: #F5F5F7;
          border: 2px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hero-avatar-disc:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        }

        .hero-avatar-disc img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-avatar-camera-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--apple-blue, #0071E3);
          color: #FFFFFF;
          border: 2.5px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .hero-avatar-camera-btn:hover {
          background: #0077ED;
          transform: scale(1.08);
        }

        .hero-identity-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }

        .hero-role-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .role-pill-badge {
          display: inline-block;
          padding: 2px 9px;
          background: #1D1D1F;
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hero-sync-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 9px;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sync-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          flex-shrink: 0;
        }

        .sync-dot.saving {
          background: #F59E0B;
          animation: pulse 1.2s infinite;
        }

        .sync-dot.offline {
          background: #EF4444;
        }

        .hero-teacher-name {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.25;
        }

        .hero-teacher-title {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.35;
          font-weight: 500;
        }


        .hero-avatar-actions-quick {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          flex-wrap: wrap;
        }

        .hero-quick-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          font-size: 0.76rem;
          font-weight: 600;
          border-radius: var(--radius-sm, 7px);
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .hero-quick-btn:hover {
          background: #E8EAED;
          border-color: rgba(0, 0, 0, 0.15);
        }

        .hero-quick-remove-btn {
          background: none;
          border: none;
          color: var(--apple-red, #EF4444);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 4px;
          text-decoration: underline;
        }

        .hero-actions-cluster {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hero-primary-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          background: var(--apple-blue, #0071E3);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 113, 227, 0.25);
          transition: all 0.18s ease;
        }

        .hero-primary-save-btn:hover:not(:disabled) {
          opacity: 0.92;
          box-shadow: 0 4px 12px rgba(0, 113, 227, 0.35);
        }

        .hero-primary-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .hero-danger-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .hero-danger-logout-btn:hover {
          background: #FEE2E2;
          border-color: #FCA5A5;
        }

        /* Tab Content Containers */
        .settings-tab-content {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
        }

        /* Settings Card General */
        .settings-card {
          padding: 20px 24px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0 0 3px;
        }

        .card-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .card-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .input-field-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 5px;
          display: block;
        }

        /* Add Tag Form Modern */
        .add-tag-form-modern {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tag-form-inputs-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tag-input-group {
          display: flex;
          flex-direction: column;
        }

        .tag-input-group.flex-2 {
          flex: 2;
          min-width: 200px;
        }

        .tag-input-group.flex-1 {
          flex: 1;
          min-width: 120px;
          max-width: 180px;
        }

        .tag-submit-group {
          display: flex;
          align-items: flex-end;
        }

        .tag-input-modern, .tag-pts-modern {
          height: 40px;
          font-size: 0.88rem;
        }

        .add-tag-submit-btn {
          height: 40px;
          padding: 0 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          font-weight: 600;
          font-size: 0.84rem;
        }

        /* Presets Chips */
        .points-presets-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 4px;
        }

        .presets-label {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        .presets-chips-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .preset-chip-btn {
          padding: 3px 10px;
          font-size: 0.76rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .preset-chip-btn.preset-pos {
          background: #ECFDF5;
          color: #059669;
          border-color: #A7F3D0;
        }

        .preset-chip-btn.preset-pos:hover,
        .preset-chip-btn.preset-pos.active {
          background: #059669;
          color: #FFFFFF;
          border-color: #059669;
        }

        .preset-chip-btn.preset-neg {
          background: #FEF2F2;
          color: #DC2626;
          border-color: #FECACA;
        }

        .preset-chip-btn.preset-neg:hover,
        .preset-chip-btn.preset-neg.active {
          background: #DC2626;
          color: #FFFFFF;
          border-color: #DC2626;
        }

        /* Tags Grid Modern */
        .tags-grid-modern {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-height: 420px;
          overflow-y: auto;
          padding: 2px 2px 4px 2px;
        }

        @media (max-width: 1024px) {
          .tags-grid-modern {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .tags-grid-modern {
            grid-template-columns: 1fr;
          }
        }

        .tag-card-modern {
          display: flex;
          align-items: center;
          padding: 12px 14px;
          min-height: 52px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: all var(--transition-fast);
          box-sizing: border-box;
        }

        .tag-card-modern:hover {
          border-color: rgba(0, 0, 0, 0.15);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
        }

        .tag-display-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .tag-name-text {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.35;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tag-right-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .tag-pts-pill {
          padding: 3px 9px;
          font-size: 0.76rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          font-variant-numeric: tabular-nums;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
        }

        .tag-pts-pill.pts-pos {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .tag-pts-pill.pts-neg {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .tag-icon-action {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          color: var(--text-tertiary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast), background var(--transition-fast);
        }

        .tag-icon-action:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.06);
        }

        .tag-icon-action.delete-act:hover {
          color: var(--apple-red);
          background: #FEE2E2;
        }

        /* Trash Styles */
        .trash-segmented-filter {
          display: inline-flex;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          padding: 3px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2px;
        }

        .trash-seg-btn {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
          white-space: nowrap;
        }

        .trash-seg-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .trash-search-row {
          margin-bottom: 12px;
        }

        .trash-search-input {
          height: 38px;
          font-size: 0.84rem;
        }

        .trash-items-scrollable {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .trash-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          gap: 12px;
        }

        .trash-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .trash-item-icon-box {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1.1rem;
        }

        .trash-item-icon-box.group-icon-box {
          background: #EDE9FE;
          color: #7C3AED;
        }

        .trash-item-icon-box.student-icon-box {
          background: #E0F2FE;
          color: #0284C7;
        }

        .trash-item-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .trash-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trash-item-meta {
          font-size: 0.76rem;
          color: var(--text-secondary);
        }

        .trash-item-btns {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .restore-btn {
          font-size: 0.78rem;
          padding: 6px 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .perm-delete-btn {
          font-size: 0.78rem;
          padding: 6px 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        /* Backup Action Grid */
        .backup-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .backup-action-card {
          padding: 18px 20px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .backup-card-icon-box {
          width: 44px;
          height: 44px;
          background: #EFF6FF;
          color: var(--apple-blue);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .backup-card-icon-box.import-icon-box {
          background: #F0FDF4;
          color: var(--apple-green);
        }

        .backup-card-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .backup-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .backup-card-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .backup-card-btn {
          width: 100%;
          justify-content: center;
          font-weight: 600;
          font-size: 0.84rem;
          padding: 10px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .import-card-label {
          margin: 0;
          cursor: pointer;
        }

        /* Snapshots Modern */
        .snapshots-list-modern {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .snapshot-row-modern {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          gap: 12px;
        }

        .snapshot-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .snapshot-num-badge {
          width: 32px;
          height: 32px;
          background: #F5F5F7;
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .snapshot-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .snapshot-date {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .snapshot-meta-info {
          font-size: 0.76rem;
          color: var(--text-secondary);
        }

        .snapshot-rollback-btn {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* Danger Zone Card */
        .danger-zone-card {
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: #FFFBFB;
        }

        .danger-icon-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .danger-alert-box {
          width: 42px;
          height: 42px;
          background: #FEE2E2;
          color: var(--apple-red);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .danger-alert-box-sm {
          width: 34px;
          height: 34px;
          background: #FEE2E2;
          color: var(--apple-red);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-danger-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .danger-zone-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 14px;
        }

        .danger-notice-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.08);
          border-radius: var(--radius-md);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #991B1B;
          font-size: 0.84rem;
          line-height: 1.45;
        }

        .danger-notice-box p {
          margin: 0;
        }

        .danger-action-btn {
          width: 100%;
          padding: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Student Hero */
        .student-profile-hero {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .profile-info-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .profile-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .settings-divider {
          height: 1px;
          background: var(--border-color);
          margin: 18px 0;
        }

        .empty-subtle-box {
          padding: 32px 20px;
          text-align: center;
          background: #FAFAFC;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
          font-size: 0.84rem;
          color: var(--text-tertiary);
        }

        .empty-subtle-box p {
          margin: 0;
        }

        /* Minimalist Profile Workspace Layout */
        .profile-workspace-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .profile-editor-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          min-width: 0;
        }

        .modern-profile-card {
          padding: 22px 24px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .modern-profile-card:hover {
          border-color: rgba(0, 0, 0, 0.1);
        }

        .card-header-clean {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .card-header-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-header-icon-wrap.user-icon-wrap {
          background: rgba(0, 113, 227, 0.1);
          color: #0071E3;
        }

        .card-header-icon-wrap.social-icon-wrap {
          background: rgba(14, 165, 233, 0.1);
          color: #0284C7;
        }

        .card-header-icon-wrap.sparkles-icon-wrap {
          background: rgba(245, 158, 11, 0.12);
          color: #D97706;
        }

        .card-header-icon-wrap.cert-icon-wrap {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        .profile-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .profile-field-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .profile-field-item.full-width {
          grid-column: 1 / -1;
        }

        .input-field-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .modern-text-input,
        .modern-textarea-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 0.88rem;
          font-family: inherit;
          color: var(--text-primary);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: var(--radius-sm, 9px);
          outline: none;
          box-sizing: border-box;
          transition: border-color var(--transition-fast, 0.2s ease), box-shadow var(--transition-fast, 0.2s ease);
        }

        .modern-text-input:focus,
        .modern-textarea-input:focus {
          border-color: var(--apple-blue, #0071E3);
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
        }

        .modern-textarea-input {
          resize: vertical;
          min-height: 64px;
          line-height: 1.45;
        }

        /* Social Inputs */
        .social-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .social-input-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .social-input-wrap {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: var(--radius-sm, 9px);
          overflow: hidden;
          transition: border-color var(--transition-fast, 0.2s ease), box-shadow var(--transition-fast, 0.2s ease);
        }

        .social-input-wrap:focus-within {
          border-color: var(--apple-blue, #0071E3);
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
        }

        .social-input-prefix {
          padding: 9px 12px;
          background: #F5F5F7;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.85rem;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          user-select: none;
        }

        .social-input-prefix.tg-prefix {
          color: #0284C7;
          background: rgba(14, 165, 233, 0.08);
        }

        .social-input-prefix.ig-prefix {
          color: #E1306C;
          background: rgba(225, 48, 108, 0.08);
        }

        .social-clean-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 9px 12px;
          font-size: 0.86rem;
          font-family: inherit;
          color: var(--text-primary);
          background: transparent;
        }

        /* Achievements Editor */
        .achievements-editor-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 14px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: var(--radius-md, 12px);
          margin-bottom: 14px;
          min-height: 48px;
          align-items: center;
        }

        .achievement-edit-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          font-size: 0.82rem;
          font-weight: 600;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-full, 9999px);
          color: var(--text-primary);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: transform 0.15s ease;
        }

        .achievement-edit-pill:hover {
          transform: translateY(-1px);
        }

        .achievement-remove-x {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary, #86868B);
          font-size: 0.72rem;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .achievement-remove-x:hover {
          color: var(--apple-red, #EF4444);
          background: rgba(239, 68, 68, 0.1);
        }

        .achievements-empty-hint {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .add-achievement-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 14px;
        }

        .add-achievement-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: var(--apple-blue, #0071E3);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-sm, 9px);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast, 0.2s ease);
        }

        .add-achievement-submit-btn:hover:not(:disabled) {
          opacity: 0.92;
        }

        .add-achievement-submit-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .achievement-suggestions-block {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .suggestions-label {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        .suggestions-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .suggestion-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 11px;
          font-size: 0.76rem;
          font-weight: 600;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: var(--radius-full, 9999px);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast, 0.2s ease);
        }

        .suggestion-chip-btn:hover {
          background: #E8EAED;
          color: var(--apple-blue, #0071E3);
          border-color: rgba(0, 113, 227, 0.2);
          transform: translateY(-1px);
        }

        /* Certificates Manager */
        .add-cert-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 15px;
          font-size: 0.8rem;
          font-weight: 600;
          background: #F0FDF4;
          color: var(--apple-green, #10B981);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-full, 9999px);
          cursor: pointer;
          transition: all var(--transition-fast, 0.2s ease);
        }

        .add-cert-trigger-btn:hover {
          background: #DCFCE7;
        }

        .certificates-edit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .cert-edit-item-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md, 12px);
          transition: border-color var(--transition-fast, 0.2s ease), transform var(--transition-fast, 0.2s ease);
        }

        .cert-edit-item-card:hover {
          border-color: rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .cert-edit-thumbnail {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm, 7px);
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cert-edit-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cert-placeholder-emoji {
          font-size: 1.4rem;
        }

        .cert-edit-details {
          flex: 1;
          min-width: 0;
        }

        .cert-edit-title {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cert-edit-year {
          font-size: 0.74rem;
          color: var(--text-secondary);
        }

        .cert-edit-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          font-size: 0.82rem;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .cert-edit-delete-btn:hover {
          color: var(--apple-red, #EF4444);
          background: rgba(239, 68, 68, 0.1);
        }

        .cert-add-dashed-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px;
          background: #FAFAFC;
          border: 1.5px dashed rgba(0, 0, 0, 0.14);
          border-radius: 12px;
          cursor: pointer;
          min-height: 72px;
          transition: all 0.2s ease;
        }

        .cert-add-dashed-card:hover {
          background: rgba(0, 113, 227, 0.04);
          border-color: var(--apple-blue, #0071E3);
          color: var(--apple-blue, #0071E3);
        }

        .cert-add-icon-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: inherit;
        }

        .cert-add-dashed-card:hover .cert-add-icon-circle {
          background: var(--apple-blue, #0071E3);
          color: #FFFFFF;
        }

        .cert-add-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: inherit;
        }

        @media (max-width: 640px) {
          .profile-fields-grid,
          .social-inputs-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Profile Dialogs (Certificates & Avatar Gallery) */
        .cert-add-dialog {
          max-width: 480px;
          width: 90%;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cert-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cert-modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .cert-modal-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cert-upload-area {
          display: flex;
          flex-direction: column;
        }

        .cert-dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #FAFAFC;
          border: 2px dashed rgba(0, 0, 0, 0.12);
          border-radius: var(--radius-md, 12px);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .cert-dropzone-label:hover {
          background: #F5F5F7;
          border-color: var(--apple-blue, #0071E3);
        }

        .dropzone-icon {
          font-size: 2rem;
          margin-bottom: 6px;
        }

        .dropzone-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .dropzone-sub {
          font-size: 0.74rem;
          color: var(--text-tertiary);
          margin-top: 3px;
        }

        .cert-upload-preview {
          position: relative;
          border-radius: var(--radius-md, 10px);
          overflow: hidden;
          max-height: 200px;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .cert-upload-preview img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          display: block;
        }

        .cert-upload-change-btn {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-full, 9999px);
          padding: 5px 12px;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
        }

        .cert-form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cert-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 6px;
        }

        .avatar-gallery-dialog {
          max-width: 520px;
          width: 90%;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
          gap: 10px;
          max-height: 340px;
          overflow-y: auto;
          padding: 4px 2px;
        }

        .settings-gallery-item {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid transparent;
          padding: 2px;
          background: #FAFAFC;
          cursor: pointer;
          transition: all 0.15s ease;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-gallery-item:hover {
          transform: scale(1.08);
          border-color: rgba(0, 113, 227, 0.4);
        }

        .settings-gallery-item.is-selected {
          border-color: var(--apple-blue, #0071E3);
          box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.25);
        }

        .settings-gallery-item img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        /* Minimalist Teacher Earnings Calculator */
        .calc-main-card {
          margin-bottom: 18px;
        }

        .calc-header-clean {
          margin-bottom: 16px;
        }

        .calc-header-sub {
          font-size: 0.74rem;
          color: var(--text-tertiary);
          display: block;
          margin-top: 2px;
        }

        .calc-sync-pill {
          padding: 6px 13px;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: var(--radius-full, 9999px);
          background: #F2F4F7;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .calc-sync-pill:hover {
          background: #E4E7EC;
          border-color: rgba(0, 0, 0, 0.15);
        }

        .calc-split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .calc-controls-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .calc-input-block {
          background: #F9FAFB;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .calc-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calc-field-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-field-val {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .calc-stepper-row {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          height: 42px;
        }

        .calc-step-btn {
          width: 44px;
          height: 100%;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }

        .calc-step-btn:hover:not(:disabled) {
          background: #F2F4F7;
        }

        .calc-step-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .calc-step-input-wrap {
          flex: 1;
          height: 100%;
          border-left: 1px solid rgba(0, 0, 0, 0.06);
          border-right: 1px solid rgba(0, 0, 0, 0.06);
        }

        .calc-step-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          text-align: center;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          background: transparent;
          box-sizing: border-box;
          font-variant-numeric: tabular-nums;
        }

        .calc-price-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          height: 42px;
          overflow: hidden;
        }

        .calc-price-input {
          flex: 1;
          height: 100%;
          border: none;
          outline: none;
          padding: 0 54px 0 14px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          background: transparent;
          box-sizing: border-box;
          font-variant-numeric: tabular-nums;
        }

        .calc-suffix-text {
          position: absolute;
          right: 14px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .calc-chips-scroll {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }

        .calc-chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .calc-chip-clean {
          padding: 4px 10px;
          font-size: 0.74rem;
          font-weight: 600;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .calc-chip-clean:hover {
          color: var(--text-primary);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .calc-chip-clean.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .calc-slider-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 4px 0;
        }

        .calc-range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
          background: #E5E7EB;
          cursor: pointer;
        }

        .calc-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1D1D1F;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }

        .calc-slider-ticks {
          position: relative;
          width: 100%;
          height: 18px;
          margin-top: 4px;
        }

        .calc-tick-mark {
          position: absolute;
          font-size: 0.72rem;
          color: var(--text-tertiary);
          font-weight: 500;
          cursor: pointer;
          user-select: none;
          transition: color 0.15s ease, font-weight 0.15s ease;
        }

        .calc-tick-mark:hover {
          color: var(--text-primary);
        }

        .calc-tick-mark.active {
          color: var(--text-primary);
          font-weight: 700;
        }

        /* Results Column */
        .calc-results-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .calc-hero-clean {
          background: #18191B;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .calc-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calc-hero-label {
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.65);
        }

        .calc-hero-pct {
          font-size: 0.74rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 8px;
          border-radius: var(--radius-full, 9999px);
        }

        .calc-hero-val {
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
          line-height: 1.2;
        }

        .calc-hero-meta {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .calc-stats-dual {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .calc-stat-clean {
          background: #F9FAFB;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .calc-stat-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-stat-num {
          font-size: 1.08rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .calc-stat-sub {
          font-size: 0.7rem;
          color: var(--text-tertiary);
        }

        .calc-ratio-clean {
          background: #F9FAFB;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calc-ratio-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-bar-track {
          width: 100%;
          height: 6px;
          background: #E5E7EB;
          border-radius: var(--radius-full, 9999px);
          overflow: hidden;
        }

        .calc-bar-teacher {
          height: 100%;
          background: #1D1D1F;
          border-radius: var(--radius-full, 9999px);
          transition: width 0.25s ease;
        }

        /* Minimal Groups Table */
        .calc-groups-clean-card {
          margin-top: 18px;
        }

        .calc-groups-head {
          margin-bottom: 12px;
        }

        .calc-groups-head-sub {
          font-size: 0.74rem;
          color: var(--text-tertiary);
        }

        .calc-groups-count-badge {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: #F2F4F7;
          padding: 4px 10px;
          border-radius: var(--radius-full, 9999px);
        }

        .calc-groups-table {
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .calc-group-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: background 0.15s ease;
        }

        .calc-group-row:last-child {
          border-bottom: none;
        }

        .calc-group-row:hover {
          background: #F9FAFB;
        }

        .calc-group-row-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .calc-group-row-name {
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .calc-group-row-count {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .calc-group-row-amounts {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .calc-group-row-gross {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .calc-group-row-share {
          font-size: 0.86rem;
          font-weight: 700;
          color: #059669;
          font-variant-numeric: tabular-nums;
        }

        .calc-groups-total-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: #F9FAFB;
          border-radius: 10px;
          margin-top: 10px;
          font-size: 0.82rem;
        }

        .calc-groups-total-bar .lbl {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-groups-total-bar .val {
          font-weight: 800;
          color: #059669;
          font-size: 0.95rem;
          font-variant-numeric: tabular-nums;
        }

        /* Mobile Breakpoints */
        @media (max-width: 768px) {
          .settings-page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .settings-page-header .tab-control-brutalist {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            width: 100%;
            background: #EEEEF0;
            padding: 3px;
            gap: 2px;
            box-sizing: border-box;
          }

          .settings-page-header .tab-btn-brutalist {
            width: 100%;
            min-width: 0;
            padding: 7px 1px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            text-align: center;
            box-sizing: border-box;
          }

          .tab-label-desktop {
            display: none;
          }

          .tab-label-mobile {
            display: inline;
          }

          .settings-page-header .tab-count-badge {
            font-size: 0.65rem;
            padding: 1px 4px;
            margin-left: 2px;
            flex-shrink: 0;
          }

          .calc-split-container {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .calc-stats-dual {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .calc-hero-val {
            font-size: 1.6rem;
          }

          .calc-hero-clean {
            padding: 16px;
          }

          .calc-input-block {
            padding: 12px;
          }

          .modern-hero-identity-card {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 16px;
          }

          .hero-identity-main {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 14px;
            min-width: 0;
          }

          .hero-identity-details {
            align-items: center;
          }

          .hero-role-row {
            justify-content: center;
          }

          .hero-stats-row {
            justify-content: center;
          }

          .hero-avatar-actions-quick {
            justify-content: center;
          }

          .hero-actions-cluster {
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }

          .hero-primary-save-btn,
          .hero-danger-logout-btn {
            width: 100%;
            justify-content: center;
          }

          .tag-form-inputs-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .tag-input-group.flex-2,
          .tag-input-group.flex-1 {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .add-tag-submit-btn {
            width: 100%;
            justify-content: center;
          }

          .tags-grid-modern {
            grid-template-columns: 1fr;
          }

          .trash-segmented-filter {
            width: 100%;
            display: flex;
          }

          .trash-seg-btn {
            flex: 1 1 0px;
            text-align: center;
            padding: 6px 4px;
            font-size: 0.74rem;
          }

          .backup-action-grid {
            grid-template-columns: 1fr;
          }

          .trash-item-row,
          .snapshot-row-modern {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .trash-item-btns {
            justify-content: flex-end;
          }

          .snapshot-rollback-btn {
            width: 100%;
            justify-content: center;
          }

          .profile-fields-grid,
          .social-inputs-grid {
            grid-template-columns: 1fr;
          }

        }

        /* Settings Dark Mode Overrides */
        [data-theme="dark"] .tab-control-brutalist {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .tab-btn-brutalist {
          color: #9AA0A6;
        }

        [data-theme="dark"] .tab-btn-brutalist:hover {
          color: #E8EAED;
        }

        [data-theme="dark"] .tab-btn-brutalist.active {
          background: #303134;
          color: #E8EAED;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        [data-theme="dark"] .modern-hero-identity-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .hero-avatar-disc {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .hero-avatar-camera-btn {
          border-color: #292A2D;
        }

        [data-theme="dark"] .hero-sync-pill {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .hero-stat-divider {
          background: #3C4043;
        }

        [data-theme="dark"] .hero-stat-val {
          color: #E8EAED;
        }

        [data-theme="dark"] .hero-stat-lbl {
          color: #9AA0A6;
        }

        [data-theme="dark"] .hero-quick-btn {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .hero-quick-btn:hover {
          background: #303134;
          border-color: #5F6368;
        }

        [data-theme="dark"] .hero-danger-logout-btn {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
          color: #F87171;
        }

        [data-theme="dark"] .hero-danger-logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        [data-theme="dark"] .settings-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .card-title {
          color: #E8EAED;
        }

        [data-theme="dark"] .card-desc {
          color: #9AA0A6;
        }

        [data-theme="dark"] .tag-input-modern,
        [data-theme="dark"] .tag-pts-modern {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .tag-card-modern {
          background: #202124;
          border-color: #3C4043;
          box-shadow: none;
        }

        [data-theme="dark"] .tag-card-modern:hover {
          border-color: #5F6368;
          background: #26282B;
        }

        [data-theme="dark"] .tag-name-text {
          color: #E8EAED;
        }

        [data-theme="dark"] .tag-pts-pill.pts-pos {
          background: rgba(129, 201, 149, 0.16);
          color: #81C995;
          border-color: rgba(129, 201, 149, 0.35);
        }

        [data-theme="dark"] .tag-pts-pill.pts-neg {
          background: rgba(242, 139, 130, 0.16);
          color: #F28B82;
          border-color: rgba(242, 139, 130, 0.35);
        }

        [data-theme="dark"] .tag-icon-action {
          color: #9AA0A6;
        }

        [data-theme="dark"] .tag-icon-action:hover {
          color: #E8EAED;
          background: #303134;
        }

        [data-theme="dark"] .tag-icon-action.delete-act:hover {
          color: #F28B82;
          background: rgba(242, 139, 130, 0.18);
        }

        [data-theme="dark"] .trash-segmented-filter {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .trash-seg-btn {
          color: #9AA0A6;
        }

        [data-theme="dark"] .trash-seg-btn.active {
          background: #303134;
          color: #E8EAED;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        [data-theme="dark"] .trash-search-input {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .trash-item-row {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .trash-item-title {
          color: #E8EAED;
        }

        [data-theme="dark"] .trash-item-meta {
          color: #9AA0A6;
        }

        [data-theme="dark"] .trash-item-icon-box.group-icon-box {
          background: rgba(124, 58, 237, 0.2);
          color: #C4B5FD;
        }

        [data-theme="dark"] .trash-item-icon-box.student-icon-box {
          background: rgba(2, 132, 199, 0.2);
          color: #7DD3FC;
        }

        [data-theme="dark"] .backup-action-card {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .backup-card-title {
          color: #E8EAED;
        }

        [data-theme="dark"] .backup-card-desc {
          color: #9AA0A6;
        }

        [data-theme="dark"] .backup-card-icon-box {
          background: rgba(138, 180, 248, 0.15);
          color: #8AB4F8;
        }

        [data-theme="dark"] .backup-card-icon-box.import-icon-box {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
        }

        [data-theme="dark"] .snapshot-row-modern {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .snapshot-num-badge {
          background: #303134;
          color: #8AB4F8;
        }

        [data-theme="dark"] .snapshot-date {
          color: #E8EAED;
        }

        [data-theme="dark"] .snapshot-meta-info {
          color: #9AA0A6;
        }

        [data-theme="dark"] .danger-zone-card {
          background: rgba(242, 139, 130, 0.05);
          border-color: rgba(242, 139, 130, 0.25);
        }

        [data-theme="dark"] .danger-alert-box,
        [data-theme="dark"] .danger-alert-box-sm {
          background: rgba(242, 139, 130, 0.15);
          color: #F28B82;
        }

        [data-theme="dark"] .danger-notice-box {
          background: rgba(242, 139, 130, 0.1);
          border-color: rgba(242, 139, 130, 0.25);
          color: #F28B82;
        }

        [data-theme="dark"] .empty-subtle-box {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .modal-note-box {
          background: #202124 !important;
          color: #9AA0A6 !important;
        }

        [data-theme="dark"] .tab-count-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #E8EAED;
        }

        [data-theme="dark"] .tab-count-badge.badge-red {
          background: rgba(242, 139, 130, 0.2);
          color: #F28B82;
        }

        /* Dark Mode Profile & Dialogs */
        [data-theme="dark"] .modern-profile-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .card-header-icon-wrap.user-icon-wrap {
          background: rgba(138, 180, 248, 0.15);
          color: #8AB4F8;
        }

        [data-theme="dark"] .card-header-icon-wrap.social-icon-wrap {
          background: rgba(125, 211, 252, 0.15);
          color: #7DD3FC;
        }

        [data-theme="dark"] .card-header-icon-wrap.sparkles-icon-wrap {
          background: rgba(251, 191, 36, 0.15);
          color: #FBBF24;
        }

        [data-theme="dark"] .card-header-icon-wrap.cert-icon-wrap {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
        }

        [data-theme="dark"] .input-field-label {
          color: #9AA0A6;
        }

        [data-theme="dark"] .modern-text-input,
        [data-theme="dark"] .modern-textarea-input {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .modern-text-input:focus,
        [data-theme="dark"] .modern-textarea-input:focus {
          border-color: #8AB4F8;
          box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.2);
        }

        [data-theme="dark"] .social-input-wrap {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .social-input-wrap:focus-within {
          border-color: #8AB4F8;
          box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.2);
        }

        [data-theme="dark"] .social-input-prefix {
          background: #292A2D;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .social-clean-input {
          color: #E8EAED;
        }

        [data-theme="dark"] .achievements-editor-chips-wrap {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .achievement-edit-pill {
          background: #303134;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .suggestion-chip-btn {
          background: #303134;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .suggestion-chip-btn:hover {
          background: #3C4043;
          color: #8AB4F8;
        }

        [data-theme="dark"] .cert-edit-item-card {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .cert-edit-thumbnail {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .cert-edit-title {
          color: #E8EAED;
        }

        [data-theme="dark"] .cert-edit-year {
          color: #9AA0A6;
        }

        [data-theme="dark"] .cert-add-dashed-card {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .cert-add-dashed-card:hover {
          background: rgba(138, 180, 248, 0.08);
          border-color: #8AB4F8;
          color: #8AB4F8;
        }

        [data-theme="dark"] .cert-add-icon-circle {
          background: #303134;
          color: inherit;
        }


        [data-theme="dark"] .cert-add-dialog,
        [data-theme="dark"] .avatar-gallery-dialog {
          background: #292A2D;
          color: #E8EAED;
        }

        [data-theme="dark"] .cert-dropzone-label {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .dropzone-text {
          color: #E8EAED;
        }

        [data-theme="dark"] .settings-gallery-item {
          background: #202124;
        }

        /* Dark Mode Calculator Overrides */
        [data-theme="dark"] .calc-sync-pill {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-sync-pill:hover {
          background: #303134;
        }

        [data-theme="dark"] .calc-input-block {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-stepper-row {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-step-btn {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-step-btn:hover:not(:disabled) {
          background: #303134;
        }

        [data-theme="dark"] .calc-step-input {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-price-input-wrap {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-price-input {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-suffix-text {
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-chip-clean {
          background: #292A2D;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-chip-clean:hover {
          color: #E8EAED;
          border-color: #5F6368;
        }

        [data-theme="dark"] .calc-chip-clean.active {
          background: #E8EAED;
          color: #202124;
          border-color: #E8EAED;
        }

        [data-theme="dark"] .calc-range-slider {
          background: #3C4043;
        }

        [data-theme="dark"] .calc-range-slider::-webkit-slider-thumb {
          background: #E8EAED;
        }

        [data-theme="dark"] .calc-hero-clean {
          background: #202124;
          border: 1px solid #3C4043;
        }

        [data-theme="dark"] .calc-stat-clean {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-stat-num {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-ratio-clean {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-bar-track {
          background: #3C4043;
        }

        [data-theme="dark"] .calc-bar-teacher {
          background: #E8EAED;
        }

        [data-theme="dark"] .calc-groups-count-badge {
          background: #202124;
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-groups-table {
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-group-row {
          background: #202124;
          border-bottom-color: #2D2F31;
        }

        [data-theme="dark"] .calc-group-row:hover {
          background: #292A2D;
        }

        [data-theme="dark"] .calc-group-row-name {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-group-row-share {
          color: #81C995;
        }

        [data-theme="dark"] .calc-groups-total-bar {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .calc-groups-total-bar .val {
          color: #81C995;
        }

        [data-theme="dark"] .calc-tick-mark {
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-tick-mark:hover,
        [data-theme="dark"] .calc-tick-mark.active {
          color: #E8EAED;
        }
      `}</style>
    </div>
  );
};

export default Settings;
