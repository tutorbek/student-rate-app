import React, { useMemo } from 'react';
import { calculateSessionAttendance, calculateAttendanceRate } from '../../utils/attendanceUtils';
import { calculateLeadsKpis } from '../../utils/leadsUtils';

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const TEACHER_IDS = ['teacher1'];

const formatMoneyShort = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 so'm";
  return Number(amount).toLocaleString('uz-UZ').replace(/[\u00A0,]/g, ' ') + " so'm";
};

const AdminDashboard = ({
  allTeachersData = {},
  setActiveTab,
  onRefresh,
  isSyncing = false
}) => {
  // 1. Current Month Finance Stats Calculation
  const financeStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const currentMonthName = UZBEK_MONTHS[currentMonth];

    let defaultMonthlyFee = 400000;
    try {
      const saved = localStorage.getItem('rsa_default_monthly_fee');
      if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
        defaultMonthlyFee = Number(saved);
      }
    } catch {
      // ignore
    }

    const parseFee = (val) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string' && val.trim() === '') return null;
      const num = Number(val);
      return (!isNaN(num) && num >= 0) ? num : null;
    };

    const getPaymentMonthKey = (p) => {
      if (!p) return '';
      return p.month || (p.date ? String(p.date).substring(0, 7) : '');
    };

    let expectedRevenue = 0;
    let collectedRevenue = 0;
    let totalRemainingDebt = 0;
    let debtorsCount = 0;
    let paidCount = 0;

    // Sum collected revenue across all received payments for currentMonthKey
    TEACHER_IDS.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const payments = tData.payments || [];
      payments.forEach((p) => {
        if (!p || p.deleted) return;
        if (getPaymentMonthKey(p) === currentMonthKey) {
          collectedRevenue += (Number(p.amount) || 0);
        }
      });
    });

    // Sum expected revenue and student debts
    TEACHER_IDS.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter((g) => !g.deleted);
      const students = (tData.students || []).filter((s) => !s.deleted);
      const payments = tData.payments || [];

      const groupsMap = new Map();
      groups.forEach((g) => groupsMap.set(String(g.id), g));

      students.forEach((s) => {
        const group = groupsMap.get(String(s.groupId));
        const sFee = parseFee(s.monthlyFee);
        const gFee = group ? parseFee(group.monthlyFee) : null;
        const fee = sFee !== null ? sFee : (gFee !== null ? gFee : defaultMonthlyFee);

        expectedRevenue += fee;

        const studentPayments = payments.filter((p) => {
          if (!p || p.deleted) return false;
          if (String(p.studentId) !== String(s.id)) return false;
          return getPaymentMonthKey(p) === currentMonthKey;
        });

        const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const debt = Math.max(0, fee - totalPaid);
        totalRemainingDebt += debt;

        if (fee === 0 || totalPaid >= fee) {
          paidCount++;
        } else {
          debtorsCount++;
        }
      });
    });

    const collectionRate = expectedRevenue > 0
      ? Math.min(100, Math.round((collectedRevenue / expectedRevenue) * 100))
      : 0;

    return {
      currentMonthKey,
      currentMonthName,
      currentYear,
      expectedRevenue,
      collectedRevenue,
      totalRemainingDebt,
      collectionRate,
      debtorsCount,
      paidCount
    };
  }, [allTeachersData]);

  // 2. CRM / Leads Stats Calculation
  const leadsStats = useMemo(() => {
    const adminData = allTeachersData.admin || {};
    const leads = Array.isArray(adminData.leads) ? adminData.leads : [];
    return calculateLeadsKpis(leads);
  }, [allTeachersData]);

  // 3. Central Attendance & Students Aggregate Stats
  const aggregatedStats = useMemo(() => {
    let totalStudents = 0;
    let totalAttendanceRecordsCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let totalSessions = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let monthlySessions = 0;
    let monthlyPresent = 0;
    let monthlyAbsent = 0;
    let monthlyLate = 0;
    let monthlyExcused = 0;

    TEACHER_IDS.forEach((tId) => {
      const tData = allTeachersData[tId] || {};
      const allStudents = tData.students || [];
      const activeStudents = allStudents.filter((s) => !s.deleted);
      const attendance = tData.attendance || [];

      totalStudents += activeStudents.length;
      totalSessions += attendance.length;

      attendance.forEach((rec) => {
        let isCurrentMonth = false;
        if (rec.date) {
          const parts = rec.date.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            if (y === currentYear && m === currentMonth) {
              isCurrentMonth = true;
              monthlySessions++;
            }
          }
        }

        const breakdown = calculateSessionAttendance(rec, allStudents);
        totalAttendanceRecordsCount += breakdown.totalMarked;
        presentCount += breakdown.present;
        absentCount += breakdown.absent;
        lateCount += breakdown.late;
        excusedCount += breakdown.excused;
        if (isCurrentMonth) {
          monthlyPresent += breakdown.present;
          monthlyAbsent += breakdown.absent;
          monthlyLate += breakdown.late;
          monthlyExcused += breakdown.excused;
        }
      });
    });

    const attendanceRate = calculateAttendanceRate(
      presentCount,
      absentCount,
      lateCount,
      totalAttendanceRecordsCount,
      excusedCount
    );

    const monthlyTotalMarked = monthlyPresent + monthlyAbsent + monthlyLate + monthlyExcused;
    const monthlyRate = calculateAttendanceRate(
      monthlyPresent,
      monthlyAbsent,
      monthlyLate,
      monthlyTotalMarked,
      monthlyExcused
    );

    return {
      totalStudents,
      totalSessions,
      attendanceRate,
      monthlySessions,
      monthlyPresent,
      monthlyAbsent,
      monthlyLate,
      monthlyExcused,
      monthlyRate
    };
  }, [allTeachersData]);

  return (
    <div className="admin-dashboard-container">
      {/* Page Header */}
      <div className="page-header admin-header-row">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Markazning asosiy moliyaviy, mijozlar va o'quv faoliyati monitoringi
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            className="btn btn-secondary scale-active admin-refresh-btn"
            onClick={onRefresh}
            disabled={isSyncing}
          >
            <span>{isSyncing ? "Yangilanmoqda..." : "Yangilash"}</span>
          </button>
        )}
      </div>

      {/* Global 4 Core Stat Cards */}
      <section className="admin-stats-grid">
        {/* Card 1: Students */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Faol O'quvchilar</h4>
            <p className="admin-stat-value">{aggregatedStats.totalStudents} <span className="admin-stat-unit">nafar</span></p>
          </div>
        </div>

        {/* Card 2: Collected Revenue */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Kassa Tushumi ({financeStats.currentMonthName})</h4>
            <p className="admin-stat-value" style={{ color: '#059669' }}>
              {formatMoneyShort(financeStats.collectedRevenue)}
            </p>
          </div>
        </div>

        {/* Card 3: Remaining Debt */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Qoldiq Qarzdorlik</h4>
            <p className="admin-stat-value" style={{ color: financeStats.totalRemainingDebt > 0 ? '#DC2626' : '#059669' }}>
              {formatMoneyShort(financeStats.totalRemainingDebt)}
            </p>
          </div>
        </div>

        {/* Card 4: Overall Attendance Rate */}
        <div className="glass-card admin-stat-card">
          <div className="admin-stat-info">
            <h4 className="admin-stat-label">Umumiy Davomat</h4>
            <p
              className="admin-stat-value"
              style={{
                color: aggregatedStats.totalSessions === 0
                  ? 'var(--text-tertiary)'
                  : (aggregatedStats.attendanceRate >= 80 ? '#059669' : '#D97706')
              }}
            >
              {aggregatedStats.totalSessions === 0 ? '—' : `${aggregatedStats.attendanceRate}%`}
            </p>
          </div>
        </div>
      </section>

      {/* 1. Kassa va Moliyaviy Nazorat Widget */}
      <section className="admin-preview-section">
        <div className="glass-card admin-preview-card">
          <div className="admin-preview-header">
            <div className="admin-preview-title-row">
              <h3 className="admin-preview-title">Kassa va Moliya</h3>
              <span className="admin-preview-badge">
                {financeStats.currentMonthName} {financeStats.currentYear}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm scale-active admin-view-btn"
              onClick={() => {
                if (setActiveTab) setActiveTab('finance');
              }}
            >
              Kassaga o'tish
            </button>
          </div>

          <div className="admin-preview-grid">
            <div className="admin-stat-box">
              <span className="box-stat-label">Kutilayotgan tushum</span>
              <span className="box-stat-val">{formatMoneyShort(financeStats.expectedRevenue)}</span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Yig'ilgan to'lov</span>
              <span className="box-stat-val" style={{ color: '#059669' }}>
                {formatMoneyShort(financeStats.collectedRevenue)}
              </span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Yig'ilish darajasi</span>
              <span className="box-stat-val" style={{ color: financeStats.collectionRate >= 70 ? '#059669' : '#D97706' }}>
                {financeStats.collectionRate}%
              </span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Qolgan qarzdorlik</span>
              <span className="box-stat-val" style={{ color: financeStats.totalRemainingDebt > 0 ? '#DC2626' : '#059669' }}>
                {formatMoneyShort(financeStats.totalRemainingDebt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Lidlar va CRM Widget */}
      <section className="admin-preview-section">
        <div className="glass-card admin-preview-card">
          <div className="admin-preview-header">
            <div className="admin-preview-title-row">
              <h3 className="admin-preview-title">Lidlar (CRM)</h3>
              <span className="admin-preview-badge">Voronka</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm scale-active admin-view-btn"
              onClick={() => {
                if (setActiveTab) setActiveTab('leads');
              }}
            >
              Lidlarga o'tish
            </button>
          </div>

          <div className="admin-preview-grid">
            <div className="admin-stat-box">
              <span className="box-stat-label">Jami arizalar</span>
              <span className="box-stat-val">{leadsStats.total} <span className="box-unit">ta</span></span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Yangi / Kutilmoqda</span>
              <span className="box-stat-val" style={{ color: leadsStats.newCount > 0 ? '#D97706' : '#059669' }}>
                {leadsStats.newCount} ta
              </span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Sinov darsidagilar</span>
              <span className="box-stat-val" style={{ color: '#7C3AED' }}>
                {leadsStats.trialCount} ta
              </span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Guruhga qabul qilindi</span>
              <span className="box-stat-val" style={{ color: '#059669' }}>
                {leadsStats.convertedCount} <span className="box-unit" style={{ color: '#059669', fontSize: '0.85rem' }}>({leadsStats.conversionRate}%)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Central Attendance Overview Widget */}
      <section className="admin-preview-section">
        <div className="glass-card admin-preview-card">
          <div className="admin-preview-header">
            <div className="admin-preview-title-row">
              <h3 className="admin-preview-title">
                Oylik Davomat ({UZBEK_MONTHS[new Date().getMonth()]} {new Date().getFullYear()})
              </h3>
              <span className="admin-preview-badge">
                {aggregatedStats.monthlyRate}% Qatnashuv
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm scale-active admin-view-btn"
              onClick={() => {
                if (setActiveTab) setActiveTab('attendance');
              }}
            >
              Davomat jurnaliga o'tish
            </button>
          </div>

          <div className="admin-preview-grid">
            <div className="admin-stat-box">
              <span className="box-stat-label">O'tkazilgan darslar</span>
              <span className="box-stat-val">{aggregatedStats.monthlySessions} <span className="box-unit">ta</span></span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Kelganlar</span>
              <span className="box-stat-val" style={{ color: '#059669' }}>
                {aggregatedStats.monthlyPresent}
              </span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Kelmaganlar</span>
              <span className="box-stat-val" style={{ color: '#DC2626' }}>
                {aggregatedStats.monthlyAbsent}
              </span>
            </div>
            <div className="admin-stat-box">
              <span className="box-stat-label">Kechikkanlar</span>
              <span className="box-stat-val" style={{ color: '#D97706' }}>
                {aggregatedStats.monthlyLate}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Scoped CSS Styles for Admin Dashboard */}
      <style>{`
        .admin-dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .admin-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .admin-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 0.84rem;
          font-weight: 600;
        }

        /* 4 Core Stat Cards */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .admin-stat-card {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: var(--radius-lg);
        }

        .admin-stat-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .admin-stat-value {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .admin-stat-unit {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-tertiary);
          margin-left: 2px;
        }

        /* Preview Sections */
        .admin-preview-section {
          width: 100%;
        }

        .admin-preview-card {
          padding: 20px 22px;
          border-radius: var(--radius-xl);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .admin-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .admin-preview-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-preview-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .admin-preview-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .admin-view-btn {
          font-size: 0.82rem;
          font-weight: 600;
          padding: 6px 14px;
        }

        .admin-preview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .admin-stat-box {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        [data-theme="dark"] .admin-preview-card {
          background: #292A2D;
          border-color: #363739;
        }

        [data-theme="dark"] .admin-stat-box {
          background: #18191B;
          border-color: #363739;
        }

        .box-stat-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .box-stat-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .box-unit {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-preview-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .admin-stats-grid {
            grid-template-columns: 1fr;
          }
          .admin-preview-grid {
            grid-template-columns: 1fr;
          }
          .admin-preview-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-view-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
