import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { exportDatabase } from '../utils/db';

const Settings = ({
  quickTags,
  setQuickTags,
  onImportDatabase,
  onResetDatabase,
  showToast,
  groups = [],
  students = [],
  transactions = [],
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
  const [newTag, setNewTag] = useState('');
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
      const dataStr = exportDatabase(groups, students, transactions, quickTags);
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

  // Quick Tags Management
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    if (quickTags.includes(newTag.trim())) {
      showToast("Ushbu izoh shabloni allaqachon mavjud!", "error");
      return;
    }

    const updatedTags = [...quickTags, newTag.trim()];
    setQuickTags(updatedTags);
    setNewTag('');
    showToast("Yangi izoh shabloni qo'shildi!", "success");
  };

  const handleDeleteTag = (tagToDelete) => {
    const updatedTags = quickTags.filter(tag => tag !== tagToDelete);
    setQuickTags(updatedTags);
    showToast("Izoh shabloni o'chirildi!", "success");
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
      <div className="page-header">
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

          <form onSubmit={handleAddTag} className="add-tag-form">
            <input
              type="text"
              className="form-input tag-input"
              placeholder="Masalan: Uy vazifasini topshirmadi ❌"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <button type="submit" className="btn btn-primary scale-active add-tag-btn">
              Qo'shish
            </button>
          </form>

          <div className="tags-list">
            {quickTags.map((tag) => (
              <div key={tag} className="tag-item glass">
                <span className="tag-text">{tag}</span>
                <button className="tag-delete-btn" onClick={() => handleDeleteTag(tag)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recycle Bin (Savat) Card */}
        <section className="glass-card settings-section">
          <h3 className="section-subtitle">🗑️ Savat (Recycle Bin)</h3>
          <p className="section-desc">
            O'chirilgan guruhlar va o'quvchilarni shu yerdan qayta tiklashingiz mumkin.
          </p>
          
          {deletedGroups.length === 0 && deletedStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.03)', border: '1px dashed #000', fontWeight: 'bold', color: '#000' }}>
              Savat bo'sh 🗑️
            </div>
          ) : (
            <div className="trash-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deletedGroups.map(group => (
                <div key={group.id} className="trash-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid #000' }}>
                  <div>
                    <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>📂</span>
                    <strong style={{ color: '#000' }}>{group.name}</strong> (Guruh)
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                      O'chirilgan sana: {group.deletedAt ? new Date(group.deletedAt).toLocaleString() : 'Noma\'lum'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary scale-active btn-sm" onClick={() => onRestoreGroup(group.id)} style={{ padding: '6px 12px', background: '#E7FF56', color: '#000', border: '1px solid #000', fontWeight: 'bold' }}>
                      Tiklash
                    </button>
                    <button className="btn btn-danger scale-active btn-sm" onClick={() => {
                      if (confirm(`"${group.name}" guruhini va uning barcha o'quvchilarini BUTUNLAY o'chirib yubormoqchimisiz? Ushbu amalni qaytarib bo'lmaydi!`)) {
                        onPermanentlyDeleteGroup(group.id);
                      }
                    }} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ff3b30', color: '#fff', border: '1px solid #ff3b30' }}>
                      Butunlay o'chirish
                    </button>
                  </div>
                </div>
              ))}
              
              {deletedStudents.map(student => {
                const group = groups.find(g => g.id === student.groupId);
                const groupName = group ? group.name : 'Noma\'lum guruh';
                return (
                  <div key={student.id} className="trash-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid #000' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{student.emoji || '👤'}</span>
                      <strong style={{ color: '#000' }}>{student.name}</strong> (O'quvchi - {groupName})
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                        O'chirilgan sana: {student.deletedAt ? new Date(student.deletedAt).toLocaleString() : 'Noma\'lum'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary scale-active btn-sm" onClick={() => onRestoreStudent(student.id)} style={{ padding: '6px 12px', background: '#E7FF56', color: '#000', border: '1px solid #000', fontWeight: 'bold' }}>
                        Tiklash
                      </button>
                      <button className="btn btn-danger scale-active btn-sm" onClick={() => {
                        if (confirm(`"${student.name}" o'quvchisini BUTUNLAY o'chirib yubormoqchimisiz? Ushbu amalni qaytarib bo'lmaydi!`)) {
                          onPermanentlyDeleteStudent(student.id);
                        }
                      }} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ff3b30', color: '#fff', border: '1px solid #ff3b30' }}>
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
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.03)', border: '1px dashed #000', fontWeight: 'bold', color: '#000' }}>
              Zaxira nuqtalari yuklanmoqda yoki mavjud emas.
            </div>
          ) : (
            <div className="snapshots-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {snapshots.map((snap, idx) => {
                const snapGroupsCount = snap.data && snap.data.groups ? snap.data.groups.filter(g => !g.deleted).length : 0;
                const snapStudentsCount = snap.data && snap.data.students ? snap.data.students.filter(s => !s.deleted).length : 0;
                return (
                  <div key={idx} className="snapshot-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid #000' }}>
                    <div>
                      <strong style={{ color: '#000' }}>Zaxira #{idx + 1}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '12px' }}>
                        {snap.timestamp ? new Date(snap.timestamp).toLocaleString() : 'Noma\'lum'}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: '#000', marginTop: '4px' }}>
                        📊 Guruhlar: <strong>{snapGroupsCount} ta</strong> | O'quvchilar: <strong>{snapStudentsCount} ta</strong>
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary scale-active btn-sm" 
                      onClick={() => {
                        if (confirm("Haqiqatan ham tizimni ushbu zaxira nuqtasiga qaytarmoqchimisiz? Amaldagi ma'lumotlaringiz o'chib ketadi (avval joriy holatingiz avtomatik JSON ko'rinishida zaxiralanadi).")) {
                          onRollback(snap.data);
                        }
                      }} 
                      style={{ padding: '6px 12px', background: '#000000', color: '#ffffff', border: '1px solid #000', fontWeight: 'bold' }}
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

        .settings-section {
          padding: 28px;
        }

        .section-subtitle {
          font-size: 1.2rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 8px;
        }

        .section-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .backup-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .import-label {
          display: inline-flex;
          cursor: pointer;
        }

        .add-tag-form {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        /* Teacher logout: hide on desktop (sidebar has it), show on mobile */
        .settings-logout-btn {
          display: none;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .settings-logout-btn {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .add-tag-form {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .tag-input {
          flex: 1;
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
          border-radius: 0;
          font-size: 0.9rem;
          background: #ffffff;
          border: 1px solid #000000;
          transition: all var(--transition-fast);
        }

        .tag-item:hover {
          background: #E7FF56;
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
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--transition-fast);
        }

        .tag-delete-btn:hover {
          transform: scale(1.3);
          color: #ff0000;
        }

        .border-red {
          border-color: #000000;
          border-style: dashed;
        }

        .border-red:hover {
          border-color: #000000;
          border-style: solid;
        }
      `}</style>
    </div>
  );
};

export default Settings;
