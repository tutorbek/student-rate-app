import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import Attendance from './components/Attendance';
import ScheduleView from './components/ScheduleView';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminGroups from './components/admin/AdminGroups';
import AdminAttendance from './components/admin/AdminAttendance';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import {
  loadFromSupabase as loadFromFirestore,
  saveToSupabase as saveToFirestore,
  loadAllTeachersFromSupabase,
  registerGroupPassword,
  deregisterGroupPassword,
  getGroupPasswordsRegistry,
  loadSnapshotsFromSupabase as loadSnapshotsFromFirestore,
  saveSnapshotToSupabase as saveSnapshotToFirestore
} from './utils/supabase';

import {
  DEFAULT_QUICK_TAGS,
  normalizeQuickTags,
  saveAttendance,
  deleteAttendanceRecord,
  addGroup,
  deleteGroup,
  addStudent,
  deleteStudent,
  addTransaction,
  deleteTransaction,
  updateGroup,
  updateStudent,
  transferStudent,
  restoreGroup,
  restoreStudent,
  permanentlyDeleteGroup,
  permanentlyDeleteStudent,
  importDatabase,
  sanitizeAttendanceList,
  syncTransferredStudentsAttendance
} from './utils/db';
import { normalizeIconUrl } from './utils/avatarGallery';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedRole = localStorage.getItem('rsa_role');
    const isStudent = savedRole === 'student';
    if (isStudent) {
      const savedTab = localStorage.getItem('rsa_active_tab') || 'leaderboard';
      return (savedTab === 'leaderboard' || savedTab === 'history') ? savedTab : 'leaderboard';
    }
    // When entering the project as teacher/admin, open Dars Jadvalim ('schedule') first
    const sessionTab = sessionStorage.getItem('rsa_active_tab');
    if (sessionTab) {
      return sessionTab;
    }
    return 'schedule';
  });
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    const saved = localStorage.getItem('rsa_selected_group_id');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    sessionStorage.setItem('rsa_active_tab', activeTab);
    localStorage.setItem('rsa_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('rsa_selected_group_id', JSON.stringify(selectedGroupId));
  }, [selectedGroupId]);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('rsa_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('rsa_authenticated') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('rsa_role') || 'student';
  });
  const [teacherId, setTeacherId] = useState(() => {
    return localStorage.getItem('rsa_teacher_id') || null;
  });
  const [studentGroupId, setStudentGroupId] = useState(() => {
    return localStorage.getItem('rsa_student_group_id') || null;
  });
  const [syncStatus, setSyncStatus] = useState('saved'); // 'saved', 'saving', 'offline'
  const [snapshots, setSnapshots] = useState([]);

  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authView, setAuthView] = useState('landing');

  const applyThemeInstantly = useCallback((newTheme) => {
    // Temporarily disable CSS transitions so that background, text, and cards switch in 0ms without white flicker
    const css = document.createElement('style');
    css.appendChild(
      document.createTextNode(
        `*, *::before, *::after {
           -webkit-transition: none !important;
           -moz-transition: none !important;
           -o-transition: none !important;
           -ms-transition: none !important;
           transition: none !important;
         }`
      )
    );
    document.head.appendChild(css);

    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.style.backgroundColor = newTheme === 'dark' ? '#202124' : '#F5F5F7';
    document.documentElement.style.colorScheme = newTheme;
    localStorage.setItem('rsa_theme', newTheme);

    // Force style recalculation
    const _ = window.getComputedStyle(css).opacity;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (document.head.contains(css)) {
          document.head.removeChild(css);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.backgroundColor = '#F5F5F7';
      document.documentElement.style.colorScheme = 'light';
      return;
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = theme === 'dark' ? '#202124' : '#F5F5F7';
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('rsa_theme', theme);
  }, [theme, isAuthenticated]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyThemeInstantly(nextTheme);
  }, [theme, applyThemeInstantly]);

  const handleSetTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      applyThemeInstantly(newTheme);
    }
  }, [applyThemeInstantly]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPassword) {
      setLoginError("Parolni kiriting!");
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    const CREDENTIALS = {
      // Super Admin
      'hammaguruhlar': { role: 'admin', teacherId: 'admin' },

      // Teacher 1
      'insight': { role: 'teacher', teacherId: 'teacher1' },
      'beksila': { role: 'teacher', teacherId: 'teacher1' }, // backward compatibility

      // Teacher 2
      'quyosh': { role: 'teacher', teacherId: 'teacher2' },

      // Teacher 3
      'hehehe': { role: 'teacher', teacherId: 'teacher3' },

      // Teacher 4
      'simsim': { role: 'teacher', teacherId: 'teacher4' },
    };

    const passwordClean = loginPassword.trim().toLowerCase();
    const match = CREDENTIALS[passwordClean];

    if (match) {
      localStorage.setItem('rsa_authenticated', 'true');
      localStorage.setItem('rsa_role', match.role);
      localStorage.setItem('rsa_teacher_id', match.teacherId);
      localStorage.removeItem('rsa_student_group_id');

      setIsAuthenticated(true);
      setUserRole(match.role);
      setTeacherId(match.teacherId);
      setStudentGroupId(null);

      if (match.role === 'student') {
        setActiveTab('leaderboard');
      } else if (match.role === 'admin') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('schedule');
      }
      showToast(match.role === 'admin' ? "Admin paneliga muvaffaqiyatli kirdingiz!" : "Muvaffaqiyatli kirdingiz!", "success");
      setLoginLoading(false);
    } else {
      // Try to check group password registry
      try {
        const registry = await getGroupPasswordsRegistry();
        const groupMatch = registry[passwordClean];
        if (groupMatch) {
          localStorage.setItem('rsa_authenticated', 'true');
          localStorage.setItem('rsa_role', 'student');
          localStorage.setItem('rsa_teacher_id', groupMatch.teacherId);
          localStorage.setItem('rsa_student_group_id', groupMatch.groupId);

          setIsAuthenticated(true);
          setUserRole('student');
          setTeacherId(groupMatch.teacherId);
          setStudentGroupId(groupMatch.groupId);
          setActiveTab('leaderboard');

          showToast("Guruh reytingiga muvaffaqiyatli kirdingiz!", "success");
        } else {
          setLoginError("Noto'g'ri parol!");
        }
      } catch (err) {
        console.error('Group login failed:', err);
        setLoginError("Tizimga ulanishda xatolik yuz berdi. Internetni tekshiring.");
      }
      setLoginLoading(false);
    }
  };

  // Auto-logout legacy hardcoded student sessions (no group ID = old password-based login)
  useEffect(() => {
    if (
      isAuthenticated &&
      userRole === 'student' &&
      !localStorage.getItem('rsa_student_group_id')
    ) {
      // This user logged in with an old hardcoded student password — force logout
      localStorage.removeItem('rsa_authenticated');
      localStorage.removeItem('rsa_role');
      localStorage.removeItem('rsa_teacher_id');
      localStorage.removeItem('rsa_active_tab');
      localStorage.removeItem('rsa_student_group_id');
      localStorage.removeItem('rsa_groups');
      localStorage.removeItem('rsa_students');
      localStorage.removeItem('rsa_transactions');
      localStorage.removeItem('rsa_quick_tags');
      setIsAuthenticated(false);
      setTeacherId(null);
      setStudentGroupId(null);
      setUserRole('student');
      setActiveTab('dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enforce student role routing constraints — always block unauthorized tabs
  useEffect(() => {
    if (userRole === 'student') {
      if (activeTab !== 'leaderboard' && activeTab !== 'history') {
        setActiveTab('leaderboard');
        localStorage.setItem('rsa_active_tab', 'leaderboard');
      }
    }
  }, [userRole, activeTab]);

  // Sync body class for mobile viewport lock
  useEffect(() => {
    if (isAuthenticated) {
      document.body.classList.add('is-authenticated');
    } else {
      document.body.classList.remove('is-authenticated');
    }
    return () => {
      document.body.classList.remove('is-authenticated');
    };
  }, [isAuthenticated]);

  // Sync state (Strict Cloud-First: Supabase is Single Source of Truth)
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [quickTags, setQuickTags] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [allTeachersData, setAllTeachersData] = useState({});
  const [selectedAdminTeacherFilter, setSelectedAdminTeacherFilter] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const lastSavedDataRef = useRef(null);

  // Toast notifications state
  const [toast, setToast] = useState(null);

  // Show dynamic toast
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
  };

  // Load database from Supabase when authenticated and teacherId is ready
  useEffect(() => {
    if (!isAuthenticated || !teacherId) {
      setIsLoaded(false);
      return;
    }
    const load = async () => {
      setIsSyncing(true);

      // Handle Admin Mode: Load all 4 teachers concurrently
      if (userRole === 'admin') {
        const allData = await loadAllTeachersFromSupabase(['teacher1', 'teacher2', 'teacher3', 'teacher4']);
        if (allData) {
          const normalized = {};
          Object.keys(allData).forEach(tId => {
            const t = allData[tId];
            normalized[tId] = {
              ...t,
              groups: (t.groups || []).map(g => ({ ...g, icon: normalizeIconUrl(g.icon) })),
              students: (t.students || []).map(s => ({ ...s, emoji: normalizeIconUrl(s.emoji) })),
              transactions: t.transactions || [],
              quickTags: normalizeQuickTags(t.quickTags),
              attendance: t.attendance || []
            };
          });
          setAllTeachersData(normalized);
          setIsLoaded(true);
          setConnectionError(false);
          setSyncStatus('saved');
        } else {
          setSyncStatus('offline');
          setConnectionError(true);
          setIsLoaded(false);
        }
        setIsSyncing(false);
        return;
      }

      // Always prioritize live Cloud Database (Supabase) as Single Source of Truth
      let data = await loadFromFirestore(teacherId);

      // Disaster recovery fallback ONLY if network completely failed
      if (!data) {
        const localBackupStr = localStorage.getItem(`rsa_local_backup_${teacherId}`);
        if (localBackupStr) {
          try {
            const localBackup = JSON.parse(localBackupStr);
            const localHasContent = (localBackup.groups && localBackup.groups.length > 0) || (localBackup.students && localBackup.students.length > 0);
            if (localHasContent) {
              console.warn('[Disaster Recovery] Network failed; loaded offline cache.');
              data = localBackup;
              showToast("Internet uzildi. Ma'lumotlar qurilmaning vaqtinchalik xotirasidan ochildi!", "info");
            }
          } catch (_err) {
            // ignore parse error
          }
        }
      }

      if (data) {
        const loadedGroups = (data.groups || []).map((g) => ({
          ...g,
          icon: normalizeIconUrl(g.icon),
        }));
        const loadedStudents = (data.students || []).map((s) => ({
          ...s,
          emoji: normalizeIconUrl(s.emoji),
        }));
        const loadedTransactions = data.transactions || [];
        const loadedQuickTags = normalizeQuickTags(data.quickTags);
        const loadedAttendance = sanitizeAttendanceList(data.attendance || []);
        const { updatedAttendance: syncedAttendance } = syncTransferredStudentsAttendance(loadedStudents, loadedAttendance);

        setGroups(loadedGroups);
        setStudents(loadedStudents);
        setTransactions(loadedTransactions);
        setQuickTags(loadedQuickTags);
        setAttendance(syncedAttendance);

        // Update the ref so we don't accidentally re-save on mount
        const dbState = {
          groups: loadedGroups,
          students: loadedStudents,
          transactions: loadedTransactions,
          quickTags: loadedQuickTags,
          attendance: syncedAttendance
        };
        lastSavedDataRef.current = JSON.stringify(dbState);

        // Cache fresh cloud data to local storage for offline protection
        try {
          if (loadedGroups.length > 0 || loadedStudents.length > 0) {
            localStorage.setItem(`rsa_local_backup_${teacherId}`, JSON.stringify(dbState));
          }
        } catch (_) { }

        setIsLoaded(true);
        setConnectionError(false);
        setSyncStatus('saved');
      } else {
        // Load failed due to network / database error and no local cache exists
        console.error('[Supabase] Load failed on startup.');
        setSyncStatus('offline');
        setConnectionError(true);
        setIsLoaded(false);
      }

      // Load snapshots for rollback points (Teachers only)
      if (userRole === 'teacher') {
        const history = await loadSnapshotsFromFirestore(teacherId);
        if (history) setSnapshots(history);
      }

      setIsSyncing(false);
    };
    load();
  }, [isAuthenticated, teacherId, userRole, reloadTrigger]);

  // Auto-sync attendance for transferred students (e.g. cleans up old group attendance remnants)
  useEffect(() => {
    if (!isLoaded || students.length === 0 || attendance.length === 0) return;
    const { updatedAttendance, hasChanges } = syncTransferredStudentsAttendance(students, attendance);
    if (hasChanges) {
      setAttendance(updatedAttendance);
    }
  }, [isLoaded, students, attendance]);

  //  Natural sorting function for group names (e.g. G1, G2, G3, G4, G10...)
  const sortGroupsNaturally = (list) => {
    return [...list].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // Filter states to exclude soft-deleted items, and enforce student group-level isolation
  const filteredGroups = useMemo(() => {
    const activeGroups = groups.filter(g => !g.deleted);
    const sorted = sortGroupsNaturally(activeGroups);
    if (userRole === 'student' && studentGroupId) {
      return sorted.filter(g => g.id === studentGroupId);
    }
    return sorted;
  }, [groups, userRole, studentGroupId]);

  const filteredStudents = useMemo(() => {
    const activeStudents = students.filter(s => !s.deleted);
    const sorted = [...activeStudents].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
    if (userRole === 'student' && studentGroupId) {
      return sorted.filter(s => s.groupId === studentGroupId);
    }
    return sorted;
  }, [students, userRole, studentGroupId]);

  const studentIds = useMemo(() => {
    return filteredStudents.map(s => s.id);
  }, [filteredStudents]);

  const filteredTransactions = useMemo(() => {
    const activeTxs = transactions.filter(t => !t.deleted);
    if (userRole === 'student' && studentGroupId) {
      return activeTxs.filter(t => studentIds.includes(t.studentId));
    }
    return activeTxs;
  }, [transactions, studentIds, userRole, studentGroupId]);

  // All active data for the current teacher (no student-group isolation)
  const allActiveGroups = useMemo(() => sortGroupsNaturally(groups.filter(g => !g.deleted)), [groups]);
  const allActiveStudents = useMemo(() => students.filter(s => !s.deleted), [students]);
  const allActiveTransactions = useMemo(() => transactions.filter(t => !t.deleted), [transactions]);

  // Debounced Save to Firestore whenever state changes (Teachers only!)
  useEffect(() => {
    if (!isLoaded || !isAuthenticated || !teacherId) return;
    if (userRole === 'student' || userRole === 'admin') return;

    const db = { groups, students, transactions, quickTags, attendance };
    const dbStr = JSON.stringify(db);

    // Instant (0ms) local cache backup to localStorage for offline protection!
    try {
      if (groups.length > 0 || students.length > 0) {
        localStorage.setItem(`rsa_local_backup_${teacherId}`, dbStr);
      }
    } catch (e) {
      console.warn('[LocalStorage] Local backup save failed:', e);
    }

    // ACCIDENTAL WIPEOUT GUARD:
    // If state is 0 groups and 0 students, but previous saved state had data, DO NOT auto-save!
    if (groups.length === 0 && students.length === 0 && lastSavedDataRef.current) {
      try {
        const prev = JSON.parse(lastSavedDataRef.current);
        if ((prev.groups && prev.groups.length > 0) || (prev.students && prev.students.length > 0)) {
          console.warn('[SECURITY GUARD] Blocked accidental empty database overwrite to Supabase!');
          setSyncStatus('saved');
          return;
        }
      } catch (_err) {
        // ignore parse error
      }
    }

    // If identical to last saved or loaded state, skip network save
    if (lastSavedDataRef.current === dbStr) {
      setSyncStatus('saved');
      return;
    }

    setSyncStatus('saving');

    const timer = setTimeout(() => {
      saveToFirestore(teacherId, db)
        .then((success) => {
          if (success) {
            setSyncStatus('saved');
            lastSavedDataRef.current = dbStr; // Update ref to match new saved state
            // Write a history snapshot in parallel
            saveSnapshotToFirestore(teacherId, db).then(() => {
              loadSnapshotsFromFirestore(teacherId).then(history => setSnapshots(history));
            });
          } else {
            setSyncStatus('offline');
          }
        })
        .catch((err) => {
          console.error('[Firestore] Debounced save failed:', err);
          setSyncStatus('offline');
        });
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timer);
  }, [groups, students, transactions, quickTags, attendance, isLoaded, isAuthenticated, teacherId, userRole]);

  // Clear toast after timeout
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);





  const handleResetDatabase = async () => {
    setIsSyncing(true);
    const defaultDb = {
      groups: [],
      students: [],
      transactions: [],
      quickTags: DEFAULT_QUICK_TAGS,
      attendance: []
    };
    const success = await saveToFirestore(teacherId, defaultDb, true);
    if (success) {
      setGroups([]);
      setStudents([]);
      setTransactions([]);
      setQuickTags(DEFAULT_QUICK_TAGS);
      setAttendance([]);
      localStorage.removeItem(`rsa_local_backup_${teacherId}`);
      lastSavedDataRef.current = JSON.stringify(defaultDb);
      showToast("Barcha ma'lumotlar o'chirildi!", "info");
    } else {
      showToast("Xatolik yuz berdi. Internetni tekshiring.", "error");
    }
    setIsSyncing(false);
  };

  const handleImportDatabase = async (jsonString) => {
    try {
      const db = importDatabase(jsonString);
      setIsSyncing(true);
      const success = await saveToFirestore(teacherId, db);
      if (success) {
        setGroups(db.groups);
        setStudents(db.students);
        setTransactions(db.transactions);
        setQuickTags(db.quickTags);
        setAttendance(sanitizeAttendanceList(db.attendance || []));
        lastSavedDataRef.current = JSON.stringify(db);
        showToast("Ma'lumotlar muvaffaqiyatli tiklandi!", "success");
        return true;
      } else {
        showToast("Ma'lumotlarni saqlashda xatolik yuz berdi.", "error");
        return false;
      }
    } catch (err) {
      showToast(err.message, "error");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Actions
  const handleSaveAttendance = (groupId, date, records) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date > todayStr) {
      showToast("Bo'lajak sanalar uchun davomat saqlash taqiqlangan!", "warning");
      return null;
    }
    const { updatedRecord, updatedAttendance } = saveAttendance(attendance, groupId, date, records);
    setAttendance(updatedAttendance);
    return updatedRecord;
  };

  const handleAddGroup = async (name, icon, password, color, schedule = null) => {
    const cleanPwd = password.trim().toLowerCase();
    const { newGroup, updatedGroups } = addGroup(groups, name, icon, cleanPwd, color, schedule);

    // Register password globally in Supabase registry
    const success = await registerGroupPassword(cleanPwd, teacherId, newGroup.id);
    if (!success) {
      showToast("Ushbu parol band qilingan. Boshqa parol kiriting!", "error");
      return false;
    }
    setGroups(updatedGroups);
    return true;
  };

  const handleDeleteGroup = async (id) => {
    const group = groups.find((g) => g.id === id);
    if (group && group.password) {
      await deregisterGroupPassword(group.password);
    }
    const { updatedGroups, updatedStudents, updatedTransactions } = deleteGroup(groups, students, transactions, id);
    setGroups(updatedGroups);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
  };

  const handleAddStudent = (name, groupId, emoji, color) => {
    const { newStudent, updatedStudents } = addStudent(students, name, groupId, emoji, color);
    setStudents(updatedStudents);
  };

  const handleUpdateStudent = (id, name, emoji, color, groupId = null) => {
    const { updatedStudents, updatedAttendance } = updateStudent(students, id, name, emoji, color, groupId, attendance);
    setStudents(updatedStudents);
    if (updatedAttendance) setAttendance(updatedAttendance);
  };

  const handleTransferStudent = (studentId, targetGroupId) => {
    const { updatedStudents, updatedAttendance } = transferStudent(students, studentId, targetGroupId, attendance);
    setStudents(updatedStudents);
    if (updatedAttendance) setAttendance(updatedAttendance);
  };

  const handleDeleteStudent = (id) => {
    const { updatedStudents, updatedTransactions } = deleteStudent(students, transactions, id);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
  };

  const handleUpdateGroup = async (id, name, icon, password, color, schedule) => {
    const group = groups.find((g) => g.id === id);
    const oldPassword = group ? group.password : '';
    const cleanNewPassword = password !== undefined ? password.trim().toLowerCase() : oldPassword;

    if (cleanNewPassword && cleanNewPassword !== oldPassword) {
      const success = await registerGroupPassword(cleanNewPassword, teacherId, id);
      if (!success) {
        showToast("Ushbu parol band qilingan. Boshqa parol kiriting!", "error");
        return false;
      }
      if (oldPassword) {
        await deregisterGroupPassword(oldPassword);
      }
    }

    const { updatedGroup, updatedGroups } = updateGroup(groups, id, name, icon, cleanNewPassword, color, schedule);
    setGroups(updatedGroups);
    return true;
  };

  const handleUpdateGroupSchedule = (groupId, schedule) => {
    const { updatedGroup, updatedGroups } = updateGroup(groups, groupId, undefined, undefined, undefined, undefined, schedule);
    setGroups(updatedGroups);
    return true;
  };

  // Restore and Permanent Deletion Actions for Trash Bin
  const handleRestoreGroup = (id) => {
    const { updatedGroups, updatedStudents, updatedTransactions } = restoreGroup(groups, students, transactions, id);
    setGroups(updatedGroups);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    showToast("Guruh muvaffaqiyatli tiklandi!", "success");
  };

  const handleRestoreStudent = (id) => {
    const { updatedGroups, updatedStudents, updatedTransactions } = restoreStudent(groups, students, transactions, id);
    setGroups(updatedGroups);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    showToast("O'quvchi muvaffaqiyatli tiklandi!", "success");
  };

  const handlePermanentlyDeleteGroup = (id) => {
    const { updatedGroups, updatedStudents, updatedTransactions, updatedAttendance } = permanentlyDeleteGroup(groups, students, transactions, id, attendance);
    setGroups(updatedGroups);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    if (updatedAttendance) setAttendance(updatedAttendance);
    showToast("Guruh butunlay o'chirildi!", "info");
  };

  const handlePermanentlyDeleteStudent = (id) => {
    const { updatedStudents, updatedTransactions, updatedAttendance } = permanentlyDeleteStudent(students, transactions, id, attendance);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    if (updatedAttendance) setAttendance(updatedAttendance);
    showToast("O'quvchi butunlay o'chirildi!", "info");
  };

  // Rollback database snapshot handler
  const handleRollback = async (snapshotData) => {
    if (!snapshotData || !teacherId) return;
    setIsSyncing(true);

    const success = await saveToFirestore(teacherId, snapshotData);
    if (success) {
      setGroups(snapshotData.groups || []);
      setStudents(snapshotData.students || []);
      setTransactions(snapshotData.transactions || []);
      setQuickTags(snapshotData.quickTags || []);
      setAttendance(sanitizeAttendanceList(snapshotData.attendance || []));
      lastSavedDataRef.current = JSON.stringify(snapshotData);
      showToast("Tizim oldingi holatga qaytarildi!", "success");
    } else {
      showToast("Qaytarishda xatolik yuz berdi.", "error");
    }
    setIsSyncing(false);
  };

  const handleAwardPoints = (studentId, amount, comment) => {
    const { newTx, updatedTransactions } = addTransaction(transactions, studentId, amount, comment);
    setTransactions(updatedTransactions);
  };

  const handleDeleteTransaction = (id) => {
    const updatedTransactions = deleteTransaction(transactions, id);
    setTransactions(updatedTransactions);
  };

  const handleDeleteAttendance = (groupId, date, studentId = null) => {
    const updated = deleteAttendanceRecord(attendance, groupId, date, studentId);
    setAttendance(updated);
    showToast("Davomad yozuvi o'chirildi!", "info");
  };

  // Handle Tab Switch (reset selected group if navigating away from groups page)
  const handleTabChange = (tabId) => {
    // Students can only access leaderboard
    if (userRole === 'student' && tabId !== 'leaderboard') {
      return;
    }
    setActiveTab(tabId);
    if (tabId !== 'groups') {
      setSelectedGroupId(null);
    }
  };

  const handleOpenSchedule = () => {
    handleTabChange('schedule');
  };

  // Logout handler state and function
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirmModal(true);
  };

  const executeLogout = () => {
    localStorage.removeItem('rsa_authenticated');
    localStorage.removeItem('rsa_role');
    localStorage.removeItem('rsa_teacher_id');
    localStorage.removeItem('rsa_active_tab');
    sessionStorage.removeItem('rsa_active_tab');
    localStorage.removeItem('rsa_student_group_id');

    // Clear localized caches to prevent cross-teacher leakage
    localStorage.removeItem('rsa_groups');
    localStorage.removeItem('rsa_students');
    localStorage.removeItem('rsa_transactions');
    localStorage.removeItem('rsa_quick_tags');

    setGroups([]);
    setStudents([]);
    setTransactions([]);
    setQuickTags([]);
    setAllTeachersData({});

    setIsAuthenticated(false);
    setTeacherId(null);
    setStudentGroupId(null);
    setUserRole('student');
    setActiveTab('schedule');
    setLoginPassword('');
    setLoginError('');
  };

  const handleAdminRefresh = async () => {
    setIsSyncing(true);
    const allData = await loadAllTeachersFromSupabase(['teacher1', 'teacher2', 'teacher3', 'teacher4']);
    if (allData) {
      const normalized = {};
      Object.keys(allData).forEach(tId => {
        const t = allData[tId];
        normalized[tId] = {
          ...t,
          groups: (t.groups || []).map(g => ({ ...g, icon: normalizeIconUrl(g.icon) })),
          students: (t.students || []).map(s => ({ ...s, emoji: normalizeIconUrl(s.emoji) })),
          transactions: t.transactions || [],
          quickTags: normalizeQuickTags(t.quickTags),
          attendance: t.attendance || []
        };
      });
      setAllTeachersData(normalized);
      showToast("Barcha ma'lumotlar muvaffaqiyatli yangilandi!", "success");
    } else {
      showToast("Yangilashda xatolik yuz berdi. Internetni tekshiring.", "error");
    }
    setIsSyncing(false);
  };

  // Select Group Helper
  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setActiveTab('groups');
  };

  // Render Page Content
  const renderContent = () => {
    if (userRole === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <AdminDashboard
              allTeachersData={allTeachersData}
              onSelectTeacher={(tId) => {
                setSelectedAdminTeacherFilter(tId);
                setActiveTab('groups');
              }}
              setActiveTab={handleTabChange}
              onRefresh={handleAdminRefresh}
              isSyncing={isSyncing}
            />
          );
        case 'groups':
          return (
            <AdminGroups
              allTeachersData={allTeachersData}
              selectedTeacherFilter={selectedAdminTeacherFilter}
              onSelectTeacherFilter={setSelectedAdminTeacherFilter}
            />
          );
        case 'attendance':
          return (
            <AdminAttendance
              allTeachersData={allTeachersData}
              selectedTeacherFilter={selectedAdminTeacherFilter}
            />
          );
        default:
          return (
            <AdminDashboard
              allTeachersData={allTeachersData}
              onSelectTeacher={(tId) => {
                setSelectedAdminTeacherFilter(tId);
                setActiveTab('groups');
              }}
              setActiveTab={handleTabChange}
              onRefresh={handleAdminRefresh}
              isSyncing={isSyncing}
            />
          );
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={handleTabChange}
            onOpenSchedule={handleOpenSchedule}
            onSelectGroup={handleSelectGroup}
            groups={filteredGroups}
            students={filteredStudents}
            transactions={filteredTransactions}
            attendance={attendance}
          />
        );
      case 'groups':
        if (selectedGroupId) {
          const group = filteredGroups.find((g) => g.id === selectedGroupId);
          if (!group) {
            setSelectedGroupId(null);
            return null;
          }
          return (
            <GroupDetail
              group={group}
              allGroups={filteredGroups}
              students={filteredStudents}
              transactions={filteredTransactions}
              quickTags={quickTags}
              onBack={() => setSelectedGroupId(null)}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onTransferStudent={handleTransferStudent}
              onDeleteStudent={handleDeleteStudent}
              onAwardPoints={handleAwardPoints}
              onDeleteTransaction={handleDeleteTransaction}
              showToast={showToast}
              userRole={userRole}
            />
          );
        }
        return (
          <GroupsList
            groups={filteredGroups}
            students={filteredStudents}
            onSelectGroup={handleSelectGroup}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onUpdateGroupSchedule={handleUpdateGroupSchedule}
            onDeleteGroup={handleDeleteGroup}
            showToast={showToast}
            teacherId={teacherId}
          />
        );
      case 'schedule':
        return (
          <ScheduleView
            groups={filteredGroups}
            students={filteredStudents}
            onSelectGroup={handleSelectGroup}
            onUpdateGroupSchedule={handleUpdateGroupSchedule}
            showToast={showToast}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard
            groups={filteredGroups}
            students={filteredStudents}
            transactions={filteredTransactions}
            allActiveGroups={allActiveGroups}
            allActiveStudents={allActiveStudents}
            allActiveTransactions={allActiveTransactions}
            userRole={userRole}
            onDeleteTransaction={handleDeleteTransaction}
            showToast={showToast}
          />
        );
      case 'attendance':
        return (
          <Attendance
            groups={filteredGroups}
            students={filteredStudents}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            onDeleteAttendance={handleDeleteAttendance}
            showToast={showToast}
          />
        );
      case 'settings':
        return (
          <Settings
            quickTags={quickTags}
            setQuickTags={setQuickTags}
            onImportDatabase={handleImportDatabase}
            onResetDatabase={handleResetDatabase}
            showToast={showToast}
            groups={groups}
            students={students}
            transactions={transactions}
            attendance={attendance}
            onRestoreGroup={handleRestoreGroup}
            onRestoreStudent={handleRestoreStudent}
            onPermanentlyDeleteGroup={handlePermanentlyDeleteGroup}
            onPermanentlyDeleteStudent={handlePermanentlyDeleteStudent}
            snapshots={snapshots}
            onRollback={handleRollback}
            userRole={userRole}
            onLogout={handleLogout}
            syncStatus={syncStatus}
            isSyncing={isSyncing}
            theme={theme}
            setTheme={handleSetTheme}
          />
        );
      default:
        return (
          <ScheduleView
            groups={filteredGroups}
            students={filteredStudents}
            onSelectGroup={handleSelectGroup}
            onUpdateGroupSchedule={handleUpdateGroupSchedule}
            showToast={showToast}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="unauthenticated-root" style={{ width: '100%', minHeight: '100vh' }}>
        {authView === 'landing' ? (
          <LandingPage
            onNavigateToLogin={() => setAuthView('login')}
          />
        ) : (
          <LoginPage
            handleLoginSubmit={handleLoginSubmit}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            loginError={loginError}
            loginLoading={loginLoading}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showToast={showToast}
            onBackToLanding={() => setAuthView('landing')}
          />
        )}

        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type}`}>
              <span className="toast-icon">
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="toast-message">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show Connection Error Screen if startup database load failed and we have no cached data
  if (connectionError) {
    return (
      <div className="full-screen-loader" style={{ flexDirection: 'column', gap: '20px', padding: '24px' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h3 style={{ margin: 0, color: '#ff3b30', textAlign: 'center', fontFamily: 'var(--font-family)', fontWeight: '800' }}>Internetga ulanishda xatolik!</h3>
        <p style={{ margin: 0, opacity: 0.8, maxWidth: '320px', textAlign: 'center', fontSize: '0.9rem', fontFamily: 'var(--font-family)', lineHeight: '1.4' }}>
          Ma'lumotlarni yuklab bo'lmadi. Internet aloqasini tekshiring va qayta urinib ko'ring.
        </p>
        <button
          className="btn btn-primary scale-active"
          onClick={() => {
            setConnectionError(false);
            setIsLoaded(false);
            setReloadTrigger(prev => prev + 1);
          }}
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // Show full screen loading animation if authenticated but database load is in progress and cache is empty
  const isInitialLoading = isAuthenticated && !isLoaded && groups.length === 0 && Object.keys(allTeachersData).length === 0;

  if (isInitialLoading) {
    return (
      <div className="full-screen-loader">
        <div className="loader-spinner"></div>
        <p className="loader-text">Hozir, Шесть секунд</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} userRole={userRole} onLogout={handleLogout} syncStatus={syncStatus} isSyncing={isSyncing} theme={theme} toggleTheme={toggleTheme} />

      {/* Main Panel Content */}
      <main className="main-content">
        <div key={activeTab} className="page-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Toast Notification Popups */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Logout Confirmation Warning Modal */}
      {showLogoutConfirmModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowLogoutConfirmModal(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px' }}>
              Chiqishni tasdiqlash
            </h3>
            <p className="modal-warning-text" style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Rostdan ham tizimdan chiqmoqchimisiz?
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary scale-active" onClick={() => setShowLogoutConfirmModal(false)}>
                Bekor qilish
              </button>
              <button
                className="btn btn-danger scale-active"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  executeLogout();
                }}
              >
                Ha, chiqilsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default App;
