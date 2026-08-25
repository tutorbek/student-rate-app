import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateUniqueGroupPassword } from '../utils/db';
import { GROUP_SVG_ICONS, GROUP_COLOR_OPTIONS, renderGroupIcon } from '../utils/groupIcons';
import { AVATAR_GALLERY_IMAGES, isGalleryImage, compressUploadedImage } from '../utils/avatarGallery';

const GroupsList = ({ groups, students, onSelectGroup, onAddGroup, onUpdateGroup, onDeleteGroup, showToast, teacherId }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState(AVATAR_GALLERY_IMAGES[0].path);
  const [editGroupIcon, setEditGroupIcon] = useState(AVATAR_GALLERY_IMAGES[0].path);
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLOR_OPTIONS[0].value);
  const [editGroupColor, setEditGroupColor] = useState(GROUP_COLOR_OPTIONS[0].value);
  const [groupIconTab, setGroupIconTab] = useState('gallery');
  const [editGroupIconTab, setEditGroupIconTab] = useState('gallery');
  
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [editGroupPassword, setEditGroupPassword] = useState('');
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

  useEffect(() => {
    if (showAddModal) {
      setNewGroupPassword('Yuklanmoqda...');
      setIsGeneratingPassword(true);
      generateUniqueGroupPassword().then((pwd) => {
        setNewGroupPassword(pwd);
        setIsGeneratingPassword(false);
      });
    }
  }, [showAddModal]);

  useEffect(() => {
    if (editingGroup) {
      setEditGroupPassword(editingGroup.password || '');
    }
  }, [editingGroup]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast("Guruh nomini kiriting!", "error");
      return;
    }
    if (!newGroupPassword.trim() || newGroupPassword === 'Yuklanmoqda...') {
      showToast("Guruh parolini kiriting!", "error");
      return;
    }
    const success = await onAddGroup(newGroupName, newGroupIcon, newGroupPassword, newGroupColor);
    if (success) {
      setNewGroupName('');
      setNewGroupIcon(GROUP_SVG_ICONS[0].id);
      setNewGroupColor(GROUP_COLOR_OPTIONS[0].value);
      setNewGroupPassword('');
      setShowAddModal(false);
      showToast("Yangi guruh muvaffaqiyatli qo'shildi!", "success");
    }
  };

  const handleDelete = async (id) => {
    await onDeleteGroup(id);
    setConfirmDeleteId(null);
    showToast("Guruh muvaffaqiyatli o'chirildi!", "success");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim()) {
      showToast("Guruh nomini kiriting!", "error");
      return;
    }
    if (!editGroupPassword.trim()) {
      showToast("Guruh parolini kiriting!", "error");
      return;
    }
    const success = await onUpdateGroup(editingGroup.id, editGroupName, editGroupIcon, editGroupPassword, editGroupColor);
    if (success) {
      setEditingGroup(null);
      setEditGroupName('');
      setEditGroupIcon(GROUP_SVG_ICONS[0].id);
      setEditGroupColor(GROUP_COLOR_OPTIONS[0].value);
      setEditGroupPassword('');
      showToast("Guruh nomi, rangi va paroli yangilandi!", "success");
    }
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
        <div className="groups-vertical-list">
          {groups.map((group) => {
            const count = getStudentCount(group.id);
            const colorOption = GROUP_COLOR_OPTIONS.find(c => c.value === group.color) || GROUP_COLOR_OPTIONS[0];
            return (
              <div 
                key={group.id} 
                className="glass-card group-list-item"
                style={{ 
                  '--group-bg-light': colorOption.value || '#FFFFFF',
                  '--group-border-light': colorOption.border || 'rgba(0, 0, 0, 0.08)',
                  '--group-bg-dark': colorOption.darkBg || '#292A2D',
                  '--group-border-dark': colorOption.darkBorder || '#3C4043',
                }}
              >
                <div className="group-item-main" onClick={() => onSelectGroup(group.id)}>
                  <div className="group-folder-icon avatar-circle">
                    {renderGroupIcon(group.icon, 22)}
                  </div>
                  <div className="group-item-info">
                    <h3 className="group-item-title">{group.name}</h3>
                    <p className="group-item-date">
                      Tashkil etilgan: {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="group-item-badge-wrap" onClick={() => onSelectGroup(group.id)}>
                  <span className="group-badge badge badge-blue">{count} ta talaba</span>
                </div>

                <div className="group-item-actions">
                  <button className="btn btn-secondary scale-active btn-sm" onClick={() => onSelectGroup(group.id)}>
                    Ochish ➔
                  </button>
                  <div className="group-item-action-btns">
                    <button 
                      className="btn btn-secondary scale-active btn-sm btn-icon-only" 
                      onClick={() => {
                        setEditingGroup(group);
                        setEditGroupName(group.name);
                        setEditGroupIcon(group.icon || AVATAR_GALLERY_IMAGES[0].path);
                        setEditGroupColor(group.color || GROUP_COLOR_OPTIONS[0].value);
                        const icon = group.icon || '';
                        if (!icon) {
                          setEditGroupIconTab('gallery');
                        } else if (isGalleryImage(icon)) {
                          setEditGroupIconTab('gallery');
                        } else if (icon.startsWith('data:image')) {
                          setEditGroupIconTab('file');
                        } else {
                          setEditGroupIconTab('svg');
                        }
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button 
                      className="btn btn-danger scale-active btn-sm btn-icon-only" 
                      onClick={() => setConfirmDeleteId(group.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
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
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setShowAddModal(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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

              <div className="form-group">
                <label className="form-label">Guruh paroli (o'quvchilar uchun)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Generatsiya qilinmoqda..."
                    value={newGroupPassword}
                    onChange={(e) => setNewGroupPassword(e.target.value)}
                    disabled={isGeneratingPassword}
                    style={{ textTransform: 'lowercase' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary scale-active"
                    onClick={async () => {
                      setIsGeneratingPassword(true);
                      const pwd = await generateUniqueGroupPassword();
                      setNewGroupPassword(pwd);
                      setIsGeneratingPassword(false);
                    }}
                    disabled={isGeneratingPassword}
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Icon Picker Tabs */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Guruh Ikonkasi</label>
                  <div className="group-preview-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginRight: '6px' }}>Tanlandi:</span>
                    <div className="avatar-circle group-folder-icon" style={{ width: 28, height: 28, display: 'inline-flex', padding: 0 }}>
                      {renderGroupIcon(newGroupIcon, 16)}
                    </div>
                  </div>
                </div>
                <div className="avatar-tabs-header">
                  <button type="button" className={`avatar-tab-btn ${groupIconTab === 'gallery' ? 'active' : ''}`} onClick={() => setGroupIconTab('gallery')}>Rasmlar</button>
                  <button type="button" className={`avatar-tab-btn ${groupIconTab === 'svg' ? 'active' : ''}`} onClick={() => setGroupIconTab('svg')}>Ikonkalar</button>
                  <button type="button" className={`avatar-tab-btn ${groupIconTab === 'file' ? 'active' : ''}`} onClick={() => setGroupIconTab('file')}>Rasm yuklash</button>
                </div>

                {groupIconTab === 'gallery' && (
                  <div className="avatar-gallery-picker-grid">
                    {AVATAR_GALLERY_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className={`avatar-gallery-item-btn scale-active ${newGroupIcon === img.path ? 'selected' : ''}`}
                        onClick={() => setNewGroupIcon(img.path)}
                      >
                        <img src={img.path} alt={img.label} loading="lazy" decoding="async" className="gallery-thumb-img" />
                        {newGroupIcon === img.path && (
                          <div className="gallery-selected-badge">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {groupIconTab === 'svg' && (
                  <div className="group-svg-picker-grid">
                    {GROUP_SVG_ICONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`group-svg-btn scale-active ${newGroupIcon === item.id ? 'selected' : ''}`}
                        onClick={() => setNewGroupIcon(item.id)}
                      >
                        {item.svg(20)}
                      </button>
                    ))}
                  </div>
                )}

                {groupIconTab === 'file' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Kompyuterdan rasm yuklash</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const compressed = await compressUploadedImage(file);
                            if (compressed) setNewGroupIcon(compressed);
                          } catch (err) {
                            console.error('Failed to compress image:', err);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Card Color Picker */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Karta rangi</label>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {GROUP_COLOR_OPTIONS.find(c => c.value === newGroupColor)?.name || 'Klassik Oq'}
                  </span>
                </div>
                <div className="group-color-picker-grid">
                  {GROUP_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`group-color-btn scale-active ${newGroupColor === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value, borderColor: color.border }}
                      onClick={() => setNewGroupColor(color.value)}
                    >
                      {newGroupColor === color.value && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
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
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setConfirmDeleteId(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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
        </div>,
        document.body
      )}
      {/* Edit Group Modal */}
      {editingGroup && createPortal(
        <div className="modal-overlay" onClick={() => setEditingGroup(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setEditingGroup(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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

              <div className="form-group">
                <label className="form-label">Guruh paroli (o'quvchilar uchun)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Parol..."
                    value={editGroupPassword}
                    onChange={(e) => setEditGroupPassword(e.target.value)}
                    style={{ textTransform: 'lowercase' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary scale-active"
                    onClick={async () => {
                      const pwd = await generateUniqueGroupPassword();
                      setEditGroupPassword(pwd);
                    }}
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Icon Picker Tabs */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Guruh Ikonkasi</label>
                  <div className="group-preview-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginRight: '6px' }}>Tanlandi:</span>
                    <div className="avatar-circle group-folder-icon" style={{ width: 28, height: 28, display: 'inline-flex', padding: 0 }}>
                      {renderGroupIcon(editGroupIcon, 16)}
                    </div>
                  </div>
                </div>
                <div className="avatar-tabs-header">
                  <button type="button" className={`avatar-tab-btn ${editGroupIconTab === 'gallery' ? 'active' : ''}`} onClick={() => setEditGroupIconTab('gallery')}>Rasmlar</button>
                  <button type="button" className={`avatar-tab-btn ${editGroupIconTab === 'svg' ? 'active' : ''}`} onClick={() => setEditGroupIconTab('svg')}>Ikonkalar</button>
                  <button type="button" className={`avatar-tab-btn ${editGroupIconTab === 'file' ? 'active' : ''}`} onClick={() => setEditGroupIconTab('file')}>Rasm yuklash</button>
                </div>

                {editGroupIconTab === 'gallery' && (
                  <div className="avatar-gallery-picker-grid">
                    {AVATAR_GALLERY_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className={`avatar-gallery-item-btn scale-active ${editGroupIcon === img.path ? 'selected' : ''}`}
                        onClick={() => setEditGroupIcon(img.path)}
                      >
                        <img src={img.path} alt={img.label} loading="lazy" decoding="async" className="gallery-thumb-img" />
                        {editGroupIcon === img.path && (
                          <div className="gallery-selected-badge">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {editGroupIconTab === 'svg' && (
                  <div className="group-svg-picker-grid">
                    {GROUP_SVG_ICONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`group-svg-btn scale-active ${editGroupIcon === item.id ? 'selected' : ''}`}
                        onClick={() => setEditGroupIcon(item.id)}
                      >
                        {item.svg(20)}
                      </button>
                    ))}
                  </div>
                )}

                {editGroupIconTab === 'file' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Kompyuterdan rasm yuklash</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const compressed = await compressUploadedImage(file);
                            if (compressed) setEditGroupIcon(compressed);
                          } catch (err) {
                            console.error('Failed to compress image:', err);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Card Color Picker */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Karta rangi</label>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {GROUP_COLOR_OPTIONS.find(c => c.value === editGroupColor)?.name || 'Klassik Oq'}
                  </span>
                </div>
                <div className="group-color-picker-grid">
                  {GROUP_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`group-color-btn scale-active ${editGroupColor === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value, borderColor: color.border }}
                      onClick={() => setEditGroupColor(color.value)}
                    >
                      {editGroupColor === color.value && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
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
        </div>,
        document.body
      )}
      {/* Groups List Styles */}
      <style>{`
        .groups-list-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .groups-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-list-item {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background-color: var(--group-bg-light, #FFFFFF);
          border: 1px solid var(--group-border-light, rgba(0, 0, 0, 0.08));
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition-fast);
          content-visibility: auto;
          contain-intrinsic-size: 0 76px;
        }

        [data-theme="dark"] .group-list-item {
          background-color: var(--group-bg-dark, #292A2D) !important;
          border-color: var(--group-border-dark, #3C4043) !important;
        }

        @media (hover: hover) and (pointer: fine) {
          .group-list-item:hover {
            box-shadow: var(--shadow-md);
          }
        }

        .group-item-main {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .group-folder-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
          overflow: hidden;
          padding: 0;
          background: #F5F5F7;
          flex-shrink: 0;
        }

        [data-theme="dark"] .group-folder-icon {
          background: #202124;
          border-color: #3C4043;
        }

        .group-item-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .group-item-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .group-item-date {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 3px 0 0 0;
          font-weight: 500;
        }

        .group-item-badge-wrap {
          flex-shrink: 0;
          cursor: pointer;
          min-width: 105px;
          display: flex;
          justify-content: flex-end;
        }

        .group-badge {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          background: #F5F5F7;
          color: var(--text-primary);
          border: 1px solid rgba(0, 0, 0, 0.06);
          white-space: nowrap;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
        }

        .group-item-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .group-item-action-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 680px) {
          .group-list-item {
            flex-wrap: wrap;
            padding: 14px 16px;
            gap: 12px;
          }

          .group-item-main {
            width: 100%;
            flex: none;
          }

          .group-item-badge-wrap {
            display: flex;
            align-items: center;
          }

          .group-item-actions {
            margin-left: auto;
          }
        }

        .btn-icon-only {
          padding: 7px 10px;
          font-size: 0.9rem;
          border-radius: var(--radius-sm);
        }

        .group-svg-picker-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        @media (max-width: 600px) {
          .group-svg-picker-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .group-svg-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          padding: 8px;
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }

        .group-svg-btn:hover {
          background: #F5F5F7;
        }

        .group-svg-btn.selected {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .group-color-picker-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
        }

        @media (max-width: 600px) {
          .group-color-picker-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .group-color-btn {
          height: 38px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: box-shadow var(--transition-fast);
          padding: 0;
        }

        .group-color-btn:hover {
          box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.35);
        }

        .group-color-btn.selected {
          box-shadow: 0 0 0 2px #1D1D1F, inset 0 0 0 1.5px #FFFFFF;
        }

        .empty-groups-placeholder {
          padding: 48px 30px;
          text-align: center;
          max-width: 460px;
          margin: 30px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .placeholder-icon {
          font-size: 3rem;
        }

        .text-red {
          color: var(--apple-red) !important;
          font-weight: 700;
        }

        .modal-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .modal-warning-text {
          color: var(--text-secondary);
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
