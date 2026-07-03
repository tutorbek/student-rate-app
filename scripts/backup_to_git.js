import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration (falls back to hardcoded keys from server.js if env vars are not set)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://unwonvkemmmtdsinhcnn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk5MzQ5OSwiZXhwIjoyMDk4NTY5NDk5fQ.IncJtVFP8hc-8IHNG8lXYbbPqBXOTfh1mNtYf-XyutA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

const runBackups = async () => {
  const teachers = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
  let successCount = 0;

  console.log('[Backup Script] Starting database download from Supabase...');
  
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  for (const teacherId of teachers) {
    try {
      const { data: row, error } = await supabase
        .from('appdata')
        .select('data')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (error) throw error;
      if (row && row.data) {
        const filePath = path.join(BACKUPS_DIR, `${teacherId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(row.data, null, 2));
        console.log(`[Backup Script] Successfully saved backups/${teacherId}.json`);
        successCount++;
      } else {
        console.warn(`[Backup Script] No data found in Supabase for ${teacherId}`);
      }
    } catch (err) {
      console.error(`[Backup Script] Failed to fetch data for ${teacherId}:`, err.message);
    }
  }

  console.log(`[Backup Script] Backup run complete. Saved ${successCount}/${teachers.length} profiles.`);
  process.exit(0);
};

runBackups().catch(err => {
  console.error('[Backup Script] Critical failure:', err);
  process.exit(1);
});
