import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import Attendance from './components/Attendance';
import {
  loadFromSupabase as loadFromFirestore,
  saveToSupabase as saveToFirestore,
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
  restoreGroup,
  restoreStudent,
  permanentlyDeleteGroup,
  permanentlyDeleteStudent,
  exportDatabase,
  importDatabase
} from './utils/db';
import { normalizeIconUrl } from './utils/avatarGallery';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedRole = localStorage.getItem('rsa_role');
    const isStudent = savedRole === 'student';
    const savedTab = localStorage.getItem('rsa_active_tab') || 'groups';
    // Students can only access leaderboard and history
    if (isStudent && savedTab !== 'leaderboard' && savedTab !== 'history') {
      return 'leaderboard';
    }
    return savedTab;
  });
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    const saved = localStorage.getItem('rsa_selected_group_id');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
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
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

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
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = theme === 'dark' ? '#202124' : '#F5F5F7';
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('rsa_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyThemeInstantly(nextTheme);
  }, [theme, applyThemeInstantly]);

  const handleSetTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      applyThemeInstantly(newTheme);
    }
  }, [applyThemeInstantly]);

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
  const [showWeeklyBackupBanner, setShowWeeklyBackupBanner] = useState(false);
  
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isLoginStyleReady, setIsLoginStyleReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    const timer = setTimeout(() => {
      setIsLoginStyleReady(true);
    }, 120);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPassword) {
      setLoginError("Parolni kiriting!");
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    const CREDENTIALS = {
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
      } else {
        setActiveTab('groups');
      }
      showToast("Muvaffaqiyatli kirdingiz!", "success");
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

  // Weekly Backup Banner effect (Check if a week has passed since last backup download)
  useEffect(() => {
    if (isAuthenticated && userRole === 'teacher') {
      const lastPrompt = localStorage.getItem('rsa_last_backup_prompt_date');
      const now = Date.now();
      if (!lastPrompt) {
        localStorage.setItem('rsa_last_backup_prompt_date', String(now));
      } else {
        const daysPassed = (now - Number(lastPrompt)) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 7) {
          setShowWeeklyBackupBanner(true);
        }
      }
    } else {
      setShowWeeklyBackupBanner(false);
    }
  }, [isAuthenticated, userRole]);

  // Load database from Supabase when authenticated and teacherId is ready
  useEffect(() => {
    if (!isAuthenticated || !teacherId) {
      setIsLoaded(false);
      return;
    }
    const load = async () => {
      setIsSyncing(true);
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
        const loadedAttendance = data.attendance || [];

        setGroups(loadedGroups);
        setStudents(loadedStudents);
        setTransactions(loadedTransactions);
        setQuickTags(loadedQuickTags);
        setAttendance(loadedAttendance);

        // Update the ref so we don't accidentally re-save on mount
        const dbState = {
          groups: loadedGroups,
          students: loadedStudents,
          transactions: loadedTransactions,
          quickTags: loadedQuickTags,
          attendance: loadedAttendance
        };
        lastSavedDataRef.current = JSON.stringify(dbState);

        // Cache fresh cloud data to local storage for offline protection
        try {
          if (loadedGroups.length > 0 || loadedStudents.length > 0) {
            localStorage.setItem(`rsa_local_backup_${teacherId}`, JSON.stringify(dbState));
          }
        } catch (_) {}

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

  // Natural sorting function for group names (e.g. G1, G2, G3, G4, G10...)
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
    if (userRole === 'student') return;

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





  // Trigger a background download of the JSON database
  const triggerSilentBackupDownload = () => {
    try {
      const dataStr = exportDatabase(groups, students, transactions, quickTags, attendance);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFileDefaultName = `rate_student_auto_backup_${timestamp}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      console.log('[Auto Backup] Silent backup downloaded successfully.');
    } catch (err) {
      console.error('[Auto Backup] Failed to trigger silent download:', err);
    }
  };

  const handleTriggerManualBackup = () => {
    try {
      const dataStr = exportDatabase(groups, students, transactions, quickTags, attendance);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const timestamp = new Date().toISOString().slice(0, 10);
      const exportFileDefaultName = `rate_student_weekly_backup_${timestamp}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      localStorage.setItem('rsa_last_backup_prompt_date', String(Date.now()));
      setShowWeeklyBackupBanner(false);
      showToast("Zaxira nusxasi yuklab olindi!", "success");
    } catch (e) {
      showToast("Zaxiralashda xatolik yuz berdi: " + e.message, "error");
    }
  };

  const handleResetDatabase = async () => {
    triggerSilentBackupDownload(); // backup first
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
        setAttendance(db.attendance || []);
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
    const { updatedRecord, updatedAttendance } = saveAttendance(attendance, groupId, date, records);
    setAttendance(updatedAttendance);
    return updatedRecord;
  };

  const handleAddGroup = async (name, icon, password, color) => {
    const cleanPwd = password.trim().toLowerCase();
    const { newGroup, updatedGroups } = addGroup(groups, name, icon, cleanPwd, color);
    
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
    triggerSilentBackupDownload(); // auto-save JSON download before deletion
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

  const handleUpdateStudent = (id, name, emoji, color) => {
    const { updatedStudent, updatedStudents } = updateStudent(students, id, name, emoji, color);
    setStudents(updatedStudents);
  };

  const handleDeleteStudent = (id) => {
    triggerSilentBackupDownload(); // auto-save JSON download before deletion
    const { updatedStudents, updatedTransactions } = deleteStudent(students, transactions, id);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
  };

  const handleUpdateGroup = async (id, name, icon, password, color) => {
    const group = groups.find((g) => g.id === id);
    const oldPassword = group ? group.password : '';
    const cleanNewPassword = password.trim().toLowerCase();

    if (cleanNewPassword !== oldPassword) {
      const success = await registerGroupPassword(cleanNewPassword, teacherId, id);
      if (!success) {
        showToast("Ushbu parol band qilingan. Boshqa parol kiriting!", "error");
        return false;
      }
      if (oldPassword) {
        await deregisterGroupPassword(oldPassword);
      }
    }

    const { updatedGroup, updatedGroups } = updateGroup(groups, id, name, icon, cleanNewPassword, color);
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
    triggerSilentBackupDownload(); // backup before permanent wipeout
    const { updatedGroups, updatedStudents, updatedTransactions } = permanentlyDeleteGroup(groups, students, transactions, id);
    setGroups(updatedGroups);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    showToast("Guruh butunlay o'chirildi!", "info");
  };

  const handlePermanentlyDeleteStudent = (id) => {
    triggerSilentBackupDownload(); // backup before permanent wipeout
    const { updatedStudents, updatedTransactions } = permanentlyDeleteStudent(students, transactions, id);
    setStudents(updatedStudents);
    setTransactions(updatedTransactions);
    showToast("O'quvchi butunlay o'chirildi!", "info");
  };

  // Rollback database snapshot handler
  const handleRollback = async (snapshotData) => {
    if (!snapshotData || !teacherId) return;
    triggerSilentBackupDownload(); // backup current state first
    setIsSyncing(true);

    const success = await saveToFirestore(teacherId, snapshotData);
    if (success) {
      setGroups(snapshotData.groups || []);
      setStudents(snapshotData.students || []);
      setTransactions(snapshotData.transactions || []);
      setQuickTags(snapshotData.quickTags || []);
      setAttendance(snapshotData.attendance || []);
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
    
    setIsAuthenticated(false);
    setTeacherId(null);
    setStudentGroupId(null);
    setUserRole('student');
    setActiveTab('dashboard');
    setLoginPassword('');
    setLoginError('');
  };

  // Select Group Helper
  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setActiveTab('groups');
  };

  // Render Page Content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={handleTabChange} onSelectGroup={handleSelectGroup} groups={filteredGroups} students={filteredStudents} transactions={filteredTransactions} attendance={attendance} />;
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
              students={filteredStudents}
              transactions={filteredTransactions}
              quickTags={quickTags}
              onBack={() => setSelectedGroupId(null)}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
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
            onDeleteGroup={handleDeleteGroup}
            showToast={showToast}
            teacherId={teacherId}
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
            triggerSilentBackupDownload={triggerSilentBackupDownload}
            userRole={userRole}
            onLogout={handleLogout}
            syncStatus={syncStatus}
            isSyncing={isSyncing}
            theme={theme}
            setTheme={handleSetTheme}
          />
        );
      default:
        return <Dashboard setActiveTab={handleTabChange} onSelectGroup={handleSelectGroup} groups={filteredGroups} students={filteredStudents} transactions={filteredTransactions} attendance={attendance} />;
    }
  };

  if (!isAuthenticated) {
    if (!isLoginStyleReady) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--bg-primary)',
          zIndex: 99999
        }} />
      );
    }

    return (
      <div 
        className="login-page-apple min-h-screen flex flex-col justify-between w-full"
        style={{
          opacity: isLoginStyleReady ? 1 : 0,
          transition: 'opacity 0.2s ease-in'
        }}
      >
        {/* Top Header */}
        <header className="landing-header glass" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="landing-header-inner max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-10 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight select-none flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                EPCHIL <span className="logo-badge">ROBOT</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-secondary scale-active theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Mavzuni o'zgartirish"
              >
                {theme === 'dark' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <span className="badge">V2.0.0</span>
            </div>
          </div>
        </header>

        {/* Full-Height Split Screen Container */}
        <main className="landing-main-split flex-grow flex flex-col lg:flex-row w-full">
          
          {/* Left Section: Value Story (70%) */}
          <section className="landing-left-panel w-full lg:w-[70%] flex flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-16 order-2 lg:order-1">
            <div className="w-full max-w-3xl mx-auto lg:mx-0">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                Bilim olishlarini <br className="hidden sm:inline"/>
                <span style={{ color: 'var(--apple-blue)' }}>"Like"</span> bilan taqdirlang!
              </h2>
              
              <p className="text-sm sm:text-base mb-8 font-normal leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                O'quvchilaringizning darsdagi faolligini rag'batlantiring va sog'lom raqobat muhitini shakllantiring.
              </p>
              
              {/* Features List (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="landing-feature-card p-4 rounded-2xl">
                  <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Faol ta'lim tizimi</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Har bir darsda faol qatnashing va ustozingizdan qimmatli dars "Like"larini qo'lga kiriting.</p>
                </div>
                
                <div className="landing-feature-card p-4 rounded-2xl">
                  <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Oylik va umumiy reyting</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Eng ko'p Like to'plagan g'oliblar qatoridan joy oling va maxsus sovg'alarga ega bo'ling.</p>
                </div>
                
                <div className="landing-feature-card p-4 rounded-2xl">
                  <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Hamjihat guruh raqobati</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>O'z guruhingiz a'zolari bilan birlashing va boshqa guruhlar orasida peshqadam bo'ling!</p>
                </div>

                <div className="landing-feature-card p-4 rounded-2xl">
                  <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Shaffof davomad tizimi</h3>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Har bir darsdagi ishtirok, qatnashuv va davomad hisobini muntazam ravishda aniq kuzatib boring.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Section: Login Form (30% - Full Height White Panel with Border) */}
          <section className="landing-right-panel w-full lg:w-[30%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-8 xl:p-10 order-1 lg:order-2">
            <div className="w-full max-w-sm my-auto">
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Tizimga kirish</h2>
                <p className="text-xs font-medium mt-1.5" style={{ color: 'var(--text-secondary)' }}>Davom etish uchun parolni kiriting</p>
              </div>
              
              {/* Form Action */}
              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label 
                    htmlFor="passwordField" 
                    className="form-label"
                  >
                    Parol
                  </label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      id="passwordField" 
                      placeholder="Parolni kiriting..." 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="form-input password-input"
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="password-toggle-btn"
                      aria-label="Parolni ko'rsatish"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {loginError && <p className="login-error-text">{loginError}</p>}

                <button 
                  type="submit" 
                  disabled={loginLoading}
                  className="btn btn-primary login-btn scale-active"
                >
                  <span>{loginLoading ? "Tekshirilmoqda..." : "Kirish"}</span>
                </button>
              </form>
              
              {/* Support info */}
              <div className="landing-support-divider mt-8 pt-6 flex flex-col items-center gap-3">
                <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                  Tizimga kirishda muammo bormi? Admin bilan bog'laning:
                </p>
                <div className="flex gap-2">
                  <a href="https://t.me/bkzd19" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    Telegram
                  </a>
                  <a href="https://instagram.com/1bkzd" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom Technical Footer */}
        <footer className="landing-footer px-6 py-4 flex justify-center items-center text-xs glass">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span>© 2026 EPCHIL ROBOT</span>
          </div>
        </footer>

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
  const isInitialLoading = isAuthenticated && !isLoaded && groups.length === 0;

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
      {showWeeklyBackupBanner && (
        <div className="weekly-backup-banner animate-slide-down glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '14px 24px', zIndex: 9999, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            <span>⚠️</span>
            <span><strong>Zaxira eslatmasi:</strong> Ma'lumotlaringiz yo'qolib ketmasligi uchun zaxira nusxasini (Backup JSON) yuklab olishni tavsiya qilamiz.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary scale-active btn-sm" onClick={handleTriggerManualBackup}>
              Yuklab olish
            </button>
            <button className="btn btn-secondary scale-active btn-sm" onClick={() => {
              localStorage.setItem('rsa_last_backup_prompt_date', String(Date.now()));
              setShowWeeklyBackupBanner(false);
            }}>
              Keyinroq
            </button>
          </div>
        </div>
      )}

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
