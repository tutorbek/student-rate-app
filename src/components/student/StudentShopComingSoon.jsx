import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RewardSquircle } from './StudentIcons';

const REWARDS_CATALOG = [
  {
    id: 'pen_set',
    title: "Ruchka to'plami",
    points: 30,
    category: "Yozuv qurollari",
    categoryKey: 'stationery',
    stock: "Mavjud: 15 ta",
    desc: "Sifatli gel ruchkalar to'plami (turli ranglarda)",
    detail: "Darslarda qulay va chiroyli yozish uchun sifatli rang-barang gel ruchkalar to'plami.",
  },
  {
    id: 'sticker_pack',
    title: "Stiker paket",
    points: 40,
    category: "Yozuv & Anjom",
    categoryKey: 'stationery',
    stock: "Mavjud: 25 ta",
    desc: "Robot va texnologiya mavzusidagi vinil stikerlar",
    detail: "Noutbuk, telefon g'ilofi va daftarlarga yopishtirish uchun zamonaviy robot va texnologiya mavzusidagi stikerlar.",
  },
  {
    id: 'notebook',
    title: "Note daftar",
    points: 60,
    category: "Daftar & Kundalik",
    categoryKey: 'stationery',
    stock: "Mavjud: 12 ta",
    desc: "Qattiq muqovali zamonaviy kundalik daftar",
    detail: "Darslarda sxema, dastur kodlari va yangi bilimlarni qayd qilib borish uchun qattiq muqovali, qulay formatdagi daftar.",
  },
  {
    id: 'brand_pen_notebook',
    title: "Brend ruchka + Bloknot",
    points: 80,
    category: "Sovg'alar",
    categoryKey: 'stationery',
    stock: "Mavjud: 8 ta",
    desc: "Metall ruchka va brendli bloknot to'plami",
    detail: "Epchil Robot logotipi tushirilgan sifatli metall ruchka hamda maxsus brendli qulay bloknot to'plami.",
  },
  {
    id: 'book_dictionary',
    title: "Lug'at / Kitob",
    points: 90,
    category: "Kitoblar",
    categoryKey: 'stationery',
    stock: "Mavjud: 10 ta",
    desc: "Chet tili lug'ati yoki qiziqarli kitob",
    detail: "O'quvchi xohishiga ko'ra tanlanadigan chet tili lug'ati yoki dunyoqarashni kengaytiruvchi eng sara kitob.",
  },
  {
    id: 'pizza_day',
    title: "Pitsa kuni",
    points: 100,
    category: "Ziyofat",
    categoryKey: 'party',
    stock: "Har dars mavjud",
    desc: "Darsdan keyin do'stlar bilan pitsa ziyofati",
    detail: "Dars yakunida guruhdoshlar va do'stlar bilan birgalikda issiq va mazali pitsa yeb maroqli hordiq chiqarish imkoniyati!",
  },
  {
    id: 'full_writing_kit',
    title: "To'liq yozuv to'plami",
    points: 130,
    category: "Yozuv to'plami",
    categoryKey: 'stationery',
    stock: "Mavjud: 6 ta",
    desc: "Ruchka, qalam, marker, o'chirg'ich, chizg'ich",
    detail: "O'quvchi uchun barcha kerakli yozuv va chizmachilik anjomlarini o'zida jamlagan universal to'plam.",
  },
  {
    id: 'gaming_hour',
    title: "O'yin soati",
    points: 150,
    category: "Ko'ngilochar",
    categoryKey: 'party',
    stock: "Har dars mavjud",
    desc: "Darsning oxirgi 20 daqiqasi — o'yin yoki poyga",
    detail: "Darsning so'nggi 20 daqiqasida kompyuter o'yinlari o'ynash yoki robot-mashinalar o'rtasida qizg'in poyga uyushtirish ruxsati.",
  },
  {
    id: 'school_backpack',
    title: "Maktab sumkasi",
    points: 200,
    category: "Sumka & Papka",
    categoryKey: 'gadgets',
    stock: "Mavjud: 5 ta",
    desc: "Sifatli papka yoki zamonaviy ryukzak",
    detail: "Kitoblar, daftarlar va noutbuk/planshetni xavfsiz tashish uchun qulay, yengil va mustahkam ryukzak.",
  },
  {
    id: 'earbuds',
    title: "Simsiz quloqchin",
    points: 250,
    category: "Gadjet",
    categoryKey: 'gadgets',
    stock: "Mavjud: 4 ta",
    desc: "Sifatli simsiz audio quloqchin",
    detail: "Musiqa tinglash, audio darslar va videolarni tomosha qilish uchun yuqori ovoz sifatiga ega zamonaviy simsiz quloqchin.",
  },
  {
    id: 'powerbank',
    title: "Powerbank",
    points: 350,
    category: "Elektronika",
    categoryKey: 'gadgets',
    stock: "Mavjud: 4 ta",
    desc: "Ixcham tashqi akkumulyator",
    detail: "Telefon yoki boshqa qurilmalarni yo'lda hamda dars davomida qulay quvvatlash imkonini beruvchi ixcham tashqi akkumulyator.",
  },
  {
    id: 'smartwatch',
    title: "Smart soat",
    points: 600,
    category: "Smart gadjet",
    categoryKey: 'gadgets',
    stock: "Mavjud: 2 ta",
    desc: "Zamonaviy smart fitnes braslet",
    detail: "Qadamlar, vaqt, xabarnomalarni ko'rsatuvchi, sport va kundalik faollikni kuzatuvchi nufuzli smart gadjet.",
  },
  {
    id: 'year_champion',
    title: "Yilning chempioni",
    points: 1000,
    category: "Bosh mukofot",
    categoryKey: 'champion',
    stock: "1 ta maxsus sovrin",
    desc: "Oltin kubok + sertifikat + maxsus premium sovg'a",
    detail: "Yillik kurs yakunida eng yuksak natija ko'rsatgan 1-o'rin sohibiga topshiriladigan muhtasham oltin kubok, sertifikat va premium sovg'a!",
  },
];

const CATEGORIES = [
  { key: 'all', label: "Barchasi" },
  { key: 'affordable', label: "Menga yetarlilar" },
  { key: 'stationery', label: "Yozuv & O'quv" },
  { key: 'party', label: "Ziyofat & O'yin" },
  { key: 'gadgets', label: "Gadjetlar" },
  { key: 'champion', label: "Bosh sovrin" },
];

const PROMO_SLIDES = [
  {
    id: 'rewards_motivation',
    eyebrow: "FAOL TA'LIM DASTURI",
    headline: "Vazifalarni 100% bajarib, orzuingizdagi sovg'aga ega bo'ling",
    sub: "Har bir to'plangan Like sizni do'kondagi mukofotlarga yaqinlashtiradi.",
    bgClass: 'slide-card-bg-0',
  },
  {
    id: 'target_goal',
    eyebrow: "ORZU MAQSADINI BELGILANG",
    headline: "O'zingiz yoqtirgan sovg'ani tanlang va unga intiling",
    sub: "Har qanday sovg'ani tanlab, shaxsiy orzu maqsad qilib belgilang.",
    bgClass: 'slide-card-bg-1',
  },
  {
    id: 'grand_champion',
    eyebrow: "YILNING BOSH SOVRINI",
    headline: "Yil chempioni bo'ling va Oltin kubokni qo'lga kiriting",
    sub: "Eng ko'p Like to'plagan 1-o'quvchiga maxsus premium sovg'a beriladi.",
    bgClass: 'slide-card-bg-2',
  },
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

  // Interactive Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (isSlidePaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSlidePaused]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      triggerHaptic('light');
      if (diff > 0) {
        setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
      }
    }
    setTouchStartX(null);
  };

  // Student total points
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
      setTargetRewardId(null);
      setRewardRequests([]);
      return;
    }
    const studentIdStr = String(pinnedStudent.id);
    try {
      const savedGoal = localStorage.getItem(`rsa_target_goal_${studentIdStr}`);
      setTargetRewardId(savedGoal || null);
    } catch {}

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

  // Escape key handler for open modals
  useEffect(() => {
    if (!selectedReward && !confirmOrderReward && !showRequestsDrawer) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedReward(null);
        setConfirmOrderReward(null);
        setShowRequestsDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReward, confirmOrderReward, showRequestsDrawer]);

  const targetReward = useMemo(() => {
    if (!targetRewardId) return null;
    return REWARDS_CATALOG.find((r) => r.id === targetRewardId) || null;
  }, [targetRewardId]);

  const minRewardPoints = useMemo(() => {
    return Math.min(...REWARDS_CATALOG.map((r) => r.points));
  }, []);

  const filteredRewards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return REWARDS_CATALOG.filter((item) => {
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchDesc = (item.desc || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchDesc) return false;
      }
      if (activeCategory === 'affordable') {
        if (!pinnedStudent || totalScore < item.points) return false;
      } else if (activeCategory !== 'all') {
        if (item.categoryKey !== activeCategory) return false;
      }
      return true;
    });
  }, [activeCategory, pinnedStudent, totalScore, searchQuery]);

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
      setSelectedReward(null);
      if (showToast) {
        showToast(`"${reward.title}" orzu mukofotingiz sifatida belgilandi!`, 'success');
      }
    } catch {}
  };

  const handleRemoveTarget = () => {
    triggerHaptic('light');
    if (!pinnedStudent) return;
    const studentIdStr = String(pinnedStudent.id);
    try {
      localStorage.removeItem(`rsa_target_goal_${studentIdStr}`);
      setTargetRewardId(null);
      setSelectedReward(null);
      if (showToast) {
        showToast("Orzu mukofot tanlovi bekor qilindi.", 'info');
      }
    } catch {}
  };

  const handleConfirmOrder = (reward) => {
    if (!pinnedStudent) return;
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
    setSelectedReward(null);
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

  const targetPercent = useMemo(() => {
    if (!targetReward) return 0;
    return Math.min(100, Math.round((totalScore / targetReward.points) * 100));
  }, [totalScore, targetReward]);

  return (
    <div className="native-shop-container animate-fadeIn">
      {/* Top Floating/Sliding Promo Carousel */}
      <div
        className="shop-carousel-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsSlidePaused(true)}
        onMouseLeave={() => setIsSlidePaused(false)}
      >
        <div className="shop-carousel-viewport">
          <div
            className="shop-carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {PROMO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`shop-slide-card ${slide.bgClass}`}
              >
                <div className="slide-card-header">
                  <span className="slide-eyebrow-pill">{slide.eyebrow}</span>
                  <div className="slide-eyebrow-actions">
                    {pinnedStudent && rewardRequests.length > 0 && idx === 0 && (
                      <button
                        type="button"
                        className="hero-requests-pill-btn"
                        onClick={() => setShowRequestsDrawer(true)}
                        title="So'rovlar ro'yxatini ko'rish"
                      >
                        So'rovlarim ({rewardRequests.length})
                      </button>
                    )}
                    {pinnedStudent && (
                      <span className="slide-balance-pill">
                        {totalScore} Like mavjud
                      </span>
                    )}
                  </div>
                </div>

                <div className="slide-card-body">
                  <h2 className="slide-headline">
                    {slide.headline}
                  </h2>
                  <p className="slide-sub">
                    {slide.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="shop-carousel-dots" role="tablist" aria-label="Promo slaydlar">
          {PROMO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              className={`shop-carousel-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                setCurrentSlide(idx);
              }}
              aria-label={`Slayd ${idx + 1}: ${slide.eyebrow}`}
              aria-selected={idx === currentSlide}
              role="tab"
            />
          ))}
        </div>
      </div>

      {/* Dream Target Mini Progress Bar */}
      {targetReward && pinnedStudent && (
        <div className="shop-target-tracker-card animate-fadeIn">
          <div className="target-tracker-header">
            <span className="target-goal-title">
              Orzu mukofot: <strong>{targetReward.title}</strong>
            </span>
            <span className="target-goal-stats">
              {totalScore} / {targetReward.points} Like ({targetPercent}%)
            </span>
          </div>
          <div className="target-progress-track">
            <div
              className="target-progress-bar"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="shop-search-wrapper">
        <div className="shop-search-bar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-svg" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="shop-search-input"
            placeholder="Sovg'alarni qidiring (ruchka, ryukzak, soat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            aria-label="Sovg'alarni qidirish"
          />
          {searchQuery && (
            <button
              type="button"
              className="shop-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Qidiruvni tozalash"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Strip (Active Gold Pill like Image 2) */}
      <div className="shop-categories-wrapper" role="tablist">
        <div className="shop-categories-scroll">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`shop-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat.key);
                }}
                role="tab"
                aria-selected={isActive}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Mobile / Multi-column Desktop Products Grid (Image 2 style) */}
      <div className="shop-products-grid">
        {filteredRewards.length > 0 ? (
          filteredRewards.map((reward) => {
            const isTarget = targetRewardId === reward.id;
            const canAfford = pinnedStudent && totalScore >= reward.points;

            return (
              <button
                key={reward.id}
                type="button"
                className={`shop-product-card ${isTarget ? 'is-target-card' : ''} ${canAfford ? 'is-affordable' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedReward(reward);
                }}
                aria-label={`${reward.title}, narxi ${reward.points} Like`}
              >
                {/* Soft Tinted Image Container */}
                <div className="product-image-container">
                  <RewardSquircle rewardId={reward.id} size={64} iconSize={32} />

                  {isTarget && (
                    <span className="product-target-badge" title="Orzu mukofot sifatida belgilangan">
                      Orzu
                    </span>
                  )}

                  {canAfford && !isTarget && (
                    <span className="product-affordable-badge" title="Bu sovg'a uchun Like'ingiz yetarli!">
                      Yetarli
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="product-info-block">
                  <h3 className="product-card-title">{reward.title}</h3>
                  <span className="product-stock-text">{reward.stock}</span>
                </div>

                {/* Price Pill at Bottom (Inter Nation Image 2 style) */}
                <div className="product-price-row">
                  <div className="product-price-pill">
                    <span className="price-coin-icon">🪙</span>
                    <span className="price-points-val">{reward.points.toLocaleString()}</span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="shop-empty-state">
            {activeCategory === 'affordable' ? (
              !pinnedStudent ? (
                <>
                  <div className="shop-empty-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="shop-empty-title">Profil tanlanmagan</h3>
                  <p className="shop-empty-desc">
                    Mavjud Like balansingizga mos keladigan sovg'alarni ko'rish uchun avval o'z profilingizni tanlang.
                  </p>
                  {onOpenProfilePicker && (
                    <button
                      type="button"
                      className="shop-empty-action-btn"
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenProfilePicker();
                      }}
                    >
                      Profilni tanlash ▾
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="shop-empty-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <line x1="12" y1="22" x2="12" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                  </div>
                  <div className="shop-empty-badge">
                    <span>Balansingiz: {totalScore} Like</span>
                  </div>
                  <h3 className="shop-empty-title">Hozircha yetarli Like mavjud emas</h3>
                  <p className="shop-empty-desc">
                    {totalScore < minRewardPoints ? (
                      <>
                        Eng arzon sovg'a <strong>{minRewardPoints} Like</strong>. Yana <strong>{minRewardPoints - totalScore} Like</strong> to'plab, birinchi sovg'angizga ega bo'lishingiz mumkin!
                      </>
                    ) : (
                      "Qidiruv mezonlari bo'yicha sizga yetarli sovg'a topilmadi."
                    )}
                  </p>
                  <button
                    type="button"
                    className="shop-empty-action-btn"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveCategory('all');
                      setSearchQuery('');
                    }}
                  >
                    Barcha sovg'alarni ko'rish
                  </button>
                </>
              )
            ) : searchQuery ? (
              <>
                <div className="shop-empty-icon-wrap neutral">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="shop-empty-title">Sovg'a topilmadi</h3>
                <p className="shop-empty-desc">
                  &ldquo;{searchQuery}&rdquo; so'rovi bo'yicha hech qanday mahsulot topilmadi. So'zni to'g'ri yozganingizni tekshiring yoki qidiruvni tozalang.
                </p>
                <button
                  type="button"
                  className="shop-empty-action-btn secondary"
                  onClick={() => {
                    triggerHaptic('light');
                    setSearchQuery('');
                  }}
                >
                  Qidiruvni tozalash
                </button>
              </>
            ) : (
              <>
                <div className="shop-empty-icon-wrap neutral">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <h3 className="shop-empty-title">Sovg'alar topilmadi</h3>
                <p className="shop-empty-desc">
                  Ushbu toifada hozircha sovg'alar mavjud emas.
                </p>
                <button
                  type="button"
                  className="shop-empty-action-btn secondary"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveCategory('all');
                  }}
                >
                  Barcha sovg'alarni ko'rish
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reward Details & Goal Modal */}
      {selectedReward && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setSelectedReward(null)}>
          <div
            className="sheet-container animate-slideUpSheet shop-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selectedReward.title}
          >
            <div className="sheet-drag-zone">
              <div className="sheet-drag-handle" />
            </div>

            <div className="sheet-header">
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setSelectedReward(null)}
                aria-label="Yopish"
              >
                ✕
              </button>
              <div className="sheet-title-wrap sheet-title-center">
                <h3 className="sheet-title">{selectedReward.title}</h3>
                <span className="sheet-sub">{selectedReward.category}</span>
              </div>
              <div style={{ width: 36 }} />
            </div>

            <div className="sheet-body shop-detail-body">
              <div className="detail-visual-center">
                <RewardSquircle rewardId={selectedReward.id} size={92} iconSize={46} />
              </div>

              <div className="detail-price-banner">
                <span className="detail-coin">🪙</span>
                <span className="detail-price-val">{selectedReward.points} Like</span>
                <span className="detail-stock-badge">{selectedReward.stock}</span>
              </div>

              <p className="detail-description">{selectedReward.detail || selectedReward.desc}</p>

              {/* Progress Toward Goal */}
              {pinnedStudent ? (
                <div className="detail-progress-card">
                  <div className="progress-header">
                    <span>To'plangan: {totalScore} Like</span>
                    <span>Kerak: {selectedReward.points} Like</span>
                  </div>
                  <div className="detail-progress-track">
                    <div
                      className="detail-progress-fill"
                      style={{
                        width: `${Math.min(100, Math.round((totalScore / selectedReward.points) * 100))}%`
                      }}
                    />
                  </div>
                  <span className="progress-status-text">
                    {totalScore >= selectedReward.points
                      ? "Tabriklaymiz! Sizda ushbu sovg'a uchun yetarli Like mavjud."
                      : `Yana ${selectedReward.points - totalScore} Like to'plashingiz kerak (${Math.round((totalScore / selectedReward.points) * 100)}%)`}
                  </span>
                </div>
              ) : (
                <div className="detail-guest-notice">
                  <span>O'z Like'laringizni bilish uchun profilingizni tanlang.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="detail-actions-col">
                {pinnedStudent && totalScore >= selectedReward.points && (
                  <button
                    type="button"
                    className="detail-order-btn"
                    onClick={() => {
                      triggerHaptic('medium');
                      setConfirmOrderReward(selectedReward);
                    }}
                  >
                    🎁 Sovg'ani so'rash ({selectedReward.points} Like)
                  </button>
                )}

                {targetRewardId === selectedReward.id ? (
                  <button
                    type="button"
                    className="detail-cancel-target-btn"
                    onClick={handleRemoveTarget}
                  >
                    Orzu mukofotdan chiqarish
                  </button>
                ) : (
                  <button
                    type="button"
                    className={totalScore >= selectedReward.points ? "detail-secondary-target-btn" : "detail-set-target-btn"}
                    onClick={() => handleSetTarget(selectedReward)}
                  >
                    Orzu mukofot sifatida belgilash
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Order Confirmation Modal */}
      {confirmOrderReward && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setConfirmOrderReward(null)}>
          <div
            className="sheet-container animate-slideUpSheet confirm-order-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="confirm-order-header">
              <h3 className="confirm-order-title">Sovg'ani so'rashni tasdiqlaysizmi?</h3>
              <p className="confirm-order-desc">
                <strong>"{confirmOrderReward.title}"</strong> sovg'asi uchun ustozingizga so'rov yuboriladi.
              </p>
              <div className="confirm-order-points-badge">
                🪙 {confirmOrderReward.points} Like sarflanadi
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
              <button
                type="button"
                className="dialog-btn order-confirm-btn"
                onClick={() => handleConfirmOrder(confirmOrderReward)}
              >
                Ha, so'rov yuborish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Requests Drawer / Modal */}
      {showRequestsDrawer && typeof document !== 'undefined' && createPortal(
        <div className="sheet-backdrop" onClick={() => setShowRequestsDrawer(false)}>
          <div
            className="sheet-container animate-slideUpSheet requests-sheet-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mening so'rovlarim"
          >
            <div className="sheet-drag-zone">
              <div className="sheet-drag-handle" />
            </div>

            <div className="sheet-header">
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setShowRequestsDrawer(false)}
                aria-label="Yopish"
              >
                ✕
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
                    <RewardSquircle rewardId={req.rewardId} size={44} iconSize={24} />
                    <div className="req-item-info">
                      <span className="req-item-title">{req.rewardTitle}</span>
                      <span className="req-item-sub">
                        🪙 {req.points} Like • {new Date(req.timestamp).toLocaleDateString('uz-UZ')}
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
                        ✕
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
