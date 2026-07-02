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

const REGISTRY_DOC = () => doc(firestore, 'appdata', 'group_passwords');

/**
 * Fetch the entire group passwords registry.
 */
export const getGroupPasswordsRegistry = async () => {
  try {
    const snap = await getDoc(REGISTRY_DOC());
    if (snap.exists()) {
      return snap.data().passwords || {};
    }
    return {};
  } catch (err) {
    console.error('[Firestore] Failed to get registry:', err);
    return {};
  }
};

/**
 * Register a group password.
 * Returns true on success, false if password is already taken.
 */
export const registerGroupPassword = async (password, teacherId, groupId) => {
  try {
    if (!password) return false;
    const cleanPassword = password.trim().toLowerCase();
    const registry = await getGroupPasswordsRegistry();
    
    // Check if taken by another group
    const existing = registry[cleanPassword];
    if (existing && (existing.teacherId !== teacherId || existing.groupId !== groupId)) {
      return false; // Already taken
    }
    
    // Update registry
    registry[cleanPassword] = { teacherId, groupId };
    await setDoc(REGISTRY_DOC(), { passwords: registry });
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to register password:', err);
    return false;
  }
};

/**
 * Deregister a group password.
 */
export const deregisterGroupPassword = async (password) => {
  try {
    if (!password) return;
    const cleanPassword = password.trim().toLowerCase();
    const registry = await getGroupPasswordsRegistry();
    if (registry[cleanPassword]) {
      delete registry[cleanPassword];
      await setDoc(REGISTRY_DOC(), { passwords: registry });
    }
  } catch (err) {
    console.error('[Firestore] Failed to deregister password:', err);
  }
};

const SNAPSHOTS_DOC = (teacherId) => doc(firestore, 'appdata', `${teacherId || 'main'}_snapshots`);

/**
 * Load snapshots history from Firestore for a specific teacher.
 */
export const loadSnapshotsFromFirestore = async (teacherId) => {
  try {
    if (!teacherId) return [];
    const snap = await getDoc(SNAPSHOTS_DOC(teacherId));
    if (snap.exists()) {
      return snap.data().snapshots || [];
    }
    return [];
  } catch (err) {
    console.error('[Firestore] Load snapshots failed:', err);
    return [];
  }
};

/**
 * Save a new database state snapshot to Firestore.
 * Caps the history length to 5 snapshots.
 */
export const saveSnapshotToFirestore = async (teacherId, data) => {
  try {
    if (!teacherId) return false;
    const currentSnapshots = await loadSnapshotsFromFirestore(teacherId);
    
    // Deep clone the incoming data to make sure no references are shared
    const cleanData = JSON.parse(JSON.stringify(data));
    const newSnapshot = {
      timestamp: new Date().toISOString(),
      data: cleanData
    };
    
    // Prepend new snapshot
    const updatedSnapshots = [newSnapshot, ...currentSnapshots].slice(0, 5);
    await setDoc(SNAPSHOTS_DOC(teacherId), { snapshots: updatedSnapshots });
    return true;
  } catch (err) {
    console.error('[Firestore] Save snapshot failed:', err);
    return false;
  }
};
