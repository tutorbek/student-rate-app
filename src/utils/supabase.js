import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://unwonvkemmmtdsinhcnn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud29udmtlbW1tdGRzaW5oY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTM0OTksImV4cCI6MjA5ODU2OTQ5OX0.gcSqvGPgeKuE-_ROmua9yaNZNHmzB0jtqtXhdorUF04";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_DATA = {
  groups: [],
  students: [],
  transactions: [],
  payments: [],
  leads: [],
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

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase load timed out')), 4500)
    );

    const queryPromise = supabase
      .from('appdata')
      .select('data')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

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
export const saveToSupabase = async (teacherId, data, isExplicitReset = false) => {
  try {
    if (!teacherId || !data) return false;

    // Safety Guard: Block accidental empty database overwrite!
    const isEmptyData = teacherId !== 'admin' && (!data.groups || data.groups.length === 0) && (!data.students || data.students.length === 0);
    if (isEmptyData && !isExplicitReset) {
      console.warn('[Supabase Guard] Aborted save: Attempted to save empty database without explicit user reset confirmation!');
      return false;
    }

    const { error } = await supabase
      .from('appdata')
      .upsert({ teacher_id: teacherId, data });
    if (error) throw error;

    // Keep group passwords synchronized with the saved groups!
    if (teacherId !== 'admin') {
      if (isExplicitReset && isEmptyData) {
        deregisterTeacherGroupPasswords(teacherId).catch(console.warn);
      } else if (Array.isArray(data.groups)) {
        syncTeacherGroupPasswords(teacherId, data.groups).catch(console.warn);
      }
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Save failed:', err);
    return false;
  }
};

/**
 * Update a student's avatar in Supabase safely.
 */
export const updateStudentAvatarInSupabase = async (teacherId, studentId, newAvatarKey, studentName = null) => {
  try {
    if (!teacherId || !studentId || !newAvatarKey) return false;

    const { data: row, error: fetchErr } = await supabase
      .from('appdata')
      .select('data')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!row || !row.data) return false;

    const currentData = row.data;
    const currentStudents = currentData.students || [];

    const targetIdStr = String(studentId);
    let hasMatch = false;

    const updatedStudents = currentStudents.map((s) => {
      const matchId = String(s.id) === targetIdStr;
      const matchName = studentName && (s.name || '').trim().toLowerCase() === studentName.trim().toLowerCase();
      if (matchId || matchName) {
        hasMatch = true;
        return {
          ...s,
          emoji: newAvatarKey,
        };
      }
      return s;
    });

    if (!hasMatch) return false;

    const updatedData = { ...currentData, students: updatedStudents };
    const { error: upsertErr } = await supabase
      .from('appdata')
      .upsert({ teacher_id: teacherId, data: updatedData });

    if (upsertErr) throw upsertErr;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to update student avatar:', err);
    return false;
  }
};

/**
 * Set/update a 4-digit PIN for a student in Supabase.
 */
export const setStudentPinInSupabase = async (teacherId, studentId, pin, studentName = null, deviceId = null) => {
  try {
    if (!teacherId || !studentId || !pin) return false;

    const { data: row, error: fetchErr } = await supabase
      .from('appdata')
      .select('data')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!row || !row.data) return false;

    const currentData = row.data;
    const currentStudents = currentData.students || [];

    const targetIdStr = String(studentId);
    const cleanPin = String(pin).trim();
    let hasMatch = false;

    const updatedStudents = currentStudents.map((s) => {
      const matchId = String(s.id) === targetIdStr;
      const matchName = studentName && (s.name || '').trim().toLowerCase() === studentName.trim().toLowerCase();
      if (matchId || matchName) {
        hasMatch = true;
        const copy = { ...s, pin: cleanPin };
        if (deviceId) {
          copy.deviceId = String(deviceId);
        } else {
          delete copy.deviceId;
        }
        return copy;
      }
      return s;
    });

    if (!hasMatch) return false;

    const updatedData = { ...currentData, students: updatedStudents };
    const { error: upsertErr } = await supabase
      .from('appdata')
      .upsert({ teacher_id: teacherId, data: updatedData });

    if (upsertErr) throw upsertErr;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to set student PIN:', err);
    return false;
  }
};

/**
 * Reset/clear a student's PIN so they can set a new one.
 */
export const resetStudentPinInSupabase = async (teacherId, studentId, studentName = null) => {
  try {
    if (!teacherId || !studentId) return false;

    const { data: row, error: fetchErr } = await supabase
      .from('appdata')
      .select('data')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!row || !row.data) return false;

    const currentData = row.data;
    const currentStudents = currentData.students || [];

    const targetIdStr = String(studentId);
    let hasMatch = false;

    const updatedStudents = currentStudents.map((s) => {
      const matchId = String(s.id) === targetIdStr;
      const matchName = studentName && (s.name || '').trim().toLowerCase() === studentName.trim().toLowerCase();
      if (matchId || matchName) {
        hasMatch = true;
        const copy = { ...s };
        delete copy.pin;
        delete copy.deviceId;
        return copy;
      }
      return s;
    });

    if (!hasMatch) return false;

    const updatedData = { ...currentData, students: updatedStudents };
    const { error: upsertErr } = await supabase
      .from('appdata')
      .upsert({ teacher_id: teacherId, data: updatedData });

    if (upsertErr) throw upsertErr;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to reset student PIN:', err);
    return false;
  }
};

// Backwards compatibility aliases
export const claimStudentDeviceInSupabase = async () => true;
export const clearStudentDeviceBindingInSupabase = resetStudentPinInSupabase;

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
 * Deregister all group passwords belonging to a teacher.
 */
export const deregisterTeacherGroupPasswords = async (teacherId) => {
  try {
    if (!teacherId) return false;
    const { error } = await supabase
      .from('group_passwords')
      .delete()
      .eq('teacher_id', teacherId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to deregister teacher passwords:', err);
    return false;
  }
};

/**
 * Sync active group passwords for a teacher:
 * Deletes any stale passwords in group_passwords for this teacher that are no longer active,
 * and ensures active passwords are registered.
 */
export const syncTeacherGroupPasswords = async (teacherId, groups = []) => {
  try {
    if (!teacherId || teacherId === 'admin') return false;

    // Active groups that have a password and are not soft-deleted
    const activeGroups = (groups || []).filter(g => !g.deleted && g.password);
    const activeMap = new Map();
    activeGroups.forEach(g => {
      const pwd = String(g.password).trim().toLowerCase();
      if (pwd) activeMap.set(pwd, String(g.id));
    });

    // Fetch existing records for this teacher from group_passwords
    const { data: currentRecords, error: fetchErr } = await supabase
      .from('group_passwords')
      .select('password, group_id')
      .eq('teacher_id', teacherId);
    if (fetchErr) throw fetchErr;

    const currentPasswords = currentRecords || [];
    const passwordsToDelete = [];
    const existingValid = new Set();

    for (const row of currentPasswords) {
      const targetGroupId = activeMap.get(row.password);
      if (!targetGroupId || String(row.group_id) !== String(targetGroupId)) {
        passwordsToDelete.push(row.password);
      } else {
        existingValid.add(row.password);
      }
    }

    if (passwordsToDelete.length > 0) {
      await supabase
        .from('group_passwords')
        .delete()
        .eq('teacher_id', teacherId)
        .in('password', passwordsToDelete);
    }

    // Passwords to insert/upsert
    const toInsert = [];
    activeMap.forEach((gId, pwd) => {
      if (!existingValid.has(pwd)) {
        toInsert.push({ password: pwd, teacher_id: teacherId, group_id: gId });
      }
    });

    if (toInsert.length > 0) {
      await supabase
        .from('group_passwords')
        .upsert(toInsert);
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to sync group passwords:', err);
    return false;
  }
};

/**
 * Verify a group password and ensure the group actually exists and is active.
 * If the password exists in registry but group is missing or deleted,
 * automatically purges the orphaned registry entry and returns null.
 */
export const verifyGroupPassword = async (password) => {
  if (!password) return null;
  const cleanPassword = password.trim().toLowerCase();

  try {
    // 1. Look up in group_passwords
    const { data: row, error } = await supabase
      .from('group_passwords')
      .select('*')
      .eq('password', cleanPassword)
      .maybeSingle();

    if (error || !row) {
      return null; // Not found in registry
    }

    // 2. Fetch the corresponding teacher's appdata
    const { data: teacherRow, error: tErr } = await supabase
      .from('appdata')
      .select('data')
      .eq('teacher_id', row.teacher_id)
      .maybeSingle();

    if (tErr || !teacherRow || !teacherRow.data) {
      // Teacher row missing - purge orphaned password
      await deregisterGroupPassword(cleanPassword);
      return null;
    }

    const groups = teacherRow.data.groups || [];
    const matchedGroup = groups.find(
      (g) => String(g.id) === String(row.group_id) && !g.deleted
    );

    if (!matchedGroup) {
      // Group does not exist or has been deleted - purge orphaned password
      await deregisterGroupPassword(cleanPassword);
      return null;
    }

    return {
      teacherId: row.teacher_id,
      groupId: row.group_id,
      groupName: matchedGroup.name || '',
      group: matchedGroup
    };
  } catch (err) {
    console.error('[Supabase] Failed to verify group password:', err);
    return null;
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

/**
 * Load data for all teachers from Supabase (Admin view).
 * Returns an object mapping teacherId -> teacher data.
 */
export const loadAllTeachersFromSupabase = async (teacherIds = ['teacher1', 'teacher2', 'teacher3', 'teacher4', 'admin']) => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase load timed out')), 6000)
    );

    const queryPromise = supabase
      .from('appdata')
      .select('teacher_id, data, updated_at')
      .in('teacher_id', teacherIds);

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) throw error;

    const result = {};
    // Initialize all requested teacher IDs with empty structure
    teacherIds.forEach(id => {
      result[id] = {
        groups: [],
        students: [],
        transactions: [],
        payments: [],
        quickTags: DEFAULT_DATA.quickTags,
        attendance: [],
        teacherProfile: null,
        leads: [],
        extraLessons: [],
        updatedAt: null
      };
    });

    if (data) {
      data.forEach(row => {
        if (row.data) {
          result[row.teacher_id] = {
            groups: row.data.groups || [],
            students: row.data.students || [],
            transactions: row.data.transactions || [],
            payments: row.data.payments || [],
            quickTags: row.data.quickTags || DEFAULT_DATA.quickTags,
            attendance: row.data.attendance || [],
            teacherProfile: row.data.teacherProfile || null,
            leads: row.data.leads || [],
            extraLessons: row.data.extraLessons || [],
            updatedAt: row.updated_at || null
          };
        }
      });
    }

    return result;
  } catch (err) {
    console.error('[Supabase] loadAllTeachersFromSupabase failed:', err);
    return null;
  }
};

