import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useModalDismiss from '../../hooks/useModalDismiss';

// SVG Icons tailored to match design mockup
const RedHeartIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F43F5E" stroke="#F43F5E" strokeWidth="0.5" style={{ flexShrink: 0, verticalAlign: 'middle', display: 'inline-block' }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const ShoppingBagIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const StarIcon = ({ size = 13, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "#F59E0B" : "none"}
    stroke={filled ? "#F59E0B" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const HelpCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

// Rich rewards catalog matching user mockup
const REWARDS_CATALOG = [
  {
    id: 'it_hoodie',
    title: "Najot Ta'lim / IT Hoodie",
    categoryName: "Kiyim",
    categoryKey: 'clothing',
    points: 800,
    stock: "4 ta qoldi",
    badge: "Mavjud",
    badgeType: 'available',
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
    desc: "Sifatli paxtadan tayyorlangan qulay va zamonaviy IT xudi.",
  },
  {
    id: 'programmer_thermos',
    title: "Programmer Termos",
    categoryName: "Aksessuar",
    categoryKey: 'accessories',
    points: 450,
    stock: "12 ta qoldi",
    badge: "Top sovg'a",
    badgeType: 'top',
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
    desc: "Issiq va sovuq haroratni uzoq saqlovchi zanglamaydigan termos.",
  },
  {
    id: 'sticker_pack',
    title: "Sticker Pack (Node & TS)",
    categoryName: "Aksessuar",
    categoryKey: 'accessories',
    points: 120,
    stock: "Ko'p",
    badge: null,
    badgeType: null,
    image: "https://images.unsplash.com/photo-1572945550740-0759fbf5a244?auto=format&fit=crop&w=600&q=80",
    desc: "Noutbuk va telefonlar uchun robot hamda IT mavzusidagi suv o'tkazmaydigan vinil stikerlar.",
  },
  {
    id: 'tech_backpack',
    title: "Tech Backpack / Ryukzak",
    categoryName: "Aksessuar",
    categoryKey: 'accessories',
    points: 1200,
    stock: "2 ta qoldi",
    badge: "Top sovg'a",
    badgeType: 'top',
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    desc: "Noutbuk, kitob va kerakli anjomlar uchun suv o'tkazmaydigan mustahkam ryukzak.",
  },
  {
    id: 'clean_code_book',
    title: "Clean Code (O'zbekcha)",
    categoryName: "Kitoblar",
    categoryKey: 'books',
    points: 350,
    stock: "8 ta qoldi",
    badge: "Mavjud",
    badgeType: 'available',
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    desc: "Dasturchilar uchun Robert Martinning mashhur 'Toza Kod' kitobi.",
  },
  {
    id: 'mentor_session',
    title: "Mentor bilan 1-ga-1 dars",
    categoryName: "Konsultatsiya",
    categoryKey: 'courses',
    points: 600,
    stock: "Cheklangan",
    badge: "Onlayn",
    badgeType: 'online',
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
    desc: "Katta tajribali dasturchi ustoz bilan 1 soatlik individual konsultatsiya va kod tahlili.",
  },
  {
    id: 'earbuds',
    title: "Simsiz quloqchin (TWS)",
    categoryName: "Gadjet",
    categoryKey: 'accessories',
    points: 750,
    stock: "3 ta qoldi",
    badge: "Top sovg'a",
    badgeType: 'top',
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    desc: "Yuqori ovoz sifatiga ega qulay va zamonaviy simsiz audio quloqchin.",
  },
  {
    id: 'pizza_party',
    title: "Pitsa kuni (Do'stlar bilan)",
    categoryName: "Ziyofat",
    categoryKey: 'courses',
    points: 500,
    stock: "Har dars",
    badge: "Mavjud",
    badgeType: 'available',
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    desc: "Dars yakunida guruhdosh do'stlar bilan issiq pitsa ziyofati.",
  },
];

const CATEGORIES = [
  { key: 'all', label: "Barchasi" },
  { key: 'clothing', label: "Kiyim-kechak" },
  { key: 'accessories', label: "Aksessuarlar" },
  { key: 'courses', label: "Kurslar" },
  { key: 'books', label: "Kitoblar" },
  { key: 'affordable', label: "Menga yetarlilar" },
];

export default function StudentShopComingSoon({
  pinnedStudent = null,
  transactions = [],
  showToast = null,
  onOpenProfilePicker = null,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [targetRewardId, setTargetRewardId] = useState(null);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [showHowToEarnModal, setShowHowToEarnModal] = useState(false);
  const [showRequestsDrawer, setShowRequestsDrawer] = useState(false);
  const [confirmOrderReward, setConfirmOrderReward] = useState(null);

  // Student total likes score
  const totalScore = useMemo(() => {
    if (!pinnedStudent) return 0;
    const pId = String(pinnedStudent.id);
    return (transactions || [])
      .filter((t) => !t.deleted && String(t.studentId) === pId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [pinnedStudent, transactions]);

  // Load student's target goal and reward requests from localStorage
  useEffect(() => {
    if (!pinnedStudent) {
      setTargetRewardId('tech_backpack');
      setRewardRequests([]);
      return;
    }
    const studentIdStr = String(pinnedStudent.id);
    try {
      const savedGoal = localStorage.getItem(`rsa_target_goal_${studentIdStr}`);
      setTargetRewardId(savedGoal || 'tech_backpack');
    } catch {
      setTargetRewardId('tech_backpack');
    }

    try {
      const savedReqs = localStorage.getItem(`rsa_reward_requests_${studentIdStr}`);
      if (savedReqs) {
        setRewardRequests(JSON.parse(savedReqs));
      } else {
        setRewardRequests([]);
      }
    } catch {
      setRewardRequests([]);
    }
  }, [pinnedStudent]);

  // Handle modal dismiss via Esc and lock background scroll
  useModalDismiss(Boolean(showHowToEarnModal || confirmOrderReward || showRequestsDrawer), () => {
    setShowHowToEarnModal(false);
    setConfirmOrderReward(null);
    setShowRequestsDrawer(false);
  });

  const activeTargetReward = useMemo(() => {
    return REWARDS_CATALOG.find((r) => r.id === (targetRewardId || 'tech_backpack')) || REWARDS_CATALOG[3];
  }, [targetRewardId]);

  const filteredRewards = useMemo(() => {
    return REWARDS_CATALOG.filter((item) => {
      if (activeCategory === 'affordable') {
        if (!pinnedStudent || totalScore < item.points) return false;
      } else if (activeCategory !== 'all') {
        if (item.categoryKey !== activeCategory) return false;
      }
      return true;
    });
  }, [activeCategory, pinnedStudent, totalScore]);

  const handleSetTarget = (reward) => {
    triggerHaptic('medium');
    if (!pinnedStudent) {
      if (onOpenProfilePicker) onOpenProfilePicker();
      return;
    }
    const studentIdStr = String(pinnedStudent.id);
    try {
      localStorage.setItem(`rsa_target_goal_${studentIdStr}`, reward.id);
      setTargetRewardId(reward.id);
      if (showToast) {
        showToast(`"${reward.title}" orzu mukofotingiz sifatida belgilandi!`, 'success');
      }
    } catch {}
  };

  const handleConfirmOrder = (reward) => {
    if (!pinnedStudent) {
      if (onOpenProfilePicker) onOpenProfilePicker();
      return;
    }
    triggerHaptic('heavy');
    const studentIdStr = String(pinnedStudent.id);
    const newRequest = {
      id: `req_${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      points: reward.points,
      studentName: pinnedStudent.name,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [newRequest, ...rewardRequests];
    setRewardRequests(updated);
    try {
      localStorage.setItem(`rsa_reward_requests_${studentIdStr}`, JSON.stringify(updated));
    } catch {}
    setConfirmOrderReward(null);
    if (showToast) {
      showToast(`"${reward.title}" sovg'asi so'rovi ustozingizga yuborildi!`, 'success');
    }
  };

  const handleCancelRequest = (reqId) => {
    if (!pinnedStudent) return;
    triggerHaptic('light');
    const studentIdStr = String(pinnedStudent.id);
    const updated = rewardRequests.filter((r) => r.id !== reqId);
    setRewardRequests(updated);
    try {
      localStorage.setItem(`rsa_reward_requests_${studentIdStr}`, JSON.stringify(updated));
    } catch {}
    if (showToast) {
      showToast("Sovg'a so'rovi bekor qilindi.", 'info');
    }
  };

  return (
    <div className="modern-shop-container animate-fadeIn">
      {/* 1. Header (Title, Subtitle & Requests Pill) */}
      <div className="shop-header-row">
        <div className="shop-header-text">
          <h2 className="shop-main-title">Like Do'koni</h2>
          <p className="shop-main-subtitle">Ballar va Like'laringizni sovg'alarga almashtiring</p>
        </div>
        {pinnedStudent && rewardRequests.length > 0 && (
          <button
            type="button"
            className="shop-requests-pill-btn"
            onClick={() => {
              triggerHaptic('light');
              setShowRequestsDrawer(true);
            }}
          >
            <span>So'rovlarim ({rewardRequests.length})</span>
          </button>
        )}
      </div>

      {/* 2. Balance Hero Card (Purple/Blue Gradient) */}
      <div className="shop-balance-hero-card">
        <div className="balance-hero-top">
          <span className="balance-hero-label">Mavjud Like'lar:</span>
          <div className="balance-hero-val-row">
            <span className="balance-hero-num">{totalScore.toLocaleString('uz-UZ')}</span>
            <span className="balance-hero-heart-badge">
              <RedHeartIcon size={16} />
            </span>
          </div>
        </div>

        <button
          type="button"
          className="balance-hero-help-btn"
          onClick={() => {
            triggerHaptic('light');
            setShowHowToEarnModal(true);
          }}
        >
          <HelpCircleIcon size={15} />
          <span>Qanday to'plash?</span>
        </button>
      </div>

      {/* 3. Active Goal / Dream Reward Tracker Card */}
      {activeTargetReward && (
        <div className="shop-goal-tracker-card">
          <div className="goal-card-top-row">
            <button
              type="button"
              className="goal-change-btn"
              onClick={() => {
                triggerHaptic('light');
                const el = document.getElementById('shop-catalog-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>O'zgartirish</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="goal-card-product-row">
            <div className="goal-product-thumb">
              <img src={activeTargetReward.image} alt={activeTargetReward.title} loading="lazy" />
            </div>
            <div className="goal-product-info">
              <h4 className="goal-product-title">{activeTargetReward.title}</h4>
              <div className="goal-product-count">
                <span>Yig'ildi: </span>
                <strong className="count-curr">{totalScore.toLocaleString('uz-UZ')}</strong>
                <span> / {activeTargetReward.points.toLocaleString('uz-UZ')} </span>
                <RedHeartIcon size={12} />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="goal-progress-track">
            <div
              className={`goal-progress-bar ${totalScore >= activeTargetReward.points ? 'is-completed' : ''}`}
              style={{ width: `${Math.min(100, Math.round((totalScore / activeTargetReward.points) * 100))}%` }}
            />
          </div>

          {/* Footer Status Message & Action */}
          <div className="goal-card-footer">
            <span className="goal-footer-msg">
              {totalScore >= activeTargetReward.points ? (
                "Tabriklaymiz, orzuingiz uchun yetarli Like to'pladingiz!"
              ) : (
                `Maqsadga erishish uchun yana ${(activeTargetReward.points - totalScore).toLocaleString('uz-UZ')} Like kerak!`
              )}
            </span>
            {totalScore >= activeTargetReward.points ? (
              <button
                type="button"
                className="goal-buy-cta-btn"
                onClick={() => {
                  triggerHaptic('medium');
                  setConfirmOrderReward(activeTargetReward);
                }}
              >
                <span>Sotib olish</span>
                <span>→</span>
              </button>
            ) : (
              <span className="goal-pct-pill">
                {Math.min(100, Math.round((totalScore / activeTargetReward.points) * 100))}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Category Filter Pills */}
      <div className="shop-categories-scroll-row" id="shop-catalog-anchor" role="tablist">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`shop-category-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setActiveCategory(cat.key);
              }}
              role="tab"
              aria-selected={isActive}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 5. 2-Column Product Cards Grid */}
      <div className="shop-products-grid">
        {filteredRewards.length > 0 ? (
          filteredRewards.map((reward) => {
            const isTarget = activeTargetReward?.id === reward.id;
            const canAfford = pinnedStudent && totalScore >= reward.points;

            return (
              <div key={reward.id} className={`shop-product-card ${isTarget ? 'is-target' : ''}`}>
                {/* Top Image Box */}
                <div className="product-image-box">
                  <img src={reward.image} alt={reward.title} loading="lazy" />

                  {/* Floating Badges */}
                  <div className="product-image-badges">
                    {isTarget ? (
                      <span className="product-badge badge-target">Tanlangan</span>
                    ) : reward.badge ? (
                      <span className={`product-badge badge-${reward.badgeType}`}>
                        {reward.badge}
                      </span>
                    ) : <span />}

                    {isTarget ? (
                      <span className="product-check-circle" title="Tanlangan orzu mukofotingiz">
                        <CheckIcon size={12} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="product-wish-circle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetTarget(reward);
                        }}
                        title="Orzu mukofot sifatida tanlash"
                      >
                        <StarIcon size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="product-card-body">
                  <div className="product-category-row">
                    <span className="product-cat-name">{reward.categoryName}</span>
                    {isTarget && <span className="product-target-tag">Maqsad!</span>}
                  </div>

                  <h3 className="product-card-title" title={reward.title}>
                    {reward.title}
                  </h3>

                  <div className="product-price-stock-row">
                    <div className="product-price-tag">
                      <span className="product-price-val">{reward.points.toLocaleString('uz-UZ')}</span>
                      <RedHeartIcon size={11} />
                      <span className="product-like-lbl">Like</span>
                    </div>
                    <span className="product-stock-tag">{reward.stock}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="product-card-actions">
                    <button
                      type="button"
                      className={`product-buy-btn ${canAfford ? 'can-afford' : ''}`}
                      onClick={() => {
                        triggerHaptic('medium');
                        setConfirmOrderReward(reward);
                      }}
                    >
                      <ShoppingBagIcon size={14} />
                      <span>Sotib olish</span>
                    </button>

                    {isTarget ? (
                      <div className="product-active-goal-pill">
                        <CheckIcon size={12} />
                        <span>Faol orzu mukofotingiz</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="product-set-goal-btn"
                        onClick={() => handleSetTarget(reward)}
                      >
                        <StarIcon size={12} />
                        <span>Orzu qilish</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="shop-empty-notice-card">
            <p>Ushbu toifada hozircha sovg'alar topilmadi.</p>
            <button
              type="button"
              className="shop-reset-filter-btn"
              onClick={() => setActiveCategory('all')}
            >
              Barcha sovg'alarni ko'rish
            </button>
          </div>
        )}
      </div>

      {/* 6. Bottom Motivation / Hint Card */}
      <div className="shop-bottom-hint-card">
        <div className="hint-card-text">
          <h4 className="hint-card-title">Ko'proq Like kerakmi?</h4>
          <p className="hint-card-desc">Uy vazifasini vaqtida topshiring va Like oling.</p>
        </div>
      </div>

      {/* MODAL 1: "Qanday to'plash?" Guide Modal */}
      {showHowToEarnModal && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setShowHowToEarnModal(false)}>
          <div
            className="sheet-container animate-slideUpSheet earn-guide-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Qanday Like to'plash mumkin"
          >
            <div className="sheet-drag-zone"><div className="sheet-drag-handle" /></div>
            <div className="sheet-header">
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setShowHowToEarnModal(false)}
                aria-label="Yopish"
              >
                <XIcon size={14} />
              </button>
              <div className="sheet-title-wrap sheet-title-center">
                <h3 className="sheet-title">Qanday qilib Like to'plash mumkin?</h3>
                <span className="sheet-sub">Sovg'alarga erishish bo'yicha yo'riqnoma</span>
              </div>
              <div style={{ width: 36 }} />
            </div>

            <div className="sheet-body earn-guide-body">
              <div className="earn-guide-step">
                <div className="step-icon-wrap icon-amber">🌟</div>
                <div className="step-info">
                  <h4 className="step-title">Darsda faol qatnashish</h4>
                  <p className="step-desc">Ustozning savollariga to'g'ri javob berib, amaliy bahslarda faol bo'ling (+5 – +10 Like).</p>
                </div>
              </div>

              <div className="earn-guide-step">
                <div className="step-icon-wrap icon-blue">📝</div>
                <div className="step-info">
                  <h4 className="step-title">Uy vazifalarini vaqtida topshirish</h4>
                  <p className="step-desc">Har bir to'liq va a'lo bajarilgan uy vazifasi uchun qo'shimcha Like oling (+10 – +20 Like).</p>
                </div>
              </div>

              <div className="earn-guide-step">
                <div className="step-icon-wrap icon-emerald">🎯</div>
                <div className="step-info">
                  <h4 className="step-title">Amaliy loyiha va testlar</h4>
                  <p className="step-desc">Oraliq testlar va loyiha ishlarini a'lo topshirgan o'quvchilar ko'p miqdorda Like yig'adi (+15 – +30 Like).</p>
                </div>
              </div>

              <div className="earn-guide-step">
                <div className="step-icon-wrap icon-purple">🏆</div>
                <div className="step-info">
                  <h4 className="step-title">Haftalik va oylik reyting</h4>
                  <p className="step-desc">Guruhda va barcha o'quvchilar orasida TOP 3 ga kirgan o'quvchilarga maxsus bonuslar beriladi (+50 Like gacha).</p>
                </div>
              </div>

              <button
                type="button"
                className="earn-guide-ok-btn"
                onClick={() => setShowHowToEarnModal(false)}
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Order / Purchase Confirmation Modal */}
      {confirmOrderReward && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setConfirmOrderReward(null)}>
          <div
            className="sheet-container animate-slideUpSheet confirm-order-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="confirm-order-header">
              <div className="confirm-order-thumb">
                <img src={confirmOrderReward.image} alt={confirmOrderReward.title} />
              </div>
              <h3 className="confirm-order-title">
                {pinnedStudent && totalScore >= confirmOrderReward.points
                  ? "Sovg'ani so'rashni tasdiqlaysizmi?"
                  : "Like yetarli emas"}
              </h3>
              <p className="confirm-order-desc">
                {pinnedStudent && totalScore >= confirmOrderReward.points ? (
                  <><strong>"{confirmOrderReward.title}"</strong> sovg'asi uchun ustozingizga so'rov yuboriladi.</>
                ) : (
                  <>Ushbu sovg'a <strong>{confirmOrderReward.points} Like</strong> turadi. Sizda esa <strong>{totalScore} Like</strong> mavjud.</>
                )}
              </p>
              <div className="confirm-order-points-badge">
                <RedHeartIcon size={14} />
                <span>{confirmOrderReward.points} Like sarflanadi</span>
              </div>
            </div>

            <div className="confirm-order-actions">
              <button
                type="button"
                className="dialog-btn cancel"
                onClick={() => setConfirmOrderReward(null)}
              >
                Bekor qilish
              </button>
              {pinnedStudent && totalScore >= confirmOrderReward.points ? (
                <button
                  type="button"
                  className="dialog-btn order-confirm-btn"
                  onClick={() => handleConfirmOrder(confirmOrderReward)}
                >
                  Ha, so'rov yuborish
                </button>
              ) : (
                <button
                  type="button"
                  className="dialog-btn order-confirm-btn"
                  onClick={() => {
                    handleSetTarget(confirmOrderReward);
                    setConfirmOrderReward(null);
                  }}
                >
                  Orzu qilib belgilash
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Student's Sent Requests Drawer */}
      {showRequestsDrawer && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setShowRequestsDrawer(false)}>
          <div
            className="sheet-container animate-slideUpSheet requests-sheet-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mening so'rovlarim"
          >
            <div className="sheet-drag-zone"><div className="sheet-drag-handle" /></div>

            <div className="sheet-header">
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setShowRequestsDrawer(false)}
                aria-label="Yopish"
              >
                <XIcon size={14} />
              </button>
              <div className="sheet-title-wrap sheet-title-center">
                <h3 className="sheet-title">Mening so'rovlarim ({rewardRequests.length})</h3>
                <span className="sheet-sub">Ustozingizga yuborilgan sovg'alar</span>
              </div>
              <div style={{ width: 36 }} />
            </div>

            <div className="sheet-body requests-modal-list">
              {rewardRequests.length > 0 ? (
                rewardRequests.map((req) => (
                  <div key={req.id} className="request-card-item">
                    <div className="req-item-info">
                      <span className="req-item-title">{req.rewardTitle}</span>
                      <span className="req-item-sub">
                        <RedHeartIcon size={12} />
                        <span>{req.points} Like • {new Date(req.timestamp).toLocaleDateString('uz-UZ')}</span>
                      </span>
                    </div>
                    <div className="req-item-right">
                      <span className="req-status-tag pending">Kutilmoqda</span>
                      <button
                        type="button"
                        className="req-cancel-btn"
                        onClick={() => handleCancelRequest(req.id)}
                        title="So'rovni bekor qilish"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="requests-empty">
                  <span>Hozircha so'rovlar mavjud emas</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
