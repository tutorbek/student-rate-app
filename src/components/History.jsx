import React, { useState, useMemo, useEffect } from 'react';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const History = ({ groups, students, transactions, onDeleteTransaction, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

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

  const handleDelete = (id) => {
    onDeleteTransaction(id);
    setConfirmDeleteId(null);
    showToast("Baholash harakati muvaffaqiyatli bekor qilindi!", "success");
  };

  return (
    <div className="history-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Baholash Tarixi</h2>
          <p className="page-subtitle">Barcha berilgan ballar (likelar) jurnali va ularni tahrirlash</p>
        </div>
      </div>

      {/* Filters and Search wrapper - separated from header for cleaner responsive design */}
      <div className="history-filters-bar glass-card">
        <div className="filter-group-row">
          {/* Group Filter */}
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

      <div className="glass-card history-card">
        {processedTransactions.length > 0 ? (
          <div className="history-table">
            <div className="history-header">
              <span className="th-time">Vaqt</span>
              <span className="th-student">Talaba</span>
              <span className="th-group">Guruh</span>
              <span className="th-comment">Izoh</span>
              <span className="th-amount text-right">Ball</span>
              <span className="th-action text-right">Amal</span>
            </div>
            <div className="history-body">
              {processedTransactions.map((tx) => {
                const date = new Date(tx.timestamp);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={tx.id} className="history-row">
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
                    <span className="td-action text-right">
                      <button
                        className="btn-delete-tx scale-active"
                        onClick={() => setConfirmDeleteId(tx.id)}
                        title="Bahoni bekor qilish"
                      >
                        Bekor qilish
                      </button>
                    </span>
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

      {/* Undo/Delete Transaction Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Baholashni bekor qilish</h3>
            <p className="modal-warning-text">
              Ushbu baholash harakatini bekor qilmoqchimisiz? Talabaning umumiy ballari mos ravishda qayta hisoblanadi.
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
        </div>
      )}

      <style>{`
        .history-container {
          animation: fade-in 0.4s ease-out;
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
            gap: 12px;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #000000;
            margin-bottom: 16px;
            box-shadow: 4px 4px 0px #000000;
          }

          .td-time {
            flex-direction: row;
            justify-content: space-between;
            font-size: 0.8rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            padding-bottom: 8px;
            margin-bottom: 4px;
          }

          .date-text, .time-text {
            color: var(--text-secondary);
            font-weight: 500;
          }

          .td-student {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .student-table-name {
            font-size: 1.1rem;
            font-weight: 700;
          }

          .td-group {
            font-size: 0.85rem;
            font-weight: 600;
            color: #000000;
            opacity: 0.6;
            padding-left: 42px;
            margin-top: -8px;
          }

          .td-comment {
            padding-left: 42px;
            white-space: normal;
            font-size: 0.9rem;
            margin-top: 4px;
          }

          .td-amount {
            text-align: left;
            padding-left: 42px;
            font-size: 1.2rem;
            margin-top: 6px;
          }

          .td-action {
            text-align: right;
            margin-top: 8px;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            padding-top: 12px;
          }

          .btn-delete-tx {
            width: 100%;
            padding: 10px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
