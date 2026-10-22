import React, { useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { compressUploadedImage } from '../utils/avatarGallery';
import { getGroupCategory, getStartOfMonth, UZ_MONTHS } from '../utils/db';
import { renderAvatar } from '../utils/studentAvatars';
import { useModalDismiss } from '../hooks/useModalDismiss';
import './TeacherRewardsView.css';

const triggerHaptic = (style = 'light') => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } catch {
      // Ignore if haptic not supported
    }
  }
};

const TeacherRewardsView = forwardRef(function TeacherRewardsView({
  rewards = { kids: null, teens: null },
  groups = [],
  students = [],
  transactions = [],
  onSaveGift,
  onDeleteGift,
  showToast,
  hideHeader = false,
}, ref) {
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [targetCategory, setTargetCategory] = useState('kids'); // 'kids' | 'teens'
  const [formTitle, setFormTitle] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('both'); // 'both' | 'kids' | 'teens'

  const fileInputRef = useRef(null);

  useModalDismiss(Boolean(modalMode || deleteCategoryConfirm), () => {
    setModalMode(null);
    setDeleteCategoryConfirm(null);
  });

  // Accurate month and countdown in Uzbek
  const { currentMonthName, daysRemaining, startOfMonth } = useMemo(() => {
    const today = new Date();
    const start = getStartOfMonth();
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remaining = Math.max(0, end.getDate() - today.getDate());
    const monthName = UZ_MONTHS[today.getMonth()];
    return {
      startOfMonth: start,
      daysRemaining: remaining,
      currentMonthName: monthName,
    };
  }, []);

  // Groups map
  const groupsMap = useMemo(() => {
    const map = {};
    (groups || []).forEach((g) => {
      map[g.id] = g;
    });
    return map;
  }, [groups]);

  // Calculate monthly scores per student (transactions from this month)
  const studentMonthlyScores = useMemo(() => {
    const scores = {};
    (students || []).forEach((s) => {
      scores[s.id] = 0;
    });
    (transactions || []).forEach((t) => {
      if (!t.studentId) return;
      const txTime = new Date(t.timestamp);
      if (txTime >= startOfMonth) {
        const pts = Number(t.points) || Number(t.amount) || 0;
        scores[t.studentId] = (scores[t.studentId] || 0) + pts;
      }
    });
    return scores;
  }, [students, transactions, startOfMonth]);

  // Rank students for Kids and Teens separately
  const { kidsRanking, teensRanking } = useMemo(() => {
    const kids = [];
    const teens = [];

    (students || []).forEach((s) => {
      if (s.deleted) return;
      const group = groupsMap[s.groupId];
      const cat = getGroupCategory(group);
      const monthlyScore = studentMonthlyScores[s.id] || 0;
      const item = {
        ...s,
        groupName: group?.name || 'Guruh',
        category: cat,
        monthlyScore,
      };
      if (cat === 'kids') {
        kids.push(item);
      } else {
        teens.push(item);
      }
    });

    kids.sort((a, b) => b.monthlyScore - a.monthlyScore);
    teens.sort((a, b) => b.monthlyScore - a.monthlyScore);

    return { kidsRanking: kids, teensRanking: teens };
  }, [students, groupsMap, studentMonthlyScores]);

  const kidsLeader = kidsRanking[0] && kidsRanking[0].monthlyScore > 0 ? kidsRanking[0] : (kidsRanking[0] || null);
  const teensLeader = teensRanking[0] && teensRanking[0].monthlyScore > 0 ? teensRanking[0] : (teensRanking[0] || null);

  // Open modal for Adding a new gift (Single header button)
  const handleOpenAddModal = (initialCategory = 'kids') => {
    triggerHaptic('light');
    const cat = rewards?.[initialCategory] ? (rewards?.teens ? initialCategory : 'teens') : initialCategory;
    setTargetCategory(cat);
    setModalMode('add');
    const existing = rewards?.[cat];
    if (existing) {
      setFormTitle(existing.title || '');
      setFormImage(existing.image || '');
      setFormDesc(existing.description || '');
    } else {
      setFormTitle('');
      setFormImage('');
      setFormDesc('');
    }
  };

  useImperativeHandle(ref, () => ({
    openAddModal: (cat = 'kids') => handleOpenAddModal(cat),
  }));

  // Open modal for Editing an existing gift
  const handleOpenEditModal = (category) => {
    triggerHaptic('light');
    setTargetCategory(category);
    setModalMode('edit');
    const existing = rewards?.[category] || {};
    setFormTitle(existing.title || '');
    setFormImage(existing.image || '');
    setFormDesc(existing.description || '');
  };

  // Switch category inside modal
  const handleSwitchModalCategory = (cat) => {
    triggerHaptic('light');
    setTargetCategory(cat);
    const existing = rewards?.[cat];
    if (existing) {
      setFormTitle(existing.title || '');
      setFormImage(existing.image || '');
      setFormDesc(existing.description || '');
    } else {
      setFormTitle('');
      setFormImage('');
      setFormDesc('');
    }
  };

  // Handle image upload from local device
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const compressedUrl = await compressUploadedImage(file, 360, 0.82);
      if (compressedUrl) {
        setFormImage(compressedUrl);
        if (showToast) showToast("Rasm muvaffaqiyatli yuklandi!", 'success');
      }
    } catch (err) {
      console.error('Image compression failed:', err);
      if (showToast) showToast("Rasmni yuklashda xatolik yuz berdi.", 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save gift
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      if (showToast) showToast("Iltimos, sovg'a nomini kiriting!", 'warning');
      return;
    }

    triggerHaptic('medium');
    const giftPayload = {
      id: rewards?.[targetCategory]?.id || `gift_${targetCategory}_${Date.now()}`,
      title: formTitle.trim(),
      image: formImage.trim() || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80",
      description: formDesc.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (onSaveGift) {
      onSaveGift(targetCategory, giftPayload);
    }
    setModalMode(null);
    if (showToast) {
      showToast(`${targetCategory === 'kids' ? 'Kids' : 'Teens'} sovg'asi muvaffaqiyatli saqlandi!`, 'success');
    }
  };

  // Confirm delete gift
  const handleConfirmDelete = () => {
    if (!deleteCategoryConfirm) return;
    triggerHaptic('heavy');
    if (onDeleteGift) {
      onDeleteGift(deleteCategoryConfirm);
    }
    const catName = deleteCategoryConfirm === 'kids' ? 'Kids' : 'Teens';
    setDeleteCategoryConfirm(null);
    if (showToast) {
      showToast(`${catName} sovg'asi o'chirildi.`, 'info');
    }
  };

  return (
    <div className="teacher-rewards-container animate-fadeIn">
      {/* 1. Page Header (Only when standalone) */}
      {!hideHeader && (
        <div className="page-header flex-col-mobile">
          <div>
            <h2 className="page-title">Oylik Sovg'alar Musobaqasi</h2>
          </div>
        </div>
      )}

      {/* Standalone Action Subbar below header (Countdown & Add Gift Button) */}
      <div className="rewards-actions-subbar">
        <div className="header-countdown-badge">
          <span>{currentMonthName} oyi:</span>
          <strong>{daysRemaining} kun qoldi</strong>
        </div>

        <button
          type="button"
          className="btn btn-primary scale-active"
          onClick={() => handleOpenAddModal('kids')}
        >
          <span>+ Sovg'a Belgilash</span>
        </button>
      </div>

      {/* 2. Two Main Category Gift Cards (Kids & Teens) - Single clean glass-card each */}
      <div className="rewards-grid-row">
        {/* KIDS REWARD CARD */}
        <div className="glass-card reward-category-card">
          <div className="reward-category-card-header">
            <span className="category-tag-badge kids-tag">Kids Toifasi</span>
            <span className="reward-target-badge">1-O'rin Sovg'asi</span>
          </div>

          {rewards?.kids ? (
            <div className="reward-card-content">
              <img
                src={rewards.kids.image}
                alt={rewards.kids.title}
                className="reward-card-img"
                loading="lazy"
              />

              <div className="reward-card-body">
                <h3 className="reward-card-title">{rewards.kids.title}</h3>
                {rewards.kids.description ? (
                  <p className="reward-card-desc">{rewards.kids.description}</p>
                ) : null}

                {/* Flat leader line - NO nested card box */}
                <div className="reward-leader-line">
                  {kidsLeader ? (
                    <div className="reward-leader-avatar">
                      {renderAvatar(kidsLeader.emoji, 26)}
                    </div>
                  ) : null}
                  <div className="reward-leader-text">
                    <span className="reward-leader-prefix">Hozirgi 1-o'rin da'vogari:</span>{' '}
                    <strong className="reward-leader-name">
                      {kidsLeader && kidsLeader.monthlyScore > 0
                        ? `${kidsLeader.name} (${kidsLeader.monthlyScore} Like)`
                        : "Bu oyda hali ball berilmagan"}
                    </strong>
                  </div>
                </div>

                <div className="reward-card-actions-row">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm scale-active"
                    onClick={() => handleOpenEditModal('kids')}
                  >
                    <span>Tahrirlash</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm scale-active"
                    onClick={() => {
                      triggerHaptic('light');
                      setDeleteCategoryConfirm('kids');
                    }}
                  >
                    <span>O'chirish</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="reward-empty-flat-state">
              <h4 className="empty-title">Kids uchun sovg'a belgilanmagan</h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm scale-active"
                onClick={() => handleOpenAddModal('kids')}
              >
                <span>+ Sovg'a kiritish</span>
              </button>
            </div>
          )}
        </div>

        {/* TEENS REWARD CARD */}
        <div className="glass-card reward-category-card">
          <div className="reward-category-card-header">
            <span className="category-tag-badge teens-tag">Teens Toifasi</span>
            <span className="reward-target-badge">1-O'rin Sovg'asi</span>
          </div>

          {rewards?.teens ? (
            <div className="reward-card-content">
              <img
                src={rewards.teens.image}
                alt={rewards.teens.title}
                className="reward-card-img"
                loading="lazy"
              />

              <div className="reward-card-body">
                <h3 className="reward-card-title">{rewards.teens.title}</h3>
                {rewards.teens.description ? (
                  <p className="reward-card-desc">{rewards.teens.description}</p>
                ) : null}

                {/* Flat leader line - NO nested card box */}
                <div className="reward-leader-line">
                  {teensLeader ? (
                    <div className="reward-leader-avatar">
                      {renderAvatar(teensLeader.emoji, 26)}
                    </div>
                  ) : null}
                  <div className="reward-leader-text">
                    <span className="reward-leader-prefix">Hozirgi 1-o'rin da'vogari:</span>{' '}
                    <strong className="reward-leader-name">
                      {teensLeader && teensLeader.monthlyScore > 0
                        ? `${teensLeader.name} (${teensLeader.monthlyScore} Like)`
                        : "Bu oyda hali ball berilmagan"}
                    </strong>
                  </div>
                </div>

                <div className="reward-card-actions-row">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm scale-active"
                    onClick={() => handleOpenEditModal('teens')}
                  >
                    <span>Tahrirlash</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm scale-active"
                    onClick={() => {
                      triggerHaptic('light');
                      setDeleteCategoryConfirm('teens');
                    }}
                  >
                    <span>O'chirish</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="reward-empty-flat-state">
              <h4 className="empty-title">Teens uchun sovg'a belgilanmagan</h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm scale-active"
                onClick={() => handleOpenAddModal('teens')}
              >
                <span>+ Sovg'a kiritish</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Monthly Leaders Section - Exactly ONE glass-card, direct elements inside */}
      <div className="glass-card rewards-standings-card">
        <div className="standings-card-header">
          <div className="standings-header-text">
            <h3 className="standings-card-title">Top 5 Da'vogarlari</h3>
          </div>

          <div className="tab-control-brutalist">
            <button
              type="button"
              className={`tab-btn-brutalist ${activeLeaderboardTab === 'both' ? 'active' : ''}`}
              onClick={() => setActiveLeaderboardTab('both')}
            >
              Barchasi
            </button>
            <button
              type="button"
              className={`tab-btn-brutalist ${activeLeaderboardTab === 'kids' ? 'active' : ''}`}
              onClick={() => setActiveLeaderboardTab('kids')}
            >
              Kids
            </button>
            <button
              type="button"
              className={`tab-btn-brutalist ${activeLeaderboardTab === 'teens' ? 'active' : ''}`}
              onClick={() => setActiveLeaderboardTab('teens')}
            >
              Teens
            </button>
          </div>
        </div>

        {/* Flat Columns Grid - Top 5 Standings directly */}
        <div className={`standings-columns-grid ${activeLeaderboardTab === 'both' ? 'split' : 'single'}`}>
          {/* KIDS COLUMN */}
          {(activeLeaderboardTab === 'both' || activeLeaderboardTab === 'kids') && (
            <div className="standings-category-col">
              <div className="standings-col-heading">
                <span className="col-heading-title kids-color">Kids</span>
              </div>

              {kidsRanking.length > 0 && kidsRanking[0].monthlyScore > 0 ? (
                <div className="standings-table">
                  {kidsRanking.slice(0, 5).map((student, idx) => (
                    <div key={student.id} className="standings-table-row">
                      <span className={`rank-badge ${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : ''}`}>
                        {idx + 1}
                      </span>
                      <div className="standings-row-avatar">
                        {renderAvatar(student.emoji, 28)}
                      </div>
                      <div className="standings-row-info">
                        <span className="standings-row-name">{student.name}</span>
                        <span className="standings-row-group">{student.groupName}</span>
                      </div>
                      <span className="standings-row-points">
                        {student.monthlyScore} Like
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="standings-empty-state">
                  <p>Kids guruhlarida bu oyda hali Like berilmagan.</p>
                </div>
              )}
            </div>
          )}

          {/* TEENS COLUMN */}
          {(activeLeaderboardTab === 'both' || activeLeaderboardTab === 'teens') && (
            <div className="standings-category-col">
              <div className="standings-col-heading">
                <span className="col-heading-title teens-color">Teens</span>
              </div>

              {teensRanking.length > 0 && teensRanking[0].monthlyScore > 0 ? (
                <div className="standings-table">
                  {teensRanking.slice(0, 5).map((student, idx) => (
                    <div key={student.id} className="standings-table-row">
                      <span className={`rank-badge ${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : ''}`}>
                        {idx + 1}
                      </span>
                      <div className="standings-row-avatar">
                        {renderAvatar(student.emoji, 28)}
                      </div>
                      <div className="standings-row-info">
                        <span className="standings-row-name">{student.name}</span>
                        <span className="standings-row-group">{student.groupName}</span>
                      </div>
                      <span className="standings-row-points">
                        {student.monthlyScore} Like
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="standings-empty-state">
                  <p>Teens guruhlarida bu oyda hali Like berilmagan.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Add / Edit Gift Modal */}
      {modalMode && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setModalMode(null)}
              aria-label="Yopish"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header-fixed">
              <h3 className="modal-title">
                {modalMode === 'edit' ? "Sovg'ani Tahrirlash" : "Yangi Sovg'a Belgilash"}
              </h3>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="modal-body-scrollable">
                {/* Category Segmented Switch inside popup */}
                <div className="form-group">
                  <label className="form-label">Toifa</label>
                  <div className="group-category-toggle-wrap">
                    <button
                      type="button"
                      className={`group-category-toggle-btn ${targetCategory === 'kids' ? 'active' : ''}`}
                      onClick={() => handleSwitchModalCategory('kids')}
                    >
                      Kids
                    </button>
                    <button
                      type="button"
                      className={`group-category-toggle-btn ${targetCategory === 'teens' ? 'active' : ''}`}
                      onClick={() => handleSwitchModalCategory('teens')}
                    >
                      Teens
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Sovg'a nomi *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: LEGO Classic to'plami"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Image URL & Upload Row */}
                <div className="form-group">
                  <label className="form-label">Sovg'a rasmi</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Rasm havolasi (https://...)"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary scale-active"
                      style={{ whiteSpace: 'nowrap', padding: '0 14px', fontSize: '0.82rem' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? 'Yuklanmoqda...' : 'Rasm yuklash'}
                    </button>
                  </div>

                  {formImage && (
                    <div className="gift-modal-preview-box">
                      <img src={formImage} alt="Oldindan ko'rish" />
                      <button
                        type="button"
                        className="gift-preview-remove-btn"
                        onClick={() => setFormImage('')}
                        title="Rasmni olib tashlash"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Qisqacha tavsif / Shartlar</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Oy oxirida 1-o'rinni olgan o'quvchiga topshiriladi..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '68px' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-actions-fixed">
                <button
                  type="button"
                  className="btn btn-secondary scale-active"
                  onClick={() => setModalMode(null)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn btn-primary scale-active"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteCategoryConfirm && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteCategoryConfirm(null)}>
          <div className="modal-content glass modal-confirm" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setDeleteCategoryConfirm(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title text-red">
              {deleteCategoryConfirm === 'kids' ? 'Kids' : 'Teens'} sovg'asini o'chirish
            </h3>
            <p className="modal-warning-text">
              Ushbu toifadagi sovg'a o'chiriladi va o'quvchilar portalida ko'rinmaydi. Keyinroq yana yangi sovg'a kiritishingiz mumkin.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setDeleteCategoryConfirm(null)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-danger scale-active"
                onClick={handleConfirmDelete}
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

export default TeacherRewardsView;
