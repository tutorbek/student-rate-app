import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import Leaderboard from './components/Leaderboard';
import History from './components/History';
import Settings from './components/Settings';
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPassword) {
      setLoginError("Parolni kiriting!");
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    const CREDENTIALS = {
      // Teacher 1 (User)
      'insight': { role: 'teacher', teacherId: 'teacher1' },
      'ozimsila': { role: 'teacher', teacherId: 'teacher1' }, // backward compatibility
      'studentman': { role: 'student', teacherId: 'teacher1' },

      // Teacher 2
      'quyosh': { role: 'teacher', teacherId: 'teacher2' },
      'salombro': { role: 'student', teacherId: 'teacher2' },

      // Teacher 3
      'hehehe': { role: 'teacher', teacherId: 'teacher3' },
      'menman': { role: 'student', teacherId: 'teacher3' },

      // Teacher 4
      'simsim': { role: 'teacher', teacherId: 'teacher4' },
      'nimagap': { role: 'student', teacherId: 'teacher4' },
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
      const data = await loadFromFirestore(teacherId);
      if (data) {
        const loadedGroups = data.groups || [];
        const loadedStudents = data.students || [];
        const loadedTransactions = data.transactions || [];
        const loadedQuickTags = data.quickTags || DEFAULT_QUICK_TAGS;

        setGroups(loadedGroups);
        setStudents(loadedStudents);
        setTransactions(loadedTransactions);
        setQuickTags(loadedQuickTags);

        // Update the ref so we don't save this back to Supabase
        const dbState = {
          groups: loadedGroups,
          students: loadedStudents,
          transactions: loadedTransactions,
          quickTags: loadedQuickTags
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

  // Debounced Save to Firestore whenever state changes (Teachers only!)
  useEffect(() => {
    if (!isLoaded || !isAuthenticated || !teacherId) return;
    if (userRole === 'student') return;

    const db = { groups, students, transactions, quickTags };
    const dbStr = JSON.stringify(db);

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
  }, [groups, students, transactions, quickTags, isLoaded, isAuthenticated, teacherId, userRole]);

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

  // Trigger a background download of the JSON database
  const triggerSilentBackupDownload = () => {
    try {
      const dataStr = exportDatabase();
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
      const dataStr = exportDatabase();
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
      quickTags: DEFAULT_QUICK_TAGS
    };
    const success = await saveToFirestore(teacherId, defaultDb);
    if (success) {
      setGroups([]);
      setStudents([]);
      setTransactions([]);
      setQuickTags(DEFAULT_QUICK_TAGS);
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
            onRestoreGroup={handleRestoreGroup}
            onRestoreStudent={handleRestoreStudent}
            onPermanentlyDeleteGroup={handlePermanentlyDeleteGroup}
            onPermanentlyDeleteStudent={handlePermanentlyDeleteStudent}
            snapshots={snapshots}
            onRollback={handleRollback}
            triggerSilentBackupDownload={triggerSilentBackupDownload}
          />
        );
      default:
        return <Dashboard setActiveTab={handleTabChange} onSelectGroup={handleSelectGroup} groups={filteredGroups} students={filteredStudents} transactions={filteredTransactions} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-card glass">
          <h2 className="login-title">epchil  robot</h2>
          <p className="login-subtitle">Tizimga kirish uchun parolni kiriting</p>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Parol</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Yashirish" : "Ko'rsatish"}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {loginError && <p className="login-error-text">{loginError}</p>}
            </div>
            <button type="submit" className="btn btn-primary login-btn scale-active" disabled={loginLoading}>
              {loginLoading ? "Tekshirilmoqda..." : "KIRISH"}
            </button>
          </form>
        </div>

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
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} userRole={userRole} onLogout={handleLogout} />

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
