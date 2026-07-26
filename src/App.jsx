import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import Leaderboard from './components/Leaderboard';
import History from './components/History';
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
  saveAttendance,
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

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedRole = localStorage.getItem('rsa_role');
    const isStudent = savedRole === 'student';
    const savedTab = localStorage.getItem('rsa_active_tab') || 'dashboard';
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
      'ozimsila': { role: 'teacher', teacherId: 'teacher1' }, // backward compatibility

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
        setActiveTab('dashboard');
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

  // Sync state
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

  // Load database from Firestore when authenticated and teacherId is ready
  useEffect(() => {
    if (!isAuthenticated || !teacherId) {
      setIsLoaded(false);
      return;
    }
    const load = async () => {
      setIsSyncing(true);
      let data = await loadFromFirestore(teacherId);

      // Check for local backup if network load is empty or failed
      const localBackupStr = localStorage.getItem(`rsa_local_backup_${teacherId}`);
      if (localBackupStr) {
        try {
          const localBackup = JSON.parse(localBackupStr);
          const localHasContent = (localBackup.groups && localBackup.groups.length > 0) || (localBackup.students && localBackup.students.length > 0);
          const cloudIsEmpty = !data || ((!data.groups || data.groups.length === 0) && (!data.students || data.students.length === 0));

          if (cloudIsEmpty && localHasContent) {
            console.warn('[Offline Backup] Restored data from localStorage backup!');
            data = localBackup;
            showToast("Ma'lumotlar qurilmaning ichki xotirasidan tiklandi!", "info");
          }
        } catch (_err) {
          // ignore parse error
        }
      }

      if (data) {
        const loadedGroups = data.groups || [];
        const loadedStudents = data.students || [];
        const loadedTransactions = data.transactions || [];
        const loadedQuickTags = data.quickTags || DEFAULT_QUICK_TAGS;
        const loadedAttendance = data.attendance || [];

        setGroups(loadedGroups);
        setStudents(loadedStudents);
        setTransactions(loadedTransactions);
        setQuickTags(loadedQuickTags);
        setAttendance(loadedAttendance);

        // Update the ref so we don't save this back to Supabase
        const dbState = {
          groups: loadedGroups,
          students: loadedStudents,
          transactions: loadedTransactions,
          quickTags: loadedQuickTags,
          attendance: loadedAttendance
        };
        lastSavedDataRef.current = JSON.stringify(dbState);

        setIsLoaded(true);
        setConnectionError(false);
      } else {
        // Load failed due to network / database error
        console.error('[Supabase] Load failed on startup.');
        setSyncStatus('offline');
        setConnectionError(true);
        setIsLoaded(false);
      }

      // Load snapshots for rollback points (Teachers only)
      if (userRole === 'teacher') {
        const history = await loadSnapshotsFromFirestore(teacherId);
        setSnapshots(history);
      }

      setIsSyncing(false);
    };
    load();
  }, [isAuthenticated, teacherId, userRole, reloadTrigger]);

  // Filter states to exclude soft-deleted items, and enforce student group-level isolation
  const filteredGroups = useMemo(() => {
    const activeGroups = groups.filter(g => !g.deleted);
    if (userRole === 'student' && studentGroupId) {
      return activeGroups.filter(g => g.id === studentGroupId);
    }
    return activeGroups;
  }, [groups, userRole, studentGroupId]);

  const filteredStudents = useMemo(() => {
    const activeStudents = students.filter(s => !s.deleted);
    if (userRole === 'student' && studentGroupId) {
      return activeStudents.filter(s => s.groupId === studentGroupId);
    }
    return activeStudents;
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
  // Used for Top 3 groups widget in Sidebar — students should see ALL teacher groups
  const allActiveGroups = useMemo(() => groups.filter(g => !g.deleted), [groups]);
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

  // Handle mobile visual viewport changes (fixes virtual keyboard overlays / pans)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      // pageTop handles scrolled document position + offset
      const top = vv.pageTop !== undefined ? vv.pageTop : (vv.offsetTop + window.scrollY);
      const left = vv.pageLeft !== undefined ? vv.pageLeft : (vv.offsetLeft + window.scrollX);
      const height = vv.height;
      const width = vv.width;

      document.documentElement.style.setProperty('--viewport-top', `${top}px`);
      document.documentElement.style.setProperty('--viewport-left', `${left}px`);
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--viewport-width', `${width}px`);
    };

    // Initial call
    handleViewportChange();

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Like particles generator for Login screen
  useEffect(() => {
    if (isAuthenticated) return;

    const container = document.getElementById("like-particles-container");
    if (!container) return;

    const particleCount = window.innerWidth < 768 ? 5 : 10;
    const textOptions = ["+1 Like", "👍", "Epchil", "🔥", "ZO'R"];
    const colors = ["#DFFF00", "#FFFFFF"];
    const particles = [];
    let animationFrameId;

    function createParticle(isInitial = false) {
      const el = document.createElement("div");
      el.className = "floating-brutal-like select-none opacity-0 transition-opacity duration-500";
      
      el.innerText = textOptions[Math.floor(Math.random() * textOptions.length)];
      const randomBg = colors[Math.floor(Math.random() * colors.length)];
      el.style.backgroundColor = randomBg;
      if (randomBg === "#DFFF00") {
        el.style.color = "#000000";
      }

      const x = Math.random() * 100;
      const y = isInitial ? (Math.random() * 85 + 5) : 105;
      
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      
      container.appendChild(el);

      setTimeout(() => { el.style.opacity = "1"; }, 50);

      const pData = {
        element: el,
        x: x,
        y: y,
        speed: 0.08 + Math.random() * 0.12,
        angle: (Math.random() - 0.5) * 0.15,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.5,
        scale: 0.85 + Math.random() * 0.3
      };

      particles.push(pData);
    }

    for (let i = 0; i < particleCount; i++) {
      createParticle(true);
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y -= p.speed;
        p.x += p.angle;
        p.rot += p.rotSpeed;

        if (p.x < -15 || p.x > 115 || p.y < -15) {
          p.element.remove();
          particles.splice(i, 1);
          createParticle(false);
          continue;
        }

        p.element.style.top = `${p.y}%`;
        p.element.style.left = `${p.x}%`;
        p.element.style.transform = `translate3d(0,0,0) translate(-50%, -50%) rotate(${p.rot}deg) scale(${p.scale})`;
      }
      animationFrameId = requestAnimationFrame(updateParticles);
    }

    animationFrameId = requestAnimationFrame(updateParticles);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isAuthenticated, isLoginStyleReady]);

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
      showToast("Haftalik zaxira nusxasi yuklab olindi!", "success");
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
    showToast("Davomad muvaffaqiyatli saqlandi!", "success");
    return updatedRecord;
  };

  const handleAddGroup = async (name, icon, password) => {
    const cleanPwd = password.trim().toLowerCase();
    const { newGroup, updatedGroups } = addGroup(groups, name, icon, cleanPwd);
    
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

  const handleUpdateGroup = async (id, name, icon, password) => {
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

    const { updatedGroup, updatedGroups } = updateGroup(groups, id, name, icon, cleanNewPassword);
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

  // Handle Tab Switch (reset selected group if navigating away from groups page)
  const handleTabChange = (tabId) => {
    // Students can only access leaderboard and history
    if (userRole === 'student' && tabId !== 'leaderboard' && tabId !== 'history') {
      return;
    }
    setActiveTab(tabId);
    if (tabId !== 'groups') {
      setSelectedGroupId(null);
    }
  };

  // Logout handler
  const handleLogout = () => {
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
        return <Dashboard setActiveTab={handleTabChange} onSelectGroup={handleSelectGroup} groups={filteredGroups} students={filteredStudents} transactions={filteredTransactions} />;
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
      case 'history':
        return (
          <History
            groups={filteredGroups}
            students={filteredStudents}
            transactions={filteredTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            showToast={showToast}
            userRole={userRole}
          />
        );
      case 'attendance':
        return (
          <Attendance
            groups={filteredGroups}
            students={filteredStudents}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            showToast={showToast}
            mode="mark"
          />
        );
      case 'attendanceStats':
        return (
          <Attendance
            groups={filteredGroups}
            students={filteredStudents}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            showToast={showToast}
            mode="stats"
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
          />
        );
      default:
        return <Dashboard setActiveTab={handleTabChange} onSelectGroup={handleSelectGroup} groups={filteredGroups} students={filteredStudents} transactions={filteredTransactions} />;
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
          backgroundColor: '#FFFFFF',
          zIndex: 99999
        }} />
      );
    }

    return (
      <div 
        className="bg-stark-white text-deep-void font-sans antialiased min-h-screen flex flex-col justify-between w-full"
        style={{
          opacity: isLoginStyleReady ? 1 : 0,
          transition: 'opacity 0.15s ease-in'
        }}
      >
        {/* Top Floating Header */}
        <header className="login-header-brutal w-full bg-stark-white border-b-2 border-deep-void px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase select-none">
              EPCHIL <span className="text-deep-void bg-cyber-yellow px-2 py-0.5 border border-deep-void">ROBOT</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-xs bg-muted-gray border-2 border-deep-void px-2.5 py-1 uppercase tracking-wider rounded-none">V1.0.0</span>
          </div>
        </header>

        {/* Main Layout Container */}
        <main className="login-main-brutal flex-grow flex flex-col lg:flex-row relative">
          
          {/* Left Section: Educational Story */}
          <section className="login-left-brutal w-full lg:w-1/2 bg-cyber-yellow border-b-2 lg:border-b-0 lg:border-r-2 border-deep-void flex flex-col justify-center p-6 sm:p-12 md:p-16 relative overflow-hidden min-h-[450px] lg:min-h-0">
            {/* Atmospheric Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none custom-pattern"></div>
            
            <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
              <span className="inline-block bg-deep-void text-stark-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 rounded-none">
                LIKE TIZIMI MAQSADI
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-none tracking-tight mb-6">
                BILIM OLISHLARINI <br className="hidden sm:inline"/>
                <span className="bg-stark-white text-deep-void px-2 border-2 border-deep-void inline-block my-1">"LIKE"</span> BILAN <br className="hidden sm:inline"/>
                TAQDIRLANG!
              </h2>
              
              <div className="w-16 h-1 bg-deep-void mb-8"></div>
              
              {/* Features List */}
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 flex-shrink-0 bg-stark-white border-2 border-deep-void hard-shadow flex items-center justify-center transition-transform group-hover:scale-105 rounded-none">
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-1">FAOL TA'LIM TIZIMI</h3>
                    <p className="text-sm md:text-base opacity-90 font-medium">Har bir darsda faol qatnashing va ustozingizdan qimmatli dars "Like"larini qo'lga kiriting.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 flex-shrink-0 bg-stark-white border-2 border-deep-void hard-shadow flex items-center justify-center transition-transform group-hover:scale-105 rounded-none">
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-1">HAFTALIK VA OYLIK REYTING</h3>
                    <p className="text-sm md:text-base opacity-90 font-medium">Eng ko'p Like to'plagan g'oliblar qatoridan joy oling va maxsus sovg'alarga ega bo'ling.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 flex-shrink-0 bg-stark-white border-2 border-deep-void hard-shadow flex items-center justify-center transition-transform group-hover:scale-105 rounded-none">
                    <span className="material-symbols-outlined text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight mb-1">HAMJIHAT GURUH RAQOBATI</h3>
                    <p className="text-sm md:text-base opacity-90 font-medium">O'z guruhingiz a'zolari bilan birlashing va boshqa guruhlar orasida peshqadam bo'ling!</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex items-center gap-4 opacity-30">
                <span className="material-symbols-outlined text-3xl">precision_manufacturing</span>
                <span className="material-symbols-outlined text-3xl">smart_toy</span>
                <span className="material-symbols-outlined text-3xl">settings_input_component</span>
              </div>
            </div>
          </section>
          
          {/* Right Section: Login Form Box with Interactive Particles Background */}
          <section className="login-right-brutal w-full lg:w-1/2 bg-muted-gray flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 relative">
            
            {/* Dynamic Like Particles Engine Cover Layer */}
            <div id="like-particles-container"></div>
            
            <div className="w-full max-w-md my-auto relative z-10">
              {/* Brutalist Login Box Card */}
              <div className="login-card-brutal bg-stark-white border-2 border-deep-void p-6 sm:p-10 relative overflow-hidden hard-shadow-lg rounded-none">
                
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-deep-void bg-cyber-yellow mb-4 rounded-none">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-deep-void">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-extrabold uppercase tracking-tight">TIZIMGA KIRISH</h2>
                  <p className="text-xs font-bold tracking-wider opacity-60 mt-1 uppercase">Davom etish uchun parolni kiriting</p>
                </div>
                
                {/* Form Action */}
                <form className="space-y-6" onSubmit={handleLoginSubmit}>
                  <div className="relative input-group">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      id="passwordField" 
                      placeholder=" " 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="login-input-brutal w-full h-14 bg-stark-white border-2 border-deep-void px-4 pr-12 rounded-none focus:ring-0 focus:outline-none input-focus-effect font-mono tracking-widest text-lg transition-all"
                      autoFocus
                    />
                    <label 
                      htmlFor="passwordField" 
                      className="absolute left-4 top-4 text-xs font-bold uppercase tracking-wider text-deep-void opacity-70 transition-all pointer-events-none origin-left"
                    >
                      PAROL
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-4 text-deep-void opacity-75 hover:opacity-100 transition-opacity focus:outline-none flex items-center justify-center"
                      title="Parolni ko'rsatish/yashirish"
                      style={{ height: '24px', width: '24px' }}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {loginError && <p className="text-red-600 text-xs font-bold uppercase tracking-wider" style={{ marginTop: '8px' }}>{loginError}</p>}

                  <button 
                    type="submit" 
                    disabled={loginLoading}
                    className="login-btn-brutal w-full h-14 bg-deep-void text-stark-white font-bold text-sm md:text-base border-2 border-cyber-yellow uppercase tracking-widest transition-all hard-shadow-btn flex items-center justify-center gap-2 rounded-none group"
                  >
                    <span>{loginLoading ? "TEKSHIRILMOQDA..." : "KIRISH"}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-yellow group-hover:translate-x-1 transition-transform">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-300">
                    <div className="flex gap-1.5" aria-hidden="true">
                      <div className="w-2 h-2 bg-cyber-yellow border border-deep-void"></div>
                      <div className="w-2 h-2 bg-deep-void"></div>
                      <div className="w-2 h-2 bg-cyber-yellow border border-deep-void"></div>
                    </div>
                  </div>
                </form>
                
                <div className="absolute -bottom-8 -right-8 opacity-5 pointer-events-none rotate-12 select-none">
                  <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'wght' 200" }}>settings</span>
                </div>
              </div>
              
              {/* Support Center Information */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="text-xs font-medium text-center text-gray-600 max-w-xs leading-relaxed">
                  Tizimga kirishda muammo bormi? <br/> Admin bilan bog'laning.
                </p>
                <div className="flex gap-3">
                  <a href="https://t.me/bkzd19" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-deep-void bg-stark-white hard-shadow-btn transition-all rounded-none flex items-center justify-center" title="Telegram">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </a>
                  <a href="https://instagram.com/1bkzd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-deep-void bg-stark-white hard-shadow-btn transition-all rounded-none flex items-center justify-center" title="Instagram">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="0"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </a>
                </div>
              </div>
              
            </div>
          </section>
        </main>

        {/* Bottom System Technical Footer */}
        <footer className="bg-deep-void text-stark-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-[11px] font-bold uppercase tracking-widest gap-2 sm:gap-0 border-t-2 border-deep-void">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <span>© 2026 EPCHIL ROBOT</span>
            <span className="hidden sm:block opacity-30">|</span>
            <a href="https://t.me/bkzd19" target="_blank" rel="noopener noreferrer" className="text-cyber-yellow hover:text-stark-white lowercase transition-colors">Made with 🥷🏻 by bkzd19</a>
          </div>
          <div className="flex items-center gap-2 text-cyber-yellow bg-zinc-900 px-2.5 py-1 border border-zinc-800 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-yellow animate-ping"></span>
            TIZIM FAOLLIGI: A'LO
          </div>
        </footer>

        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type} glass`}>
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
          style={{ background: '#000', color: '#fff', border: '1px solid #000', padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-family)' }}
        >
          QAYTA URINISH
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
        <div className="weekly-backup-banner animate-slide-down" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#E7FF56', borderBottom: '2px solid #000000', padding: '12px 24px', zIndex: 9999, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-family)' }}>
          <div style={{ color: '#000000', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <span>⚠️</span>
            <span><strong>Haftalik eslatma:</strong> Ma'lumotlaringiz yo'qolib ketmasligi uchun zaxira nusxasini (Backup JSON) yuklab olishni tavsiya qilamiz.</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary scale-active btn-sm" onClick={handleTriggerManualBackup} style={{ background: '#000000', color: '#ffffff', border: '1px solid #000000', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              Yuklab olish
            </button>
            <button className="btn btn-secondary scale-active btn-sm" onClick={() => {
              localStorage.setItem('rsa_last_backup_prompt_date', String(Date.now()));
              setShowWeeklyBackupBanner(false);
            }} style={{ background: 'transparent', color: '#000000', border: '1px solid #000000', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              Keyinroq
            </button>
          </div>
        </div>
      )}
      {/* Dynamic Ambient Background Glows */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} userRole={userRole} onLogout={handleLogout} groups={allActiveGroups} students={allActiveStudents} transactions={allActiveTransactions} />

      {/* Main Panel Content */}
      <main className="main-content">
        <div className="header-status-bar" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 12px 24px', gap: '12px', alignItems: 'center' }}>
          {userRole === 'teacher' && (
            <div className={`sync-badge sync-status-${syncStatus}`} style={{ fontSize: '0.8rem', padding: '4px 10px', border: '1px solid #000', background: syncStatus === 'saved' ? '#E7FF56' : syncStatus === 'saving' ? '#fff' : '#ff3b30', color: syncStatus === 'offline' ? '#fff' : '#000', fontWeight: 'bold' }}>
              {syncStatus === 'saved' ? '☁️ Saqlandi' : syncStatus === 'saving' ? '⏳ Saqlanmoqda...' : '⚠️ Oflayn rejim'}
            </div>
          )}
          {isSyncing && (
            <div className="sync-indicator" style={{ margin: 0 }}>
              <span className="sync-dot"></span>
              Yuklanmoqda...
            </div>
          )}
        </div>
        <div key={activeTab} className="page-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Toast Notification Popups */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type} glass`}>
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

export default App;
