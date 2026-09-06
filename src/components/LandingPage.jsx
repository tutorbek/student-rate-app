import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// SOHub-inspired Platform Screens data with dark gradient progression & tags
const SOHUB_SCREENS = [
  {
    id: 1,
    titleWhite: "Guruhlar",
    titleMuted: "Boshqaruvi",
    bg: "#0C1016",
    tagBg: "#161B24",
    tags: ["Guruh yaratish", "Talabalar soni", "Parolli kirish", "Tezkor ochish"],
    description: "Har bir dars vaqtiga mos guruhlar oching, talabalarni biriktiring va xavfsiz parollar bilan himoyalang.",
    src: "/screens/1.png",
    alt: "Guruhlar ro'yxati boshqaruvi"
  },
  {
    id: 2,
    titleWhite: "Boshqaruv",
    titleMuted: "Paneli (Dashboard)",
    bg: "#141820",
    tagBg: "#1F2530",
    tags: ["Jami Likelar", "Oylik faollik", "1-o'rin g'olibi", "Guruh statistikasi"],
    description: "O'qituvchi uchun barcha muhim ko'rsatkichlar, oylik peshqadamlar va dars faolligi bitta ekranda.",
    src: "/screens/2.png",
    alt: "Boshqaruv paneli Dashboard"
  },
  {
    id: 3,
    titleWhite: "Jonli Reyting",
    titleMuted: "va Leaderboard",
    bg: "#1B212B",
    tagBg: "#29303D",
    tags: ["Top-3 Shohsupasi", "Oylik hisob", "Kurs davomida", "Ballar tarixi"],
    description: "O'quvchilarning har bir to'plagan Like'i real vaqtda jadvalda aks etadi va sog'lom raqobatni oshiradi.",
    src: "/screens/3.png",
    alt: "Jonli Reyting va Leaderboard"
  },
  {
    id: 4,
    titleWhite: "Tezkor Davomat",
    titleMuted: "Belgilash",
    bg: "#162028",
    tagBg: "#222D37",
    tags: ["1-Soniya", "Keldi / Kelmadi", "Kechikdi", "Tezkor qidiruv"],
    description: "Dars sanasi bo'yicha har bir o'quvchining davomatini birgina bosish bilan aniq va oson qayd eting.",
    src: "/screens/4.png",
    alt: "Tezkor Davomat belgilash"
  },
  {
    id: 5,
    titleWhite: "Oylik Davomat",
    titleMuted: "Taqvimi",
    bg: "#201B2A",
    tagBg: "#2C263B",
    tags: ["Interaktiv kalendar", "Dars foizlari", "Bugungi dars", "Oylik qatnashuv"],
    description: "Oylik kalendar orqali har bir kunning qatnashuv foizi va davomat statistikasini vizual kuzating.",
    src: "/screens/5.png",
    alt: "Davomat taqvimi va foizlar"
  },
  {
    id: 6,
    titleWhite: "Batafsil Taqvim",
    titleMuted: "Grafikasi",
    bg: "#1A2027",
    tagBg: "#252D36",
    tags: ["Dars kunlari", "Shaffof hisobot", "To'liq oy", "Rangli indikatorlar"],
    description: "Hafta kunlari (Du-Ya) bo'yicha barcha o'tilgan darslar xaritasi va davomat ko'rsatkichlari.",
    src: "/screens/6.png",
    alt: "Oylik batafsil taqvim"
  },
  {
    id: 7,
    titleWhite: "O'quvchilar",
    titleMuted: "Davomat Jurnali",
    bg: "#10161E",
    tagBg: "#1A222D",
    tags: ["O'rtacha foiz %", "O'tilgan darslar", "Qoldirilgan darslar", "Shaxsiy hisobot"],
    description: "Har bir o'quvchining darsga qatnashish foizi, kelgan va qoldirgan darslari bo'yicha to'liq shaffof jurnal.",
    src: "/screens/7.png",
    alt: "O'quvchilar davomat ko'rsatkichlari"
  },
];

// Core Platform Features (Line Cards)
const CORE_FEATURES = [
  {
    badge: "Motivatsiya & Havas",
    title: "Jonli Oylik va Umumiy Reyting",
    description: "Top-3 shohsupasi va ballar jadvali orqali o'quvchilarda darsga bo'lgan ichki qiziqish va intilishni yuksaltiring.",
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

// 1. Social Proof Statistics
const STATS = [
  {
    value: "50+",
    label: "Hamkor Maktablar",
    description: "Yetakchi o'quv markazlari va xususiy maktablar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M10 11v2M14 11v2M10 17v2M14 17v2" />
      </svg>
    )
  },
  {
    value: "2,300+",
    label: "Faol O'quvchilar",
    description: "Har kuni platformada bilimini sinovchi yoshlar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    value: "95%",
    label: "Qoniqish Darajasi",
    description: "Ustozlar va markaz rahbarlari bergan yuksak baho",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  },
  {
    value: "1 soniya",
    label: "Baholash Tezligi",
    description: "Darsni to'xtatmasdan 1 marta bosishda Like va davomat",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  }
];

// 2. Pricing Plans
const PRICING_PLANS = [
  {
    id: "trial",
    name: "Demo / Bepul Sinov",
    badge: "14 KUN BEPUL",
    price: "0 so'm",
    period: "/ 14 kun davomida",
    description: "Platformaning barcha imkoniyatlarini o'z darslaringizda bepul va hech qanday cheklovlarsiz sinab ko'ring.",
    features: [
      "Barcha 7 ta modulga 100% to'liq kirish",
      "Cheksiz o'quvchilar va guruhlar",
      "Jonli oylik reyting va Top-3 shohsupasi",
      "1-soniyali tezkor davomat va oylik taqvim",
      "Tezkor o'rnatish va texnik qo'llab-quvvatlash"
    ],
    ctaText: "Demo olish",
    ctaLink: "https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20bepul%20demo%20sinovini%20boshlamoqchi%20edim.",
    highlighted: false
  },
  {
    id: "pro",
    name: "Maktablar & O'quv Markazlari",
    badge: "ENG OMMABOP",
    price: "Kelishuv asosida",
    period: "o'quvchilar hajmiga moslashtirilgan",
    description: "Katta o'quv markazlari va xususiy maktablar uchun doimiy to'liq litsenziya, shaxsiy menejer va qo'llab-quvvatlash.",
    features: [
      "Barcha imkoniyatlar va yangilanishlar muddatsiz",
      "Shaxsiy menejer va o'qituvchilar uchun amaliy trening",
      "Ma'lumotlar xavfsizligi va kunlik avtomatik zaxira",
      "Guruhlararo musobaqalar va maxsus brending",
      "24/7 ustuvor texnik yordam xizmati"
    ],
    ctaText: "Bog'lanish va narxni bilish",
    ctaLink: "https://t.me/bkzd19?text=Assalomu%20alaykum!%20Maktabimiz%20uchun%20Epchil%20Robot%20litsenziyasi%20narxi%20bo'yicha%20ma'lumot%20olmoqchi%20edim.",
    highlighted: true
  }
];

// 3. Partners (Chiroyli tipografik logolar, rasm qo'shish uchun logoSrc sloti tayyor)
const PARTNERS = [
  {
    id: "insight",
    name: "Insight Plus",
    category: "Xususiy Ta'lim Markazi",
    logoSrc: null,
    badgeText: "INSIGHT+",
  },
  {
    id: "tamaddun",
    name: "Tamaddun LC",
    category: "O'quv Markazi",
    logoSrc: null,
    badgeText: "TAMADDUN",
  },
  {
    id: "ziyonur",
    name: "ZiyoNur LC",
    category: "Xalqaro Ta'lim Markazi",
    logoSrc: null,
    badgeText: "ZIYONUR",
  },
  {
    id: "magnit",
    name: "Magnit",
    category: "O'quv Markazi",
    logoSrc: null,
    badgeText: "MAGNIT",
  }
];

// 4. Testimonials (Vertikal chap va o'ng tomonlarga yopishgan rectangle ichida)
const TESTIMONIALS = [
  {
    quote: "Epchil Robot'ni joriy qilganimizdan so'ng o'quvchilar darsga kechikmay keladigan va savollarga javob berishga qo'l ko'tarib talashadigan bo'lib qolishdi. Top-3 shohsupasi bolalarda aqlbovar qilmas havas uyg'otdi!",
    author: "Diyorbek Rahimov",
    role: "Direktor",
    school: "ZiyoNur LC",
    stats: "+40% darsdagi faollik oshishi",
    bg: "#0A0D12",
    accent: "#0071E3"
  },
  {
    quote: "Qog'oz jurnallarga ruchka bilan belgi qo'yish va oy oxirida foiz hisoblab o'tirishdan butunlay qutuldik. Bitta telefon orqali 1 soniyada Like beraman, qolgan barcha jadvallarni platformaning o'zi avtomatik tayyorlaydi.",
    author: "Shahnoza Karimova",
    role: "Bosh o'qituvchi",
    school: "Insight Plus",
    stats: "Har darsdan 15 daqiqa tejalgan vaqt",
    bg: "#121720",
    accent: "#30D158"
  },
  {
    quote: "Guruhlar o'rtasidagi reyting tufayli o'quvchilar bir-biriga yordam bera boshladi — jamoaviy ruh paydo bo'ldi. Ota-onalar ham farzandining oylik natijalaridan va davomatidan juda mamnun.",
    author: "Azizbek Mansurov",
    role: "O'quv ishlari koordinatori",
    school: "Tamaddun LC",
    stats: "98% ota-onalar mamnuniyati",
    bg: "#181E28",
    accent: "#FF9F0A"
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
    a: "Hech qanday cheklov yo'q! 1 ta guruhdan tortib, minglab o'quvchilarga ega yirik o'quv markazlari va xususiy maktablar barcha filiallarini bemalol boshqarishi mumkin."
  },
  {
    q: "Ma'lumotlarimiz xavfsizligi qanday ta'minlanadi?",
    a: "Barcha ma'lumotlar xalqaro darajada shifrlangan xavfsiz bulutli serverlarda (PostgreSQL) saqlanadi. Har bir guruh uchun alohida kirish paroli o'rnatiladi va muntazam zaxira nusxasi olinadi."
  },
  {
    q: "14 kunlik bepul sinov davrida qanday imkoniyatlar mavjud?",
    a: "Sinov davrida barcha modullar (Guruhlar, Jonli Reyting, Tezkor Davomat, Oylik Taqvim, Foizlar jurnali) 100% to'liq va hech qanday cheklovlarsiz ishlaydi."
  },
  {
    q: "Tizimni maktabimizga sozlashda yordam berasizlarmi?",
    a: "Albatta! Mutaxassislarimiz o'quv markazingiz yoki maktabingiz guruhlarini tizimga joylashda, o'qituvchilarga foydalanishni o'rgatishda boshidan oxirigacha ko'maklashadi."
  }
];

export default function LandingPage({ onNavigateToLogin }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile drawer is open to prevent background jitter
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (sectionId) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  };

  return (
    <div className="landing-root w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative font-sans antialiased selection:bg-[#0071E3] selection:text-white">
      
      {/* 1. Header & Navigation (Responsive Mobile-first Header with Slide-out Drawer) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[var(--bg-primary)]/90 dark:bg-[#202124]/90 border-b border-[var(--border-color)] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex items-center justify-between h-16 sm:h-20 xl:h-22 gap-2 min-w-0">
          
          {/* Logo Brand */}
          <div
            className="navbar-brand-section scale-active cursor-pointer shrink-0 min-h-[44px] flex items-center select-none"
            onClick={() => {
              setIsMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <h1 className="navbar-logo-text text-lg min-[360px]:text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              EPCHIL <span className="logo-badge">ROBOT</span>
            </h1>
          </div>
          
          {/* Desktop in-page nav links */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-2 text-xs lg:text-sm xl:text-base font-medium text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => scrollToSection('pricing-section')}
              className="px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] flex items-center"
            >
              Narxlar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('platform-screens')}
              className="px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] flex items-center"
            >
              Skrinshotlar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('platform-features')}
              className="px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] flex items-center"
            >
              Imkoniyatlar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('testimonials')}
              className="px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] flex items-center"
            >
              Fikrlar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] flex items-center"
            >
              FAQ
            </button>
          </nav>

          {/* Right Header Actions & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 shrink-0">
            {/* Demo Button (Desktop & Tablet) */}
            <a
              href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20platformasi%20bo'yicha%20demo%20so'ramoqchi%20edim."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex h-10 sm:h-11 xl:h-12 px-4 sm:px-6 xl:px-8 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.03] hover:bg-black/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] hover:border-black/20 dark:hover:border-white/30 text-[var(--text-primary)] transition-all duration-300 ease-out items-center justify-center text-xs sm:text-sm xl:text-base font-semibold tracking-wide uppercase cursor-pointer shadow-sm active:scale-95 no-underline min-h-[44px]"
            >
              Demo
            </a>

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

            {/* Mobile Hamburger Toggle Button (min 44x44px touch area) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] text-[var(--text-primary)] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors cursor-pointer active:scale-95"
              aria-label={isMobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-4 h-3.5 relative flex flex-col justify-between items-center pointer-events-none">
                <span
                  className={`w-4 h-0.5 bg-current rounded-full transition-transform duration-300 origin-center pointer-events-none ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
                  }`}
                />
                <span
                  className={`w-4 h-0.5 bg-current rounded-full transition-opacity duration-200 pointer-events-none ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`w-4 h-0.5 bg-current rounded-full transition-transform duration-300 origin-center pointer-events-none ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Full-Screen Mobile Navigation Menu mounted directly to document.body via portal */}
        {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
          <div
            className="mobile-menu-overlay fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] z-[9999999] md:hidden flex flex-col bg-[var(--bg-primary)] dark:bg-[#202124] text-[var(--text-primary)] font-sans antialiased animate-fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100dvh',
              zIndex: 9999999
            }}
          >
            
            {/* Full-Screen Menu Top Header Bar (1:1 identical alignment and styling with Navbar) */}
            <div className="w-full bg-[var(--bg-primary)] dark:bg-[#202124] border-b border-[var(--border-color)] pt-[env(safe-area-inset-top,0px)] shrink-0 transition-colors">
              <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex items-center justify-between h-16 sm:h-20 xl:h-22 gap-2 min-w-0">
                <div
                  className="navbar-brand-section scale-active cursor-pointer shrink-0 min-h-[44px] flex items-center select-none"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <h1 className="navbar-logo-text text-lg min-[360px]:text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                    EPCHIL <span className="logo-badge">ROBOT</span>
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] text-[var(--text-primary)] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors cursor-pointer active:scale-95"
                  aria-label="Menyuni yopish"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Full-Screen Scrollable Content */}
            <div className="flex-1 w-full overflow-y-auto px-5 py-6 flex flex-col justify-between gap-8 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
              
              {/* Navigation Items (Apple Minimalist Full-Width List) */}
              <nav className="flex flex-col space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleNavClick('pricing-section')}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left font-semibold text-base text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors cursor-pointer min-h-[50px]"
                >
                  <span>Narxlar va Statistika</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('platform-screens')}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left font-semibold text-base text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors cursor-pointer min-h-[50px]"
                >
                  <span>Skrinshotlar (7 ta modul)</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('platform-features')}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left font-semibold text-base text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors cursor-pointer min-h-[50px]"
                >
                  <span>Imkoniyatlar</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('testimonials')}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left font-semibold text-base text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors cursor-pointer min-h-[50px]"
                >
                  <span>Mijozlar fikri</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('faq')}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left font-semibold text-base text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors cursor-pointer min-h-[50px]"
                >
                  <span>Ko'p beriladigan savollar (FAQ)</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </nav>

              {/* Bottom Actions & Contacts */}
              <div className="flex flex-col gap-5 pt-4">
                <div className="flex flex-col gap-3">
                  <a
                    href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20platformasi%20bo'yicha%20demo%20so'ramoqchi%20edim."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-[var(--text-primary)] flex items-center justify-center text-xs font-semibold tracking-wide uppercase cursor-pointer no-underline active:scale-98"
                  >
                    Demo olish (Telegram)
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigateToLogin();
                    }}
                    className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase cursor-pointer shadow-md active:scale-98"
                  >
                    <span>Tizimga kirish</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Contact shortcuts */}
                <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-2.5 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <a href="tel:+998332220301" className="hover:text-[var(--text-primary)] transition-colors no-underline flex items-center gap-2 py-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3]">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>+998 (33) 222-03-01</span>
                    </a>
                    <a href="https://t.me/bkzd19" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors no-underline flex items-center gap-2 py-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3]">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>Telegram: @bkzd19</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-tertiary)]">
                    <span>Epchil Robot © {new Date().getFullYear()}</span>
                    <span>V2.0.0</span>
                  </div>
                </div>

              </div>

            </div>

          </div>,
          document.body
        )}
      </header>

      {/* 2. Hero Section (Fluid Clamp Typography & Responsive Video Player) */}
      <section className="relative w-full pt-12 pb-16 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 mb-12 sm:mb-20 2xl:mb-24">
          <div className="flex flex-col items-start gap-3 sm:gap-6">
            
            <h1
              className="w-full text-3xl min-[360px]:text-4xl sm:text-6xl md:text-7xl lg:text-7xl 2xl:text-[5.5rem] font-black tracking-[-0.03em] leading-[1.08] sm:leading-[0.96] text-[var(--text-primary)] select-none break-words [overflow-wrap:anywhere]"
            >
              O'quvchilarni rag'batlantirishning <br className="hidden sm:inline" />
              <span className="text-[#0071E3]">zamonaviy usuli.</span>
            </h1>
            
            <p className="text-sm min-[360px]:text-base sm:text-2xl md:text-2xl lg:text-3xl 2xl:text-[2rem] text-[var(--text-secondary)] font-normal max-w-4xl mt-1 sm:mt-3 2xl:mt-4 leading-relaxed">
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
                Tariflar & Natijalar ↓
              </button>
            </div>
          </div>
        </div>

        {/* Video Showcase Card */}
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
      </section>

      {/* 3. Tezkor Sotuv Oqimi: Narxlar & Statistika (Pricing & Social Proof Stats) */}
      <section
        id="pricing-section"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)] py-14 sm:py-24 lg:py-28 scroll-mt-20"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16">
          
          {/* Section Header */}
          <div className="mb-10 sm:mb-20">
            <span className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-[#0071E3] uppercase mb-2 sm:mb-3 block">
              ISHONCH VA QULAY SHARTLAR
            </span>
            <h2 className="text-2xl min-[360px]:text-3xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight leading-[1.08] text-[var(--text-primary)]">
              Darslaringizni bugunoq <br className="hidden sm:inline" />
              <span className="text-[#0071E3]">bepul sinab ko'ring.</span>
            </h2>
            <p className="text-sm sm:text-xl lg:text-2xl text-[var(--text-secondary)] mt-3 sm:mt-4 max-w-3xl font-normal leading-relaxed">
              O'quv markazingiz yoki maktabingiz uchun eng qulay shartlar. Hech qanday murakkab shartnomalarsiz to'g'ridan-to'g'ri boshlang.
            </p>
          </div>

          {/* Social Proof Stats Grid (Mobile 1 col, xs 2 cols, lg 4 cols) */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mb-12 sm:mb-20">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-7 lg:p-8 2xl:p-9 rounded-2xl sm:rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group min-w-0"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 2xl:w-14 2xl:h-14 rounded-xl sm:rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mb-3 sm:mb-6 group-hover:scale-110 transition-transform shrink-0">
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-2xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight text-[var(--text-primary)] mb-1 truncate">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base lg:text-lg font-bold text-[var(--text-primary)] mb-1 break-words">
                    {stat.label}
                  </div>
                  <p className="text-xs sm:text-sm lg:text-base text-[var(--text-secondary)] leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Plans Grid (2 Cards: Trial & Pro) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl sm:rounded-[36px] p-5 min-[420px]:p-7 sm:p-10 lg:p-12 2xl:p-14 flex flex-col justify-between transition-all duration-300 min-w-0 ${
                  plan.highlighted
                    ? 'bg-[#0C1016] text-white border-2 border-[#0071E3] shadow-2xl shadow-[#0071E3]/10'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
                    <span
                      className={`text-[10px] min-[380px]:text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        plan.highlighted
                          ? 'bg-[#0071E3] text-white'
                          : 'bg-black/10 dark:bg-white/10 text-[var(--text-primary)]'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <span className="text-xs sm:text-sm font-mono opacity-60">EPCHIL ROBOT</span>
                  </div>

                  <h3 className="text-xl min-[420px]:text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-2 sm:mb-3">
                    {plan.name}
                  </h3>
                  <p className={`text-xs min-[420px]:text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8 ${
                    plan.highlighted ? 'text-white/70' : 'text-[var(--text-secondary)]'
                  }`}>
                    {plan.description}
                  </p>

                  {/* Price & Period with flex-wrap and responsive typography */}
                  <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-black/10 dark:border-white/10">
                    <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-baseline gap-1 min-[480px]:gap-2">
                      <span className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black tracking-tight break-words">
                        {plan.price}
                      </span>
                      <span className={`text-xs sm:text-sm lg:text-base break-words ${
                        plan.highlighted ? 'text-white/60' : 'text-[var(--text-secondary)]'
                      }`}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 sm:gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.highlighted ? 'bg-[#0071E3] text-white' : 'bg-green-500/20 text-green-600 dark:text-green-400'
                        }`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className={`text-xs min-[420px]:text-sm sm:text-base lg:text-lg font-medium ${
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
                  className={`w-full py-3.5 sm:py-4 lg:py-5 px-4 sm:px-8 rounded-full font-bold text-center text-xs min-[380px]:text-sm sm:text-base lg:text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2 sm:gap-3 no-underline min-h-[48px] sm:min-h-[54px] lg:min-h-[60px] ${
                    plan.highlighted
                      ? 'bg-[#0071E3] text-white hover:bg-[#0077ED]'
                      : 'bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF]'
                  }`}
                >
                  <span className="truncate">{plan.ctaText}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Hamkor Maktablar Logotiplari (Partners - Tipografik Dizayn) */}
      <section
        id="partners-section"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-12 sm:py-18 lg:py-24 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div>
              <span className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-[#0071E3] uppercase mb-1.5 block">
                HAMKORLARIMIZ
              </span>
              <h3 className="text-xl min-[360px]:text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-black tracking-tight text-[var(--text-primary)]">
                Bizga ishonch bildirgan ta'lim dargohlari
              </h3>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-[var(--text-secondary)] max-w-md">
              O'quvchilarda darsga havasni uyg'otib, ta'lim sifatini yangi bosqichga ko'targan yetakchi markazlar.
            </p>
          </div>

          {/* Partners Grid (Mobile 1 col, xs 2 cols, md 4 cols) */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {PARTNERS.map((partner) => (
              <div
                key={partner.id}
                className="p-4 sm:p-8 lg:p-10 2xl:p-12 rounded-xl sm:rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#0071E3]/50 transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-default shadow-sm min-w-0"
              >
                {/* Logo Image Slot (kelajakda rasm qo'yish uchun tayyor) */}
                {partner.logoSrc ? (
                  <img
                    src={partner.logoSrc}
                    alt={partner.name}
                    className="max-w-full h-8 sm:h-10 lg:h-12 w-auto object-contain mb-2 sm:mb-3.5 grayscale group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 flex items-center justify-center mb-2 sm:mb-3.5 group-hover:scale-105 transition-transform shrink-0">
                    <span className="font-mono text-[11px] sm:text-xs lg:text-sm font-black tracking-tighter text-[#0071E3]">
                      {partner.badgeText.slice(0, 3)}
                    </span>
                  </div>
                )}

                <h4 className="text-base sm:text-xl lg:text-2xl 2xl:text-3xl font-black tracking-tight text-[var(--text-primary)] group-hover:text-[#0071E3] transition-colors truncate w-full">
                  {partner.name}
                </h4>
                <span className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-secondary)] font-medium mt-0.5 sm:mt-1 truncate w-full">
                  {partner.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Platform Screenshots Showcase (Native CSS Sticky Playing Card Deck) */}
      <section
        id="platform-screens"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-primary)] pt-14 sm:pt-20 lg:pt-28 pb-16 sm:pb-24 lg:pb-32 scroll-mt-20"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 mb-10 sm:mb-16 2xl:mb-20 text-center">
          <span className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-[#0071E3] uppercase mb-2 block">
            INTERFEYS VITRINASI
          </span>
          <h2 className="text-2xl min-[360px]:text-3xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight text-[var(--text-primary)]">
            Epchil Robot platformasi ichkaridan
          </h2>
          <p className="text-xs sm:text-lg lg:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mt-2 sm:mt-4">
            O'qituvchi va o'quvchilar uchun maxsus yaratilgan 7 ta muhim boshqaruv ekrani.
          </p>
        </div>

        {/* Native CSS Sticky Stacking Playing Card Deck */}
        <div className="stacking-cards-container max-w-7xl 2xl:max-w-[1440px] mx-auto px-3 min-[380px]:px-4 sm:px-8 lg:px-12 2xl:px-16 relative">
          {SOHUB_SCREENS.map((screen, index) => (
            <div
              key={screen.id}
              data-card-index={index}
              className="stacking-card-item w-full"
              style={{
                top: `calc(var(--stack-base-top, 80px) + ${index} * var(--stack-step-y, 10px))`,
                marginBottom: 'var(--stack-gap, 35vh)',
                zIndex: index + 1,
              }}
            >
              <div
                className="stacking-card-frame relative w-full h-auto min-h-[350px] sm:min-h-[480px] md:min-h-[580px] lg:min-h-[700px] xl:min-h-[780px] 2xl:min-h-[840px] sm:h-[640px] md:h-[720px] lg:h-[800px] xl:h-[860px] 2xl:h-[900px] sm:max-h-[calc(100dvh-8.5rem)] rounded-2xl sm:rounded-[32px] 2xl:rounded-[36px] border border-white/[0.18] flex flex-col text-white overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent shadow-2xl"
                style={{
                  backgroundColor: screen.bg,
                }}
              >
                {/* Integrated Mac Window Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 lg:py-4 border-b border-white/10 bg-black/35 shrink-0">
                  {/* Left: 3 macOS dots + Screen Number + Title */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56]/90 shadow-sm" />
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]/90 shadow-sm" />
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F]/90 shadow-sm" />
                    </div>
                    <div className="h-3.5 sm:h-4 w-[1px] bg-white/15 shrink-0" />
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 text-white/90 font-mono text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0">
                      0{screen.id}
                    </span>
                    <h3 className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight tracking-tight truncate">
                      <span className="text-white">{screen.titleWhite} </span>
                      <span className="text-white/40">{screen.titleMuted}</span>
                    </h3>
                  </div>

                  {/* Right: Magnetic Pill Tags */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    {screen.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[9px] min-[360px]:text-[10px] sm:text-[11px] lg:text-xs font-medium px-2 py-0.5 lg:px-3 lg:py-1 rounded-full border border-white/10 text-white/90"
                        style={{ backgroundColor: screen.tagBg }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Screenshot Container (Pinned to top for optimal stacking deck visibility) */}
                <div className="w-full flex-1 relative overflow-hidden bg-[#070A0E] flex items-start justify-center px-2.5 sm:px-4 lg:px-6 pt-1.5 sm:pt-2.5 lg:pt-3 pb-2.5 sm:pb-4 lg:pb-6 rounded-b-2xl sm:rounded-b-[32px] 2xl:rounded-b-[36px]">
                  <img
                    src={screen.src}
                    alt={screen.alt}
                    className="max-w-full h-auto sm:max-h-full sm:w-auto object-contain object-top border border-white/[0.14] block select-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg sm:rounded-[20px] md:rounded-[24px]"
                    style={{ borderRadius: 'clamp(8px, 1.5vw, 24px)' }}
                    loading="lazy"
                  />
                </div>

              </div>
            </div>
          ))}

          {/* Desktop Runway Buffer: 7-karta 6-karta ustiga (xuddi 6-karta 5-karta ustiga o'tirganidek) 100% to'liq o'tirishini va dasta saqlanishini ta'minlaydi */}
          <div
            className="hidden md:block w-full pointer-events-none"
            style={{ height: 'var(--stack-end-spacer, 50vh)' }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* 6. Core Features Section (Full-width Edge-to-Edge Line Cards) */}
      <section id="platform-features" className="relative w-full pt-16 sm:pt-28 pb-0 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-hidden">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 mb-10 sm:mb-20 2xl:mb-24">
          <h2
            className="w-full text-3xl min-[360px]:text-4xl sm:text-6xl md:text-7xl lg:text-7xl 2xl:text-[5.5rem] font-black tracking-[-0.03em] text-[var(--text-primary)] leading-[1.08] sm:leading-[0.96] select-none break-words"
          >
            Bilim olishlarini <br />
            <span className="text-[#0071E3]">"Like" bilan taqdirlang.</span>
          </h2>
        </div>

        {/* Full-width Horizontal Line Cards */}
        <div className="w-full border-t border-b border-black/15">
          {CORE_FEATURES.map((item, index) => (
            <div
              key={index}
              style={{ backgroundColor: item.color }}
              className="w-full text-black px-4 sm:px-8 lg:px-12 2xl:px-16 py-8 sm:py-14 md:py-20 lg:py-24 transition-all duration-300 border-b border-black/15 last:border-b-0 hover:brightness-95 group select-none"
            >
              <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-10 lg:gap-16">
                <div className="w-full md:w-5/12 shrink-0 min-w-0">
                  <span className="text-[11px] sm:text-sm lg:text-base font-black uppercase tracking-widest text-black/75 mb-1.5 sm:mb-2.5 block">
                    {item.badge}
                  </span>
                  <h3 className="text-xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-black text-black tracking-tight leading-[1.1] break-words">
                    {item.title}
                  </h3>
                </div>
                <div className="w-full md:w-7/12 min-w-0">
                  <p className="text-sm sm:text-lg lg:text-xl 2xl:text-2xl text-black/85 leading-relaxed font-semibold">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Mijozlar Fikri (Testimonials - Vertikal chekkadan-chekkaga yopishgan Rectangles) */}
      <section
        id="testimonials"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-primary)] pt-14 sm:pt-24 lg:pt-28 pb-0 scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 mb-10 sm:mb-20 2xl:mb-24">
          <span className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-[#0071E3] uppercase mb-2 block">
            MIJOZLAR FIKRI
          </span>
          <h2 className="text-2xl min-[360px]:text-3xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight text-[var(--text-primary)]">
            Ustozlar va rahbarlar nima deydi?
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-[var(--text-secondary)] mt-2 sm:mt-3 max-w-2xl">
            Amaliyotda Epchil Robot'dan foydalanayotgan o'qituvchi va markaz rahbarlarining samimiy fikrlari.
          </p>
        </div>

        {/* Edge-to-Edge Full Width Vertical Rectangles */}
        <div className="w-full border-t border-b border-black/10 dark:border-white/10">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: item.bg }}
              className="w-full text-white px-4 sm:px-8 lg:px-12 2xl:px-16 py-8 sm:py-16 md:py-20 lg:py-24 border-b border-white/10 last:border-b-0 transition-colors"
            >
              <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 lg:gap-16 min-w-0">
                
                {/* Left: Author & Stats Info */}
                <div className="w-full md:w-5/12 shrink-0 min-w-0">
                  <div className="flex items-center gap-1.5 text-amber-400 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, sIdx) => (
                      <svg key={sIdx} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>

                  <h4 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-1 break-words">
                    {item.author}
                  </h4>
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-white/60 mb-3 sm:mb-4">
                    {item.role}, <span className="text-white font-semibold">{item.school}</span>
                  </p>

                  <div className="inline-flex max-w-full flex-wrap items-center gap-2 px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-full bg-white/10 border border-white/15 text-[11px] sm:text-xs lg:text-sm font-semibold text-white/90">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.accent }} />
                    <span className="break-words">{item.stats}</span>
                  </div>
                </div>

                {/* Right: Big Quote */}
                <div className="w-full md:w-7/12 min-w-0">
                  <p className="text-base sm:text-2xl lg:text-3xl 2xl:text-[2rem] font-medium leading-relaxed text-white/90 italic">
                    "{item.quote}"
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FAQ: Ko'p beriladigan savollar (2 Ustunli Ochiq Blok) */}
      <section
        id="faq"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)] py-14 sm:py-24 lg:py-28 scroll-mt-20"
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16">
          
          <div className="mb-10 sm:mb-20">
            <span className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-[#0071E3] uppercase mb-2 block">
              SAVOLLAR VA JAVOBLAR
            </span>
            <h2 className="text-2xl min-[360px]:text-3xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight text-[var(--text-primary)]">
              Ko'p beriladigan savollar
            </h2>
            <p className="text-xs sm:text-lg lg:text-xl text-[var(--text-secondary)] mt-2 sm:mt-3 max-w-2xl">
              Epchil Robot platformasining ishlashi, xavfsizligi va sozlash tartibi bo'yicha eng muhim javoblar.
            </p>
          </div>

          {/* 2 Columns Open Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8 2xl:gap-10">
            {FAQS.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-4 sm:p-7 lg:p-8 2xl:p-10 rounded-2xl sm:rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-start min-w-0"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-mono text-xs sm:text-sm font-bold shrink-0 mt-0.5">
                    ?
                  </span>
                  <h3 className="text-sm sm:text-base lg:text-lg 2xl:text-xl font-bold text-[var(--text-primary)] leading-snug break-words">
                    {faq.q}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm lg:text-base 2xl:text-lg text-[var(--text-secondary)] leading-relaxed pl-0 sm:pl-9 lg:pl-10 2xl:pl-11">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. Fullscreen Edge-to-Edge Black CTA Section */}
      <section className="relative w-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col justify-between px-4 sm:px-8 lg:px-12 2xl:px-16 py-12 sm:py-20 lg:py-24 border-t border-white/10 overflow-hidden">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto w-full flex-1 flex flex-col justify-center my-auto py-8 sm:py-16 lg:py-24">
          <h2 className="text-3xl min-[360px]:text-4xl sm:text-6xl md:text-7xl lg:text-7xl 2xl:text-[5.5rem] font-black tracking-tight text-white leading-[1.08] sm:leading-[0.96] break-words max-w-full mb-6 sm:mb-10">
            Darslaringizni <br className="hidden sm:inline" />
            <span className="text-white">yangi bosqichga olib chiqing.</span>
          </h2>
          <p className="text-sm min-[360px]:text-base sm:text-2xl md:text-2xl lg:text-3xl 2xl:text-[2rem] text-white/70 font-normal max-w-3xl leading-relaxed mb-6 sm:mb-12">
            Epchil Robot platformasi orqali dars jarayonini yanada samarali, qiziqarli va intizomli qiling.
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 w-full">
            <a
              href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20platformasi%20bo'yicha%20demo%20so'ramoqchi%20edim."
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex p-2 pl-5 sm:p-3.5 sm:pl-10 lg:p-4 lg:pl-12 pr-2.5 sm:pr-4 lg:pr-5 rounded-full bg-white text-black hover:bg-[#F5F5F7] transition-all duration-300 ease-out items-center gap-2.5 sm:gap-5 cursor-pointer shadow-2xl active:scale-95 no-underline min-h-[48px] sm:min-h-[56px] lg:min-h-[64px]"
            >
              <span className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wider uppercase">Demo olish</span>
              <span className="w-8 h-8 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1.5 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5 lg:w-6 lg:h-6">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-5 py-3 sm:px-8 sm:py-5 lg:px-10 lg:py-6 rounded-full border border-white/20 hover:border-white/40 text-white font-bold text-xs sm:text-base lg:text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 min-h-[48px] sm:min-h-[56px] lg:min-h-[64px]"
            >
              Tizimga kirish
            </button>
          </div>
        </div>

        {/* 10. 2 Qatorli Kengaytirilgan Footer */}
        <footer className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto pt-10 sm:pt-14 pb-8 border-t border-white/10 text-white/70">
          
          {/* Qator 1: Brend, Sitemap va Kontaktlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 mb-8 sm:mb-10">
            
            {/* Col 1: Brend va Maqsad */}
            <div className="sm:col-span-2 md:col-span-5 min-w-0">
              <h3 className="font-black text-xl lg:text-2xl text-white tracking-tight mb-2 sm:mb-3">
                EPCHIL <span className="text-[#0071E3]">ROBOT</span>
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-white/60 leading-relaxed max-w-sm mb-4">
                O'quvchilar bilimini jonli "Like"lar bilan rag'batlantirish, guruhlararo sog'lom raqobat va oylik shaffof davomat platformasi.
              </p>
            </div>

            {/* Col 2: Sitemap (Tezkor Bo'limlar) */}
            <div className="md:col-span-3 min-w-0">
              <h4 className="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-widest text-white mb-3 sm:mb-4">
                Bo'limlar
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm lg:text-base text-white/60">
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="py-2 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center min-h-[40px]"
                  >
                    Bosh sahifa
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('pricing-section')}
                    className="py-2 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center min-h-[40px]"
                  >
                    Narxlar va Statistika
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('platform-screens')}
                    className="py-2 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center min-h-[40px]"
                  >
                    Skrinshotlar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('platform-features')}
                    className="py-2 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center min-h-[40px]"
                  >
                    Imkoniyatlar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('testimonials')}
                    className="py-2 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center min-h-[40px]"
                  >
                    Mijozlar fikri
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('faq')}
                    className="py-2 hover:text-white transition-colors cursor-pointer text-left w-full flex items-center min-h-[40px]"
                  >
                    Savollar va javoblar
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Kontaktlar va Ijtimoiy Tarmoqlar */}
            <div className="md:col-span-4 min-w-0">
              <h4 className="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-widest text-white mb-3 sm:mb-4">
                Aloqa va Tarmoqlar
              </h4>
              <div className="space-y-2 text-xs sm:text-sm lg:text-base text-white/70">
                <a
                  href="tel:+998332220301"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline py-2 min-h-[40px]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3] shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="truncate">+998 (33) 222-03-01</span>
                </a>

                <a
                  href="https://t.me/bkzd19"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline py-2 min-h-[40px]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3] shrink-0">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span className="truncate">Telegram: @bkzd19</span>
                </a>

                <a
                  href="https://instagram.com/epchilrobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline py-2 min-h-[40px]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3] shrink-0">
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
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline py-2 min-h-[40px]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3] shrink-0">
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
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-white/50 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <span className="font-bold text-white tracking-tight">EPCHIL ROBOT</span>
              <span>•</span>
              <span>© {new Date().getFullYear()} Barcha huquqlar himoyalangan.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 font-mono text-[11px] sm:text-xs text-white/40">
              <span>V2.0.0</span>
              <span>•</span>
              <span>Designed with Apple Minimalism</span>
            </div>
          </div>

        </footer>
      </section>

    </div>
  );
}

