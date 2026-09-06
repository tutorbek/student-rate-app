import React, { useState, useMemo } from 'react';
import { renderAvatar } from '../../utils/studentAvatars';
import { renderGroupIcon } from '../../utils/groupIcons';

const TEACHER_IDS = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
const TEACHER_LABELS = {
  'teacher1': 'Teacher 1',
  'teacher2': 'Teacher 2',
  'teacher3': 'Teacher 3',
  'teacher4': 'Teacher 4'
};

const AdminGroups = ({
  allTeachersData = {},
  selectedTeacherFilter = 'all',
  onSelectTeacherFilter
}) => {
  const [activeTeacherTab, setActiveTeacherTab] = useState(selectedTeacherFilter || 'all');
  const [selectedGroup, setSelectedGroup] = useState(null); // { group, teacherId, teacherLabel }
  const [searchQuery, setSearchQuery] = useState('');

  // Handle external filter update if prop changes
  React.useEffect(() => {
    if (selectedTeacherFilter) {
      setActiveTeacherTab(selectedTeacherFilter);
    }
  }, [selectedTeacherFilter]);

  const handleTeacherTabChange = (tId) => {
    setActiveTeacherTab(tId);
    if (onSelectTeacherFilter) onSelectTeacherFilter(tId);
    setSelectedGroup(null);
  };

  // Extract all groups across teachers with teacher metadata
  const allFlattenedGroups = useMemo(() => {
    const list = [];
    const targetTeachers = activeTeacherTab === 'all' ? TEACHER_IDS : [activeTeacherTab];

    targetTeachers.forEach(tId => {
      const tData = allTeachersData[tId] || {};
      const groups = (tData.groups || []).filter(g => !g.deleted);
      const students = (tData.students || []).filter(s => !s.deleted);

      groups.forEach(g => {
        const groupStudents = students.filter(s => s.groupId === g.id);

        list.push({
          ...g,
          teacherId: tId,
          teacherLabel: TEACHER_LABELS[tId],
          studentsCount: groupStudents.length,
          rawStudents: groupStudents
        });
      });
    });

    // Natural sort by group name
    return list.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [allTeachersData, activeTeacherTab]);

  // Filter by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allFlattenedGroups;
    const q = searchQuery.toLowerCase();
    return allFlattenedGroups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.teacherLabel.toLowerCase().includes(q)
    );
  }, [allFlattenedGroups, searchQuery]);

  // Group Details View
  if (selectedGroup) {
    const tData = allTeachersData[selectedGroup.teacherId] || {};
    const students = (tData.students || []).filter(s => s.groupId === selectedGroup.id && !s.deleted);
    const attendance = tData.attendance || [];

    // Calculate attendance metrics for each student in this group
    const sortedStudents = [...students].map(s => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let total = 0;

      attendance.forEach(att => {
        if (att.groupId === selectedGroup.id && att.records && att.records[s.id]) {
          total++;
          const st = att.records[s.id];
          if (st === 'present') present++;
          else if (st === 'absent') absent++;
          else if (st === 'late') late++;
        }
      });

      const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;
      return {
        ...s,
        present,
        absent,
        late,
        totalSessions: total,
        rate
      };
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return (
      <div className="admin-groups-container">
        {/* Back and Title Header */}
        <div className="page-header admin-group-detail-header">
          <div className="admin-group-detail-title-row">
            <button
              type="button"
              className="btn btn-secondary scale-active admin-back-btn"
              onClick={() => {
                setSelectedGroup(null);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Orqaga</span>
            </button>

            <div className="admin-group-banner-info">
              <div className="avatar-circle" style={{ width: 44, height: 44, background: '#F5F5F7' }}>
                {renderGroupIcon(selectedGroup.icon, 22)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="page-title text-xl font-bold" style={{ margin: 0 }}>{selectedGroup.name}</h2>
                  <span className="admin-teacher-badge">{selectedGroup.teacherLabel}</span>
                </div>
                <p className="page-subtitle" style={{ margin: '2px 0 0 0' }}>
                  {students.length} ta o'quvchi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students in Group Table / List */}
        <div className="glass-card admin-students-card">
          <div className="admin-table-header-row">
            <h3 className="section-title-main" style={{ fontSize: '1.05rem' }}>
              Guruhdagi o'quvchilar ({sortedStudents.length})
            </h3>
            <span className="read-only-badge">Faqat kuzatuv rejimi</span>
          </div>

          {sortedStudents.length === 0 ? (
            <div className="admin-empty-state">
              <p>Ushbu guruhda hozircha o'quvchilar yo'q.</p>
            </div>
          ) : (
            <div className="admin-students-list">
              {sortedStudents.map((student, idx) => (
                <div key={student.id} className="admin-student-row">
                  <div className="admin-student-left">
                    <span className="admin-rank-num">#{idx + 1}</span>
                    <div className="avatar-circle" style={{ background: student.color || '#F3F4F6', width: 38, height: 38, fontSize: '1.1rem' }}>
                      {renderAvatar(student.emoji)}
                    </div>
                    <div>
                      <h4 className="admin-student-name">{student.name}</h4>
                      <span className="admin-student-sub">
                        {student.totalSessions > 0
                          ? `${student.totalSessions} ta darsdan ${student.present} tasiga qatnashgan`
                          : "Hali dars o'tilmagan"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-student-right">
                    <div
                      className="admin-student-att-pill"
                      style={{
                        background: student.totalSessions === 0 ? '#F3F4F6' : student.rate >= 80 ? '#ECFDF5' : '#FEF3C7',
                        color: student.totalSessions === 0 ? '#6B7280' : student.rate >= 80 ? '#059669' : '#D97706',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: '700'
                      }}
                    >
                      {student.totalSessions > 0 ? `${student.rate}% Davomat` : "Davomad yo'q"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style>{`
          .admin-group-detail-header {
            margin-bottom: 20px;
          }
          .admin-group-detail-title-row {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .admin-back-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            font-size: 0.88rem;
          }
          .admin-group-banner-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .admin-teacher-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: var(--radius-full);
            background: rgba(0, 113, 227, 0.1);
            color: var(--apple-blue);
          }
          .admin-students-card {
            padding: 20px;
            border-radius: var(--radius-lg);
            background: #FFFFFF;
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: var(--shadow-sm);
          }
          .admin-table-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          }
          .read-only-badge {
            font-size: 0.74rem;
            font-weight: 600;
            color: var(--text-tertiary);
            background: #F5F5F7;
            padding: 3px 8px;
            border-radius: var(--radius-sm);
          }
          .admin-empty-state {
            padding: 32px 0;
            text-align: center;
            color: var(--text-tertiary);
            font-size: 0.9rem;
          }
          .admin-students-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .admin-student-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            border-radius: var(--radius-md);
            background: #F9FAFB;
            transition: background var(--transition-fast);
          }
          .admin-student-row:hover {
            background: #F3F4F6;
          }
          .admin-student-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .admin-rank-num {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-tertiary);
            min-width: 24px;
          }
          .admin-student-name {
            font-size: 0.94rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
          }
          .admin-student-sub {
            font-size: 0.78rem;
            color: var(--text-secondary);
          }
          .admin-student-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          [data-theme="dark"] .admin-students-card {
            background: #292A2D;
            border-color: #3C4043;
          }
          [data-theme="dark"] .admin-student-row {
            background: #202124;
          }
          [data-theme="dark"] .admin-student-row:hover {
            background: #3C4043;
          }
        `}</style>
      </div>
    );
  }

  // Groups Overview (Default Grid)
  return (
    <div className="admin-groups-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Guruhlar va O'quvchilar</h2>
          <p className="page-subtitle">Barcha 4 ta ustozning guruhlari va o'quvchilari ro'yxati</p>
        </div>
      </div>

      {/* Teacher Tabs Filter */}
      <div className="admin-teacher-filter-tabs">
        <button
          type="button"
          className={`admin-filter-tab-btn ${activeTeacherTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTeacherTabChange('all')}
        >
          Barcha Ustozlar
        </button>
        {TEACHER_IDS.map(tId => (
          <button
            key={tId}
            type="button"
            className={`admin-filter-tab-btn ${activeTeacherTab === tId ? 'active' : ''}`}
            onClick={() => handleTeacherTabChange(tId)}
          >
            {TEACHER_LABELS[tId]}
          </button>
        ))}
      </div>

      {/* Search Groups */}
      <div className="admin-search-input-box glass-card" style={{ marginBottom: 16 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="admin-search-input"
          placeholder="Guruh nomi bo'yicha saralash..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="admin_groups_search_no_autofill"
        />
        {searchQuery && (
          <button
            type="button"
            className="admin-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Tozalash"
          >
            ✕
          </button>
        )}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="glass-card admin-empty-card">
          <p className="admin-empty-text">Hech qanday guruh topilmadi.</p>
        </div>
      ) : (
        <div className="admin-groups-grid">
          {filteredGroups.map(group => (
            <div
              key={`${group.teacherId}-${group.id}`}
              className="glass-card admin-group-card scale-active"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="admin-group-card-header">
                <div className="avatar-circle" style={{ width: 44, height: 44, background: '#F5F5F7' }}>
                  {renderGroupIcon(group.icon, 22)}
                </div>
                <div className="admin-group-card-titles">
                  <h3 className="admin-group-card-name">{group.name}</h3>
                  <span className="admin-teacher-tag">{group.teacherLabel}</span>
                </div>
              </div>

              <div className="admin-group-card-meta">
                <div className="admin-group-meta-item">
                  <span className="admin-group-meta-label">O'quvchilar</span>
                  <span className="admin-group-meta-val">{group.studentsCount} ta</span>
                </div>
                <div className="admin-group-meta-item">
                  <span className="admin-group-meta-label">Ustoz</span>
                  <span className="admin-group-meta-val">{group.teacherLabel}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm admin-group-open-btn"
              >
                Guruhni ko'rish →
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-groups-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .admin-search-input-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          color: var(--text-secondary);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .admin-search-input-box:focus-within {
          border-color: rgba(0, 0, 0, 0.18);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .admin-search-input {
          flex: 1;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          font-family: var(--font-family);
          font-size: 0.94rem;
          font-weight: 500;
          color: var(--text-primary);
          padding: 0 !important;
          margin: 0 !important;
          -webkit-appearance: none;
          appearance: none;
        }

        .admin-search-input:focus,
        .admin-search-input:focus-visible,
        .admin-search-input:active {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .admin-search-input::placeholder {
          color: var(--text-tertiary);
        }

        .admin-search-clear {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .admin-search-clear:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.06);
        }

        .admin-teacher-filter-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .admin-filter-tab-btn {
          padding: 7px 14px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #FFFFFF;
          font-family: var(--font-family);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .admin-filter-tab-btn.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .admin-groups-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 960px) {
          .admin-groups-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .admin-groups-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-group-card {
          padding: 18px 20px;
          border-radius: var(--radius-lg);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .admin-group-card:hover {
          box-shadow: var(--shadow-md);
        }

        .admin-group-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-group-card-titles {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .admin-group-card-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-group-card-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background: #F5F5F7;
          padding: 8px 12px;
          border-radius: var(--radius-md);
        }

        .admin-group-meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-group-meta-label {
          font-size: 0.68rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .admin-group-meta-val {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .admin-group-open-btn {
          width: 100%;
          justify-content: center;
          font-weight: 600;
        }

        .admin-empty-card {
          padding: 40px;
          text-align: center;
          border-radius: var(--radius-lg);
          background: #FFFFFF;
        }

        .admin-empty-text {
          color: var(--text-tertiary);
          font-size: 0.92rem;
          margin: 0;
        }

        /* Dark Mode */
        [data-theme="dark"] .admin-filter-tab-btn {
          background: #292A2D;
          border-color: #3C4043;
          color: #9AA0A6;
        }

        [data-theme="dark"] .admin-filter-tab-btn.active {
          background: #8AB4F8;
          color: #202124;
          border-color: #8AB4F8;
        }

        [data-theme="dark"] .admin-group-card,
        [data-theme="dark"] .admin-empty-card {
          background: #292A2D;
          border-color: #3C4043;
        }

        [data-theme="dark"] .admin-group-card-meta {
          background: #202124;
        }
      `}</style>
    </div>
  );
};

export default AdminGroups;
