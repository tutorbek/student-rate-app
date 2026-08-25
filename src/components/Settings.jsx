import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { exportDatabase, DEFAULT_QUICK_TAGS, normalizeQuickTags } from '../utils/db';

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
  isSyncing = false
}) => {
  const [newTagText, setNewTagText] = useState('');
  const [newTagPoints, setNewTagPoints] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editTagText, setEditTagText] = useState('');
  const [editTagPoints, setEditTagPoints] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [trashFilter, setTrashFilter] = useState('all'); // 'all', 'groups', 'students'

  const deletedGroups = useMemo(() => groups.filter((g) => g.deleted), [groups]);
  const deletedStudents = useMemo(() => students.filter((s) => s.deleted), [students]);
  const activeGroups = useMemo(() => groups.filter((g) => !g.deleted), [groups]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
        setEditingTagIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Normalized Quick Tags Memo
  const normalizedTags = useMemo(() => {
    return normalizeQuickTags(quickTags);
  }, [quickTags]);

  // Quick Tags Management
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
    showToast("Yangi izoh shabloni qo'shildi!", "success");
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

  // Reset database
  const handleReset = () => {
    onResetDatabase();
    setShowResetConfirm(false);
  };

  // Student mode: only show logout
  if (userRole === 'student') {
    return (
      <div className="settings-page">
        <div className="page-header">
          <div>
            <h2 className="page-title">Sozlamalar</h2>
            <p className="page-subtitle">Akkaunt va tizim boshqaruvi</p>
          </div>
        </div>
        <div className="settings-dashboard-grid single-col">
          <section className="glass-card settings-card">
            <h3 className="card-title">🚪 Akkauntdan chiqish</h3>
            <p className="card-desc">Tizimdan chiqish va boshqa akkaunt bilan kirish.</p>
            <button className="btn btn-danger scale-active" onClick={onLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Tizimdan chiqish
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Top Page Header */}
      <div className="page-header settings-page-header">
        <div>
          <h2 className="page-title">Sozlamalar</h2>
        </div>
      </div>

      {/* Hero Account & System Overview Banner */}
      <section className="glass-card settings-hero-banner">
        <div className="hero-left-profile">
          <div className="profile-avatar-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
          </div>
          <div className="profile-details">
            <h3 className="profile-name">Epchil Robot Boshqaruv Paneli</h3>
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
          <button className="btn btn-danger scale-active hero-logout-btn" onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Chiqish</span>
          </button>
        </div>
      </section>

      {/* Main Single-Column Settings Feed */}
      <div className="settings-single-col-feed">
        {/* Card 1: Quick Tags Management */}
        <section className="glass-card settings-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Tezkor Izoh Shablonlari</h3>
              <p className="card-desc" style={{ marginBottom: 0 }}>Baholash oynasida tezkor izoh sifatida foydalaniladigan shablonlar</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {normalizedTags.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-danger scale-active btn-sm"
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
                Standart
              </button>
            </div>
          </div>

          {/* Add New Tag Form */}
          <form onSubmit={handleAddTag} className="add-tag-form-modern">
            <input
              type="text"
              className="form-input tag-input-modern"
              placeholder="Masalan: Faol qatnashdi"
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
            />
            <input
              type="number"
              className="form-input tag-pts-modern"
              placeholder="Ball (+/-)"
              value={newTagPoints}
              onChange={(e) => setNewTagPoints(e.target.value)}
            />
            <button type="submit" className="btn btn-primary scale-active add-tag-submit-btn">
              Qo'shish
            </button>
          </form>

          {/* Tag List Grid */}
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="tag-icon-action delete-act" 
                        onClick={() => handleDeleteTag(tagObj.text)}
                        title="O'chirish"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-subtle-box">
              Hozircha tezkor izoh shablonlari mavjud emas.
            </div>
          )}
        </section>

        {/* Card 2: Recycle Bin (Savat) */}
        <section className="glass-card settings-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Savat (Recycle Bin)</h3>
              <p className="card-desc" style={{ marginBottom: 0 }}>O'chirilgan guruhlar va o'quvchilarni qayta tiklash yoki butunlay o'chirish</p>
            </div>
            <div className="trash-filter-chips">
              <button 
                type="button" 
                className={`trash-chip ${trashFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTrashFilter('all')}
              >
                Barchasi ({deletedGroups.length + deletedStudents.length})
              </button>
              <button 
                type="button" 
                className={`trash-chip ${trashFilter === 'groups' ? 'active' : ''}`}
                onClick={() => setTrashFilter('groups')}
              >
                Guruhlar ({deletedGroups.length})
              </button>
              <button 
                type="button" 
                className={`trash-chip ${trashFilter === 'students' ? 'active' : ''}`}
                onClick={() => setTrashFilter('students')}
              >
                O'quvchilar ({deletedStudents.length})
              </button>
            </div>
          </div>

          {deletedGroups.length === 0 && deletedStudents.length === 0 ? (
            <div className="empty-subtle-box">
              Savat bo'sh! Hech narsa o'chirilmagan.
            </div>
          ) : (
            <div className="trash-items-scrollable">
              {/* Deleted Groups */}
              {(trashFilter === 'all' || trashFilter === 'groups') && deletedGroups.map(group => (
                <div key={group.id} className="trash-item-row">
                  <div className="trash-item-left">
                    <div className="trash-item-text">
                      <strong className="trash-item-title">{group.name}</strong>
                      <span className="trash-item-meta">
                        Guruh • {group.deletedAt ? new Date(group.deletedAt).toLocaleDateString() : 'Noma\'lum sana'}
                      </span>
                    </div>
                  </div>
                  <div className="trash-item-btns">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm scale-active restore-btn" 
                      onClick={() => onRestoreGroup(group.id)}
                    >
                      Tiklash
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm scale-active perm-delete-btn" 
                      onClick={() => {
                        if (confirm(`"${group.name}" guruhini va barcha o'quvchilarini BUTUNLAY o'chirmoqchimisiz?`)) {
                          onPermanentlyDeleteGroup(group.id);
                        }
                      }}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              ))}

              {/* Deleted Students */}
              {(trashFilter === 'all' || trashFilter === 'students') && deletedStudents.map(student => {
                const group = groups.find(g => g.id === student.groupId);
                const groupName = group ? group.name : 'Noma\'lum guruh';
                return (
                  <div key={student.id} className="trash-item-row">
                    <div className="trash-item-left">
                      <span className="trash-badge-icon">{student.emoji || '👤'}</span>
                      <div className="trash-item-text">
                        <strong className="trash-item-title">{student.name}</strong>
                        <span className="trash-item-meta">
                          {groupName} • {student.deletedAt ? new Date(student.deletedAt).toLocaleDateString() : 'Noma\'lum sana'}
                        </span>
                      </div>
                    </div>
                    <div className="trash-item-btns">
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm scale-active restore-btn" 
                        onClick={() => onRestoreStudent(student.id)}
                      >
                        Tiklash
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm scale-active perm-delete-btn" 
                        onClick={() => {
                          if (confirm(`"${student.name}" o'quvchisini BUTUNLAY o'chirmoqchimisiz?`)) {
                            onPermanentlyDeleteStudent(student.id);
                          }
                        }}
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Card 3: Cloud Snapshots (Rollback Points) */}
        <section className="glass-card settings-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Bulutli Zaxira Nuqtalari (Snapshots)</h3>
              <p className="card-desc" style={{ marginBottom: 0 }}>Avvalgi holatlarga qaytish uchun avtomatik saqlangan nuqtalar</p>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="empty-subtle-box">
              Hozircha zaxira nuqtalari mavjud emas.
            </div>
          ) : (
            <div className="snapshots-list-modern">
              {snapshots.map((snap, idx) => {
                const snapGroupsCount = snap.data && snap.data.groups ? snap.data.groups.filter(g => !g.deleted).length : 0;
                const snapStudentsCount = snap.data && snap.data.students ? snap.data.students.filter(s => !s.deleted).length : 0;
                return (
                  <div key={idx} className="snapshot-row-modern">
                    <div className="snapshot-left">
                      <div className="snapshot-num-badge">#{idx + 1}</div>
                      <div className="snapshot-text">
                        <strong className="snapshot-date">
                          {snap.timestamp ? new Date(snap.timestamp).toLocaleString() : 'Noma\'lum'}
                        </strong>
                        <span className="snapshot-meta-info">
                          {snapGroupsCount} guruh • {snapStudentsCount} o'quvchi
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary scale-active btn-sm snapshot-rollback-btn"
                      onClick={() => {
                        if (confirm("Haqiqatan ham tizimni ushbu zaxira nuqtasiga qaytarmoqchimisiz? (Joriy holat avtomatik JSON ko'rinishida yuklab beriladi).")) {
                          onRollback(snap.data);
                        }
                      }}
                    >
                      Tiklash ➔
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Card 4: Backup & Restore */}
        <section className="glass-card settings-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Ma'lumotlarni Zaxiralash (Backup & Restore)</h3>
              <p className="card-desc" style={{ marginBottom: 0 }}>Tizim ma'lumotlarini fayl ko'rinishida yuklab olish va qayta tiklash</p>
            </div>
          </div>

          <div className="backup-action-grid">
            <button className="btn btn-primary scale-active backup-btn-large" onClick={handleExport}>
              <div className="btn-text-block">
                <strong>Zaxira yuklab olish (JSON)</strong>
                <small>Faylni xavfsiz saqlab qo'yish uchun</small>
              </div>
            </button>

            <div className="import-btn-wrapper">
              <label htmlFor="import-file-settings" className="btn btn-secondary scale-active backup-btn-large import-label-large">
                <div className="btn-text-block">
                  <strong>Zaxiradan tiklash (Restore)</strong>
                  <small>Avvalgi JSON faylni yuklash</small>
                </div>
              </label>
              <input 
                id="import-file-settings"
                type="file" 
                accept=".json" 
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </section>

        {/* Card 5: Danger Zone */}
        <section className="glass-card settings-card danger-zone-card">
          <div className="danger-header">
            <div>
              <h3 className="card-title text-red">Xavfli Hudud (Danger Zone)</h3>
              <p className="card-desc text-red" style={{ marginBottom: '12px', opacity: 0.9 }}>Barcha guruhlar, o'quvchilar va ballarni butunlay tozalash</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-danger scale-active danger-action-btn"
            onClick={() => {
              triggerSilentBackupDownload();
              setShowResetConfirm(true);
            }}
          >
            Barcha Ma'lumotlarni Butunlay O'chirish
          </button>
        </section>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setShowResetConfirm(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title text-red" style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>
              Butunlay o'chirishni tasdiqlang!
            </h3>
            <p className="modal-warning-text" style={{ fontSize: '0.88rem', lineHeight: 1.5, margin: '14px 0 20px', color: '#111' }}>
              Haqiqatan ham barcha ma'lumotlarni (guruhlar, talabalar, baholash tarixi) o'chirib yubormoqchimisiz? Tizim boshlang'ich holatga qaytadi.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary scale-active" onClick={() => setShowResetConfirm(false)}>
                Bekor qilish
              </button>
              <button 
                className="btn btn-danger scale-active" 
                onClick={handleReset}
              >
                Ha, Barcha ma'lumotlar o'chirilsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Quick Tag Modal */}
      {editingTagIndex !== null && createPortal(
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={handleCloseEditModal}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
              Izoh shablonini tahrirlash
            </h3>
            <form onSubmit={handleSaveEditTag}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  Shablon matni (Izoh)
                </label>
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
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Ball qiymati (+ / -)</span>
                  <span className={`tag-pts-pill ${Number(editTagPoints) >= 0 ? 'pts-pos' : 'pts-neg'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    {Number(editTagPoints) >= 0 ? `+${Number(editTagPoints) || 0}` : Number(editTagPoints)} ball
                  </span>
                </label>
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
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary scale-active" onClick={handleCloseEditModal}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary scale-active">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Clean Apple Minimalist Styles for Settings */}
      <style>{`
        .settings-page {
          max-width: 820px;
          margin: 0 auto;
          width: 100%;
          padding-bottom: 40px;
        }

        .settings-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .settings-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-pill-minimal {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-sm);
        }

        .sync-pill-label {
          font-size: 0.78rem;
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

        /* Hero Banner */
        .settings-hero-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-left-profile {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .profile-avatar-box {
          width: 58px;
          height: 58px;
          background: #1D1D1F;
          color: #FFFFFF;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.7rem;
          flex-shrink: 0;
        }

        .profile-role-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #1D1D1F;
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          margin-bottom: 4px;
        }

        .profile-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }

        .profile-stats-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .stat-chip {
          padding: 4px 10px;
          background: #F5F5F7;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.04);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .hero-right-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hero-sync-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 8px 14px;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .sync-box-title {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sync-box-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .hero-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          font-size: 0.86rem;
          font-weight: 600;
          border-radius: var(--radius-md);
        }

        /* Single-Column Settings Feed */
        .settings-single-col-feed {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* Settings Card General */
        .settings-card {
          padding: 24px 28px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }

        .card-desc {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 16px;
        }

        /* Add Tag Form Modern */
        .add-tag-form-modern {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .tag-input-modern {
          flex: 2;
          min-width: 160px;
        }

        .tag-pts-modern {
          flex: 1;
          min-width: 80px;
          max-width: 110px;
        }

        .add-tag-submit-btn {
          white-space: nowrap;
          padding: 0 18px;
        }

        /* Tags Grid Modern */
        .tags-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 8px;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .tag-card-modern {
          padding: 10px 14px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
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
          font-size: 0.76rem;
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
          font-size: 0.84rem;
          padding: 4px 6px;
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

        /* Backup Action Grid */
        .backup-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .backup-btn-large {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          text-align: left;
          height: auto;
          width: 100%;
          border-radius: var(--radius-md);
        }

        .import-btn-wrapper {
          width: 100%;
        }

        .import-label-large {
          margin: 0;
          cursor: pointer;
        }

        .btn-icon-large {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .btn-text-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .btn-text-block strong {
          font-size: 0.88rem;
          font-weight: 700;
        }

        .btn-text-block small {
          font-size: 0.74rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        /* Trash Filter Chips */
        .trash-filter-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .trash-chip {
          padding: 4px 12px;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: var(--radius-full);
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .trash-chip.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .trash-items-scrollable {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .trash-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          gap: 10px;
        }

        .trash-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .trash-badge-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
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
          background: #1D1D1F;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 0.78rem;
          padding: 5px 12px;
          border-radius: var(--radius-sm);
        }

        .perm-delete-btn {
          font-size: 0.78rem;
          padding: 5px 12px;
          border-radius: var(--radius-sm);
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
          padding: 12px 14px;
          background: #FAFAFC;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-md);
          gap: 10px;
        }

        .snapshot-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .snapshot-num-badge {
          width: 28px;
          height: 28px;
          background: #F5F5F7;
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.8rem;
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
          font-size: 0.86rem;
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
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        /* Danger Zone Card */
        .danger-zone-card {
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: #FFFBFB;
        }

        .danger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .danger-pill {
          padding: 3px 8px;
          background: var(--apple-red);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          letter-spacing: 0.5px;
        }

        .danger-action-btn {
          width: 100%;
          padding: 12px;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .empty-subtle-box {
          padding: 24px;
          text-align: center;
          background: #FAFAFC;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.84rem;
          color: var(--text-tertiary);
        }

        /* Responsive Layout Breakpoints */
        @media (max-width: 960px) {
          .settings-hero-banner {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px 18px;
          }

          .hero-right-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .hero-logout-btn {
            width: 100%;
            justify-content: center;
          }

          .backup-action-grid {
            grid-template-columns: 1fr;
          }

          .tags-grid-modern {
            grid-template-columns: 1fr;
          }

          .add-tag-form-modern {
            flex-direction: column;
          }

          .tag-input-modern, .tag-pts-modern, .add-tag-submit-btn {
            width: 100%;
            max-width: 100%;
          }

          .trash-item-row, .snapshot-row-modern {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .trash-item-btns {
            justify-content: flex-end;
          }
        }

        /* Settings Dark Mode Overrides */
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

        [data-theme="dark"] .settings-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .card-title {
          color: #E8EAED;
        }

        [data-theme="dark"] .card-subtitle,
        [data-theme="dark"] .card-desc {
          color: #9AA0A6;
        }

        [data-theme="dark"] .tag-input-modern,
        [data-theme="dark"] .tag-pts-modern,
        [data-theme="dark"] .tag-inline-input,
        [data-theme="dark"] .tag-inline-pts {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .tag-card-modern {
          background: #202124;
          border-color: #3C4043;
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
        }

        [data-theme="dark"] .tag-icon-action.delete-act:hover {
          color: #F28B82;
        }

        [data-theme="dark"] .btn-text-block small {
          color: #9AA0A6;
        }

        [data-theme="dark"] .trash-chip {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .trash-chip.active {
          background: #8AB4F8;
          color: #202124;
          border-color: #8AB4F8;
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

        [data-theme="dark"] .restore-btn {
          background: #303134;
          color: #E8EAED;
          border: 1px solid #3C4043;
        }

        [data-theme="dark"] .restore-btn:hover {
          background: #3C4043;
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

        [data-theme="dark"] .snapshot-rollback-btn {
          background: #303134;
          color: #E8EAED;
          border: 1px solid #3C4043;
        }

        [data-theme="dark"] .snapshot-rollback-btn:hover {
          background: #3C4043;
        }

        [data-theme="dark"] .danger-zone-card {
          background: rgba(242, 139, 130, 0.06);
          border-color: rgba(242, 139, 130, 0.25);
        }

        [data-theme="dark"] .empty-subtle-box {
          background: #202124;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .modal-warning-text {
          color: #E8EAED !important;
        }
      `}</style>
    </div>
  );
};

export default Settings;
