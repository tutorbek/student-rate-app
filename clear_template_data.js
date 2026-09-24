import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unwonvkemmmtdsinhcnn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTM0OTksImV4cCI6MjA5ODU2OTQ5OX0.gcSqvGPgeKuE-_ROmua9yaNZNHmzB0jtqtXhdorUF04';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearTemplate() {
  const teachers = ['teacher1', 'main'];
  for (const tId of teachers) {
    const { data: row } = await supabase.from('appdata').select('data').eq('teacher_id', tId).maybeSingle();
    if (!row || !row.data) continue;
    const d = row.data;
    const cleanTransactions = (d.transactions || []).filter(t => !t.isTemplate);
    const cleanAttendance = (d.attendance || []).filter(a => !a.isTemplate);
    const updated = {
      ...d,
      transactions: cleanTransactions,
      attendance: cleanAttendance
    };
    await supabase.from('appdata').upsert({ teacher_id: tId, data: updated });
    console.log(`Cleaned template data for ${tId}.`);
  }
  console.log('✅ Template data completely cleared!');
}

// When run directly with: node clear_template_data.js
clearTemplate();
