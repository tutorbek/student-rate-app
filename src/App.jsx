import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';
import Leaderboard from './components/Leaderboard';
import History from './components/History';
import Settings from './components/Settings';
import { loadFromFirestore, saveToFirestore } from './utils/firebase';

import {
  getGroups,
  getStudents,
  getTransactions,
  getQuickTags,
  addGroup,
  deleteGroup,
  addStudent,
  deleteStudent,
  addTransaction,
  deleteTransaction,
  updateGroup,
  updateStudent,
} from './utils/db';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedRole = sessionStorage.getItem('rsa_role');
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
    return sessionStorage.getItem('rsa_authenticated') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('rsa_role') || 'student';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginPassword) {
      setLoginError("Parolni kiriting!");
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    // Parol to'g'ridan-to'g'ri frontendda tekshiriladi (server kerak emas)
    const TEACHER_PASSWORD = 'OzimSila';
    const STUDENT_PASSWORD = 'studentman';

    setTimeout(() => {
      let role = null;
      if (loginPassword === TEACHER_PASSWORD) {
        role = 'teacher';
      } else if (loginPassword === STUDENT_PASSWORD) {
        role = 'student';
      }

      if (role) {
        sessionStorage.setItem('rsa_authenticated', 'true');
        sessionStorage.setItem('rsa_role', role);
        setIsAuthenticated(true);
        setUserRole(role);
        if (role === 'student') {
          setActiveTab('leaderboard');
        } else {
          setActiveTab('dashboard');
        }
        showToast("Muvaffaqiyatli kirdingiz!", "success");
      } else {
        setLoginError("Noto'g'ri parol!");
      }
      setLoginLoading(false);
    }, 300);
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

  // Sync state
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [quickTags, setQuickTags] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState(null);

  // Show dynamic toast
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
  };

  // Load database from Firestore on mount, fallback to localStorage
  useEffect(() => {
    const load = async () => {
      setIsSyncing(true);
      const data = await loadFromFirestore();
      if (data) {
        setGroups(data.groups || []);
        setStudents(data.students || []);
        setTransactions(data.transactions || []);
        setQuickTags(data.quickTags || getQuickTags());
        // Also update localStorage as local cache
        localStorage.setItem('rsa_groups', JSON.stringify(data.groups || []));
        localStorage.setItem('rsa_students', JSON.stringify(data.students || []));
        localStorage.setItem('rsa_transactions', JSON.stringify(data.transactions || []));
        localStorage.setItem('rsa_quick_tags', JSON.stringify(data.quickTags || []));
      } else {
        // Firestore failed — use localStorage cache
        setGroups(getGroups());
        setStudents(getStudents());
        setTransactions(getTransactions());
        setQuickTags(getQuickTags());
      }
      setIsLoaded(true);
      setIsSyncing(false);
    };
    load();
  }, []);

  // Save to Firestore whenever state changes
  useEffect(() => {
    if (!isLoaded) return;

    const db = { groups, students, transactions, quickTags };

    // Always keep localStorage in sync as local cache
    localStorage.setItem('rsa_groups', JSON.stringify(groups));
    localStorage.setItem('rsa_students', JSON.stringify(students));
    localStorage.setItem('rsa_transactions', JSON.stringify(transactions));
    localStorage.setItem('rsa_quick_tags', JSON.stringify(quickTags));

    // Save to Firestore (cross-device sync)
    saveToFirestore(db).catch((err) => {
      console.error('[Firestore] Auto-save failed:', err);
    });
  }, [groups, students, transactions, quickTags, isLoaded]);

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

  // Reload data from Firestore (for Import/Reset)
  const reloadDatabase = useCallback(async () => {
    setIsSyncing(true);
    const data = await loadFromFirestore();
    if (data) {
      setGroups(data.groups || []);
      setStudents(data.students || []);
      setTransactions(data.transactions || []);
      setQuickTags(data.quickTags || []);
    } else {
      setGroups(getGroups());
      setStudents(getStudents());
      setTransactions(getTransactions());
      setQuickTags(getQuickTags());
    }
    setSelectedGroupId(null);
    setIsSyncing(false);
  }, []);

  // Actions
  const handleAddGroup = (name, icon) => {
    addGroup(name, icon);
    setGroups(getGroups());
  };

  const handleDeleteGroup = (id) => {
    deleteGroup(id);
    setGroups(getGroups());
    setStudents(getStudents());
    setTransactions(getTransactions());
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
  };

  const handleAddStudent = (name, groupId, emoji, color) => {
    addStudent(name, groupId, emoji, color);
    setStudents(getStudents());
  };

  const handleUpdateStudent = (id, name, emoji, color) => {
    updateStudent(id, name, emoji, color);
    setStudents(getStudents());
  };

  const handleDeleteStudent = (id) => {
    deleteStudent(id);
    setStudents(getStudents());
    setTransactions(getTransactions());
  };

  const handleUpdateGroup = (id, name, icon) => {
    updateGroup(id, name, icon);
    setGroups(getGroups());
  };

  const handleAwardPoints = (studentId, amount, comment) => {
    addTransaction(studentId, amount, comment);
    setTransactions(getTransactions());
  };

  const handleDeleteTransaction = (id) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
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
    sessionStorage.removeItem('rsa_authenticated');
    sessionStorage.removeItem('rsa_role');
    localStorage.removeItem('rsa_active_tab');
    setIsAuthenticated(false);
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
        return <Dashboard setActiveTab={handleTabChange} onSelectGroup={handleSelectGroup} />;
      case 'groups':
        if (selectedGroupId) {
          const group = groups.find((g) => g.id === selectedGroupId);
          if (!group) {
            setSelectedGroupId(null);
            return null;
          }
          return (
            <GroupDetail
              group={group}
              students={students}
              transactions={transactions}
              quickTags={quickTags}
              onBack={() => setSelectedGroupId(null)}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onAwardPoints={handleAwardPoints}
              onDeleteTransaction={handleDeleteTransaction}
              showToast={showToast}
            />
          );
        }
        return (
          <GroupsList
            groups={groups}
            students={students}
            onSelectGroup={handleSelectGroup}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            showToast={showToast}
          />
        );
      case 'leaderboard':
        return <Leaderboard groups={groups} students={students} transactions={transactions} />;
      case 'history':
        return (
          <History
            groups={groups}
            students={students}
            transactions={transactions}
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
            onReloadDatabase={reloadDatabase}
            showToast={showToast}
          />
        );
      default:
        return <Dashboard setActiveTab={handleSelectGroup} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-card glass">
          <h2 className="login-title">INSIGHTPLUS</h2>
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

  return (
    <div className="app-container">
      {/* Dynamic Ambient Background Glows */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} userRole={userRole} onLogout={handleLogout} />

      {/* Main Panel Content */}
      <main className="main-content">
        {isSyncing && (
          <div className="sync-indicator">
            <span className="sync-dot"></span>
            Yuklanmoqda...
          </div>
        )}
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
