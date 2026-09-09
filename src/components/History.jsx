import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { renderAvatar } from '../utils/studentAvatars';

const History = ({ groups = [], students = [], transactions = [], onDeleteTransaction, showToast, userRole }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    if (userRole === 'student' && groups.length > 0) {
      return groups[0].id;
    }
    return 'all';
  });
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  useEffect(() => {
    if (userRole === 'student' && groups.length > 0 && selectedGroupId !== groups[0].id) {
      setSelectedGroupId(groups[0].id);
    }
  }, [userRole, groups, selectedGroupId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmDeleteId(null);
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

  useEffect(() => {
    if (selectedGroupId !== 'all') {
      const student = students.find((s) => s.id === selectedStudentId);
      if (student && student.groupId !== selectedGroupId) {
        setSelectedStudentId('all');
      }
    }
  }, [selectedGroupId, selectedStudentId, students]);

  const filteredStudentsForDropdown = useMemo(() => {
    if (selectedGroupId === 'all') {
      return students;
    }
    return students.filter((s) => s.groupId === selectedGroupId);
  }, [students, selectedGroupId]);

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

    if (selectedGroupId !== 'all') {
      data = data.filter((tx) => tx.groupId === selectedGroupId);
    }

    if (selectedStudentId !== 'all') {
      data = data.filter((tx) => tx.studentId === selectedStudentId);
    }

    return data;
  }, [transactions, students, groups, selectedGroupId, selectedStudentId]);

  const handleDelete = (id) => {
    onDeleteTransaction(id);
    setConfirmDeleteId(null);
    showToast("Baholash harakati muvaffaqiyatli bekor qilindi!", "success");
  };

  const gridStyle = {
    gridTemplateColumns: userRole === 'student'
      ? '130px 1.6fr 1.2fr 2fr 80px'
      : '130px 1.6fr 1.2fr 2fr 80px 105px'
  };

  return (
    <div className="history-container">
      <div className="page-header history-header-wrapper">
        <div className="history-header-text">
          <h2 className="page-title">Baholar Tarixi</h2>
        </div>
      </div>

      <div className="history-filters-bar glass-card">
        <div className="filter-group-row">
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
                const formattedTime = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });

                return (
                  <div key={tx.id} className="history-row" style={gridStyle}>
                    <span className="td-time">
                      <span className="date-text">{formattedDate}</span>
                      <span className="time-text">{formattedTime}</span>
                    </span>
                    <span className="td-student">
                      <div className="avatar-circle table-avatar" style={{ background: tx.studentColor, width: 26, height: 26, fontSize: '0.85rem', overflow: 'hidden' }}>
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

      {confirmDeleteId && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => setConfirmDeleteId(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .history-filters-bar {
          position: relative;
          z-index: 100;
          padding: 14px 18px;
          margin-bottom: 18px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          background: #FFFFFF;
        }

        .filter-group-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .custom-dropdown-container {
          position: relative;
          min-width: 180px;
          flex: 1;
        }

        .filter-select-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 14px;
          background: #FFFFFF;
          border: 1px solid #D2D2D7;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .filter-select-btn:hover {
          border-color: var(--apple-blue);
        }

        .dropdown-arrow {
          font-size: 0.65rem;
          margin-left: 6px;
        }

        .custom-dropdown-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 100%;
          max-height: 240px;
          overflow-y: auto;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        .custom-dropdown-item {
          padding: 10px 14px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          border-bottom: 1px solid var(--border-color-subtle);
          transition: background var(--transition-fast);
        }

        .custom-dropdown-item:hover, .custom-dropdown-item.active {
          background: #F5F5F7;
          color: var(--apple-blue);
          font-weight: 700;
        }

        .history-card {
          padding: 0;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          background: #FFFFFF;
          overflow: hidden;
        }

        .history-table {
          width: 100%;
        }

        .history-header {
          display: grid;
          padding: 12px 18px;
          background: #FAFAFC;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-secondary);
        }

        .history-body {
          display: flex;
          flex-direction: column;
        }

        .history-row {
          display: grid;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-color-subtle);
          align-items: center;
          font-size: 0.86rem;
          transition: background var(--transition-fast);
          content-visibility: auto;
          contain-intrinsic-size: 0 48px;
        }

        .history-row:hover {
          background: #FAFAFC;
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
          font-weight: 600;
          font-size: 0.82rem;
          color: var(--text-primary);
        }

        .time-text {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .td-student {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .table-avatar {
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
        }

        .student-table-name {
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .td-group {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .td-comment {
          font-size: 0.84rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 8px;
        }

        .no-comment {
          color: var(--text-tertiary);
          font-style: italic;
        }

        .td-amount {
          font-size: 0.92rem;
          font-weight: 700;
        }

        .text-positive {
          color: var(--apple-green);
        }

        .text-negative {
          color: var(--apple-red);
        }

        .btn-delete-tx {
          padding: 5px 10px;
          font-size: 0.76rem;
          font-weight: 600;
          background: #FEE2E2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-sm);
          color: #DC2626;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-delete-tx:hover {
          background: #FCA5A5;
        }

        .empty-history {
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .placeholder-icon {
          font-size: 2.5rem;
        }

        @media (max-width: 768px) {
          .history-header {
            display: none;
          }

          .history-row {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-color-subtle);
          }

          .td-time {
            flex-direction: row;
            justify-content: space-between;
          }

          .td-comment {
            background: #F5F5F7;
            padding: 8px 12px;
            border-radius: var(--radius-sm);
            white-space: normal;
          }

          .td-action {
            text-align: right;
            border-top: 1px dashed var(--border-color-subtle);
            padding-top: 8px;
          }
        }

        /* History Dark Mode Overrides */
        [data-theme="dark"] .history-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .history-header {
          background: #202124;
          border-bottom-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .history-row {
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .history-row:hover {
          background: #303134 !important;
        }

        [data-theme="dark"] .date-text {
          color: #E8EAED;
        }

        [data-theme="dark"] .time-text {
          color: #9AA0A6;
        }

        [data-theme="dark"] .td-comment {
          background: #202124;
          color: #E8EAED;
        }

        [data-theme="dark"] .btn-delete-tx {
          background: rgba(242, 139, 130, 0.15) !important;
          color: #F28B82 !important;
          border: 1px solid rgba(242, 139, 130, 0.35) !important;
        }

        [data-theme="dark"] .btn-delete-tx:hover {
          background: rgba(242, 139, 130, 0.25) !important;
          border-color: rgba(242, 139, 130, 0.5) !important;
        }

        [data-theme="dark"] .custom-dropdown-list {
          background: #202124;
          border-color: #3C4043;
        }

        [data-theme="dark"] .custom-dropdown-item {
          color: #E8EAED;
          border-bottom-color: #3C4043;
        }

        [data-theme="dark"] .custom-dropdown-item:hover,
        [data-theme="dark"] .custom-dropdown-item.active {
          background: #303134;
          color: #8AB4F8;
        }

        [data-theme="dark"] .filter-select-btn {
          background: #202124;
          border-color: #3C4043;
          color: #E8EAED;
        }
      `}</style>
    </div>
  );
};

export default History;
