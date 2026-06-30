import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_DIR = path.join(__dirname, 'storage');
const DB_FILE = path.join(DB_DIR, 'db.json');

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

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  initDb();
});
