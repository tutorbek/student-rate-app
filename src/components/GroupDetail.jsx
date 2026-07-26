import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getStudentScore, normalizeQuickTags } from '../utils/db';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const EMOJI_OPTIONS = [
  '🦁', '🐯', '🐼', '🐨', '🦊', '🐰', '🐱', '🐶', '🦉', '🦜', '🦅', '🐧',
  '🦋', '🐝', '🐞', '🦄', '🦖', '🐉', '🍀', '🌸', '🧸', '🎈', '👑', '🧙‍♂️',
  '👾', '🚀', '🎨', '🎸', '🎮', '🛹', '🍓', '🍒', '🍉', '🍩', '🍦', '🍕'
];

const COLOR_OPTIONS = [
  { name: 'Burnt Sienna', value: '#E35336' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Sandy Brown', value: '#F4A460' },
  { name: 'Sienna', value: '#A0522D' },
];

const GroupDetail = ({ group, students, transactions, quickTags, onBack, onAddStudent, onUpdateStudent, onDeleteStudent, onAwardPoints, onDeleteTransaction, showToast, userRole }) => {
  const [profileStudent, setProfileStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmoji, setEditStudentEmoji] = useState('🚀');
  const [editStudentColor, setEditStudentColor] = useState(COLOR_OPTIONS[0].value);
  const [avatarTab, setAvatarTab] = useState('emoji');
  const [editAvatarTab, setEditAvatarTab] = useState('emoji');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddStudentModal(false);
        setConfirmDeleteId(null);
        setScoringStudent(null);
        setProfileStudent(null);
        setEditingStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
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
    setSelectedEmoji(EMOJI_OPTIONS[0]);
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
    onUpdateStudent(editingStudent.id, editStudentName, editStudentEmoji, editStudentColor);
    setEditingStudent(null);
    setEditStudentName('');
    setEditStudentEmoji('🚀');
    setEditStudentColor(COLOR_OPTIONS[0].value);
    showToast("Talaba ma'lumotlari yangilandi!", "success");
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
              <div className="avatar-circle" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', overflow: 'hidden', padding: 0, border: '1px solid #000', borderRadius: 0, background: '#ffffff', boxShadow: 'none' }}>
                {renderAvatar(group.icon)}
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
                  title={showPassword ? "Yashirish" : "Ko'rsatish"}
                >
                  <span>🔑 Guruh paroli:</span>
                  <strong 
                    style={{ 
                      background: '#E7FF56', 
                      color: '#000000', 
                      padding: '2px 8px', 
                      border: '1px solid #000000', 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem',
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
        <div className="grid-cards student-grid">
          {groupStudents.map((student) => (
            <div key={student.id} className="glass-card student-card">
              {/* Delete & Edit buttons top right */}
              <button 
                className="student-delete-btn" 
                onClick={() => setConfirmDeleteId(student.id)}
                title="Talabani o'chirish"
              >
                ✕
              </button>
              <button 
                className="student-edit-btn" 
                onClick={() => {
                  setEditingStudent(student);
                  setEditStudentName(student.name);
                  setEditStudentEmoji(student.emoji);
                  setEditStudentColor(student.color);
                  if (!student.emoji) {
                    setEditAvatarTab('emoji');
                  } else if (student.emoji.startsWith('data:image')) {
                    setEditAvatarTab('file');
                  } else if (student.emoji.startsWith('http') || student.emoji.includes('/') || student.emoji.includes('.')) {
                    setEditAvatarTab('url');
                  } else {
                    setEditAvatarTab('emoji');
                  }
                }}
                title="Talabani tahrirlash"
              >
                ✏️
              </button>

              <div className="student-card-info clickable-info" onClick={() => setProfileStudent(student)} title="Talaba profilini ochish">
                <div className="avatar-circle student-avatar" style={{ background: student.color, overflow: 'hidden' }}>
                  {renderAvatar(student.emoji)}
                </div>
                <h3 className="student-name">{student.name}</h3>
                <div className="student-score-badge">
                  <span className="score-num">{student.totalScore >= 0 ? `+${student.totalScore}` : student.totalScore}</span>
                  <span className="score-label">Likelar</span>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="student-actions">
                <button 
                  className="btn btn-action btn-green scale-active"
                  onClick={() => openScoreModal(student, 85)}
                  title="+85 (Uy vazifasi bajarildi)"
                >
                  +85
                </button>
                <button 
                  className="btn btn-action btn-green scale-active"
                  onClick={() => openScoreModal(student, 50)}
                  title="+50 (Mustaqil izlanish)"
                >
                  +50
                </button>
                <button 
                  className="btn btn-action btn-red scale-active"
                  onClick={() => openScoreModal(student, -10)}
                  title="-10 (Darsga kechikdi)"
                >
                  -10
                </button>
                <button 
                  className="btn btn-action btn-red scale-active"
                  onClick={() => openScoreModal(student, -30)}
                  title="-30 (Uy vazifasi bajarilmadi)"
                >
                  -30
                </button>
                <button 
                  className="btn btn-action btn-custom scale-active"
                  onClick={() => openScoreModal(student, '')}
                  title="Boshqa izoh / ball"
                >
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-students-placeholder">
          <div className="placeholder-icon">👨‍🎓</div>
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
              title="Yopish"
            >
              ✕
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

              {/* Emoji Picker Tabs */}
              <div className="form-group">
                <label className="form-label">Avatar Turi</label>
                <div className="avatar-tabs-header">
                  <button type="button" className={`avatar-tab-btn ${avatarTab === 'emoji' ? 'active' : ''}`} onClick={() => setAvatarTab('emoji')}>Emoji</button>
                  <button type="button" className={`avatar-tab-btn ${avatarTab === 'url' ? 'active' : ''}`} onClick={() => setAvatarTab('url')}>Internet URL</button>
                  <button type="button" className={`avatar-tab-btn ${avatarTab === 'file' ? 'active' : ''}`} onClick={() => setAvatarTab('file')}>Rasm yuklash</button>
                </div>

                {avatarTab === 'emoji' && (
                  <div className="emoji-picker-grid">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                        onClick={() => setSelectedEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {avatarTab === 'url' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rasm URL manzili yoki maxsus emoji</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masalan: 🤩 yoki https://example.com/rasm.png"
                      value={EMOJI_OPTIONS.includes(selectedEmoji) ? '' : selectedEmoji}
                      onChange={(e) => setSelectedEmoji(e.target.value || EMOJI_OPTIONS[0])}
                    />
                  </div>
                )}

                {avatarTab === 'file' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Kompyuterdan rasm yuklash</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSelectedEmoji(reader.result);
                          };
                          reader.readAsDataURL(file);
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
                      title={color.name}
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
              title="Yopish"
            >
              ✕
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
                    placeholder="Masalan: 85, 50, -10"
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
              title="Yopish"
            >
              ✕
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
              title="Yopish"
            >
              ✕
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
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'week')}</span>
                <span className="profile-stat-lbl">Yangi hafta</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'lastWeek')}</span>
                <span className="profile-stat-lbl">O'tgan hafta</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'month')}</span>
                <span className="profile-stat-lbl">Oylik</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'lastMonth')}</span>
                <span className="profile-stat-lbl">O'tgan Oy</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(transactions, profileStudent.id, 'all')}</span>
                <span className="profile-stat-lbl">Kurs</span>
              </div>
            </div>

            {/* Timeline / History */}
            <div className="profile-timeline-section">
              <h4 className="profile-timeline-title">📜 Baholash Tarixi</h4>
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
                            title="Bahoni o'chirish"
                          >
                            🗑️
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
              title="Yopish"
            >
              ✕
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

              {/* Emoji Picker Tabs */}
              <div className="form-group">
                <label className="form-label">Avatar Turi</label>
                <div className="avatar-tabs-header">
                  <button type="button" className={`avatar-tab-btn ${editAvatarTab === 'emoji' ? 'active' : ''}`} onClick={() => setEditAvatarTab('emoji')}>Emoji</button>
                  <button type="button" className={`avatar-tab-btn ${editAvatarTab === 'url' ? 'active' : ''}`} onClick={() => setEditAvatarTab('url')}>Internet URL</button>
                  <button type="button" className={`avatar-tab-btn ${editAvatarTab === 'file' ? 'active' : ''}`} onClick={() => setEditAvatarTab('file')}>Rasm yuklash</button>
                </div>

                {editAvatarTab === 'emoji' && (
                  <div className="emoji-picker-grid">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-btn ${editStudentEmoji === emoji ? 'selected' : ''}`}
                        onClick={() => setEditStudentEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {editAvatarTab === 'url' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Rasm URL manzili yoki maxsus emoji</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masalan: 🤩 yoki https://example.com/rasm.png"
                      value={EMOJI_OPTIONS.includes(editStudentEmoji) ? '' : editStudentEmoji}
                      onChange={(e) => setEditStudentEmoji(e.target.value || EMOJI_OPTIONS[0])}
                    />
                  </div>
                )}

                {editAvatarTab === 'file' && (
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Kompyuterdan rasm yuklash</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditStudentEmoji(reader.result);
                          };
                          reader.readAsDataURL(file);
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
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

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
      <style>{`
        .group-detail-container {
          animation: fade-in 0.4s ease-out;
        }

        .detail-header-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .back-btn {
          align-self: flex-start;
        }

        .detail-header {
          margin-bottom: 0;
        }

        .student-grid {
          margin-top: 24px;
        }

        .student-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .student-delete-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--text-tertiary);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          transition: all var(--transition-fast);
        }

        .student-delete-btn:hover {
          background: #E7FF56;
          color: #000000;
        }

        .student-edit-btn {
          position: absolute;
          top: 12px;
          right: 44px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--text-tertiary);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          transition: all var(--transition-fast);
        }

        .student-edit-btn:hover {
          background: #E7FF56;
          color: #000000;
        }

        .student-card-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .student-avatar {
          width: 64px;
          height: 64px;
          font-size: 2rem;
        }

        .student-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: #000000;
        }

        .student-score-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          padding: 6px 14px;
          border-radius: 0;
          border: 1px solid #000000;
        }

        .score-num {
          font-size: 1.05rem;
          font-weight: 800;
          color: #000000;
        }

        .score-label {
          font-size: 0.75rem;
          color: #000000;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .student-actions {
          display: flex;
          width: 100%;
          gap: 6px;
        }

        .btn-action {
          flex: 1;
          padding: 8px 4px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
          text-align: center;
          justify-content: center;
        }

        .btn-green {
          background: #000000;
          color: #ffffff;
          border: 1px solid #000000;
        }

        .btn-green:hover {
          background: #E7FF56;
          color: #000000;
        }

        .btn-red {
          background: #ffffff;
          color: #000000;
          border: 1px dashed #000000;
        }

        .btn-red:hover {
          background: #E7FF56;
          color: #000000;
          border-style: solid;
        }

        .btn-custom {
          background: #ffffff;
          color: #000000;
          border: 1px solid #000000;
        }

        .btn-custom:hover {
          background: #E7FF56;
          color: #000000;
        }

        /* Score Modal Styles */
        .score-modal {
          max-width: 440px;
          padding: 16px 20px;
        }

        .score-modal.has-quick-tags {
          max-width: 660px;
          padding: 20px 24px;
        }

        .score-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 769px) {
          .score-modal.has-quick-tags .score-modal-body {
            display: grid;
            grid-template-columns: 1fr 1.25fr;
            gap: 24px;
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
          gap: 8px;
          border-left: 2px solid #000000;
          padding-left: 20px;
        }

        @media (max-width: 768px) {
          .score-modal {
            width: 94% !important;
            max-width: 380px;
            padding: 14px 16px !important;
          }

          .score-modal-right {
            border-left: none;
            padding-left: 0;
            border-top: 1.5px dashed #000000;
            padding-top: 12px;
            margin-top: 4px;
          }
        }

        .score-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
          border-bottom: 2px solid #000000;
          padding-bottom: 10px;
        }

        .score-modal-subtitle {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .quick-tags-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 290px;
          overflow-y: auto;
          padding: 2px 4px 2px 0;
        }

        .quick-tag-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1.5px solid #000000;
          box-shadow: 2px 2px 0px #000000;
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 0.84rem;
          font-weight: 700;
          text-align: left;
          color: #000000;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .quick-tag-card:hover {
          background: var(--accent-neon);
        }

        .quick-tag-card.selected {
          background: #000000;
          color: #ffffff;
        }

        .quick-tag-badge {
          font-size: 0.78rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 2px;
          border: 1px solid #000000;
          white-space: nowrap;
        }

        .quick-tag-badge.positive {
          background: #e2ffd0;
          color: #000000;
        }

        .quick-tag-badge.negative {
          background: #ffd0d0;
          color: #000000;
        }

        .quick-tag-card.selected .quick-tag-badge.positive {
          background: #E7FF56;
          color: #000000;
        }

        .quick-tag-card.selected .quick-tag-badge.negative {
          background: #ff5252;
          color: #ffffff;
          border-color: #ffffff;
        }

        .empty-students-placeholder {
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .student-modal {
          max-width: 480px;
        }

        /* Profile Modal styles */
        .profile-modal {
          max-width: 500px;
        }

        .profile-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          border-bottom: 2px solid #000000;
          padding-bottom: 20px;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .profile-modal-name {
          font-size: 1.4rem;
          font-weight: 800;
          color: #000000;
          text-transform: uppercase;
        }

        .profile-modal-group {
          font-size: 0.85rem;
          font-weight: 700;
          color: #000000;
          opacity: 0.6;
          text-transform: uppercase;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        @media (max-width: 600px) {
          .profile-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .profile-stat-box {
          border: 1px solid #000000;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #ffffff;
        }

        .profile-stat-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: #000000;
        }

        .profile-stat-lbl {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #000000;
          opacity: 0.6;
          margin-top: 4px;
        }

        .profile-timeline-section {
          margin-bottom: 24px;
        }

        .profile-timeline-title {
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 12px;
          color: #000000;
        }

        .profile-timeline-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #000000;
          background: #ffffff;
        }

        .profile-timeline-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          border-bottom: 1px solid #000000;
        }

        .profile-timeline-item:last-child {
          border-bottom: none;
        }

        .profile-timeline-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: #000000;
          opacity: 0.6;
        }

        .profile-timeline-item-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .profile-timeline-comment {
          font-size: 0.9rem;
          font-style: italic;
          color: #000000;
          font-weight: 600;
        }

        .profile-timeline-item-delete {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: transform var(--transition-fast);
          padding: 2px 6px;
        }

        .profile-timeline-item-delete:hover {
          transform: scale(1.2);
          background: #E7FF56;
        }

        .profile-timeline-empty {
          padding: 30px;
          text-align: center;
          font-size: 0.9rem;
          color: #000000;
          opacity: 0.5;
        }

        .clickable-info {
          cursor: pointer;
        }

        .clickable-info:hover .student-name {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default GroupDetail;
