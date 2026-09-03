import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getStudentScore, normalizeQuickTags } from '../utils/db';
import { renderGroupIcon } from '../utils/groupIcons';
import { STUDENT_AVATARS, renderStudentAvatar as renderAvatar } from '../utils/studentAvatars';
import { AVATAR_GALLERY_IMAGES, isGalleryImage, compressUploadedImage } from '../utils/avatarGallery';

const COLOR_OPTIONS = [
  { name: 'Burnt Sienna', value: '#E35336' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Sandy Brown', value: '#F4A460' },
  { name: 'Sienna', value: '#A0522D' },
];

const IconHistory = ({ size = 16, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const GroupDetail = ({ group, allGroups = [], students, transactions, quickTags, onBack, onAddStudent, onUpdateStudent, onTransferStudent, onDeleteStudent, onAwardPoints, onDeleteTransaction, showToast, userRole }) => {
  const [profileStudent, setProfileStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmoji, setEditStudentEmoji] = useState(AVATAR_GALLERY_IMAGES[0].path);
  const [editStudentColor, setEditStudentColor] = useState(COLOR_OPTIONS[0].value);
  const [editStudentGroupId, setEditStudentGroupId] = useState(group.id);
  const [transferringStudent, setTransferringStudent] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [avatarTab, setAvatarTab] = useState('gallery');
  const [editAvatarTab, setEditAvatarTab] = useState('gallery');

  const otherGroups = useMemo(() => {
    return (allGroups || []).filter(g => !g.deleted && g.id !== group.id);
  }, [allGroups, group.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddStudentModal(false);
        setConfirmDeleteId(null);
        setScoringStudent(null);
        setProfileStudent(null);
        setEditingStudent(null);
        setTransferringStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(AVATAR_GALLERY_IMAGES[0].path);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Like modal states
  const [scoringStudent, setScoringStudent] = useState(null);
  const [scoreAmount, setScoreAmount] = useState(''); // string for free editing
  const [customComment, setCustomComment] = useState('');

  const normalizedTags = useMemo(() => {
    return normalizeQuickTags(quickTags);
  }, [quickTags]);

  // Filter students in this group
  const groupStudents = useMemo(() => {
    return students
      .filter((s) => s.groupId === group.id)
      .map((s) => ({
        ...s,
        totalScore: getStudentScore(transactions, s.id, 'all'),
      }));
  }, [students, group.id, transactions]);

  // Filter transactions for profile student
  const studentTxs = useMemo(() => {
    if (!profileStudent) return [];
    return transactions.filter(t => t.studentId === profileStudent.id);
  }, [transactions, profileStudent]);

  // Handle Add Student
  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      showToast("Talaba ismini kiriting!", "error");
      return;
    }
    onAddStudent(newStudentName, group.id, selectedEmoji, selectedColor);
    setNewStudentName('');
    setSelectedEmoji(AVATAR_GALLERY_IMAGES[0].path);
    setSelectedColor(COLOR_OPTIONS[0].value);
    setShowAddStudentModal(false);
    showToast("Talaba muvaffaqiyatli qo'shildi!", "success");
  };

  const handleEditStudentSubmit = (e) => {
    e.preventDefault();
    if (!editStudentName.trim()) {
      showToast("Talaba ismini kiriting!", "error");
      return;
    }
    const isMoved = editStudentGroupId && editStudentGroupId !== group.id;
    onUpdateStudent(editingStudent.id, editStudentName, editStudentEmoji, editStudentColor, editStudentGroupId);
    const targetGroup = (allGroups || []).find(g => g.id === editStudentGroupId);
    setEditingStudent(null);
    setEditStudentName('');
    setEditStudentEmoji('🚀');
    setEditStudentColor(COLOR_OPTIONS[0].value);
    if (isMoved && targetGroup) {
      showToast(`${editStudentName.trim()} muvaffaqiyatli "${targetGroup.name}" guruhiga ko'chirildi!`, "success");
    } else {
      showToast("Talaba ma'lumotlari yangilandi!", "success");
    }
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferringStudent) return;
    if (!targetGroupId) {
      showToast("Yangi guruhni tanlang!", "error");
      return;
    }
    const targetGroup = (allGroups || []).find(g => g.id === targetGroupId);
    if (!targetGroup) {
      showToast("Guruh topilmadi!", "error");
      return;
    }
    if (onTransferStudent) {
      onTransferStudent(transferringStudent.id, targetGroupId);
    } else {
      onUpdateStudent(transferringStudent.id, transferringStudent.name, transferringStudent.emoji, transferringStudent.color, targetGroupId);
    }
    showToast(`${transferringStudent.name} muvaffaqiyatli "${targetGroup.name}" guruhiga ko'chirildi!`, "success");
    setTransferringStudent(null);
    setTargetGroupId('');
  };

  // Open like modal
  const openScoreModal = (student, amount) => {
    setScoringStudent(student);
    setScoreAmount(amount !== '' ? String(amount) : '');
    if (amount !== '') {
      const match = normalizedTags.find(t => Number(t.points) === Number(amount));
      setCustomComment(match ? match.text : '');
    } else {
      setCustomComment('');
    }
  };

  // Handle like submission
  const handleAwardPoints = (commentText) => {
    const numAmount = Number(scoreAmount);
    if (scoreAmount === '' || scoreAmount === null || scoreAmount === undefined || isNaN(numAmount)) {
      showToast("Like miqdorini kiriting!", "error");
      return;
    }
    const comment = commentText || customComment || (numAmount >= 0 ? "Like berildi" : "Like ayrildi");
    onAwardPoints(scoringStudent.id, numAmount, comment);
    setScoringStudent(null);
    setCustomComment('');
    showToast(`${scoringStudent.name}ga ${numAmount >= 0 ? `+${numAmount}` : numAmount} like berildi!`, "success");
  };

  // Handle delete student
  const handleDeleteStudent = (id) => {
    onDeleteStudent(id);
    setConfirmDeleteId(null);
    showToast("Talaba o'chirildi!", "success");
  };

  return (
    <div className="group-detail-container">
      {/* Detail Header */}
      <div className="detail-header-wrapper">
        <button className="btn btn-secondary btn-sm scale-active back-btn" onClick={onBack}>
          ← Guruhlarga qaytish
        </button>
        <div className="page-header detail-header">
          <div>
            <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar-circle group-folder-icon" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-segment)', boxShadow: 'none' }}>
                {renderGroupIcon(group.icon, 20)}
              </div>
              <span>{group.name}</span>
            </h2>
            <div className="page-subtitle-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p className="page-subtitle" style={{ margin: 0 }}>Talabalar ro'yxati va ularni baholash</p>
              {userRole === 'teacher' && (
                <div 
                  className="group-password-badge" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    alignSelf: 'flex-start'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span>🔑 Guruh paroli:</span>
                  <strong 
                    className="group-pwd-badge-text"
                    style={{ 
                      letterSpacing: showPassword ? 'normal' : '2px',
                      textTransform: 'lowercase'
                    }}
                  >
                    {showPassword ? (group.password || "yo'q") : '••••••'}
                  </strong>
                  <span style={{ fontSize: '1rem' }}>{showPassword ? '👁️' : '👁️‍🗨️'}</span>
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-primary scale-active" onClick={() => setShowAddStudentModal(true)}>
            <span>+ Yangi talaba</span>
          </button>
        </div>
      </div>

      {groupStudents.length > 0 ? (
        <div className="students-vertical-list">
          {groupStudents.map((student) => (
            <div key={student.id} className="glass-card student-list-item">
              <div className="student-item-header-row">
                <div 
                  className="student-item-main clickable-info" 
                  onClick={() => openScoreModal(student, '')}
                >
                  <div className="avatar-circle student-avatar" style={{ background: student.color, overflow: 'hidden' }}>
                    {renderAvatar(student.emoji)}
                  </div>
                  <div className="student-item-info">
                    <h3 className="student-name">{student.name}</h3>
                    <div className="student-score-badge">
                      <span className="score-num">{student.totalScore >= 0 ? `+${student.totalScore}` : student.totalScore}</span>
                      <span className="score-label">Likelar</span>
                    </div>
                  </div>
                </div>

                <div className="student-item-manage-btns">
                  {userRole === 'teacher' && (
                    <button 
                      className="btn btn-secondary scale-active btn-sm btn-icon-only transfer-btn" 
                      title="Guruhga ko'chirish"
                      onClick={() => {
                        setTransferringStudent(student);
                        setTargetGroupId(otherGroups.length > 0 ? otherGroups[0].id : '');
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary scale-active btn-sm btn-icon-only" 
                    title="Tahrirlash"
                    onClick={() => {
                      setEditingStudent(student);
                      setEditStudentName(student.name);
                      setEditStudentEmoji(student.emoji);
                      setEditStudentColor(student.color);
                      setEditStudentGroupId(student.groupId || group.id);
                      if (!student.emoji) {
                        setEditAvatarTab('gallery');
                      } else if (isGalleryImage(student.emoji)) {
                        setEditAvatarTab('gallery');
                      } else if (student.emoji.startsWith('data:image')) {
                        setEditAvatarTab('file');
                      } else {
                        setEditAvatarTab('svg');
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
                    title="O'chirish"
                    onClick={() => setConfirmDeleteId(student.id)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scoring Controls */}
              <div className="student-item-controls">
                <div className="student-actions">
                  <button 
                    className="btn btn-action btn-green scale-active"
                    onClick={() => openScoreModal(student, 85)}
                  >
                    +85
                  </button>
                  <button 
                    className="btn btn-action btn-green scale-active"
                    onClick={() => openScoreModal(student, 50)}
                  >
                    +50
                  </button>
                  <button 
                    className="btn btn-action btn-red scale-active"
                    onClick={() => openScoreModal(student, -30)}
                  >
                    -30
                  </button>
                  <button 
                    className="btn btn-action btn-custom scale-active"
                    onClick={() => setProfileStudent(student)}
                  >
                    <IconHistory size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-students-placeholder">
          <div className="placeholder-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <h3>Talabalar hali qo'shilmagan</h3>
          <p>Ushbu guruhga baholashni boshlash uchun dastlab talabalarni qo'shing.</p>
          <button className="btn btn-primary scale-active" onClick={() => setShowAddStudentModal(true)}>
            Talaba qo'shish
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content glass student-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setShowAddStudentModal(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title">Yangi talaba qo'shish</h3>
            <form onSubmit={handleAddStudentSubmit}>
              <div className="form-group">
                <label className="form-label">Talaba ismi va familiyasi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masalan: Asadbek Karimov"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* SVG Avatar Picker Tabs */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Talaba Avatari</label>
                  <div className="avatar-preview-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginRight: '6px' }}>Tanlandi:</span>
                    <div className="avatar-circle" style={{ width: 32, height: 32, background: selectedColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-sm)' }}>
                      {renderAvatar(selectedEmoji)}
                    </div>
                  </div>
                </div>
                <div className="avatar-tabs-header">
                  <button type="button" className={`avatar-tab-btn ${avatarTab === 'gallery' ? 'active' : ''}`} onClick={() => setAvatarTab('gallery')}>Rasmlar</button>
                  <button type="button" className={`avatar-tab-btn ${avatarTab === 'svg' ? 'active' : ''}`} onClick={() => setAvatarTab('svg')}>SVG Ikonkalar</button>
                  <button type="button" className={`avatar-tab-btn ${avatarTab === 'file' ? 'active' : ''}`} onClick={() => setAvatarTab('file')}>Rasm yuklash</button>
                </div>

                {avatarTab === 'gallery' && (
                  <div className="avatar-gallery-picker-grid">
                    {AVATAR_GALLERY_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className={`avatar-gallery-item-btn scale-active ${selectedEmoji === img.path ? 'selected' : ''}`}
                        onClick={() => setSelectedEmoji(img.path)}
                      >
                        <img src={img.path} alt={img.label} loading="lazy" decoding="async" className="gallery-thumb-img" />
                        {selectedEmoji === img.path && (
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

                {avatarTab === 'svg' && (
                  <div className="student-svg-picker-grid">
                    {STUDENT_AVATARS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`student-svg-btn scale-active ${selectedEmoji === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedEmoji(item.id)}
                      >
                        {item.svg(26)}
                      </button>
                    ))}
                  </div>
                )}

                {avatarTab === 'file' && (
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
                            if (compressed) setSelectedEmoji(compressed);
                          } catch (err) {
                            console.error('Failed to compress image:', err);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Color Picker */}
              <div className="form-group">
                <label className="form-label">Avatar Rangi</label>
                <div className="color-picker-grid">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-btn ${selectedColor === color.value ? 'selected' : ''}`}
                      style={{ background: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary scale-active" onClick={() => setShowAddStudentModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary scale-active">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Score and Comment Input Modal */}
      {scoringStudent && createPortal(
        <div className="modal-overlay" onClick={() => setScoringStudent(null)}>
          <div 
            className={`modal-content glass score-modal ${normalizedTags.length > 0 ? 'has-quick-tags' : 'no-quick-tags'}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setScoringStudent(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="score-modal-body">
              {/* Left Column: Student Info & Direct Input */}
              <div className="score-modal-left">
                <div className="score-modal-header">
                  <div className="avatar-circle" style={{ background: scoringStudent.color, width: 44, height: 44, fontSize: '1.25rem', overflow: 'hidden' }}>
                    {renderAvatar(scoringStudent.emoji)}
                  </div>
                  <div>
                    <h3 className="modal-title" style={{ margin: 0, fontSize: '1.08rem' }}>{scoringStudent.name}</h3>
                    <p className="score-modal-subtitle" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      Like berish: <span className={Number(scoreAmount) >= 0 ? 'text-positive' : 'text-negative'}>
                        {scoreAmount !== '' ? (Number(scoreAmount) >= 0 ? `+${scoreAmount}` : scoreAmount) : '—'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Like Amount Input */}
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Like miqdori (kiritish)</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                    value={scoreAmount}
                    onChange={(e) => setScoreAmount(e.target.value)}
                    placeholder="Masalan: 85, 50, -30"
                  />
                </div>

                {/* Custom Comment form */}
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Izoh (ixtiyoriy)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.88rem', height: '38px' }}
                    placeholder="Izoh yozing..."
                    value={customComment}
                    onChange={(e) => setCustomComment(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-secondary scale-active" 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap', justifyContent: 'center' }} 
                    onClick={() => setScoringStudent(null)}
                  >
                    Bekor qilish
                  </button>
                  <button 
                    className="btn btn-primary scale-active" 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap', justifyContent: 'center' }}
                    onClick={() => handleAwardPoints()}
                    disabled={scoreAmount === '' || isNaN(Number(scoreAmount))}
                  >
                    Likeni tasdiqlash
                  </button>
                </div>
              </div>

              {/* Right Column: Quick Comment Templates with badges */}
              {normalizedTags.length > 0 && (
                <div className="score-modal-right">
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Tezkor izoh shablonlari</label>
                  <div className="quick-tags-list">
                    {normalizedTags.map((tagObj, idx) => {
                      const isSelected = customComment === tagObj.text && String(scoreAmount) === String(tagObj.points);
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`quick-tag-card scale-active ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setScoreAmount(String(tagObj.points));
                            setCustomComment(tagObj.text);
                          }}
                        >
                          <span className="quick-tag-text">{tagObj.text}</span>
                          <span className={`quick-tag-badge ${tagObj.points >= 0 ? 'positive' : 'negative'}`}>
                            {tagObj.points >= 0 ? `+${tagObj.points}` : tagObj.points}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Student Confirmation Modal */}
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
            <h3 className="modal-title text-red">⚠️ Talabani o'chirish</h3>
            <p className="modal-warning-text">
              Ushbu talabani o'chirsangiz, uning barcha likelari va like berish tarixi butunlay o'chib ketadi!
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setConfirmDeleteId(null)}>
                Bekor qilish
              </button>
              <button 
                className="btn btn-danger scale-active" 
                onClick={() => handleDeleteStudent(confirmDeleteId)}
              >
                Ha, O'chirilsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Student Profile Modal */}
      {profileStudent && createPortal(
        <div className="modal-overlay" onClick={() => setProfileStudent(null)}>
          <div className="modal-content glass profile-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setProfileStudent(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* Profile Header */}
            <div className="profile-modal-header">
              <div className="avatar-circle profile-avatar" style={{ background: profileStudent.color, overflow: 'hidden' }}>
                {renderAvatar(profileStudent.emoji)}
              </div>
              <h3 className="profile-modal-name">{profileStudent.name}</h3>
              <p className="profile-modal-group">{group.name} Guruhi</p>
            </div>

            {/* Profile Stats Grid */}
            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'month')}</span>
                <span className="profile-stat-lbl">Bu Oy</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'lastMonth')}</span>
                <span className="profile-stat-lbl">O'tgan Oy</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'all')}</span>
                <span className="profile-stat-lbl">Kurs Davomida</span>
              </div>
            </div>

            {/* Timeline / History */}
            <div className="profile-timeline-section">
              <h4 className="profile-timeline-title">Baholash Tarixi</h4>
              <div className="profile-timeline-list">
                {studentTxs.length > 0 ? (
                  studentTxs.map((tx) => {
                    const date = new Date(tx.timestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={tx.id} className="profile-timeline-item">
                        <div className="profile-timeline-item-meta">
                          <span className="profile-timeline-time">{formattedDate}</span>
                          <span className="profile-timeline-amount font-bold">
                            {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                          </span>
                        </div>
                        <div className="profile-timeline-item-body">
                          <span className="profile-timeline-comment">
                            {tx.comment ? `"${tx.comment}"` : '—'}
                          </span>
                          <button
                            className="profile-timeline-item-delete scale-active"
                            onClick={() => {
                              onDeleteTransaction(tx.id);
                              showToast("Baholash harakati bekor qilindi!", "success");
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="profile-timeline-empty">Hozircha baholash tarixi mavjud emas.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setProfileStudent(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Edit Student Modal */}
      {editingStudent && createPortal(
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal-content glass student-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setEditingStudent(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title">Talaba Ma'lumotlarini Tahrirlash</h3>
            <form onSubmit={handleEditStudentSubmit}>
              <div className="form-group">
                <label className="form-label">Talaba ismi va familiyasi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masalan: Asadbek Karimov"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* SVG Avatar Picker Tabs */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Talaba Avatari</label>
                  <div className="avatar-preview-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginRight: '6px' }}>Tanlandi:</span>
                    <div className="avatar-circle" style={{ width: 32, height: 32, background: editStudentColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-sm)' }}>
                      {renderAvatar(editStudentEmoji)}
                    </div>
                  </div>
                </div>
                <div className="avatar-tabs-header">
                  <button type="button" className={`avatar-tab-btn ${editAvatarTab === 'gallery' ? 'active' : ''}`} onClick={() => setEditAvatarTab('gallery')}>Rasmlar</button>
                  <button type="button" className={`avatar-tab-btn ${editAvatarTab === 'svg' ? 'active' : ''}`} onClick={() => setEditAvatarTab('svg')}>SVG Ikonkalar</button>
                  <button type="button" className={`avatar-tab-btn ${editAvatarTab === 'file' ? 'active' : ''}`} onClick={() => setEditAvatarTab('file')}>Rasm yuklash</button>
                </div>

                {editAvatarTab === 'gallery' && (
                  <div className="avatar-gallery-picker-grid">
                    {AVATAR_GALLERY_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className={`avatar-gallery-item-btn scale-active ${editStudentEmoji === img.path ? 'selected' : ''}`}
                        onClick={() => setEditStudentEmoji(img.path)}
                      >
                        <img src={img.path} alt={img.label} loading="lazy" decoding="async" className="gallery-thumb-img" />
                        {editStudentEmoji === img.path && (
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

                {editAvatarTab === 'svg' && (
                  <div className="student-svg-picker-grid">
                    {STUDENT_AVATARS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`student-svg-btn scale-active ${editStudentEmoji === item.id ? 'selected' : ''}`}
                        onClick={() => setEditStudentEmoji(item.id)}
                      >
                        {item.svg(26)}
                      </button>
                    ))}
                  </div>
                )}

                {editAvatarTab === 'file' && (
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
                            if (compressed) setEditStudentEmoji(compressed);
                          } catch (err) {
                            console.error('Failed to compress image:', err);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Color Picker */}
              <div className="form-group">
                <label className="form-label">Avatar Rangi</label>
                <div className="color-picker-grid">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-btn ${editStudentColor === color.value ? 'selected' : ''}`}
                      style={{ background: color.value }}
                      onClick={() => setEditStudentColor(color.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Group selection */}
              {userRole === 'teacher' && (allGroups || []).length > 1 && (
                <div className="form-group">
                  <label className="form-label">Guruh</label>
                  <select
                    className="form-input"
                    value={editStudentGroupId}
                    onChange={(e) => setEditStudentGroupId(e.target.value)}
                    style={{ cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value={group.id}>{group.name} (Hozirgi guruh)</option>
                    {otherGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {editStudentGroupId !== group.id && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--primary-color, #007AFF)' }}>
                      ℹ️ Saqlash bosilgach, talaba ushbu guruhga ko'chiriladi.
                    </p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary scale-active" onClick={() => setEditingStudent(null)}>
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

      {/* Transfer Student Modal */}
      {transferringStudent && createPortal(
        <div className="modal-overlay" onClick={() => setTransferringStudent(null)}>
          <div className="modal-content glass transfer-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setTransferringStudent(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div 
                className="avatar-circle" 
                style={{ 
                  width: 48, 
                  height: 48, 
                  margin: '0 auto 10px', 
                  background: transferringStudent.color,
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {renderAvatar(transferringStudent.emoji)}
              </div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>Guruhga ko'chirish</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{transferringStudent.name}</strong>ni boshqa guruhga o'tkazish
              </p>
            </div>

            {otherGroups.length > 0 ? (
              <form onSubmit={handleTransferSubmit}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>Yangi guruhni tanlang:</label>
                  <div className="transfer-groups-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                    {otherGroups.map((g) => {
                      const isSelected = targetGroupId === g.id;
                      return (
                        <div
                          key={g.id}
                          onClick={() => setTargetGroupId(g.id)}
                          className="scale-active"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '2px solid var(--accent-color, #007AFF)' : '1px solid var(--border-color)',
                            background: isSelected ? 'var(--bg-segment, rgba(0,122,255,0.06))' : 'var(--bg-card, #FFFFFF)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: 'var(--radius-sm)', 
                              background: 'var(--bg-segment, #F5F5F7)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {renderGroupIcon(g.icon, 16)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {g.name}
                            </div>
                          </div>
                          {isSelected && (
                            <div style={{ color: 'var(--accent-color, #007AFF)', display: 'flex', alignItems: 'center' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="transfer-info-box" style={{ padding: '10px 12px', background: 'var(--bg-segment, #F5F5F7)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  💡 Talabaning to'plagan barcha ballari va tranzaksiyalari yangi guruh reytingiga to'liq o'tadi.
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary scale-active" onClick={() => setTransferringStudent(null)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-primary scale-active" disabled={!targetGroupId}>
                    Ko'chirish
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 20 }}>
                  Talabani ko'chirish uchun tizimda kamida 2 ta guruh bo'lishi kerak. Boshqa faol guruhlar topilmadi.
                </p>
                <button type="button" className="btn btn-secondary scale-active" onClick={() => setTransferringStudent(null)}>
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      <style>{`
        .group-detail-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-header-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .back-btn {
          align-self: flex-start;
          border-radius: var(--radius-md);
        }

        .detail-header {
          margin-bottom: 0;
        }

        .student-grid {
          margin-top: 16px;
        }

        .students-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .student-list-item {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition-fast);
          content-visibility: auto;
          contain-intrinsic-size: 0 72px;
        }

        @media (hover: hover) and (pointer: fine) {
          .student-list-item:hover {
            box-shadow: var(--shadow-md);
          }
        }

        .student-item-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .student-item-main {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
          cursor: pointer;
        }

        .student-avatar {
          width: 44px;
          height: 44px;
          font-size: 1.4rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .student-item-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .student-name {
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-score-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #F5F5F7;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.06);
          white-space: nowrap;
        }

        .score-num {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .score-label {
          font-size: 0.68rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .student-item-manage-btns {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
        }

        .student-item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .student-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-action {
          padding: 6px 10px;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          text-align: center;
          justify-content: center;
          min-width: 46px;
          height: 36px;
          font-variant-numeric: tabular-nums;
          border-radius: var(--radius-md);
          touch-action: manipulation;
          transition: all var(--transition-fast);
        }

        .btn-green {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .btn-green:hover {
          background: #D1FAE5;
        }

        .btn-red {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .btn-red:hover {
          background: #FEE2E2;
        }

        .btn-custom {
          background: #F5F5F7;
          color: var(--text-primary);
          border: 1px solid #E5E5EA;
        }

        .btn-custom:hover {
          background: #E5E5EA;
        }

        .student-item-manage-btns {
          display: flex;
          align-items: center;
          gap: 5px;
          padding-left: 6px;
        }

        .btn-icon-only {
          padding: 6px 8px;
          font-size: 0.85rem;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .student-list-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px 14px;
          }

          .student-item-header-row {
            width: 100%;
          }

          .student-item-controls {
            width: 100%;
          }

          .student-actions {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
          }

          .btn-action {
            width: 100%;
            min-width: 0;
            padding: 6px 2px;
            font-size: 0.78rem;
          }
        }

        /* Score Modal Styles */
        .score-modal {
          max-width: 440px;
          padding: 20px 22px;
        }

        .score-modal.has-quick-tags {
          max-width: 620px;
          padding: 22px 24px;
        }

        .score-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 769px) {
          .score-modal.has-quick-tags .score-modal-body {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 20px;
            align-items: start;
          }
        }

        .score-modal-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .score-modal-right {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-left: 1px solid var(--border-color);
          padding-left: 18px;
        }

        @media (max-width: 768px) {
          .score-modal {
            max-width: 100%;
            padding: 16px 16px !important;
          }

          .score-modal-right {
            border-left: none;
            padding-left: 0;
            border-top: 1px dashed var(--border-color);
            padding-top: 12px;
            margin-top: 4px;
          }
        }

        .score-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        .score-modal-subtitle {
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .quick-tags-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
          padding: 2px 2px 2px 0;
        }

        .quick-tag-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 0.84rem;
          font-weight: 600;
          text-align: left;
          color: var(--text-primary);
          white-space: nowrap;
          transition: all var(--transition-fast);
          touch-action: manipulation;
        }

        .quick-tag-card:hover {
          background: #F5F5F7;
        }

        .quick-tag-card.selected {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .quick-tag-badge {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }

        .quick-tag-badge.positive {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .quick-tag-badge.negative {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .quick-tag-card.selected .quick-tag-badge.positive {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .quick-tag-card.selected .quick-tag-badge.negative {
          background: #EF4444;
          color: #FFFFFF;
          border-color: #EF4444;
        }

        .empty-students-placeholder {
          padding: 48px 24px;
          text-align: center;
          max-width: 500px;
          margin: 20px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .student-modal {
          max-width: 480px;
        }

        /* Profile Modal styles */
        .profile-modal {
          max-width: 460px;
          padding: 24px;
        }

        .profile-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
        }

        .profile-avatar {
          width: 56px;
          height: 56px;
          font-size: 1.6rem;
          margin-bottom: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: var(--shadow-sm);
        }

        .profile-modal-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .profile-modal-group {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .profile-stat-box {
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: var(--radius-md);
          padding: 10px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #F5F5F7;
        }

        .profile-stat-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .profile-stat-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 2px;
          text-align: center;
          line-height: 1.2;
        }

        .profile-timeline-section {
          margin-bottom: 14px;
        }

        .profile-timeline-title {
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .profile-timeline-list {
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: #FFFFFF;
        }

        .profile-timeline-item {
          display: flex;
          flex-direction: column;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color-subtle);
        }

        .profile-timeline-item:last-child {
          border-bottom: none;
        }

        .profile-timeline-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.76rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text-secondary);
        }

        .profile-timeline-item-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .profile-timeline-comment {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .profile-timeline-item-delete {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px 4px;
          touch-action: manipulation;
          color: var(--text-tertiary);
          transition: color var(--transition-fast);
        }

        .profile-timeline-item-delete:hover {
          color: var(--apple-red);
        }

        .profile-timeline-empty {
          padding: 24px;
          text-align: center;
          font-size: 0.86rem;
          color: var(--text-tertiary);
        }

        .clickable-info:hover .student-name {
          color: var(--apple-blue);
        }

        .student-svg-picker-grid {
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          gap: 6px;
          max-height: 200px;
          overflow-y: auto;
          padding: 8px;
          background: #F5F5F7;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
          margin-bottom: 12px;
        }

        @media (max-width: 600px) {
          .student-svg-picker-grid {
            grid-template-columns: repeat(6, 1fr);
            max-height: 180px;
          }
        }

        .student-svg-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          padding: 4px;
          transition: all var(--transition-fast);
        }

        .student-svg-btn:hover {
          background: #F5F5F7;
        }

        .student-svg-btn.selected {
          background: #1D1D1F;
          border-color: #1D1D1F;
        }

        .group-pwd-badge-text {
          background: #F5F5F7;
          color: var(--text-primary);
          padding: 3px 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 0.85rem;
        }

        /* GroupDetail Dark Mode Overrides */
        [data-theme="dark"] .group-pwd-badge-text {
          background: #303134;
          color: #E8EAED;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-list-item {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-avatar {
          border-color: rgba(255, 255, 255, 0.12);
        }

        [data-theme="dark"] .student-score-badge {
          background: #303134;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-score-badge .score-num {
          color: #81C995;
        }

        [data-theme="dark"] .student-score-badge .score-label {
          color: #9AA0A6;
        }

        [data-theme="dark"] .btn-green {
          background: rgba(129, 201, 149, 0.15) !important;
          color: #81C995 !important;
          border: 1px solid rgba(129, 201, 149, 0.35) !important;
        }

        [data-theme="dark"] .btn-green:hover {
          background: rgba(129, 201, 149, 0.25) !important;
          border-color: rgba(129, 201, 149, 0.5) !important;
        }

        [data-theme="dark"] .btn-red {
          background: rgba(242, 139, 130, 0.15) !important;
          color: #F28B82 !important;
          border: 1px solid rgba(242, 139, 130, 0.35) !important;
        }

        [data-theme="dark"] .btn-red:hover {
          background: rgba(242, 139, 130, 0.25) !important;
          border-color: rgba(242, 139, 130, 0.5) !important;
        }

        [data-theme="dark"] .btn-custom {
          background: #303134 !important;
          color: #8AB4F8 !important;
          border: 1px solid #3C4043 !important;
        }

        [data-theme="dark"] .btn-custom:hover {
          background: #3C4043 !important;
          border-color: #5F6368 !important;
        }

        [data-theme="dark"] .student-svg-picker-grid {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-svg-btn {
          background: #303134;
          border-color: #3C4043;
        }

        [data-theme="dark"] .student-svg-btn:hover {
          background: #3C4043;
        }

        [data-theme="dark"] .student-svg-btn.selected {
          background: #8AB4F8;
          border-color: #8AB4F8;
          color: #202124;
        }

        [data-theme="dark"] .profile-stat-box {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .profile-timeline-list {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .profile-timeline-item {
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .profile-timeline-time {
          color: #9AA0A6;
        }

        [data-theme="dark"] .profile-timeline-amount {
          color: #81C995;
        }

        [data-theme="dark"] .profile-timeline-comment {
          color: #E8EAED;
        }

        [data-theme="dark"] .profile-timeline-item-delete {
          color: #9AA0A6;
        }

        [data-theme="dark"] .profile-timeline-item-delete:hover {
          color: #F28B82;
        }

        /* Score Modal Quick Tags Dark Mode */
        [data-theme="dark"] .quick-tag-card {
          background: #202124 !important;
          border-color: #3C4043 !important;
          color: #E8EAED !important;
        }

        [data-theme="dark"] .quick-tag-card:hover {
          background: #303134 !important;
          border-color: #5F6368 !important;
        }

        [data-theme="dark"] .quick-tag-card.selected {
          background: #8AB4F8 !important;
          color: #202124 !important;
          border-color: #8AB4F8 !important;
        }

        [data-theme="dark"] .quick-tag-text {
          color: inherit;
        }

        [data-theme="dark"] .quick-tag-badge.positive {
          background: rgba(129, 201, 149, 0.15) !important;
          color: #81C995 !important;
          border: 1px solid rgba(129, 201, 149, 0.35) !important;
        }

        [data-theme="dark"] .quick-tag-badge.negative {
          background: rgba(242, 139, 130, 0.15) !important;
          color: #F28B82 !important;
          border: 1px solid rgba(242, 139, 130, 0.35) !important;
        }

        [data-theme="dark"] .quick-tag-card.selected .quick-tag-badge.positive,
        [data-theme="dark"] .quick-tag-card.selected .quick-tag-badge.negative {
          background: rgba(0, 0, 0, 0.2) !important;
          color: #202124 !important;
          border-color: rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </div>
  );
};

export default GroupDetail;
