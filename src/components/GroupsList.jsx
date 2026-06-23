import React, { useState, useEffect } from 'react';

const GROUP_EMOJI_OPTIONS = ['📁', '💻', '🎨', '🚀', '📚', '🎯', '💡', '🧪', '🧬', '📊', '💼', '🏠'];

const renderAvatar = (emoji) => {
  if (!emoji) return '📁';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="group-icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const GroupsList = ({ groups, students, onSelectGroup, onAddGroup, onUpdateGroup, onDeleteGroup, showToast }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState(GROUP_EMOJI_OPTIONS[0]);
  const [editGroupIcon, setEditGroupIcon] = useState(GROUP_EMOJI_OPTIONS[0]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setConfirmDeleteId(null);
        setEditingGroup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast("Guruh nomini kiriting!", "error");
      return;
    }
    onAddGroup(newGroupName, newGroupIcon);
    setNewGroupName('');
    setNewGroupIcon(GROUP_EMOJI_OPTIONS[0]);
    setShowAddModal(false);
    showToast("Yangi guruh muvaffaqiyatli qo'shildi!", "success");
  };

  const handleDelete = (id) => {
    onDeleteGroup(id);
    setConfirmDeleteId(null);
    showToast("Guruh muvaffaqiyatli o'chirildi!", "success");
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editGroupName.trim()) {
      showToast("Guruh nomini kiriting!", "error");
      return;
    }
    onUpdateGroup(editingGroup.id, editGroupName, editGroupIcon);
    setEditingGroup(null);
    setEditGroupName('');
    setEditGroupIcon(GROUP_EMOJI_OPTIONS[0]);
    showToast("Guruh nomi yangilandi!", "success");
  };

  // Helper: Count students in group
  const getStudentCount = (groupId) => {
    return students.filter(s => s.groupId === groupId).length;
  };

  return (
    <div className="groups-list-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Guruhlar</h2>
          <p className="page-subtitle">O'quv guruhlarini boshqarish va baholashga o'tish</p>
        </div>
        <button className="btn btn-primary scale-active" onClick={() => setShowAddModal(true)}>
          <span>+ Yangi guruh</span>
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="grid-cards">
          {groups.map((group) => {
            const count = getStudentCount(group.id);
            return (
              <div key={group.id} className="glass-card group-card">
                <div className="group-card-header" onClick={() => onSelectGroup(group.id)}>
                  <div className="group-folder-icon avatar-circle" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '2px solid #000', overflow: 'hidden', padding: 0 }}>
                    {renderAvatar(group.icon)}
                  </div>
                  <div className="group-badge badge badge-blue">{count} ta talaba</div>
                </div>
                
                <div className="group-card-body" onClick={() => onSelectGroup(group.id)}>
                  <h3 className="group-card-title">{group.name}</h3>
                  <p className="group-card-date">
                    Tashkil etilgan: {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="group-card-actions">
                  <button className="btn btn-secondary scale-active btn-sm" onClick={() => onSelectGroup(group.id)}>
                    Ochish ➔
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary scale-active btn-sm btn-icon-only" 
                      onClick={() => {
                        setEditingGroup(group);
                        setEditGroupName(group.name);
                        setEditGroupIcon(group.icon || '📁');
                      }}
                      title="Guruh nomini o'zgartirish"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn btn-danger scale-active btn-sm btn-icon-only" 
                      onClick={() => setConfirmDeleteId(group.id)}
                      title="Guruhni o'chirish"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card empty-groups-placeholder">
          <div className="placeholder-icon">📂</div>
          <h3>Guruhlar hali qo'shilmagan</h3>
          <p>O'quvchilarni baholash uchun dastlab guruh yarating.</p>
          <button className="btn btn-primary scale-active" onClick={() => setShowAddModal(true)}>
            Birinchi guruhni yaratish
          </button>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Yangi Guruh Qo'shish</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Guruh nomi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masalan: Frontend Boot camp 11"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Icon Picker */}
              <div className="form-group">
                <label className="form-label">Guruh Iconi</label>
                <div className="emoji-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {GROUP_EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-btn ${newGroupIcon === emoji ? 'selected' : ''}`}
                      onClick={() => setNewGroupIcon(emoji)}
                      style={{ fontSize: '1.2rem', padding: '6px' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Yoki Custom Emoji / Rasm URL (Internetdan)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: 🚀 yoki URL"
                    value={GROUP_EMOJI_OPTIONS.includes(newGroupIcon) ? '' : newGroupIcon}
                    onChange={(e) => setNewGroupIcon(e.target.value || GROUP_EMOJI_OPTIONS[0])}
                  />
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Yoki Rasm Faylini Yuklash (Kompyuterdan)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewGroupIcon(reader.result); // Base64
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary scale-active" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary scale-active">
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title text-red">⚠️ Diqqat! Guruhni o'chirish</h3>
            <p className="modal-warning-text">
              Ushbu guruhni o'chirsangiz, uning ichidagi barcha talabalar va ularga tegishli baholar (likelar) ham butunlay o'chib ketadi!
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setConfirmDeleteId(null)}>
                Bekor qilish
              </button>
              <button 
                className="btn btn-danger scale-active" 
                onClick={() => handleDelete(confirmDeleteId)}
              >
                Ha, Butunlay O'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="modal-overlay" onClick={() => setEditingGroup(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Guruh Nomini O'zgartirish</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Guruh nomi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Guruh nomi..."
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Icon Picker */}
              <div className="form-group">
                <label className="form-label">Guruh Iconi</label>
                <div className="emoji-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {GROUP_EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-btn ${editGroupIcon === emoji ? 'selected' : ''}`}
                      onClick={() => setEditGroupIcon(emoji)}
                      style={{ fontSize: '1.2rem', padding: '6px' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Yoki Custom Emoji / Rasm URL (Internetdan)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: 🚀 yoki URL"
                    value={GROUP_EMOJI_OPTIONS.includes(editGroupIcon) ? '' : editGroupIcon}
                    onChange={(e) => setEditGroupIcon(e.target.value || GROUP_EMOJI_OPTIONS[0])}
                  />
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Yoki Rasm Faylini Yuklash (Kompyuterdan)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditGroupIcon(reader.result); // Base64
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary scale-active" onClick={() => setEditingGroup(null)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary scale-active">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .groups-list-container {
          animation: fade-in 0.4s ease-out;
        }

        .group-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
        }

        .group-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .group-folder-icon {
          font-size: 2.2rem;
          line-height: 1;
        }

        .group-card-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .group-card-date {
          font-size: 0.8rem;
          color: #000000;
          opacity: 0.6;
          margin-bottom: 24px;
        }

        .group-card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .btn-icon-only {
          padding: 8px 12px;
          font-size: 1rem;
        }

        .empty-groups-placeholder {
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .placeholder-icon {
          font-size: 4rem;
        }

        .text-red {
          color: #000000 !important;
          font-weight: 800;
          text-decoration: underline;
        }

        .modal-title {
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 16px;
          color: #000000;
        }

        .modal-warning-text {
          color: #000000;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};

export default GroupsList;
