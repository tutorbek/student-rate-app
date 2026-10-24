# PROJECT RULES & CONSTRAINTS

> [!CAUTION]
> Ushbu qoidalar majburiy. Hech qanday holatda buzilmasin!

## 1. Pulsatsiyalanuvchi LIVE neon taqiqlanadi
- Loyihaning **hech bir joyida** pulsatsiyalanuvchi yoki miltillovchi indikatorlar (`pulsing dot`, `animation: pulse`, `live-dot` va shu kabilar) ishlatilmasin.
- Barcha status belgilari **statik, bosiq va professional Apple Minimalist uslubida** bo'lsin.
- Ko'zni charchatuvchi har qanday animatsiya taqiqlanadi.

## 2. Emojilar taqiqlanadi
- Ilovaning hech bir qismida (Student Portal, Teacher Panel, Reyting, Dars jadvali, Do'kon, Sozlamalar) standart emojilar (👍, 🏆, ⚡, 🔥, 📅, ⏰, 📍, 👤, 🎁 va h.k.) ishlatilmasin.
- Faqat **toza vektor SVG iconlar** (`StudentIcons.jsx` yoki maxsus SVG komponentlar) qo'llansin.

## 3. "AI yasagan" ko'rinishdagi dizayn taqiqlanadi
Interfeys qo'lda, o'ylab chizilgan professional mahsulotga o'xshashi kerak, shablon AI natijasiga emas. Quyidagilar mutlaqo ishlatilmasin:

- **Gradientlar:** binafsha-ko'k, pushti-binafsha va boshqa "AI gradient" fonlar, gradient matn, gradient tugmalar.
- **Neon va yorug'lik effektlari:** `glow`, yorqin `box-shadow`, neon chegaralar, nurlanuvchi ranglar.
- **Glassmorphism:** shaffof xiralashgan (`backdrop-filter: blur`) kartalar va panellar.
- **Haddan tashqari bezak:** har bir kartada soya, chegara, gradient va ikonani birga qo'yish; orqa fonda tasodifiy dog'lar (blob), to'rlar va yulduzchalar.
- **Bir xil shablon tuzilma:** hamma joyda bir xil yumaloq kartalar to'plami, markazlashgan "hero" bloklar, har bo'limda bir xil ikonali uchta ustun.
- **Haddan katta radiuslar:** hamma elementni `rounded-3xl` yoki pill shaklida qilish. Radiuslar mantiqiy va izchil bo'lsin.
- **Quruq va ma'nosiz matnlar:** "Imkoniyatlarni kashf eting", "Kelajakka qadam qo'ying" kabi marketing shiorlari. Matnlar aniq, qisqa va ma'noli bo'lsin.
- **Rang chalkashligi:** bir sahifada 2 tadan ortiq urg'u rangi. Palitra cheklangan: neytral asos va bitta urg'u rangi.
- **Ikonali ortiqcha belgilar:** har bir sarlavha yoki ro'yxat elementi yoniga ikona qo'yish. Ikona faqat ma'no qo'shgan joyda ishlatilsin.

## 4. Animatsiya va harakat effektlari taqiqlanadi
Loyihada **hech qanday dekorativ animatsiya** ishlatilmasin:

- **Taqiqlangan:** `fade-in`, `slide-in`, `scale`, `bounce`, `float`, `shimmer`, `wiggle`, `spin` (dekorativ), skroll bilan paydo bo'lish effektlari, parallaks, hover'da kartaning ko'tarilishi yoki kattalashishi, kirish animatsiyalari (`framer-motion`, `AOS` va shu kabi kutubxonalar orqali).
- **Sahifa va komponent o'tishlari:** ekranlar, modallar va ro'yxatlar animatsiyasiz, bir zumda almashsin.
- **Ruxsat etilgan yagona istisno:** `transition` orqali rang yoki fonning o'zgarishi (hover, focus), davomiyligi **150ms dan oshmasin**. Yuklanish indikatori (spinner) faqat haqiqiy kutish holatida ishlatilishi mumkin.
- `prefers-reduced-motion` sozlamasi doim hurmat qilinsin.

## 5. Umumiy tamoyil
- Har bir vizual element **funksiyaga xizmat qilishi** kerak. Agar element faqat "chiroyli ko'rinish" uchun bo'lsa, uni olib tashlang.
- Shubha tug'ilsa, **soddaroq va kamroq** variantni tanlang.