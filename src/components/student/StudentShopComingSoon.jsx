import React, { useMemo } from 'react';

export default function StudentShopComingSoon({
  pinnedStudent = null,
  transactions = [],
}) {
  const totalScore = useMemo(() => {
    if (!pinnedStudent) return 0;
    const pId = String(pinnedStudent.id);
    return (transactions || [])
      .filter((t) => !t.deleted && String(t.studentId) === pId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [pinnedStudent, transactions]);

  return (
    <div className="student-shop-view">
      <div className="shop-card">
        <span className="shop-tag">Sovg'alar & Mukofotlar</span>
        <h2 className="shop-title">Do'kon</h2>

        <div className="shop-status-badge">
          <span>Tez orada ishga tushadi</span>
        </div>

        <p className="shop-description">
          Darslarda to'plangan likelar va ballarni esdalik sovg'alarga almashtirish imkoniyati yaqinda taqdim etiladi.
        </p>

        {pinnedStudent && (
          <div className="shop-balance-card">
            <span className="balance-label">{pinnedStudent.name} hisobidagi ballar</span>
            <div className="balance-value-wrap">
              <span className="balance-value">{totalScore}</span>
              <span className="balance-unit">ball</span>
            </div>
            <span className="balance-note">Darslarda faol qatnashib, ballaringizni oshirishda davom eting!</span>
          </div>
        )}

        <div className="shop-preview-grid">
          <div className="shop-preview-item">
            <span className="preview-category">Sovg'a</span>
            <span className="preview-name">Epchil Robot stikerlari</span>
            <span className="preview-status">Kutilmoqda</span>
          </div>
          <div className="shop-preview-item">
            <span className="preview-category">To'plam</span>
            <span className="preview-name">Robotika aksessuarlari</span>
            <span className="preview-status">Kutilmoqda</span>
          </div>
          <div className="shop-preview-item">
            <span className="preview-category">Sertifikat</span>
            <span className="preview-name">Oylik peshqadamlik diplomi</span>
            <span className="preview-status">Kutilmoqda</span>
          </div>
        </div>
      </div>

      <style>{`
        .student-shop-view {
          display: flex;
          justify-content: center;
          padding: 10px 0 30px;
        }

        .shop-card {
          width: 100%;
          max-width: 620px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 36px 32px;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }

        .shop-tag {
          display: inline-block;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--apple-blue);
          margin-bottom: 8px;
        }

        .shop-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 16px;
          letter-spacing: -0.02em;
        }

        .shop-status-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(var(--apple-blue-rgb, 0, 113, 227), 0.1);
          color: var(--apple-blue);
          font-size: 0.85rem;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          margin-bottom: 16px;
        }

        .shop-description {
          font-size: 0.94rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 460px;
          margin: 0 auto 28px;
        }

        .shop-balance-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .balance-label {
          font-size: 0.78rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .balance-value-wrap {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .balance-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--apple-blue);
          line-height: 1.1;
        }

        .balance-unit {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .balance-note {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .shop-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          text-align: left;
        }

        .shop-preview-item {
          background: var(--bg-primary);
          border: 1px solid var(--border-color-subtle);
          border-radius: var(--radius-md);
          padding: 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preview-category {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-tertiary);
          letter-spacing: 0.05em;
        }

        .preview-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .preview-status {
          font-size: 0.74rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        @media (max-width: 640px) {
          .shop-card {
            padding: 24px 16px;
            border-radius: var(--radius-lg);
          }

          .shop-title {
            font-size: 1.5rem;
          }

          .shop-preview-grid {
            grid-template-columns: 1fr;
          }
        }

        [data-theme="dark"] .shop-card {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        [data-theme="dark"] .shop-balance-card,
        [data-theme="dark"] .shop-preview-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
