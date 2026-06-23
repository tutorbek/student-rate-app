import React, { useState, useEffect } from 'react';
import { exportDatabase, importDatabase, resetDatabase, saveQuickTags } from '../utils/db';

const Settings = ({ quickTags, setQuickTags, onReloadDatabase, showToast }) => {
  const [newTag, setNewTag] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      const dataStr = exportDatabase();
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

    fileReader.onload = (event) => {
      try {
        const jsonContent = event.target.result;
        importDatabase(jsonContent);
        onReloadDatabase();
        showToast("Ma'lumotlar muvaffaqiyatli tiklandi!", "success");
        // Clear input
        e.target.value = '';
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
    saveQuickTags(updatedTags);
    setNewTag('');
    showToast("Yangi izoh shabloni qo'shildi!", "success");
  };

  const handleDeleteTag = (tagToDelete) => {
    const updatedTags = quickTags.filter(tag => tag !== tagToDelete);
    setQuickTags(updatedTags);
    saveQuickTags(updatedTags);
    showToast("Izoh shabloni o'chirildi!", "success");
  };

  // Reset database
  const handleReset = () => {
    resetDatabase();
    onReloadDatabase();
    setShowResetConfirm(false);
    showToast("Barcha ma'lumotlar o'chirildi va tizim tozalandi!", "info");
  };

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Sozlamalar</h2>
          <p className="page-subtitle">Zaxiralash, izoh shablonlari va tizimni boshqarish</p>
        </div>
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

        {/* Danger Zone */}
        <section className="glass-card settings-section border-red">
          <h3 className="section-subtitle text-red">⚠️ Danger Zone (Xavfli hudud)</h3>
          <p className="section-desc">
            LocalStorage'dagi barcha guruhlar, o'quvchilar va baholar tarixini butunlay tozalab tashlaydi. Ushbu amalni ortga qaytarib bo'lmaydi!
          </p>
          <button className="btn btn-danger scale-active" onClick={() => setShowResetConfirm(true)}>
            Ma'lumotlarni butunlay o'chirish
          </button>
        </section>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
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
        </div>
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
