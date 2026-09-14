import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSIONS_FILE = path.join(__dirname, 'storage', 'bot_sessions.json');

// Memory store for user interactive states (e.g. 'WAITING_FOR_GROUP_PASSWORD')
const userStates = new Map();

// Local fallback store
const initSessions = () => {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2));
    } catch (_) {}
  }
};

const getSessionsLocal = () => {
  try {
    initSessions();
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
};


// Persistent Reply Keyboard
const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '🏠 Asosiy' }, { text: '🏆 Reyting' }, { text: '🛍 Do\'kon' }],
    [{ text: '🔄 Guruhni almashtirish' }]
  ],
  resize_keyboard: true
};

// Telegram API Helper Functions
export const createBotService = ({ supabase, botToken, adminChatId }) => {
  const TELEGRAM_API = `https://api.telegram.org/bot${botToken}`;

  const getKeyboardForChat = (chatId) => {
    if (String(chatId) === String(adminChatId)) {
      return {
        keyboard: [
          [{ text: '🏠 Asosiy' }, { text: '🏆 Reyting' }, { text: '🛍 Do\'kon' }],
          [{ text: '🔄 Guruhni almashtirish' }],
          [{ text: '⚙️ Admin menyusi' }]
        ],
        resize_keyboard: true
      };
    }
    return MAIN_KEYBOARD;
  };


  // Normalizes session to guarantee profiles array and activeProfileId
  const normalizeSession = (raw) => {
    if (!raw) return null;
    let profiles = Array.isArray(raw.profiles) ? [...raw.profiles] : [];

    // Migrate old single-profile session if profiles is empty
    if (profiles.length === 0 && (raw.groupId || raw.studentId)) {
      profiles.push({
        id: `prof_${raw.groupId || 'g'}_${raw.studentId || 's'}`,
        teacherId: raw.teacherId,
        groupId: raw.groupId,
        studentId: raw.studentId,
        groupName: raw.groupName || 'Guruh',
        studentName: raw.studentName || 'O\'quvchi'
      });
    }

    let activeProfileId = raw.activeProfileId;
    let activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile && profiles.length > 0) {
      activeProfile = profiles[0];
      activeProfileId = activeProfile.id;
    }

    if (!activeProfile) return null;

    return {
      teacherId: activeProfile.teacherId,
      groupId: activeProfile.groupId,
      studentId: activeProfile.studentId,
      groupName: activeProfile.groupName,
      studentName: activeProfile.studentName,
      profiles,
      activeProfileId,
      ...(raw.data || {})
    };
  };

  // Supabase + Local Fallback Session Handlers
  const getSession = async (chatId) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('bot_sessions')
          .select('*')
          .eq('chat_id', String(chatId))
          .maybeSingle();
        if (!error && data) {
          return normalizeSession({
            teacherId: data.teacher_id,
            groupId: data.group_id,
            studentId: data.student_id,
            ...(data.data || {})
          });
        }
      }
    } catch (err) {
      console.warn('[Bot Sessions] Supabase get error, fallback to local:', err.message);
    }
    const local = getSessionsLocal();
    const raw = local[String(chatId)] || null;
    return normalizeSession(raw);
  };

  const saveSession = async (chatId, sessionData) => {
    try {
      if (supabase) {
        const { teacherId, groupId, studentId, ...rest } = sessionData;
        await supabase
          .from('bot_sessions')
          .upsert({
            chat_id: String(chatId),
            teacher_id: String(teacherId || ''),
            group_id: String(groupId || ''),
            student_id: String(studentId || ''),
            data: rest,
            updated_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.warn('[Bot Sessions] Supabase save error:', err.message);
    }
    try {
      const local = getSessionsLocal();
      local[String(chatId)] = {
        ...sessionData,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(local, null, 2));
    } catch (_) {}
  };

  const addProfileToSession = async (chatId, newProfile) => {
    const current = await getSession(chatId);
    let profiles = current?.profiles ? [...current.profiles] : [];

    const existingIndex = profiles.findIndex(
      p => String(p.groupId) === String(newProfile.groupId) && String(p.studentId) === String(newProfile.studentId)
    );

    const profileId = existingIndex >= 0 
      ? profiles[existingIndex].id 
      : `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const fullProfile = {
      id: profileId,
      teacherId: newProfile.teacherId,
      groupId: newProfile.groupId,
      studentId: newProfile.studentId,
      groupName: newProfile.groupName || 'Guruh',
      studentName: newProfile.studentName || 'O\'quvchi'
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = fullProfile;
    } else {
      profiles.push(fullProfile);
    }

    const sessionPayload = {
      teacherId: fullProfile.teacherId,
      groupId: fullProfile.groupId,
      studentId: fullProfile.studentId,
      groupName: fullProfile.groupName,
      studentName: fullProfile.studentName,
      profiles,
      activeProfileId: profileId
    };

    await saveSession(chatId, sessionPayload);
    return sessionPayload;
  };

  const switchActiveProfile = async (chatId, profileId) => {
    const current = await getSession(chatId);
    if (!current || !Array.isArray(current.profiles)) return null;

    const target = current.profiles.find(p => p.id === profileId);
    if (!target) return null;

    const sessionPayload = {
      teacherId: target.teacherId,
      groupId: target.groupId,
      studentId: target.studentId,
      groupName: target.groupName,
      studentName: target.studentName,
      profiles: current.profiles,
      activeProfileId: profileId
    };

    await saveSession(chatId, sessionPayload);
    return target;
  };

  const removeProfileFromSession = async (chatId, profileId) => {
    const current = await getSession(chatId);
    if (!current || !Array.isArray(current.profiles)) return null;

    const remaining = current.profiles.filter(p => p.id !== profileId);
    if (remaining.length === 0) {
      await clearSession(chatId);
      return null;
    }

    let activeProfileId = current.activeProfileId;
    let activeProfile = remaining.find(p => p.id === activeProfileId);
    if (!activeProfile) {
      activeProfile = remaining[0];
      activeProfileId = activeProfile.id;
    }

    const sessionPayload = {
      teacherId: activeProfile.teacherId,
      groupId: activeProfile.groupId,
      studentId: activeProfile.studentId,
      groupName: activeProfile.groupName,
      studentName: activeProfile.studentName,
      profiles: remaining,
      activeProfileId
    };

    await saveSession(chatId, sessionPayload);
    return sessionPayload;
  };

  const clearSession = async (chatId) => {
    try {
      if (supabase) {
        await supabase.from('bot_sessions').delete().eq('chat_id', String(chatId));
      }
    } catch (err) {
      console.warn('[Bot Sessions] Supabase delete error:', err.message);
    }
    try {
      const local = getSessionsLocal();
      delete local[String(chatId)];
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(local, null, 2));
    } catch (_) {}
  };


  const sendTelegramMessage = async (chatId, text, options = {}) => {
    try {
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options
      };
      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('[Telegram send error]:', err);
      return null;
    }
  };

  const editTelegramMessage = async (chatId, messageId, text, options = {}) => {
    try {
      const payload = {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        ...options
      };
      const res = await fetch(`${TELEGRAM_API}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('[Telegram edit error]:', err);
      return null;
    }
  };

  const answerCallbackQuery = async (callbackQueryId, text = '') => {
    try {
      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text
        })
      });
    } catch (err) {
      console.error('[Telegram answerCallbackQuery error]:', err);
    }
  };

  // Database Query Helpers
  const verifyGroupPassword = async (password) => {
    const clean = password.trim().toLowerCase();
    
    // 1. Check group_passwords registry
    try {
      const { data, error } = await supabase
        .from('group_passwords')
        .select('*')
        .eq('password', clean)
        .maybeSingle();

      if (!error && data) {
        return { teacherId: data.teacher_id, groupId: data.group_id };
      }
    } catch (e) {
      console.warn('[DB] group_passwords check error:', e);
    }

    // 2. Fallback check across all teachers appdata
    const teachers = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
    for (const tId of teachers) {
      try {
        const { data: row } = await supabase
          .from('appdata')
          .select('data')
          .eq('teacher_id', tId)
          .maybeSingle();
        if (row && row.data && Array.isArray(row.data.groups)) {
          const found = row.data.groups.find(
            g => !g.deleted && g.password && g.password.trim().toLowerCase() === clean
          );
          if (found) {
            return { teacherId: tId, groupId: found.id, groupName: found.name };
          }
        }
      } catch (_) {}
    }

    return null;
  };

  const getTeacherData = async (teacherId) => {
    try {
      const { data: row, error } = await supabase
        .from('appdata')
        .select('data')
        .eq('teacher_id', teacherId)
        .maybeSingle();
      if (error || !row) return null;
      return row.data;
    } catch (err) {
      console.error('[DB] getTeacherData error:', err);
      return null;
    }
  };

  const getAllTeachersData = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('appdata')
        .select('teacher_id, data');
      if (error || !rows) return [];
      return rows.map(r => ({ teacherId: r.teacher_id, ...r.data }));
    } catch (err) {
      console.error('[DB] getAllTeachersData error:', err);
      return [];
    }
  };

  // Time & Statistics Calculation Helpers
  const getStartOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getStartOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  };

  const getStartOfLastMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
  };

  const getEndOfLastMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
  };

  const calculateStudentScores = (transactions, students, timeframe = 'today') => {
    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();
    const startOfLastMonth = getStartOfLastMonth();
    const endOfLastMonth = getEndOfLastMonth();

    const scoreMap = new Map();
    students.forEach(s => scoreMap.set(String(s.id), 0));

    (transactions || []).forEach(tx => {
      if (tx.deleted) return;
      const sId = String(tx.studentId);
      if (!scoreMap.has(sId)) return;

      let valid = true;
      const txDate = new Date(tx.timestamp);
      if (timeframe === 'today') {
        valid = txDate >= startOfToday;
      } else if (timeframe === 'month') {
        valid = txDate >= startOfMonth;
      } else if (timeframe === 'lastMonth') {
        valid = txDate >= startOfLastMonth && txDate <= endOfLastMonth;
      }

      if (valid) {
        scoreMap.set(sId, (scoreMap.get(sId) || 0) + (Number(tx.amount) || 0));
      }
    });

    const ranked = students.map(s => ({
      ...s,
      score: scoreMap.get(String(s.id)) || 0
    })).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.name || '').localeCompare(b.name || '');
    });

    let rank = 0;
    let lastScore = null;
    return ranked.map(st => {
      if (st.score !== lastScore) {
        rank += 1;
        lastScore = st.score;
      }
      return { ...st, rank };
    });
  };

  const calculateNextLesson = (group) => {
    let days = Array.isArray(group?.schedule?.days) ? [...group.schedule.days] : [];
    if (days.length === 0 && group?.name) {
      const lower = group.name.toLowerCase();
      if (lower.includes('dushanba')) days = ['mon'];
      else if (lower.includes('seshanba')) days = ['tue'];
      else if (lower.includes('chorshanba')) days = ['wed'];
      else if (lower.includes('payshanba')) days = ['thu'];
      else if (lower.includes('juma')) days = ['fri'];
      else if (lower.includes('shanba')) days = ['sat'];
      else if (lower.includes('yakshanba')) days = ['sun'];
    }

    let startTimeStr = group?.schedule?.startTime?.trim();
    if (!startTimeStr && group?.name) {
      const match = group.name.match(/(\d{1,2})[:.](\d{2})/);
      if (match) startTimeStr = `${match[1]}:${match[2]}`;
    }

    if (days.length === 0 || !startTimeStr) {
      return "Belgilanmagan";
    }

    const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const DAY_NAMES = {
      mon: 'Dushanba',
      tue: 'Seshanba',
      wed: 'Chorshanba',
      thu: 'Payshanba',
      fri: 'Juma',
      sat: 'Shanba',
      sun: 'Yakshanba'
    };

    const now = new Date();
    const currentDayIdx = now.getDay();
    const currentDayKey = DAY_KEYS[currentDayIdx];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const timeParts = startTimeStr.split(':');
    const startMins = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1] || '0', 10);

    if (days.includes(currentDayKey) && currentMins <= startMins) {
      return `Bugun soat ${startTimeStr} da`;
    }

    for (let i = 1; i <= 7; i++) {
      const nextIdx = (currentDayIdx + i) % 7;
      const nextKey = DAY_KEYS[nextIdx];
      if (days.includes(nextKey)) {
        if (i === 1) return `Ertaga soat ${startTimeStr} da`;
        return `Keyingi ${DAY_NAMES[nextKey] || nextKey} soat ${startTimeStr} da`;
      }
    }
    return `Soat ${startTimeStr} da`;
  };

  const formatScheduleDays = (group) => {
    let days = Array.isArray(group?.schedule?.days) ? [...group.schedule.days] : [];
    if (days.length === 0 && group?.name) {
      const lower = group.name.toLowerCase();
      if (lower.includes('dushanba')) days = ['mon'];
      else if (lower.includes('seshanba')) days = ['tue'];
      else if (lower.includes('chorshanba')) days = ['wed'];
      else if (lower.includes('payshanba')) days = ['thu'];
      else if (lower.includes('juma')) days = ['fri'];
      else if (lower.includes('shanba')) days = ['sat'];
      else if (lower.includes('yakshanba')) days = ['sun'];
    }

    const DAY_NAMES = {
      mon: 'Dushanba',
      tue: 'Seshanba',
      wed: 'Chorshanba',
      thu: 'Payshanba',
      fri: 'Juma',
      sat: 'Shanba',
      sun: 'Yakshanba'
    };

    if (days.length === 0) return "Belgilanmagan";
    return days.map(d => DAY_NAMES[d] || d).join(', ');
  };

  const calculateStudentAttendanceSummary = (attendanceList, groupId, studentId) => {
    const sIdStr = String(studentId);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let presentCount = 0;
    let excusedCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const recentRecords = [];

    (attendanceList || []).forEach(att => {
      if (String(att.groupId) !== String(groupId)) return;
      const status = att.records && att.records[sIdStr];
      if (!status) return;

      const [yStr, mStr] = (att.date || '').split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;

      if (y === currentYear && m === currentMonth) {
        if (status === 'present') presentCount++;
        else if (status === 'excused') excusedCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
      }

      recentRecords.push({ date: att.date, status });
    });

    const totalLessons = presentCount + excusedCount + absentCount + lateCount;
    let rate = 100;
    if (totalLessons > 0) {
      const earned = (presentCount * 1.0) + (lateCount * 0.8) + (excusedCount * 0.5);
      rate = Math.round((earned / totalLessons) * 100);
    }

    recentRecords.sort((a, b) => b.date.localeCompare(a.date));

    return {
      presentCount,
      excusedCount,
      absentCount,
      lateCount,
      totalLessons,
      rate,
      recent: recentRecords.slice(0, 5)
    };
  };

  // View Handlers

  // 1. Welcome / Ask Password
  const promptGroupPassword = async (chatId, isRetry = false, canCancel = false) => {
    userStates.set(String(chatId), 'WAITING_FOR_GROUP_PASSWORD');
    const msg = isRetry
      ? "❌ <b>Noto'g'ri parol kiritildi!</b>\n\nIltimos, ustozingiz bergan guruh parolini to'g'ri kiriting (masalan: <code>olma</code>, <code>anor</code>):"
      : "👋 <b>Assalomu alaykum!</b>\nO'quvchilar va ota-onalar portaliga xush kelibsiz.\n\nIltimos, davom etish uchun <b>guruhingiz parolini</b> kiriting:";
    
    const options = {};
    if (canCancel) {
      options.reply_markup = {
        inline_keyboard: [
          [{ text: '❌ Bekor qilish (Ortga)', callback_data: 'cancel_add_group' }]
        ]
      };
    }
    await sendTelegramMessage(chatId, msg, options);
  };

  // 2. Select Student Profile Screen
  const showStudentSelection = async (chatId, teacherId, groupId, groupName, students) => {
    if (!students || students.length === 0) {
      await sendTelegramMessage(chatId, "⚠️ Ushbu guruhda hali o'quvchilar ro'yxati shakllanmagan. Iltimos, ustozingiz bilan bog'laning.");
      return;
    }

    const inline_keyboard = [];
    for (let i = 0; i < students.length; i += 2) {
      const row = [
        {
          text: `👤 ${students[i].name}`,
          callback_data: `sel_st:${teacherId}:${groupId}:${students[i].id}`
        }
      ];
      if (students[i + 1]) {
        row.push({
          text: `👤 ${students[i + 1].name}`,
          callback_data: `sel_st:${teacherId}:${groupId}:${students[i + 1].id}`
        });
      }
      inline_keyboard.push(row);
    }

    const session = await getSession(chatId);
    if (session) {
      inline_keyboard.push([
        { text: '❌ Bekor qilish (Ortga)', callback_data: 'cancel_add_group' }
      ]);
    }

    const text = `✅ <b>Guruh topildi:</b> ${groupName}\n\n👤 <b>Siz kimning profilisiz?</b>\nQuyidagi ro'yxatdan o'z ismingizni (yoki farzandingiz ismini) tanlang:`;
    await sendTelegramMessage(chatId, text, {
      reply_markup: { inline_keyboard }
    });
  };

  // 3. Home View (Asosiy)
  const renderHomeView = async (chatId, messageId = null) => {
    const session = await getSession(chatId);
    if (!session) {
      await promptGroupPassword(chatId);
      return;
    }

    const profiles = Array.isArray(session.profiles) && session.profiles.length > 0
      ? session.profiles
      : [{
          id: 'default',
          teacherId: session.teacherId,
          groupId: session.groupId,
          studentId: session.studentId,
          groupName: session.groupName,
          studentName: session.studentName
        }];

    // Pre-fetch teacher data for all unique teachers
    const teacherDataMap = new Map();
    for (const p of profiles) {
      if (p.teacherId && !teacherDataMap.has(p.teacherId)) {
        try {
          const tData = await getTeacherData(p.teacherId);
          if (tData) {
            teacherDataMap.set(p.teacherId, tData);
          }
        } catch (err) {
          console.warn('[HomeView] Teacher data load error:', err.message);
        }
      }
    }

    const activeProfileId = session.activeProfileId || profiles[0]?.id;
    const cards = profiles.map((p, idx) => {
      const tData = teacherDataMap.get(p.teacherId);
      const group = (tData?.groups || []).find(g => String(g.id) === String(p.groupId));
      const student = (tData?.students || []).find(s => String(s.id) === String(p.studentId));

      const groupName = group ? group.name : (p.groupName || 'Guruh');
      const studentName = student ? student.name : (p.studentName || 'O\'quvchi');
      const daysText = group ? formatScheduleDays(group) : 'Belgilanmagan';
      const timeText = group?.schedule?.startTime
        ? (group?.schedule?.endTime ? `${group.schedule.startTime} - ${group.schedule.endTime}` : group.schedule.startTime)
        : (group?.name?.match(/(\d{1,2}[:.]\d{2})/)?.[0] || 'Belgilanmagan');
      const roomText = group?.schedule?.room ? `${group.schedule.room}` : 'Xona ko\'rsatilmagan';
      const nextLessonText = group ? calculateNextLesson(group) : 'Noma\'lum';
      const isActive = p.id === activeProfileId || (!activeProfileId && idx === 0);

      return {
        id: p.id,
        group,
        groupName,
        studentName,
        daysText,
        timeText,
        roomText,
        nextLessonText,
        isActive,
        idx
      };
    });

    let text = '';
    const inline_keyboard = [];

    if (cards.length <= 1) {
      // Single Group
      const c = cards[0];
      text = `🏠 <b>Asosiy Ma'lumotlar</b>\n\n` +
        `👤 <b>O'quvchi:</b> ${c.studentName}\n` +
        `📚 <b>Guruh:</b> ${c.groupName}\n\n` +
        `📅 <b>Dars kunlari:</b> ${c.daysText}\n` +
        `⏰ <b>Dars vaqti:</b> ${c.timeText}\n` +
        `🚪 <b>Xona:</b> ${c.roomText}\n\n` +
        `⏳ <b>Keyingi dars:</b> <b>${c.nextLessonText}</b>`;

      inline_keyboard.push([
        { text: '📊 Oylik davomatni ko\'rish', callback_data: 'view_att' }
      ]);
    } else {
      // Multi-Group (2 or more groups)
      const allSameStudent = cards.every(c => c.studentName === cards[0].studentName);
      const activeCard = cards.find(c => c.isActive) || cards[0];

      text = `🏠 <b>Mening Dars Jadvallarim</b>\n\n` +
        (allSameStudent ? `👤 <b>O'quvchi:</b> ${cards[0].studentName}\n` : '') +
        `📚 <b>Ulangan guruhlar:</b> <b>${cards.length} ta</b>\n`;

      cards.forEach((c, i) => {
        const activeBadge = c.isActive ? ' 🟢 <i>(Hozirgi faol)</i>' : '';
        const studentLine = (!allSameStudent) ? `👤 <b>O'quvchi:</b> ${c.studentName}\n` : '';

        text += `\n━━━━━━━━━━━━━━━━━━━━\n` +
          `📚 <b>${i + 1}-Guruh: ${c.groupName}</b>${activeBadge}\n` +
          studentLine +
          `📅 <b>Dars kunlari:</b> ${c.daysText}\n` +
          `⏰ <b>Dars vaqti:</b> ${c.timeText}\n` +
          `🚪 <b>Xona:</b> ${c.roomText}\n` +
          `⏳ <b>Keyingi dars:</b> <b>${c.nextLessonText}</b>\n`;
      });

      text += `\n💡 <i>Davomat va reyting ma'lumotlarini ko'rish uchun quyidagi tugmalardan guruhni tanlashingiz mumkin:</i>`;

      inline_keyboard.push([
        { text: `📊 ${activeCard.groupName} davomati`, callback_data: 'view_att' }
      ]);

      const inactiveCards = cards.filter(c => !c.isActive);
      for (const ic of inactiveCards) {
        inline_keyboard.push([
          { text: `🔄 ${ic.groupName}ga o'tish (Faol qilish)`, callback_data: `switch_prof:${ic.id}` }
        ]);
      }
    }

    if (messageId) {
      await editTelegramMessage(chatId, messageId, text, {
        reply_markup: { inline_keyboard }
      });
    } else {
      await sendTelegramMessage(chatId, text, {
        reply_markup: { inline_keyboard }
      });
    }
  };

  // 4. Attendance Detail View
  const renderAttendanceView = async (chatId, messageId) => {
    const session = await getSession(chatId);
    if (!session) return;

    const data = await getTeacherData(session.teacherId);
    if (!data) return;

    const group = (data.groups || []).find(g => String(g.id) === String(session.groupId));
    const student = (data.students || []).find(s => String(s.id) === String(session.studentId));
    const studentName = student ? student.name : session.studentName;
    const groupName = group ? group.name : session.groupName;

    const summary = calculateStudentAttendanceSummary(data.attendance || [], session.groupId, session.studentId);

    let recentText = '';
    if (summary.recent.length > 0) {
      recentText = '\n\n🗓 <b>So\'nggi darslar:</b>\n' + summary.recent.map(r => {
        const icon = r.status === 'present' ? '🟢 Kelgan'
          : r.status === 'late' ? '🟠 Kechikkan'
          : r.status === 'excused' ? '🟡 Sababli'
          : '🔴 Kelmagan';
        return `• <code>${r.date}</code> — ${icon}`;
      }).join('\n');
    }

    const text = `📊 <b>Oylik Davomat Hisoboti</b>\n\n` +
      `👤 <b>O'quvchi:</b> ${studentName}\n` +
      `📚 <b>Guruh:</b> ${groupName}\n\n` +
      `✅ Qatnashdi: <b>${summary.presentCount} ta dars</b>\n` +
      `🟠 Kechikdi: <b>${summary.lateCount} ta</b>\n` +
      `🟡 Sababli: <b>${summary.excusedCount} ta</b>\n` +
      `🔴 Kelmadi: <b>${summary.absentCount} ta</b>\n` +
      `📈 <b>Davomat ko'rsatkichi:</b> <b>${summary.rate}%</b>` +
      recentText;

    const inline_keyboard = [];
    if (Array.isArray(session.profiles) && session.profiles.length > 1) {
      const otherProfiles = session.profiles.filter(p => p.id !== session.activeProfileId);
      for (const op of otherProfiles) {
        inline_keyboard.push([
          { text: `🔄 ${op.groupName} davomatiga o'tish`, callback_data: `switch_att_prof:${op.id}` }
        ]);
      }
    }
    inline_keyboard.push([
      { text: '⬅️ Asosiy jadvalga qaytish', callback_data: 'view_home' }
    ]);

    await editTelegramMessage(chatId, messageId, text, {
      reply_markup: { inline_keyboard }
    });
  };

  // 5. Rating View
  const renderRatingView = async (chatId, timeframe = 'today', messageId = null) => {
    const session = await getSession(chatId);
    if (!session) {
      await promptGroupPassword(chatId);
      return;
    }

    const data = await getTeacherData(session.teacherId);
    if (!data) return;

    const group = (data.groups || []).find(g => String(g.id) === String(session.groupId));
    const groupStudents = (data.students || []).filter(s => String(s.groupId) === String(session.groupId) && !s.deleted);
    const groupName = group ? group.name : (session.groupName || 'Guruh');

    const ranked = calculateStudentScores(data.transactions || [], groupStudents, timeframe);

    const timeframeLabels = {
      today: 'Bugun',
      month: 'Bu oy',
      lastMonth: 'O\'tgan oy',
      all: 'Kurs davomida'
    };

    const currentLabel = timeframeLabels[timeframe] || 'Bu oy';

    // Daily star check
    let starText = '';
    if (timeframe === 'today') {
      const top1 = ranked[0];
      if (top1 && top1.score > 0) {
        starText = `\n⭐ <b>Bugungi dars yulduzi:</b> <b>${top1.name}</b> (+${top1.score} ball)\n`;
      } else {
        starText = `\n<i>Bugungi darsda hali ballar berilmadi</i>\n`;
      }
    }

    // Format list
    let listText = '';
    if (ranked.length === 0) {
      listText = "<i>Guruhda o'quvchilar mavjud emas</i>";
    } else {
      listText = ranked.map(st => {
        const medal = st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `${st.rank}.`;
        const isMe = String(st.id) === String(session.studentId);
        const nameDisplay = isMe ? `<b>${st.name} (Siz)</b>` : st.name;
        return `${medal} ${nameDisplay} — <b>${st.score}</b> ball`;
      }).join('\n');
    }

    // Find user's rank
    const myRankInfo = ranked.find(s => String(s.id) === String(session.studentId));
    let myRankFooter = '';
    if (myRankInfo) {
      myRankFooter = `\n\n📌 <b>Sizning o'rningiz:</b> <b>${myRankInfo.rank}-o'rin</b> (${myRankInfo.score} ball)`;
    }

    const text = `🏆 <b>"${groupName}" guruhi reytingi</b>\n` +
      `📅 Davr: <b>${currentLabel}</b>\n` +
      starText + '\n' +
      listText +
      myRankFooter;

    const inline_keyboard = [
      [{ text: timeframe === 'today' ? '• Bugun •' : 'Bugun', callback_data: 'rate_tf:today' }],
      [{ text: timeframe === 'month' ? '• Bu oy •' : 'Bu oy', callback_data: 'rate_tf:month' }],
      [{ text: timeframe === 'lastMonth' ? '• O\'tgan oy •' : 'O\'tgan oy', callback_data: 'rate_tf:lastMonth' }],
      [{ text: timeframe === 'all' ? '• Barchasi •' : 'Barchasi', callback_data: 'rate_tf:all' }],
      [{ text: '📜 Baholar tarixi', callback_data: 'rate_history' }],
      [{ text: '🌐 Umumiy TOP 10', callback_data: 'rate_top10' }]
    ];

    if (Array.isArray(session.profiles) && session.profiles.length > 1) {
      const otherProfiles = session.profiles.filter(p => p.id !== session.activeProfileId);
      for (const op of otherProfiles) {
        inline_keyboard.push([
          { text: `🔄 ${op.groupName} reytingiga o'tish`, callback_data: `switch_rate_prof:${op.id}` }
        ]);
      }
    }

    if (messageId) {
      await editTelegramMessage(chatId, messageId, text, {
        reply_markup: { inline_keyboard }
      });
    } else {
      await sendTelegramMessage(chatId, text, {
        reply_markup: { inline_keyboard }
      });
    }
  };

  // 6. Rating History View
  const renderHistoryView = async (chatId, messageId) => {
    const session = await getSession(chatId);
    if (!session) return;

    const data = await getTeacherData(session.teacherId);
    if (!data) return;

    const student = (data.students || []).find(s => String(s.id) === String(session.studentId));
    const studentName = student ? student.name : session.studentName;

    const myTxs = (data.transactions || [])
      .filter(t => !t.deleted && String(t.studentId) === String(session.studentId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const totalScore = (data.transactions || [])
      .filter(t => !t.deleted && String(t.studentId) === String(session.studentId))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    let txsList = '';
    if (myTxs.length === 0) {
      txsList = "<i>Hozircha baholar tarixi mavjud emas</i>";
    } else {
      txsList = myTxs.map(t => {
        const d = new Date(t.timestamp).toLocaleDateString('uz-UZ');
        const sign = t.amount >= 0 ? `+${t.amount}` : `${t.amount}`;
        const comment = t.comment ? ` — <i>${t.comment}</i>` : '';
        return `• <code>${d}</code>: <b>${sign} ball</b>${comment}`;
      }).join('\n');
    }

    const text = `📜 <b>${studentName} — Baholar va Ballar Tarixi</b>\n\n` +
      txsList +
      `\n\n💰 Jami to'plangan: <b>${totalScore} ball</b>`;

    const inline_keyboard = [
      [{ text: '⬅️ Guruh reytingiga qaytish', callback_data: 'rate_tf:month' }]
    ];

    await editTelegramMessage(chatId, messageId, text, {
      reply_markup: { inline_keyboard }
    });
  };

  // 7. Overall TOP 10 View
  const renderTop10View = async (chatId, messageId) => {
    const session = await getSession(chatId);
    if (!session) return;

    const allData = await getAllTeachersData();
    let allStudents = [];
    let allTransactions = [];

    allData.forEach(d => {
      if (Array.isArray(d.students)) allStudents.push(...d.students.filter(s => !s.deleted));
      if (Array.isArray(d.transactions)) allTransactions.push(...d.transactions.filter(t => !t.deleted));
    });

    const ranked = calculateStudentScores(allTransactions, allStudents, 'month').slice(0, 10);

    let listText = '';
    if (ranked.length === 0) {
      listText = "<i>Umumiy reyting hozircha bo'sh</i>";
    } else {
      listText = ranked.map(st => {
        const medal = st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `${st.rank}.`;
        const isMe = String(st.id) === String(session.studentId);
        const nameDisplay = isMe ? `<b>${st.name} (Siz)</b>` : st.name;
        return `${medal} ${nameDisplay} — <b>${st.score}</b> ball`;
      }).join('\n');
    }

    const text = `🌐 <b>Barcha guruhlar bo'yicha Umumiy TOP 10</b>\n` +
      `📅 Davr: <b>Bu oy</b>\n\n` +
      listText;

    const inline_keyboard = [
      [{ text: '⬅️ Guruh reytingiga qaytish', callback_data: 'rate_tf:month' }]
    ];

    await editTelegramMessage(chatId, messageId, text, {
      reply_markup: { inline_keyboard }
    });
  };

  // 8. Shop View
  const renderShopView = async (chatId) => {
    const session = await getSession(chatId);
    if (!session) {
      await promptGroupPassword(chatId);
      return;
    }

    const data = await getTeacherData(session.teacherId);
    let myTotalScore = 0;
    if (data && Array.isArray(data.transactions)) {
      myTotalScore = data.transactions
        .filter(t => !t.deleted && String(t.studentId) === String(session.studentId))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }

    const text = `🛍 <b>O'quvchilar Sovg'alar Do'koni</b>\n\n` +
      `⏳ <b>Tez orada ishga tushadi!</b>\n\n` +
      `💰 <b>Sizning to'plagan ballaringiz:</b> <b>${myTotalScore} ball</b>\n\n` +
      `🎁 <b>Kutilayotgan sovg'alar:</b>\n` +
      `• 🎨 Ajoyib motivatsion stikerlar to'plami\n` +
      `• 🖊 Maxsus brendlangan ruchkalar va daftarlar\n` +
      `• 🏆 Faxriy sertifikatlar va esdalik sovg'alar\n\n` +
      `Darslarda faol qatnashing, like to'plang va tez orada ularni qimmatbaho sovg'alarga almashtiring! ✨`;

    await sendTelegramMessage(chatId, text, {
      reply_markup: getKeyboardForChat(chatId)
    });
  };

  // 9. Switch Profile View (Multi-Group / Multi-Profile)
  const renderSwitchProfileView = async (chatId, messageId = null) => {
    const session = await getSession(chatId);
    if (!session) {
      await promptGroupPassword(chatId);
      return;
    }

    const profiles = Array.isArray(session.profiles) ? session.profiles : [];
    const activeId = session.activeProfileId;
    const inline_keyboard = [];

    // List all connected groups & profiles
    for (const p of profiles) {
      const isActive = p.id === activeId;
      const label = isActive
        ? `• 🟢 ${p.groupName} — ${p.studentName} •`
        : `${p.groupName} — ${p.studentName}`;

      inline_keyboard.push([
        {
          text: label,
          callback_data: isActive ? 'noop' : `switch_prof:${p.id}`
        }
      ]);
    }

    // Action buttons
    inline_keyboard.push([
      { text: '➕ Yangi guruh ulash', callback_data: 'add_new_group' }
    ]);

    inline_keyboard.push([
      { text: '🔄 Shu guruhdan boshqa o\'quvchini tanlash', callback_data: 'switch_same_group' }
    ]);

    if (profiles.length > 1) {
      inline_keyboard.push([
        { text: '🗑 Guruhni o\'chirish (ajratish)', callback_data: 'manage_remove_group' }
      ]);
    }

    const activeProfile = profiles.find(p => p.id === activeId) || profiles[0] || session;
    const text = `👤 <b>Mening Guruhlarim va Profillarim</b>\n\n` +
      `📌 <b>Hozirgi faol guruh:</b> <b>${activeProfile.groupName}</b> (${activeProfile.studentName})\n\n` +
      `Boshqa guruh ma'lumotlarini (jadval, davomat, reyting) ko'rish uchun yuqoridagi ro'yxatdan tanlang yoki yangi guruh ulang:`;

    if (messageId) {
      await editTelegramMessage(chatId, messageId, text, {
        reply_markup: { inline_keyboard }
      });
    } else {
      await sendTelegramMessage(chatId, text, {
        reply_markup: { inline_keyboard }
      });
    }
  };

  // 10. Remove/Unlink Group View
  const renderRemoveGroupView = async (chatId, messageId = null) => {
    const session = await getSession(chatId);
    const profiles = Array.isArray(session?.profiles) ? session.profiles : [];

    if (!session || profiles.length <= 1) {
      await renderSwitchProfileView(chatId, messageId);
      return;
    }

    const inline_keyboard = [];
    for (const p of profiles) {
      inline_keyboard.push([
        {
          text: `❌ ${p.groupName} (${p.studentName})`,
          callback_data: `del_prof:${p.id}`
        }
      ]);
    }

    inline_keyboard.push([
      { text: '⬅️ Ortga qaytish', callback_data: 'back_to_profiles' }
    ]);

    const text = `🗑 <b>Qaysi guruhni Telegram akkauntingizdan uzmoqchisiz?</b>\n\n` +
      `<i>Eslatma: Guruh uzilganda dars natijalari va ballar o'chmaydi. Istalgan payt yangi guruh paroli orqali qayta ulashingiz mumkin.</i>`;

    if (messageId) {
      await editTelegramMessage(chatId, messageId, text, {
        reply_markup: { inline_keyboard }
      });
    } else {
      await sendTelegramMessage(chatId, text, {
        reply_markup: { inline_keyboard }
      });
    }
  };

  // Master Update Handler
  const handleTelegramUpdate = async (update) => {
    if (!update) return;

    // 1. Handle Messages
    if (update.message) {
      const msg = update.message;
      const chatId = String(msg.chat.id);
      const text = (msg.text || '').trim();

      // Check if user is Admin
      if (chatId === String(adminChatId)) {
        if (text === '/backup' || text.startsWith('💾 Zaxiralash')) {
          return; // Handled by server.js runAllBackups()
        }

        if (text === '/start' || text === '/admin' || text === '⚙️ Admin menyusi') {
          const adminText = `👋 <b>Salom Admin!</b>\n\n` +
            `Men epchil robot zaxiralash botiman.\n\n` +
            `Har kuni tunda barcha o'qituvchilar bazalarini .json qilib yuborib turaman.\n\n` +
            `Zaxiralashni hoziroq ishga tushirish uchun /backup buyrug'ini yuboring.`;

          const adminKeyboard = {
            keyboard: [
              [{ text: '💾 Zaxiralashni boshlash (/backup)' }],
              [{ text: '🎓 O\'quvchi rejimini tekshirish' }]
            ],
            resize_keyboard: true
          };

          await sendTelegramMessage(chatId, adminText, {
            reply_markup: adminKeyboard
          });
          return;
        }

        if (text === '🎓 O\'quvchi rejimini tekshirish') {
          const session = await getSession(chatId);
          if (session) {
            await sendTelegramMessage(chatId, `🎓 O'quvchi rejimiga o'tildi (Profil: <b>${session.studentName}</b>).`, {
              reply_markup: getKeyboardForChat(chatId)
            });
            await renderHomeView(chatId);
          } else {
            userStates.set(chatId, 'WAITING_FOR_GROUP_PASSWORD');
            await promptGroupPassword(chatId);
          }
          return;
        }
      }

      // /start command (for regular students)
      if (text === '/start') {
        const session = await getSession(chatId);
        if (session) {
          await sendTelegramMessage(chatId, `👋 Xush kelibsiz, <b>${session.studentName || 'O\'quvchi'}</b>!`, {
            reply_markup: getKeyboardForChat(chatId)
          });
          await renderHomeView(chatId);
        } else {
          await promptGroupPassword(chatId);
        }
        return;
      }

      // Handle Keyboard buttons FIRST (immediately clears WAITING_FOR_GROUP_PASSWORD)
      const MAIN_NAV_BUTTONS = [
        '🏠 Asosiy',
        '🏆 Reyting',
        '🛍 Do\'kon',
        '🔄 Guruhni almashtirish',
        '👥 Guruhni almashtirish',
        '👤 Guruhni almashtirish',
        'Guruhni almashtirish',
        '👤 Profilni almashtirish',
        '⚙️ Admin menyusi'
      ];
      if (MAIN_NAV_BUTTONS.includes(text)) {
        userStates.delete(chatId);
        if (text === '🏠 Asosiy') {
          await renderHomeView(chatId);
          return;
        }
        if (text === '🏆 Reyting') {
          await renderRatingView(chatId, 'today');
          return;
        }
        if (text === '🛍 Do\'kon') {
          await renderShopView(chatId);
          return;
        }
        if (
          text === '🔄 Guruhni almashtirish' ||
          text === '👥 Guruhni almashtirish' ||
          text === '👤 Guruhni almashtirish' ||
          text === 'Guruhni almashtirish' ||
          text === '👤 Profilni almashtirish'
        ) {
          await renderSwitchProfileView(chatId);
          return;
        }
      }

      // Check for explicit cancel command/text
      const lowerText = text.toLowerCase();
      if (lowerText === 'cancel' || lowerText === 'bekor qilish' || text === '/cancel') {
        userStates.delete(chatId);
        const session = await getSession(chatId);
        if (session) {
          await sendTelegramMessage(chatId, "❌ Amal bekor qilindi.", {
            reply_markup: getKeyboardForChat(chatId)
          });
          await renderSwitchProfileView(chatId);
        } else {
          await promptGroupPassword(chatId);
        }
        return;
      }

      // If waiting for password or user has no session and typed potential password
      const currentState = userStates.get(chatId);
      const session = await getSession(chatId);

      if (currentState === 'WAITING_FOR_GROUP_PASSWORD' || (!session && text && !text.startsWith('/'))) {
        const match = await verifyGroupPassword(text);
        if (match) {
          userStates.delete(chatId);
          const data = await getTeacherData(match.teacherId);
          const group = data?.groups?.find(g => String(g.id) === String(match.groupId));
          const groupStudents = (data?.students || []).filter(
            s => String(s.groupId) === String(match.groupId) && !s.deleted
          );
          const groupName = group ? group.name : (match.groupName || 'Guruh');

          await showStudentSelection(chatId, match.teacherId, match.groupId, groupName, groupStudents);
          return;
        } else if (currentState === 'WAITING_FOR_GROUP_PASSWORD') {
          await promptGroupPassword(chatId, true, Boolean(session));
          return;
        }
      }

      // Default fallback
      if (session) {
        await sendTelegramMessage(chatId, "Iltimos, quyidagi menyu tugmalaridan birini tanlang:", {
          reply_markup: getKeyboardForChat(chatId)
        });
      } else {
        await promptGroupPassword(chatId);
      }
      return;
    }

    // 2. Handle Callback Queries
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = String(cb.message.chat.id);
      const messageId = cb.message.message_id;
      const data = cb.data || '';

      await answerCallbackQuery(cb.id);

      // Student selection callback: sel_st:teacherId:groupId:studentId
      if (data.startsWith('sel_st:')) {
        const parts = data.split(':');
        const teacherId = parts[1];
        const groupId = parts[2];
        const studentId = parts[3];

        const tData = await getTeacherData(teacherId);
        const group = (tData?.groups || []).find(g => String(g.id) === String(groupId));
        const student = (tData?.students || []).find(s => String(s.id) === String(studentId));

        const updatedSession = await addProfileToSession(chatId, {
          teacherId,
          groupId,
          studentId,
          groupName: group?.name || '',
          studentName: student?.name || ''
        });

        const profileCount = updatedSession?.profiles?.length || 1;
        const extraNote = profileCount > 1 
          ? `\n\n💡 <i>Sizda hozir <b>${profileCount} ta</b> guruh ulangan. Istalgan vaqt "🔄 Guruhni almashtirish" orqali guruhlaringiz orasida o'tishingiz mumkin.</i>`
          : '';

        await sendTelegramMessage(chatId, `🎉 <b>Profil muvaffaqiyatli bog'landi!</b>\n\nSalom, <b>${student?.name || ''}</b>! Siz <b>${group?.name || 'guruh'}</b> a'zosi sifatida ulandingiz.${extraNote}`, {
          reply_markup: getKeyboardForChat(chatId)
        });

        await renderHomeView(chatId);
        return;
      }

      // Attendance view
      if (data === 'view_att') {
        await renderAttendanceView(chatId, messageId);
        return;
      }

      // Return to home schedule view
      if (data === 'view_home') {
        await renderHomeView(chatId, messageId);
        return;
      }

      // Timeframe rating callbacks: rate_tf:today, rate_tf:month, etc.
      if (data.startsWith('rate_tf:')) {
        const tf = data.split(':')[1];
        await renderRatingView(chatId, tf, messageId);
        return;
      }

      // Rating history
      if (data === 'rate_history') {
        await renderHistoryView(chatId, messageId);
        return;
      }

      // Overall TOP 10
      if (data === 'rate_top10') {
        await renderTop10View(chatId, messageId);
        return;
      }

      // No-op (e.g. clicking currently active profile)
      if (data === 'noop') {
        return;
      }

      // Switch active profile: switch_prof:<profileId>
      if (data.startsWith('switch_prof:')) {
        const profileId = data.replace('switch_prof:', '');
        const target = await switchActiveProfile(chatId, profileId);
        if (target) {
          await sendTelegramMessage(chatId, `✅ Faol guruh almashtirildi:\n📚 <b>${target.groupName}</b> — <b>${target.studentName}</b>`, {
            reply_markup: getKeyboardForChat(chatId)
          });
          await renderHomeView(chatId);
        } else {
          await renderSwitchProfileView(chatId, messageId);
        }
        return;
      }

      // Switch attendance group: switch_att_prof:<profileId>
      if (data.startsWith('switch_att_prof:')) {
        const profileId = data.replace('switch_att_prof:', '');
        await switchActiveProfile(chatId, profileId);
        await renderAttendanceView(chatId, messageId);
        return;
      }

      // Switch rating group: switch_rate_prof:<profileId>
      if (data.startsWith('switch_rate_prof:')) {
        const profileId = data.replace('switch_rate_prof:', '');
        await switchActiveProfile(chatId, profileId);
        await renderRatingView(chatId, 'today', messageId);
        return;
      }

      // Add new group
      if (data === 'add_new_group' || data === 'switch_new_group') {
        userStates.set(chatId, 'WAITING_FOR_GROUP_PASSWORD');
        const inline_keyboard = [
          [{ text: '❌ Bekor qilish (Ortga)', callback_data: 'cancel_add_group' }]
        ];
        await sendTelegramMessage(chatId, `🔑 <b>Yangi guruhni ulash</b>\n\nIltimos, yangi guruhingiz parolini kiriting:\n\n<i>(Bekor qilish uchun pastdagi tugmani yoki asosiy menyudagi istalgan bo'limni bosishingiz mumkin)</i>`, {
          reply_markup: { inline_keyboard }
        });
        return;
      }

      // Cancel adding new group
      if (data === 'cancel_add_group') {
        userStates.delete(chatId);
        await sendTelegramMessage(chatId, "❌ Yangi guruh ulash bekor qilindi.", {
          reply_markup: getKeyboardForChat(chatId)
        });
        await renderSwitchProfileView(chatId);
        return;
      }

      // Manage group removal
      if (data === 'manage_remove_group') {
        await renderRemoveGroupView(chatId, messageId);
        return;
      }

      // Delete/unlink a profile: del_prof:<profileId>
      if (data.startsWith('del_prof:')) {
        const profileId = data.replace('del_prof:', '');
        await removeProfileFromSession(chatId, profileId);
        await sendTelegramMessage(chatId, `🗑 Guruh muvaffaqiyatli uzildi.`);
        await renderSwitchProfileView(chatId);
        return;
      }

      // Back to profiles view
      if (data === 'back_to_profiles') {
        await renderSwitchProfileView(chatId, messageId);
        return;
      }

      // Switch: same group pick student
      if (data === 'switch_same_group') {
        const session = await getSession(chatId);
        if (!session) {
          await promptGroupPassword(chatId);
          return;
        }
        const tData = await getTeacherData(session.teacherId);
        const group = (tData?.groups || []).find(g => String(g.id) === String(session.groupId));
        const groupStudents = (tData?.students || []).filter(
          s => String(s.groupId) === String(session.groupId) && !s.deleted
        );
        await showStudentSelection(chatId, session.teacherId, session.groupId, group?.name || '', groupStudents);
        return;
      }
    }
  };

  // Long Polling Runner (for local development or environments without public webhook)
  let isPollingActive = false;
  let lastUpdateId = 0;

  const startPolling = async () => {
    // Check webhook info first
    try {
      const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
      const info = await res.json();
      if (info.ok && info.result && info.result.url && info.result.url.length > 0) {
        console.log(`[Telegram Bot] Active webhook registered at: ${info.result.url}. Polling not needed.`);
        return;
      }
    } catch (e) {
      console.warn('[Telegram Bot] getWebhookInfo check failed:', e);
    }

    if (isPollingActive) return;
    isPollingActive = true;
    console.log('[Telegram Bot] Long polling started successfully!');

    const poll = async () => {
      while (isPollingActive) {
        try {
          const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
          const data = await res.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              lastUpdateId = Math.max(lastUpdateId, update.update_id);
              await handleTelegramUpdate(update);
            }
          }
        } catch (err) {
          // Wait 3 seconds on network error before retrying
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    };

    poll();
  };

  const stopPolling = () => {
    isPollingActive = false;
  };

  return {
    handleTelegramUpdate,
    startPolling,
    stopPolling,
    sendTelegramMessage
  };
};
