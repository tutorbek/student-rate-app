import React, { useState, useEffect } from 'react';
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
  onLogout
}) => {
  const [newTagText, setNewTagText] = useState('');
  const [newTagPoints, setNewTagPoints] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editTagText, setEditTagText] = useState('');
  const [editTagPoints, setEditTagPoints] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const deletedGroups = groups.filter((g) => g.deleted);
  const deletedStudents = students.filter((s) => s.deleted);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Backup Export
  const handleExport = () => {
    try {
      const dataStr = exportDatabase(groups, students, transactions, quickTags, attendance);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
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
          // Clear input
          e.target.value = '';
        }
      } catch (error) {
        showToast(error.message, "error");
      }
    };
    fileReader.readAsText(file, "UTF-8");
  };

  // Normalized Quick Tags Memo
  const normalizedTags = React.useMemo(() => {
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

  const handleSaveEditTag = (index) => {
    if (!editTagText.trim()) {
      showToast("Izoh shablon matnini kiriting!", "error");
      return;
    }
    const pts = Number(editTagPoints) || 0;
    const updated = [...normalizedTags];
    updated[index] = { text: editTagText.trim(), points: pts };
    setQuickTags(updated);
    setEditingTagIndex(null);
    showToast("Izoh shabloni yangilandi!", "success");
  };

  const handleResetDefaultTags = () => {
    setQuickTags(DEFAULT_QUICK_TAGS);
    setEditingTagIndex(null);
    showToast("Tezkor shablonlar standart holatga keltirildi!", "info");
  };

  // Reset database
  const handleReset = () => {
    onResetDatabase();
    setShowResetConfirm(false);
  };

  // Student mode: only show logout
  if (userRole === 'student') {
    return (
      <div className="settings-container">
        <div className="page-header">
          <div>
            <h2 className="page-title">Sozlamalar</h2>
          </div>
        </div>
        <div className="settings-grid">
          <section className="glass-card settings-section">
            <h3 className="section-subtitle">🚪 Akkauntdan chiqish</h3>
            <p className="section-desc">Tizimdan chiqish va boshqa akkaunt bilan kirish.</p>
            <button className="btn btn-danger scale-active settings-logout-btn" onClick={onLogout}>
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
    <div className="settings-container">
      <div className="page-header settings-header-container">
        <div>
          <h2 className="page-title">Sozlamalar</h2>
          <p className="page-subtitle">Zaxiralash, izoh shablonlari va tizimni boshqarish</p>
        </div>
        <button className="btn btn-danger scale-active settings-logout-btn" onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Chiqish
        </button>
      </div>

      <div className="settings-grid">
        {/* Backup Card */}
        <section className="glass-card settings-section">
          <h3 className="section-subtitle">💾 Ma'lumotlarni zaxiralash (Backup)</h3>
          <p className="section-desc">
            Barcha guruhlar, talabalar va baholash tarixingizni fayl ko'rinishida saqlab qo'yishingiz mumkin. Bu LocalStorage tozalanganda ma'lumotlarni tiklash imkonini beradi.
          </p>
          <div className="backup-actions">
            <button className="btn btn-primary scale-active" onClick={handleExport}>
              📥 Zaxira nusxasini yuklab olish
            </button>
            <div className="import-wrapper">
              <label htmlFor="import-file" className="btn btn-secondary scale-active import-label">
                📤 Zaxira faylini yuklash (Restore)
              </label>
              <input 
                id="import-file"
                type="file" 
                accept=".json" 
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </section>

        {/* Quick Tags Card */}
        <section className="glass-card settings-section">
          <h3 className="section-subtitle">🏷️ Tezkor izoh shablonlari</h3>
          <p className="section-desc">
            Baholash vaqtida tez-tez ishlatiladigan izohlarni boshqaring.
          </p>

          <form onSubmit={handleAddTag} className="add-tag-form" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input tag-input"
              style={{ flex: 2, minWidth: '180px' }}
              placeholder="Masalan: Uy vazifasi bajarildi 📚"
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
            />
            <input
              type="number"
              className="form-input tag-points-input"
              style={{ flex: 1, minWidth: '90px', maxWidth: '120px' }}
              placeholder="Ball (+ / -)"
              value={newTagPoints}
              onChange={(e) => setNewTagPoints(e.target.value)}
            />
            <button type="submit" className="btn btn-primary scale-active add-tag-btn">
              Qo'shish
            </button>
          </form>

          {normalizedTags.length > 0 ? (
            <div className="tags-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '14px' }}>
              {normalizedTags.map((tagObj, idx) => {
                const isEditing = editingTagIndex === idx;
                return (
                  <div key={idx} className="tag-item glass" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 2, minWidth: '130px', padding: '4px 8px', fontSize: '0.85rem' }}
                          value={editTagText}
                          onChange={(e) => setEditTagText(e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: '70px', padding: '4px 6px', fontSize: '0.85rem' }}
                          value={editTagPoints}
                          onChange={(e) => setEditTagPoints(e.target.value)}
                        />
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={() => handleSaveEditTag(idx)}
                          title="Saqlash"
                        >
                          ✓
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={() => setEditingTagIndex(null)}
                          title="Bekor qilish"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="tag-text" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{tagObj.text}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`att-badge ${tagObj.points >= 0 ? 'present' : 'absent'}`} style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                            {tagObj.points >= 0 ? `+${tagObj.points}` : tagObj.points}
                          </span>
                          <button 
                            className="tag-edit-btn" 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 4px' }} 
                            onClick={() => handleStartEditTag(idx, tagObj)}
                            title="Tahrirlash"
                          >
                            ✏️
                          </button>
                          <button 
                            className="tag-delete-btn" 
                            onClick={() => handleDeleteTag(tagObj.text)}
                            title="O'chirish"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-box-subtle" style={{ marginTop: '12px' }}>
              Hozircha tezkor izoh shablonlari mavjud emas.
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary scale-active" 
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={handleResetDefaultTags}
            >
              🔄 Standart shablonlarni tiklash
            </button>
          </div>
        </section>

        {/* Recycle Bin (Savat) Card */}
        <section className="glass-card settings-section">
          <h3 className="section-subtitle">🗑️ Savat (Recycle Bin)</h3>
          <p className="section-desc">
            O'chirilgan guruhlar va o'quvchilarni shu yerdan qayta tiklashingiz mumkin.
          </p>
          
          {deletedGroups.length === 0 && deletedStudents.length === 0 ? (
            <div className="empty-box-subtle">
              Savat bo'sh 🗑️
            </div>
          ) : (
            <div className="trash-list">
              {deletedGroups.map(group => (
                <div key={group.id} className="trash-item">
                  <div className="trash-info">
                    <span className="trash-icon">📂</span>
                    <strong className="trash-name">{group.name}</strong> <span className="trash-tag">(Guruh)</span>
                    <div className="trash-date">
                      O'chirilgan sana: {group.deletedAt ? new Date(group.deletedAt).toLocaleString() : 'Noma\'lum'}
                    </div>
                  </div>
                  <div className="trash-actions">
                    <button className="btn btn-secondary scale-active btn-sm btn-restore" onClick={() => onRestoreGroup(group.id)}>
                      Tiklash
                    </button>
                    <button className="btn btn-danger scale-active btn-sm btn-delete-perm" onClick={() => {
                      if (confirm(`"${group.name}" guruhini va uning barcha o'quvchilarini BUTUNLAY o'chirib yubormoqchimisiz? Ushbu amalni qaytarib bo'lmaydi!`)) {
                        onPermanentlyDeleteGroup(group.id);
                      }
                    }}>
                      Butunlay o'chirish
                    </button>
                  </div>
                </div>
              ))}
              
              {deletedStudents.map(student => {
                const group = groups.find(g => g.id === student.groupId);
                const groupName = group ? group.name : 'Noma\'lum guruh';
                return (
                  <div key={student.id} className="trash-item">
                    <div className="trash-info">
                      <span className="trash-icon">{student.emoji || '👤'}</span>
                      <strong className="trash-name">{student.name}</strong> <span className="trash-tag">(O'quvchi - {groupName})</span>
                      <div className="trash-date">
                        O'chirilgan sana: {student.deletedAt ? new Date(student.deletedAt).toLocaleString() : 'Noma\'lum'}
                      </div>
                    </div>
                    <div className="trash-actions">
                      <button className="btn btn-secondary scale-active btn-sm btn-restore" onClick={() => onRestoreStudent(student.id)}>
                        Tiklash
                      </button>
                      <button className="btn btn-danger scale-active btn-sm btn-delete-perm" onClick={() => {
                        if (confirm(`"${student.name}" o'quvchisini BUTUNLAY o'chirib yubormoqchimisiz? Ushbu amalni qaytarib bo'lmaydi!`)) {
                          onPermanentlyDeleteStudent(student.id);
                        }
                      }}>
                        Butunlay o'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Firestore Snapshots Rollback Card */}
        <section className="glass-card settings-section">
          <h3 className="section-subtitle">🕒 Avtomatik zaxira nuqtalari (Snapshots)</h3>
          <p className="section-desc">
            Har safar ma'lumotlar saqlanganda bulutda zaxira nuqtalari saqlanadi. Istalgan vaqtda tizimni oldingi holatga qaytarishingiz mumkin (so'nggi 5 ta holat).
          </p>

          {snapshots.length === 0 ? (
            <div className="empty-box-subtle">
              Zaxira nuqtalari yuklanmoqda yoki mavjud emas.
            </div>
          ) : (
            <div className="snapshots-list">
              {snapshots.map((snap, idx) => {
                const snapGroupsCount = snap.data && snap.data.groups ? snap.data.groups.filter(g => !g.deleted).length : 0;
                const snapStudentsCount = snap.data && snap.data.students ? snap.data.students.filter(s => !s.deleted).length : 0;
                return (
                  <div key={idx} className="snapshot-item">
                    <div className="snapshot-info">
                      <strong className="snapshot-title">Zaxira #{idx + 1}</strong>
                      <span className="snapshot-time">
                        {snap.timestamp ? new Date(snap.timestamp).toLocaleString() : 'Noma\'lum'}
                      </span>
                      <div className="snapshot-stats">
                        📊 Guruhlar: <strong>{snapGroupsCount} ta</strong> | O'quvchilar: <strong>{snapStudentsCount} ta</strong>
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary scale-active btn-sm btn-rollback" 
                      onClick={() => {
                        if (confirm("Haqiqatan ham tizimni ushbu zaxira nuqtasiga qaytarmoqchimisiz? Amaldagi ma'lumotlaringiz o'chib ketadi (avval joriy holatingiz avtomatik JSON ko'rinishida zaxiralanadi).")) {
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

        {/* Danger Zone */}
        <section className="glass-card settings-section border-red">
          <h3 className="section-subtitle text-red">⚠️ Danger Zone (Xavfli hudud)</h3>
          <p className="section-desc">
            LocalStorage'dagi barcha guruhlar, o'quvchilar va baholar tarixini butunlay tozalab tashlaydi. Ushbu amalni ortga qaytarib bo'lmaydi!
          </p>
          <button className="btn btn-danger scale-active" onClick={() => {
            triggerSilentBackupDownload(); // download backup before reset
            setShowResetConfirm(true);
          }}>
            Ma'lumotlarni butunlay o'chirish
          </button>
        </section>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setShowResetConfirm(false)}
              title="Yopish"
            >
              ✕
            </button>
            <h3 className="modal-title text-red">🚨 Butunlay o'chirishni tasdiqlaysizmi?</h3>
            <p className="modal-warning-text">
              Haqiqatan ham barcha ma'lumotlarni (guruhlar, talabalar, baholash tarixi) o'chirib yubormoqchimisiz? Tizim boshlang'ich holatga qaytadi. Faylni avvalroq yuklab olmagan bo'lsangiz, tiklash iloji bo'lmaydi.
            </p>
            <div className="modal-actions">
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

      <style>{`
        .settings-container {
          animation: fade-in 0.4s ease-out;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 800px;
        }

        .settings-container {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
          width: 100%;
        }

        .settings-section {
          padding: 24px;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          box-sizing: border-box;
          width: 100%;
        }

        .section-subtitle {
          font-size: 1.15rem;
          font-weight: 800;
          color: #000000;
          margin-bottom: 8px;
        }

        .section-desc {
          font-size: 0.88rem;
          color: #444444;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .backup-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .import-wrapper {
          display: inline-block;
        }

        .import-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-tag-form {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .tag-input {
          flex: 1;
          min-width: 200px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tag-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          font-size: 0.9rem;
          background: #ffffff;
          border: 1px solid #000000;
        }

        .tag-text {
          color: #000000;
          font-weight: 700;
        }

        .tag-delete-btn {
          background: transparent;
          border: none;
          color: #000000;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .empty-box-subtle {
          text-align: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.03);
          border: 1px dashed #000000;
          font-weight: 700;
          color: #000000;
        }

        .trash-list, .snapshots-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trash-item, .snapshot-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px;
          background: #ffffff;
          border: 1px solid #000000;
          gap: 12px;
          box-sizing: border-box;
        }

        .trash-info, .snapshot-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .trash-name, .snapshot-title {
          color: #000000;
          font-size: 0.95rem;
        }

        .trash-tag {
          font-size: 0.85rem;
          color: #555555;
        }

        .trash-date, .snapshot-time, .snapshot-stats {
          font-size: 0.78rem;
          color: #666666;
          margin-top: 2px;
        }

        .trash-actions, .snapshot-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }

        .btn-restore {
          padding: 6px 12px;
          background: #E7FF56;
          color: #000000;
          border: 1px solid #000000;
          font-weight: 800;
          font-size: 0.82rem;
        }

        .btn-delete-perm {
          padding: 6px 12px;
          font-size: 0.8rem;
          background: #ff3b30;
          color: #ffffff;
          border: 1px solid #ff3b30;
        }

        .btn-rollback {
          padding: 6px 12px;
          background: #000000;
          color: #ffffff;
          border: 1px solid #000000;
          font-weight: 800;
          font-size: 0.82rem;
        }

        /* Teacher logout: hide on desktop (sidebar has it), show on mobile */
        .settings-logout-btn {
          display: none;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .settings-logout-btn {
            display: inline-flex;
          }

          .settings-section {
            padding: 16px;
          }

          .backup-actions {
            flex-direction: column;
          }

          .backup-actions .btn, .import-wrapper, .import-label {
            width: 100%;
            text-align: center;
            justify-content: center;
          }

          .add-tag-form {
            flex-direction: column;
          }

          .add-tag-btn {
            width: 100%;
          }

          .trash-item, .snapshot-item {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .trash-actions {
            width: 100%;
            display: flex;
            gap: 8px;
          }

          .trash-actions .btn {
            flex: 1;
            text-align: center;
            justify-content: center;
          }

          .btn-rollback {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
