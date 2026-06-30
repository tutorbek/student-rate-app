import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdIv3yqR9zamg_K14qCn3WTt9AwsXFVh8",
  authDomain: "rated-app-3c896.firebaseapp.com",
  projectId: "rated-app-3c896",
  storageBucket: "rated-app-3c896.firebasestorage.app",
  messagingSenderId: "1080403039792",
  appId: "1:1080403039792:web:0d2b6464810ba1b96cfff5",
  measurementId: "G-4XLSBNQNE0"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

const DB_DOC = (teacherId) => doc(firestore, 'appdata', teacherId || 'main');

const DEFAULT_DATA = {
  groups: [],
  students: [],
  transactions: [],
  quickTags: [
    'Faol ishtirok 🌟',
    'Uy vazifasi bajardi 📚',
    'Ajoyib javob 💡',
    'Darsga kechikdi ⏰',
    'Guruh ishida faollik 👥',
    'Intizom buzilishi ⚠️',
  ],
};

/**
 * Load all app data from Firestore for a specific teacher.
 * Returns the data object or null on error.
 */
export const loadFromFirestore = async (teacherId) => {
  try {
    const activeDoc = DB_DOC(teacherId);
    const snap = await getDoc(activeDoc);
    if (snap.exists()) {
      return snap.data();
    }
    
    // First time initializing this teacher — if it's teacher1, check if we can migrate from 'main'
    if (teacherId === 'teacher1') {
      const mainSnap = await getDoc(DB_DOC('main'));
      if (mainSnap.exists()) {
        const mainData = mainSnap.data();
        await setDoc(activeDoc, mainData);
        console.log('[Firestore] Migrated old global data to teacher1 successfully.');
        return mainData;
      }
    }

    // First time — initialize with defaults
    await setDoc(activeDoc, DEFAULT_DATA);
    return DEFAULT_DATA;
  } catch (err) {
    console.error('[Firestore] Load failed:', err);
    return null;
  }
};

/**
 * Save all app data to Firestore for a specific teacher.
 * Returns true on success, false on error.
 */
export const saveToFirestore = async (teacherId, data) => {
  try {
    if (!teacherId) return false;
    await setDoc(DB_DOC(teacherId), data);
    return true;
  } catch (err) {
    console.error('[Firestore] Save failed:', err);
    return false;
  }
};
