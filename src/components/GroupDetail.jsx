import React, { useState, useMemo, useEffect } from 'react';
import { getStudentScore } from '../utils/db';

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

const GroupDetail = ({ group, students, transactions, quickTags, onBack, onAddStudent, onUpdateStudent, onDeleteStudent, onAwardPoints, onDeleteTransaction, showToast }) => {
  const [profileStudent, setProfileStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmoji, setEditStudentEmoji] = useState('🚀');
  const [editStudentColor, setEditStudentColor] = useState(COLOR_OPTIONS[0].value);

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

  // Score modal states
  const [scoringStudent, setScoringStudent] = useState(null);
  const [scoreAmount, setScoreAmount] = useState(1);
  const [customComment, setCustomComment] = useState('');

  // Filter students in this group
  const groupStudents = useMemo(() => {
    return students
      .filter((s) => s.groupId === group.id)
      .map((s) => ({
        ...s,
        totalScore: getStudentScore(s.id, 'all'),
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

  // Open points/score modal
  const openScoreModal = (student, amount) => {
    setScoringStudent(student);
    setScoreAmount(amount);
    setCustomComment('');
  };

  // Handle points submission
  const handleAwardPoints = (commentText) => {
    const comment = commentText || customComment || (scoreAmount >= 0 ? "Ball berildi" : "Ball ayrildi");
    onAwardPoints(scoringStudent.id, scoreAmount, comment);
    setScoringStudent(null);
    setCustomComment('');
    showToast(`${scoringStudent.name}ga ${scoreAmount >= 0 ? `+${scoreAmount}` : scoreAmount} ball berildi!`, "success");
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
            <p className="page-subtitle">Talabalar ro'yxati va ularni baholash</p>
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
                  onClick={() => openScoreModal(student, 1)}
                >
                  +1
                </button>
                <button 
                  className="btn btn-action btn-green scale-active"
                  onClick={() => openScoreModal(student, 5)}
                >
                  +5
                </button>
                <button 
                  className="btn btn-action btn-red scale-active"
                  onClick={() => openScoreModal(student, -1)}
                >
                  -1
                </button>
                <button 
                  className="btn btn-action btn-custom scale-active"
                  onClick={() => openScoreModal(student, 0)}
                  title="Boshqa ball"
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
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content glass student-modal" onClick={(e) => e.stopPropagation()}>
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

              {/* Emoji Picker */}
              <div className="form-group">
                <label className="form-label">Avatar Emoji</label>
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
                <div style={{ marginTop: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Yoki Custom Emoji / Rasm URL (Internetdan)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: 🤩 yoki https://example.com/rasm.png"
                    value={EMOJI_OPTIONS.includes(selectedEmoji) ? '' : selectedEmoji}
                    onChange={(e) => setSelectedEmoji(e.target.value || EMOJI_OPTIONS[0])}
                  />
                </div>
                <div style={{ marginTop: '12px' }}>
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
                          setSelectedEmoji(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
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
        </div>
      )}

      {/* Score and Comment Input Modal */}
      {scoringStudent && (
        <div className="modal-overlay" onClick={() => setScoringStudent(null)}>
          <div className="modal-content glass score-modal" onClick={(e) => e.stopPropagation()}>
            <div className="score-modal-header">
              <div className="avatar-circle" style={{ background: scoringStudent.color, width: 40, height: 40, fontSize: '1.2rem', overflow: 'hidden' }}>
                {renderAvatar(scoringStudent.emoji)}
              </div>
              <div>
                <h3 className="modal-title" style={{ margin: 0 }}>{scoringStudent.name}</h3>
                <p className="score-modal-subtitle">
                  Ball berish: <span className={scoreAmount >= 0 ? 'text-positive' : 'text-negative'}>
                    {scoreAmount >= 0 ? `+${scoreAmount}` : scoreAmount} ball
                  </span>
                </p>
              </div>
            </div>

            {/* Score Amount Input */}
            <div className="form-group">
              <label className="form-label">Ball miqdori</label>
              <input
                type="number"
                className="form-input"
                value={scoreAmount}
                onChange={(e) => setScoreAmount(Number(e.target.value))}
                placeholder="Masalan: 3, 10, -2"
              />
            </div>

            {/* Quick tags grid */}
            <div className="form-group">
              <label className="form-label">Tezkor izoh shablonlari</label>
              <div className="quick-tags-picker">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="quick-tag-bubble scale-active"
                    onClick={() => handleAwardPoints(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Comment form */}
            <div className="form-group">
              <label className="form-label">Yoki boshqa izoh yozing (ixtiyoriy)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Izoh yozing..."
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setScoringStudent(null)}>
                Bekor qilish
              </button>
              <button className="btn btn-primary scale-active" onClick={() => handleAwardPoints()}>
                Ballni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title text-red">⚠️ Talabani o'chirish</h3>
            <p className="modal-warning-text">
              Ushbu talabani o'chirsangiz, uning barcha ballari va ball berish tarixi butunlay o'chib ketadi!
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
        </div>
      )}

      {/* Student Profile Modal */}
      {profileStudent && (
        <div className="modal-overlay" onClick={() => setProfileStudent(null)}>
          <div className="modal-content glass profile-modal" onClick={(e) => e.stopPropagation()}>
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
                <span className="profile-stat-val">{getStudentScore(profileStudent.id, 'week')}</span>
                <span className="profile-stat-lbl">Haftalik</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(profileStudent.id, 'month')}</span>
                <span className="profile-stat-lbl">Oylik</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{getStudentScore(profileStudent.id, 'all')}</span>
                <span className="profile-stat-lbl">Kurs Yakuni</span>
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
        </div>
      )}
      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal-content glass student-modal" onClick={(e) => e.stopPropagation()}>
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

              {/* Emoji Picker */}
              <div className="form-group">
                <label className="form-label">Avatar Emoji</label>
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
                <div style={{ marginTop: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.8 }}>Yoki Custom Emoji / Rasm URL (Internetdan)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: 🤩 yoki https://example.com/rasm.png"
                    value={EMOJI_OPTIONS.includes(editStudentEmoji) ? '' : editStudentEmoji}
                    onChange={(e) => setEditStudentEmoji(e.target.value || EMOJI_OPTIONS[0])}
                  />
                </div>
                <div style={{ marginTop: '12px' }}>
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
                          setEditStudentEmoji(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
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
        </div>
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
          gap: 8px;
        }

        .btn-action {
          flex: 1;
          padding: 10px;
          font-size: 0.9rem;
          font-weight: 700;
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

        /* Avatar Picker styles */
        .emoji-picker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
          gap: 8px;
          max-height: 120px;
          overflow-y: auto;
          padding: 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .emoji-btn {
          font-size: 1.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          padding: 6px;
          transition: all var(--transition-fast);
        }

        .emoji-btn:hover {
          background: #E7FF56;
          transform: scale(1.15);
        }

        .emoji-btn.selected {
          background: var(--apple-blue);
          transform: scale(1.1);
        }

        .color-picker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
          gap: 8px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .color-btn {
          aspect-ratio: 1;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .color-btn:hover {
          transform: scale(1.15);
          box-shadow: 0 0 8px #E7FF56;
        }

        .color-btn.selected {
          border-color: #fff;
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }

        /* Score Modal Styles */
        .score-modal {
          max-width: 450px;
        }

        .score-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 16px;
        }

        .score-modal-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .quick-tags-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-height: 150px;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.03);
          padding: 10px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .quick-tag-bubble {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .quick-tag-bubble:hover {
          background: #E7FF56;
          border-color: #000000;
          color: #000000;
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
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
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
