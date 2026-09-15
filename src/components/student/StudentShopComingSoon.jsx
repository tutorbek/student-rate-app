import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  RewardSquircle,
  LikeIcon,
  TargetIcon,
  CheckIcon,
  SearchIcon,
  ShoppingBagIcon,
  TrophyIcon,
} from './StudentIcons';

const REWARDS_CATALOG = [
  {
    id: 'pen_set',
    icon: '✏️',
    title: "Ruchka to'plami",
    points: 30,
    category: "Yozuv qurollari",
    categoryKey: 'stationery',
    desc: "Sifatli gel ruchkalar to'plami (turli ranglarda)",
    detail: "Darslarda qulay va chiroyli yozish uchun sifatli rang-barang gel ruchkalar to'plami.",
    highlight: false,
  },
  {
    id: 'sticker_pack',
    icon: '🎨',
    title: "Stiker paket",
    points: 40,
    category: "Stikerlar",
    categoryKey: 'stationery',
    desc: "Robot va gadjet rasmlari bilan stikerlar",
    detail: "Noutbuk, telefon g'ilofi va daftarlarga yopishtirish uchun zamonaviy robot va texnologiya mavzusidagi vinil stikerlar.",
    highlight: false,
  },
  {
    id: 'notebook',
    icon: '📒',
    title: "Note daftar",
    points: 60,
    category: "Daftar & Kundalik",
    categoryKey: 'stationery',
    desc: "Chiroyli qattiq muqovali kundalik/note daftar. Darslarda yozib borish uchun",
    detail: "Darslarda sxema, dastur kodlari va yangi bilimlarni qayd qilib borish uchun qattiq muqovali, qulay formatdagi daftar.",
    highlight: false,
  },
  {
    id: 'brand_pen_notebook',
    icon: '🖊️',
    title: "Brend ruchka + Bloknot",
    points: 80,
    category: "Aksessuar",
    categoryKey: 'gifts',
    desc: "Metall ruchka va brendli bloknot to'plami",
    detail: "Epchil Robot logotipi tushirilgan sifatli metall ruchka hamda maxsus brendli qulay bloknot to'plami.",
    highlight: false,
  },
  {
    id: 'book_dictionary',
    icon: '📚',
    title: "Lug'at / Kitob",
    points: 90,
    category: "Kitoblar",
    categoryKey: 'gifts',
    desc: "Ingliz yoki rus tili lug'ati, yoxud qiziqarli kitob (o'quvchi tanlaydi). O'z tilini rivojlantirish uchun foydali sovg'a",
    detail: "O'quvchi xohishiga ko'ra tanlanadigan chet tili lug'ati yoki dunyoqarashni kengaytiruvchi eng sara badiiy/ilmiy kitob.",
    highlight: false,
  },
  {
    id: 'pizza_day',
    icon: '🍕',
    title: "Pitsa kuni",
    points: 100,
    category: "Ziyofat",
    categoryKey: 'party',
    desc: "Darsdan keyin do'stlar bilan pitsa ziyofati",
    detail: "Dars yakunida guruhdoshlar va do'stlar bilan birgalikda issiq va mazali pitsa yeb maroqli hordiq chiqarish imkoniyati!",
    highlight: true,
  },
  {
    id: 'full_writing_kit',
    icon: '🖍️',
    title: "To'liq yozuv to'plami",
    points: 130,
    category: "Yozuv to'plami",
    categoryKey: 'stationery',
    desc: "Ruchka, qalam, marker, o'chirg'ich, chizg'ich — hammasi bir to'plamda",
    detail: "O'quvchi uchun barcha kerakli yozuv va chizmachilik anjomlarini o'zida jamlagan universal to'plam.",
    highlight: false,
  },
  {
    id: 'gaming_hour',
    icon: '🎮',
    title: "O'yin soati",
    points: 150,
    category: "Ko'ngilochar",
    categoryKey: 'party',
    desc: "Darsning oxirgi 20 daqiqasi — kompyuter o'yini yoki robot-mashina poygasi",
    detail: "Darsning so'nggi 20 daqiqasida kompyuter o'yinlari o'ynash yoki robot-mashinalar o'rtasida qizg'in poyga uyushtirish ruxsati.",
    highlight: true,
  },
  {
    id: 'school_backpack',
    icon: '🎒',
    title: "Maktab sumkasi / Papka",
    points: 200,
    category: "Sumka & Papka",
    categoryKey: 'gadgets',
    desc: "Sifatli papka yoki kichik ryukzak. Kitob va daftarlarni tashish uchun",
    detail: "Kitoblar, daftarlar va noutbuk/planshetni xavfsiz tashish uchun qulay, yengil va mustahkam ryukzak.",
    highlight: false,
  },
  {
    id: 'earbuds',
    icon: '🎧',
    title: "Quloqchin",
    points: 250,
    category: "Gadjet",
    categoryKey: 'gadgets',
    desc: "Sifatli simsiz quloqchin",
    detail: "Musiqa tinglash, audio darslar va videolarni tomosha qilish uchun yuqori ovoz sifatiga ega zamonaviy simsiz quloqchin.",
    highlight: true,
  },
  {
    id: 'powerbank',
    icon: '📱',
    title: "Powerbank",
    points: 350,
    category: "Elektronika",
    categoryKey: 'gadgets',
    desc: "Kichik quvvat banki",
    detail: "Telefon yoki boshqa qurilmalarni yo'lda hamda dars davomida qulay quvvatlash imkonini beruvchi ixcham tashqi akkumulyator.",
    highlight: false,
  },
  {
    id: 'smartwatch',
    icon: '⌚',
    title: "Smart soat / Fitnes braslet",
    points: 600,
    category: "Smart gadjet",
    categoryKey: 'gadgets',
    desc: "Zamonaviy gadjet — kundalik hayotda foydali va obro'li sovg'a",
    detail: "Qadamlar, vaqt, xabarnomalarni ko'rsatuvchi, sport va kundalik faollikni kuzatuvchi nufuzli smart gadjet.",
    highlight: true,
  },
  {
    id: 'year_champion',
    icon: '🏆',
    title: "Yilning chempioni",
    points: 1000,
    category: "Bosh mukofot",
    categoryKey: 'champion',
    desc: "Oltin kubok + sertifikat + planshet yoki simsiz quloqchinning premium versiyasi (yoki pul mukofoti). Eng ko'p Like to'plagan o'quvchiga",
    detail: "Yillik kurs yakunida eng yuksak natija ko'rsatgan 1-o'rin sohibiga topshiriladigan muhtasham oltin kubok, sertifikat va premium sovg'a!",
    highlight: true,
    isGrandPrize: true,
  },
];

const CATEGORIES = [
  { key: 'all', label: "Barchasi (13)" },
  { key: 'affordable', label: "Menga yetarlilar" },
  { key: 'stationery', label: "Yozuv & O'quv" },
  { key: 'party', label: "Ziyofat & O'yin" },
  { key: 'gadgets', label: "Gadjetlar" },
  { key: 'champion', label: "Bosh sovrin" },
];

const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
};

export default function StudentShopComingSoon({
  pinnedStudent = null,
  transactions = [],
  showToast = null,
  onOpenProfilePicker = null,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReward, setSelectedReward] = useState(null);
  const [targetRewardId, setTargetRewardId] = useState(null);
  const [rewardRequests, setRewardRequests] = useState([]);
  const [showRequestsDrawer, setShowRequestsDrawer] = useState(false);
  const [confirmOrderReward, setConfirmOrderReward] = useState(null);

  // Student total points
  const totalScore = useMemo(() => {
    if (!pinnedStudent) return 0;
    const pId = String(pinnedStudent.id);
    return (transactions || [])
      .filter((t) => !t.deleted && String(t.studentId) === pId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [pinnedStudent, transactions]);

  // Load student's target goal & requests from localStorage
  useEffect(() => {
    if (!pinnedStudent) {
      setTargetRewardId(null);
      setRewardRequests([]);
      return;
    }
    const studentIdStr = String(pinnedStudent.id);
    try {
      const savedGoal = localStorage.getItem(`rsa_target_goal_${studentIdStr}`);
      setTargetRewardId(savedGoal || null);

      const savedReqs = localStorage.getItem(`rsa_reward_requests_${studentIdStr}`);
      if (savedReqs) {
        setRewardRequests(JSON.parse(savedReqs));
      } else {
        setRewardRequests([]);
      }
    } catch {}
  }, [pinnedStudent]);

  // Target reward object
  const targetReward = useMemo(() => {
    if (!targetRewardId) return null;
    return REWARDS_CATALOG.find((r) => r.id === targetRewardId) || null;
  }, [targetRewardId]);

  // Affordable count
  const affordableCount = useMemo(() => {
    if (!pinnedStudent) return 0;
    return REWARDS_CATALOG.filter((r) => totalScore >= r.points).length;
  }, [pinnedStudent, totalScore]);

  // Filtered items
  const filteredRewards = useMemo(() => {
    return REWARDS_CATALOG.filter((item) => {
      // Category filter
      if (activeCategory === 'affordable') {
        if (!pinnedStudent || totalScore < item.points) return false;
      } else if (activeCategory !== 'all') {
        if (item.categoryKey !== activeCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.desc.toLowerCase().includes(query);
        const matchCat = item.category.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [activeCategory, searchQuery, pinnedStudent, totalScore]);

  // Set or remove target goal
  const handleToggleTargetGoal = useCallback((reward) => {
    if (!pinnedStudent) {
      showToast?.("Avval o'z profilingizni tanlang!", "info");
      onOpenProfilePicker?.();
      return;
    }
    triggerHaptic('medium');
    const studentIdStr = String(pinnedStudent.id);
    if (targetRewardId === reward.id) {
      // Remove target
      try {
        localStorage.removeItem(`rsa_target_goal_${studentIdStr}`);
      } catch {}
      setTargetRewardId(null);
      showToast?.(`"${reward.title}" maqsadi bekor qilindi.`, "info");
    } else {
      // Set new target
      try {
        localStorage.setItem(`rsa_target_goal_${studentIdStr}`, reward.id);
      } catch {}
      setTargetRewardId(reward.id);
      showToast?.(`"${reward.title}" asosiy maqsad qilib belgilandi!`, "success");
    }
    setSelectedReward(null);
  }, [pinnedStudent, targetRewardId, showToast, onOpenProfilePicker]);

  // Request/Order Reward
  const handleConfirmOrder = useCallback((reward) => {
    if (!pinnedStudent) return;
    triggerHaptic('heavy');
    const studentIdStr = String(pinnedStudent.id);

    const newRequest = {
      id: `req_${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardIcon: reward.icon,
      points: reward.points,
      studentName: pinnedStudent.name,
      timestamp: new Date().toISOString(),
      status: 'pending', // 'pending' | 'ready' | 'received'
    };

    const updated = [newRequest, ...rewardRequests];
    setRewardRequests(updated);
    try {
      localStorage.setItem(`rsa_reward_requests_${studentIdStr}`, JSON.stringify(updated));
    } catch {}

    setConfirmOrderReward(null);
    setSelectedReward(null);
    showToast?.(`"${reward.title}" sovg'asi so'rovi ustozingizga yuborildi!`, "success");
  }, [pinnedStudent, rewardRequests, showToast]);

  // Cancel Request
  const handleCancelRequest = useCallback((reqId) => {
    if (!pinnedStudent) return;
    triggerHaptic('light');
    const studentIdStr = String(pinnedStudent.id);
    const updated = rewardRequests.filter((r) => r.id !== reqId);
    setRewardRequests(updated);
    try {
      localStorage.setItem(`rsa_reward_requests_${studentIdStr}`, JSON.stringify(updated));
    } catch {}
    showToast?.("So'rov bekor qilindi.", "info");
  }, [pinnedStudent, rewardRequests, showToast]);

  return (
    <div className="student-shop-page">
      {/* Blur Curtain Veil Overlay covering entire shop */}
      <div className="shop-curtain-overlay" aria-hidden="true" />

      {/* Banner at the top of the page */}
      <div className="shop-curtain-banner-top" aria-hidden="true">
        <div className="shop-curtain-banner">
          <div className="shop-curtain-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="shop-curtain-sparkle">✨</span>
          </div>
          <div className="shop-curtain-badge-tag">
            <span className="shop-curtain-dot" />
            <span>Kutilmoqda</span>
          </div>
          <h2 className="shop-curtain-title">Do'kon Tez orada ishga tushadi</h2>
          <p className="shop-curtain-desc">
            To'plangan Like ballaringizni turli xil sovg'alar va imtiyozlarga almashtirish bo'limi tez kunda taqdim etiladi.
          </p>
        </div>
      </div>

      {/* Locked Shop Content (Blurred & Unclickable) */}
      <div className="shop-content-locked">
        {/* Top Wallet & Status Header */}
        <div className="shop-wallet-banner">
        <div className="wallet-left">
          <div className="wallet-like-badge" title="Jonli Like hamyoni">
            <span className="wallet-like-heart">
              <LikeIcon size={22} color="#0071E3" />
            </span>
            <span className="wallet-like-sub-tag">LIKE</span>
          </div>
          <div className="wallet-text-col">
            <span className="wallet-label">
              {pinnedStudent ? `${pinnedStudent.name.split(' ')[0]}ning hisobida:` : "Sizning hisobingizda:"}
            </span>
            <div className="wallet-points-row">
              <span className="wallet-points-val">{totalScore}</span>
              <span className="wallet-points-unit">Like</span>
            </div>
          </div>
        </div>

        <div className="wallet-actions-right">
          {pinnedStudent ? (
            <div className="wallet-summary-chips">
              <span className="summary-chip affordable-chip" title="Like'laringiz yetadigan sovg'alar">
                <CheckIcon size={12} color="#28A745" /> {affordableCount} ta ochiq
              </span>
              {rewardRequests.length > 0 && (
                <button
                  type="button"
                  className="summary-chip requests-chip scale-active"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowRequestsDrawer(true);
                  }}
                >
                  <ShoppingBagIcon size={12} /> {rewardRequests.length} ta so'rov
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="select-profile-prompt-btn scale-active"
              onClick={() => {
                triggerHaptic('light');
                onOpenProfilePicker?.();
              }}
            >
              <span>Profilni tanlash</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Target Goal (Maqsad) Hero Card */}
      {pinnedStudent && targetReward && (
        <div className="shop-target-card animate-fadeIn">
          <div className="target-card-top">
            <div className="target-badge-pill">
              <span className="target-pulse-dot" />
              <TargetIcon size={14} color="#0071E3" />
              <span>Sizning Maqsadingiz</span>
            </div>
            <button
              type="button"
              className="target-change-btn"
              onClick={() => handleToggleTargetGoal(targetReward)}
              title="Maqsadni bekor qilish"
            >
              ✕ Bekor qilish
            </button>
          </div>

          <div className="target-main-row">
            <RewardSquircle rewardId={targetReward.id} size={48} iconSize={24} />
            <div className="target-info-wrap">
              <div className="target-title-row">
                <h3 className="target-title">{targetReward.title}</h3>
                <span className="target-points-tag">{targetReward.points} Like</span>
              </div>
              <p className="target-desc">{targetReward.desc}</p>
            </div>
          </div>

          {/* Target Progress Bar */}
          <div className="target-progress-section">
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${totalScore >= targetReward.points ? 'is-completed' : ''}`}
                style={{
                  width: `${Math.min(100, Math.round((totalScore / targetReward.points) * 100))}%`,
                }}
              />
            </div>
            <div className="progress-labels-row">
              <span className="progress-pct-label">
                {Math.min(100, Math.round((totalScore / targetReward.points) * 100))}% to'plandi ({totalScore} / {targetReward.points} Like)
              </span>
              <span className="progress-status-label">
                {totalScore >= targetReward.points ? (
                  <strong className="status-success-text">
                    <CheckIcon size={14} color="#28A745" /> Marra zabt etildi!
                  </strong>
                ) : (
                  `Yana ${targetReward.points - totalScore} Like kerak`
                )}
              </span>
            </div>
          </div>

          {totalScore >= targetReward.points && (
            <div className="target-achieved-box">
              <p className="achieved-msg">
                Tabriklaymiz! Ushbu sovg'a uchun yetarli Like to'pladingiz.
              </p>
              <button
                type="button"
                className="target-order-action-btn scale-active"
                onClick={() => {
                  triggerHaptic('medium');
                  setConfirmOrderReward(targetReward);
                }}
              >
                <ShoppingBagIcon size={16} /> Sovg'ani so'rash
              </button>
            </div>
          )}
        </div>
      )}

      {/* If no goal set, show neutral motivation prompt */}
      {pinnedStudent && !targetReward && (
        <div className="shop-no-goal-card animate-fadeIn">
          <div className="no-goal-left">
            <div className="no-goal-icon-box">
              <TargetIcon size={20} color="#0071E3" />
            </div>
            <div className="no-goal-text">
              <span className="no-goal-title">Hali maqsad belgilanmagan</span>
              <span className="no-goal-sub">
                Quyidagi sovg'alardan birini o'zingizga maqsad qilib tanlang
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter Strip */}
      <div className="shop-filter-section">
        {/* Quick Search Input */}
        <div className="shop-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="shop-search-input"
            placeholder="Sovg'alarni qidiring (masalan, ruchka, pitsa, quloqchin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Tozalash"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="shop-categories-scroll">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat.key);
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="rewards-grid">
        {filteredRewards.length > 0 ? (
          filteredRewards.map((item) => {
            const hasEnough = pinnedStudent && totalScore >= item.points;
            const isTarget = targetRewardId === item.id;
            const progressPct = Math.min(100, Math.round((totalScore / item.points) * 100));
            const neededPoints = Math.max(0, item.points - totalScore);

            return (
              <div
                key={item.id}
                className={`reward-card ${item.isGrandPrize ? 'is-grand-prize' : ''} ${hasEnough ? 'can-afford' : ''} ${isTarget ? 'is-target' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedReward(item);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedReward(item);
                  }
                }}
              >
                {/* Grand prize banner */}
                {item.isGrandPrize && (
                  <div className="grand-prize-ribbon">
                    <TrophyIcon size={13} color="#D97706" />
                    <span>SUPER BOSH SOVRIN</span>
                  </div>
                )}

                {/* Target badge if chosen */}
                {isTarget && (
                  <div className="card-target-ribbon">
                    <TargetIcon size={13} color="#0071E3" />
                    <span>Sizning Maqsadingiz</span>
                  </div>
                )}

                <div className="reward-header">
                  <RewardSquircle rewardId={item.id} size={46} iconSize={24} />
                  <div className="reward-points-pill-wrap">
                    <span className={`reward-points-pill ${hasEnough ? 'can-afford' : ''}`}>
                      <LikeIcon size={12} color={hasEnough ? '#2E7D32' : '#0071E3'} /> {item.points} Like
                    </span>
                  </div>
                </div>

                <div className="reward-info">
                  <span className="reward-category">{item.category}</span>
                  <h4 className="reward-title">{item.title}</h4>
                  <p className="reward-desc">{item.desc}</p>
                </div>

                {/* Progress bar inside card */}
                <div className="card-progress-box">
                  <div className="card-progress-track">
                    <div
                      className={`card-progress-fill ${hasEnough ? 'is-completed' : ''}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="card-progress-text-row">
                    <span className="card-progress-pct">{progressPct}%</span>
                    <span className="card-progress-status">
                      {hasEnough ? (
                        <span className="status-success-inline">
                          <CheckIcon size={12} color="#28A745" /> Yetarli Like bor
                        </span>
                      ) : (
                        `Yana ${neededPoints} Like kerak`
                      )}
                    </span>
                  </div>
                </div>

                <div className="reward-card-actions">
                  {hasEnough ? (
                    <button
                      type="button"
                      className="card-order-btn scale-active"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('medium');
                        setConfirmOrderReward(item);
                      }}
                    >
                      <ShoppingBagIcon size={15} /> Sovg'ani so'rash
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`card-target-btn scale-active ${isTarget ? 'is-active-target' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTargetGoal(item);
                      }}
                    >
                      {isTarget ? (
                        <>
                          <CheckIcon size={14} /> Maqsad belgilangan
                        </>
                      ) : (
                        <>
                          <TargetIcon size={14} /> Maqsad qilish
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="shop-empty-state">
            <span className="empty-icon">
              <SearchIcon size={34} color="var(--text-tertiary)" />
            </span>
            <p className="empty-title">Mos keluvchi sovg'a topilmadi</p>
            <p className="empty-sub">Boshqa kalit so'z yoki barcha toifalarni tanlab ko'ring</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
            >
              Barchasini ko'rsatish
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Reward Detail Modal */}
      {selectedReward && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay animate-fadeIn" onClick={() => setSelectedReward(null)}>
          <div className="modal-content glass shop-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedReward(null)}
              aria-label="Yopish"
            >
              ✕
            </button>

            <div className="detail-modal-header">
              <RewardSquircle rewardId={selectedReward.id} size={58} iconSize={28} />
              <div className="detail-header-info">
                <span className="detail-category">{selectedReward.category}</span>
                <h3 className="detail-title">{selectedReward.title}</h3>
                <div className="detail-price-badge">
                  <span className="price-num">{selectedReward.points}</span>
                  <span className="price-lbl">Like kerak</span>
                </div>
              </div>
            </div>

            <div className="detail-modal-body">
              <div className="detail-desc-box">
                <p className="detail-main-desc">{selectedReward.detail || selectedReward.desc}</p>
              </div>

              {/* Points calculation box */}
              <div className="detail-calculation-card">
                <div className="calc-row">
                  <span className="calc-label">Sizning Like'laringiz:</span>
                  <span className="calc-value font-bold">{totalScore} Like</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Kerakli Like:</span>
                  <span className="calc-value">{selectedReward.points} Like</span>
                </div>
                <div className="calc-divider" />
                <div className="calc-row calc-result-row">
                  <span className="calc-label">Holat:</span>
                  {totalScore >= selectedReward.points ? (
                    <span className="calc-status success">
                      <CheckIcon size={14} color="#28A745" /> Yetarli (Ortiqcha: +{totalScore - selectedReward.points} Like)
                    </span>
                  ) : (
                    <span className="calc-status need-more">Yana {selectedReward.points - totalScore} Like kerak</span>
                  )}
                </div>
              </div>

              {/* Progress track */}
              <div className="detail-progress-wrap">
                <div className="detail-progress-track">
                  <div
                    className={`detail-progress-fill ${totalScore >= selectedReward.points ? 'is-completed' : ''}`}
                    style={{
                      width: `${Math.min(100, Math.round((totalScore / selectedReward.points) * 100))}%`,
                    }}
                  />
                </div>
                <span className="detail-progress-caption">
                  {Math.min(100, Math.round((totalScore / selectedReward.points) * 100))}% bajarildi
                </span>
              </div>
            </div>

            <div className="detail-modal-actions">
              {totalScore >= selectedReward.points ? (
                <button
                  type="button"
                  className="btn btn-primary scale-active modal-action-btn order"
                  onClick={() => {
                    setConfirmOrderReward(selectedReward);
                  }}
                >
                  <ShoppingBagIcon size={16} /> Sovg'ani so'rash
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn ${targetRewardId === selectedReward.id ? 'btn-secondary' : 'btn-primary'} scale-active modal-action-btn`}
                  onClick={() => handleToggleTargetGoal(selectedReward)}
                >
                  {targetRewardId === selectedReward.id ? (
                    "Maqsaddan o'chirish"
                  ) : (
                    <>
                      <TargetIcon size={15} /> Maqsad qilib belgilash
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary scale-active modal-action-btn"
                onClick={() => setSelectedReward(null)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Order Modal */}
      {confirmOrderReward && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay animate-fadeIn" onClick={() => setConfirmOrderReward(null)}>
          <div className="modal-content glass confirm-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <RewardSquircle rewardId={confirmOrderReward.id} size={64} iconSize={32} />
            </div>
            <h3 className="confirm-modal-title">Sovg'ani so'rash</h3>
            <p className="confirm-modal-desc">
              <strong>"{confirmOrderReward.title}"</strong> ({confirmOrderReward.points} Like) sovg'asini olishga so'rov yubormoqchimisiz?
            </p>
            <p className="confirm-modal-hint">
              Ustozingizga dars davomida sovg'ani topshirish haqida bildirishnoma yetkaziladi.
            </p>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setConfirmOrderReward(null)}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-primary scale-active"
                onClick={() => handleConfirmOrder(confirmOrderReward)}
              >
                Ha, so'rov yuborilsin!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Requests Drawer / Modal */}
      {showRequestsDrawer && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay animate-fadeIn" onClick={() => setShowRequestsDrawer(false)}>
          <div className="modal-content glass requests-modal" onClick={(e) => e.stopPropagation()}>
            <div className="requests-modal-header">
              <h3 className="requests-modal-title">Mening so'rovlarim ({rewardRequests.length})</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowRequestsDrawer(false)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <div className="requests-modal-list">
              {rewardRequests.length > 0 ? (
                rewardRequests.map((req) => (
                  <div key={req.id} className="request-card-item">
                    <RewardSquircle rewardId={req.rewardId} size={38} iconSize={20} />
                    <div className="req-item-info">
                      <span className="req-item-title">{req.rewardTitle}</span>
                      <span className="req-item-sub">
                        {req.points} Like • {new Date(req.timestamp).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    <div className="req-item-right">
                      <span className="req-status-tag pending">Yuborilgan</span>
                      <button
                        type="button"
                        className="req-cancel-btn"
                        onClick={() => handleCancelRequest(req.id)}
                        title="Bekor qilish"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="requests-empty">Hozircha so'rovlar mavjud emas.</p>
              )}
            </div>

            <div className="requests-modal-footer">
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setShowRequestsDrawer(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .student-shop-page {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 24px;
        }

        /* Locked Background Content (Visible, blurred, unclickable) */
        .shop-content-locked {
          display: flex;
          flex-direction: column;
          gap: 14px;
          filter: blur(2.5px);
          -webkit-filter: blur(2.5px);
          opacity: 0.72;
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          transition: filter 0.3s ease, opacity 0.3s ease;
        }

        /* Blur Curtain Veil Overlay covering entire shop */
        .shop-curtain-overlay {
          position: absolute;
          inset: -4px;
          z-index: 10;
          pointer-events: none;
          background: rgba(255, 255, 255, 0.32);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          border-radius: var(--radius-2xl, 24px);
          border: 1px solid rgba(0, 113, 227, 0.1);
        }

        /* Banner at the top of the page */
        .shop-curtain-banner-top {
          position: relative;
          z-index: 25;
          display: flex;
          justify-content: center;
          width: 100%;
          margin-bottom: 8px;
        }

        /* Modern Apple-style Glassmorphism Card */
        .shop-curtain-banner {
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          max-width: 520px;
          padding: 22px 20px 20px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(0, 113, 227, 0.28);
          border-radius: 22px;
          box-shadow: 0 12px 32px -8px rgba(0, 113, 227, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.9) inset;
        }

        @keyframes curtainFloat {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-4px);
          }
        }

        .shop-curtain-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(0, 113, 227, 0.15), rgba(245, 158, 11, 0.18));
          color: var(--apple-blue, #0071E3);
          margin-bottom: 10px;
        }

        .shop-curtain-sparkle {
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 13px;
        }

        .shop-curtain-badge-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue, #0071E3);
          margin-bottom: 8px;
        }

        .shop-curtain-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 6px #f59e0b;
          animation: curtainPulse 1.8s ease-in-out infinite;
        }

        @keyframes curtainPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }

        .shop-curtain-title {
          margin: 0 0 6px;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary, #1d1d1f);
          letter-spacing: -0.01em;
          line-height: 1.3;
        }

        .shop-curtain-desc {
          margin: 0;
          font-size: 0.84rem;
          line-height: 1.45;
          color: var(--text-secondary, #6e6e73);
          max-width: 360px;
        }

        /* Wallet Banner */
        .shop-wallet-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.12), rgba(245, 158, 11, 0.1));
          border: 1px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.28);
          border-radius: var(--radius-xl, 20px);
          padding: 16px 20px;
          box-shadow: var(--shadow-sm);
          gap: 14px;
          flex-wrap: wrap;
        }

        .wallet-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wallet-like-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.16), rgba(var(--apple-blue-rgb, 0, 113, 227), 0.05));
          border: 1.5px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
          box-shadow: 0 4px 14px rgba(var(--apple-blue-rgb, 0, 113, 227), 0.2);
          flex-shrink: 0;
        }

        .wallet-like-heart {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 2px 6px rgba(0, 113, 227, 0.35));
          animation: shopLikePulse 2s ease-in-out infinite;
        }

        .wallet-like-sub-tag {
          position: absolute;
          bottom: -5px;
          right: -3px;
          background: var(--apple-blue);
          color: #FFFFFF;
          font-size: 0.55rem;
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 4px;
          letter-spacing: 0.04em;
          box-shadow: 0 1px 4px rgba(0, 113, 227, 0.4);
        }

        @keyframes shopLikePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }

        .like-chip-heart {
          display: inline-block;
          font-size: 0.75rem;
          margin-right: 2px;
          vertical-align: middle;
        }

        .wallet-text-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .wallet-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .wallet-points-row {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .wallet-points-val {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--apple-blue);
          line-height: 1;
        }

        .wallet-points-unit {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .wallet-actions-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wallet-summary-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.76rem;
          font-weight: 700;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-secondary);
        }

        .summary-chip.affordable-chip {
          background: rgba(52, 199, 89, 0.12);
          border-color: rgba(52, 199, 89, 0.3);
          color: #2E7D32;
        }

        .summary-chip.requests-chip {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.3);
          color: #B45309;
          cursor: pointer;
        }

        .select-profile-prompt-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--apple-blue);
          color: #FFFFFF;
          border: none;
          padding: 7px 14px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* Target Goal Hero Card */
        .shop-target-card {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.12), rgba(var(--apple-blue-rgb, 0, 113, 227), 0.06));
          border: 1.5px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-lg, 16px);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }

        .target-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .target-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #B45309;
        }

        .target-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
        }

        .target-change-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
        }

        .target-change-btn:hover {
          color: #FF3B30;
        }

        .target-main-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .target-icon-wrap {
          font-size: 2.2rem;
          line-height: 1;
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .target-info-wrap {
          flex: 1;
          min-width: 0;
        }

        .target-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .target-title {
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .target-points-tag {
          font-size: 0.84rem;
          font-weight: 800;
          color: #B45309;
          background: rgba(245, 158, 11, 0.15);
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .target-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
          line-height: 1.35;
        }

        .target-progress-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-bar-track {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #F59E0B, var(--apple-blue));
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }

        .progress-bar-fill.is-completed {
          background: linear-gradient(90deg, #34C759, #30D158);
        }

        .progress-labels-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .status-success-text {
          color: #2E7D32;
          font-weight: 700;
        }

        .target-achieved-box {
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px dashed rgba(245, 158, 11, 0.35);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .achieved-msg {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 600;
          color: #2E7D32;
        }

        .target-order-action-btn {
          background: #34C759;
          color: #FFFFFF;
          border: none;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* No Goal Prompt Card */
        .shop-no-goal-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(var(--apple-blue-rgb, 0, 113, 227), 0.05), var(--bg-card));
          border: 1.5px dashed rgba(var(--apple-blue-rgb, 0, 113, 227), 0.3);
          border-radius: var(--radius-lg, 16px);
          padding: 12px 16px;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }

        .no-goal-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .no-goal-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .no-goal-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .no-goal-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .no-goal-sub {
          font-size: 0.74rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        /* Filter & Search */
        .shop-filter-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .shop-search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
          padding: 0 12px;
          box-shadow: var(--shadow-sm);
        }

        .shop-search-box:focus-within {
          border-color: var(--apple-blue);
        }

        .shop-search-box .search-icon {
          color: var(--text-tertiary);
          margin-right: 8px;
          flex-shrink: 0;
        }

        .shop-search-input {
          width: 100%;
          border: none;
          background: transparent;
          padding: 10px 0;
          font-size: 0.84rem;
          color: var(--text-primary);
          outline: none;
        }

        .shop-search-box .search-clear-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
        }

        .shop-categories-scroll {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }

        .shop-categories-scroll::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 6px 13px;
          border-radius: var(--radius-full);
          font-size: 0.76rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .category-pill:hover {
          border-color: var(--apple-blue);
        }

        .category-pill.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
          font-weight: 700;
        }

        /* Rewards Grid */
        .rewards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }

        .reward-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg, 16px);
          padding: 16px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
          overflow: hidden;
        }

        .reward-card:hover {
          border-color: var(--apple-blue);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .reward-card:active {
          transform: scale(0.98);
        }

        .reward-card.can-afford {
          border-color: rgba(52, 199, 89, 0.4);
          background: linear-gradient(180deg, rgba(52, 199, 89, 0.04), var(--bg-card) 40%);
        }

        .reward-card.is-target {
          border-color: rgba(245, 158, 11, 0.5);
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), var(--shadow-sm);
        }

        .reward-card.is-grand-prize {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), var(--bg-card) 60%);
          border: 2px solid rgba(255, 193, 7, 0.6);
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.18);
        }

        .grand-prize-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, #F59E0B, #EAB308);
          color: #FFFFFF;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-align: center;
          padding: 3px 0;
          text-transform: uppercase;
        }

        .card-target-ribbon {
          position: absolute;
          top: 0;
          right: 12px;
          background: #F59E0B;
          color: #FFFFFF;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 8px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .reward-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }

        .reward-icon-badge {
          font-size: 2rem;
          line-height: 1;
        }

        .reward-points-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: var(--bg-secondary, rgba(0, 0, 0, 0.04));
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 800;
        }

        .reward-points-pill.can-afford {
          background: rgba(52, 199, 89, 0.15);
          border-color: rgba(52, 199, 89, 0.35);
          color: #2E7D32;
        }

        .reward-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .reward-category {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--apple-blue);
        }

        .reward-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }

        .reward-desc {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 2px 0 0 0;
        }

        /* Card Progress Box */
        .card-progress-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-top: 4px;
        }

        .card-progress-track {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .card-progress-fill {
          height: 100%;
          background: var(--apple-blue);
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .card-progress-fill.is-completed {
          background: #34C759;
        }

        .card-progress-text-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.7rem;
        }

        .card-progress-pct {
          font-weight: 700;
          color: var(--text-primary);
        }

        .card-progress-status {
          color: var(--text-tertiary);
          font-weight: 500;
        }

        /* Card Action Buttons */
        .reward-card-actions {
          padding-top: 8px;
          border-top: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.05));
        }

        .card-order-btn {
          width: 100%;
          background: #34C759;
          color: #FFFFFF;
          border: none;
          padding: 8px 12px;
          border-radius: var(--radius-md, 10px);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        .card-target-btn {
          width: 100%;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.08);
          color: var(--apple-blue);
          border: 1px solid rgba(var(--apple-blue-rgb, 0, 113, 227), 0.2);
          padding: 7px 12px;
          border-radius: var(--radius-md, 10px);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .card-target-btn.is-active-target {
          background: rgba(245, 158, 11, 0.12);
          color: #B45309;
          border-color: rgba(245, 158, 11, 0.3);
        }

        /* Empty State */
        .shop-empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          gap: 8px;
        }

        .empty-icon {
          font-size: 2.4rem;
        }

        .empty-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .empty-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0 0 10px 0;
        }

        /* Detail Modal */
        .shop-detail-modal {
          max-width: 440px;
          padding: 22px;
          border-radius: var(--radius-xl, 22px);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .detail-icon-circle {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          flex-shrink: 0;
        }

        .detail-header-info {
          flex: 1;
          min-width: 0;
        }

        .detail-category {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--apple-blue);
        }

        .detail-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 2px 0 4px 0;
        }

        .detail-price-badge {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .price-num {
          font-size: 0.92rem;
          font-weight: 800;
          color: var(--apple-blue);
        }

        .price-lbl {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .detail-modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-main-desc {
          font-size: 0.86rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .detail-calculation-card {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
        }

        .calc-label {
          color: var(--text-secondary);
        }

        .calc-value {
          color: var(--text-primary);
        }

        .calc-divider {
          height: 1px;
          background: var(--border-color);
          margin: 2px 0;
        }

        .calc-status.success {
          color: #2E7D32;
          font-weight: 700;
        }

        .calc-status.need-more {
          color: #D97706;
          font-weight: 700;
        }

        .detail-progress-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-progress-track {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .detail-progress-fill {
          height: 100%;
          background: var(--apple-blue);
          border-radius: var(--radius-full);
        }

        .detail-progress-fill.is-completed {
          background: #34C759;
        }

        .detail-progress-caption {
          font-size: 0.72rem;
          color: var(--text-tertiary);
          text-align: right;
        }

        .detail-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
        }

        .modal-action-btn {
          flex: 1;
        }

        .modal-action-btn.order {
          background: #34C759;
          border-color: #34C759;
        }

        /* Confirm Order Modal */
        .confirm-order-modal {
          max-width: 380px;
          text-align: center;
          padding: 24px 20px;
          border-radius: var(--radius-xl, 20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .confirm-modal-icon {
          font-size: 2.8rem;
          line-height: 1;
        }

        .confirm-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .confirm-modal-desc {
          font-size: 0.86rem;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }

        .confirm-modal-hint {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.35;
        }

        .confirm-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          margin-top: 10px;
        }

        .confirm-modal-actions button {
          flex: 1;
        }

        /* Requests Drawer Modal */
        .requests-modal {
          max-width: 420px;
          padding: 20px;
          border-radius: var(--radius-xl, 20px);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .requests-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .requests-modal-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .requests-modal-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
        }

        .request-card-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 12px);
        }

        .req-item-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        .req-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .req-item-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .req-item-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .req-item-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .req-status-tag.pending {
          font-size: 0.68rem;
          font-weight: 700;
          color: #B45309;
          background: rgba(245, 158, 11, 0.12);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .req-cancel-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.8rem;
          padding: 2px;
        }

        .req-cancel-btn:hover {
          color: #FF3B30;
        }

        .requests-empty {
          text-align: center;
          padding: 20px;
          color: var(--text-tertiary);
          font-size: 0.84rem;
        }

        .requests-modal-footer {
          display: flex;
          justify-content: flex-end;
        }

        /* Dark Mode Adjustments */
        [data-theme="dark"] .shop-wallet-banner {
          background: linear-gradient(135deg, rgba(138, 180, 248, 0.12), rgba(245, 158, 11, 0.08));
          border-color: rgba(138, 180, 248, 0.25);
        }

        [data-theme="dark"] .shop-target-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(138, 180, 248, 0.06));
          border-color: rgba(245, 158, 11, 0.4);
        }

        [data-theme="dark"] .shop-no-goal-card {
          background: linear-gradient(135deg, rgba(138, 180, 248, 0.08), var(--bg-card));
          border-color: rgba(138, 180, 248, 0.3);
        }
        [data-theme="dark"] .no-goal-icon-box {
          background: rgba(138, 180, 248, 0.15);
        }

        [data-theme="dark"] .reward-card,
        [data-theme="dark"] .shop-search-box,
        [data-theme="dark"] .category-pill {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .progress-bar-track,
        [data-theme="dark"] .card-progress-track,
        [data-theme="dark"] .detail-progress-track {
          background: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .reward-points-pill.can-afford,
        [data-theme="dark"] .summary-chip.affordable-chip {
          background: rgba(129, 201, 149, 0.18);
          border-color: rgba(129, 201, 149, 0.4);
          color: #81C995;
        }

        [data-theme="dark"] .summary-chip.requests-chip,
        [data-theme="dark"] .target-badge-pill,
        [data-theme="dark"] .target-points-tag {
          color: #FBBF24;
        }

        [data-theme="dark"] .target-icon-wrap {
          background: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .detail-calculation-card,
        [data-theme="dark"] .request-card-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .card-target-btn {
          background: rgba(138, 180, 248, 0.1);
          color: #8AB4F8;
          border-color: rgba(138, 180, 248, 0.25);
        }

        [data-theme="dark"] .reward-squircle-box.theme-blue {
          background: rgba(0, 113, 227, 0.22) !important;
          color: #58A6FF !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-purple {
          background: rgba(175, 82, 222, 0.22) !important;
          color: #D08BF8 !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-amber {
          background: rgba(255, 149, 0, 0.22) !important;
          color: #FFB340 !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-teal {
          background: rgba(0, 199, 190, 0.22) !important;
          color: #4DE6DC !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-emerald {
          background: rgba(52, 199, 89, 0.22) !important;
          color: #4CD964 !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-coral {
          background: rgba(255, 59, 48, 0.22) !important;
          color: #FF6459 !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-cyan {
          background: rgba(50, 173, 230, 0.22) !important;
          color: #5AC8FA !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-indigo {
          background: rgba(88, 86, 214, 0.22) !important;
          color: #7D7AFF !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-pink {
          background: rgba(255, 45, 85, 0.22) !important;
          color: #FF6482 !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-orange {
          background: rgba(255, 149, 0, 0.22) !important;
          color: #FFA726 !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-slate {
          background: rgba(94, 92, 230, 0.22) !important;
          color: #8E8CFA !important;
        }
        [data-theme="dark"] .reward-squircle-box.theme-gold {
          background: linear-gradient(135deg, rgba(255, 214, 10, 0.35), rgba(255, 149, 0, 0.25)) !important;
          color: #FBBF24 !important;
        }

        /* Dark mode overrides for blur curtain */
        [data-theme="dark"] .shop-curtain-overlay {
          background: rgba(15, 23, 42, 0.45);
          border-color: rgba(138, 180, 248, 0.15);
        }
        [data-theme="dark"] .shop-curtain-banner {
          background: rgba(26, 34, 52, 0.88);
          border-color: rgba(138, 180, 248, 0.35);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }
        [data-theme="dark"] .shop-curtain-icon-wrap {
          background: linear-gradient(135deg, rgba(138, 180, 248, 0.2), rgba(245, 158, 11, 0.2));
          color: #8ab4f8;
        }
        [data-theme="dark"] .shop-curtain-badge-tag {
          background: rgba(138, 180, 248, 0.15);
          color: #8ab4f8;
        }
        [data-theme="dark"] .shop-curtain-title {
          color: #f1f5f9;
        }
        [data-theme="dark"] .shop-curtain-desc {
          color: #94a3b8;
        }

        /* Responsive Mobile adjustments */
        @media (max-width: 540px) {
          .shop-curtain-banner-top {
            margin-bottom: 6px;
          }
          .shop-curtain-banner {
            padding: 18px 14px 16px;
            border-radius: 18px;
          }
          .shop-curtain-title {
            font-size: 1.05rem;
          }
          .shop-curtain-desc {
            font-size: 0.8rem;
          }
          .shop-curtain-icon-wrap {
            width: 42px;
            height: 42px;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}
