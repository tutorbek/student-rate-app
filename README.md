# Epchil Robot: Rated Student App

O'quv markazlari va robototexnika to'garaklari uchun mo'ljallangan talabalar reytingi (gamifikatsiya), davomat nazorati, moliya va dars jadvalini boshqaruvchi ko'p foydalanuvchili (Multi-tenant) bulutli tizim.

---

## 🛠 Texnologik Stek

- **Frontend:** React 19, Vite 8, GSAP 3.15, Lenis Smooth Scroll, Oxlint.
- **Backend:** Node.js, Express 5, `pg` (PostgreSQL Client), `@supabase/supabase-js`, `node-cron`, Telegram Bot API.
- **Bulutli Baza:** Supabase PostgreSQL.
- **Serverless & Deploy:** Vercel serverless functions (`api/index.js` -> `server.js`).

---

## 📁 Loyiha Papka va Fayllar Strukturasi

Loyiha mas'uliyatlar bo'yicha to'liq ajratilgan (modular & domain-driven architecture) toza strukturaga ega:

```text
ratedStudentApp/
├── api/                                 # Vercel Serverless routeri (/api/index.js)
├── public/                              # Statik aktivlar (avatarlar, animatsiyalar, faviconlar)
│   ├── animations/                      # Hero va UI video animatsiyalari
│   ├── avatar_image/                    # O'quvchi avatarlari (WebP/JPG)
│   └── screens/                         # Ilova skrinshotlari
├── scripts/                             # Avtomatlashtirilgan zaxiralash va seed skriptlari
│   ├── backup_to_git.js
│   └── seed_all_template_data.js
├── src/                                 # Asosiy frontend ilova kodi
│   ├── assets/                          # Rasm va vektor aktivlari
│   ├── components/                      # UI Komponentlar (Domen/Rol bo'yicha ajratilgan)
│   │   ├── admin/                       # Super Admin moduli
│   │   │   ├── AdminAttendance.jsx      # Umumiy davomat nazorati
│   │   │   ├── AdminDashboard.jsx       # Boshqaruv statistikasi va o'qituvchilar reytingi
│   │   │   ├── AdminFinance.jsx         # To'lovlar va moliyaviy audit
│   │   │   └── AdminLeads.jsx           # CRM / Lidlar bilan ishlash
│   │   ├── auth/                        # Autentifikatsiya moduli
│   │   │   └── LoginPage.jsx            # Tizimga kirish sahifasi
│   │   ├── common/                      # Qayta ishlatiluvchi umumiy komponentlar
│   │   │   ├── ErrorBoundary.jsx        # Xatoliklarni ushlab qoluvchi chegara
│   │   │   ├── ProjectLikeIcon.jsx      # Maxsus SVG like/ball piktogrammasi
│   │   │   └── Time24Input.jsx          # 24 soatlik formatdagi maxsus vaqt kiritish elementi
│   │   ├── landing/                     # Marketing va tashqi sahifa
│   │   │   ├── LandingPage.jsx          # Asosiy landing sahifasi
│   │   │   └── LandingPage.css          # Landing sahifasi stillari
│   │   ├── layout/                      # Karkas va navigatsiya komponentlari
│   │   │   └── Sidebar.jsx              # Chap navigatsiya paneli (Admin & Teacher)
│   │   ├── student/                     # O'quvchi portali moduli (Student Portal)
│   │   │   ├── StudentAccountView.jsx   # Shaxsiy kabinet va PIN sozlamalari
│   │   │   ├── StudentAttendanceCalendar.jsx # Shaxsiy davomat taqvimi
│   │   │   ├── StudentAvatarPickerView.jsx   # Avatar do'koni va tanlash
│   │   │   ├── StudentCenterAddresses.jsx    # Filial manzillari
│   │   │   ├── StudentIcons.jsx              # Standart emojilar o'rniga maxsus SVG piktogrammalar
│   │   │   ├── StudentPortal.jsx             # O'quvchi asosiy konteyneri
│   │   │   ├── StudentPortal.css
│   │   │   ├── StudentProfileSelectView.jsx  # Guruh va profil tanlash
│   │   │   ├── StudentRatingView.jsx         # Guruh ichki reytingi (Leaderboard)
│   │   │   ├── StudentRewardView.jsx         # Oylik sovg'alar va yutuqlar ko'rinishi
│   │   │   ├── StudentRewardView.css
│   │   │   ├── StudentScheduleCard.jsx       # Dars jadvali kartochkasi
│   │   │   ├── StudentTeacherShowcase.jsx    # O'qituvchi profili va sertifikatlari
│   │   │   └── StudentTeacherShowcase.css
│   │   └── teacher/                     # O'qituvchi ish stoli moduli
│   │       ├── Attendance.jsx           # Dars davomatini belgilash va eksport
│   │       ├── GroupDetail.jsx          # Guruh ichidagi o'quvchilar va ball berish
│   │       ├── GroupsList.jsx           # O'qituvchi guruhlari ro'yxati
│   │       ├── History.jsx              # Ballar va amallar tarixi
│   │       ├── Leaderboard.jsx          # Guruhlararo va umumiy reyting
│   │       ├── ScheduleView.jsx         # Haftalik dars jadvali
│   │       ├── Settings.jsx             # O'qituvchi sozlamalari va zaxiralar
│   │       ├── TeacherFinanceView.jsx   # O'qituvchi to'lovlar va oylik tahlili
│   │       ├── TeacherFinanceView.css
│   │       ├── TeacherRewardsView.jsx   # Guruh oylik sovg'alarini belgilash
│   │       └── TeacherRewardsView.css
│   ├── constants/                       # Statik tarjimalar va konstantalar
│   │   └── landingTranslations.js       # Ko'p tilli landing matnlari
│   ├── hooks/                           # Maxsus React hooklari
│   │   ├── useKeyboardAware.js          # Mobil klaviatura ochilishini nazorat qilish
│   │   └── useModalDismiss.js           # Modal oynalarni Escape/backdrop orqali yopish
│   ├── utils/                           # Biznes logika, yordamchi modullar va klientlar
│   │   ├── attendanceUtils.js           # Davomat hisob-kitoblari va foizlar
│   │   ├── avatarCache.js               # Avatarlarni keshlovchi mexanizm
│   │   ├── avatarGallery.js             # Avatar rasmlari katalogi
│   │   ├── db.js                        # Biznes mantiq funksiyalari (CRUD)
│   │   ├── deviceId.js                  # Qurilma identifikatori generatori
│   │   ├── exportAttendance.js          # CSV eksport va printer formati
│   │   ├── firebase.js                  # Firebase konfiguratsiyasi
│   │   ├── groupIcons.jsx               # Guruh ikonkalari va ranglari
│   │   ├── leadsUtils.js                # Lidlar CRM yordamchilari
│   │   ├── scheduleUtils.js             # Dars jadvali va xonalar to'qnashuvini aniqlash
│   │   ├── scrollLock.js                # Modal ochilganda scrollni qulflash
│   │   ├── scrollOffset.js              # Navigatsiya ofsetini hisoblash
│   │   ├── studentAvatars.jsx           # O'quvchi avatarlari renderi
│   │   ├── supabase.js                  # Supabase ma'lumotlar bazasi klienti
│   │   ├── teacherUtils.js              # O'qituvchi KPI va davomat statistikasi
│   │   └── telegram.js                  # Telegram WebApp integratsiyasi
│   ├── App.jsx                          # Bosh router va ko'rinishlar boshqaruvi
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── storage/                             # Baza zaxiralari va sessiyalar
│   ├── backups/                         # Kunlik to'liq JSON zaxiralar
│   ├── bot_sessions.json
│   └── db.json                          # Lokal sinov bazasi
├── tests/                               # Regression va birlik testlari
│   ├── finance_phase2.test.mjs          # Moliya moduli testlari
│   ├── group_passwords_integrity.test.mjs
│   ├── leads_phase3.test.mjs            # Lidlar (CRM) moduli testlari
│   ├── schedule_phase4.test.mjs         # Dars jadvali moduli testlari
│   └── teachers_phase5.test.mjs         # O'qituvchilar KPI va davomat testlari
├── botService.js                        # Telegram bot boshqaruv servisi
├── server.js                            # Express backend serveri
├── vercel.json                          # Vercel marshrutlash va cron sozlamalari
└── vite.config.js                       # Vite yig'uvchi sozlamalari
```

---

## 🚀 Ishga Tushirish

### Ishchi Muhitni Ishga Tushirish (Dev mode):
```bash
npm run dev
```
*(Bu buyruq bir vaqtning o'zida Vite frontendini `http://localhost:5173` da va Express serverini `http://localhost:3001` da ishga tushiradi).*

### Production Build:
```bash
npm run build
```

### Kod sifatini tekshirish (Lint):
```bash
npm run lint
```

### Testlarni ishga tushirish:
```bash
node tests/teachers_phase5.test.mjs
node tests/finance_phase2.test.mjs
node tests/leads_phase3.test.mjs
node tests/schedule_phase4.test.mjs
```
