import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unwonvkemmmtdsinhcnn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTM0OTksImV4cCI6MjA5ODU2OTQ5OX0.gcSqvGPgeKuE-_ROmua9yaNZNHmzB0jtqtXhdorUF04';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const generateId = () => 'tpl_' + Math.random().toString(36).substring(2, 10);

async function seedAll() {
  console.log('Fetching teacher1 data...');
  const { data: row, error: fetchErr } = await supabase
    .from('appdata')
    .select('teacher_id, data')
    .eq('teacher_id', 'teacher1')
    .single();

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  const currentData = row.data;
  let groups = currentData.groups || [];

  // Ensure explicit categories on groups
  groups = groups.map(g => {
    if (g.name === 'G1') return { ...g, category: 'teens' };
    if (g.name === 'G2') return { ...g, category: 'teens' };
    if (g.name === 'G6') return { ...g, category: 'teens' };
    if (g.name === 'G4') return { ...g, category: 'kids' };
    if (g.name === 'G5') return { ...g, category: 'kids' };
    return g;
  });

  const g1 = groups.find(g => g.name === 'G1' && !g.deleted);
  const g2 = groups.find(g => g.name === 'G2' && !g.deleted);
  const g6 = groups.find(g => g.name === 'G6' && !g.deleted);
  const g4 = groups.find(g => g.name === 'G4' && !g.deleted);
  const g5 = groups.find(g => g.name === 'G5' && !g.deleted);

  console.log('Groups mapped:', {
    G1: g1?.id + ' (' + g1?.category + ')',
    G2: g2?.id + ' (' + g2?.category + ')',
    G6: g6?.id + ' (' + g6?.category + ')',
    G4: g4?.id + ' (' + g4?.category + ')',
    G5: g5?.id + ' (' + g5?.category + ')',
  });

  const templateTransactions = [
    // ==========================================
    // TEENS GROUPS
    // ==========================================
    // G1 - Nigina (Total: 425)
    { id: generateId(), studentId: 'ybkxhi332', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-02T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ybkxhi332', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-04T16:50:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ybkxhi332', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-09T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ybkxhi332', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-11T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ybkxhi332', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-16T16:35:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ybkxhi332', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-18T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ybkxhi332', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-23T16:30:00.000Z', isTemplate: true },

    // G1 - Atxam (Total: 365)
    { id: generateId(), studentId: 'snvjmfc1l', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-02T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'snvjmfc1l', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-07T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'snvjmfc1l', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-11T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'snvjmfc1l', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-14T16:35:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'snvjmfc1l', amount: -10, comment: 'Darsga kechikdi ⏰', timestamp: '2026-09-16T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'snvjmfc1l', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-21T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'snvjmfc1l', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-23T16:45:00.000Z', isTemplate: true },

    // G1 - Ruxshona (Total: 290)
    { id: generateId(), studentId: 'b7gogaueb', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-04T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'b7gogaueb', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-09T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'b7gogaueb', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-14T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'b7gogaueb', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-18T16:35:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'b7gogaueb', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-21T16:45:00.000Z', isTemplate: true },

    // G1 - Hulkaroy (Total: 205)
    { id: generateId(), studentId: 'konms1pww', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-07T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'konms1pww', amount: 20, comment: 'Uy vazifasi chala bajarildi 🔄', timestamp: '2026-09-11T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'konms1pww', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-16T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'konms1pww', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-23T16:35:00.000Z', isTemplate: true },

    // G2 - Xurshid (Total: 375)
    { id: generateId(), studentId: 'gw3cushvc', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-01T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gw3cushvc', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-05T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gw3cushvc', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gw3cushvc', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-12T16:35:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gw3cushvc', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-17T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gw3cushvc', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-22T16:30:00.000Z', isTemplate: true },

    // G2 - Islombek T (Total: 310)
    { id: generateId(), studentId: 'j339u5g6n', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-03T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j339u5g6n', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-08T16:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j339u5g6n', amount: 20, comment: 'Uy vazifasi chala bajarildi 🔄', timestamp: '2026-09-10T16:40:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j339u5g6n', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-15T16:35:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j339u5g6n', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-19T16:45:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j339u5g6n', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },

    // G6 (Teens) - Muhammadjon (Total: 390)
    { id: generateId(), studentId: 'j871ozrj6', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-03T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j871ozrj6', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j871ozrj6', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-12T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j871ozrj6', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-17T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j871ozrj6', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-22T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'j871ozrj6', amount: 35, comment: 'Ajoyib javob 💡', timestamp: '2026-09-24T14:30:00.000Z', isTemplate: true },

    // G6 (Teens) - Marjona (Total: 340)
    { id: generateId(), studentId: 'clkbjo2kv', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-05T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'clkbjo2kv', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-10T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'clkbjo2kv', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-15T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'clkbjo2kv', amount: 70, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-19T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'clkbjo2kv', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-24T14:30:00.000Z', isTemplate: true },

    // G6 (Teens) - Adxambek New (Total: 280)
    { id: generateId(), studentId: '9bizha19b', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '9bizha19b', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-15T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '9bizha19b', amount: 60, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-19T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '9bizha19b', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-22T15:00:00.000Z', isTemplate: true },

    // G6 (Teens) - Farxod (Total: 230)
    { id: generateId(), studentId: '69gxyv839', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-10T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '69gxyv839', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-17T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '69gxyv839', amount: 40, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-22T15:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '69gxyv839', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-24T14:30:00.000Z', isTemplate: true },

    // ==========================================
    // KIDS GROUPS
    // ==========================================
    // G5 (Kids) - Imron (Total: 440)
    { id: generateId(), studentId: 'vtcmuolkm', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-01T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'vtcmuolkm', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-05T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'vtcmuolkm', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-10T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'vtcmuolkm', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-15T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'vtcmuolkm', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-19T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'vtcmuolkm', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },

    // G4 (Kids) - Sanjarbek (Total: 410)
    { id: generateId(), studentId: 'k28sxkkia', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-03T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'k28sxkkia', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'k28sxkkia', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-12T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'k28sxkkia', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-17T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'k28sxkkia', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-22T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'k28sxkkia', amount: 20, comment: 'Ajoyib javob 💡', timestamp: '2026-09-24T09:00:00.000Z', isTemplate: true },

    // G5 (Kids) - Yashnarbek (Total: 380)
    { id: generateId(), studentId: 'azn59f6bf', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-03T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'azn59f6bf', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'azn59f6bf', amount: 60, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-15T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'azn59f6bf', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-19T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'azn59f6bf', amount: 65, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },

    // G4 (Kids) - Benyamin (Total: 350)
    { id: generateId(), studentId: 'ksu79y30e', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-01T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ksu79y30e', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ksu79y30e', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-15T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ksu79y30e', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-19T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ksu79y30e', amount: 45, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-24T09:00:00.000Z', isTemplate: true },

    // G5 (Kids) - Umidjon (Total: 330)
    { id: generateId(), studentId: 'va2lu8bw1', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-05T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'va2lu8bw1', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-12T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'va2lu8bw1', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-17T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'va2lu8bw1', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-22T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'va2lu8bw1', amount: 25, comment: 'Ajoyib javob 💡', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },

    // G4 (Kids) - Bekjon (Total: 300)
    { id: generateId(), studentId: 'ew2q7ti0p', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-05T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ew2q7ti0p', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-12T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ew2q7ti0p', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-17T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ew2q7ti0p', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-22T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ew2q7ti0p', amount: 30, comment: 'Ajoyib javob 💡', timestamp: '2026-09-24T09:00:00.000Z', isTemplate: true },

    // G5 (Kids) - Abduraxmon (Total: 275)
    { id: generateId(), studentId: 'gzsem6bcp', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-08T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gzsem6bcp', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-15T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gzsem6bcp', amount: 55, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-19T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'gzsem6bcp', amount: 50, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },

    // G4 (Kids) - Saidaxmatxo'ja (Total: 260)
    { id: generateId(), studentId: 'ct65ytvff', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-10T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ct65ytvff', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-17T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ct65ytvff', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-22T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'ct65ytvff', amount: 40, comment: 'Mustaqil izlanish 🔍', timestamp: '2026-09-24T09:00:00.000Z', isTemplate: true },

    // G5 (Kids) - Shaxboz (Total: 220)
    { id: generateId(), studentId: 'x7fv094xi', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-12T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'x7fv094xi', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-19T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'x7fv094xi', amount: 50, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },

    // G4 (Kids) - Zeboxon (Total: 210)
    { id: generateId(), studentId: '19hk20o15', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-12T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '19hk20o15', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-19T09:00:00.000Z', isTemplate: true },
    { id: generateId(), studentId: '19hk20o15', amount: 40, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-24T09:00:00.000Z', isTemplate: true },

    // G5 (Kids) - Ziyodjon (Total: 180)
    { id: generateId(), studentId: 'fneyq71r7', amount: 85, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-15T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'fneyq71r7', amount: 75, comment: 'Uy vazifasi bajarildi 📚', timestamp: '2026-09-22T10:30:00.000Z', isTemplate: true },
    { id: generateId(), studentId: 'fneyq71r7', amount: 20, comment: 'Faol ishtirok 🌟', timestamp: '2026-09-24T10:30:00.000Z', isTemplate: true },
  ];

  // Attendance for groups: G1 (mon/wed/fri), G2/G4/G5/G6 (tue/thu/sat)
  // G1: mon, wed, fri
  const g1Dates = [
    { date: '2026-08-28', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-08-31', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-02', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-04', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-07', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-09', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'late' } },
    { date: '2026-09-11', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-14', rec: { ybkxhi332: 'present', b7gogaueb: 'absent', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-16', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'late', konms1pww: 'present' } },
    { date: '2026-09-18', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'excused' } },
    { date: '2026-09-21', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
    { date: '2026-09-23', rec: { ybkxhi332: 'present', b7gogaueb: 'present', snvjmfc1l: 'present', konms1pww: 'present' } },
  ];

  // G2: tue, thu, sat
  const g2Dates = [
    { date: '2026-08-27', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-08-29', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-01', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-03', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-05', rec: { gw3cushvc: 'present', j339u5g6n: 'late' } },
    { date: '2026-09-08', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-10', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-12', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-15', rec: { gw3cushvc: 'late', j339u5g6n: 'present' } },
    { date: '2026-09-17', rec: { gw3cushvc: 'present', j339u5g6n: 'excused' } },
    { date: '2026-09-19', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-22', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
    { date: '2026-09-24', rec: { gw3cushvc: 'present', j339u5g6n: 'present' } },
  ];

  // G6: tue, thu, sat
  const g6Dates = g2Dates.map(item => ({
    date: item.date,
    rec: { j871ozrj6: 'present', clkbjo2kv: 'present', '9bizha19b': 'present', '69gxyv839': 'present' }
  }));

  // G4 (Kids): tue, thu, sat
  const g4Dates = g2Dates.map(item => ({
    date: item.date,
    rec: { k28sxkkia: 'present', ew2q7ti0p: 'present', ct65ytvff: 'present', ksu79y30e: 'present', '19hk20o15': 'present' }
  }));

  // G5 (Kids): tue, thu, sat
  const g5Dates = g2Dates.map(item => ({
    date: item.date,
    rec: { vtcmuolkm: 'present', va2lu8bw1: 'present', azn59f6bf: 'present', gzsem6bcp: 'present', x7fv094xi: 'present', fneyq71r7: 'present' }
  }));

  const templateAttendance = [
    ...g1Dates.map(item => ({
      id: generateId(),
      groupId: g1.id,
      date: item.date,
      records: item.rec,
      createdAt: `${item.date}T17:00:00.000Z`,
      updatedAt: `${item.date}T17:00:00.000Z`,
      isTemplate: true,
    })),
    ...g2Dates.map(item => ({
      id: generateId(),
      groupId: g2.id,
      date: item.date,
      records: item.rec,
      createdAt: `${item.date}T17:00:00.000Z`,
      updatedAt: `${item.date}T17:00:00.000Z`,
      isTemplate: true,
    })),
    ...g6Dates.map(item => ({
      id: generateId(),
      groupId: g6.id,
      date: item.date,
      records: item.rec,
      createdAt: `${item.date}T17:00:00.000Z`,
      updatedAt: `${item.date}T17:00:00.000Z`,
      isTemplate: true,
    })),
    ...g4Dates.map(item => ({
      id: generateId(),
      groupId: g4.id,
      date: item.date,
      records: item.rec,
      createdAt: `${item.date}T17:00:00.000Z`,
      updatedAt: `${item.date}T17:00:00.000Z`,
      isTemplate: true,
    })),
    ...g5Dates.map(item => ({
      id: generateId(),
      groupId: g5.id,
      date: item.date,
      records: item.rec,
      createdAt: `${item.date}T17:00:00.000Z`,
      updatedAt: `${item.date}T17:00:00.000Z`,
      isTemplate: true,
    })),
  ];

  // Clean existing template data
  const existingTransactions = (currentData.transactions || []).filter(t => !t.isTemplate);
  const targetGroupIds = new Set([g1.id, g2.id, g6.id, g4.id, g5.id]);
  const existingAttendance = (currentData.attendance || []).filter(a => !a.isTemplate && !targetGroupIds.has(a.groupId));

  const updatedTransactions = [...templateTransactions, ...existingTransactions];
  const updatedAttendance = [...existingAttendance, ...templateAttendance];

  const updatedData = {
    ...currentData,
    groups,
    transactions: updatedTransactions,
    attendance: updatedAttendance,
  };

  console.log(`Saving to teacher1: ${templateTransactions.length} transactions, ${templateAttendance.length} attendance records across TEENS & KIDS...`);
  const { error: saveErr } = await supabase
    .from('appdata')
    .upsert({ teacher_id: 'teacher1', data: updatedData });

  if (saveErr) {
    console.error('Save error:', saveErr);
    return;
  }
  console.log('✅ Successfully seeded teacher1 TEENS and KIDS template data!');
}

seedAll();
