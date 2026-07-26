import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const History = ({ groups = [], students = [], transactions = [], attendance = [], onDeleteTransaction, onDeleteAttendance, showToast, userRole, studentGroupId }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState('points'); // 'points' | 'attendance'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteAtt, setConfirmDeleteAtt] = useState(null); // { groupId, date, studentId, studentName, groupName }
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Auto-select student's group in student mode
  useEffect(() => {
    if (userRole === 'student') {
      const targetGroup = studentGroupId || (groups.length > 0 ? groups[0].id : 'all');
      if (targetGroup && targetGroup !== 'all') {
        setSelectedGroupId(targetGroup);
      }
    }
  }, [userRole, studentGroupId, groups]);

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

    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (tx) =>
        tx.studentName.toLowerCase().includes(query) ||
        tx.groupName.toLowerCase().includes(query) ||
        tx.comment.toLowerCase().includes(query)
    );
  }, [transactions, students, groups, searchQuery, selectedGroupId, selectedStudentId]);

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

    // Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.studentName.toLowerCase().includes(query) ||
          item.groupName.toLowerCase().includes(query) ||
          item.date.includes(query)
      );
    }

    // Sort by date descending, then updated time descending
    return filtered.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [attendance, groups, students, selectedGroupId, selectedStudentId, searchQuery]);

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
        <div>
          <h2 className="page-title">{activeHistoryTab === 'points' ? 'Baholash Tarixi' : 'Davomad Tarixi'}</h2>
          <p className="page-subtitle">
            {activeHistoryTab === 'points'
              ? 'Barcha berilgan likelar jurnali va ularni tahrirlash'
              : 'Barcha belgilangan davomadlar jurnali va ularni bekor qilish'}
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
          {/* Group Filter (Teachers Only) */}
          {userRole !== 'student' && (
            <div className="custom-dropdown-container group-filter-dropdown">
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
          <div className="custom-dropdown-container student-filter-dropdown">
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

        {/* Search */}
        <div className="search-wrapper">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Izoh bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
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
                        <div className="avatar-circle table-avatar" style={{ background: tx.studentColor, width: 30, height: 30, fontSize: '0.95rem', overflow: 'hidden' }}>
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
              <p>
                {searchQuery ? "Qidiruv bo'yicha hech qanday ma'lumot topilmadi." : "Hali hech qanday talaba baholanmagan."}
              </p>
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
                        <div className="avatar-circle table-avatar" style={{ background: item.studentColor, width: 30, height: 30, fontSize: '0.95rem', overflow: 'hidden' }}>
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
              <p>
                {searchQuery ? "Qidiruv bo'yicha hech qanday ma'lumot topilmadi." : "Hali hech qanday davomad yozuvi mavjud emas."}
              </p>
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
          gap: 16px;
          margin-bottom: 24px;
        }

        .segmented-control-brutalist {
          display: inline-flex;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          background: #ffffff;
          overflow: hidden;
        }

        .tab-btn-brutalist {
          padding: 10px 20px;
          border: none;
          background: #ffffff;
          font-family: var(--font-family);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          cursor: pointer;
          color: #000000;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-btn-brutalist:first-child {
          border-right: 2px solid #000000;
        }

        .tab-btn-brutalist:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .tab-btn-brutalist.active {
          background: #000000;
          color: #ffffff;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px 24px;
          background: #ffffff;
          border: 1px solid #000000;
          border-radius: 0;
        }

        .filter-group-row {
          display: flex;
          gap: 12px;
        }

        .custom-dropdown-container {
          position: relative;
          width: 180px;
        }

        .filter-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #000000;
          padding: 10px 14px;
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 0.95rem;
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
          max-height: 180px;
          overflow-y: auto;
          background: #ffffff;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          z-index: 100;
          margin-top: 4px;
          border-radius: 0;
        }

        .custom-dropdown-item {
          padding: 10px 14px;
          font-size: 0.9rem;
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
          padding: 10px 24px;
          overflow-x: auto;
        }

        .history-table {
          min-width: 750px;
        }

        .history-header {
          display: grid;
          grid-template-columns: 140px 1.8fr 1.2fr 2fr 80px 110px;
          padding: 18px 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .history-row {
          display: grid;
          grid-template-columns: 140px 1.8fr 1.2fr 2fr 80px 110px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-color);
          align-items: center;
          font-size: 0.95rem;
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .td-time {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .date-text {
          color: #000000;
          font-weight: 700;
        }

        .time-text {
          font-size: 0.75rem;
          color: #000000;
        }

        .td-student {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .td-group {
          color: #000000;
        }

        .td-comment {
          color: #000000;
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 12px;
        }

        .no-comment {
          color: #000000;
          opacity: 0.5;
          font-style: normal;
        }

        .btn-delete-tx {
          background: #ffffff;
          color: #000000;
          border: 1px dashed #000000;
          padding: 6px 12px;
          border-radius: 0;
          font-size: 0.8rem;
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
          padding: 60px 40px;
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .history-filters-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          position: relative;
          z-index: 100;
          overflow: visible !important;
        }

        .custom-dropdown-container {
          position: relative;
          width: 180px;
          z-index: 110;
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
          box-shadow: 6px 6px 0px #000000;
          z-index: 9999 !important;
          margin-top: 4px;
        }

        @media (max-width: 900px) {
          .history-filters-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px;
            position: relative;
            z-index: 100;
            overflow: visible !important;
          }
          .filter-group-row {
            flex-direction: column;
            width: 100%;
            gap: 10px;
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
          .history-header {
            display: none !important;
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
            display: flex !important;
            flex-direction: column !important;
            grid-template-columns: none !important;
            gap: 4px !important;
            padding: 8px 12px !important;
            background: #ffffff !important;
            border: 1.5px solid #000000 !important;
            margin-bottom: 8px !important;
            box-shadow: 3px 3px 0px #000000 !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }

          .td-time {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            font-size: 0.72rem !important;
            color: #777777 !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .date-text, .time-text {
            color: #777777 !important;
            font-weight: 600 !important;
            font-size: 0.72rem !important;
          }

          .td-student {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            min-width: 0 !important;
            flex: 1 !important;
          }

          .td-student .avatar-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 0.8rem !important;
            flex-shrink: 0 !important;
          }

          .student-table-name {
            font-size: 0.85rem !important;
            font-weight: 800 !important;
            color: #000000 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .td-group {
            padding: 1px 6px !important;
            margin-top: 0 !important;
            font-size: 0.7rem !important;
            color: #444444 !important;
            font-weight: 600 !important;
            background: rgba(0, 0, 0, 0.05) !important;
            border-radius: 4px !important;
            white-space: nowrap !important;
          }

          .td-comment {
            padding: 0 !important;
            margin-top: 0 !important;
            font-size: 0.75rem !important;
            color: #444444 !important;
            background: transparent !important;
            border: none !important;
            font-style: italic !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 170px !important;
          }

          .td-amount {
            text-align: right !important;
            padding: 1px 6px !important;
            margin-top: 0 !important;
            font-size: 0.82rem !important;
            font-weight: 800 !important;
            background: #E7FF56 !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
            border-radius: 3px !important;
          }

          .td-action {
            text-align: right !important;
            margin-top: 0 !important;
            border-top: none !important;
            padding-top: 0 !important;
          }

          .btn-delete-tx {
            width: auto !important;
            padding: 3px 8px !important;
            font-size: 0.7rem !important;
            font-weight: 700 !important;
            text-align: center !important;
            background: #ff3b30 !important;
            color: #ffffff !important;
            border: 1px solid #ff3b30 !important;
            border-radius: 3px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
