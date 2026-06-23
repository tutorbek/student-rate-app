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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmDeleteId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map and filter transactions
  const processedTransactions = useMemo(() => {
    const data = transactions.map((tx) => {
      const student = students.find((s) => s.id === tx.studentId);
      const group = student ? groups.find((g) => g.id === student.groupId) : null;
      return {
        ...tx,
        studentName: student ? student.name : "O'chirilgan talaba",
        studentEmoji: student ? student.emoji : '❓',
        studentColor: student ? student.color : '#8e8e93',
        groupName: group ? group.name : "O'chirilgan guruh",
      };
    });

    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      (tx) =>
        tx.studentName.toLowerCase().includes(query) ||
        tx.groupName.toLowerCase().includes(query) ||
        tx.comment.toLowerCase().includes(query)
    );
  }, [transactions, students, groups, searchQuery]);

  const handleDelete = (id) => {
    onDeleteTransaction(id);
    setConfirmDeleteId(null);
    showToast("Baholash harakati muvaffaqiyatli bekor qilindi!", "success");
  };

  return (
    <div className="history-container">
      <div className="page-header flex-col-mobile">
        <div>
          <h2 className="page-title">Baholash Tarixi</h2>
          <p className="page-subtitle">Barcha berilgan ballar (likelar) jurnali va ularni tahrirlash</p>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Ism, guruh yoki izoh bo'yicha qidirish..."
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

        .search-wrapper {
          position: relative;
          min-width: 320px;
        }

        @media (max-width: 768px) {
          .search-wrapper {
            width: 100%;
          }
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
      `}</style>
    </div>
  );
};

export default History;
