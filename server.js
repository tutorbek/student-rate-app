import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_DIR = path.join(__dirname, 'storage');
const DB_FILE = path.join(DB_DIR, 'db.json');
const BACKUPS_DIR = path.join(__dirname, 'backups');

// Supabase Configuration
const SUPABASE_URL = "https://unwonvkemmmtdsinhcnn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk5MzQ5OSwiZXhwIjoyMDk4NTY5NDk5fQ.IncJtVFP8hc-8IHNG8lXYbbPqBXOTfh1mNtYf-XyutA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const pgConfig = {
  user: 'postgres.unwonvkemmmtdsinhcnn',
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  database: 'postgres',
  password: 'iGhmDh16rzOAM3ET',
  port: 6543,
  ssl: { rejectUnauthorized: false }
};

const BOT_TOKEN = '7653301007:AAGW3Ov6qe-EfWPyqcaZKimli7CwwaFCPlk';
const ADMIN_CHAT_ID = '7949632456';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large imports if needed

// Helper: Ensure storage directory and file exist
const initDb = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      groups: [],
      students: [],
      transactions: [],
      quickTags: [
        "Faol ishtirok 🌟",
        "Uy vazifasi bajardi 📚",
        "Ajoyib javob 💡",
        "Darsga kechikdi ⏰",
        "Guruh ishida faollik 👥",
        "Intizom buzilishi ⚠️"
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
};

const CREDENTIALS = {
  // Teacher 1 (User)
  'insight': { role: 'teacher' },
  'ozimsila': { role: 'teacher' },
  'studentman': { role: 'student' },

  // Teacher 2
  'quyosh': { role: 'teacher' },
  'salombro': { role: 'student' },

  // Teacher 3
  'hehehe': { role: 'teacher' },
  'menman': { role: 'student' },

  // Teacher 4
  'simsim': { role: 'teacher' },
  'nimagap': { role: 'student' },
};

// API: Verify password
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: "Parol kiritilmagan!" });
  }
  const cleanPassword = password.trim().toLowerCase();
  const match = CREDENTIALS[cleanPassword];
  if (match) {
    res.json({ success: true, role: match.role });
  } else {
    res.status(401).json({ success: false, error: "Noto'g'ri parol!" });
  }
});

// API: Get entire database
app.get('/api/db', (req, res) => {
  try {
    initDb();
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(rawData);
    res.json(db);
  } catch (error) {
    console.error("Failed to read database:", error);
    res.status(500).json({ error: "Failed to read database file." });
  }
});

// API: Save entire database
app.post('/api/db', (req, res) => {
  try {
    initDb();
    const dbData = req.body;
    
    // Simple validation (must have core keys)
    if (!dbData || typeof dbData !== 'object') {
      return res.status(400).json({ error: "Invalid database format." });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to write to database:", error);
    res.status(500).json({ error: "Failed to save database file." });
  }
});

// Telegram Helper: Send Message
const sendTelegramMessage = async (chatId, text) => {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err);
  }
};

// Telegram Helper: Send Document (JSON File)
const sendTelegramBackupDocument = async (teacherId, data) => {
  try {
    const filename = `${teacherId}_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('chat_id', ADMIN_CHAT_ID);
    formData.append('caption', `📂 *Zaxira nusxasi:* \`${teacherId}\`\n🕒 Sana: ${new Date().toLocaleString()}`);
    formData.append('parse_mode', 'Markdown');
    formData.append('document', blob, filename);

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    if (!result.ok) {
      console.error(`[Telegram] Failed to send document for ${teacherId}:`, result);
    }
  } catch (err) {
    console.error(`[Telegram] Error sending document for ${teacherId}:`, err);
  }
};

// Git commit & push automated pipeline
const pushBackupsToGithub = () => {
  try {
    // 1. Check if the working tree is dirty
    const status = execSync('git status --porcelain', { cwd: __dirname }).toString().trim();
    const isDirty = status.length > 0;
    
    let stashed = false;
    if (isDirty) {
      console.log('[Git Backup] Working tree is dirty. Stashing changes...');
      execSync('git stash', { cwd: __dirname });
      stashed = true;
    }
    
    // 2. Pull remote changes
    try {
      console.log('[Git Backup] Pulling latest changes from remote...');
      execSync('git pull --rebase', { cwd: __dirname });
    } catch (pullErr) {
      console.error('[Git Backup] Git pull failed:', pullErr.message);
    }
    
    // 3. Add backups
    console.log('[Git Backup] Adding backups directory...');
    execSync('git add backups/', { cwd: __dirname });
    
    // 4. Commit (only if there are staged changes)
    const stagedStatus = execSync('git status --porcelain backups/', { cwd: __dirname }).toString().trim();
    if (stagedStatus.length > 0) {
      // YYYY-MM-DD Tashkent Time
      const dateStr = new Date().toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' }).split('.').reverse().join('-');
      console.log(`[Git Backup] Committing changes for ${dateStr}...`);
      execSync(`git commit -m "auto: db backup ${dateStr}"`, { cwd: __dirname });
      
      // 5. Push changes
      console.log('[Git Backup] Pushing changes to GitHub...');
      execSync('git push', { cwd: __dirname });
      console.log('[Git Backup] Backups pushed successfully!');
    } else {
      console.log('[Git Backup] No database changes detected. Skipping commit/push.');
    }
    
    // 6. Restore stashed changes if we stashed them
    if (stashed) {
      console.log('[Git Backup] Restoring stashed changes...');
      execSync('git stash pop', { cwd: __dirname });
    }
  } catch (err) {
    console.error('[Git Backup] Backup process encountered an error:', err.message);
  }
};

// Run all backups for the 4 teachers
const runAllBackups = async () => {
  const teachers = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
  let successCount = 0;
  
  // Ensure backups directory exists
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
        // Send to Telegram
        await sendTelegramBackupDocument(teacherId, row.data);
        
        // Save file locally in backups/
        const filePath = path.join(BACKUPS_DIR, `${teacherId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(row.data, null, 2));

        successCount++;
      } else {
        console.warn(`[Backup] No data found in Supabase for ${teacherId}`);
      }
    } catch (err) {
      console.error(`[Backup] Failed to fetch data for ${teacherId}:`, err);
    }
  }
  
  await sendTelegramMessage(ADMIN_CHAT_ID, `✅ *Tizim zaxirasi yakunlandi!*\n📈 Muvaffaqiyatli: *${successCount}/${teachers.length}* ta profil.`);

  // Trigger Git Commit and Push to GitHub repository
  pushBackupsToGithub();
};

// Schedule backup cron job (Every morning at 06:00 AM Tashkent time)
cron.schedule('0 6 * * *', () => {
  console.log('[Backup Cron] Starting daily 6:00 AM Tashkent time backup...');
  runAllBackups();
}, {
  scheduled: true,
  timezone: "Asia/Tashkent"
});

// Polling Loop for Telegram Bot Interactive Commands
let lastUpdateId = 0;
const pollTelegramUpdates = async () => {
  console.log('[Telegram Poll] Starting update polling loop...');
  while (true) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      const result = await response.json();
      if (result.ok && result.result.length > 0) {
        for (const update of result.result) {
          lastUpdateId = update.update_id;
          const message = update.message;
          if (message && message.text) {
            const text = message.text.trim();
            const chatId = String(message.chat.id);
            
            // Only allow authorized admin to run commands
            if (chatId === ADMIN_CHAT_ID) {
              if (text === '/backup') {
                await sendTelegramMessage(chatId, "⏳ *Zaxiralash jarayoni boshlandi...* Iltimos kutib turing.");
                await runAllBackups();
              } else if (text === '/start') {
                await sendTelegramMessage(chatId, "👋 *Salom Admin!*\n\nMen epchil robot zaxiralash botiman.\n\nHar kuni tunda barcha o'qituvchilar bazalarini `.json` qilib yuborib turaman.\n\nZaxiralashni hoziroq ishga tushirish uchun /backup buyrug'ini yuboring.");
              }
            } else {
              // Unauthorized user
              if (text === '/start' || text === '/backup') {
                await sendTelegramMessage(chatId, "⚠️ *Kechirasiz, siz ushbu bot administratori emassiz!*");
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Telegram Poll] Error in getUpdates polling:', err);
      await new Promise(r => setTimeout(r, 5000)); // wait before retry
    }
  }
};

// Initialize Supabase Postgres schema tables
const initSupabaseSchema = async () => {
  const pgClient = new pg.Client(pgConfig);
  try {
    console.log('[Supabase Init] Connecting to Postgres for schema checks...');
    await pgClient.connect();
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS appdata (
        teacher_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS group_passwords (
        password TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL,
        group_id TEXT NOT NULL
      );
    `);

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id SERIAL PRIMARY KEY,
        teacher_id TEXT NOT NULL,
        data JSONB NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    
    console.log('[Supabase Init] Database schema initialized successfully!');
  } catch (err) {
    console.error('[Supabase Init] Failed to initialize Postgres schema:', err);
  } finally {
    await pgClient.end();
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  initDb();
  
  // Verify & Initialize Supabase schemas
  await initSupabaseSchema();
  
  // Start polling Telegram updates asynchronously
  pollTelegramUpdates();

  if (process.env.TEST_BACKUP === 'true') {
    console.log('[Test Backup] Manually triggering backup...');
    await runAllBackups();
    process.exit(0);
  }
});
