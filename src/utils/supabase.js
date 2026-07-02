import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://unwonvkemmmtdsinhcnn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTM0OTksImV4cCI6MjA5ODU2OTQ5OX0.gcSqvGPgeKuE-_ROmua9yaNZNHmzB0jtqtXhdorUF04";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
 * Load all app data from Supabase for a specific teacher.
 */
export const loadFromSupabase = async (teacherId) => {
  try {
    if (!teacherId) return null;
    const { data, error } = await supabase
      .from('appdata')
      .select('data')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error) throw error;
    if (data && data.data) {
      return data.data;
    }

    // First time — initialize with defaults
    const { error: insertError } = await supabase
      .from('appdata')
      .insert({ teacher_id: teacherId, data: DEFAULT_DATA });
    if (insertError) throw insertError;
    return DEFAULT_DATA;
  } catch (err) {
    console.error('[Supabase] Load failed:', err);
    return null;
  }
};

/**
 * Save all app data to Supabase for a specific teacher.
 */
export const saveToSupabase = async (teacherId, data) => {
  try {
    if (!teacherId) return false;
    const { error } = await supabase
      .from('appdata')
      .upsert({ teacher_id: teacherId, data });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Save failed:', err);
    return false;
  }
};

/**
 * Fetch the entire group passwords registry.
 */
export const getGroupPasswordsRegistry = async () => {
  try {
    const { data, error } = await supabase
      .from('group_passwords')
      .select('*');
    if (error) throw error;

    const registry = {};
    if (data) {
      data.forEach(row => {
        registry[row.password] = { teacherId: row.teacher_id, groupId: row.group_id };
      });
    }
    return registry;
  } catch (err) {
    console.error('[Supabase] Failed to get registry:', err);
    return {};
  }
};

/**
 * Register a group password.
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

    const { error } = await supabase
      .from('group_passwords')
      .upsert({ password: cleanPassword, teacher_id: teacherId, group_id: groupId });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to register password:', err);
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
    const { error } = await supabase
      .from('group_passwords')
      .delete()
      .eq('password', cleanPassword);
    if (error) throw error;
  } catch (err) {
    console.error('[Supabase] Failed to deregister password:', err);
  }
};

/**
 * Load snapshots history from Supabase for a specific teacher.
 */
export const loadSnapshotsFromSupabase = async (teacherId) => {
  try {
    if (!teacherId) return [];
    const { data, error } = await supabase
      .from('snapshots')
      .select('data, timestamp')
      .eq('teacher_id', teacherId)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) throw error;
    if (data) {
      return data.map(item => ({ timestamp: item.timestamp, data: item.data }));
    }
    return [];
  } catch (err) {
    console.error('[Supabase] Load snapshots failed:', err);
    return [];
  }
};

/**
 * Save a new database state snapshot to Supabase.
 * Caps the history length to 5 snapshots.
 */
export const saveSnapshotToSupabase = async (teacherId, data) => {
  try {
    if (!teacherId) return false;
    
    // Insert new snapshot
    const cleanData = JSON.parse(JSON.stringify(data));
    const { error: insertError } = await supabase
      .from('snapshots')
      .insert({
        teacher_id: teacherId,
        data: cleanData
      });
    if (insertError) throw insertError;

    // Load current snapshot IDs ordered by time to clean up older ones
    const { data: current, error: listError } = await supabase
      .from('snapshots')
      .select('id')
      .eq('teacher_id', teacherId)
      .order('timestamp', { ascending: false });

    if (listError) throw listError;

    // Delete any snapshots past the 5 limit
    if (current && current.length > 5) {
      const idsToDelete = current.slice(5).map(c => c.id);
      const { error: deleteError } = await supabase
        .from('snapshots')
        .delete()
        .in('id', idsToDelete);
      if (deleteError) throw deleteError;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Save snapshot failed:', err);
    return false;
  }
};
