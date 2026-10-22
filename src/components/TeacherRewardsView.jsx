import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { compressUploadedImage } from '../utils/avatarGallery';
import { getGroupCategory, getStartOfMonth } from '../utils/db';
import { renderAvatar } from '../utils/studentAvatars';
import { useModalDismiss } from '../hooks/useModalDismiss';
import './TeacherRewardsView.css';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

const triggerHaptic = (style = 'light') => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } catch {
      // Ignore if haptic not supported
    }
  }
};

export default function TeacherRewardsView({
  rewards = { kids: null, teens: null },
  groups = [],
  students = [],
  transactions = [],
  onSaveGift,
  onDeleteGift,
  showToast,
}) {
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

  const kidsMargin = useMemo(() => {
    if (!kidsLeader || kidsLeader.monthlyScore === 0) return 0;
    const runnerUp = kidsRanking[1];
    return kidsLeader.monthlyScore - (runnerUp ? runnerUp.monthlyScore : 0);
  }, [kidsLeader, kidsRanking]);

  const teensMargin = useMemo(() => {
    if (!teensLeader || teensLeader.monthlyScore === 0) return 0;
    const runnerUp = teensRanking[1];
    return teensLeader.monthlyScore - (runnerUp ? runnerUp.monthlyScore : 0);
  }, [teensLeader, teensRanking]);

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
      {/* 1. Page Header (Single "+ Sovg'a Belgilash" action button, no icon boxes or cluttered pills) */}
      <div className="rewards-page-header">
        <div className="rewards-header-title-wrap">
          <h1 className="rewards-main-title">Oylik Sovg'alar Musobaqasi</h1>
          <p className="rewards-main-subtitle">
            Oyning oxirgi kuni kim 1-o'rinda bo'lsa, o'sha o'quvchi sovg'ani yutib oladi.
          </p>
        </div>

        <div className="rewards-header-actions-wrap">
          <div className="header-countdown-badge">
            <span>{currentMonthName} oyi:</span>
            <strong>{daysRemaining} kun qoldi</strong>
          </div>

          <button
            type="button"
            className="header-add-gift-primary-btn scale-active"
            onClick={() => handleOpenAddModal('kids')}
          >
            <span>+ Sovg'a Belgilash</span>
          </button>
        </div>
      </div>

      {/* 2. Two Main Category Gift Cards (Kids & Teens) */}
      <div className="rewards-grid-row">
        {/* KIDS REWARD CARD */}
        <div className="reward-category-card">
          <div className="reward-category-card-header">
            <span className="category-clean-title kids-title">Kids Toifasi</span>
            <span className="reward-points-volt-badge">
              1-O'rin Sovg'asi
            </span>
          </div>

          {rewards?.kids ? (
            <div className="reward-card-body">
              <div className="reward-media-box">
                <img src={rewards.kids.image} alt={rewards.kids.title} loading="lazy" />
              </div>

              <div className="reward-content-box">
                <h3 className="reward-card-title">{rewards.kids.title}</h3>
                <p className="reward-card-desc">
                  {rewards.kids.description || "Oy oxirida Kids toifasida 1-o'rinni egallagan o'quvchiga topshiriladi."}
                </p>

                {/* Current Leader Tag */}
                <div className="reward-leader-preview-banner">
                  {kidsLeader ? (
                    <div className="leader-avatar-circle">
                      {renderAvatar(kidsLeader.emoji, 32)}
                    </div>
                  ) : null}
                  <div className="leader-preview-text">
                    <span className="leader-role-tag">Hozirgi 1-o'rin da'vogari:</span>
                    <strong className="leader-name-tag">
                      {kidsLeader && kidsLeader.monthlyScore > 0
                        ? `${kidsLeader.name} (${kidsLeader.monthlyScore} Like)`
                        : "Bu oyda hali ball berilmagan"}
                    </strong>
                  </div>
                </div>

                <div className="reward-card-actions-row">
                  <button
                    type="button"
                    className="reward-action-btn edit-btn scale-active"
                    onClick={() => handleOpenEditModal('kids')}
                  >
                    <span>Tahrirlash</span>
                  </button>
                  <button
                    type="button"
                    className="reward-action-btn delete-btn scale-active"
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
            <div className="reward-empty-clean-card">
              <h4 className="empty-title">Kids uchun sovg'a belgilanmagan</h4>
              <p className="empty-desc">
                Ushbu oy uchun Kids toifasiga hali sovg'a belgilanmagan.
              </p>
            </div>
          )}
        </div>

        {/* TEENS REWARD CARD */}
        <div className="reward-category-card">
          <div className="reward-category-card-header">
            <span className="category-clean-title teens-title">Teens Toifasi</span>
            <span className="reward-points-volt-badge">
              1-O'rin Sovg'asi
            </span>
          </div>

          {rewards?.teens ? (
            <div className="reward-card-body">
              <div className="reward-media-box">
                <img src={rewards.teens.image} alt={rewards.teens.title} loading="lazy" />
              </div>

              <div className="reward-content-box">
                <h3 className="reward-card-title">{rewards.teens.title}</h3>
                <p className="reward-card-desc">
                  {rewards.teens.description || "Oy oxirida Teens toifasida 1-o'rinni egallagan o'quvchiga topshiriladi."}
                </p>

                {/* Current Leader Tag */}
                <div className="reward-leader-preview-banner">
                  {teensLeader ? (
                    <div className="leader-avatar-circle">
                      {renderAvatar(teensLeader.emoji, 32)}
                    </div>
                  ) : null}
                  <div className="leader-preview-text">
                    <span className="leader-role-tag">Hozirgi 1-o'rin da'vogari:</span>
                    <strong className="leader-name-tag">
                      {teensLeader && teensLeader.monthlyScore > 0
                        ? `${teensLeader.name} (${teensLeader.monthlyScore} Like)`
                        : "Bu oyda hali ball berilmagan"}
                    </strong>
                  </div>
                </div>

                <div className="reward-card-actions-row">
                  <button
                    type="button"
                    className="reward-action-btn edit-btn scale-active"
                    onClick={() => handleOpenEditModal('teens')}
                  >
                    <span>Tahrirlash</span>
                  </button>
                  <button
                    type="button"
                    className="reward-action-btn delete-btn scale-active"
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
            <div className="reward-empty-clean-card">
              <h4 className="empty-title">Teens uchun sovg'a belgilanmagan</h4>
              <p className="empty-desc">
                Ushbu oy uchun Teens toifasiga hali sovg'a belgilanmagan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Monthly Leaders Section (Who is currently leading) */}
      <div className="rewards-race-section">
        <div className="race-section-header">
          <div>
            <span className="race-section-badge">{currentMonthName} oyi yetakchilari</span>
            <h2 className="race-section-title">Hozirgi Peshqadamlar (1-O'rin Da'vogarlari)</h2>
            <p className="race-section-subtitle">
              Oyning oxirgi sanasi kuni kim 1-o'rinda bo'lsa, o'sha sovg'ani yutib oladi. Qolganlarga hech narsa yo'q.
            </p>
          </div>

          <div className="race-filter-tabs">
            <button
              type="button"
              className={`race-tab-btn ${activeLeaderboardTab === 'both' ? 'active' : ''}`}
              onClick={() => setActiveLeaderboardTab('both')}
            >
              Barchasi
            </button>
            <button
              type="button"
              className={`race-tab-btn ${activeLeaderboardTab === 'kids' ? 'active' : ''}`}
              onClick={() => setActiveLeaderboardTab('kids')}
            >
              Kids ({kidsRanking.length})
            </button>
            <button
              type="button"
              className={`race-tab-btn ${activeLeaderboardTab === 'teens' ? 'active' : ''}`}
              onClick={() => setActiveLeaderboardTab('teens')}
            >
              Teens ({teensRanking.length})
            </button>
          </div>
        </div>

        {/* Leaders Split Grid */}
        <div className="race-leaders-split-grid">
          {/* KIDS LEADER BOX */}
          {(activeLeaderboardTab === 'both' || activeLeaderboardTab === 'kids') && (
            <div className="category-race-card">
              <div className="race-card-top-head">
                <span className="category-clean-title kids-title">Kids Yetakchisi</span>
                <span className="race-points-counter">
                  {kidsLeader?.monthlyScore || 0} Like
                </span>
              </div>

              {kidsLeader && kidsLeader.monthlyScore > 0 ? (
                <>
                  <div className="race-hero-profile-box">
                    <div className="race-hero-avatar-wrap">
                      <div className="race-hero-avatar">
                        {renderAvatar(kidsLeader.emoji, 56, { priority: 'high', eager: true })}
                      </div>
                      <span className="race-crown-badge">1</span>
                    </div>

                    <div className="race-hero-text">
                      <h4 className="race-hero-name">{kidsLeader.name}</h4>
                      <span className="race-hero-group">{kidsLeader.groupName}</span>
                      <div className="race-lead-margin-tag">
                        {kidsMargin > 0
                          ? `2-o'rindan ${kidsMargin} Like oldinda`
                          : "Yetakchilik uchun teng kurash"}
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Runner-ups ranking table */}
                  <div className="race-top-list-box">
                    <span className="top-list-title">Kids Top 5 Da'vogarlari:</span>
                    <div className="race-rank-items-list">
                      {kidsRanking.slice(0, 5).map((student, idx) => (
                        <div key={student.id} className={`race-rank-item ${idx === 0 ? 'is-first' : ''}`}>
                          <span className={`rank-index-badge rank-${idx + 1}`}>
                            {idx + 1}
                          </span>
                          <div className="rank-item-avatar">
                            {renderAvatar(student.emoji, 28)}
                          </div>
                          <div className="rank-item-info">
                            <span className="rank-item-name">{student.name}</span>
                            <span className="rank-item-group">{student.groupName}</span>
                          </div>
                          <span className="rank-item-points">
                            {student.monthlyScore} Like
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="race-empty-state">
                  <p>Kids guruhlarida bu oyda hali Like berilmagan.</p>
                </div>
              )}
            </div>
          )}

          {/* TEENS LEADER BOX */}
          {(activeLeaderboardTab === 'both' || activeLeaderboardTab === 'teens') && (
            <div className="category-race-card">
              <div className="race-card-top-head">
                <span className="category-clean-title teens-title">Teens Yetakchisi</span>
                <span className="race-points-counter">
                  {teensLeader?.monthlyScore || 0} Like
                </span>
              </div>

              {teensLeader && teensLeader.monthlyScore > 0 ? (
                <>
                  <div className="race-hero-profile-box">
                    <div className="race-hero-avatar-wrap">
                      <div className="race-hero-avatar">
                        {renderAvatar(teensLeader.emoji, 56, { priority: 'high', eager: true })}
                      </div>
                      <span className="race-crown-badge">1</span>
                    </div>

                    <div className="race-hero-text">
                      <h4 className="race-hero-name">{teensLeader.name}</h4>
                      <span className="race-hero-group">{teensLeader.groupName}</span>
                      <div className="race-lead-margin-tag">
                        {teensMargin > 0
                          ? `2-o'rindan ${teensMargin} Like oldinda`
                          : "Yetakchilik uchun teng kurash"}
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Runner-ups ranking table */}
                  <div className="race-top-list-box">
                    <span className="top-list-title">Teens Top 5 Da'vogarlari:</span>
                    <div className="race-rank-items-list">
                      {teensRanking.slice(0, 5).map((student, idx) => (
                        <div key={student.id} className={`race-rank-item ${idx === 0 ? 'is-first' : ''}`}>
                          <span className={`rank-index-badge rank-${idx + 1}`}>
                            {idx + 1}
                          </span>
                          <div className="rank-item-avatar">
                            {renderAvatar(student.emoji, 28)}
                          </div>
                          <div className="rank-item-info">
                            <span className="rank-item-name">{student.name}</span>
                            <span className="rank-item-group">{student.groupName}</span>
                          </div>
                          <span className="rank-item-points">
                            {student.monthlyScore} Like
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="race-empty-state">
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
}
