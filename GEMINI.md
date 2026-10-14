# LOYIHA UCHUN QAT'IY DIZAYN VA KODLASH QOIDALARI

> [!CAUTION]
> Ushbu qoidalar qat'iy va majburiy hisoblanadi. Hech qanday holatda buzilishi mumkin emas!

## 1. Miltillovchi / Pulsatsiyalanuvchi LIVE Neondan Foydalanish Mutlaqo Taqiqlanadi
- Loyihaning **hech bir joyida** LIVE holatlar uchun pulsatsiyalanuvchi, miltillovchi neon doiralar (`pulsing dot`, `animation: pulse`, `live-dot` va boshqalar) ishlatilmasin!
- Barcha statuslar va holat belgilari **statik, bosiq, toza va professional Apple Minimalist uslubida** bo'lishi shart.

## 2. Default Stikerlar / Emojilar Mutlaqo Taqiqlanadi
- Ilovaning hech qaysi qismida (Student Portal, Teacher Panel, Reyting, Dars jadvali, Do'kon, Sozlamalar) tizimning standart emojilari (👍, 🏆, ⚡, 🔥, 📅, ⏰, 📍, 👤, 🎁 va hk) ishlatilmasin!
- Faqat va faqat **maxsus, toza chizilgan vektor SVG iconlar** (`StudentIcons.jsx` yoki maxsus SVG komponentlar) qo'llanilishi shart.

## 3. Dizayn va Ranglar Uyg'unligi
- Agar `#D8F10A` (Electric Lime / Volt) rangi ishlatilsa:
  - Faqat statik yuqori darajadagi nishonlar (badge) yoki kontrast urg'ular sifatida qo'llansin.
  - Har qanday pulsatsiya yoki ko'zni charchatuvchi animatsiyalar qat'iyan taqiqlanadi.
  - Ushbu rang fonida matn doimo yuqori kontrastli qora/to'q rangda (`#0D0E03`) bo'lishi shart, oq yozuv qo'yish taqiqlanadi.
