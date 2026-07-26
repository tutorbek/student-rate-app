import React, { useState, useMemo } from 'react';

const renderAvatar = (emoji) => {
  if (!emoji) return '❓';
  if (emoji.startsWith('http') || emoji.startsWith('data:image') || emoji.includes('/') || emoji.includes('.')) {
    return <img src={emoji} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return emoji;
};

const UZBEK_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const Attendance = ({ groups = [], students = [], attendance = [], onSaveAttendance, showToast, mode }) => {
  const [activeSubTab, setActiveSubTab] = useState('mark'); // 'mark' | 'stats'
  const currentTab = mode || activeSubTab;
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    return groups.length > 0 ? groups[0].id : '';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const getTodayDateString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [timeframe, setTimeframe] = useState('week'); // 'week' | 'month' | 'all'

  // Custom Calendar Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState(() => {
    const d = new Date(getTodayDateString());
    return isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  });
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => {
    const d = new Date(getTodayDateString());
    return isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
  });

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parts[0];
    const mIndex = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d}-${UZBEK_MONTHS[mIndex] || parts[1]}, ${y}`;
  };

  const calendarDays = useMemo(() => {
    const year = calendarViewYear;
    const month = calendarViewMonth;

    const firstDayInstance = new Date(year, month, 1);
    let startDayOfWeek = firstDayInstance.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const totalGridCells = days.length > 35 ? 42 : 35;
    const nextMonthDays = totalGridCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarViewYear, calendarViewMonth]);

  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear((y) => y - 1);
    } else {
      setCalendarViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear((y) => y + 1);
    } else {
      setCalendarViewMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDate = (d) => {
    const formattedMonth = String(d.month + 1).padStart(2, '0');
    const formattedDay = String(d.day).padStart(2, '0');
    const dateStr = `${d.year}-${formattedMonth}-${formattedDay}`;
    setSelectedDate(dateStr);
    setIsDatePickerOpen(false);
  };

  const handleSelectToday = () => {
    const todayStr = getTodayDateString();
    setSelectedDate(todayStr);
    const today = new Date();
    setCalendarViewYear(today.getFullYear());
    setCalendarViewMonth(today.getMonth());
    setIsDatePickerOpen(false);
  };

  // Filter students belonging to the selected group
  const groupStudents = useMemo(() => {
    return students.filter((s) => s.groupId === selectedGroupId && !s.deleted);
  }, [students, selectedGroupId]);

  // Find attendance record for selected group and date
  const currentRecord = useMemo(() => {
    return attendance.find(
      (r) => r.groupId === selectedGroupId && r.date === selectedDate
    );
  }, [attendance, selectedGroupId, selectedDate]);

  const currentRecordsMap = useMemo(() => {
    return currentRecord ? currentRecord.records : {};
  }, [currentRecord]);

  // Helper date filters
  const isDateInCurrentWeek = (dateStr) => {
    const recordDate = new Date(dateStr + 'T00:00:00');
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return recordDate >= startOfWeek && recordDate <= endOfWeek;
  };

  const isDateInCurrentMonth = (dateStr) => {
    const recordDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    return (
      recordDate.getFullYear() === now.getFullYear() &&
      recordDate.getMonth() === now.getMonth()
    );
  };

  // Filter attendance records based on timeframe for statistics
  const filteredAttendanceRecords = useMemo(() => {
    const groupRecords = attendance.filter((r) => r.groupId === selectedGroupId);
    if (timeframe === 'week') {
      return groupRecords.filter((r) => isDateInCurrentWeek(r.date));
    }
    if (timeframe === 'month') {
      return groupRecords.filter((r) => isDateInCurrentMonth(r.date));
    }
    return groupRecords; // 'all'
  }, [attendance, selectedGroupId, timeframe]);

  // Handle marking status of single student
  const handleMarkStatus = (studentId, status) => {
    if (!selectedGroupId || !selectedDate) {
      showToast("Iltimos, guruh va sanani tanlang!", "error");
      return;
    }
    const updatedMap = {
      ...currentRecordsMap,
      [studentId]: status,
    };
    onSaveAttendance(selectedGroupId, selectedDate, updatedMap);
  };

  // Mark all active students in this group as present
  const handleMarkAllPresent = () => {
    if (groupStudents.length === 0) {
      showToast("Bu guruhda o'quvchilar mavjud emas!", "warning");
      return;
    }
    const updatedMap = { ...currentRecordsMap };
    groupStudents.forEach((student) => {
      updatedMap[student.id] = 'present';
    });
    onSaveAttendance(selectedGroupId, selectedDate, updatedMap);
    showToast("Barcha o'quvchilar 'Keldi' deb belgilandi!", "success");
  };

  // Calculate statistics per student
  const studentStats = useMemo(() => {
    if (groupStudents.length === 0) return [];

    const stats = groupStudents.map((student) => {
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let totalLessons = 0;

      filteredAttendanceRecords.forEach((record) => {
        const status = record.records[student.id];
        if (status) {
          totalLessons++;
          if (status === 'present') presentCount++;
          else if (status === 'absent') absentCount++;
          else if (status === 'late') lateCount++;
        }
      });

      // Attendance rate formula: ((Presents + Lates * 0.5) / Total) * 100
      const calculatedPresents = presentCount + lateCount * 0.5;
      const rate = totalLessons > 0 ? Math.round((calculatedPresents / totalLessons) * 100) : 100;

      return {
        student,
        presentCount,
        absentCount,
        lateCount,
        totalLessons,
        rate,
      };
    });

    return stats.sort((a, b) => b.rate - a.rate);
  }, [groupStudents, filteredAttendanceRecords]);

  // Overall Group stats
  const overallGroupStats = useMemo(() => {
    let totalLessonsCount = filteredAttendanceRecords.length;
    if (studentStats.length === 0) {
      return { avgRate: 100, totalLessons: totalLessonsCount };
    }
    const sumRates = studentStats.reduce((sum, s) => sum + s.rate, 0);
    const avgRate = Math.round(sumRates / studentStats.length);
    return { avgRate, totalLessons: totalLessonsCount };
  }, [studentStats, filteredAttendanceRecords]);

  // Sorted list of lesson dates for Matrix
  const sortedDates = useMemo(() => {
    const dates = filteredAttendanceRecords.map((r) => r.date);
    return [...new Set(dates)].sort(); // Chronological
  }, [filteredAttendanceRecords]);



  return (
    <div className="attendance-container">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">{mode === 'stats' ? 'Statistika' : 'Davomad'}</h1>
          <p className="page-subtitle">
            {mode === 'stats' 
              ? "Haftalik, oylik va kurs bo'yicha davomad statistikasi" 
              : "O'quvchilar keldi-kelmadisini hisobga olish va hisobotlar"}
          </p>
        </div>
        
        {/* Tab Switcher (Show only in unified mode) */}
        {!mode && (
          <div className="tab-control-brutalist">
            <button
              className={`tab-btn-brutalist ${currentTab === 'mark' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('mark')}
            >
              ✏️ Kiritish
            </button>
            <button
              className={`tab-btn-brutalist ${currentTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('stats')}
            >
              📊 Statistika
            </button>
          </div>
        )}
      </header>

      {/* Main Filter Toolbar */}
      <section className="glass-card filters-toolbar">
        <div className="filter-item">
          <label className="form-label">Guruh</label>
          {groups.length > 0 ? (
            <div className="custom-select-container">
              <button 
                type="button" 
                className="form-input custom-select-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="selected-value">
                  {selectedGroup ? `${selectedGroup.icon} ${selectedGroup.name}` : 'Guruhni tanlang'}
                </span>
                <span className="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="custom-select-overlay" onClick={() => setIsDropdownOpen(false)} />
                  <div className="custom-select-options glass-card">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`custom-select-option ${g.id === selectedGroupId ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="option-icon">{g.icon}</span>
                        <span className="option-name">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="no-groups-text">Guruhlar mavjud emas.</p>
          )}
        </div>

        {currentTab === 'mark' ? (
          <div className="filter-item">
            <label className="form-label">Sana</label>
            <div className="custom-select-container">
              <button
                type="button"
                className="form-input custom-select-trigger"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <span className="selected-value">
                  📅 {formatDisplayDate(selectedDate)}
                </span>
                <span className="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 6L11 1" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>

              {isDatePickerOpen && (
                <>
                  <div className="custom-select-overlay" onClick={() => setIsDatePickerOpen(false)} />
                  <div className="custom-calendar-popup glass-card">
                    <div className="calendar-header-bar">
                      <button type="button" className="cal-nav-btn" onClick={handlePrevMonth}>◀</button>
                      <span className="cal-month-title">
                        {UZBEK_MONTHS[calendarViewMonth]} {calendarViewYear}
                      </span>
                      <button type="button" className="cal-nav-btn" onClick={handleNextMonth}>▶</button>
                    </div>

                    <div className="calendar-weekdays-row">
                      {WEEKDAYS.map((wd) => (
                        <span key={wd} className="cal-weekday">{wd}</span>
                      ))}
                    </div>

                    <div className="calendar-days-grid">
                      {calendarDays.map((d, idx) => {
                        const m = String(d.month + 1).padStart(2, '0');
                        const dayStr = String(d.day).padStart(2, '0');
                        const fullDateStr = `${d.year}-${m}-${dayStr}`;
                        const isSelected = fullDateStr === selectedDate;
                        const isToday = fullDateStr === getTodayDateString();

                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`cal-day-cell ${!d.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => handleSelectCalendarDate(d)}
                          >
                            {d.day}
                          </button>
                        );
                      })}
                    </div>

                    <div className="calendar-footer-bar">
                      <button type="button" className="cal-today-btn" onClick={handleSelectToday}>
                        Bugun
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="filter-item">
            <label className="form-label">Davr (Filter)</label>
            <div className="segmented-control">
              <button
                className={`seg-btn ${timeframe === 'week' ? 'active' : ''}`}
                onClick={() => setTimeframe('week')}
              >
                Haftalik
              </button>
              <button
                className={`seg-btn ${timeframe === 'month' ? 'active' : ''}`}
                onClick={() => setTimeframe('month')}
              >
                Oylik
              </button>
              <button
                className={`seg-btn ${timeframe === 'all' ? 'active' : ''}`}
                onClick={() => setTimeframe('all')}
              >
                Kurs bo'yicha
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Conditional Sub-Views */}
      {groups.length === 0 ? (
        <div className="empty-state glass-card">
          <p>Davomad kiritish uchun oldin Guruhlar bo'limida guruh yarating.</p>
        </div>
      ) : currentTab === 'mark' ? (
        <div className="mark-view-section">
          {/* Quick Actions Panel */}
          <div className="quick-actions-panel">
            <button className="btn btn-primary scale-active" onClick={handleMarkAllPresent}>
              ✨ Barchani keldi qilish
            </button>
            <div className="date-badge">
              📅 Sana: <strong>{selectedDate}</strong>
            </div>
          </div>

          {/* Student Entry Grid */}
          {groupStudents.length > 0 ? (
            <div className="students-attendance-list">
              {groupStudents.map((student) => {
                const status = currentRecordsMap[student.id];
                return (
                  <div key={student.id} className="student-attendance-row glass-card">
                    <div className="student-profile-side">
                      <div className="student-avatar" style={{ border: `2px solid ${student.color}` }}>
                        {renderAvatar(student.emoji)}
                      </div>
                      <span className="student-name">{student.name}</span>
                    </div>

                    <div className="attendance-options-group">
                      <button
                        className={`attendance-option-btn scale-active present ${
                          status === 'present' ? 'active' : ''
                        }`}
                        onClick={() => handleMarkStatus(student.id, 'present')}
                        title="Keldi"
                      >
                        ✅ Keldi
                      </button>
                      <button
                        className={`attendance-option-btn scale-active absent ${
                          status === 'absent' ? 'active' : ''
                        }`}
                        onClick={() => handleMarkStatus(student.id, 'absent')}
                        title="Kelmadi"
                      >
                        ❌ Kelmadi
                      </button>
                      <button
                        className={`attendance-option-btn scale-active late ${
                          status === 'late' ? 'active' : ''
                        }`}
                        onClick={() => handleMarkStatus(student.id, 'late')}
                        title="Kechikdi"
                      >
                        ⏰ Kechikdi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state glass-card">
              <p>Ushbu guruhda hali o'quvchilar qo'shilmagan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="stats-view-section">
          {/* Stats KPI Dashboard Grid */}
          <div className="stats-kpi-grid">
            <div className="stats-kpi-card glass-card">
              <span className="kpi-label">O'rtacha Davomad</span>
              <span className="kpi-value">{overallGroupStats.avgRate}%</span>
            </div>
            <div className="stats-kpi-card glass-card">
              <span className="kpi-label">O'tilgan Darslar Soni</span>
              <span className="kpi-value">{overallGroupStats.totalLessons} ta</span>
            </div>
          </div>

          {/* Student Stats Summary Table */}
          <div className="glass-card section-container">
            <h2 className="section-title">O'quvchilar Davomad Statistikasi</h2>
            {studentStats.length > 0 ? (
              <div className="table-responsive-brutalist">
                <table className="brutalist-table">
                  <thead>
                    <tr>
                      <th>O'quvchi</th>
                      <th>Kelgan</th>
                      <th>Kelmadi</th>
                      <th>Kechikkan</th>
                      <th>Jami darslar</th>
                      <th>Davomad %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentStats.map(({ student, presentCount, absentCount, lateCount, totalLessons, rate }) => (
                      <tr key={student.id}>
                        <td>
                          <div className="table-student-cell">
                            <span className="table-student-avatar" style={{ backgroundColor: student.color }}>
                              {renderAvatar(student.emoji)}
                            </span>
                            <span>{student.name}</span>
                          </div>
                        </td>
                        <td className="text-center font-bold">{presentCount}</td>
                        <td className="text-center font-bold">{absentCount}</td>
                        <td className="text-center font-bold">{lateCount}</td>
                        <td className="text-center font-bold">{totalLessons}</td>
                        <td>
                          <div className="rate-badge-wrapper">
                            <span className={`rate-badge ${rate >= 90 ? 'good' : rate >= 70 ? 'avg' : 'bad'}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-text">Hozircha ma'lumotlar mavjud emas.</p>
            )}
          </div>

          {/* Attendance Calendar Matrix Heatmap */}
          <div className="glass-card section-container">
            <h2 className="section-title">Kunlik Davomad Matritsasi</h2>
            {sortedDates.length > 0 && studentStats.length > 0 ? (
              <div className="matrix-wrapper-outer">
                <div className="matrix-responsive-container">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">O'quvchi</th>
                        {sortedDates.map((date) => {
                          // Display in format DD/MM
                          const parts = date.split('-');
                          const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
                          return <th key={date} title={date}>{displayDate}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.map(({ student }) => (
                        <tr key={student.id}>
                          <td className="sticky-col font-bold">
                            <span className="matrix-student-name">{student.name}</span>
                          </td>
                          {sortedDates.map((date) => {
                            const record = filteredAttendanceRecords.find((r) => r.date === date);
                            const status = record ? record.records[student.id] : null;

                            let displaySymbol = '-';
                            let statusClass = 'not-recorded';

                            if (status === 'present') {
                              displaySymbol = '✅';
                              statusClass = 'present';
                            } else if (status === 'absent') {
                              displaySymbol = '❌';
                              statusClass = 'absent';
                            } else if (status === 'late') {
                              displaySymbol = '⏰';
                              statusClass = 'late';
                            }

                            return (
                              <td key={date} className={`matrix-cell text-center ${statusClass}`} title={`${date}: ${status || 'No record'}`}>
                                {displaySymbol}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="empty-text">Darslar va davomad yozuvlari mavjud emas.</p>
            )}
          </div>
        </div>
      )}

      {/* Styled JSX for Stark Brutalism Look */}
      <style>{`
        .attendance-container {
          animation: fade-in 0.4s ease-out;
          padding-bottom: 24px;
        }

        .tab-control-brutalist {
          display: flex;
          border: 1px solid #000000;
          background: #ffffff;
        }

        .tab-btn-brutalist {
          padding: 8px 16px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.82rem;
          cursor: pointer;
          color: #000000;
          transition: all var(--transition-fast);
        }

        .tab-btn-brutalist.active {
          background: #000000;
          color: #ffffff;
        }

        .tab-btn-brutalist:first-child {
          border-right: 1px solid #000000;
        }

        .filters-toolbar {
          position: relative;
          z-index: 99;
          display: flex;
          gap: 24px;
          padding: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-item {
          flex: 1;
          min-width: 200px;
        }

        .no-groups-text {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ff3b30;
          padding: 8px 0;
        }

        .segmented-control {
          display: flex;
          border: 1.5px solid #000000;
          width: fit-content;
        }

        .seg-btn {
          background: #ffffff;
          border: none;
          padding: 10px 16px;
          font-family: var(--font-family);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          cursor: pointer;
          color: #000000;
          transition: all var(--transition-fast);
          border-right: 1.5px solid #000000;
        }

        .seg-btn:last-child {
          border-right: none;
        }

        .seg-btn:hover {
          background: var(--accent-neon);
        }

        .seg-btn.active {
          background: #000000;
          color: #ffffff;
        }

        .quick-actions-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .date-badge {
          padding: 8px 14px;
          border: 1.5px solid #000000;
          background: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .students-attendance-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .student-attendance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .student-profile-side {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .student-avatar {
          width: 44px;
          height: 44px;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          overflow: hidden;
          background: #ffffff;
        }

        .student-name {
          font-weight: 700;
          font-size: 1rem;
          color: #000000;
          text-transform: uppercase;
        }

        .attendance-options-group {
          display: flex;
          gap: 8px;
        }

        .attendance-option-btn {
          border: 1.5px solid #000000;
          background: #ffffff;
          color: #000000;
          padding: 8px 16px;
          font-family: var(--font-family);
          font-weight: 700;
          font-size: 0.82rem;
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .attendance-option-btn.present.active {
          background: #000000;
          color: #ffffff;
          box-shadow: 3px 3px 0px var(--accent-neon);
        }

        .attendance-option-btn.absent.active {
          background: #000000;
          color: #ffffff;
          box-shadow: 3px 3px 0px #ff3b30;
        }

        .attendance-option-btn.late.active {
          background: #000000;
          color: #ffffff;
          box-shadow: 3px 3px 0px #ffcc00;
        }

        .attendance-option-btn:hover {
          background: var(--accent-neon);
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.9rem;
        }

        /* Stats Sub-View */
        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .stats-kpi-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .kpi-label {
          font-size: 0.78rem;
          font-weight: 800;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          opacity: 0.7;
        }

        .kpi-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: #000000;
        }

        .section-container {
          padding: 24px;
          margin-bottom: 28px;
        }

        .empty-text {
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          font-size: 0.85rem;
          opacity: 0.6;
        }

        /* Brutalist Table Styles */
        .table-responsive-brutalist {
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
        }

        .brutalist-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .brutalist-table th, .brutalist-table td {
          border: 1px solid #000000;
          padding: 12px 16px;
          font-size: 0.88rem;
        }

        .brutalist-table th {
          background: #000000;
          color: #ffffff;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .brutalist-table tr {
          background: #ffffff;
          transition: background var(--transition-fast);
        }

        .brutalist-table tr:hover {
          background: #fcfcfc;
        }

        .table-student-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .table-student-avatar {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          border: 1px solid #000000;
          overflow: hidden;
        }

        .font-bold {
          font-weight: 700;
        }

        .text-center {
          text-align: center;
        }

        .rate-badge-wrapper {
          display: inline-flex;
        }

        .rate-badge {
          font-weight: 800;
          font-size: 0.85rem;
          padding: 2px 8px;
          border: 1.5px solid #000000;
        }

        .rate-badge.good {
          background: var(--accent-neon);
          color: #000000;
        }

        .rate-badge.avg {
          background: #ffffff;
          color: #000000;
        }

        .rate-badge.bad {
          background: #ff3b30;
          color: #ffffff;
        }

        /* Matrix Table Styles */
        .matrix-wrapper-outer {
          position: relative;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .matrix-responsive-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
        }

        .matrix-table {
          border-collapse: collapse;
          width: max-content;
          min-width: 100%;
        }

        .matrix-table th, .matrix-table td {
          border: 1px solid #000000;
          padding: 10px 14px;
          font-size: 0.8rem;
          height: 48px;
          vertical-align: middle;
        }

        .matrix-table th {
          background: #000000;
          color: #ffffff;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Sticky Columns */
        .matrix-table .sticky-col {
          position: sticky;
          left: 0;
          background: #ffffff;
          z-index: 10;
          border-right: 2px solid #000000;
          width: 160px;
          max-width: 160px;
          min-width: 160px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .matrix-table tr:hover .sticky-col {
          background: #fcfcfc;
        }

        .matrix-table th.sticky-col {
          background: #000000;
          color: #ffffff;
          z-index: 11;
        }

        .matrix-student-name {
          text-transform: uppercase;
        }

        .matrix-cell {
          font-weight: 700;
          transition: background var(--transition-fast);
          min-width: 70px;
          text-align: center;
        }

        .matrix-cell.present {
          background: #e2ffd0;
          color: #000000;
        }

        .matrix-cell.absent {
          background: #ffd0d0;
          color: #000000;
        }

        .matrix-cell.late {
          background: #fff5d0;
          color: #000000;
        }

        .matrix-cell.not-recorded {
          color: #888888;
        }

        /* Custom Select Dropdown Styles */
        .custom-select-container {
          position: relative;
          width: 100%;
        }

        .custom-select-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          cursor: pointer;
          background: #ffffff;
          text-align: left;
          font-weight: 700;
        }

        .custom-select-trigger:hover {
          background: #ffffff;
          border-color: #000000;
        }

        .select-arrow {
          display: flex;
          align-items: center;
          transition: transform var(--transition-fast);
        }

        .custom-select-container:has(.custom-select-options) .select-arrow {
          transform: rotate(180deg);
        }

        .custom-select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 99;
          background: transparent;
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #000000 !important;
          box-shadow: 4px 4px 0px #000000 !important;
          z-index: 100;
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 0;
          border-radius: 0;
        }

        .custom-select-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: #ffffff;
          color: #000000;
          font-family: var(--font-family);
          font-size: 0.95rem;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          width: 100%;
          transition: all var(--transition-fast);
          border-bottom: 1px dashed #e0e0e0;
        }

        .custom-select-option:last-child {
          border-bottom: none;
        }

        .custom-select-option:hover {
          background: var(--accent-neon);
          color: #000000;
        }

        .custom-select-option.active {
          background: #000000;
          color: #ffffff;
        }

        .custom-select-option.active .option-name {
          color: #ffffff;
        }

        /* Custom Calendar Popup Styles */
        .custom-calendar-popup {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 300px;
          background: #ffffff;
          border: 2px solid #000000 !important;
          box-shadow: 6px 6px 0px #000000 !important;
          z-index: 100;
          padding: 14px;
          border-radius: 0;
        }

        .calendar-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid #000000;
          padding-bottom: 8px;
        }

        .cal-month-title {
          font-weight: 800;
          font-size: 0.95rem;
          text-transform: uppercase;
        }

        .cal-nav-btn {
          background: #ffffff;
          border: 1px solid #000000;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.75rem;
          transition: background var(--transition-fast);
        }

        .cal-nav-btn:hover {
          background: var(--accent-neon);
        }

        .calendar-weekdays-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 800;
          font-size: 0.75rem;
          margin-bottom: 8px;
          color: #000000;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .cal-day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e0e0e0;
          background: #ffffff;
          font-family: var(--font-family);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          color: #000000;
          transition: all var(--transition-fast);
        }

        .cal-day-cell:hover {
          background: var(--accent-neon);
          border-color: #000000;
        }

        .cal-day-cell.other-month {
          color: #bbbbbb;
          background: #fafafa;
        }

        .cal-day-cell.today {
          border: 1.5px solid #000000;
          font-weight: 800;
        }

        .cal-day-cell.selected {
          background: #000000 !important;
          color: #ffffff !important;
          border-color: #000000 !important;
        }

        .calendar-footer-bar {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #000000;
          display: flex;
          justify-content: flex-end;
        }

        .cal-today-btn {
          background: var(--accent-neon);
          border: 1.5px solid #000000;
          padding: 4px 12px;
          font-family: var(--font-family);
          font-weight: 800;
          font-size: 0.75rem;
          text-transform: uppercase;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Attendance;
