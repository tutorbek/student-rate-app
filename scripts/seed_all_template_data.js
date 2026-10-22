import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://unwonvkemmmtdsinhcnn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk5MzQ5OSwiZXhwIjoyMDk4NTY5NDk5fQ.IncJtVFP8hc-8IHNG8lXYbbPqBXOTfh1mNtYf-XyutA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const generateId = (prefix = 'id') => prefix + '_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);

// Pool of 70+ local avatar image paths
const AVATAR_IMAGES = [
  "/avatar_image/029acd093807f1bcc89415fafb02c735.jpg",
  "/avatar_image/04034cb64ef156918cb12c6a78ce7248.jpg",
  "/avatar_image/0df9e5f0253ec72d99245f6cea8b727b.jpg",
  "/avatar_image/0ef96c195aa3c64e100ccef8c0cc8c07.jpg",
  "/avatar_image/120c2d70de5aa9bfc88e8a3d4d631c4d.jpg",
  "/avatar_image/28d51f7d2af57a42930547a51929278d.jpg",
  "/avatar_image/291be98e437a152dbcc0ee06e94d2575.jpg",
  "/avatar_image/2aecbee919d257754e7befb3df1bf917.jpg",
  "/avatar_image/2e2ab0daaca2761f3bd1b466512d9bf8 copy.jpg",
  "/avatar_image/2f17064b9a1ba59020cba0d11ec87e32.jpg",
  "/avatar_image/3a1e4d7f043da97b4553ef33fe49f235.jpg",
  "/avatar_image/3aed85be420dc97dbc650b49401f579e copy.jpg",
  "/avatar_image/3bc71966224242a43686cb383a46d25f.jpg",
  "/avatar_image/456e374fc1732719e22ec0be865902e6.jpg",
  "/avatar_image/45dd5d31f5a544070621a25ada3284f8.jpg",
  "/avatar_image/507d0ac31c18f0e88fdd76529fee776b copy.jpg",
  "/avatar_image/53b7cba7bf7a93863f0ab54d7f1e5ca9.jpg",
  "/avatar_image/555e5e6a40392d3e277b898b3ced7e70 copy.jpg",
  "/avatar_image/5bbaaaacd83a6da5cc15db8606777b7d.jpg",
  "/avatar_image/6008305a58748a40e0098d2aa89c28b1 copy.jpg",
  "/avatar_image/60437ef8b666214f2d87c443784bc5bd.jpg",
  "/avatar_image/6a07b8a56885cdf07022eb2e9df423ae copy.jpg",
  "/avatar_image/70afaf00c2488350d6932253eacde95e.jpg",
  "/avatar_image/7162b638e2ad421f9f50b47c80ef8d37.jpg",
  "/avatar_image/730823c09371e650f600caf75fe21c4d.jpg",
  "/avatar_image/763f65dc9bec81e8a602553f25c0712e.jpg",
  "/avatar_image/7808d4179a2ce492b1043b3edbfb0cd5 copy.jpg",
  "/avatar_image/784c81ea61a5e193428f695ff7aecde6.jpg",
  "/avatar_image/7a665a956294f36759657ba8548b9636.jpg",
  "/avatar_image/7d747b8c0c1b0b19149a5333b4f506a0.jpg",
  "/avatar_image/7dd49a68112b4ed7c2ced6c3bbe40a4e copy.jpg",
  "/avatar_image/7eb0ad3404f6a6325b6f67cb2708b9ca.jpg",
  "/avatar_image/829e7577ae7a7c5577b346170824c3c1.jpg",
  "/avatar_image/8312a6f307442875735bce280dcd8e92 copy.jpg",
  "/avatar_image/87d239c65732f941a8f2d9cce9f245f9.jpg",
  "/avatar_image/88d54397082059995ea316d2ff7a2b28.jpg",
  "/avatar_image/9cea80318955424789370b4e9759c753 copy.jpg",
  "/avatar_image/a05575fff90785b949d021a4347692a8.jpg",
  "/avatar_image/a0ccebe6efd09642fbda79a1ddc389b3 copy.jpg",
  "/avatar_image/a1277303ec49ee936b2ba11bb3a98a18.jpg",
  "/avatar_image/a1fd64fd92390195e5e3b06a017ce77d.jpg",
  "/avatar_image/a27633c1aa307bba1180f13011caa18e.jpg",
  "/avatar_image/a4f7fdd87cda119c8898690fb2629ee0.jpg",
  "/avatar_image/a904edc462a1f220ffafc0f18b97865b.jpg",
  "/avatar_image/ac13bcde29ea95567506cb296e03c96a.jpg",
  "/avatar_image/b88374df1c986edae7d809f0d37fa6b5.jpg",
  "/avatar_image/b889d4df3ec4e5e0a6c03ac5271de5e4.jpg",
  "/avatar_image/b8eacc6c797b6c72643c5895d27af57c.jpg",
  "/avatar_image/b9c61abcc54ea9eeea1c1324077c2586 copy.jpg",
  "/avatar_image/be14edae96c32b1a919a0a9600d71cd7.jpg",
  "/avatar_image/c35ff6f644c827470cc36efaa3418e16.jpg",
  "/avatar_image/c55b77ca6dc0102fa33932d7b42ecc8d copy.jpg",
  "/avatar_image/cbd8c9232e7c0e0e700a86ca17a2db50 copy.jpg",
  "/avatar_image/cc8d036e3c53d960126c4a8508b038c1.jpg",
  "/avatar_image/ccba9232a5eff54b79270bf707a9985e.jpg",
  "/avatar_image/d30ef8e071b21c38462ac404660800a0.jpg",
  "/avatar_image/d43c19b9fdb4f555a7939dafe0f7fc48 copy.jpg",
  "/avatar_image/dd728c1fd43f342c8a579a51c569d929.jpg",
  "/avatar_image/e57e8a2eb6c67c691b6ca6ff19985528 copy.jpg",
  "/avatar_image/eca4586717905e0e4e7b623357162004.jpg",
  "/avatar_image/f08191e18006bfa72e69833641d733d1.jpg",
  "/avatar_image/f4075d3fdfdf01e3162a845403fdce5f.jpg",
  "/avatar_image/f487cced2fad85cf1010a36770443580 copy.jpg",
  "/avatar_image/f8788091366eca9323a9ff6b652332b1 copy.jpg",
  "/avatar_image/fb54642fc1a140fdabef8c272b144ba2.jpg",
  "/avatar_image/fb6096bdb641fee93a6a045973d6d904.jpg",
  "/avatar_image/fc55bab9d65e4aa2d805303695635ad1.jpg",
  "/avatar_image/fda537db313f67249e2d6789e8289bf5.jpg",
  "/avatar_image/ffad334c81c6326dd0e4a4e69dd557e8 copy.jpg",
];

// Uzbek Name Banks
const BOY_NAMES = [
  'Jasurbek', 'Rustam', 'Sardor', 'Diyorbek', 'Shahzod', 'Behruz', 'Javohir', 'Otabek',
  'Mirjalol', 'Ulug\'bek', 'Bobur', 'Anvar', 'Shohrux', 'Azizbek', 'Farrux', 'Kamron',
  'Asadbek', 'Eldor', 'Samandar', 'Bilol', 'Muzaffar', 'Sanjar', 'Abbos', 'Abror',
  'Doniyor', 'Shoxjahon', 'Jamshid', 'Humoyun', 'Nodirbek', 'Akbarshox', 'Temurbek',
  'Saidbek', 'Rahmatulloh', 'Ibrohim', 'Yahyobek', 'Xurshidbek', 'Sunnatilla', 'Shohjahon',
  'Doston', 'Mironshoh', 'Jahongir', 'Bunyodbek', 'Shaxriyor', 'Olimjon', 'Bekzod'
];

const GIRL_NAMES = [
  'Madinabonu', 'Sevinch', 'Rayhona', 'Nozima', 'Diyora', 'Shahzoda', 'Zilola', 'Mohinur',
  'Gulhayo', 'Sabina', 'Fotima', 'Zuhra', 'Ruxshona', 'Dilnoza', 'Marjona', 'Charos',
  'Parizod', 'Shaxnoza', 'Nilufar', 'Lola', 'Zarina', 'Ziyoda', 'Kamila', 'Munisa',
  'Laylo', 'Malika', 'Jasmina', 'Aziza', 'Sarvinoz', 'Shirin', 'Ezoza', 'Mushtariy',
  'Feruza', 'Dilrabo', 'Gulnoza', 'Maftuna', 'Moxira', 'Farangiz', 'Gulasal'
];

const LAST_NAMES = [
  'Rahimov', 'Aliyev', 'Karimov', 'Qodirov', 'Usmonov', 'Mirzayev', 'Toshpo\'latov',
  'Ergashev', 'Normatov', 'G\'ofurov', 'Xolmatov', 'Jo\'rayev', 'Mahmudov', 'Sobirov',
  'Yo\'ldoshev', 'Ismoilov', 'Sultonov', 'Rustamov', 'Nazarov', 'Yusupov', 'Sharipov',
  'Bozorov', 'Shukurov', 'Hamroyev', 'Turdiyev', 'Umarov', 'Saidov', 'Boboyev'
];

const COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#00C7BE',
  '#30B0C7', '#FF3B30', '#32ADE6', '#E35336', '#F5F5DC', '#FAF3EE', '#EDF4ED'
];

// Transaction tags pool (positive and balanced)
const TX_TEMPLATES = [
  { amount: 85, comment: 'Uy vazifasi to\'liq va a\'lo darajada bajarildi 📚' },
  { amount: 50, comment: 'Darsda faol ishtirok va to\'g\'ri javob 🌟' },
  { amount: 50, comment: 'Mustaqil izlanish va qo\'shimcha topshiriq 🔍' },
  { amount: 100, comment: 'Loyiha taqdimoti a\'lo darajada o\'tdi 🚀' },
  { amount: 35, comment: 'Kreativ fikrlash va ajoyib g\'oya 💡' },
  { amount: 50, comment: 'Guruh ishida yetakchilik va jamoaviy yordam 👥' },
  { amount: 75, comment: 'Robot sxemasini muvaffaqiyatli yig\'di 🤖' },
  { amount: 60, comment: 'Algoritmik masalani birinchi bo\'lib yechdi ⚡' },
  { amount: 100, comment: 'Haftalik test sinovida eng yuqori natija 🏆' },
  { amount: 45, comment: 'Kod sintaksisini mukammal tushuntirib berdi 💻' },
  { amount: 25, comment: 'Darsga o\'z vaqtida kelib namunali qatnashdi ✨' },
  { amount: 85, comment: 'Uy vazifasi bajarildi 📚' },
  { amount: 50, comment: 'Faol ishtirok 🌟' },
  { amount: 35, comment: 'Ajoyib javob 💡' },
  { amount: 20, comment: 'Uy vazifasi chala bajarildi 🔄' },
  { amount: -10, comment: 'Darsga kechikib keldi ⏰' },
];

// Helper: Calculate lesson dates for MWF and TTS
function getLessonDates(daysOfWeek) {
  const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const targetDays = daysOfWeek.map(d => dayMap[d.toLowerCase()]);
  const dates = [];
  // August 2026 and September 2026
  for (const m of [8, 9]) {
    const daysInMonth = new Date(2026, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      if (m === 9 && d > 29) continue; // Up to 2026-09-29
      const dt = new Date(2026, m - 1, d);
      if (targetDays.includes(dt.getDay())) {
        const yStr = dt.getFullYear();
        const mStr = String(dt.getMonth() + 1).padStart(2, '0');
        const dStr = String(dt.getDate()).padStart(2, '0');
        dates.push(`${yStr}-${mStr}-${dStr}`);
      }
    }
  }
  return dates;
}

const MWF_DATES = getLessonDates(['mon', 'wed', 'fri']);
const TTS_DATES = getLessonDates(['tue', 'thu', 'sat']);

let avatarIndex = 0;
function getNextAvatar() {
  // Only the first 10 avatars are free! Default student avatars must strictly be free.
  const freeAvatars = AVATAR_IMAGES.slice(0, 10);
  const av = freeAvatars[avatarIndex % freeAvatars.length];
  avatarIndex++;
  return av;
}

let nameIndex = 0;
function generateStudent(groupId, category = 'teens', forceGender = null) {
  const isBoy = forceGender !== null ? forceGender : (nameIndex % 2 === 0);
  const first = isBoy ? BOY_NAMES[nameIndex % BOY_NAMES.length] : GIRL_NAMES[nameIndex % GIRL_NAMES.length];
  const lastBase = LAST_NAMES[(nameIndex * 3) % LAST_NAMES.length];
  const last = isBoy ? lastBase : (lastBase + 'a');
  nameIndex++;

  const phoneNum = '9' + Math.floor(10000000 + Math.random() * 90000000);
  const parentNum = '9' + Math.floor(10000000 + Math.random() * 90000000);
  const pin = String(1000 + Math.floor(Math.random() * 9000));

  return {
    id: generateId('stu'),
    name: `${first} ${last}`,
    groupId,
    emoji: getNextAvatar(),
    color: COLORS[nameIndex % COLORS.length],
    phone: `+998 ${phoneNum.slice(0, 2)} ${phoneNum.slice(2, 5)} ${phoneNum.slice(5, 7)} ${phoneNum.slice(7, 9)}`,
    parentPhone: `+998 ${parentNum.slice(0, 2)} ${parentNum.slice(2, 5)} ${parentNum.slice(5, 7)} ${parentNum.slice(7, 9)}`,
    pin,
    createdAt: '2026-07-01T08:00:00.000Z',
    joinedGroupAt: '2026-07-01T08:00:00.000Z',
    groupHistory: [],
    monthlyFee: category === 'kids' ? 400000 : 450000,
  };
}

// Generate transactions for a student
function generateTransactionsForStudent(student, count = 12, bonusTier = 0) {
  const txs = [];
  // August timestamps
  const augDates = [
    '2026-08-04T16:30:00.000Z', '2026-08-07T16:45:00.000Z', '2026-08-11T16:20:00.000Z',
    '2026-08-14T17:00:00.000Z', '2026-08-18T16:35:00.000Z', '2026-08-21T16:50:00.000Z',
    '2026-08-25T16:30:00.000Z', '2026-08-28T17:10:00.000Z'
  ];
  // September timestamps
  const sepDates = [
    '2026-09-02T16:30:00.000Z', '2026-09-04T16:45:00.000Z', '2026-09-08T16:20:00.000Z',
    '2026-09-11T17:00:00.000Z', '2026-09-15T16:35:00.000Z', '2026-09-18T16:50:00.000Z',
    '2026-09-22T16:30:00.000Z', '2026-09-25T17:10:00.000Z', '2026-09-29T10:30:00.000Z' // Today!
  ];

  const allTimestamps = [...augDates, ...sepDates];
  // Select timestamps
  const step = Math.max(1, Math.floor(allTimestamps.length / count));
  for (let i = 0; i < allTimestamps.length && txs.length < count; i += step) {
    const tpl = TX_TEMPLATES[(i * 3 + student.name.length) % TX_TEMPLATES.length];
    txs.push({
      id: generateId('tx'),
      studentId: student.id,
      amount: tpl.amount,
      comment: tpl.comment,
      timestamp: allTimestamps[i],
      isTemplate: true
    });
  }

  // Bonus achievement transactions for standout leaderboards
  if (bonusTier === 1) {
    txs.push(
      { id: generateId('tx_b1'), studentId: student.id, amount: 300, comment: 'Olimpiada va loyihalar tanlovi mutlaq g\'olibi 🏆', timestamp: '2026-08-20T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b2'), studentId: student.id, amount: 200, comment: 'Oylik reytingda 1-o\'rin sohibi 🥇', timestamp: '2026-08-31T17:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b3'), studentId: student.id, amount: 150, comment: 'Yirik amaliy loyiha himoyasi a\'lo darajada o\'tdi 🚀', timestamp: '2026-09-15T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b4'), studentId: student.id, amount: 100, comment: 'Darsda namunali faollik va murakkab masala yechimi 💡', timestamp: '2026-09-29T11:00:00.000Z', isTemplate: true }
    );
  } else if (bonusTier === 2) {
    txs.push(
      { id: generateId('tx_b1'), studentId: student.id, amount: 200, comment: 'Robo-Sumo musobaqasi sovrindori 🥈', timestamp: '2026-08-20T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b2'), studentId: student.id, amount: 150, comment: 'Oylik natijalar bo\'yicha yetakchi o\'rin 🌟', timestamp: '2026-08-31T17:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b3'), studentId: student.id, amount: 100, comment: 'Mustaqil loyiha topshirildi 🔍', timestamp: '2026-09-18T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b4'), studentId: student.id, amount: 75, comment: 'Darsda faol ishtirok ✨', timestamp: '2026-09-29T11:00:00.000Z', isTemplate: true }
    );
  } else if (bonusTier === 3) {
    txs.push(
      { id: generateId('tx_b1'), studentId: student.id, amount: 150, comment: 'Dasturlash tanlovi sovrindori 🥉', timestamp: '2026-08-20T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b2'), studentId: student.id, amount: 100, comment: 'Murakkab algoritm yechildi 💡', timestamp: '2026-09-10T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b3'), studentId: student.id, amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-29T11:00:00.000Z', isTemplate: true }
    );
  } else if (bonusTier === 4) {
    txs.push(
      { id: generateId('tx_b1'), studentId: student.id, amount: 100, comment: 'Namunali intizom va faol qatnashish ✨', timestamp: '2026-09-08T16:00:00.000Z', isTemplate: true },
      { id: generateId('tx_b2'), studentId: student.id, amount: 50, comment: 'Ajoyib natija 🌟', timestamp: '2026-09-29T11:00:00.000Z', isTemplate: true }
    );
  }

  // Ensure there's a fresh transaction today (2026-09-29) for lively today leaderboard!
  if (!txs.some(t => t.timestamp.startsWith('2026-09-29'))) {
    txs.push({
      id: generateId('tx_today'),
      studentId: student.id,
      amount: 50,
      comment: 'Darsda faol ishtirok va namunali faollik 🌟',
      timestamp: '2026-09-29T11:00:00.000Z',
      isTemplate: true
    });
  }

  return txs;
}

// Generate attendance sessions for a group for 2 full months
function generateGroupAttendance(group, students) {
  const days = group.schedule?.days || ['tue', 'thu', 'sat'];
  const isMWF = days.includes('mon') || days.includes('wed') || days.includes('fri');
  const lessonDates = isMWF ? MWF_DATES : TTS_DATES;

  const sessions = [];

  lessonDates.forEach((dateStr, dIdx) => {
    const records = {};
    students.forEach((s, sIdx) => {
      // Deterministic pseudo-randomness for realistic attendance rate (~92% present, 5% late, 2% excused, 1% absent)
      const seed = (dIdx * 17 + sIdx * 31 + s.name.length) % 100;
      if (seed < 88) {
        records[s.id] = 'present';
      } else if (seed < 94) {
        records[s.id] = 'late';
      } else if (seed < 97) {
        records[s.id] = 'excused';
      } else {
        records[s.id] = 'absent';
      }
    });

    sessions.push({
      id: generateId('att'),
      groupId: group.id,
      date: dateStr,
      records,
      createdAt: `${dateStr}T17:00:00.000Z`,
      updatedAt: `${dateStr}T17:00:00.000Z`,
      isTemplate: true
    });
  });

  return sessions;
}

// Generate August & September payments
function generateStudentPayments(student) {
  const fee = student.monthlyFee || 400000;
  return [
    {
      id: generateId('pay_aug'),
      studentId: student.id,
      amount: fee,
      month: '2026-08',
      date: '2026-08-05',
      createdAt: '2026-08-05T10:00:00.000Z',
      note: 'To\'landi (Plastik karta)'
    },
    {
      id: generateId('pay_sep'),
      studentId: student.id,
      amount: fee,
      month: '2026-09',
      date: '2026-09-05',
      createdAt: '2026-09-05T10:00:00.000Z',
      note: 'To\'landi (Naqd pul)'
    }
  ];
}

export async function seedAllTeachers() {
  console.log('🚀 Starting Comprehensive Template Data Seeding for all teachers...');

  const groupPasswordsToRegister = [];

  // =========================================================================
  // 1. TEACHER 1 (Bekzod U.)
  // =========================================================================
  console.log('\n--- Processing Teacher 1 ---');
  const { data: t1Row } = await supabase.from('appdata').select('data').eq('teacher_id', 'teacher1').single();
  const t1Data = t1Row?.data || {};

  const t1Profile = {
    fullName: 'Bekzod U.',
    title: 'Senior Software Engineer',
    avatar: '/avatar_image/87d239c65732f941a8f2d9cce9f245f9.jpg',
    education: 'Tashkent PDP Academy, Mohir Dev',
    motto: 'Kodingni yaxshila, skill\'ni oshir va xatolardan qo‘rqma.',
    phone: '+998 90 987 65 43',
    social: { telegram: 'tutorbek', instagram: 'tutorbek' },
    achievements: ['5+ yil dasturlash tajribasi', 'Robo-Master 2024 murabbiyi', '300+ iqtidorli o\'quvchilar'],
    certificates: ['Senior Fullstack Engineer Diploma', 'Python & Robotics Mentor Certificate']
  };

  // Groups for Teacher 1
  let t1Groups = [
    {
      id: 'l8vh182f5',
      name: 'G1',
      category: 'teens',
      icon: '🚀',
      color: '#007AFF',
      password: 'salomustoz',
      monthlyFee: 400000,
      room: '1-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '15:30', endTime: '17:00', room: '1-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    },
    {
      id: 'fzonx5xbe',
      name: 'G2',
      category: 'teens',
      icon: '💻',
      color: '#34C759',
      password: 'gamers',
      monthlyFee: 400000,
      room: '1-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '15:30', endTime: '17:00', room: '1-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    },
    {
      id: '3j0ousi0w',
      name: 'G4',
      category: 'kids',
      icon: '⭐',
      color: '#FF9500',
      password: 'raketa',
      monthlyFee: 400000,
      room: '2-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '08:00', endTime: '09:30', room: '2-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    },
    {
      id: 'rpq5jz1uu',
      name: 'G5',
      category: 'kids',
      icon: '🤖',
      color: '#AF52DE',
      password: 'robot',
      monthlyFee: 400000,
      room: '2-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '09:30', endTime: '11:00', room: '2-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    },
    {
      id: '2jfz978bh',
      name: 'G6',
      category: 'teens',
      icon: '🔥',
      color: '#FF2D55',
      password: 'kuzkeldi',
      monthlyFee: 400000,
      room: '1-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '14:00', endTime: '15:30', room: '1-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    },
    {
      id: '9t7tpxq3p',
      name: 'Kompyuter Savodxonligi',
      category: 'kids',
      icon: '📚',
      color: '#5856D6',
      password: 'talaba',
      monthlyFee: 350000,
      room: '3-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '10:00', endTime: '11:30', room: '3-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    },
    {
      id: 'ld7iufbul',
      name: 'G7',
      category: 'kids',
      icon: '🦁',
      color: '#00C7BE',
      password: 'sher',
      monthlyFee: 400000,
      room: '2-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '14:00', endTime: '15:30', room: '2-xona' },
      createdAt: '2026-06-24T02:00:00.000Z'
    }
  ];

  t1Groups.forEach(g => groupPasswordsToRegister.push({ password: g.password, teacher_id: 'teacher1', group_id: g.id }));

  // Keep existing students in Teacher 1 and ensure early createdAt
  let t1Students = (t1Data.students || []).map(s => ({
    ...s,
    createdAt: s.createdAt && s.createdAt < '2026-08-01' ? s.createdAt : '2026-07-01T08:00:00.000Z',
    joinedGroupAt: s.joinedGroupAt && s.joinedGroupAt < '2026-08-01' ? s.joinedGroupAt : '2026-07-01T08:00:00.000Z',
    phone: s.phone || '+998 90 234 56 78',
    parentPhone: s.parentPhone || '+998 91 876 54 32',
    monthlyFee: s.monthlyFee || 400000,
  }));

  // Top up groups with few students (G2, Kompyuter Savodxonligi, G7)
  const g2Students = t1Students.filter(s => s.groupId === 'fzonx5xbe' && !s.deleted);
  while (g2Students.length < 5) {
    const s = generateStudent('fzonx5xbe', 'teens');
    t1Students.push(s);
    g2Students.push(s);
  }

  const ksavodStudents = t1Students.filter(s => s.groupId === '9t7tpxq3p' && !s.deleted);
  while (ksavodStudents.length < 5) {
    const s = generateStudent('9t7tpxq3p', 'kids');
    t1Students.push(s);
    ksavodStudents.push(s);
  }

  const g7Students = t1Students.filter(s => s.groupId === 'ld7iufbul' && !s.deleted);
  while (g7Students.length < 5) {
    const s = generateStudent('ld7iufbul', 'kids');
    t1Students.push(s);
    g7Students.push(s);
  }

  // Generate likes/transactions for ALL teacher1 students (10-14 transactions each -> 600-1600 points!)
  let t1Transactions = [];
  t1Groups.forEach(g => {
    const groupStudents = t1Students.filter(s => s.groupId === g.id && !s.deleted);
    groupStudents.forEach((s, idx) => {
      const bonusTier = idx === 0 ? 1 : (idx === 1 ? 2 : (idx === 2 ? 3 : (idx === 3 ? 4 : 0)));
      t1Transactions.push(...generateTransactionsForStudent(s, 12, bonusTier));
    });
  });

  // Generate 2 months attendance for ALL groups
  let t1Attendance = [];
  t1Groups.forEach(g => {
    const groupStudents = t1Students.filter(s => s.groupId === g.id && !s.deleted);
    t1Attendance.push(...generateGroupAttendance(g, groupStudents));
  });

  // Generate 2 months payments
  let t1Payments = [];
  t1Students.filter(s => !s.deleted).forEach(s => {
    t1Payments.push(...generateStudentPayments(s));
  });

  console.log(`Teacher 1 prepared: ${t1Groups.length} groups, ${t1Students.length} students, ${t1Transactions.length} transactions, ${t1Attendance.length} attendance sessions, ${t1Payments.length} payments.`);

  // Save Teacher 1
  await supabase.from('appdata').upsert({
    teacher_id: 'teacher1',
    data: {
      ...t1Data,
      teacherProfile: t1Profile,
      groups: t1Groups,
      students: t1Students,
      transactions: t1Transactions,
      attendance: t1Attendance,
      payments: t1Payments,
      quickTags: t1Data.quickTags || [
        { text: 'Uy vazifasi bajarildi 📚', points: 85 },
        { text: 'Mustaqil izlanish 🔍', points: 50 },
        { text: 'Uy vazifasi chala bajarildi 🔄', points: 20 },
        { text: 'Darsga kechikdi ⏰', points: -10 },
        { text: 'Uy vazifasi bajarilmadi ❌', points: -30 },
        { text: 'Darsga sababsiz kelmadi 🚫', points: -40 },
        { text: 'Faol ishtirok 🌟', points: 50 },
        { text: 'Ajoyib javob 💡', points: 35 },
      ]
    }
  });
  console.log('✅ Teacher 1 saved to Supabase!');


  // =========================================================================
  // 2. TEACHER 2 (Jasur Rustamov)
  // =========================================================================
  console.log('\n--- Processing Teacher 2 ---');
  const { data: t2Row } = await supabase.from('appdata').select('data').eq('teacher_id', 'teacher2').single();
  const t2Data = t2Row?.data || {};

  const t2Profile = {
    fullName: 'Jasur Rustamov',
    title: 'Robototexnika va Sunʼiy Intellekt ustozi',
    avatar: '/avatar_image/291be98e437a152dbcc0ee06e94d2575.jpg',
    education: 'TATU (Axborot Xavfsizligi), Inha University Robotics Lab',
    motto: 'Har bir ixtiro bitta kichik qadamdan boshlanadi.',
    phone: '+998 90 123 45 67',
    social: { telegram: 'jasur_robotics', instagram: 'jasur_tech' },
    achievements: ['ROBO-SUMO 2025 g\'olibi murabbiyi', '4+ yil pedagogik tajriba', '150+ bitiruvchi o\'quvchilar'],
    certificates: ['International STEM Instructor', 'Arduino & Robotics Certified Specialist']
  };

  // Enrich teacher 2 groups
  const t2GroupsConfig = {
    'n6ep8j6aw': { name: 'Group 1', category: 'teens', days: ['tue', 'thu', 'sat'], startTime: '11:00', endTime: '12:30', room: '1-xona', fee: 400000, password: 'genious', color: '#007AFF', icon: '🚀' },
    'tb0k56x23': { name: 'Group 2', category: 'kids', days: ['mon', 'wed', 'fri'], startTime: '09:00', endTime: '10:30', room: '1-xona', fee: 400000, password: 'parol', color: '#34C759', icon: '🤖' },
    '7ymt4mrwg': { name: 'Group 3', category: 'teens', days: ['mon', 'wed', 'fri'], startTime: '14:00', endTime: '15:30', room: '2-xona', fee: 400000, password: 'pishloq', color: '#FF9500', icon: '⚡' },
    'ufjhu82tv': { name: 'Group 4', category: 'kids', days: ['tue', 'thu', 'sat'], startTime: '14:00', endTime: '15:30', room: '2-xona', fee: 400000, password: 'qor', color: '#AF52DE', icon: '⭐' },
    's00vtt178': { name: 'Group 5', category: 'teens', days: ['mon', 'wed', 'fri'], startTime: '16:00', endTime: '17:30', room: '1-xona', fee: 400000, password: 'soat', color: '#FF2D55', icon: '🔥' },
    '5oo2nl8f6': { name: 'Group 6', category: 'kids', days: ['tue', 'thu', 'sat'], startTime: '16:00', endTime: '17:30', room: '3-xona', fee: 400000, password: 'milk', color: '#5856D6', icon: '🎮' },
    'xhgctf9xg': { name: 'Group 8', category: 'teens', days: ['mon', 'wed', 'fri'], startTime: '17:30', endTime: '19:00', room: '2-xona', fee: 400000, password: 'tarvuz', color: '#00C7BE', icon: '💡' },
  };

  let t2Groups = (t2Data.groups || []).map(g => {
    const cfg = t2GroupsConfig[g.id];
    if (cfg) {
      return {
        ...g,
        name: cfg.name,
        category: cfg.category,
        icon: cfg.icon,
        color: cfg.color,
        monthlyFee: cfg.fee,
        password: cfg.password,
        room: cfg.room,
        schedule: {
          days: cfg.days,
          startTime: cfg.startTime,
          endTime: cfg.endTime,
          room: cfg.room
        }
      };
    }
    return g;
  });

  t2Groups.filter(g => !g.deleted).forEach(g => {
    groupPasswordsToRegister.push({ password: g.password, teacher_id: 'teacher2', group_id: g.id });
  });

  // Ensure all 126 students have early createdAt/joinedGroupAt, valid phone and avatars
  let t2Students = (t2Data.students || []).map(s => {
    const isBoy = !s.name.endsWith('a') && !s.name.endsWith('o') && !s.name.endsWith('x');
    const phoneNum = '9' + Math.floor(10000000 + Math.random() * 90000000);
    const parentNum = '9' + Math.floor(10000000 + Math.random() * 90000000);
    return {
      ...s,
      createdAt: s.createdAt && s.createdAt < '2026-08-01' ? s.createdAt : '2026-07-01T08:00:00.000Z',
      joinedGroupAt: s.joinedGroupAt && s.joinedGroupAt < '2026-08-01' ? s.joinedGroupAt : '2026-07-01T08:00:00.000Z',
      phone: s.phone || `+998 ${phoneNum.slice(0, 2)} ${phoneNum.slice(2, 5)} ${phoneNum.slice(5, 7)} ${phoneNum.slice(7, 9)}`,
      parentPhone: s.parentPhone || `+998 ${parentNum.slice(0, 2)} ${parentNum.slice(2, 5)} ${parentNum.slice(5, 7)} ${parentNum.slice(7, 9)}`,
      monthlyFee: 400000,
      pin: s.pin || String(1000 + Math.floor(Math.random() * 9000)),
      emoji: getNextAvatar()
    };
  });

  // Generate likes/transactions for ALL 126 students in Teacher 2!
  let t2Transactions = [];
  t2Groups.filter(g => !g.deleted).forEach(g => {
    const groupStudents = t2Students.filter(s => s.groupId === g.id && !s.deleted);
    groupStudents.forEach((s, idx) => {
      const bonusTier = idx === 0 ? 1 : (idx === 1 ? 2 : (idx === 2 ? 3 : (idx === 3 ? 4 : 0)));
      t2Transactions.push(...generateTransactionsForStudent(s, 11, bonusTier));
    });
  });

  // Generate 2 months attendance for ALL 7 groups
  let t2Attendance = [];
  t2Groups.filter(g => !g.deleted).forEach(g => {
    const groupStudents = t2Students.filter(s => s.groupId === g.id && !s.deleted);
    t2Attendance.push(...generateGroupAttendance(g, groupStudents));
  });

  // Generate 2 months payments
  let t2Payments = [];
  t2Students.filter(s => !s.deleted).forEach(s => {
    t2Payments.push(...generateStudentPayments(s));
  });

  console.log(`Teacher 2 prepared: ${t2Groups.filter(g => !g.deleted).length} groups, ${t2Students.filter(s => !s.deleted).length} active students, ${t2Transactions.length} transactions, ${t2Attendance.length} attendance sessions, ${t2Payments.length} payments.`);

  // Save Teacher 2
  await supabase.from('appdata').upsert({
    teacher_id: 'teacher2',
    data: {
      ...t2Data,
      teacherProfile: t2Profile,
      groups: t2Groups,
      students: t2Students,
      transactions: t2Transactions,
      attendance: t2Attendance,
      payments: t2Payments,
      quickTags: t2Data.quickTags || [
        { text: 'Uy vazifasi bajarildi 📚', points: 85 },
        { text: 'Mustaqil izlanish 🔍', points: 50 },
        { text: 'Uy vazifasi chala bajarildi 🔄', points: 20 },
        { text: 'Darsga kechikdi ⏰', points: -10 },
        { text: 'Uy vazifasi bajarilmadi ❌', points: -30 },
        { text: 'Darsga sababsiz kelmadi 🚫', points: -40 },
        { text: 'Faol ishtirok 🌟', points: 50 },
        { text: 'Ajoyib javob 💡', points: 35 },
      ]
    }
  });
  console.log('✅ Teacher 2 saved to Supabase!');


  // =========================================================================
  // 3. TEACHER 3 (Malika Karimova)
  // =========================================================================
  console.log('\n--- Processing Teacher 3 ---');
  const { data: t3Row } = await supabase.from('appdata').select('data').eq('teacher_id', 'teacher3').maybeSingle();
  const t3Data = t3Row?.data || {};

  const t3Profile = {
    fullName: 'Malika Karimova',
    title: 'Kids Coding & Scratch bo\'yicha yetakchi mentor',
    avatar: '/avatar_image/029acd093807f1bcc89415fafb02c735.jpg',
    education: 'O\'zbekiston Milliy Universiteti, IT Park Certified Mentor',
    motto: 'Dasturlash orqali bolalar mantiqiy fikrlashni o\'rganadi.',
    phone: '+998 93 987 65 43',
    social: { telegram: 'malika_scratch', instagram: 'malika_mentors' },
    achievements: ['Scratch Olympiad 2024 murabbiyi', '3+ yil ta\'lim tajribasi', '100+ yosh dasturchilar'],
    certificates: ['Scratch Foundation Certificate', 'Google CS First Educator']
  };

  // Teacher 3 groups: keep existing '8swt4sn5o' (Эпчилар) and add 3 groups
  const t3Groups = [
    {
      id: '8swt4sn5o',
      name: 'Эпчилар',
      category: 'kids',
      icon: '🤖',
      color: '#FF9500',
      password: 'karam',
      monthlyFee: 400000,
      room: '1-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '10:00', endTime: '11:30', room: '1-xona' },
      createdAt: '2026-06-25T10:00:00.000Z'
    },
    {
      id: 'grp_t3_scratch',
      name: 'Scratch Game Dev',
      category: 'kids',
      icon: '🎮',
      color: '#007AFF',
      password: 'yulduz',
      monthlyFee: 400000,
      room: '1-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '10:00', endTime: '11:30', room: '1-xona' },
      createdAt: '2026-06-25T10:00:00.000Z'
    },
    {
      id: 'grp_t3_muhandis',
      name: 'Yosh Muhandis',
      category: 'kids',
      icon: '🔧',
      color: '#34C759',
      password: 'lochin',
      monthlyFee: 400000,
      room: '2-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '14:00', endTime: '15:30', room: '2-xona' },
      createdAt: '2026-06-25T10:00:00.000Z'
    },
    {
      id: 'grp_t3_pykids',
      name: 'Python Start',
      category: 'teens',
      icon: '🐍',
      color: '#AF52DE',
      password: 'burgut',
      monthlyFee: 450000,
      room: '2-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '14:00', endTime: '15:30', room: '2-xona' },
      createdAt: '2026-06-25T10:00:00.000Z'
    }
  ];

  t3Groups.forEach(g => {
    groupPasswordsToRegister.push({ password: g.password, teacher_id: 'teacher3', group_id: g.id });
  });

  // Students for Teacher 3: keep existing students in their proper groups, and ensure each group has 9 students (36 total)
  let t3Students = (t3Data.students || []).filter(s => ['8swt4sn5o', 'grp_t3_scratch', 'grp_t3_muhandis', 'grp_t3_pykids'].includes(s.groupId));
  
  t3Groups.forEach(g => {
    const curGroupStudents = t3Students.filter(s => s.groupId === g.id && !s.deleted);
    while (curGroupStudents.length < 9) {
      const s = generateStudent(g.id, g.category);
      t3Students.push(s);
      curGroupStudents.push(s);
    }
    if (curGroupStudents.length > 9) {
      const excess = curGroupStudents.slice(9);
      t3Students = t3Students.filter(s => !excess.some(ex => ex.id === s.id));
    }
  });

  // Transactions for Teacher 3 students
  let t3Transactions = [];
  t3Groups.forEach(g => {
    const groupStudents = t3Students.filter(s => s.groupId === g.id && !s.deleted);
    groupStudents.forEach((s, idx) => {
      const bonusTier = idx === 0 ? 1 : (idx === 1 ? 2 : (idx === 2 ? 3 : (idx === 3 ? 4 : 0)));
      t3Transactions.push(...generateTransactionsForStudent(s, 12, bonusTier));
    });
  });

  // Attendance for Teacher 3 groups
  let t3Attendance = [];
  t3Groups.forEach(g => {
    const groupStudents = t3Students.filter(s => s.groupId === g.id && !s.deleted);
    t3Attendance.push(...generateGroupAttendance(g, groupStudents));
  });

  // Payments for Teacher 3
  let t3Payments = [];
  t3Students.forEach(s => {
    t3Payments.push(...generateStudentPayments(s));
  });

  console.log(`Teacher 3 prepared: ${t3Groups.length} groups, ${t3Students.length} students, ${t3Transactions.length} transactions, ${t3Attendance.length} attendance sessions, ${t3Payments.length} payments.`);

  // Save Teacher 3
  await supabase.from('appdata').upsert({
    teacher_id: 'teacher3',
    data: {
      ...t3Data,
      teacherProfile: t3Profile,
      groups: t3Groups,
      students: t3Students,
      transactions: t3Transactions,
      attendance: t3Attendance,
      payments: t3Payments,
      quickTags: [
        { text: 'Uy vazifasi bajarildi 📚', points: 85 },
        { text: 'Mustaqil izlanish 🔍', points: 50 },
        { text: 'Uy vazifasi chala bajarildi 🔄', points: 20 },
        { text: 'Darsga kechikdi ⏰', points: -10 },
        { text: 'Uy vazifasi bajarilmadi ❌', points: -30 },
        { text: 'Darsga sababsiz kelmadi 🚫', points: -40 },
        { text: 'Faol ishtirok 🌟', points: 50 },
        { text: 'Ajoyib javob 💡', points: 35 },
      ]
    }
  });
  console.log('✅ Teacher 3 saved to Supabase!');


  // =========================================================================
  // 4. TEACHER 4 (Bobur Mirzayev)
  // =========================================================================
  console.log('\n--- Processing Teacher 4 ---');
  const { data: t4Row } = await supabase.from('appdata').select('data').eq('teacher_id', 'teacher4').maybeSingle();
  const t4Data = t4Row?.data || {};

  const t4Profile = {
    fullName: 'Bobur Mirzayev',
    title: 'Fullstack & Python Dasturlash ustozi',
    avatar: '/avatar_image/04034cb64ef156918cb12c6a78ce7248.jpg',
    education: 'Toshkent Politexnika Universiteti, Najot Ta\'lim bitiruvchisi',
    motto: 'Nazariya amaliyotsiz hech narsa emas. Har darsda natija!',
    phone: '+998 94 555 44 33',
    social: { telegram: 'bobur_code', instagram: 'bobur_dev' },
    achievements: ['Fullstack Web Developer 4+ yil', '50+ real loyihalar muallifi', 'Yosh dasturchilar klubi rahbari'],
    certificates: ['Python Institute Certified Associate', 'Modern Web Development Lead']
  };

  // Create 4 groups for Teacher 4
  const t4Groups = [
    {
      id: 'grp_t4_web',
      name: 'Frontend Web Dev',
      category: 'teens',
      icon: '🌐',
      color: '#007AFF',
      password: 'samuray',
      monthlyFee: 450000,
      room: '1-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '15:30', endTime: '17:00', room: '1-xona' },
      createdAt: '2026-06-26T09:00:00.000Z'
    },
    {
      id: 'grp_t4_pypro',
      name: 'Python Pro',
      category: 'teens',
      icon: '⚡',
      color: '#34C759',
      password: 'qoplon',
      monthlyFee: 450000,
      room: '1-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '15:30', endTime: '17:00', room: '1-xona' },
      createdAt: '2026-06-26T09:00:00.000Z'
    },
    {
      id: 'grp_t4_robot',
      name: 'Robototexnika Kids',
      category: 'kids',
      icon: '🤖',
      color: '#FF9500',
      password: 'oltin',
      monthlyFee: 400000,
      room: '2-xona',
      schedule: { days: ['mon', 'wed', 'fri'], startTime: '09:00', endTime: '10:30', room: '2-xona' },
      createdAt: '2026-06-26T09:00:00.000Z'
    },
    {
      id: 'grp_t4_iot',
      name: 'Arduino & IoT',
      category: 'teens',
      icon: '💡',
      color: '#AF52DE',
      password: 'temir',
      monthlyFee: 450000,
      room: '2-xona',
      schedule: { days: ['tue', 'thu', 'sat'], startTime: '09:00', endTime: '10:30', room: '2-xona' },
      createdAt: '2026-06-26T09:00:00.000Z'
    }
  ];

  t4Groups.forEach(g => {
    groupPasswordsToRegister.push({ password: g.password, teacher_id: 'teacher4', group_id: g.id });
  });

  // Students for Teacher 4: keep existing students in their proper groups, and ensure each group has 9 students (36 total)
  let t4Students = (t4Data.students || []).filter(s => ['grp_t4_web', 'grp_t4_pypro', 'grp_t4_robot', 'grp_t4_iot'].includes(s.groupId));
  t4Groups.forEach(g => {
    const curGroupStudents = t4Students.filter(s => s.groupId === g.id && !s.deleted);
    while (curGroupStudents.length < 9) {
      const s = generateStudent(g.id, g.category);
      t4Students.push(s);
      curGroupStudents.push(s);
    }
    if (curGroupStudents.length > 9) {
      const excess = curGroupStudents.slice(9);
      t4Students = t4Students.filter(s => !excess.some(ex => ex.id === s.id));
    }
  });

  // Transactions for Teacher 4 students
  let t4Transactions = [];
  t4Groups.forEach(g => {
    const groupStudents = t4Students.filter(s => s.groupId === g.id && !s.deleted);
    groupStudents.forEach((s, idx) => {
      const bonusTier = idx === 0 ? 1 : (idx === 1 ? 2 : (idx === 2 ? 3 : (idx === 3 ? 4 : 0)));
      t4Transactions.push(...generateTransactionsForStudent(s, 12, bonusTier));
    });
  });

  // Attendance for Teacher 4 groups
  let t4Attendance = [];
  t4Groups.forEach(g => {
    const groupStudents = t4Students.filter(s => s.groupId === g.id && !s.deleted);
    t4Attendance.push(...generateGroupAttendance(g, groupStudents));
  });

  // Payments for Teacher 4
  let t4Payments = [];
  t4Students.forEach(s => {
    t4Payments.push(...generateStudentPayments(s));
  });

  console.log(`Teacher 4 prepared: ${t4Groups.length} groups, ${t4Students.length} students, ${t4Transactions.length} transactions, ${t4Attendance.length} attendance sessions, ${t4Payments.length} payments.`);

  // Save Teacher 4
  await supabase.from('appdata').upsert({
    teacher_id: 'teacher4',
    data: {
      ...t4Data,
      teacherProfile: t4Profile,
      groups: t4Groups,
      students: t4Students,
      transactions: t4Transactions,
      attendance: t4Attendance,
      payments: t4Payments,
      quickTags: [
        { text: 'Uy vazifasi bajarildi 📚', points: 85 },
        { text: 'Mustaqil izlanish 🔍', points: 50 },
        { text: 'Uy vazifasi chala bajarildi 🔄', points: 20 },
        { text: 'Darsga kechikdi ⏰', points: -10 },
        { text: 'Uy vazifasi bajarilmadi ❌', points: -30 },
        { text: 'Darsga sababsiz kelmadi 🚫', points: -40 },
        { text: 'Faol ishtirok 🌟', points: 50 },
        { text: 'Ajoyib javob 💡', points: 35 },
      ]
    }
  });
  console.log('✅ Teacher 4 saved to Supabase!');


  // =========================================================================
  // 5. GROUP PASSWORDS REGISTRY
  // =========================================================================
  console.log('\n--- Registering Group Passwords ---');
  for (const item of groupPasswordsToRegister) {
    const { error: pwdErr } = await supabase.from('group_passwords').upsert(item);
    if (pwdErr) {
      console.warn(`Error registering password ${item.password}:`, pwdErr);
    }
  }
  console.log(`✅ Registered ${groupPasswordsToRegister.length} group passwords in Supabase!`);


  // =========================================================================
  // 6. SYNC 'main' AS WELL (for full backward compatibility)
  // =========================================================================
  console.log('\n--- Syncing main document ---');
  await supabase.from('appdata').upsert({
    teacher_id: 'main',
    data: {
      groups: t1Groups,
      students: t1Students,
      transactions: t1Transactions,
      attendance: t1Attendance,
      payments: t1Payments,
      teacherProfile: t1Profile,
      quickTags: t1Data.quickTags || []
    }
  });
  console.log('✅ main document synchronized!');

  console.log('\n🎉 ALL TEACHERS, GROUPS, STUDENTS, LIKES, AND 2 MONTHS ATTENDANCE FULLY SEEDED!');
}

// Run directly
seedAllTeachers().catch(console.error);
