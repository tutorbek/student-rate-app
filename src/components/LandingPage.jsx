import React, { useState, useEffect } from 'react';

// Platform Screens data with high-res screenshots & browser metadata
const SOHUB_SCREENS = [
  {
    id: 1,
    name: "Guruhlar",
    title: "Guruhlar boshqaruvi",
    path: "/groups",
    src: "/screens/1.png",
    alt: "Guruhlar ro'yxati boshqaruvi",
    tag: "O'quv guruhlari"
  },
  {
    id: 2,
    name: "Dashboard",
    title: "Boshqaruv paneli",
    path: "/dashboard",
    src: "/screens/2.png",
    alt: "Boshqaruv paneli Dashboard",
    tag: "Statistika & Reyting"
  },
  {
    id: 3,
    name: "Jonli Reyting",
    title: "Reyting va Leaderboard",
    path: "/leaderboard",
    src: "/screens/3.png",
    alt: "Jonli Reyting va Leaderboard",
    tag: "Top-3 Shohsupasi"
  },
  {
    id: 4,
    name: "Davomat",
    title: "Tezkor davomat belgilash",
    path: "/attendance",
    src: "/screens/4.png",
    alt: "Tezkor Davomat belgilash",
    tag: "1-Soniya davomat"
  },
  {
    id: 5,
    name: "Dars Jadvali",
    title: "Haftalik dars jadvali",
    path: "/schedule",
    src: "/screens/5.png",
    alt: "Haftalik dars jadvali",
    tag: "Taqvim & darslar"
  },
  {
    id: 6,
    name: "Davomat Jurnali",
    title: "Oylik davomat va statistika",
    path: "/journal",
    src: "/screens/6.png",
    alt: "Davomat jurnali va statistika",
    tag: "Excel & PDF eksport"
  },
  {
    id: 7,
    name: "Like Tarixi",
    title: "Jonli like berish tarixi",
    path: "/likes-history",
    src: "/screens/7.png",
    alt: "Jonli likelar tarixi auditi",
    tag: "Shaffof audit"
  },
];

// Core Platform Features (Line Cards)
const CORE_FEATURES = [
  {
    badge: "Motivatsiya & Havas",
    title: "Jonli Oylik va Umumiy Reyting",
    description: "Top-3 shohsupasi va jonli Like jadvali orqali o'quvchilarda darsga bo'lgan ichki qiziqish va intilishni yuksaltiring.",
    color: "#f6511d",
  },
  {
    badge: "1-Soniya Baholash",
    title: "Tezkor Rag'bat va Davomat",
    description: "Qog'oz jurnallardan xalos bo'ling. Dars davomida 1 ta bosish bilan 'Like' bering va davomatni bir necha soniyada belgilang.",
    color: "#ffb400",
  },
  {
    badge: "Jamoaviy Ruh",
    title: "Guruhlararo Sog'lom Raqobat",
    description: "O'quvchilarni jamoaviy birlashtiring. Guruhlar bo'yicha umumiy reyting orqali do'stona va faol ta'lim muhitini yarating.",
    color: "#00a6ed",
  },
];




// Ustozlar uchun 3 bosqichli narx tizimi (o'quvchilar soniga ko'ra)
const PRICING_PLANS = [
  {
    id: "tier_50",
    name: "0–50 O'quvchi",
    badge: "BOSHLANG'ICH",
    price: "50 000 so'm",
    period: "/ oyiga",
    description: "Yakka repetitorlar va kichik guruh o'qituvchilari uchun eng hamyonbop boshlang'ich tarif.",
    features: [
      "Barcha 7 moduldan to'liq foydalanish",
      "Guruhlar boshqaruvi va parolli kirish",
      "Davomat, taqvim va jonli reyting",
      "Standart yordam (chat/bot orqali)"
    ],
    ctaText: "Tanlash",
    ctaLink: "https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%200-50%20o'quvchi%20tarifini%20(50%20000%20so'm/oy)%20tanlamoqchi%20edim.",
    highlighted: false
  },
  {
    id: "tier_100",
    name: "50–100 O'quvchi",
    badge: "TAVSIYA ETILADI",
    price: "100 000 so'm",
    period: "/ oyiga",
    description: "Bir nechta guruhlari bor professional repetitorlar va faol ustozlar uchun eng maqbul tanlov.",
    features: [
      "Barcha 7 modul + cheksiz guruhlar",
      "To'liq reyting va Top-3 shohsupasi",
      "Davomat, taqvim va avtomatik foizlar",
      "Ustuvor tezkor texnik yordam"
    ],
    ctaText: "Tanlash",
    ctaLink: "https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%2050-100%20o'quvchi%20tarifini%20(100%20000%20so'm/oy)%20tanlamoqchi%20edim.",
    highlighted: true
  },
  {
    id: "tier_200",
    name: "100–200 O'quvchi",
    badge: "PROFESSIONAL",
    price: "200 000 so'm",
    period: "/ oyiga",
    description: "Ko'p sonli o'quvchilarga ega tajribali ustozlar va yirik guruhlar uchun to'liq imkoniyatlar to'plami.",
    features: [
      "Barcha 7 modulga to'liq cheksiz kirish",
      "Guruhlararo umumiy reyting va tahlil",
      "Excel (.csv) va PDF hisobotlar",
      "24/7 VIP darajadagi texnik xizmat"
    ],
    ctaText: "Tanlash",
    ctaLink: "https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20100-200%20o'quvchi%20tarifini%20(200%20000%20so'm/oy)%20tanlamoqchi%20edim.",
    highlighted: false
  }
];



// 4. Testimonials (Mijozlar fikri - Edge-to-Edge 3 Ustunli To'liq Oq - #FFFFFF)
const TESTIMONIALS = [
  {
    author: "Diyorbek Rahimov",
    role: "Direktor",
    school: "ZiyoNur LC",
    quote: "Epchil Robot'ni joriy qilganimizdan so'ng o'quvchilar darsga kechikmay keladigan va savollarga javob berishga qo'l ko'tarib talashadigan bo'lib qolishdi. Top-3 shohsupasi bolalarda aqlbovar qilmas havas uyg'otdi!",
    metricValue: "+40%",
    metricLabel: "Darsdagi faollik oshishi",
    accent: "#00A6ED"
  },
  {
    author: "Dilshod Rizayev",
    role: "Bosh o'qituvchi",
    school: "Insight Plus",
    quote: "Qog'oz jurnallarga ruchka bilan belgi qo'yish va oy oxirida foiz hisoblab o'tirishdan butunlay qutuldik. Bitta telefon orqali 1 soniyada Like beraman, qolgan barcha jadvallarni platformaning o'zi avtomatik tayyorlaydi.",
    metricValue: "15 daqiqa",
    metricLabel: "Har darsdan tejalgan vaqt",
    accent: "#0171E3"
  },
  {
    author: "Azizbek Mansurov",
    role: "O'quv ishlari koordinatori",
    school: "Yuksalish School",
    quote: "Guruhlar o'rtasidagi reyting tufayli o'quvchilar bir-biriga yordam bera boshladi — jamoaviy ruh paydo bo'ldi. Ota-onalar ham farzandining oylik natijalaridan va davomatidan juda mamnun.",
    metricValue: "98%",
    metricLabel: "Ota-onalar mamnuniyati",
    accent: "#D97706"
  }
];

// 6. FAQ (2 ustunli ochiq savol-javoblar)
const FAQS = [
  {
    q: "Epchil Robot platformasidan foydalanish qanchalik oson?",
    a: "Platforma Apple uslubidagi juda sodda va tushunarli interfeysga ega. O'qituvchi 5 daqiqa ichida unga to'liq o'rganib oladi va dars jarayonida ortiqcha qiyinchiliksiz foydalana oladi."
  },
  {
    q: "Dars paytida o'quvchilarga Like berish va davomat belgilash qancha vaqt oladi?",
    a: "Har bir o'quvchiga Like berish yoki davomat belgilash atigi 1 soniya vaqt oladi. Bu o'qituvchining dars o'tish ritmini buzmaydi va diqqatni chalg'itmaydi."
  },
  {
    q: "Tizimga necha nafar o'quvchi va guruh kiritish mumkin?",
    a: "Hech qanday cheklov yo'q! 1 ta kichik guruhdan tortib, 200 va undan ortiq o'quvchiga ega ustozlar barcha guruhlarini bemalol tizimda boshqarishi mumkin."
  },
  {
    q: "Ma'lumotlarimiz xavfsizligi qanday ta'minlanadi?",
    a: "Barcha ma'lumotlar xalqaro darajada shifrlangan xavfsiz bulutli serverlarda (PostgreSQL) saqlanadi. Har bir guruh uchun alohida kirish paroli o'rnatiladi va muntazam zaxira nusxasi olinadi."
  },
  {
    q: "O'quvchilar soni bo'yicha qaysi tarifni tanlash kerak?",
    a: "O'quvchilaringiz soniga qarab tanlaysiz: 0–50 ta o'quvchi uchun — 50 000 so'm/oy, 50–100 ta o'quvchi uchun — 100 000 so'm/oy, 100–200 ta o'quvchi uchun esa — 200 000 so'm/oy."
  },
  {
    q: "Tizimni guruhlarimizga sozlashda yordam berasizlarmi?",
    a: "Albatta! Mutaxassislarimiz barcha dars guruhlaringiz va o'quvchilaringizni tizimga joylashda, foydalanishni o'rgatishda boshidan oxirigacha ko'maklashadi."
  }
];

export default function LandingPage({ onNavigateToLogin }) {
  // Video tayyor bo'lguncha vaqtincha yashirilgan (tayyor bo'lganda true qilinadi)
  const SHOW_VIDEO = false;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Touch swipe gesture support for mobile screenshot showcase
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      // Swiped left -> next screen
      setActiveScreenIndex((prev) => (prev < SOHUB_SCREENS.length - 1 ? prev + 1 : 0));
    } else if (distance < -45) {
      // Swiped right -> prev screen
      setActiveScreenIndex((prev) => (prev > 0 ? prev - 1 : SOHUB_SCREENS.length - 1));
    }
  };

  // Prevent background page scrolling when Lightbox is active
  useEffect(() => {
    if (isLightboxOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isLightboxOpen]);

  useEffect(() => {
    document.documentElement.classList.add('landing-page-active');
    return () => {
      document.documentElement.classList.remove('landing-page-active');
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setActiveScreenIndex((prev) => (prev < SOHUB_SCREENS.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setActiveScreenIndex((prev) => (prev > 0 ? prev - 1 : SOHUB_SCREENS.length - 1));
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-root w-full bg-[var(--bg-primary)] text-[var(--text-primary)] relative font-sans antialiased selection:bg-[#0171E3] selection:text-white md:snap-y md:snap-proximity">
      
      {/* 1. Header & Navigation (Responsive Mobile-first Header with Slide-out Drawer) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[var(--bg-primary)]/90 dark:bg-[#202124]/90 border-b border-[var(--border-color)] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex items-center justify-between h-16 sm:h-20 xl:h-22 gap-2 min-w-0">
          
          {/* Logo Brand */}
          <div
            className="navbar-brand-section scale-active cursor-pointer shrink-0 min-h-[44px] flex items-center select-none"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <h1 className="navbar-logo-text text-lg min-[360px]:text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              EPCHIL <span className="logo-badge">ROBOT</span>
            </h1>
          </div>


          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 shrink-0">


            {/* Kirish Button */}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="group h-10 sm:h-11 xl:h-12 p-1 pl-3.5 pr-1.5 sm:pl-6 sm:pr-2 xl:pl-7 xl:pr-2.5 rounded-full bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] transition-all duration-300 ease-out flex items-center gap-2 sm:gap-3 xl:gap-3.5 cursor-pointer shadow-md active:scale-95 min-h-[44px]"
            >
              <span className="text-xs sm:text-sm xl:text-base font-semibold tracking-wide uppercase">Kirish</span>
              <span className="w-7 h-7 sm:w-8 sm:h-8 xl:w-9 xl:h-9 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* 2. Hero Section (One Full Screen) */}
      <section className="relative w-full min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] flex flex-col justify-center py-8 sm:py-12 snap-start overflow-hidden">
        <div className={`max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 w-full ${SHOW_VIDEO ? 'mb-12 sm:mb-20 2xl:mb-24' : ''}`}>
          <div className="flex flex-col items-start gap-4 sm:gap-6 max-w-5xl my-auto">
            <h1
              className="w-full text-3xl min-[360px]:text-4xl sm:text-6xl md:text-7xl lg:text-7xl 2xl:text-[5.5rem] font-black tracking-[-0.03em] leading-[1.08] sm:leading-[0.96] text-[var(--text-primary)] select-none break-words [overflow-wrap:anywhere]"
            >
              O'quvchilarni rag'batlantirishning <br className="hidden sm:inline" />
              zamonaviy usuli.
            </h1>
            
            <p className="text-sm min-[360px]:text-base sm:text-xl md:text-2xl lg:text-2xl 2xl:text-3xl text-[var(--text-secondary)] font-normal max-w-4xl mt-1 sm:mt-2 leading-relaxed">
              O'quvchilar faolligini jonli "Like"lar orqali baholang, oylik reytingni yuritib boring va sog'lom raqobat muhitini shakllantiring.
            </p>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-5 mt-2 sm:mt-4 w-full">
              {/* Primary Login Button */}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="group p-1.5 pl-5 pr-2 sm:p-2.5 sm:pl-8 sm:pr-3 lg:p-3 lg:pl-10 lg:pr-3.5 2xl:p-3.5 2xl:pl-12 2xl:pr-4 rounded-full bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] transition-all duration-300 ease-out flex items-center gap-2.5 sm:gap-4 2xl:gap-5 cursor-pointer shadow-lg active:scale-95 min-h-[48px] sm:min-h-[54px] lg:min-h-[60px] 2xl:min-h-[64px]"
              >
                <span className="text-xs sm:text-base lg:text-lg 2xl:text-xl font-semibold tracking-wider uppercase">Tizimga kirish</span>
                <span className="w-8 h-8 sm:w-11 sm:h-11 lg:w-12 lg:h-12 2xl:w-13 2xl:h-13 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => scrollToSection('pricing-section')}
                className="px-5 py-3.5 sm:px-8 sm:py-4 lg:px-10 lg:py-5 2xl:px-12 2xl:py-5.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-xs sm:text-base lg:text-lg 2xl:text-xl border border-[var(--border-color)] transition-all duration-200 cursor-pointer shadow-sm active:scale-95 min-h-[48px] sm:min-h-[54px] lg:min-h-[60px] 2xl:min-h-[64px] flex items-center"
              >
                Tariflar ↓
              </button>
            </div>
          </div>
        </div>

        {/* Video Showcase Card */}
        {SHOW_VIDEO && (
          <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16">
            <div className="rounded-2xl sm:rounded-3xl lg:rounded-[3rem] bg-[#0C1016] shadow-[0_30px_70px_rgba(0,0,0,0.3)] border border-white/10 aspect-video relative overflow-hidden flex items-center justify-center group">
            {isVideoPlaying ? (
              <iframe
                className="w-full h-full border-0 pointer-events-auto rounded-[inherit] relative z-10"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src="https://www.youtube-nocookie.com/embed/g7xkVEWrX8E?autoplay=1&controls=1&rel=0&modestbranding=1"
                title="Epchil Robot Showcase"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div
                className="w-full h-full relative cursor-pointer flex items-center justify-center"
                onClick={() => setIsVideoPlaying(true)}
              >
                <img
                  src="https://img.youtube.com/vi/g7xkVEWrX8E/maxresdefault.jpg"
                  alt="Epchil Robot Video Sharhi"
                  className="absolute inset-0 w-full h-full object-cover rounded-[inherit] group-hover:scale-[1.02] transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors duration-300 rounded-[inherit]" />
                
                <button
                  type="button"
                  className="relative z-20 w-14 h-14 min-[420px]:w-16 min-[420px]:h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-xl shadow-[0_15px_50px_rgba(0,0,0,0.4)] border border-white/60 flex items-center justify-center text-[#0C1016] group-hover:scale-110 group-active:scale-95 transition-all duration-300 cursor-pointer"
                  aria-label="Videoni ijro etish"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-[#0C1016] sm:w-7 sm:h-7">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </button>
                
                <div className="absolute bottom-3 left-3 sm:bottom-8 sm:left-8 z-20 flex items-center bg-black/70 backdrop-blur-md px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-white text-[11px] sm:text-sm font-medium border border-white/10 max-w-[85%]">
                  <span className="truncate">Epchil Robot Video Sharhi</span>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </section>

      {/* 2. Pricing Section (One Full Screen) */}
      <section
        id="pricing-section"
        className="relative w-full min-h-screen min-h-[100dvh] border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-center py-8 sm:py-12 lg:py-14 snap-start scroll-mt-16 sm:scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 w-full my-auto">
          
          {/* Section Header */}
          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <h2 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-[var(--text-primary)]">
              Darslaringizni bugunoq qulay narxda boshlang
            </h2>
          </div>

          {/* Pricing Plans Grid (3 columns for teachers) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl sm:rounded-[28px] p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 min-w-0 ${
                  plan.highlighted
                    ? 'bg-[#0C1016] text-white border-2 border-[#0171E3] shadow-2xl shadow-[#0171E3]/20 lg:-translate-y-2'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-md hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <span
                      className={`text-[10px] min-[380px]:text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        plan.highlighted
                          ? 'bg-[#0171E3] text-white'
                          : 'bg-black/10 dark:bg-white/10 text-[var(--text-primary)]'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1.5">
                    {plan.name}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed mb-4 min-h-[36px] ${
                    plan.highlighted ? 'text-white/70' : 'text-[var(--text-secondary)]'
                  }`}>
                    {plan.description}
                  </p>

                  {/* Price & Period */}
                  <div className="mb-4 pb-4 border-b border-black/10 dark:border-white/10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-2xl sm:text-3xl font-black tracking-tight break-words">
                        {plan.price}
                      </span>
                      <span className={`text-xs break-words ${
                        plan.highlighted ? 'text-white/60' : 'text-[var(--text-secondary)]'
                      }`}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 mb-5">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.highlighted ? 'bg-[#0171E3] text-white' : 'bg-green-500/20 text-green-600 dark:text-green-400'
                        }`}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className={`text-xs sm:text-sm font-medium leading-snug ${
                          plan.highlighted ? 'text-white/90' : 'text-[var(--text-primary)]'
                        }`}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <a
                  href={plan.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 sm:py-3 px-4 rounded-full font-bold text-center text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2 no-underline min-h-[42px] sm:min-h-[44px] ${
                    plan.highlighted
                      ? 'bg-[#0171E3] text-white hover:bg-[#0155AB]'
                      : 'bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF]'
                  }`}
                >
                  <span className="truncate">{plan.ctaText}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>

              </div>
            ))}
          </div>

          {/* Custom / 200+ Students Note */}
          <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-sm">
            <h4 className="text-xs sm:text-sm lg:text-base font-bold text-[var(--text-primary)]">
              200 dan ortiq o'quvchingiz yoki maxsus talablaringiz bormi?
            </h4>
            <a
              href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20200%2B%20o'quvchilar%20uchun%20maxsus%20tarif%20bo'yicha%20bog'lanayotgan%20edim."
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 rounded-full bg-[#0171E3] hover:bg-[#0155AB] text-white font-semibold text-xs transition-colors cursor-pointer no-underline flex items-center gap-1.5 shadow-sm"
            >
              <span>Bog'lanish</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>
      </section>



      {/* 3. Platform Screens Showcase (Full-Width High-Impact Display) */}
      <section
        id="platform-screens"
        className="relative w-full min-h-screen min-h-[100dvh] border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-center py-3 sm:py-5 lg:py-6 snap-start scroll-mt-16 sm:scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-[1140px] 2xl:max-w-[1200px] mx-auto px-3 sm:px-6 w-full flex flex-col justify-center my-auto">
          
          {/* Top Bar: Title + Desktop Quick Nav */}
          <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3.5">
            <h2 className="text-xl min-[360px]:text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
              Platformasi Ichkaridan
            </h2>

            {/* Quick Next/Prev pill for desktop/tablet */}
            <div className="hidden sm:flex items-center gap-1 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-1 rounded-full shadow-xs select-none">
              <button
                type="button"
                onClick={() => setActiveScreenIndex((prev) => (prev > 0 ? prev - 1 : SOHUB_SCREENS.length - 1))}
                className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Oldingi"
                title="Oldingi"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="font-mono text-xs font-semibold px-2 text-[var(--text-secondary)]">
                {activeScreenIndex + 1} / {SOHUB_SCREENS.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveScreenIndex((prev) => (prev < SOHUB_SCREENS.length - 1 ? prev + 1 : 0))}
                className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Keyingi"
                title="Keyingi"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Authentic Apple Safari Window Frame (Tightly Wrapped around Screenshot) */}
          {(() => {
            const currentScreen = SOHUB_SCREENS[activeScreenIndex];
            return (
              <div className="relative w-full">
                <div className="w-full rounded-2xl sm:rounded-[22px] border border-black/[0.12] dark:border-white/[0.15] bg-white dark:bg-[#1E1E1E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col transition-all duration-300">
                  
                  {/* macOS Safari Window Bar */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-black/[0.08] dark:border-white/10 bg-[#F6F6F6] dark:bg-[#252528] select-none shrink-0">
                    
                    {/* Left: macOS Traffic Lights + Chevrons */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] inline-block" />
                        <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] inline-block" />
                        <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] inline-block" />
                      </div>
                      
                      {/* Safari Navigation Chevrons */}
                      <div className="hidden sm:flex items-center gap-0.5 text-black/35 dark:text-white/35 ml-1">
                        <button
                          type="button"
                          onClick={() => setActiveScreenIndex((prev) => (prev > 0 ? prev - 1 : SOHUB_SCREENS.length - 1))}
                          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70 transition-colors cursor-pointer"
                          title="Oldingi"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveScreenIndex((prev) => (prev < SOHUB_SCREENS.length - 1 ? prev + 1 : 0))}
                          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70 transition-colors cursor-pointer"
                          title="Keyingi"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Center: Safari Address Pill */}
                    <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] text-xs font-mono text-[var(--text-secondary)] max-w-xs sm:max-w-md w-full mx-auto shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="font-semibold text-[var(--text-primary)] truncate">epchilrobot.uz</span>
                        <span className="opacity-40 truncate">{currentScreen.path}</span>
                      </div>
                      <span className="text-black/30 dark:text-white/30 shrink-0 hidden sm:inline">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
                        </svg>
                      </span>
                    </div>

                    {/* Right: Fullscreen Zoom */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        title="To'liq ekranda ko'rish (Kattalashtirish)"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 3 21 3 21 9" />
                          <polyline points="9 21 3 21 3 15" />
                          <line x1="21" y1="3" x2="14" y2="10" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                        <span className="hidden sm:inline">Kattalashtirish</span>
                      </button>
                    </div>
                  </div>

                  {/* Screenshot Image (Clean Edge-to-Edge with Zero Overlapping Buttons) */}
                  <div 
                    className="relative w-full overflow-hidden cursor-zoom-in group bg-[#F8F9FA] dark:bg-[#141517]"
                    onClick={() => setIsLightboxOpen(true)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={currentScreen.src}
                      alt={currentScreen.alt}
                      className="w-full h-auto block select-none transition-transform duration-300 group-hover:scale-[1.008]"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Bottom Navigation & Pagination Bar (Completely Outside the Screenshot) */}
                <div className="flex items-center justify-between sm:justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 select-none px-1">
                  {/* Prev Button */}
                  <button
                    type="button"
                    onClick={() => setActiveScreenIndex((prev) => (prev > 0 ? prev - 1 : SOHUB_SCREENS.length - 1))}
                    className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-[var(--text-primary)] hover:bg-[#0171E3] hover:text-white dark:hover:bg-[#0171E3] transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                    aria-label="Oldingi ekran"
                    title="Oldingi"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {/* Pagination Dots with Tooltips */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {SOHUB_SCREENS.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveScreenIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                          activeScreenIndex === idx ? 'w-6 sm:w-8 bg-[#0171E3]' : 'w-2 bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40'
                        }`}
                        aria-label={s.name}
                        title={s.name}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setActiveScreenIndex((prev) => (prev < SOHUB_SCREENS.length - 1 ? prev + 1 : 0))}
                    className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-[var(--text-primary)] hover:bg-[#0171E3] hover:text-white dark:hover:bg-[#0171E3] transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                    aria-label="Keyingi ekran"
                    title="Keyingi"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* 4. Core Features Section (One Full Screen 3-Column Grid) */}
      <section
        id="platform-features"
        className="relative w-full min-h-screen min-h-[100dvh] border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col justify-center py-6 sm:py-10 lg:py-14 snap-start scroll-mt-16 sm:scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 w-full flex flex-col justify-center my-auto">
          <div className="mb-4 sm:mb-8 text-center sm:text-left">
            <h2 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight text-[var(--text-primary)] leading-[1.1]">
              Bilim olishlarini <br className="hidden sm:inline" />
              <span className="text-[#0171E3]">"Like" bilan taqdirlang.</span>
            </h2>
          </div>

          {/* 3-Column Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {CORE_FEATURES.map((item, index) => (
              <div
                key={index}
                style={{ backgroundColor: item.color }}
                className="p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl text-black flex flex-col justify-between shadow-lg transition-transform duration-300 hover:-translate-y-1 select-none min-h-[200px] sm:min-h-[260px]"
              >
                <div>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black/75 mb-2 sm:mb-3 block">
                    {item.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-black tracking-tight leading-snug">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm lg:text-base text-black/85 leading-relaxed font-semibold mt-4">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Mijozlar Fikri (Testimonials - One Full Screen 3-Column Grid) */}
      <section
        id="testimonials"
        className="relative w-full min-h-screen min-h-[100dvh] border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col justify-center py-6 sm:py-10 lg:py-14 snap-start scroll-mt-16 sm:scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 w-full flex flex-col justify-center my-auto">
          <div className="mb-4 sm:mb-8 text-center sm:text-left">
            <h2 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight text-[var(--text-primary)]">
              Ustoz va murabbiylar nima deydi?
            </h2>
          </div>

          {/* 3-Column Architectural Testimonials Grid */}
          <div className="w-full rounded-2xl sm:rounded-3xl border border-black/15 dark:border-white/20 overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-black/15 dark:divide-white/20 shadow-lg">
            {TESTIMONIALS.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-5 sm:p-7 lg:p-8 text-[#0C1016]"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <div className="flex flex-col">
                  {/* School Tag */}
                  <div className="flex items-center justify-start mb-3 sm:mb-5">
                    <span className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider px-2.5 py-1 rounded border border-black/10 bg-black/[0.04] text-[#0C1016]">
                      {item.school}
                    </span>
                  </div>

                  {/* Hero Metric Stat */}
                  <div className="mb-3 sm:mb-5 pb-3 sm:pb-5 border-b border-black/10">
                    <div
                      className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                      style={{ color: item.accent }}
                    >
                      {item.metricValue}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0C1016]/60 mt-1">
                      {item.metricLabel}
                    </div>
                  </div>

                  {/* Quotation */}
                  <p className="text-sm sm:text-base lg:text-lg font-medium leading-relaxed text-[#0C1016]/90 italic">
                    “{item.quote}”
                  </p>
                </div>

                {/* Author & Role Footer */}
                <div className="pt-3 sm:pt-5 mt-4 sm:mt-6 border-t border-black/10 flex flex-col">
                  <h4 className="text-base sm:text-lg font-bold tracking-tight text-[#0C1016]">
                    {item.author}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-[#0C1016]/60">
                    {item.role}, <span className="text-[#0C1016] font-semibold">{item.school}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ: Ko'p beriladigan savollar (One Full Screen 2-Column Grid) */}
      <section
        id="faq"
        className="relative w-full min-h-screen min-h-[100dvh] border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-center py-6 sm:py-10 lg:py-14 snap-start scroll-mt-16 sm:scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 w-full flex flex-col justify-center my-auto">
          <div className="mb-4 sm:mb-8 text-center sm:text-left">
            <h2 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight text-[var(--text-primary)]">
              Ko'p beriladigan savollar
            </h2>
          </div>

          {/* 2-Column Grid of 6 FAQs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 lg:gap-6">
            {FAQS.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-4 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-start min-w-0"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0171E3]/10 text-[#0171E3] flex items-center justify-center font-mono text-xs sm:text-sm font-bold shrink-0 mt-0.5">
                    ?
                  </span>
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[var(--text-primary)] leading-snug break-words">
                    {faq.q}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm lg:text-base text-[var(--text-secondary)] leading-relaxed pl-10">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Fullscreen Edge-to-Edge Black CTA & Footer Section */}
      <section className="relative w-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col justify-between px-4 sm:px-8 lg:px-12 2xl:px-16 pt-8 pb-4 sm:py-8 lg:py-10 border-t border-white/10 snap-start scroll-mt-16 sm:scroll-mt-20 overflow-hidden">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto w-full flex-1 flex flex-col justify-center my-auto py-4 sm:py-6">
          <h2 className="text-2xl min-[360px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight text-white leading-tight break-words max-w-full mb-6 sm:mb-8">
            Darslaringizni <br className="hidden sm:inline" />
            <span className="text-white">yangi bosqichga olib chiqing.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 w-full">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="group inline-flex p-2 pl-4 sm:p-3 sm:pl-8 lg:p-3.5 lg:pl-10 pr-2 sm:pr-3.5 rounded-full bg-white text-black hover:bg-[#F5F5F7] transition-all duration-300 ease-out items-center gap-2 sm:gap-4 cursor-pointer shadow-2xl active:scale-95 min-h-[44px] sm:min-h-[52px]"
            >
              <span className="text-xs min-[360px]:text-sm sm:text-base lg:text-lg font-bold tracking-wider uppercase">Tizimga kirish</span>
              <span className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1.5 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4 lg:w-5 lg:h-5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('pricing-section')}
              className="px-4 py-2.5 sm:px-6 sm:py-3.5 lg:px-8 lg:py-4 rounded-full border border-white/20 hover:border-white/40 text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 min-h-[44px] sm:min-h-[52px]"
            >
              Tariflar
            </button>
          </div>
        </div>

        {/* 2 Qatorli Kengaytirilgan Footer */}
        <footer className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto pt-4 sm:pt-6 pb-2 border-t border-white/10 text-white/70">
          {/* Qator 1: Brend, Sitemap va Kontaktlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-5 sm:gap-6 mb-4 sm:mb-6">
            {/* Col 1: Brend va Maqsad */}
            <div className="sm:col-span-2 md:col-span-5 min-w-0">
              <h3 className="font-black text-lg lg:text-xl text-white tracking-tight mb-1.5">
                EPCHIL <span className="text-[#0171E3]">ROBOT</span>
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm">
                Ustozlar uchun o'quvchilar bilimini jonli "Like"lar bilan rag'batlantirish, guruhlararo sog'lom raqobat va oylik shaffof davomat platformasi.
              </p>
            </div>

            {/* Col 2: Sitemap (Tezkor Bo'limlar) */}
            <div className="md:col-span-3 min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white mb-2">
                Bo'limlar
              </h4>
              <ul className="space-y-0.5 text-xs text-white/60">
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="py-1 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center"
                  >
                    Bosh sahifa
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('pricing-section')}
                    className="py-1 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center"
                  >
                    Narxlar va Tariflar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('platform-screens')}
                    className="py-1 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center"
                  >
                    Skrinshotlar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('platform-features')}
                    className="py-1 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center"
                  >
                    Imkoniyatlar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('testimonials')}
                    className="py-1 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center"
                  >
                    Mijozlar fikri
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('faq')}
                    className="py-1 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center"
                  >
                    Savollar va javoblar
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Kontaktlar va Ijtimoiy Tarmoqlar */}
            <div className="md:col-span-4 min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white mb-2">
                Aloqa va Tarmoqlar
              </h4>
              <div className="space-y-1 text-xs text-white/70">
                <a
                  href="tel:+998332220301"
                  className="flex items-center gap-2 hover:text-white transition-colors no-underline py-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0171E3] shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="truncate">+998 (33) 222-03-01</span>
                </a>

                <a
                  href="https://t.me/bkzd19"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors no-underline py-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0171E3] shrink-0">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span className="truncate">Telegram: @bkzd19</span>
                </a>

                <a
                  href="https://instagram.com/epchilrobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors no-underline py-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0171E3] shrink-0">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span className="truncate">Instagram: @epchilrobot</span>
                </a>

                <a
                  href="https://instagram.com/epchil.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors no-underline py-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0171E3] shrink-0">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span className="truncate">Instagram AI: @epchil.ai</span>
                </a>
              </div>
            </div>
          </div>

          {/* Qator 2: Copyright va Versiya */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-white/50 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="font-bold text-white tracking-tight">EPCHIL ROBOT</span>
              <span>•</span>
              <span>© {new Date().getFullYear()} Barcha huquqlar himoyalangan.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 font-mono text-[10px] sm:text-[11px] text-white/40">
              <span>V2.0.0</span>
            </div>
          </div>
        </footer>
      </section>

      {/* Fullscreen Screenshot Lightbox Modal */}
      {isLightboxOpen && (
        <div
          style={{ backgroundColor: 'rgba(8, 10, 15, 0.96)' }}
          className="fixed inset-0 z-[100] backdrop-blur-3xl flex flex-col justify-between p-3 sm:p-6 animate-fade-in overscroll-none select-none text-white"
          onClick={() => setIsLightboxOpen(false)}
          onWheel={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Lightbox Top Bar */}
          <div
            className="w-full max-w-7xl mx-auto flex items-center justify-between text-white shrink-0 mb-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs sm:text-sm font-bold bg-white/20 px-3 py-1 rounded-full text-white">
                {activeScreenIndex + 1} / {SOHUB_SCREENS.length}
              </span>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
                {SOHUB_SCREENS[activeScreenIndex].title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/30 transition-all cursor-pointer flex items-center gap-2 shadow-xl active:scale-95"
              aria-label="Yopish"
            >
              <span>Yopish (Esc)</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Lightbox Main Image Canvas */}
          <div
            className="relative flex-1 w-full max-w-7xl mx-auto flex items-center justify-center overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Lightbox Button */}
            <button
              type="button"
              onClick={() => setActiveScreenIndex((prev) => (prev > 0 ? prev - 1 : SOHUB_SCREENS.length - 1))}
              className="absolute left-2 sm:left-5 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-xl border border-white/25 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xl"
              aria-label="Oldingi"
              title="Oldingi"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <img
              src={SOHUB_SCREENS[activeScreenIndex].src}
              alt={SOHUB_SCREENS[activeScreenIndex].alt}
              className="max-w-full max-h-[82vh] object-contain rounded-xl sm:rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] select-none"
            />

            {/* Next Lightbox Button */}
            <button
              type="button"
              onClick={() => setActiveScreenIndex((prev) => (prev < SOHUB_SCREENS.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 sm:right-5 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-xl border border-white/25 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xl"
              aria-label="Keyingi"
              title="Keyingi"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Lightbox Bottom Indicator */}
          <div
            className="w-full max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 pt-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {SOHUB_SCREENS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScreenIndex(idx)}
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeScreenIndex === idx ? 'w-8 bg-[#0171E3]' : 'w-2 sm:w-2.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={s.name}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

