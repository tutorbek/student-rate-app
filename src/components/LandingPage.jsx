import React, { useState } from 'react';

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

// SOHub Starburst Spark Icon
const IconSpark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.6094 43.9991V22.582" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M4.75391 35.8655L19.8966 20.7207" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M0 19.6074H21.4171" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M8.13672 4.75195L23.2815 19.8946" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M24.3906 0V21.4171" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M39.2481 8.13477L24.1055 23.2795" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M43.9991 24.3926H22.582" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M35.8635 39.2481L20.7188 24.1055" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export default function LandingPage({ onNavigateToLogin }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-x-clip font-sans antialiased selection:bg-[#0071E3] selection:text-white">
      
      {/* 1. Header & Navigation */}
      <header className="app-navbar sticky top-0 z-50 backdrop-blur-2xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)] pt-[env(safe-area-inset-top,0px)]">
        <div className="navbar-inner max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-16 sm:h-20">
          <div
            className="navbar-brand-section scale-active cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <h1 className="navbar-logo-text text-xl sm:text-2xl font-bold tracking-tight">
              EPCHIL <span className="logo-badge">ROBOT</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick in-page nav links (desktop) */}
            <div className="hidden md:flex items-center gap-1 mr-2 text-xs font-medium text-[var(--text-secondary)]">
              <button
                type="button"
                onClick={() => scrollToSection('pricing-section')}
                className="px-3 py-1.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Narxlar
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('platform-screens')}
                className="px-3 py-1.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Skrinshotlar
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('testimonials')}
                className="px-3 py-1.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Fikrlar
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('faq')}
                className="px-3 py-1.5 rounded-full hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                FAQ
              </button>
            </div>

            {/* Demo Button */}
            <a
              href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20platformasi%20bo'yicha%20demo%20so'ramoqchi%20edim."
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 sm:h-11 px-4 sm:px-6 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.03] hover:bg-black/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.1] hover:border-black/20 dark:hover:border-white/30 text-[var(--text-primary)] transition-all duration-300 ease-out flex items-center justify-center text-xs sm:text-sm font-semibold tracking-wide uppercase cursor-pointer shadow-sm active:scale-95"
            >
              Demo
            </a>

            {/* SOHub-styled Action Button */}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="group h-9 sm:h-11 p-1 pl-4 pr-1.5 sm:p-1.5 sm:pl-6 sm:pr-2 rounded-full bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] transition-all duration-300 ease-out flex items-center gap-2.5 sm:gap-3 cursor-pointer shadow-md active:scale-95"
            >
              <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">Kirish</span>
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Maximalist Typography) */}
      <section className="relative w-full pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-12 mb-16 sm:mb-24">
          <div className="flex flex-col items-start gap-4 sm:gap-6">
            
            <h1
              className="w-full text-[clamp(1.75rem,6.2vw,8.5rem)] text-3xl min-[380px]:text-4xl min-[480px]:text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[7rem] 2xl:text-[8.5rem] font-black tracking-[-0.03em] leading-[0.95] sm:leading-[0.92] text-[var(--text-primary)] break-normal select-none"
              style={{ wordBreak: 'normal', overflowWrap: 'normal' }}
            >
              O'quvchilarni rag'batlantirishning <br className="hidden sm:inline" />
              <span className="text-[#0071E3]">zamonaviy usuli.</span>
            </h1>
            
            <p className="text-lg sm:text-2xl md:text-3xl text-[var(--text-secondary)] font-normal max-w-4xl mt-2 leading-relaxed">
              O'quvchilar faolligini jonli "Like"lar orqali baholang, oylik reytingni yuritib boring va sog'lom raqobat muhitini shakllantiring.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {/* SOHub Large Action Button */}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="group p-2 pl-8 pr-2.5 rounded-full bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF] transition-all duration-300 ease-out flex items-center gap-4 cursor-pointer shadow-lg active:scale-95"
              >
                <span className="text-sm sm:text-base font-semibold tracking-wider uppercase">Tizimga kirish</span>
                <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => scrollToSection('pricing-section')}
                className="px-8 py-4 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-sm sm:text-base border border-[var(--border-color)] transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              >
                Tariflar & Natijalar ↓
              </button>
            </div>
          </div>
        </div>

        {/* Video Showcase Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] sm:rounded-[3rem] bg-[#0C1016] shadow-[0_30px_70px_rgba(0,0,0,0.3)] border border-white/10 aspect-video relative overflow-hidden flex items-center justify-center group">
          {isVideoPlaying ? (
            <iframe
              className="w-full h-full border-0 pointer-events-auto rounded-[inherit] relative z-10"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              src="https://www.youtube-nocookie.com/embed/g7xkVEWrX8E?autoplay=1&controls=1&rel=0&modestbranding=1"
              title="Epchil Robot Showcase"
              frameBorder="0"
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
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300 rounded-[inherit]" />
              
              <button
                type="button"
                className="relative z-20 w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-white/95 backdrop-blur-xl shadow-[0_15px_50px_rgba(0,0,0,0.4)] border border-white/60 flex items-center justify-center text-[#0C1016] group-hover:scale-110 group-active:scale-95 transition-all duration-300 cursor-pointer"
                aria-label="Videoni ijro etish"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-[#0C1016]">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </button>
              
              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-20 flex items-center bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-xs sm:text-sm font-medium border border-white/10">
                <span>Epchil Robot Video Sharhi</span>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* 3. [NEW] Tezkor Sotuv Oqimi: Narxlar & Statistika (Pricing & Social Proof Stats) */}
      <section
        id="pricing-section"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)] py-20 sm:py-28 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          {/* Section Header */}
          <div className="mb-14 sm:mb-20">
            <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0071E3] uppercase mb-3 block">
              ISHONCH VA QULAY SHARTLAR
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-[var(--text-primary)]">
              Darslaringizni bugunoq <br className="hidden sm:inline" />
              <span className="text-[#0071E3]">bepul sinab ko'ring.</span>
            </h2>
            <p className="text-base sm:text-xl text-[var(--text-secondary)] mt-4 max-w-2xl font-normal leading-relaxed">
              O'quv markazingiz yoki maktabingiz uchun eng qulay shartlar. Hech qanday murakkab shartnomalarsiz to'g'ridan-to'g'ri boshlang.
            </p>
          </div>

          {/* Social Proof Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-24">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-1">
                    {stat.label}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Plans Grid (2 Cards: Trial & Pro) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-[32px] sm:rounded-[36px] p-8 sm:p-12 flex flex-col justify-between transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-[#0C1016] text-white border-2 border-[#0071E3] shadow-2xl shadow-[#0071E3]/10'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-lg'
                }`}
              >
                {/* Top Badge */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        plan.highlighted
                          ? 'bg-[#0071E3] text-white'
                          : 'bg-black/10 dark:bg-white/10 text-[var(--text-primary)]'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <span className="text-xs font-mono opacity-60">EPCHIL ROBOT</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
                    {plan.name}
                  </h3>
                  <p className={`text-sm sm:text-base leading-relaxed mb-8 ${
                    plan.highlighted ? 'text-white/70' : 'text-[var(--text-secondary)]'
                  }`}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-8 pb-8 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight">
                        {plan.price}
                      </span>
                      <span className={`text-xs sm:text-sm ${
                        plan.highlighted ? 'text-white/60' : 'text-[var(--text-secondary)]'
                      }`}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4 mb-10">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.highlighted ? 'bg-[#0071E3] text-white' : 'bg-green-500/20 text-green-600 dark:text-green-400'
                        }`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className={`text-sm sm:text-base font-medium ${
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
                  className={`w-full py-4 px-8 rounded-full font-bold text-center text-sm sm:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-3 no-underline ${
                    plan.highlighted
                      ? 'bg-[#0071E3] text-white hover:bg-[#0077ED]'
                      : 'bg-[#0C1016] text-white hover:bg-[#1E242C] dark:bg-white dark:text-[#0C1016] dark:hover:bg-[#EBEBEF]'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. [NEW] Hamkor Maktablar Logotiplari (Partners - Tipografik Dizayn) */}
      <section
        id="partners-section"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-16 sm:py-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#0071E3] uppercase mb-1.5 block">
                HAMKORLARIMIZ
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                Bizga ishonch bildirgan ta'lim dargohlari
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md">
              O'quvchilarda darsga havasni uyg'otib, ta'lim sifatini yangi bosqichga ko'targan yetakchi markazlar.
            </p>
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {PARTNERS.map((partner) => (
              <div
                key={partner.id}
                className="p-6 sm:p-8 rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#0071E3]/50 transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-default shadow-sm"
              >
                {/* Logo Image Slot (kelajakda rasm qo'yish uchun tayyor) */}
                {partner.logoSrc ? (
                  <img
                    src={partner.logoSrc}
                    alt={partner.name}
                    className="h-10 w-auto object-contain mb-3 grayscale group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="font-mono text-xs font-black tracking-tighter text-[#0071E3]">
                      {partner.badgeText.slice(0, 3)}
                    </span>
                  </div>
                )}

                <h4 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)] group-hover:text-[#0071E3] transition-colors">
                  {partner.name}
                </h4>
                <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium mt-1">
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
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-primary)] pt-16 sm:pt-24 pb-20 sm:pb-28 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16 text-center">
          <span className="text-xs font-bold tracking-widest text-[#0071E3] uppercase mb-2 block">
            INTERFEYS VITRINASI
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">
            Epchil Robot platformasi ichkaridan
          </h2>
          <p className="text-sm sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mt-3">
            O'qituvchi va o'quvchilar uchun maxsus yaratilgan 7 ta muhim boshqaruv ekrani.
          </p>
        </div>

        {/* Native CSS Sticky Stacking Playing Card Deck */}
        <div className="stacking-cards-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {SOHUB_SCREENS.map((screen, index) => {
            const isLast = index === SOHUB_SCREENS.length - 1;
            return (
              <div
                key={screen.id}
                data-card-index={index}
                className="stacking-card-item relative w-full"
                style={{
                  top: `calc(var(--stack-base-top) + ${index} * var(--stack-step-y))`,
                  marginBottom: isLast ? '0px' : 'var(--stack-gap)',
                  zIndex: index + 1,
                }}
              >
                <div
                  className="stacking-card-frame relative w-full h-[580px] min-[400px]:h-[640px] sm:h-[720px] md:h-[800px] lg:h-[860px] xl:h-[900px] max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100vh-6.5rem)] rounded-[22px] sm:rounded-[32px] border border-white/[0.18] flex flex-col text-white overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent shadow-2xl"
                  style={{
                    backgroundColor: screen.bg,
                  }}
                >
                  {/* Integrated Mac Window Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/10 bg-black/35 shrink-0">
                    {/* Left: 3 macOS dots + Screen Number + Title */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-3 h-3 rounded-full bg-[#FF5F56]/90 shadow-sm" />
                        <span className="w-3 h-3 rounded-full bg-[#FFBD2E]/90 shadow-sm" />
                        <span className="w-3 h-3 rounded-full bg-[#27C93F]/90 shadow-sm" />
                      </div>
                      <div className="h-4 w-[1px] bg-white/15 shrink-0" />
                      <span className="w-6 h-6 rounded-full bg-white/10 text-white/90 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        0{screen.id}
                      </span>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold leading-tight tracking-tight">
                        <span className="text-white">{screen.titleWhite} </span>
                        <span className="text-white/40">{screen.titleMuted}</span>
                      </h3>
                    </div>

                    {/* Right: Magnetic Pill Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {screen.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 sm:py-1 rounded-full border border-white/10 text-white/90"
                          style={{ backgroundColor: screen.tagBg }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Compact Description Line */}
                  <div className="flex items-center gap-2.5 text-white/75 px-4 sm:px-6 py-2 bg-black/15 border-b border-white/[0.06] shrink-0 text-xs sm:text-sm">
                    <div className="shrink-0 text-white/60">
                      <IconSpark size={15} />
                    </div>
                    <p className="font-normal text-white/80 line-clamp-1">
                      {screen.description}
                    </p>
                  </div>

                  {/* Screenshot Container with matching rounded corners */}
                  <div className="w-full flex-1 min-h-0 relative overflow-hidden bg-[#070A0E] flex items-center justify-center p-2 sm:p-3 md:p-4 rounded-b-[22px] sm:rounded-b-[32px]">
                    <img
                      src={screen.src}
                      alt={screen.alt}
                      className="max-w-full max-h-full w-auto h-auto object-contain border border-white/[0.14] block select-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[20px] md:rounded-[24px]"
                      style={{ borderRadius: 'clamp(16px, 2vw, 24px)' }}
                      loading="lazy"
                    />
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>



      {/* 7. Core Features Section (Full-width Edge-to-Edge Line Cards) */}
      <section id="platform-features" className="relative w-full pt-24 sm:pt-32 pb-0 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
          <h2
            className="w-full text-[clamp(2.35rem,8.2vw,11.5rem)] text-4xl min-[380px]:text-5xl min-[480px]:text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] xl:text-[8.5rem] 2xl:text-[10.5rem] font-black tracking-[-0.03em] text-[var(--text-primary)] leading-[0.94] sm:leading-[0.90] break-normal select-none"
            style={{ wordBreak: 'normal', overflowWrap: 'normal' }}
          >
            Bilim olishlarini <br />
            <span className="text-[#0071E3]">"Like" bilan taqdirlang.</span>
          </h2>
        </div>

        {/* Full-width Horizontal Line Cards (Edge-to-Edge Rectangles touching each other) */}
        <div className="w-full border-t border-b border-black/15">
          {CORE_FEATURES.map((item, index) => (
            <div
              key={index}
              style={{ backgroundColor: item.color }}
              className="w-full text-black px-4 sm:px-8 lg:px-12 py-12 sm:py-16 md:py-20 transition-all duration-300 border-b border-black/15 last:border-b-0 hover:brightness-95 group select-none"
            >
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10 lg:gap-16">
                <div className="md:w-5/12 shrink-0">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-black/75 mb-2.5 block">
                    {item.badge}
                  </span>
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-[1.05]">
                    {item.title}
                  </h3>
                </div>
                <div className="md:w-7/12">
                  <p className="text-base sm:text-lg lg:text-xl text-black/85 leading-relaxed font-semibold">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. [NEW] Mijozlar Fikri (Testimonials - Vertikal chekkadan-chekkaga yopishgan Rectangles) */}
      <section
        id="testimonials"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-primary)] pt-20 sm:pt-28 pb-0 scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0071E3] uppercase mb-2 block">
            MIJOZLAR FIKRI
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)]">
            Ustozlar va rahbarlar nima deydi?
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-3 max-w-2xl">
            Amaliyotda Epchil Robot'dan foydalanayotgan o'qituvchi va markaz rahbarlarining samimiy fikrlari.
          </p>
        </div>

        {/* Edge-to-Edge Full Width Vertical Rectangles (chap va o'ng tomonlarga to'liq yopishgan) */}
        <div className="w-full border-t border-b border-black/10 dark:border-white/10">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: item.bg }}
              className="w-full text-white px-4 sm:px-8 lg:px-12 py-14 sm:py-20 border-b border-white/10 last:border-b-0 transition-colors"
            >
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 lg:gap-16">
                
                {/* Left: Author & Stats Info */}
                <div className="md:w-5/12 shrink-0">
                  <div className="flex items-center gap-1.5 text-amber-400 mb-4">
                    {[...Array(5)].map((_, sIdx) => (
                      <svg key={sIdx} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
                    {item.author}
                  </h4>
                  <p className="text-sm font-medium text-white/60 mb-4">
                    {item.role}, <span className="text-white font-semibold">{item.school}</span>
                  </p>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/90">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.accent }} />
                    {item.stats}
                  </div>
                </div>

                {/* Right: Big Quote */}
                <div className="md:w-7/12">
                  <p className="text-lg sm:text-2xl lg:text-2xl font-medium leading-relaxed text-white/90 italic">
                    "{item.quote}"
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. [NEW] FAQ: Ko'p beriladigan savollar (2 Ustunli Ochiq Blok) */}
      <section
        id="faq"
        className="relative w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)] py-20 sm:py-28 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="mb-14 sm:mb-20">
            <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0071E3] uppercase mb-2 block">
              SAVOLLAR VA JAVOBLAR
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">
              Ko'p beriladigan savollar
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-3 max-w-2xl">
              Epchil Robot platformasining ishlashi, xavfsizligi va sozlash tartibi bo'yicha eng muhim javoblar.
            </p>
          </div>

          {/* 2 Columns Open Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {FAQS.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-6 sm:p-8 rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col justify-start"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    ?
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                    {faq.q}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed pl-10">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. Fullscreen Edge-to-Edge Black CTA Section */}
      <section className="relative w-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-16 sm:py-20 lg:py-24 border-t border-white/10 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center my-auto py-12 sm:py-16">
          <h2 className="text-4xl min-[360px]:text-5xl min-[480px]:text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] xl:text-[7.5rem] 2xl:text-[8.5rem] font-black tracking-tight text-white leading-[0.98] sm:leading-[0.94] break-words max-w-full mb-8 sm:mb-10">
            Darslaringizni <br className="hidden sm:inline" />
            <span className="text-white">yangi bosqichga olib chiqing.</span>
          </h2>
          <p className="text-lg sm:text-2xl md:text-3xl text-white/70 font-normal max-w-3xl leading-relaxed mb-10 sm:mb-14">
            Epchil Robot platformasi orqali dars jarayonini yanada samarali, qiziqarli va intizomli qiling.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://t.me/bkzd19?text=Assalomu%20alaykum!%20Epchil%20Robot%20platformasi%20bo'yicha%20demo%20so'ramoqchi%20edim."
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex p-3 sm:p-3.5 pl-8 sm:pl-10 pr-3.5 sm:pr-4 rounded-full bg-white text-black hover:bg-[#F5F5F7] transition-all duration-300 ease-out items-center gap-4 sm:gap-5 cursor-pointer shadow-2xl active:scale-95 no-underline"
            >
              <span className="text-base sm:text-lg md:text-xl font-bold tracking-wider uppercase">Demo olish</span>
              <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-8 py-4 sm:py-5 rounded-full border border-white/20 hover:border-white/40 text-white font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
            >
              Tizimga kirish
            </button>
          </div>
        </div>

        {/* 11. [NEW] 2 Qatorli Kengaytirilgan Footer */}
        <footer className="w-full max-w-6xl mx-auto pt-12 pb-6 border-t border-white/10 text-white/70">
          
          {/* Qator 1: Brend, Sitemap va Kontaktlar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            
            {/* Col 1: Brend va Maqsad */}
            <div className="md:col-span-5">
              <h3 className="font-black text-xl text-white tracking-tight mb-3">
                EPCHIL <span className="text-[#0071E3]">ROBOT</span>
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm mb-4">
                O'quvchilar bilimini jonli "Like"lar bilan rag'batlantirish, guruhlararo sog'lom raqobat va oylik shaffof davomat platformasi.
              </p>

            </div>

            {/* Col 2: Sitemap (Tezkor Bo'limlar) */}
            <div className="md:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
                Bo'limlar
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-white/60">
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Bosh sahifa
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('pricing-section')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Narxlar va Statistika
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('platform-screens')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Skrinshotlar
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('testimonials')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Mijozlar fikri
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('faq')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Savollar va javoblar
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Kontaktlar va Ijtimoiy Tarmoqlar */}
            <div className="md:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
                Aloqa va Tarmoqlar
              </h4>
              <div className="space-y-3 text-xs sm:text-sm text-white/70">
                <a
                  href="tel:+998332220301"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3]">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>+998 (33) 222-03-01</span>
                </a>

                <a
                  href="https://t.me/bkzd19"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3]">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Telegram: @bkzd19</span>
                </a>

                <a
                  href="https://instagram.com/epchilrobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3]">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Instagram: @epchilrobot</span>
                </a>

                <a
                  href="https://instagram.com/epchil.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors no-underline"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0071E3]">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Instagram AI: @epchil.ai</span>
                </a>
              </div>
            </div>

          </div>

          {/* Qator 2: Copyright va Versiya */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">EPCHIL ROBOT</span>
              <span>•</span>
              <span>© {new Date().getFullYear()} Barcha huquqlar himoyalangan.</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-white/40">
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
