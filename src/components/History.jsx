import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const History = ({ groups = [], students = [], transactions = [], attendance = [], onDeleteTransaction, onDeleteAttendance, showToast, userRole }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState('points'); // 'points' | 'attendance'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteAtt, setConfirmDeleteAtt] = useState(null); // { groupId, date, studentId, studentName, groupName }
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    if (userRole === 'student' && groups.length > 0) {
      return groups[0].id;
    }
    return 'all';
  });
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Default select student's group for student role
  useEffect(() => {
    if (userRole === 'student' && groups.length > 0 && selectedGroupId !== groups[0].id) {
      setSelectedGroupId(groups[0].id);
    }
  }, [userRole, groups, selectedGroupId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmDeleteId(null);
        setConfirmDeleteAtt(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleOutsideClick = (e) => {
      if (!e.target.closest('.group-filter-dropdown')) {
        setIsGroupDropdownOpen(false);
      }
      if (!e.target.closest('.student-filter-dropdown')) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Reset student filter if student does not belong to selected group
  useEffect(() => {
    if (selectedGroupId !== 'all') {
      const student = students.find((s) => s.id === selectedStudentId);
      if (student && student.groupId !== selectedGroupId) {
        setSelectedStudentId('all');
      }
    }
  }, [selectedGroupId, selectedStudentId, students]);

  // Dropdown student options (filtered by selected group)
  const filteredStudentsForDropdown = useMemo(() => {
    if (selectedGroupId === 'all') {
      return students;
    }
    return students.filter((s) => s.groupId === selectedGroupId);
  }, [students, selectedGroupId]);

  // Map and filter transactions
  const processedTransactions = useMemo(() => {
    let data = transactions.map((tx) => {
      const student = students.find((s) => s.id === tx.studentId);
      const group = student ? groups.find((g) => g.id === student.groupId) : null;
      return {
        ...tx,
        studentName: student ? student.name : "O'chirilgan talaba",
        studentEmoji: student ? student.emoji : '❓',
        studentColor: student ? student.color : '#8e8e93',
        groupId: student ? student.groupId : null,
        groupName: group ? group.name : "O'chirilgan guruh",
      };
    });

    // Group Filter
    if (selectedGroupId !== 'all') {
      data = data.filter((tx) => tx.groupId === selectedGroupId);
    }

    // Student Filter
    if (selectedStudentId !== 'all') {
      data = data.filter((tx) => tx.studentId === selectedStudentId);
    }

    return data;
  }, [transactions, students, groups, selectedGroupId, selectedStudentId]);

  // Map and filter attendance records for Attendance History Tab
  const processedAttendance = useMemo(() => {
    const list = [];
    (attendance || []).forEach((att) => {
      const group = groups.find((g) => g.id === att.groupId);
      const groupName = group ? group.name : "O'chirilgan guruh";

      if (att.records && typeof att.records === 'object') {
        Object.entries(att.records).forEach(([studentId, status]) => {
          const student = students.find((s) => s.id === studentId);
          list.push({
            id: `${att.groupId}_${att.date}_${studentId}`,
            groupId: att.groupId,
            groupName,
            date: att.date,
            studentId,
            studentName: student ? student.name : "O'chirilgan o'quvchi",
            studentEmoji: student ? student.emoji : '❓',
            studentColor: student ? student.color : '#8e8e93',
            status,
            updatedAt: att.updatedAt || att.createdAt,
          });
        });
      }
    });

    // Group Filter
    let filtered = list;
    if (selectedGroupId !== 'all') {
      filtered = filtered.filter((item) => item.groupId === selectedGroupId);
    }

    // Student Filter
    if (selectedStudentId !== 'all') {
      filtered = filtered.filter((item) => item.studentId === selectedStudentId);
    }

    // Sort by date descending, then updated time descending
    return filtered.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [attendance, groups, students, selectedGroupId, selectedStudentId]);

  const handleDelete = (id) => {
    onDeleteTransaction(id);
    setConfirmDeleteId(null);
    showToast("Baholash harakati muvaffaqiyatli bekor qilindi!", "success");
  };

  const handleDeleteAtt = () => {
    if (!confirmDeleteAtt) return;
    onDeleteAttendance(confirmDeleteAtt.groupId, confirmDeleteAtt.date, confirmDeleteAtt.studentId);
    setConfirmDeleteAtt(null);
  };

  const gridStyle = {
    gridTemplateColumns: userRole === 'student'
      ? '140px 1.8fr 1.2fr 2fr 80px'
      : '140px 1.8fr 1.2fr 2fr 80px 110px'
  };

  return (
    <div className="history-container">
      <div className="page-header history-header-wrapper">
        <div className="history-header-text">
          <h2 className="page-title">{activeHistoryTab === 'points' ? 'Baholash Tarixi' : 'Davomad Tarixi'}</h2>
          <p className="page-subtitle">
            {activeHistoryTab === 'points'
              ? 'Barcha berilgan baholar jurnali'
              : 'Barcha belgilangan davomadlar jurnali'}
          </p>
        </div>

        <div className="segmented-control-brutalist">
          <button
            type="button"
            className={`tab-btn-brutalist ${activeHistoryTab === 'points' ? 'active' : ''}`}
            onClick={() => setActiveHistoryTab('points')}
          >
            📜 Ballar Tarixi
          </button>
          <button
            type="button"
            className={`tab-btn-brutalist ${activeHistoryTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveHistoryTab('attendance')}
          >
            🗓️ Davomad Tarixi
          </button>
        </div>
      </div>

      {/* Filters and Search wrapper - separated from header for cleaner responsive design */}
      <div className="history-filters-bar glass-card">
        <div className="filter-group-row">
          {/* Group Filter - not needed for Student mode */}
          {userRole !== 'student' && (
            <div className={`custom-dropdown-container group-filter-dropdown ${isGroupDropdownOpen ? 'dropdown-open' : ''}`}>
              <button 
                type="button" 
                className="filter-select-btn" 
                onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              >
                <span>{selectedGroupId === 'all' ? 'Barcha guruhlar' : (groups.find(g => g.id === selectedGroupId)?.name || 'Guruhsiz')}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {isGroupDropdownOpen && (
                <div className="custom-dropdown-list glass">
                  <div 
                    className={`custom-dropdown-item ${selectedGroupId === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedGroupId('all');
                      setIsGroupDropdownOpen(false);
                    }}
                  >
                    Barcha guruhlar
                  </div>
                  {groups.map((group) => (
                    <div 
                      key={group.id}
                      className={`custom-dropdown-item ${selectedGroupId === group.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setIsGroupDropdownOpen(false);
                      }}
                    >
                      {group.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Student Filter */}
          <div className={`custom-dropdown-container student-filter-dropdown ${isStudentDropdownOpen ? 'dropdown-open' : ''}`}>
            <button 
              type="button" 
              className="filter-select-btn" 
              onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
            >
              <span>{selectedStudentId === 'all' ? 'Barcha talabalar' : (students.find(s => s.id === selectedStudentId)?.name || 'Talabasiz')}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {isStudentDropdownOpen && (
              <div className="custom-dropdown-list glass">
                <div 
                  className={`custom-dropdown-item ${selectedStudentId === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStudentId('all');
                    setIsStudentDropdownOpen(false);
                  }}
                >
                  Barcha talabalar
                </div>
                {filteredStudentsForDropdown.map((student) => (
                  <div 
                    key={student.id}
                    className={`custom-dropdown-item ${selectedStudentId === student.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      setIsStudentDropdownOpen(false);
                    }}
                  >
                    {student.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeHistoryTab === 'points' ? (
        <div className="glass-card history-card">
          {processedTransactions.length > 0 ? (
            <div className="history-table">
              <div className="history-header" style={gridStyle}>
                <span className="th-time">Vaqt</span>
                <span className="th-student">Talaba</span>
                <span className="th-group">Guruh</span>
                <span className="th-comment">Izoh</span>
                <span className="th-amount text-right">Like</span>
                {userRole !== 'student' && <span className="th-action text-right">Amal</span>}
              </div>
              <div className="history-body">
                {processedTransactions.map((tx) => {
                  const date = new Date(tx.timestamp);
                  const formattedDate = date.toLocaleDateString();
                  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={tx.id} className="history-row" style={gridStyle}>
                      <span className="td-time">
                        <span className="date-text">{formattedDate}</span>
                        <span className="time-text">{formattedTime}</span>
                      </span>
                      <span className="td-student">
                        <div className="avatar-circle table-avatar" style={{ background: tx.studentColor, width: 24, height: 24, fontSize: '0.8rem', overflow: 'hidden' }}>
                          {renderAvatar(tx.studentEmoji)}
                        </div>
                        <span className="student-table-name">{tx.studentName}</span>
                      </span>
                      <span className="td-group">{tx.groupName}</span>
                      <span className="td-comment">
                        {tx.comment ? `"${tx.comment}"` : <span className="no-comment">—</span>}
                      </span>
                      <span className={`td-amount text-right font-bold ${tx.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                      {userRole !== 'student' && (
                        <span className="td-action text-right">
                          <button
                            className="btn-delete-tx scale-active"
                            onClick={() => setConfirmDeleteId(tx.id)}
                            title="Bahoni bekor qilish"
                          >
                            Bekor qilish
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-history">
              <div className="placeholder-icon">⏳</div>
              <h3>Harakatlar topilmadi</h3>
              <p>Hali hech qanday talaba baholanmagan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card history-card">
          {processedAttendance.length > 0 ? (
            <div className="history-table">
              <div
                className="history-header"
                style={{
                  gridTemplateColumns: userRole === 'student'
                    ? '140px 1.8fr 1.2fr 1.2fr 100px'
                    : '140px 1.8fr 1.2fr 1.2fr 100px 110px'
                }}
              >
                <span className="th-time">Sana</span>
                <span className="th-student">O'quvchi</span>
                <span className="th-group">Guruh</span>
                <span className="th-comment">Status</span>
                <span className="th-time">Vaqt</span>
                {userRole !== 'student' && <span className="th-action text-right">Amal</span>}
              </div>
              <div className="history-body">
                {processedAttendance.map((item) => {
                  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : null;
                  const formattedTime = updatedDate ? updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                  let statusBadge;
                  if (item.status === 'present') {
                    statusBadge = <span className="att-badge present">✅ Keldi</span>;
                  } else if (item.status === 'absent') {
                    statusBadge = <span className="att-badge absent">❌ Kelmadi</span>;
                  } else if (item.status === 'late') {
                    statusBadge = <span className="att-badge late">⏰ Kechikdi</span>;
                  } else {
                    statusBadge = <span className="att-badge unset">—</span>;
                  }

                  return (
                    <div
                      key={item.id}
                      className="history-row"
                      style={{
                        gridTemplateColumns: userRole === 'student'
                          ? '140px 1.8fr 1.2fr 1.2fr 100px'
                          : '140px 1.8fr 1.2fr 1.2fr 100px 110px'
                      }}
                    >
                      <span className="td-time">
                        <span className="date-text">{item.date}</span>
                      </span>
                      <span className="td-student">
                        <div className="avatar-circle table-avatar" style={{ background: item.studentColor, width: 24, height: 24, fontSize: '0.8rem', overflow: 'hidden' }}>
                          {renderAvatar(item.studentEmoji)}
                        </div>
                        <span className="student-table-name">{item.studentName}</span>
                      </span>
                      <span className="td-group">{item.groupName}</span>
                      <span className="td-comment">
                        {statusBadge}
                      </span>
                      <span className="td-time">
                        <span className="time-text">{formattedTime}</span>
                      </span>
                      {userRole !== 'student' && (
                        <span className="td-action text-right">
                          <button
                            className="btn-delete-tx scale-active"
                            onClick={() => setConfirmDeleteAtt({
                              groupId: item.groupId,
                              date: item.date,
                              studentId: item.studentId,
                              studentName: item.studentName,
                              groupName: item.groupName,
                            })}
                            title="Davomadni o'chirish"
                          >
                            Bekor qilish
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-history">
              <div className="placeholder-icon">🗓️</div>
              <h3>Davomad tarixlari topilmadi</h3>
              <p>Hali hech qanday davomad yozuvi mavjud emas.</p>
            </div>
          )}
        </div>
      )}

      {/* Undo/Delete Transaction Confirmation Modal */}
      {confirmDeleteId && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setConfirmDeleteId(null)}
              title="Yopish"
            >
              ✕
            </button>
            <h3 className="modal-title">Baholashni bekor qilish</h3>
            <p className="modal-warning-text">
              Ushbu baholash harakatini bekor qilmoqchimisiz? Talabaning umumiy likelari mos ravishda qayta hisoblanadi.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setConfirmDeleteId(null)}>
                Orqaga
              </button>
              <button
                className="btn btn-danger scale-active"
                onClick={() => handleDelete(confirmDeleteId)}
              >
                Ha, bekor qilinsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Attendance Delete Confirmation Modal */}
      {confirmDeleteAtt && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmDeleteAtt(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setConfirmDeleteAtt(null)}
              title="Yopish"
            >
              ✕
            </button>
            <h3 className="modal-title">Davomadni bekor qilish</h3>
            <p className="modal-warning-text">
              <strong>{confirmDeleteAtt.date}</strong> kunidagi <strong>{confirmDeleteAtt.studentName}</strong> o'quvchining davomad yozuvini bekor qilmoqchimisiz?
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary scale-active" onClick={() => setConfirmDeleteAtt(null)}>
                Orqaga
              </button>
              <button
                className="btn btn-danger scale-active"
                onClick={handleDeleteAtt}
              >
                Ha, bekor qilinsin
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .history-container {
          animation: fade-in 0.4s ease-out;
        }

        .history-header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .history-header-text {
          min-height: 52px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .history-header-text .page-title {
          line-height: 1.1;
          margin: 0;
        }

        .history-header-text .page-subtitle {
          line-height: 1.2;
          margin-top: 4px;
        }

        .segmented-control-brutalist {
          display: inline-flex;
          align-items: stretch;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          background: #ffffff;
        }

        .tab-btn-brutalist {
          flex: 1;
          min-width: 155px;
          padding: 8px 18px;
          border: none;
          background: #ffffff;
          font-family: var(--font-family);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.82rem;
          line-height: 1.2;
          white-space: nowrap;
          cursor: pointer;
          color: #000000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background-color 0.15s ease, color 0.15s ease;
          transform: none !important;
          box-shadow: none !important;
          user-select: none;
        }

        .tab-btn-brutalist:first-child {
          border-right: 2px solid #000000;
        }

        .tab-btn-brutalist:hover {
          background: var(--accent-neon);
          color: #000000;
          transform: none !important;
        }

        .tab-btn-brutalist.active {
          background: #000000;
          color: #ffffff;
          transform: none !important;
        }

        .tab-btn-brutalist.active:hover {
          background: #000000;
          color: #ffffff;
          transform: none !important;
        }

        .att-badge {
          display: inline-block;
          font-weight: 700;
          font-size: 0.82rem;
          padding: 3px 10px;
          border: 1px solid #000000;
        }

        .att-badge.present {
          background: #e2ffd0;
          color: #000000;
        }

        .att-badge.absent {
          background: #ffd0d0;
          color: #000000;
        }

        .att-badge.late {
          background: #fff5d0;
          color: #000000;
        }

        .att-badge.unset {
          background: #f0f0f0;
          color: #888888;
        }

        .history-filters-bar {
          position: relative;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          padding: 10px 16px;
          background: #ffffff;
          border: 1px solid #000000;
          border-radius: 0;
        }

        .filter-group-row {
          display: flex;
          gap: 10px;
        }

        .custom-dropdown-container {
          position: relative;
          width: 170px;
          z-index: 101;
        }

        .custom-dropdown-container.dropdown-open {
          z-index: 105;
        }

        .filter-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #000000;
          padding: 6px 12px;
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 0.88rem;
          font-weight: 700;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .filter-select-btn:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .dropdown-arrow {
          font-size: 0.65rem;
          margin-left: 8px;
          transition: transform var(--transition-fast);
        }

        .custom-dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          max-height: 220px;
          overflow-y: auto;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          z-index: 9999;
          margin-top: 4px;
          border-radius: 0;
        }

        .custom-dropdown-item {
          padding: 7px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          color: #000000;
          transition: all var(--transition-fast);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .custom-dropdown-item:last-child {
          border-bottom: none;
        }

        .custom-dropdown-item:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .custom-dropdown-item.active {
          background: #000000;
          color: #ffffff;
        }

        .custom-dropdown-item.active:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .search-wrapper {
          position: relative;
          min-width: 250px;
        }

        .search-input {
          padding-right: 40px;
        }

        .clear-search-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1rem;
        }

        .history-card {
          position: relative;
          z-index: 1;
          padding: 2px 12px;
          overflow-x: auto;
          background: #ffffff;
          border: 1px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          border-radius: 0;
        }

        .history-table {
          min-width: 720px;
        }

        .history-header {
          display: grid;
          padding: 6px 8px;
          border-bottom: 2px solid #000000;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          align-items: center;
        }

        .history-row {
          display: grid;
          padding: 6px 8px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.07);
          align-items: center;
          font-size: 0.85rem;
          transition: background-color var(--transition-fast);
        }

        .history-row:hover {
          background-color: rgba(0, 0, 0, 0.025);
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .td-time {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .date-text {
          color: #000000;
          font-size: 0.84rem;
          font-weight: 700;
        }

        .time-text {
          font-size: 0.72rem;
          color: #666666;
          font-weight: 500;
        }

        .td-student {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .student-table-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #000000;
        }

        .td-group {
          color: #222222;
          font-size: 0.84rem;
          font-weight: 600;
        }

        .td-comment {
          color: #333333;
          font-size: 0.83rem;
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 10px;
        }

        .no-comment {
          color: #888888;
          font-style: normal;
        }

        .td-amount {
          font-size: 0.92rem;
          font-weight: 800;
        }

        .att-badge {
          display: inline-block;
          font-weight: 700;
          font-size: 0.76rem;
          padding: 2px 8px;
          border: 1px solid #000000;
          border-radius: 2px;
        }

        .btn-delete-tx {
          background: #ffffff;
          color: #000000;
          border: 1px dashed #000000;
          padding: 3px 8px;
          border-radius: 2px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-delete-tx:hover {
          background: #E7FF56;
          color: #000000;
          border-style: solid;
        }

        .empty-history {
          padding: 40px 20px;
          text-align: center;
          max-width: 450px;
          margin: 20px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 900px) {
          .history-filters-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }
          .filter-group-row {
            flex-direction: column;
            width: 100%;
          }
          .custom-dropdown-container {
            width: 100%;
          }
          .search-wrapper {
            width: 100% !important;
            min-width: unset;
          }
        }

        @media (max-width: 768px) {
          .history-header-wrapper {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            margin-bottom: 14px;
          }

          .history-header-text {
            min-height: 56px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }

          .history-header-text .page-title {
            font-size: 1.6rem;
            line-height: 1.1;
            margin: 0;
          }

          .history-header-text .page-subtitle {
            font-size: 0.84rem;
            line-height: 1.25;
            margin-top: 4px;
          }

          .segmented-control-brutalist {
            width: 100%;
            display: flex;
          }

          .tab-btn-brutalist {
            flex: 1;
            min-width: unset;
            padding: 8px 6px;
            font-size: 0.78rem;
            justify-content: center;
            text-align: center;
          }

          .history-header {
            display: none;
          }
          
          .history-table {
            min-width: unset;
          }

          .history-card {
            padding: 0;
            border: none;
            background: transparent;
            box-shadow: none;
          }

          .history-row {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
            padding: 8px 10px;
            background: #ffffff;
            border: 1.5px solid #000000;
            margin-bottom: 6px;
            box-shadow: 2px 2px 0px #000000;
          }

          .td-time {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            font-size: 0.72rem;
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }

          .date-text, .time-text {
            color: #666666;
            font-weight: 600;
            font-size: 0.72rem;
          }

          .td-student {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .student-table-name {
            font-size: 0.88rem;
            font-weight: 700;
          }

          .td-group {
            font-size: 0.78rem;
            font-weight: 600;
            color: #555555;
            padding-left: 0;
            margin-top: 0;
          }

          .td-comment {
            padding-left: 0;
            white-space: normal;
            font-size: 0.78rem;
            color: #333333;
            margin-top: 1px;
            background: #f8f9fa;
            padding: 2px 6px;
            border-left: 2px solid #000000;
          }

          .td-amount {
            text-align: right;
            padding-left: 0;
            font-size: 0.95rem;
            margin-top: 0;
          }

          .td-action {
            text-align: right;
            margin-top: 2px;
            border-top: 1px dashed rgba(0, 0, 0, 0.12);
            padding-top: 4px;
          }

          .btn-delete-tx {
            width: auto;
            padding: 3px 8px;
            font-size: 0.72rem;
            display: inline-block;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
