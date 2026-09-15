// Lightweight Telegram Bot Service for Mini App Launch
// Only handles greetings with WebApp buttons for students and backup commands for admin

export const createBotService = ({
  _supabase,
  botToken,
  adminChatId,
  webAppUrl: customWebAppUrl
}) => {
  const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;
  const webAppUrl =
    customWebAppUrl ||
    process.env.MINI_APP_URL ||
    'https://student-rate-app.vercel.app/?auth=login';

  // Helper: Send message to chat via Telegram Bot API
  const sendTelegramMessage = async (chatId, text, extra = {}) => {
    try {
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          ...extra
        })
      });
      return await response.json();
    } catch (err) {
      console.error('[Bot Service] Error sending message:', err);
      return null;
    }
  };

  // Helper: Set native Telegram bottom-left Menu Button to open Web App
  const setChatMenuButton = async () => {
    try {
      await fetch(`${TELEGRAM_API}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: 'Ilovani ochish',
            web_app: { url: webAppUrl }
          }
        })
      });
    } catch (err) {
      console.warn('[Bot Service] Failed to set menu button:', err.message);
    }
  };

  // Initialize menu button on start
  setChatMenuButton();

  // Keyboards for Students / General Users
  const STUDENT_INLINE_KEYBOARD = {
    inline_keyboard: [
      [
        {
          text: "📱 Mini App'ni ochish",
          web_app: { url: webAppUrl }
        }
      ]
    ]
  };

  const STUDENT_REPLY_KEYBOARD = {
    keyboard: [
      [
        {
          text: "📱 Mini App'ni ochish",
          web_app: { url: webAppUrl }
        }
      ]
    ],
    resize_keyboard: true
  };

  // Keyboards for Admin
  const ADMIN_INLINE_KEYBOARD = {
    inline_keyboard: [
      [
        {
          text: "📱 Mini App'ni ochish",
          web_app: { url: webAppUrl }
        }
      ]
    ]
  };

  const ADMIN_REPLY_KEYBOARD = {
    keyboard: [
      [
        {
          text: "📱 Mini App'ni ochish",
          web_app: { url: webAppUrl }
        }
      ],
      [
        {
          text: "💾 Zaxiralash (/backup)"
        }
      ]
    ],
    resize_keyboard: true
  };

  // Main Update Handler
  const handleTelegramUpdate = async (update) => {
    if (!update) return;

    // Handle old callback queries if any
    if (update.callback_query) {
      try {
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
            text: "Iltimos, Mini App orqali kiring."
          })
        });
      } catch (_) {}
      return;
    }

    const message = update.message || update.edited_message;
    if (!message || !message.chat) return;

    const chatId = String(message.chat.id);
    const text = (message.text || '').trim();
    const isAdmin = String(chatId) === String(adminChatId);

    // If Admin
    if (isAdmin) {
      if (text === '/backup' || text.startsWith('💾 Zaxiralash')) {
        // Handled directly by server.js webhook / polling loop
        return;
      }

      const adminMsg =
        `👋 *Salom Admin!*\n\n` +
        `Epchil Robot boshqaruv botidasiz.\n\n` +
        `📱 O'quvchilar tizimiga kirish uchun *Mini App'ni ochish* tugmasini bosing.\n` +
        `💾 Barcha bazalarni zaxiralash uchun /backup buyrug'ini yuboring.`;

      await sendTelegramMessage(chatId, adminMsg, {
        reply_markup: {
          ...ADMIN_INLINE_KEYBOARD,
          ...ADMIN_REPLY_KEYBOARD
        }
      });
      return;
    }

    // For Students / All other users
    const studentGreeting =
      `Assalomu alaykum! 👋\n\n` +
      `*Epchil Robot* o'quvchilar platformasiga xush kelibsiz!\n\n` +
      `Dars jadvali, baholar, oylik davomat va guruh reytingingizni ko'rish uchun quyidagi tugma orqali *Mini App'ni oching*:`;

    await sendTelegramMessage(chatId, studentGreeting, {
      reply_markup: {
        inline_keyboard: STUDENT_INLINE_KEYBOARD.inline_keyboard
      }
    });

  };

  return {
    handleTelegramUpdate,
    sendTelegramMessage,
    setChatMenuButton
  };
};
