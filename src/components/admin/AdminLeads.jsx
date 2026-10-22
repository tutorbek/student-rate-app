import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import {
  LEAD_STATUSES,
  SUBJECT_OPTIONS,
  SOURCE_OPTIONS,
  COLOR_OPTIONS,
  getDialablePhone,
  formatDisplayPhone,
  formatPhoneInput,
  formatDateTime,
  getTrialDateBadge,
  getTelegramLeadMessage,
  getTelegramUrl,
  calculateLeadsKpis,
  filterAndSortLeads
} from '../../utils/leadsUtils';

const TEACHER_IDS = ['teacher1', 'teacher2', 'teacher3', 'teacher4'];
const TEACHER_LABELS = {
  'teacher1': "Bekzod (O'qituvchi 1)",
  'teacher2': "O'qituvchi 2",
  'teacher3': "O'qituvchi 3",
  'teacher4': "O'qituvchi 4"
};

// Normalize date-time string to YYYY-MM-DDTHH:mm for input[type="datetime-local"] compatibility
const normalizeDateTimeLocal = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return String(dateStr).slice(0, 16);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  } catch {
    return '';
  }
};

const AdminLeads = ({
  allTeachersData = {},
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onConvertLeadToStudent,
  onRefresh,
  isSyncing = false,
  showToast,
  setActiveTab
}) => {
  // Filters & State
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [leadModal, setLeadModal] = useState(null); // { mode: 'create' | 'edit', lead: object }
  const [convertModal, setConvertModal] = useState(null); // { lead: object }
  const [deleteModal, setDeleteModal] = useState(null); // { lead: object }
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states for Lead Modal
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadParentPhone, setLeadParentPhone] = useState('');
  const [leadAge, setLeadAge] = useState('');
  const [leadSubject, setLeadSubject] = useState(SUBJECT_OPTIONS[0]);
  const [leadCustomSubject, setLeadCustomSubject] = useState('');
  const [leadTeacherId, setLeadTeacherId] = useState('any');
  const [leadSource, setLeadSource] = useState(SOURCE_OPTIONS[0]);
  const [leadStatus, setLeadStatus] = useState('new');
  const [leadTrialDate, setLeadTrialDate] = useState('');
  const [leadNote, setLeadNote] = useState('');

  // Form states for Convert Modal
  const [convertName, setConvertName] = useState('');
  const [convertTeacherId, setConvertTeacherId] = useState('teacher1');
  const [convertGroupId, setConvertGroupId] = useState('');
  const [convertAvatar, setConvertAvatar] = useState('lion');
  const [convertColor, setConvertColor] = useState(COLOR_OPTIONS[0].value);
  const [convertMonthlyFee, setConvertMonthlyFee] = useState('');

  // Hook dismiss for modals
  useModalDismiss(Boolean(leadModal || convertModal || deleteModal), () => {
    if (!isProcessing) {
      setLeadModal(null);
      setConvertModal(null);
      setDeleteModal(null);
    }
  });

  // Extract all leads from admin record
  const leads = useMemo(() => {
    const adminData = allTeachersData.admin || {};
    return Array.isArray(adminData.leads) ? adminData.leads : [];
  }, [allTeachersData]);

  // Dynamic teacher names map
  const teachersMap = useMemo(() => {
    const map = {};
    TEACHER_IDS.forEach((tId) => {
      const t = allTeachersData[tId] || {};
      map[tId] = t.teacherProfile?.fullName || TEACHER_LABELS[tId] || tId;
    });
    return map;
  }, [allTeachersData]);

  // KPI Calculations
  const kpis = useMemo(() => {
    return calculateLeadsKpis(leads);
  }, [leads]);

  // Filtered and Sorted Leads
  const filteredLeads = useMemo(() => {
    return filterAndSortLeads(leads, {
      statusFilter,
      subjectFilter,
      teacherFilter,
      sourceFilter,
      searchQuery,
      sortBy
    });
  }, [leads, statusFilter, subjectFilter, teacherFilter, sourceFilter, searchQuery, sortBy]);

  // Open Lead Create Modal
  const handleOpenCreateModal = () => {
    setLeadName('');
    setLeadPhone('');
    setLeadParentPhone('');
    setLeadAge('');
    setLeadSubject(SUBJECT_OPTIONS[0]);
    setLeadCustomSubject('');
    setLeadTeacherId('any');
    setLeadSource(SOURCE_OPTIONS[0]);
    setLeadStatus('new');
    setLeadTrialDate('');
    setLeadNote('');
    setLeadModal({ mode: 'create' });
  };

  // Open Lead Edit Modal
  const handleOpenEditModal = (lead) => {
    setLeadName(lead.name || '');
    setLeadPhone(lead.phone ? formatPhoneInput(lead.phone) : '');
    setLeadParentPhone(lead.parentPhone ? formatPhoneInput(lead.parentPhone) : '');
    setLeadAge(lead.age || '');
    if (SUBJECT_OPTIONS.includes(lead.subject)) {
      setLeadSubject(lead.subject);
      setLeadCustomSubject('');
    } else {
      setLeadSubject('Boshqa');
      setLeadCustomSubject(lead.subject || '');
    }
    setLeadTeacherId(lead.teacherId || 'any');
    setLeadSource(lead.source || SOURCE_OPTIONS[0]);
    setLeadStatus(lead.status || 'new');
    setLeadTrialDate(lead.trialDate ? normalizeDateTimeLocal(lead.trialDate) : '');
    setLeadNote(lead.note || '');
    setLeadModal({ mode: 'edit', lead });
  };

  // Save Lead (Create or Edit)
  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!leadName.trim()) {
      if (showToast) showToast("Iltimos, o'quvchi ismini kiriting!", "warning");
      return;
    }

    const resolvedSubject = leadSubject === 'Boshqa' && leadCustomSubject.trim()
      ? leadCustomSubject.trim()
      : leadSubject;

    setIsProcessing(true);

    const now = new Date().toISOString();
    const leadPayload = {
      name: leadName.trim(),
      phone: leadPhone.trim(),
      parentPhone: leadParentPhone.trim(),
      age: leadAge.trim(),
      subject: resolvedSubject,
      teacherId: leadTeacherId,
      source: leadSource,
      status: leadStatus,
      trialDate: leadTrialDate || '',
      note: leadNote.trim(),
      updatedAt: now
    };

    if (leadModal?.mode === 'create') {
      const newLead = {
        id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        ...leadPayload,
        createdAt: now
      };
      if (onAddLead) {
        await onAddLead(newLead);
      }
    } else if (leadModal?.mode === 'edit' && leadModal.lead) {
      if (onUpdateLead) {
        await onUpdateLead(leadModal.lead.id, leadPayload);
      }
    }

    setIsProcessing(false);
    setLeadModal(null);
  };

  // Quick Status Change directly from card
  const handleQuickStatusChange = async (lead, newStatus) => {
    if (lead.status === newStatus) return;
    if (newStatus === 'converted') {
      handleOpenConvertModal(lead);
      return;
    }
    if (onUpdateLead) {
      await onUpdateLead(lead.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Open Convert to Student Modal
  const handleOpenConvertModal = (lead) => {
    // Select lead's assigned teacher if they have active groups, or find the first teacher with groups
    let chosenTeacher = (lead.teacherId && lead.teacherId !== 'any') ? lead.teacherId : null;
    if (!chosenTeacher || !(allTeachersData[chosenTeacher]?.groups || []).some(g => !g.deleted)) {
      const tWithGroups = TEACHER_IDS.find((tId) => (allTeachersData[tId]?.groups || []).some(g => !g.deleted));
      chosenTeacher = tWithGroups || chosenTeacher || 'teacher1';
    }
    setConvertTeacherId(chosenTeacher);

    const teacherData = allTeachersData[chosenTeacher] || {};
    const groups = (teacherData.groups || []).filter((g) => !g.deleted);
    const firstGroup = groups[0];

    setConvertName(lead.name || '');
    setConvertGroupId(firstGroup ? firstGroup.id : '');
    setConvertAvatar('lion');
    setConvertColor(COLOR_OPTIONS[0].value);
    setConvertMonthlyFee(firstGroup?.monthlyFee ? String(firstGroup.monthlyFee) : '');
    setConvertModal({ lead });
  };

  // Groups available for the selected teacher in convert modal
  const availableGroupsForConvert = useMemo(() => {
    const tData = allTeachersData[convertTeacherId] || {};
    return (tData.groups || []).filter((g) => !g.deleted);
  }, [allTeachersData, convertTeacherId]);

  // Handle teacher change in Convert Modal
  const handleConvertTeacherChange = (newTeacherId) => {
    setConvertTeacherId(newTeacherId);
    const teacherData = allTeachersData[newTeacherId] || {};
    const groups = (teacherData.groups || []).filter((g) => !g.deleted);
    const firstGroup = groups[0];
    setConvertGroupId(firstGroup ? firstGroup.id : '');
    setConvertMonthlyFee(firstGroup?.monthlyFee ? String(firstGroup.monthlyFee) : '');
  };

  // Handle group change in Convert Modal (sync monthly fee)
  const handleConvertGroupChange = (newGroupId) => {
    setConvertGroupId(newGroupId);
    const grp = availableGroupsForConvert.find((g) => String(g.id) === String(newGroupId));
    if (grp?.monthlyFee) {
      setConvertMonthlyFee(String(grp.monthlyFee));
    }
  };

  // Execute Convert Lead to Student
  const handleExecuteConvert = async (e) => {
    e.preventDefault();
    if (!convertModal?.lead) return;
    if (!convertTeacherId) {
      if (showToast) showToast("Iltimos, ustozni tanlang!", "warning");
      return;
    }
    if (!convertGroupId) {
      if (showToast) showToast("Iltimos, guruhni tanlang!", "warning");
      return;
    }

    setIsProcessing(true);

    const lead = convertModal.lead;
    const cleanFee = convertMonthlyFee !== '' ? Number(convertMonthlyFee) : null;
    const finalName = convertName.trim() || lead.name;

    const studentPayload = {
      teacherId: convertTeacherId,
      groupId: convertGroupId,
      name: finalName,
      phone: lead.phone || '',
      parentPhone: lead.parentPhone || '',
      emoji: convertAvatar,
      color: convertColor,
      monthlyFee: cleanFee
    };

    if (onConvertLeadToStudent) {
      await onConvertLeadToStudent(lead.id, studentPayload);
    }

    setIsProcessing(false);
    setConvertModal(null);
  };

  // Delete Lead
  const handleExecuteDelete = async () => {
    if (!deleteModal?.lead) return;
    setIsProcessing(true);
    if (onDeleteLead) {
      await onDeleteLead(deleteModal.lead.id);
    }
    setIsProcessing(false);
    setDeleteModal(null);
  };

  // 1-Click Telegram action: copies text and opens Telegram share URL
  const handleOneClickTelegram = (lead) => {
    const text = getTelegramLeadMessage(lead);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    const tgUrl = getTelegramUrl(lead);
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
    if (showToast) {
      showToast("Telegram arizasi tayyorlandi va ochildi! (Xabar nusxalandi)", "info");
    }
  };

  return (
    <div className="admin-leads-page-container">
      {/* Page Header */}
      <header className="admin-leads-header glass-card">
        <div className="leads-header-title-box">
          <div className="leads-header-title-row">
            <div>
              <h2 className="leads-page-title">Lidlar (CRM)</h2>
            </div>
          </div>
        </div>

        <div className="leads-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm scale-active leads-refresh-btn"
            onClick={onRefresh}
            disabled={isSyncing}
          >
            {isSyncing ? "Yuklanmoqda..." : "Yangilash"}
          </button>

          <button
            type="button"
            className="btn btn-primary scale-active leads-add-btn"
            onClick={handleOpenCreateModal}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
            Yangi Lid Qo'shish
          </button>
        </div>
      </header>

      {/* KPI Cards Row */}
      <section className="leads-kpi-grid">
        <div className="glass-card leads-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Jami arizalar</span>
            <div className="kpi-val-row">
              <span className="kpi-val">{kpis.total}</span>
              <span className="kpi-unit">ta</span>
            </div>
          </div>
        </div>

        <div className="glass-card leads-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Kutilayotgan arizalar</span>
            <div className="kpi-val-row">
              <span className="kpi-val" style={{ color: '#D97706' }}>{kpis.newCount}</span>
              <span className="kpi-unit">ta</span>
            </div>
          </div>
        </div>

        <div className="glass-card leads-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Sinov darsidagilar</span>
            <div className="kpi-val-row">
              <span className="kpi-val" style={{ color: '#7C3AED' }}>{kpis.trialCount}</span>
              <span className="kpi-unit">ta</span>
            </div>
          </div>
        </div>

        <div className="glass-card leads-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Guruhga qabul qilindi</span>
            <div className="kpi-val-row">
              <span className="kpi-val" style={{ color: '#059669' }}>{kpis.convertedCount}</span>
              <span className="kpi-badge-pct">
                {kpis.conversionRate}% konversiya
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Status Tabs Bar */}
      <nav className="leads-status-tabs-bar" aria-label="Lid statuslari filtri">
        <button
          type="button"
          className={`leads-status-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Barchasi <span className="tab-count-badge">{kpis.total}</span>
        </button>
        <button
          type="button"
          className={`leads-status-tab tab-new ${statusFilter === 'new' ? 'active' : ''}`}
          onClick={() => setStatusFilter('new')}
        >
          Yangi <span className="tab-count-badge">{kpis.newCount}</span>
        </button>
        <button
          type="button"
          className={`leads-status-tab tab-contacted ${statusFilter === 'contacted' ? 'active' : ''}`}
          onClick={() => setStatusFilter('contacted')}
        >
          Aloqada <span className="tab-count-badge">{kpis.contactedCount}</span>
        </button>
        <button
          type="button"
          className={`leads-status-tab tab-trial ${statusFilter === 'trial' ? 'active' : ''}`}
          onClick={() => setStatusFilter('trial')}
        >
          Sinov darsi <span className="tab-count-badge">{kpis.trialCount}</span>
        </button>
        <button
          type="button"
          className={`leads-status-tab tab-converted ${statusFilter === 'converted' ? 'active' : ''}`}
          onClick={() => setStatusFilter('converted')}
        >
          Qabul qilingan <span className="tab-count-badge">{kpis.convertedCount}</span>
        </button>
        <button
          type="button"
          className={`leads-status-tab tab-cancelled ${statusFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setStatusFilter('cancelled')}
        >
          Bekor qilingan <span className="tab-count-badge">{kpis.cancelledCount}</span>
        </button>
      </nav>

      {/* Filter and Search Bar */}
      <section className="glass-card leads-controls-card">
        <div className="leads-filters-row">
          {/* Search box */}
          <div className="leads-search-wrap">
            <input
              type="text"
              className="leads-search-input"
              placeholder="Ism, telefon raqami yoki izoh bo'yicha qidiruv..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="leads-clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="leads-select-wrap">
            <select
              className="leads-filter-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">Barcha fanlar</option>
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div className="leads-select-wrap">
            <select
              className="leads-filter-select"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
            >
              <option value="all">Barcha ustozlar</option>
              <option value="any">Ixtiyoriy / Biriktirilmagan</option>
              {TEACHER_IDS.map((tId) => (
                <option key={tId} value={tId}>{teachersMap[tId] || tId}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="leads-select-wrap">
            <select
              className="leads-filter-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">Barcha manbalar</option>
              {SOURCE_OPTIONS.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="leads-select-wrap">
            <select
              className="leads-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Eng yangi arizalar</option>
              <option value="oldest">Eng eski arizalar</option>
              <option value="name">Ism bo'yicha (A-Z)</option>
              <option value="trialDate">Sinov darsi sanasi</option>
            </select>
          </div>
        </div>
      </section>

      {/* Leads Cards Grid */}
      <section className="leads-grid-section">
        {filteredLeads.length === 0 ? (
          <div className="glass-card leads-empty-card">
            <h3 className="leads-empty-title">
              {leads.length === 0 ? "Lidlar yo'q" : "Lid topilmadi"}
            </h3>
            {leads.length === 0 ? (
              <button
                type="button"
                className="btn btn-primary scale-active"
                onClick={handleOpenCreateModal}
                style={{ marginTop: '0.75rem' }}
              >
                + Birinchi Lidni Qo'shish
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => {
                  setStatusFilter('all');
                  setSubjectFilter('all');
                  setTeacherFilter('all');
                  setSourceFilter('all');
                  setSearchQuery('');
                }}
                style={{ marginTop: '0.75rem' }}
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        ) : (
          <div className="leads-cards-grid">
            {filteredLeads.map((lead) => {
              const statusCfg = LEAD_STATUSES[lead.status] || LEAD_STATUSES.new;
              const primaryPhone = lead.parentPhone || lead.phone;
              const dialablePhone = getDialablePhone(primaryPhone);
              const teacherName = lead.teacherId && lead.teacherId !== 'any'
                ? (teachersMap[lead.teacherId] || lead.teacherId)
                : "Ixtiyoriy";

              return (
                <div
                  key={lead.id}
                  className={`glass-card lead-item-card status-${lead.status || 'new'}`}
                >
                  {/* Card Top Row: Monogram, Name, Badges */}
                  <div className="lead-card-header">
                    <div className="lead-avatar-col">
                      <div className="lead-monogram-circle">
                        {(lead.name || 'L').charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="lead-header-info">
                      <div className="lead-title-row">
                        <h4 className="lead-student-name">{lead.name}</h4>
                        {lead.age && (
                          <span className="lead-age-chip">{lead.age}</span>
                        )}
                      </div>

                      <div className="lead-meta-row">
                        <span className="lead-subject-tag">{lead.subject || "Yo'nalish ko'rsatilmagan"}</span>
                        <span className="lead-teacher-tag">{teacherName}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="lead-status-badge-wrap">
                      <span
                        className="lead-status-badge"
                        style={{
                          color: statusCfg.color,
                          backgroundColor: statusCfg.bg,
                          borderColor: statusCfg.border
                        }}
                      >
                        {statusCfg.badge}
                      </span>
                    </div>
                  </div>

                  {/* Card Middle: Contacts and Details */}
                  <div className="lead-card-body">
                    {/* Phones */}
                    <div className="lead-phones-box">
                      <div className="lead-phone-line">
                        <span className="phone-type-label">Ota-onasi:</span>
                        {lead.parentPhone ? (
                          <a
                            href={`tel:${getDialablePhone(lead.parentPhone)}`}
                            className="phone-number phone-link"
                          >
                            {formatDisplayPhone(lead.parentPhone)}
                          </a>
                        ) : (
                          <span className="phone-number missing">Kiritilmagan</span>
                        )}
                      </div>
                      {lead.phone && (
                        <div className="lead-phone-line">
                          <span className="phone-type-label">O'quvchi:</span>
                          <a
                            href={`tel:${getDialablePhone(lead.phone)}`}
                            className="phone-number phone-link"
                          >
                            {formatDisplayPhone(lead.phone)}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Trial Lesson Time */}
                    {lead.trialDate && (() => {
                      const trialBadge = getTrialDateBadge(lead.trialDate);
                      return (
                        <div className={`lead-trial-info-box ${trialBadge ? `trial-${trialBadge.type}` : ''}`}>
                          <span className="trial-text">
                            Sinov darsi: <strong>{formatDateTime(lead.trialDate)}</strong>
                          </span>
                          {trialBadge && (
                            <span className={`trial-timing-tag badge-${trialBadge.type}`}>
                              {trialBadge.label}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Source Tag */}
                    {lead.source && (
                      <div className="lead-source-row">
                        <span className="lead-source-label">Manba:</span>
                        <span className="lead-source-val">{lead.source}</span>
                      </div>
                    )}

                    {/* Note Box */}
                    {lead.note && (
                      <div className="lead-note-box">
                        <p className="note-text">{lead.note}</p>
                      </div>
                    )}

                    {/* Converted Student Banner */}
                    {lead.status === 'converted' && (() => {
                      const cTeacherId = lead.convertedTeacherId;
                      const cGroupId = lead.convertedGroupId;
                      const cTeacherName = cTeacherId ? (teachersMap[cTeacherId] || cTeacherId) : null;
                      const cGroupName = cTeacherId && cGroupId
                        ? (allTeachersData[cTeacherId]?.groups || []).find((g) => String(g.id) === String(cGroupId))?.name
                        : null;
                      return (
                        <div className="lead-converted-banner">
                          <div className="banner-text-col">
                            <span className="banner-main-txt">Muvaffaqiyatli guruhga qabul qilingan</span>
                            {cGroupName && (
                              <span className="banner-group-sub">
                                Guruh: <strong>{cGroupName}</strong> {cTeacherName ? `(${cTeacherName})` : ''}
                              </span>
                            )}
                          </div>
                          {setActiveTab && (
                            <button
                              type="button"
                              className="btn-view-group-link scale-active"
                              onClick={() => setActiveTab('groups')}
                            >
                              Guruh
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card Bottom: Quick Status Changer & Action Toolbar */}
                  <div className="lead-card-footer">
                    {/* Quick Status Dropdown */}
                    <div className="quick-status-wrap">
                      <select
                        className="quick-status-select"
                        value={lead.status || 'new'}
                        onChange={(e) => handleQuickStatusChange(lead, e.target.value)}
                      >
                        <option value="new">Yangi ariza</option>
                        <option value="contacted">Aloqada</option>
                        <option value="trial">Sinov darsi</option>
                        <option value="converted">Qabul qilindi</option>
                        <option value="cancelled">Bekor qilindi</option>
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="lead-actions-row">
                      {/* 1-Click Call */}
                      {dialablePhone ? (
                        <a
                          href={`tel:${dialablePhone}`}
                          className="btn-lead-action btn-call scale-active"
                        >
                          Qo'ng'iroq
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn-lead-action btn-call disabled"
                          disabled
                        >
                          Qo'ng'iroq
                        </button>
                      )}

                      {/* 1-Click Telegram */}
                      <button
                        type="button"
                        className="btn-lead-action btn-telegram scale-active"
                        onClick={() => handleOneClickTelegram(lead)}
                      >
                        Telegram
                      </button>

                      {/* Convert to Student */}
                      {lead.status !== 'converted' && (
                        <button
                          type="button"
                          className="btn-lead-action btn-convert scale-active"
                          onClick={() => handleOpenConvertModal(lead)}
                        >
                          Guruhga qabul
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        type="button"
                        className="btn-lead-action btn-secondary scale-active"
                        onClick={() => handleOpenEditModal(lead)}
                      >
                        Tahrirlash
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="btn-lead-action btn-danger scale-active"
                        onClick={() => setDeleteModal({ lead })}
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: Add or Edit Lead Modal */}
      {leadModal && typeof document !== 'undefined' && createPortal(
        <div className="leads-modal-overlay modal-overlay" onClick={() => !isProcessing && setLeadModal(null)}>
          <div
            className="leads-modal-card modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="leads-modal-header modal-header-fixed">
              <div className="modal-title-box">
                <h3 className="leads-modal-title">
                  {leadModal.mode === 'create' ? "Yangi Lid Qo'shish" : "Lidni Tahrirlash"}
                </h3>
              </div>
              <button
                type="button"
                className="leads-modal-close scale-active"
                onClick={() => !isProcessing && setLeadModal(null)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="leads-modal-form modal-body-scrollable">
              {/* Ismi */}
              <div className="form-group">
                <label className="form-label">
                  O'quvchi F.I.Sh <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masalan: Sardor Rahimov"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Telefonlar */}
              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">Ota-onasi telefoni</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+998 (90) 123-45-67"
                    value={leadParentPhone}
                    onChange={(e) => setLeadParentPhone(formatPhoneInput(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">O'quvchi telefoni</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+998 (90) 987-65-43"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(formatPhoneInput(e.target.value))}
                  />
                </div>
              </div>

              {/* Yoshi va Fani */}
              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">Yoshi yoki sinfi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: 12 yosh / 6-sinf"
                    value={leadAge}
                    onChange={(e) => setLeadAge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qiziqqan fani / yo'nalishi</label>
                  <select
                    className="form-input"
                    value={leadSubject}
                    onChange={(e) => setLeadSubject(e.target.value)}
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom subject if "Boshqa" selected */}
              {leadSubject === 'Boshqa' && (
                <div className="form-group">
                  <label className="form-label">Fanni yozing</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masalan: Grafika, Rus tili..."
                    value={leadCustomSubject}
                    onChange={(e) => setLeadCustomSubject(e.target.value)}
                  />
                </div>
              )}

              {/* Ustoz va Qayerdan eshitgani */}
              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">Qiziqqan ustozi</label>
                  <select
                    className="form-input"
                    value={leadTeacherId}
                    onChange={(e) => setLeadTeacherId(e.target.value)}
                  >
                    <option value="any">Ixtiyoriy / Biriktirilmagan</option>
                    {TEACHER_IDS.map((tId) => (
                      <option key={tId} value={tId}>{teachersMap[tId] || tId}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Qayerdan eshitdi?</label>
                  <select
                    className="form-input"
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                  >
                    {SOURCE_OPTIONS.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status va Sinov darsi sanasi */}
              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">Ariza holati (Status)</label>
                  <select
                    className="form-input"
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                  >
                    <option value="new">Yangi ariza</option>
                    <option value="contacted">Aloqada</option>
                    <option value="trial">Sinov darsida</option>
                    <option value="converted">Qabul qilindi</option>
                    <option value="cancelled">Bekor qilindi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sinov darsi vaqti</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={leadTrialDate}
                    onChange={(e) => setLeadTrialDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Eslatma / Izoh */}
              <div className="form-group">
                <label className="form-label">Eslatma / Izoh</label>
                <textarea
                  className="form-input form-textarea"
                  rows="3"
                  placeholder="Masalan: Dushanba kuni soat 16:00 da qo'ng'iroq qilishni so'radi... (Ctrl+Enter saqlash)"
                  value={leadNote}
                  onChange={(e) => setLeadNote(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveLead(e);
                    }
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div className="leads-modal-actions modal-actions-fixed">
                <button
                  type="button"
                  className="btn btn-secondary scale-active"
                  onClick={() => setLeadModal(null)}
                  disabled={isProcessing}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn btn-primary scale-active"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Convert Lead to Student Modal */}
      {convertModal && typeof document !== 'undefined' && createPortal(
        <div className="leads-modal-overlay modal-overlay" onClick={() => !isProcessing && setConvertModal(null)}>
          <div
            className="leads-modal-card modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="leads-modal-header modal-header-fixed">
              <div className="modal-title-box">
                <h3 className="leads-modal-title">Guruhga Qabul Qilish</h3>
                <p className="leads-modal-sub">
                  <strong>{convertName || convertModal.lead?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                className="leads-modal-close scale-active"
                onClick={() => !isProcessing && setConvertModal(null)}
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteConvert} className="leads-modal-form modal-body-scrollable">
              {/* O'quvchi F.I.Sh */}
              <div className="form-group">
                <label className="form-label">
                  O'quvchi F.I.Sh <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masalan: Sardor Rahimov"
                  value={convertName}
                  onChange={(e) => setConvertName(e.target.value)}
                  required
                />
              </div>

              {/* Ustoz tanlash */}
              <div className="form-group">
                <label className="form-label">Qaysi ustozga biriktiriladi?</label>
                <div className="teacher-pick-grid">
                  {TEACHER_IDS.map((tId) => (
                    <button
                      key={tId}
                      type="button"
                      className={`teacher-pick-btn ${convertTeacherId === tId ? 'selected' : ''}`}
                      onClick={() => handleConvertTeacherChange(tId)}
                    >
                      <span className="teacher-pick-role">Ustoz</span>
                      <strong className="teacher-pick-name">{teachersMap[tId] || tId}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guruh tanlash */}
              <div className="form-group">
                <label className="form-label">
                  Guruhni tanlang <span className="required-star">*</span>
                </label>
                {availableGroupsForConvert.length === 0 ? (
                  <div className="leads-notice-box">
                    Ushbu ustozda hali guruhlar mavjud emas. Avval Guruhlar bo'limida guruh yarating.
                    {setActiveTab && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary scale-active"
                          onClick={() => {
                            setConvertModal(null);
                            setActiveTab('groups');
                          }}
                        >
                          Guruhlar bo'limiga o'tish
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={convertGroupId}
                    onChange={(e) => handleConvertGroupChange(e.target.value)}
                    required
                  >
                    {availableGroupsForConvert.map((g) => {
                      const tData = allTeachersData[convertTeacherId] || {};
                      const studentCount = (tData.students || []).filter((s) => String(s.groupId) === String(g.id)).length;
                      return (
                        <option key={g.id} value={g.id}>
                          {g.name} ({studentCount} o'quvchi) {g.time ? `• ${g.time}` : ''} {g.monthlyFee ? `• ${Number(g.monthlyFee).toLocaleString()} so'm` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Oylik to'lov summasi */}
              <div className="form-group">
                <label className="form-label">Oylik to'lov summasi (so'm)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Masalan: 400000"
                  value={convertMonthlyFee}
                  onChange={(e) => setConvertMonthlyFee(e.target.value)}
                />
              </div>

              {/* Rang tanlash */}
              <div className="form-group">
                <label className="form-label">Fon rangi</label>
                <div className="color-swatches-row">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-swatch-circle scale-active ${convertColor === c.value ? 'selected' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setConvertColor(c.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="leads-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary scale-active"
                  onClick={() => setConvertModal(null)}
                  disabled={isProcessing}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn btn-primary scale-active"
                  disabled={isProcessing || availableGroupsForConvert.length === 0}
                  style={{ background: '#059669', borderColor: '#059669' }}
                >
                  {isProcessing ? "Qo'shilmoqda..." : "Guruhga Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {deleteModal && typeof document !== 'undefined' && createPortal(
        <div className="leads-modal-overlay modal-overlay" onClick={() => !isProcessing && setDeleteModal(null)}>
          <div
            className="leads-modal-card modal-content glass-card delete-confirm-card modal-confirm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="delete-title">
              {deleteModal.lead?.name || 'Lid'}ni o'chirishni tasdiqlaysizmi?
            </h3>

            <div className="leads-modal-actions modal-actions-fixed" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => setDeleteModal(null)}
                disabled={isProcessing}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                className="btn btn-danger scale-active"
                onClick={handleExecuteDelete}
                disabled={isProcessing}
              >
                {isProcessing ? "O'chirilmoqda..." : "Ha, o'chirilsin"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped CSS Styles for AdminLeads */}
      <style>{`
        .admin-leads-page-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding-bottom: 3rem;
          box-sizing: border-box;
        }

        /* Header */
        .admin-leads-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .leads-header-title-box {
          display: flex;
          align-items: center;
        }
        .leads-header-title-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .leads-header-icon {
          font-size: 2rem;
          line-height: 1;
        }
        .leads-page-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.15rem 0;
          letter-spacing: -0.02em;
        }
        .leads-page-subtitle {
          font-size: 0.825rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .leads-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .leads-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .refresh-icon.spinning {
          display: inline-block;
          animation: leadsSpin 1s linear infinite;
        }
        @keyframes leadsSpin {
          100% { transform: rotate(360deg); }
        }
        .leads-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 600;
        }

        /* KPI Grid */
        .leads-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }
        .leads-kpi-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.15rem 1.35rem;
        }
        .kpi-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          overflow: hidden;
        }
        .kpi-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .kpi-val {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.03em;
        }
        .kpi-unit {
          font-size: 0.85rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }
        .kpi-badge-pct {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          background: #D1FAE5;
          color: #047857;
        }

        /* Status Tabs Bar */
        .leads-status-tabs-bar {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
          scrollbar-width: thin;
        }
        .leads-status-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        .leads-status-tab:hover {
          border-color: var(--apple-blue);
          color: var(--apple-blue);
        }
        .leads-status-tab.active {
          background: var(--apple-blue);
          color: #FFFFFF;
          border-color: var(--apple-blue);
        }
        .tab-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 0.35rem;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.08);
          color: inherit;
        }
        .leads-status-tab.active .tab-count-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        /* Filters Controls */
        .leads-controls-card {
          padding: 1rem 1.25rem;
        }
        .leads-filters-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .leads-search-wrap {
          flex: 1 1 240px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 0.85rem;
          font-size: 0.85rem;
          color: var(--text-tertiary);
          pointer-events: none;
        }
        .leads-search-input {
          width: 100%;
          padding: 0.6rem 2.2rem 0.6rem 2.3rem;
          font-size: 0.85rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          transition: all var(--transition-fast);
        }
        .leads-search-input:focus {
          border-color: var(--apple-blue);
          background: var(--bg-card);
        }
        .leads-clear-search-btn {
          position: absolute;
          right: 0.65rem;
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0.2rem;
        }
        .leads-select-wrap {
          flex: 0 1 auto;
        }
        .leads-filter-select {
          padding: 0.6rem 0.85rem;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
        }
        .leads-filter-select:focus {
          border-color: var(--apple-blue);
        }

        /* Empty Card */
        .leads-empty-card {
          text-align: center;
          padding: 3rem 1.5rem;
        }
        .leads-empty-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .leads-empty-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }
        .leads-empty-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 440px;
          margin: 0 auto;
        }

        /* Cards Grid */
        .leads-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.15rem;
        }
        .lead-item-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--border-color-card);
        }
        .lead-item-card.status-new {
          border-left-color: var(--apple-orange, #FF9500);
        }
        .lead-item-card.status-contacted {
          border-left-color: var(--apple-blue, #0171E3);
        }
        .lead-item-card.status-trial {
          border-left-color: var(--apple-purple, #AF52DE);
        }
        .lead-item-card.status-converted {
          border-left-color: var(--apple-green, #34C759);
        }
        .lead-item-card.status-cancelled {
          border-left-color: var(--text-tertiary, #86868B);
        }

        /* Card Header */
        .lead-card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          margin-bottom: 0.85rem;
        }
        .lead-monogram-circle {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, #0155AB, #0171E3);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(1, 113, 227, 0.25);
          flex-shrink: 0;
        }
        .lead-header-info {
          flex: 1;
          overflow: hidden;
        }
        .lead-title-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .lead-student-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .lead-age-chip {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
        }
        .lead-meta-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.3rem;
          flex-wrap: wrap;
        }
        .lead-subject-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.09);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
        }
        .lead-teacher-tag {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .lead-status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          white-space: nowrap;
        }

        /* Card Body */
        .lead-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .lead-phones-box {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: var(--bg-secondary);
          padding: 0.6rem 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .lead-phone-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .phone-type-label {
          color: var(--text-tertiary);
          font-weight: 500;
        }
        .phone-number {
          font-weight: 600;
          color: var(--text-primary);
        }
        .phone-number.phone-link {
          color: var(--apple-blue);
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }
        .phone-number.phone-link:hover {
          text-decoration: underline;
          opacity: 0.85;
        }
        .phone-number.missing {
          color: var(--text-tertiary);
          font-style: italic;
        }
        .lead-trial-info-box {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          padding: 0.45rem 0.65rem;
          border-radius: var(--radius-md);
          background: #EDE9FE;
          color: #6D28D9;
          border: 1px solid #DDD6FE;
          flex-wrap: wrap;
        }
        .trial-timing-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .trial-timing-tag.badge-today {
          background: #DC2626;
          color: #FFFFFF;
        }
        .trial-timing-tag.badge-tomorrow {
          background: #2563EB;
          color: #FFFFFF;
        }
        .trial-timing-tag.badge-past {
          background: #6B7280;
          color: #FFFFFF;
        }
        .lead-source-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        .lead-source-val {
          color: var(--text-secondary);
          font-weight: 600;
        }
        .lead-note-box {
          display: flex;
          align-items: flex-start;
          gap: 0.45rem;
          padding: 0.5rem 0.65rem;
          background: rgba(0, 0, 0, 0.02);
          border-left: 2px solid var(--apple-blue);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .note-text {
          margin: 0;
          line-height: 1.35;
        }
        .lead-converted-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          background: #D1FAE5;
          color: #047857;
        }
        .banner-text-col {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          flex: 1;
        }
        .banner-main-txt {
          font-weight: 700;
        }
        .banner-group-sub {
          font-size: 0.72rem;
          font-weight: 500;
          color: #065F46;
        }
        .btn-view-group-link {
          background: #059669;
          color: #FFFFFF;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-view-group-link:hover {
          background: #047857;
        }

        /* Card Footer */
        .lead-card-footer {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.75rem;
        }
        .quick-status-wrap {
          width: 100%;
        }
        .quick-status-select {
          width: 100%;
          padding: 0.4rem 0.65rem;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
        }
        .lead-actions-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .btn-lead-action {
          flex: 1 1 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.45rem 0.65rem;
          font-size: 0.76rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          text-decoration: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .btn-lead-action.btn-call {
          background: #EFF6FF;
          color: #1D4ED8;
          border-color: #BFDBFE;
        }
        .btn-lead-action.btn-call:hover {
          background: #DBEAFE;
        }
        .btn-lead-action.btn-call.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        .btn-lead-action.btn-telegram {
          background: #E0F2FE;
          color: #0369A1;
          border-color: #BAE6FD;
        }
        .btn-lead-action.btn-telegram:hover {
          background: #BAE6FD;
        }
        .btn-lead-action.btn-convert {
          background: #D1FAE5;
          color: #047857;
          border-color: #A7F3D0;
        }
        .btn-lead-action.btn-convert:hover {
          background: #A7F3D0;
        }
        .btn-lead-action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all var(--transition-fast);
        }
        .btn-lead-action-icon:hover {
          background: var(--bg-tertiary);
          border-color: var(--apple-blue);
        }
        .btn-lead-action-icon.delete-icon:hover {
          background: #FEE2E2;
          border-color: #F87171;
        }

        /* Modal Styles */
        .leads-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          z-index: 9999;
          animation: leadsFadeIn 0.2s ease-out;
        }
        @keyframes leadsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .leads-modal-card {
          width: 100%;
          max-width: 580px;
          max-height: min(640px, calc(100vh - 48px));
          max-height: min(640px, calc(100dvh - 48px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-modal);
          animation: leadsScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 640px) {
          .leads-modal-overlay {
            padding: 12px;
            padding-top: max(12px, env(safe-area-inset-top, 12px));
            padding-bottom: max(16px, calc(env(safe-area-inset-bottom, 16px) + var(--kb-height, 0px)));
            align-items: flex-start;
            justify-content: flex-start;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .leads-modal-card {
            max-height: calc(100vh - 24px - var(--kb-height, 0px));
            max-height: calc(100dvh - 24px - var(--kb-height, 0px));
            padding: 1.25rem 1rem;
            margin-top: 6px;
            margin-bottom: auto;
          }

          .has-keyboard-open .leads-modal-overlay {
            align-items: flex-start !important;
            padding-top: max(8px, env(safe-area-inset-top, 8px)) !important;
            padding-bottom: max(12px, var(--kb-height, 0px)) !important;
          }

          .has-keyboard-open .leads-modal-card {
            margin-top: 0 !important;
            max-height: calc(100vh - 16px - var(--kb-height, 0px)) !important;
            max-height: calc(100dvh - 16px - var(--kb-height, 0px)) !important;
          }
        }
        @keyframes leadsScaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .leads-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .leads-modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }
        .leads-modal-sub {
          font-size: 0.825rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .leads-modal-close {
          background: none;
          border: none;
          font-size: 1.15rem;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 0.35rem;
          border-radius: var(--radius-md);
        }
        .leads-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-row-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
        }
        @media (max-width: 540px) {
          .form-row-two {
            grid-template-columns: 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .form-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .required-star {
          color: #DC2626;
        }
        .form-input {
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          transition: border-color var(--transition-fast);
          font-family: inherit;
        }
        .form-input:focus {
          border-color: var(--apple-blue);
          background: var(--bg-card);
        }
        .form-textarea {
          resize: vertical;
          min-height: 72px;
        }
        .leads-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        /* Teacher pick in Convert Modal */
        .teacher-pick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.5rem;
        }
        .teacher-pick-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.65rem 0.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .teacher-pick-btn.selected {
          border-color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.08);
        }
        .teacher-pick-role {
          font-size: 0.68rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
        }
        .teacher-pick-name {
          font-size: 0.8rem;
          color: var(--text-primary);
          font-weight: 600;
          text-align: center;
        }
        .leads-notice-box {
          font-size: 0.82rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background: #FEF3C7;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        /* Avatar Picker in Convert Modal */
        .leads-avatar-preview-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.4rem;
        }
        .avatar-circle-preview {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .avatar-preview-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .leads-avatar-picker-scroll {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.4rem 0.2rem;
          scrollbar-width: thin;
        }
        .avatar-pick-thumb {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          border: 2px solid transparent;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .avatar-pick-thumb:hover {
          border-color: var(--apple-blue);
        }
        .avatar-pick-thumb.active {
          border-color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.12);
        }

        /* Color Swatches */
        .color-swatches-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .color-swatch-circle {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-full);
          border: 2px solid #FFFFFF;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform var(--transition-fast);
        }
        .color-swatch-circle.selected {
          transform: scale(1.2);
          outline: 2px solid var(--apple-blue);
          outline-offset: 2px;
        }

        /* Delete Confirm Card */
        .delete-confirm-card {
          text-align: center;
          max-width: 420px;
        }
        .delete-icon-box {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .delete-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }
        .delete-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default AdminLeads;
