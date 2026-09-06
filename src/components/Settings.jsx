import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { exportDatabase, DEFAULT_QUICK_TAGS, normalizeQuickTags } from '../utils/db';

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

const IconSun = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

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
  triggerSilentBackupDownload,
  userRole,
  onLogout,
  syncStatus = 'saved',
  isSyncing = false,
  theme,
  setTheme
}) => {
  // Tabs: 'tags', 'trash', 'backup', 'danger'
  const [activeTab, setActiveTab] = useState('tags');

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Memos
  const deletedGroups = useMemo(() => groups.filter((g) => g.deleted), [groups]);
  const deletedStudents = useMemo(() => students.filter((s) => s.deleted), [students]);
  const activeGroups = useMemo(() => groups.filter((g) => !g.deleted), [groups]);
  const activeStudents = useMemo(() => students.filter((s) => !s.deleted), [students]);

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

  // Escape key handler for all modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
        setEditingTagIndex(null);
        setDeleteConfirmModal(null);
        setRollbackConfirmModal(null);
        setShowLogoutConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            <h2 className="page-title">Sozlamalar</h2>
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
                <p className="profile-desc">Guruh reytingi va ballaringizni kuzatib borasiz.</p>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="student-profile-actions">
              <button className="btn btn-danger scale-active" onClick={() => setShowLogoutConfirm(true)}>
                <IconLogOut size={16} />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          </section>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && createPortal(
          <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <button type="button" className="modal-close-btn" onClick={() => setShowLogoutConfirm(false)}>
                <IconX />
              </button>
              <h3 className="modal-title" style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '12px' }}>
                Tizimdan chiqmoqchimisiz?
              </h3>
              <p className="modal-desc" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Akkauntdan chiqishni tasdiqlang. Keyingi safar kirish uchun guruh parolini qayta kiritishingiz kerak bo'ladi.
              </p>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary scale-active" onClick={() => setShowLogoutConfirm(false)}>
                  Bekor qilish
                </button>
                <button type="button" className="btn btn-danger scale-active" onClick={onLogout}>
                  Ha, chiqish
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Top Page Header with Tabs */}
      <div className="page-header settings-page-header">
        <div>
          <h2 className="page-title">Sozlamalar</h2>
          <p className="page-subtitle">Tizim konfiguratsiyasi, tezkor shablonlar, savat va zaxira nusxalari</p>
        </div>

        <div className="tab-control-brutalist">
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <IconTag size={15} />
            <span>Izohlar</span>
            <span className="tab-count-badge">{normalizedTags.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'trash' ? 'active' : ''}`}
            onClick={() => setActiveTab('trash')}
          >
            <IconTrash size={15} />
            <span>Savat</span>
            {totalTrashCount > 0 && <span className="tab-count-badge badge-red">{totalTrashCount}</span>}
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <IconCloud size={15} />
            <span className="tab-label-desktop">Zaxira & Bulut</span>
            <span className="tab-label-mobile">Zaxira</span>
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <IconShield size={15} />
            <span>Xavfsizlik</span>
          </button>
        </div>
      </div>

      {/* Hero Overview & System Status Card */}
      <section className="glass-card settings-hero-banner">
        <div className="hero-left-profile">
          <div className="profile-avatar-box">
            <IconUser size={22} />
          </div>
          <div className="profile-details">
            <div className="profile-role-row">
              <span className="role-pill-badge">{userRole === 'admin' ? 'Administrator' : "O'qituvchi"}</span>
              <span className="stats-mini-summary">
                {activeGroups.length} ta faol guruh • {activeStudents.length} ta o'quvchi
              </span>
            </div>
          </div>
        </div>

        <div className="hero-right-actions">
          <div className="hero-sync-box">
            <div className="sync-box-status">
              <span className={`sync-dot ${(isSyncing || syncStatus === 'saving') ? 'saving' : syncStatus}`} />
              <strong>
                {(isSyncing || syncStatus === 'saving')
                  ? 'Sinxronizatsiya qilinmoqda...'
                  : syncStatus === 'offline'
                    ? 'Oflayn (Internet yo\'q)'
                    : 'Supabase bilan to\'liq sinxron'}
              </strong>
            </div>
          </div>

          {theme && setTheme && (
            <button
              type="button"
              className="btn btn-secondary scale-active settings-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Mavzuni o'zgartirish"
            >
              {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
              <span>{theme === 'dark' ? 'Kunduzgi' : 'Tungi'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-danger scale-active hero-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <IconLogOut size={15} />
            <span>Chiqish</span>
          </button>
        </div>
      </section>

      {/* Tab 1: Tezkor Izoh Shablonlari */}
      {activeTab === 'tags' && (
        <div className="settings-tab-content fade-in">
          {/* Add Tag Card */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Yangi Izoh Shabloni Qo'shish</h3>
                <p className="card-desc">Baholash oynasida o'quvchilarga tezkor ball va sharh berish uchun shablon</p>
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
                  <label className="input-field-label">Ball qiymati (+ / -)</label>
                  <input
                    type="number"
                    className="form-input tag-pts-modern"
                    placeholder="Ball (+/-)"
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
                <span className="presets-label">Tezkor ballar:</span>
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
                      <span className="tag-name-text">{tagObj.text}</span>
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

      {/* Tab 2: Savat (Recycle Bin) */}
      {activeTab === 'trash' && (
        <div className="settings-tab-content fade-in">
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
        </div>
      )}

      {/* Tab 3: Bulut & Zaxira (Snapshots & JSON Backup) */}
      {activeTab === 'backup' && (
        <div className="settings-tab-content fade-in">
          {/* JSON Export / Import Cards */}
          <section className="glass-card settings-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Faylli Zaxiralash (JSON Backup & Restore)</h3>
                <p className="card-desc">Barcha guruhlar, talabalar, baholashlar va davomat tarixini JSON formatida eksport/import qilish</p>
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
        </div>
      )}

      {/* Tab 4: Xavfsizlik (Danger Zone) */}
      {activeTab === 'danger' && (
        <div className="settings-tab-content fade-in">
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
                  <strong>Diqqat!</strong> Ushbu amal bazadagi barcha ma'lumotlarni o'chiradi va tizimni boshlang'ich holatiga qaytaradi.
                  Xavfsizlik uchun tozalashdan avval joriy holat avtomatik ravishda JSON zaxira fayl ko'rinishida yuklab beriladi.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-danger scale-active danger-action-btn"
                onClick={() => {
                  triggerSilentBackupDownload();
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
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
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
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
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
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
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
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
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
                  <label className="input-field-label" style={{ margin: 0 }}>Ball qiymati (+ / -)</label>
                  <span className={`tag-pts-pill ${Number(editTagPoints) >= 0 ? 'pts-pos' : 'pts-neg'}`}>
                    {Number(editTagPoints) >= 0 ? `+${Number(editTagPoints) || 0}` : Number(editTagPoints)} ball
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

      {/* MODAL 5: Logout Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowLogoutConfirm(false)}>
              <IconX />
            </button>
            <h3 className="modal-title" style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '12px' }}>
              Tizimdan chiqmoqchimisiz?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Boshqaruv panelidan chiqishni tasdiqlang.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary scale-active" onClick={() => setShowLogoutConfirm(false)}>
                Bekor qilish
              </button>
              <button type="button" className="btn btn-danger scale-active" onClick={onLogout}>
                Ha, chiqish
              </button>
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

        /* Hero Banner */
        .settings-hero-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: 22px;
          gap: 18px;
          flex-wrap: wrap;
        }

        .hero-left-profile {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .profile-avatar-box {
          width: 48px;
          height: 48px;
          background: #1D1D1F;
          color: #FFFFFF;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-role-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 3px;
        }

        .role-pill-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #1D1D1F;
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stats-mini-summary {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .profile-name {
          font-size: 1.12rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0;
        }

        .hero-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hero-sync-box {
          display: flex;
          align-items: center;
          padding: 8px 14px;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .sync-box-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sync-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--apple-green);
          display: inline-block;
          flex-shrink: 0;
        }

        .sync-dot.saving {
          background: var(--apple-orange);
          animation: pulse 1.2s infinite;
        }

        .sync-dot.offline {
          background: var(--apple-red);
        }

        .settings-theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: var(--radius-md);
        }

        .hero-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: var(--radius-md);
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
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .tag-card-modern {
          padding: 10px 14px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: border-color var(--transition-fast);
        }

        .tag-card-modern:hover {
          border-color: rgba(0, 0, 0, 0.12);
        }

        .tag-display-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .tag-name-text {
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-primary);
          word-break: break-word;
        }

        .tag-right-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .tag-pts-pill {
          padding: 2px 8px;
          font-size: 0.74rem;
          font-weight: 700;
          border-radius: var(--radius-full);
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
          border-radius: var(--radius-sm);
          color: var(--text-tertiary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast), background var(--transition-fast);
        }

        .tag-icon-action:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.05);
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
            padding: 8px 2px;
            font-size: 0.74rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
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

          .settings-hero-banner {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
            padding: 14px 16px;
          }

          .hero-left-profile {
            gap: 12px;
          }

          .hero-right-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .hero-sync-box {
            justify-content: center;
          }

          .settings-theme-toggle,
          .hero-logout-btn {
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

        [data-theme="dark"] .settings-hero-banner {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .profile-avatar-box {
          background: #202124;
          border: 1px solid #3C4043;
          color: #8AB4F8;
        }

        [data-theme="dark"] .hero-sync-box {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .sync-box-status {
          color: #E8EAED;
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
        }

        [data-theme="dark"] .tag-card-modern:hover {
          border-color: #5F6368;
        }

        [data-theme="dark"] .tag-name-text {
          color: #E8EAED;
        }

        [data-theme="dark"] .tag-pts-pill.pts-pos {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
          border-color: rgba(129, 201, 149, 0.35);
        }

        [data-theme="dark"] .tag-pts-pill.pts-neg {
          background: rgba(242, 139, 130, 0.15);
          color: #F28B82;
          border-color: rgba(242, 139, 130, 0.35);
        }

        [data-theme="dark"] .tag-icon-action {
          color: #9AA0A6;
        }

        [data-theme="dark"] .tag-icon-action:hover {
          color: #8AB4F8;
          background: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .tag-icon-action.delete-act:hover {
          color: #F28B82;
          background: rgba(242, 139, 130, 0.15);
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
      `}</style>
    </div>
  );
};

export default Settings;
