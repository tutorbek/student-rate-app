import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getGroupCategory } from '../utils/db';
import { renderGroupIcon } from '../utils/groupIcons';
import { renderAvatar } from '../utils/studentAvatars';
import { useModalDismiss } from '../hooks/useModalDismiss';

const UZBEK_CAL_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const UZBEK_CAL_WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const formatNumberWithCommas = (num) => {
  if (num === '' || num === null || num === undefined) return '';
  const digits = String(num).replace(/\D/g, '');
  if (!digits) return '';
  const cleanDigits = digits.replace(/^0+(?=\d)/, '');
  return cleanDigits ? Number(cleanDigits).toLocaleString('en-US') : '';
};

const formatMoneyUz = (num) => {
  const n = Math.round(Number(num) || 0);
  return n.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
};

const IconCalendar = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconChevronLeft = ({ size = 14, strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = ({ size = 14, strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconChevronDown = ({ size = 14, strokeWidth = 2.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconX = ({ size = 15, strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TeacherFinanceView = ({ groups = [], students = [], showToast = () => {} }) => {
  const activeGroups = useMemo(() => groups.filter((g) => !g.deleted), [groups]);
  const activeStudentsCount = useMemo(() => students.filter((s) => !s.deleted).length, [students]);

  const [calcStudentCount, setCalcStudentCount] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_student_count');
    if (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) return Number(saved);
    return 25;
  });

  const [calcPricePerStudent, setCalcPricePerStudent] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_price');
    return (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) ? Number(saved) : 400000;
  });

  const [calcTeacherPercent, setCalcTeacherPercent] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_percent');
    return (saved !== null && !isNaN(Number(saved)) && Number(saved) >= 0 && Number(saved) <= 100) ? Number(saved) : 50;
  });

  const [calcAdvanceAmount, setCalcAdvanceAmount] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_advance_amount');
    if (saved !== null && !isNaN(Number(saved))) return Number(saved);
    return 2000000;
  });

  const [calcAdvanceDay, setCalcAdvanceDay] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_advance_day');
    if (saved !== null && !isNaN(Number(saved))) return Number(saved);
    return 15;
  });

  const [calcSalaryDay, setCalcSalaryDay] = useState(() => {
    const saved = localStorage.getItem('teacher_calc_salary_day');
    if (saved !== null && !isNaN(Number(saved))) return Number(saved);
    return 1;
  });

  useEffect(() => {
    try {
      if (calcStudentCount !== '' && Number(calcStudentCount) > 0) {
        localStorage.setItem('teacher_calc_student_count', String(calcStudentCount));
      }
    } catch {
      // ignore
    }
  }, [calcStudentCount]);

  useEffect(() => {
    try {
      if (calcPricePerStudent !== '') {
        localStorage.setItem('teacher_calc_price', String(calcPricePerStudent));
      }
    } catch {
      // ignore
    }
  }, [calcPricePerStudent]);

  useEffect(() => {
    try {
      localStorage.setItem('teacher_calc_percent', String(calcTeacherPercent));
    } catch {
      // ignore
    }
  }, [calcTeacherPercent]);

  useEffect(() => {
    try {
      if (calcAdvanceAmount !== '') {
        localStorage.setItem('teacher_calc_advance_amount', String(calcAdvanceAmount));
      }
    } catch {
      // ignore
    }
  }, [calcAdvanceAmount]);

  useEffect(() => {
    try {
      localStorage.setItem('teacher_calc_advance_day', String(calcAdvanceDay));
    } catch {
      // ignore
    }
  }, [calcAdvanceDay]);

  useEffect(() => {
    try {
      localStorage.setItem('teacher_calc_salary_day', String(calcSalaryDay));
    } catch {
      // ignore
    }
  }, [calcSalaryDay]);

  // Mini Kalendar va narxlarni formatlash holatlari
  const [calPickerTarget, setCalPickerTarget] = useState(null);
  const [calPickerMonth, setCalPickerMonth] = useState(() => new Date().getMonth());
  const [calPickerYear, setCalPickerYear] = useState(() => new Date().getFullYear());

  const handlePrevCalMonth = (e) => {
    e.stopPropagation();
    if (calPickerMonth === 0) {
      setCalPickerMonth(11);
      setCalPickerYear((y) => y - 1);
    } else {
      setCalPickerMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = (e) => {
    e.stopPropagation();
    if (calPickerMonth === 11) {
      setCalPickerMonth(0);
      setCalPickerYear((y) => y + 1);
    } else {
      setCalPickerMonth((m) => m + 1);
    }
  };

  const miniCalendarGrid = useMemo(() => {
    const firstDay = new Date(calPickerYear, calPickerMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(calPickerYear, calPickerMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calPickerYear, calPickerMonth, 0).getDate();

    const cells = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
      });
    }
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let d = 1; d <= needed; d++) {
        cells.push({
          day: d,
          isCurrentMonth: false,
        });
      }
    }
    return cells;
  }, [calPickerYear, calPickerMonth]);

  const handleFormattedPriceChange = (e, setter) => {
    const input = e.target;
    const cursor = input.selectionStart || 0;
    const rawVal = input.value;
    const digitsBeforeCursor = rawVal.slice(0, cursor).replace(/\D/g, '').length;
    const allDigits = rawVal.replace(/\D/g, '');

    if (allDigits === '') {
      setter('');
      return;
    }

    const cleanDigits = allDigits.replace(/^0+(?=\d)/, '');
    const num = parseInt(cleanDigits, 10);
    setter(isNaN(num) ? '' : Math.max(0, num));

    requestAnimationFrame(() => {
      if (!input) return;
      const formatted = formatNumberWithCommas(cleanDigits);
      let newCursor = 0;
      let countedDigits = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          countedDigits++;
        }
        if (countedDigits >= digitsBeforeCursor) {
          newCursor = i + 1;
          break;
        }
      }
      if (countedDigits < digitsBeforeCursor) {
        newCursor = formatted.length;
      }
      input.setSelectionRange(newCursor, newCursor);
    });
  };

  const grossTotal = Math.max(0, (Number(calcStudentCount) || 0) * (Number(calcPricePerStudent) || 0));
  const teacherShare = Math.round(grossTotal * ((Number(calcTeacherPercent) || 0) / 100));
  const centerShare = Math.max(0, grossTotal - teacherShare);
  const perStudentTeacherShare = Math.round((Number(calcPricePerStudent) || 0) * ((Number(calcTeacherPercent) || 0) / 100));
  const perStudentCenterShare = Math.max(0, (Number(calcPricePerStudent) || 0) - perStudentTeacherShare);

  // Avans va qoldiq maosh hisob-kitoblari
  const rawAdvance = Number(calcAdvanceAmount) || 0;
  const advanceAmount = Math.min(teacherShare, Math.max(0, rawAdvance));
  const remainingSalary = Math.max(0, teacherShare - advanceAmount);
  const advancePercentOfSalary = teacherShare > 0 ? Math.round((advanceAmount / teacherShare) * 100) : 0;
  const remainingPercentOfSalary = Math.max(0, 100 - advancePercentOfSalary);

  const [selectedCalcGroupId, setSelectedCalcGroupId] = useState(null);
  const [calcGroupStudentSearch, setCalcGroupStudentSearch] = useState('');

  const groupsBreakdown = useMemo(() => {
    return activeGroups.map((g) => {
      const gStudents = students.filter((s) => s.groupId === g.id && !s.deleted);
      const count = gStudents.length;
      const gGross = count * (Number(calcPricePerStudent) || 0);
      const gTeacherShare = Math.round(gGross * ((Number(calcTeacherPercent) || 0) / 100));
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        color: g.color,
        category: getGroupCategory(g),
        schedule: g.schedule,
        students: gStudents,
        count,
        gross: gGross,
        teacherShare: gTeacherShare,
      };
    });
  }, [activeGroups, students, calcPricePerStudent, calcTeacherPercent]);

  const selectedCalcGroup = useMemo(() => {
    if (!selectedCalcGroupId) return null;
    return groupsBreakdown.find((g) => g.id === selectedCalcGroupId) || null;
  }, [groupsBreakdown, selectedCalcGroupId]);

  const displayedCalcStudents = useMemo(() => {
    if (!selectedCalcGroup) return [];
    const list = selectedCalcGroup.students || [];
    if (!calcGroupStudentSearch.trim()) return list;
    const q = calcGroupStudentSearch.toLowerCase().trim();
    return list.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [selectedCalcGroup, calcGroupStudentSearch]);

  const totalGroupsStudents = useMemo(() => {
    return groupsBreakdown.reduce((sum, g) => sum + g.count, 0);
  }, [groupsBreakdown]);

  const totalGroupsTeacherShare = useMemo(() => {
    return groupsBreakdown.reduce((sum, g) => sum + g.teacherShare, 0);
  }, [groupsBreakdown]);

  // Guruhlar bo'yicha hisoblangan avans va qoldiq maosh
  const groupsAdvanceShare = Math.round(totalGroupsTeacherShare * (advancePercentOfSalary / 100));
  const groupsRemainingShare = Math.max(0, totalGroupsTeacherShare - groupsAdvanceShare);

  const isAnyModalOpen = Boolean(calPickerTarget || selectedCalcGroupId);
  useModalDismiss(isAnyModalOpen, () => {
    if (calPickerTarget) {
      setCalPickerTarget(null);
    } else if (selectedCalcGroupId) {
      setSelectedCalcGroupId(null);
      setCalcGroupStudentSearch('');
    }
  });

  return (
    <div className="finance-page fade-in">
      {/* Top Page Header */}
      <div className="page-header finance-page-header">
        <div>
          <h2 className="page-title">Moliya</h2>
        </div>
      </div>

          <section className="glass-card settings-card calc-main-card">
            <div className="card-header-flex calc-header-clean">
              <div>
                <h3 className="card-title">Daromad hisobi</h3>
                <span className="calc-header-sub">O'quvchilar va to'lovlar asosida daromad prognozi</span>
              </div>

              {activeStudentsCount > 0 && (
                <button
                  type="button"
                  className="calc-sync-pill scale-active"
                  onClick={() => {
                    setCalcStudentCount(activeStudentsCount);
                    showToast(`Faol o'quvchilar soni (${activeStudentsCount}) o'rnatildi`, 'success');
                  }}
                  title="Tizimdagi joriy faol o'quvchilar sonini o'rnatish"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Tizimdan: <strong>{activeStudentsCount} ta</strong></span>
                </button>
              )}
            </div>

            {/* 2-Column Split: Controls on Left, Results on Right */}
            <div className="calc-split-container">
              {/* Left Column: Parameter Inputs */}
              <div className="calc-controls-col">
                {/* 1. O'quvchilar soni */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">O'quvchilar soni</span>
                    <span className="calc-field-val">
                      {calcStudentCount === '' ? '0 ta' : `${calcStudentCount} ta`}
                    </span>
                  </div>

                  <div className="calc-stepper-row">
                    <button
                      type="button"
                      className="calc-step-btn scale-active"
                      onClick={() => setCalcStudentCount((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                      disabled={Number(calcStudentCount) <= 1}
                      aria-label="Kamaytirish"
                    >
                      −
                    </button>
                    <div className="calc-step-input-wrap">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        className="calc-step-input"
                        value={calcStudentCount}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setCalcStudentCount('');
                            return;
                          }
                          const cleanVal = val.replace(/^0+(?=\d)/, '');
                          const num = parseInt(cleanVal, 10);
                          setCalcStudentCount(isNaN(num) ? '' : Math.max(0, num));
                        }}
                        onBlur={() => {
                          if (calcStudentCount === '' || Number(calcStudentCount) < 1) {
                            setCalcStudentCount(1);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="calc-step-btn scale-active"
                      onClick={() => setCalcStudentCount((prev) => (Number(prev) || 0) + 1)}
                      aria-label="Oshirish"
                    >
                      +
                    </button>
                  </div>

                  <div className="calc-chips-scroll">
                    {[10, 15, 20, 25, 30, 40, 50, 75, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`calc-chip-clean scale-active ${Number(calcStudentCount) === num ? 'active' : ''}`}
                        onClick={() => setCalcStudentCount(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Oylik to'lov */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">Oylik to'lov</span>
                    <span className="calc-field-val">
                      {formatMoneyUz(Number(calcPricePerStudent) || 0)}
                    </span>
                  </div>

                  <div className="calc-price-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="calc-price-input"
                      value={calcPricePerStudent === '' ? '' : formatNumberWithCommas(calcPricePerStudent)}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleFormattedPriceChange(e, setCalcPricePerStudent)}
                      onBlur={() => {
                        if (calcPricePerStudent === '') {
                          setCalcPricePerStudent(0);
                        }
                      }}
                    />
                    <span className="calc-suffix-text">so'm</span>
                  </div>

                  <div className="calc-chips-scroll">
                    {[
                      { label: "250k", val: 250000 },
                      { label: "300k", val: 300000 },
                      { label: "350k", val: 350000 },
                      { label: "400k", val: 400000 },
                      { label: "450k", val: 450000 },
                      { label: "500k", val: 500000 },
                      { label: "600k", val: 600000 },
                      { label: "800k", val: 800000 },
                      { label: "1M", val: 1000000 }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        className={`calc-chip-clean scale-active ${Number(calcPricePerStudent) === preset.val ? 'active' : ''}`}
                        onClick={() => setCalcPricePerStudent(preset.val)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Ulush */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">O'qituvchi ulushi</span>
                    <span className="calc-field-val">{calcTeacherPercent}%</span>
                  </div>

                  <div className="calc-slider-wrap">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="calc-range-slider"
                      value={calcTeacherPercent}
                      onChange={(e) => setCalcTeacherPercent(Number(e.target.value))}
                    />
                    <div className="calc-slider-ticks">
                      {[0, 25, 50, 75, 100].map((t) => (
                        <span
                          key={t}
                          className={`calc-tick-mark ${calcTeacherPercent === t ? 'active' : ''}`}
                          style={{
                            left: `${t}%`,
                            transform: t === 0 ? 'none' : t === 100 ? 'translateX(-100%)' : 'translateX(-50%)',
                          }}
                          onClick={() => setCalcTeacherPercent(t)}
                        >
                          {t}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="calc-chips-scroll">
                    {[30, 40, 50, 60].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`calc-chip-clean scale-active ${calcTeacherPercent === pct ? 'active' : ''}`}
                        onClick={() => setCalcTeacherPercent(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Avans to'lovi (Oldindan to'lov) */}
                <div className="calc-input-block">
                  <div className="calc-label-row">
                    <span className="calc-field-title">Avans to'lovi</span>
                    <span className="calc-field-val">
                      {formatMoneyUz(advanceAmount)}
                      {teacherShare > 0 && (
                        <span className="calc-field-sub-pct"> ({advancePercentOfSalary}%)</span>
                      )}
                    </span>
                  </div>

                  <div className="calc-price-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="calc-price-input"
                      value={calcAdvanceAmount === '' ? '' : formatNumberWithCommas(calcAdvanceAmount)}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleFormattedPriceChange(e, setCalcAdvanceAmount)}
                      onBlur={() => {
                        if (calcAdvanceAmount === '') {
                          setCalcAdvanceAmount(0);
                        }
                      }}
                    />
                    <span className="calc-suffix-text">so'm</span>
                  </div>

                  <div className="calc-chips-scroll">
                    {[
                      { label: "30%", val: Math.round(teacherShare * 0.3) },
                      { label: "40%", val: Math.round(teacherShare * 0.4) },
                      { label: "50%", val: Math.round(teacherShare * 0.5) },
                      { label: "1M", val: 1000000 },
                      { label: "1.5M", val: 1500000 },
                      { label: "2M", val: 2000000 },
                      { label: "2.5M", val: 2500000 },
                      { label: "3M", val: 3000000 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className={`calc-chip-clean scale-active ${Number(calcAdvanceAmount) === preset.val ? 'active' : ''}`}
                        onClick={() => setCalcAdvanceAmount(preset.val)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* To'lov sanalari - Kichik kalendar bilan */}
                  <div className="calc-dates-row">
                    <div className="calc-date-item">
                      <label className="calc-date-lbl">Avans sanasi:</label>
                      <button
                        type="button"
                        className={`calc-date-trigger-btn advance ${calPickerTarget === 'advance' ? 'active' : ''}`}
                        onClick={() => setCalPickerTarget(calPickerTarget === 'advance' ? null : 'advance')}
                      >
                        <div className="calc-date-trigger-left">
                          <span className="calc-date-cal-badge advance">
                            <IconCalendar size={13} />
                          </span>
                          <span className="calc-date-trigger-val">
                            Har oy <strong>{calcAdvanceDay}-kuni</strong>
                          </span>
                        </div>
                        <IconChevronDown size={13} className={`calc-date-trigger-chevron ${calPickerTarget === 'advance' ? 'rotate' : ''}`} />
                      </button>
                    </div>

                    <div className="calc-date-item">
                      <label className="calc-date-lbl">Oylik sanasi:</label>
                      <button
                        type="button"
                        className={`calc-date-trigger-btn salary ${calPickerTarget === 'salary' ? 'active' : ''}`}
                        onClick={() => setCalPickerTarget(calPickerTarget === 'salary' ? null : 'salary')}
                      >
                        <div className="calc-date-trigger-left">
                          <span className="calc-date-cal-badge salary">
                            <IconCalendar size={13} />
                          </span>
                          <span className="calc-date-trigger-val">
                            Har oy <strong>{calcSalaryDay}-kuni</strong>
                          </span>
                        </div>
                        <IconChevronDown size={13} className={`calc-date-trigger-chevron ${calPickerTarget === 'salary' ? 'rotate' : ''}`} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Right Column: Calculated Results */}
              <div className="calc-results-col">
                {/* Hero Card: Teacher's Take-Home */}
                <div className="calc-hero-clean">
                  <div className="calc-hero-top">
                    <span className="calc-hero-label">O'qituvchi jami daromadi</span>
                    <span className="calc-hero-pct">{calcTeacherPercent}%</span>
                  </div>
                  <div className="calc-hero-val">
                    {formatMoneyUz(teacherShare)}
                  </div>
                  <div className="calc-hero-meta">
                    1 o'quvchidan: {formatMoneyUz(perStudentTeacherShare)}
                  </div>
                </div>

                {/* Split Payout Cards: Avans & Oylik */}
                <div className="calc-payouts-grid">
                  {/* Avans Card */}
                  <div className="calc-payout-card advance">
                    <div className="calc-payout-header">
                      <span className="calc-payout-tag">Avans to'lovi</span>
                      <button
                        type="button"
                        className="calc-payout-date-badge is-clickable"
                        onClick={() => setCalPickerTarget('advance')}
                      >
                        Har oy {calcAdvanceDay}-kuni
                      </button>
                    </div>
                    <div className="calc-payout-amount">
                      {formatMoneyUz(advanceAmount)}
                    </div>
                    <div className="calc-payout-sub">
                      Daromadning <strong>{advancePercentOfSalary}%</strong> qismi
                    </div>
                  </div>

                  {/* Qoldiq Oylik Card */}
                  <div className="calc-payout-card remaining">
                    <div className="calc-payout-header">
                      <span className="calc-payout-tag">Qoldiq oylik</span>
                      <button
                        type="button"
                        className="calc-payout-date-badge is-clickable"
                        onClick={() => setCalPickerTarget('salary')}
                      >
                        Har oy {calcSalaryDay}-kuni
                      </button>
                    </div>
                    <div className="calc-payout-amount">
                      {formatMoneyUz(remainingSalary)}
                    </div>
                    <div className="calc-payout-sub">
                      Daromadning <strong>{remainingPercentOfSalary}%</strong> qismi
                    </div>
                  </div>
                </div>

                {/* Payout Progress Timeline Bar */}
                <div className="calc-payout-bar-wrap">
                  <div className="calc-payout-bar-labels">
                    <span className="payout-bar-lbl advance">
                      Avans ({calcAdvanceDay}-kuni): <strong>{formatMoneyUz(advanceAmount)}</strong> ({advancePercentOfSalary}%)
                    </span>
                    <span className="payout-bar-lbl remaining">
                      Oylik ({calcSalaryDay}-kuni): <strong>{formatMoneyUz(remainingSalary)}</strong> ({remainingPercentOfSalary}%)
                    </span>
                  </div>
                  <div className="calc-payout-bar-track">
                    <div
                      className="calc-payout-bar-advance"
                      style={{ width: `${Math.min(100, Math.max(0, advancePercentOfSalary))}%` }}
                    />
                    <div
                      className="calc-payout-bar-remaining"
                      style={{ width: `${Math.min(100, Math.max(0, remainingPercentOfSalary))}%` }}
                    />
                  </div>
                </div>

                {/* Secondary Stats */}
                <div className="calc-stats-dual">
                  <div className="calc-stat-clean">
                    <span className="calc-stat-lbl">Jami tushum</span>
                    <span className="calc-stat-num">{formatMoneyUz(grossTotal)}</span>
                    <span className="calc-stat-sub">{Number(calcStudentCount) || 0} ta o'quvchi</span>
                  </div>

                  <div className="calc-stat-clean">
                    <span className="calc-stat-lbl">Markaz ulushi ({100 - calcTeacherPercent}%)</span>
                    <span className="calc-stat-num">{formatMoneyUz(centerShare)}</span>
                    <span className="calc-stat-sub">1 o'quvchidan: {formatMoneyUz(perStudentCenterShare)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Real Guruhlar Bo'yicha Minimalist Ro'yxat */}
          {activeGroups.length > 0 && (
            <section className="glass-card settings-card calc-groups-clean-card">
              <div className="card-header-flex calc-groups-head">
                <div>
                  <h4 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Guruhlar bo'yicha</h4>
                  <span className="calc-groups-head-sub">{activeGroups.length} ta guruh</span>
                </div>
                <span className="calc-groups-count-badge">{totalGroupsStudents} ta o'quvchi</span>
              </div>

              <div className="calc-groups-table">
                {groupsBreakdown.map((grp) => (
                  <div
                    key={grp.id}
                    className="calc-group-row scale-active"
                    onClick={() => {
                      setSelectedCalcGroupId(grp.id);
                      setCalcGroupStudentSearch('');
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="calc-group-row-left">
                      <div className="calc-group-row-icon avatar-circle">
                        {renderGroupIcon(grp.icon, 18)}
                      </div>
                      <div className="calc-group-row-info">
                        <div className="calc-group-row-name-wrap">
                          <span className="calc-group-row-name">{grp.name}</span>
                          <span className={`group-category-pill group-category-${grp.category}`}>
                            {grp.category === 'kids' ? 'Kids' : 'Teens'}
                          </span>
                        </div>
                        <span className="calc-group-row-count">{grp.count} ta o'quvchi</span>
                      </div>
                    </div>

                    <div className="calc-group-row-right">
                      <div className="calc-group-row-amounts">
                        <span className="calc-group-row-gross">{formatMoneyUz(grp.gross)}</span>
                        <span className="calc-group-row-share">+{formatMoneyUz(grp.teacherShare)}</span>
                      </div>
                      <span className="calc-group-row-arrow">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="calc-groups-total-bar">
                <div className="calc-groups-total-main">
                  <span className="lbl">Jami o'qituvchiga:</span>
                  <span className="val">+{formatMoneyUz(totalGroupsTeacherShare)}</span>
                </div>
                <div className="calc-groups-payout-breakdown">
                  <span className="calc-payout-chip advance">
                    Avans ({calcAdvanceDay}-kuni): <strong>+{formatMoneyUz(groupsAdvanceShare)}</strong>
                  </span>
                  <span className="calc-payout-chip remaining">
                    Oylik ({calcSalaryDay}-kuni): <strong>+{formatMoneyUz(groupsRemainingShare)}</strong>
                  </span>
                </div>
              </div>
            </section>
          )}

      {/* MODAL 7: Kalkulyator Guruh O'quvchilari Ro'yxati */}
      {selectedCalcGroup && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedCalcGroupId(null);
            setCalcGroupStudentSearch('');
          }}
        >
          <div
            className="modal-content glass calc-student-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="calc-student-modal-header">
              <div className="calc-student-modal-head-left">
                <div className="calc-student-modal-group-icon avatar-circle">
                  {renderGroupIcon(selectedCalcGroup.icon, 24)}
                </div>
                <div className="calc-student-modal-head-info">
                  <div className="calc-student-modal-title-row">
                    <h3 className="calc-student-modal-group-name">{selectedCalcGroup.name}</h3>
                    <span className={`group-category-pill group-category-${selectedCalcGroup.category}`}>
                      {selectedCalcGroup.category === 'kids' ? 'Kids' : 'Teens'}
                    </span>
                    <span className="calc-student-modal-count-badge">
                      {selectedCalcGroup.count} ta o'quvchi
                    </span>
                  </div>
                  <div className="calc-student-modal-meta-row">
                    <span>1 o'quvchidan sizga: <strong>+{formatMoneyUz(perStudentTeacherShare)}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn scale-active"
                onClick={() => {
                  setSelectedCalcGroupId(null);
                  setCalcGroupStudentSearch('');
                }}
              >
                <IconX size={15} />
              </button>
            </div>

            {/* Financial Overview Banner */}
            <div className="calc-student-modal-stats-banner">
              <div className="calc-student-stat-item">
                <span className="stat-label">Guruh jami tushumi</span>
                <span className="stat-value">{formatMoneyUz(selectedCalcGroup.gross)}</span>
              </div>
              <div className="calc-student-stat-item highlight">
                <span className="stat-label">O'qituvchiga ({calcTeacherPercent}%)</span>
                <span className="stat-value">+{formatMoneyUz(selectedCalcGroup.teacherShare)}</span>
              </div>
              <div className="calc-student-stat-item advance-box">
                <span className="stat-label">Avans ({calcAdvanceDay}-kuni, {advancePercentOfSalary}%)</span>
                <span className="stat-value">+{formatMoneyUz(Math.round(selectedCalcGroup.teacherShare * (advancePercentOfSalary / 100)))}</span>
              </div>
              <div className="calc-student-stat-item remaining-box">
                <span className="stat-label">Qoldiq ({calcSalaryDay}-kuni, {remainingPercentOfSalary}%)</span>
                <span className="stat-value">+{formatMoneyUz(Math.max(0, selectedCalcGroup.teacherShare - Math.round(selectedCalcGroup.teacherShare * (advancePercentOfSalary / 100))))}</span>
              </div>
            </div>

            {/* Quick Search for Groups with 6+ students */}
            {selectedCalcGroup.students.length > 5 && (
              <div className="calc-student-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="calc-student-search-input"
                  placeholder="O'quvchini qidirish..."
                  value={calcGroupStudentSearch}
                  onChange={(e) => setCalcGroupStudentSearch(e.target.value)}
                  autoFocus={false}
                />
                {calcGroupStudentSearch && (
                  <button
                    type="button"
                    className="calc-student-search-clear"
                    onClick={() => setCalcGroupStudentSearch('')}
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Students List Body */}
            <div className="calc-student-modal-body">
              {displayedCalcStudents.length > 0 ? (
                <div className="calc-students-list">
                  {displayedCalcStudents.map((student, idx) => (
                    <div key={student.id} className="calc-student-card">
                      <span className="calc-student-idx">{idx + 1}.</span>
                      <div className="calc-student-avatar-wrap avatar-circle">
                        {renderAvatar(student.emoji, 32)}
                      </div>
                      <div className="calc-student-main">
                        <span className="calc-student-name">
                          {student.name}
                        </span>
                        {student.phone && (
                          <span className="calc-student-sub">{student.phone}</span>
                        )}
                      </div>
                      <div className="calc-student-share-pill">
                        +{formatMoneyUz(perStudentTeacherShare)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedCalcGroup.students.length > 0 ? (
                <div className="calc-students-empty">
                  <p className="empty-title">O'quvchi topilmadi</p>
                  <p className="empty-sub">"{calcGroupStudentSearch}" bo'yicha hech kim topilmadi.</p>
                </div>
              ) : (
                <div className="calc-students-empty">
                  <div className="empty-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p className="empty-title">Bu guruhda o'quvchilar yo'q</p>
                  <p className="empty-sub">Guruh sahifasiga kirib o'quvchi qo'shishingiz mumkin.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="calc-student-modal-footer">
              <span className="calc-modal-footer-note">
                Jami: <strong>{selectedCalcGroup.count} ta</strong> o'quvchi
              </span>
              <button
                type="button"
                className="btn btn-secondary scale-active"
                onClick={() => {
                  setSelectedCalcGroupId(null);
                  setCalcGroupStudentSearch('');
                }}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 8: Kalkulyator Mini Kalendar (Avans & Oylik Sanasi) */}
      {calPickerTarget && typeof document !== 'undefined' && createPortal(
        <div
          className="calc-calendar-overlay"
          onClick={() => setCalPickerTarget(null)}
        >
          <div
            className={`calc-mini-calendar-popover ${calPickerTarget}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={calPickerTarget === 'advance' ? "Avans to'lovi sanasi" : "Oylik maosh sanasi"}
          >
            {/* Kalendar Header */}
            <div className="cal-mini-header">
              <button
                type="button"
                className="cal-mini-nav-btn scale-active"
                onClick={handlePrevCalMonth}
                aria-label="Oldingi oy"
              >
                <IconChevronLeft size={14} />
              </button>
              <div className="cal-mini-title-wrap">
                <span className="cal-mini-month">
                  {UZBEK_CAL_MONTHS[calPickerMonth]} {calPickerYear}
                </span>
                <span className={`cal-mini-tag ${calPickerTarget}`}>
                  {calPickerTarget === 'advance' ? "Avans sanasi" : "Oylik sanasi"}
                </span>
              </div>
              <button
                type="button"
                className="cal-mini-nav-btn scale-active"
                onClick={handleNextCalMonth}
                aria-label="Keyingi oy"
              >
                <IconChevronRight size={14} />
              </button>
            </div>

            {/* Hafta kunlari */}
            <div className="cal-mini-weekdays">
              {UZBEK_CAL_WEEKDAYS.map((wd, i) => (
                <span key={wd} className={`cal-mini-wd ${i === 6 ? 'sunday' : ''}`}>
                  {wd}
                </span>
              ))}
            </div>

            {/* Kunlar katakchalari */}
            <div className="cal-mini-grid">
              {miniCalendarGrid.map((cell, idx) => {
                const activeDay = calPickerTarget === 'advance' ? calcAdvanceDay : calcSalaryDay;
                const isSelected = cell.day === activeDay && cell.isCurrentMonth;
                const isSunday = (idx % 7) === 6;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`cal-mini-cell scale-active ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSunday ? 'sunday' : ''} ${isSelected ? `selected ${calPickerTarget}` : ''}`}
                    onClick={() => {
                      if (calPickerTarget === 'advance') {
                        setCalcAdvanceDay(cell.day);
                      } else {
                        setCalcSalaryDay(cell.day);
                      }
                      setCalPickerTarget(null);
                    }}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Pastki qism: Tezkor sanalar va Yopish */}
            <div className="cal-mini-footer">
              <div className="cal-mini-presets">
                <span className="cal-mini-presets-lbl">Tezkor:</span>
                {(calPickerTarget === 'advance' ? [5, 10, 15, 20, 25] : [1, 3, 5, 10]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`cal-mini-preset-chip scale-active ${((calPickerTarget === 'advance' ? calcAdvanceDay : calcSalaryDay) === d) ? 'active' : ''}`}
                    onClick={() => {
                      if (calPickerTarget === 'advance') {
                        setCalcAdvanceDay(d);
                      } else {
                        setCalcSalaryDay(d);
                      }
                      setCalPickerTarget(null);
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="cal-mini-close-btn scale-active"
                onClick={() => setCalPickerTarget(null)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      <style>{`
        .finance-page {
          width: 100%;
          padding-bottom: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .finance-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .group-category-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 54px;
          height: 20px;
          box-sizing: border-box;
          text-align: center;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 0 6px;
          border-radius: var(--radius-full, 9999px);
          user-select: none;
          white-space: nowrap;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .group-category-pill.group-category-kids {
          background: rgba(255, 149, 0, 0.12);
          color: #d97706;
          border: 1px solid rgba(255, 149, 0, 0.3);
        }

        .group-category-pill.group-category-teens {
          background: rgba(88, 86, 214, 0.12);
          color: #4f46e5;
          border: 1px solid rgba(88, 86, 214, 0.3);
        }

        [data-theme="dark"] .group-category-pill.group-category-kids {
          background: rgba(255, 159, 10, 0.18);
          color: #fbbf24;
          border-color: rgba(255, 159, 10, 0.35);
        }

        [data-theme="dark"] .group-category-pill.group-category-teens {
          background: rgba(99, 102, 241, 0.18);
          color: #818cf8;
          border-color: rgba(99, 102, 241, 0.35);
        }

        /* Card Header & Title Defaults */
        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          width: 100%;
        }

        .card-title {
          font-size: 1.08rem;
          font-weight: 700;
          color: var(--text-primary, #1D1D1F);
          letter-spacing: -0.01em;
          margin: 0;
        }

        /* Minimalist Teacher Earnings Calculator */
        .calc-main-card {
          margin-bottom: 18px;
        }

        .calc-header-clean {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
        }

        .calc-header-sub {
          font-size: 0.76rem;
          color: var(--text-tertiary, #86868B);
          display: block;
          margin-top: 3px;
        }

        .calc-sync-pill {
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: var(--radius-full, 9999px);
          background: rgba(0, 113, 227, 0.08);
          border: 1px solid rgba(0, 113, 227, 0.2);
          color: #0071E3;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          white-space: nowrap;
          user-select: none;
        }

        .calc-sync-pill:hover {
          background: rgba(0, 113, 227, 0.15);
          border-color: rgba(0, 113, 227, 0.35);
        }

        .calc-split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .calc-controls-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .calc-input-block {
          background: #F9FAFB;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .calc-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calc-field-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-field-val {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .calc-field-sub-pct {
          font-size: 0.78rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .calc-stepper-row {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          height: 42px;
        }

        .calc-step-btn {
          width: 44px;
          height: 100%;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }

        .calc-step-btn:hover:not(:disabled) {
          background: #F2F4F7;
        }

        .calc-step-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .calc-step-input-wrap {
          flex: 1;
          height: 100%;
          border-left: 1px solid rgba(0, 0, 0, 0.06);
          border-right: 1px solid rgba(0, 0, 0, 0.06);
        }

        .calc-step-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          text-align: center;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          background: transparent;
          box-sizing: border-box;
          font-variant-numeric: tabular-nums;
        }

        .calc-price-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          height: 42px;
          overflow: hidden;
        }

        .calc-price-input {
          flex: 1;
          height: 100%;
          border: none;
          outline: none;
          padding: 0 54px 0 14px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          background: transparent;
          box-sizing: border-box;
          font-variant-numeric: tabular-nums;
        }

        .calc-suffix-text {
          position: absolute;
          right: 14px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .calc-chips-scroll {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }

        .calc-chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .calc-chip-clean {
          padding: 4px 10px;
          font-size: 0.74rem;
          font-weight: 600;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .calc-chip-clean:hover {
          color: var(--text-primary);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .calc-chip-clean.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .calc-slider-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 4px 0;
        }

        .calc-range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
          background: #E5E7EB;
          cursor: pointer;
        }

        .calc-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1D1D1F;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }

        .calc-slider-ticks {
          position: relative;
          width: 100%;
          height: 18px;
          margin-top: 4px;
        }

        .calc-tick-mark {
          position: absolute;
          font-size: 0.72rem;
          color: var(--text-tertiary);
          font-weight: 500;
          cursor: pointer;
          user-select: none;
          transition: color 0.15s ease, font-weight 0.15s ease;
        }

        .calc-tick-mark:hover {
          color: var(--text-primary);
        }

        .calc-tick-mark.active {
          color: var(--text-primary);
          font-weight: 700;
        }

        .calc-dates-row {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed rgba(0, 0, 0, 0.08);
        }

        .calc-date-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        .calc-date-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-date-trigger-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 10px;
          border-radius: var(--radius-md, 8px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #FFFFFF;
          color: var(--text-primary);
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          box-sizing: border-box;
          gap: 6px;
        }

        .calc-date-trigger-btn:hover {
          border-color: rgba(0, 0, 0, 0.22);
          background: #FAFAFA;
        }

        .calc-date-trigger-btn.active.advance {
          border-color: var(--apple-blue);
          box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.15);
          background: #FFFFFF;
        }

        .calc-date-trigger-btn.active.salary {
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
          background: #FFFFFF;
        }

        .calc-date-trigger-left {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .calc-date-cal-badge {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .calc-date-cal-badge.advance {
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue);
        }

        .calc-date-cal-badge.salary {
          background: rgba(5, 150, 105, 0.1);
          color: #059669;
        }

        .calc-date-trigger-val {
          font-size: 0.78rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calc-date-trigger-val strong {
          font-weight: 700;
        }

        .calc-date-trigger-chevron {
          color: var(--text-tertiary);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .calc-date-trigger-chevron.rotate {
          transform: rotate(180deg);
        }

        /* Modal Calendar Overlay */
        .calc-calendar-overlay {
          position: fixed;
          inset: 0;
          z-index: 2500;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          animation: calOverlayFade 0.18s ease-out forwards;
        }

        @keyframes calOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Mini Calendar Popover Modal */
        .calc-mini-calendar-popover {
          position: relative;
          width: 100%;
          max-width: 310px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.06);
          padding: 16px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: calScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
        }

        @keyframes calScaleIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .cal-mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 2px;
        }

        .cal-mini-nav-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #F9FAFB;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .cal-mini-nav-btn:hover {
          background: #F0F2F5;
          color: var(--text-primary);
        }

        .cal-mini-title-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .cal-mini-month {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cal-mini-tag {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 999px;
        }

        .cal-mini-tag.advance {
          color: var(--apple-blue);
          background: rgba(0, 113, 227, 0.1);
        }

        .cal-mini-tag.salary {
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
        }

        .cal-mini-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          text-align: center;
        }

        .cal-mini-wd {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        .cal-mini-wd.sunday {
          color: #EF4444;
        }

        .cal-mini-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }

        .cal-mini-cell {
          height: 30px;
          border-radius: 7px;
          border: none;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s ease;
          user-select: none;
        }

        .cal-mini-cell:hover:not(.selected) {
          background: #F3F4F6;
        }

        .cal-mini-cell.other-month {
          opacity: 0.35;
        }

        .cal-mini-cell.sunday:not(.selected) {
          color: #EF4444;
        }

        .cal-mini-cell.selected.advance {
          background: var(--apple-blue);
          color: #FFFFFF;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 113, 227, 0.4);
        }

        .cal-mini-cell.selected.salary {
          background: #059669;
          color: #FFFFFF;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        }

        .cal-mini-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding-top: 7px;
          margin-top: 1px;
          gap: 6px;
        }

        .cal-mini-presets {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          flex: 1;
        }

        .cal-mini-presets-lbl {
          font-size: 0.68rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .cal-mini-preset-chip {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #F9FAFB;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .cal-mini-preset-chip:hover {
          border-color: rgba(0, 0, 0, 0.2);
          color: var(--text-primary);
        }

        .cal-mini-preset-chip.active {
          background: #1D1D1F;
          color: #FFFFFF;
          border-color: #1D1D1F;
        }

        .cal-mini-close-btn {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-tertiary);
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .cal-mini-close-btn:hover {
          color: var(--text-primary);
          background: #F3F4F6;
        }

        .calc-payout-date-badge.is-clickable {
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          transition: transform 0.15s ease, filter 0.15s ease;
        }

        .calc-payout-date-badge.is-clickable:hover {
          transform: scale(1.04);
          filter: brightness(0.96);
        }

        /* Results Column */
        .calc-results-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .calc-hero-clean {
          background: #18191B;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .calc-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calc-hero-label {
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.65);
        }

        .calc-hero-pct {
          font-size: 0.74rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 8px;
          border-radius: var(--radius-full, 9999px);
        }

        .calc-hero-val {
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
          line-height: 1.2;
        }

        .calc-hero-meta {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .calc-stats-dual {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .calc-stat-clean {
          background: #F9FAFB;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .calc-stat-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-stat-num {
          font-size: 1.08rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .calc-stat-sub {
          font-size: 0.7rem;
          color: var(--text-tertiary);
        }

        /* Split Payout Cards: Avans & Oylik */
        .calc-payouts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .calc-payout-card {
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: #FFFFFF;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .calc-payout-card.advance {
          border-color: rgba(0, 113, 227, 0.2);
          background: linear-gradient(135deg, rgba(0, 113, 227, 0.04) 0%, rgba(0, 113, 227, 0.01) 100%);
        }

        .calc-payout-card.remaining {
          border-color: rgba(5, 150, 105, 0.2);
          background: linear-gradient(135deg, rgba(5, 150, 105, 0.04) 0%, rgba(5, 150, 105, 0.01) 100%);
        }

        .calc-payout-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          flex-wrap: wrap;
        }

        .calc-payout-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .calc-payout-card.advance .calc-payout-tag {
          color: var(--apple-blue);
        }

        .calc-payout-card.remaining .calc-payout-tag {
          color: #059669;
        }

        .calc-payout-date-badge {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-secondary);
        }

        .calc-payout-card.advance .calc-payout-date-badge {
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue);
        }

        .calc-payout-card.remaining .calc-payout-date-badge {
          background: rgba(5, 150, 105, 0.1);
          color: #059669;
        }

        .calc-payout-amount {
          font-size: 1.18rem;
          font-weight: 800;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
          margin-top: 2px;
        }

        .calc-payout-card.advance .calc-payout-amount {
          color: #0171E3;
        }

        .calc-payout-card.remaining .calc-payout-amount {
          color: #059669;
        }

        .calc-payout-sub {
          font-size: 0.7rem;
          color: var(--text-tertiary);
        }

        /* Payout Timeline Progress Bar */
        .calc-payout-bar-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          background: #F9FAFB;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .calc-payout-bar-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          gap: 8px;
          flex-wrap: wrap;
        }

        .payout-bar-lbl {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .payout-bar-lbl.advance strong {
          color: #0171E3;
        }

        .payout-bar-lbl.remaining strong {
          color: #059669;
        }

        .calc-payout-bar-track {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: #E5E7EB;
          display: flex;
          overflow: hidden;
        }

        .calc-payout-bar-advance {
          height: 100%;
          background: #0171E3;
          transition: width 0.3s ease;
        }

        .calc-payout-bar-remaining {
          height: 100%;
          background: #059669;
          transition: width 0.3s ease;
        }

        /* Minimal Groups Table */
        .calc-groups-clean-card {
          margin-top: 18px;
        }

        .calc-groups-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
        }

        .calc-groups-head-sub {
          font-size: 0.74rem;
          color: var(--text-tertiary);
        }

        .calc-groups-count-badge {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: #F2F4F7;
          padding: 4px 10px;
          border-radius: var(--radius-full, 9999px);
        }

        .calc-groups-table {
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .calc-group-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 14px;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
          user-select: none;
        }

        .calc-group-row:last-child {
          border-bottom: none;
        }

        .calc-group-row:hover {
          background: rgba(0, 113, 227, 0.04);
        }

        .calc-group-row:active {
          transform: scale(0.995);
        }

        .calc-group-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .calc-group-row-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          flex-shrink: 0;
        }

        .calc-group-row-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .calc-group-row-name-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .calc-group-row-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calc-group-row-count {
          font-size: 0.74rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .calc-group-row-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .calc-group-row-amounts {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .calc-group-row-gross {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .calc-group-row-share {
          font-size: 0.88rem;
          font-weight: 700;
          color: #059669;
          font-variant-numeric: tabular-nums;
        }

        .calc-group-row-arrow {
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .calc-group-row:hover .calc-group-row-arrow {
          color: var(--apple-blue);
          transform: translateX(2px);
        }

        /* Calculator Students List Modal */
        .calc-student-list-modal {
          max-width: 480px;
          width: 100%;
          padding: 22px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-radius: var(--radius-xl);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          max-height: min(620px, calc(100dvh - 48px));
          height: auto;
          box-sizing: border-box;
        }

        .calc-student-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .calc-student-modal-head-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .calc-student-modal-group-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .calc-student-modal-head-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }

        .calc-student-modal-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .calc-student-modal-group-name {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .calc-student-modal-count-badge {
          font-size: 0.74rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(0, 113, 227, 0.1);
          color: var(--apple-blue);
          white-space: nowrap;
        }

        .calc-student-modal-meta-row {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .calc-student-modal-stats-banner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .calc-student-stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .calc-student-stat-item .stat-label {
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .calc-student-stat-item .stat-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .calc-student-stat-item.highlight .stat-value {
          color: #059669;
        }

        .calc-student-stat-item.advance-box .stat-value {
          color: #0171E3;
        }

        .calc-student-stat-item.remaining-box .stat-value {
          color: #059669;
        }

        .calc-student-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-tertiary);
          transition: all 0.15s ease;
        }

        .calc-student-search-wrap:focus-within {
          border-color: var(--apple-blue);
          background: #FFFFFF;
          box-shadow: none !important;
          outline: none !important;
        }

        .calc-student-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .calc-student-search-clear {
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: 0 4px;
        }

        .calc-student-modal-body {
          flex: 1 1 auto;
          min-height: 0;
          max-height: 340px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          overscroll-behavior: contain;
        }

        .calc-students-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .calc-student-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: background 0.15s ease;
        }

        .calc-student-card:hover {
          background: #F9FAFB;
        }

        .calc-student-idx {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-tertiary);
          min-width: 20px;
          font-variant-numeric: tabular-nums;
        }

        .calc-student-avatar-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.04);
        }

        .calc-student-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .calc-student-name {
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calc-student-sub {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .calc-student-share-pill {
          font-size: 0.8rem;
          font-weight: 700;
          color: #059669;
          font-variant-numeric: tabular-nums;
          background: rgba(5, 150, 105, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .calc-students-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
        }

        .calc-students-empty .empty-icon-wrap {
          font-size: 2rem;
          margin-bottom: 8px;
          opacity: 0.7;
        }

        .calc-students-empty .empty-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .calc-students-empty .empty-sub {
          font-size: 0.8rem;
          color: var(--text-tertiary);
          margin: 0;
        }

        .calc-student-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
          gap: 12px;
        }

        .calc-modal-footer-note {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .calc-groups-total-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px 14px;
          background: #F9FAFB;
          border-radius: 10px;
          margin-top: 10px;
          font-size: 0.82rem;
        }

        .calc-groups-total-main {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .calc-groups-total-main .lbl {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .calc-groups-total-main .val {
          font-weight: 800;
          color: #059669;
          font-size: 1.05rem;
          font-variant-numeric: tabular-nums;
        }

        .calc-groups-payout-breakdown {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .calc-payout-chip {
          font-size: 0.72rem;
          font-weight: 500;
          padding: 3px 9px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .calc-payout-chip.advance {
          background: rgba(0, 113, 227, 0.08);
          color: #0171E3;
        }

        .calc-payout-chip.advance strong {
          color: #0171E3;
        }

        .calc-payout-chip.remaining {
          background: rgba(5, 150, 105, 0.08);
          color: #059669;
        }

        .calc-payout-chip.remaining strong {
          color: #059669;
        }


        @media (max-width: 768px) {
          .calc-split-container {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .calc-results-col {
            display: contents;
          }

          .calc-hero-clean {
            order: 1;
            padding: 16px 18px;
            border-radius: 14px;
          }

          .calc-hero-val {
            font-size: clamp(1.55rem, 6.5vw, 1.85rem);
            line-height: 1.15;
          }

          .calc-controls-col {
            order: 2;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .calc-input-block {
            padding: 12px 14px;
            gap: 8px;
          }

          .calc-stepper-row {
            height: 44px;
          }

          .calc-step-btn {
            width: 46px;
            font-size: 1.3rem;
          }

          .calc-price-input-wrap {
            height: 44px;
          }

          .calc-range-slider {
            height: 8px;
          }

          .calc-range-slider::-webkit-slider-thumb {
            width: 22px;
            height: 22px;
          }

          .calc-slider-ticks {
            height: 22px;
            margin-top: 6px;
          }

          .calc-tick-mark {
            font-size: 0.72rem;
            padding: 4px 6px;
          }

          .calc-chips-scroll {
            gap: 6px;
            padding: 2px 0 4px;
          }

          .calc-chip-clean {
            padding: 5px 12px;
            font-size: 0.76rem;
            min-height: 30px;
          }

          .calc-dates-row {
            grid-template-columns: 1fr;
            gap: 8px;
            margin-top: 10px;
            padding-top: 10px;
          }

          .calc-date-trigger-btn {
            height: 44px;
            padding: 0 12px;
            font-size: 0.82rem;
          }

          .calc-payouts-grid {
            order: 3;
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .calc-payout-card {
            padding: 12px 14px;
          }

          .calc-payout-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .calc-payout-amount {
            font-size: 1.25rem;
          }

          .calc-payout-bar-wrap {
            order: 4;
            padding: 12px;
            gap: 8px;
          }

          .calc-payout-bar-labels {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
            font-size: 0.72rem;
          }

          .calc-stats-dual {
            order: 5;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .calc-stat-clean {
            padding: 10px 12px;
            min-width: 0;
          }

          .calc-stat-lbl {
            font-size: 0.68rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .calc-stat-num {
            font-size: clamp(0.92rem, 3.6vw, 1.05rem);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .calc-stat-sub {
            font-size: 0.68rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .calc-groups-clean-card {
            margin-top: 14px;
          }

          .calc-groups-head {
            margin-bottom: 10px;
          }

          .calc-group-row {
            padding: 10px 12px;
            gap: 8px;
          }

          .calc-group-row-left {
            gap: 10px;
            min-width: 0;
          }

          .calc-group-row-icon {
            width: 34px;
            height: 34px;
          }

          .calc-group-row-name-wrap {
            gap: 4px;
          }

          .calc-group-row-name {
            font-size: 0.86rem;
          }

          .calc-group-row-count {
            font-size: 0.7rem;
          }

          .calc-group-row-right {
            gap: 8px;
          }

          .calc-group-row-gross {
            font-size: 0.68rem;
          }

          .calc-group-row-share {
            font-size: 0.85rem;
          }

          .calc-groups-total-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px;
          }

          .calc-groups-total-main {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            width: 100%;
          }

          .calc-groups-payout-breakdown {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            width: 100%;
          }

          .calc-payout-chip {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 6px 8px;
            border-radius: 8px;
            font-size: 0.72rem;
            gap: 2px;
            width: 100%;
            box-sizing: border-box;
          }

          .calc-student-list-modal {
            max-width: 100%;
            width: 100%;
            padding: 18px 16px 16px;
            border-radius: 18px;
            max-height: calc(100dvh - 32px);
            gap: 12px;
          }

          .calc-student-modal-header {
            gap: 10px;
            padding-bottom: 12px;
          }

          .calc-student-modal-group-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }

          .calc-student-modal-group-name {
            font-size: 1.05rem;
          }

          .calc-student-modal-stats-banner {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            padding: 8px 10px;
          }

          .calc-student-stat-item .stat-label {
            font-size: 0.64rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .calc-student-stat-item .stat-value {
            font-size: 0.84rem;
          }

          .calc-student-card {
            padding: 8px 10px;
            gap: 8px;
          }

          .calc-student-idx {
            font-size: 0.75rem;
            min-width: 16px;
          }

          .calc-student-name {
            font-size: 0.82rem;
          }

          .calc-student-share-pill {
            font-size: 0.74rem;
            padding: 2px 6px;
          }


        }
        /* Dark Mode Calculator Overrides */
        [data-theme="dark"] .card-title {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-header-clean,
        [data-theme="dark"] .calc-groups-head {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .calc-sync-pill {
          background: rgba(138, 180, 248, 0.12);
          border-color: rgba(138, 180, 248, 0.3);
          color: #8AB4F8;
        }

        [data-theme="dark"] .calc-sync-pill:hover {
          background: rgba(138, 180, 248, 0.2);
          border-color: rgba(138, 180, 248, 0.45);
        }

        [data-theme="dark"] .calc-input-block {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-stepper-row {
          background: #292A2D;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-step-btn {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-step-btn:hover:not(:disabled) {
          background: #303134;
        }

        [data-theme="dark"] .calc-step-input {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-price-input-wrap {
          background: #292A2D;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-price-input {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-suffix-text {
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-chip-clean {
          background: #292A2D;
          border-color: #363739;
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-chip-clean:hover {
          color: #E8EAED;
          border-color: #5F6368;
        }

        [data-theme="dark"] .calc-chip-clean.active {
          background: #E8EAED;
          color: #202124;
          border-color: #E8EAED;
        }

        [data-theme="dark"] .calc-range-slider {
          background: #363739;
        }

        [data-theme="dark"] .calc-range-slider::-webkit-slider-thumb {
          background: #E8EAED;
        }

        [data-theme="dark"] .calc-hero-clean {
          background: #202124;
          border: 1px solid #363739;
        }

        [data-theme="dark"] .calc-stat-clean {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-stat-num {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-dates-row {
          border-top-color: #363739;
        }

        [data-theme="dark"] .calc-date-trigger-btn {
          background: #202124;
          border-color: #363739;
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-date-trigger-btn:hover {
          border-color: #5F6368;
          background: #26282B;
        }

        [data-theme="dark"] .calc-date-trigger-btn.active.advance {
          border-color: #8AB4F8;
          box-shadow: 0 0 0 2px rgba(138, 180, 248, 0.2);
          background: #202124;
        }

        [data-theme="dark"] .calc-date-trigger-btn.active.salary {
          border-color: #81C995;
          box-shadow: 0 0 0 2px rgba(129, 201, 149, 0.2);
          background: #202124;
        }

        [data-theme="dark"] .calc-date-trigger-val {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-calendar-overlay {
          background: rgba(0, 0, 0, 0.65);
        }

        [data-theme="dark"] .calc-mini-calendar-popover {
          background: #252629;
          border-color: #363739;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .cal-mini-nav-btn {
          background: #2D2F31;
          border-color: #363739;
          color: #E8EAED;
        }

        [data-theme="dark"] .cal-mini-nav-btn:hover {
          background: #383A3D;
        }

        [data-theme="dark"] .cal-mini-month {
          color: #E8EAED;
        }

        [data-theme="dark"] .cal-mini-cell {
          color: #E8EAED;
        }

        [data-theme="dark"] .cal-mini-cell:hover:not(.selected) {
          background: #303134;
        }

        [data-theme="dark"] .cal-mini-footer {
          border-top-color: #363739;
        }

        [data-theme="dark"] .cal-mini-preset-chip {
          background: #2D2F31;
          border-color: #363739;
          color: #9AA0A6;
        }

        [data-theme="dark"] .cal-mini-preset-chip:hover {
          color: #E8EAED;
          border-color: #5F6368;
        }

        [data-theme="dark"] .cal-mini-preset-chip.active {
          background: #E8EAED;
          color: #202124;
          border-color: #E8EAED;
        }

        [data-theme="dark"] .cal-mini-close-btn:hover {
          color: #E8EAED;
          background: #303134;
        }

        [data-theme="dark"] .calc-payout-card {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-payout-card.advance {
          background: rgba(138, 180, 248, 0.08);
          border-color: rgba(138, 180, 248, 0.3);
        }

        [data-theme="dark"] .calc-payout-card.advance .calc-payout-tag,
        [data-theme="dark"] .calc-payout-card.advance .calc-payout-amount,
        [data-theme="dark"] .calc-payout-card.advance .calc-payout-date-badge,
        [data-theme="dark"] .payout-bar-lbl.advance strong,
        [data-theme="dark"] .calc-payout-chip.advance strong {
          color: #8AB4F8;
        }

        [data-theme="dark"] .calc-payout-card.advance .calc-payout-date-badge {
          background: rgba(138, 180, 248, 0.15);
        }

        [data-theme="dark"] .calc-payout-card.remaining {
          background: rgba(129, 201, 149, 0.08);
          border-color: rgba(129, 201, 149, 0.3);
        }

        [data-theme="dark"] .calc-payout-card.remaining .calc-payout-tag,
        [data-theme="dark"] .calc-payout-card.remaining .calc-payout-amount,
        [data-theme="dark"] .calc-payout-card.remaining .calc-payout-date-badge,
        [data-theme="dark"] .payout-bar-lbl.remaining strong,
        [data-theme="dark"] .calc-payout-chip.remaining strong {
          color: #81C995;
        }

        [data-theme="dark"] .calc-payout-card.remaining .calc-payout-date-badge {
          background: rgba(129, 201, 149, 0.15);
        }

        [data-theme="dark"] .calc-payout-bar-wrap {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-payout-bar-track {
          background: #363739;
        }

        [data-theme="dark"] .calc-payout-bar-advance {
          background: #8AB4F8;
        }

        [data-theme="dark"] .calc-payout-bar-remaining {
          background: #81C995;
        }

        [data-theme="dark"] .calc-payout-chip.advance {
          background: rgba(138, 180, 248, 0.12);
          color: #8AB4F8;
        }

        [data-theme="dark"] .calc-payout-chip.remaining {
          background: rgba(129, 201, 149, 0.12);
          color: #81C995;
        }

        [data-theme="dark"] .calc-groups-count-badge {
          background: #202124;
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-groups-table {
          border-color: #363739;
        }

        [data-theme="dark"] .calc-group-row {
          background: #202124;
          border-bottom-color: #2D2F31;
        }

        [data-theme="dark"] .calc-group-row:hover {
          background: #28292D;
        }

        [data-theme="dark"] .calc-group-row-icon {
          background: #292A2D;
          border-color: #363739;
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-group-row-name {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-group-row-share {
          color: #81C995;
        }

        [data-theme="dark"] .calc-student-list-modal {
          background: #292A2D;
          border-color: #363739;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
        }

        [data-theme="dark"] .calc-student-modal-group-icon {
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .calc-student-modal-group-name {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-student-modal-count-badge {
          background: rgba(138, 180, 248, 0.15);
          color: #8AB4F8;
        }

        [data-theme="dark"] .calc-student-modal-stats-banner {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-student-stat-item .stat-value {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-student-stat-item.highlight .stat-value {
          color: #81C995;
        }

        [data-theme="dark"] .calc-student-stat-item.advance-box .stat-value {
          color: #8AB4F8;
        }

        [data-theme="dark"] .calc-student-stat-item.remaining-box .stat-value {
          color: #81C995;
        }

        [data-theme="dark"] .calc-student-search-wrap {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-student-search-wrap:focus-within {
          background: #292A2D;
          border-color: #8AB4F8;
          box-shadow: none !important;
          outline: none !important;
        }

        [data-theme="dark"] .calc-student-card {
          background: #202124;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }

        [data-theme="dark"] .calc-student-card:hover {
          background: #28292D;
        }

        [data-theme="dark"] .calc-student-avatar-wrap {
          background: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .calc-student-name {
          color: #E8EAED;
        }

        [data-theme="dark"] .calc-student-share-pill {
          background: rgba(129, 201, 149, 0.15);
          color: #81C995;
        }

        [data-theme="dark"] .calc-groups-total-bar {
          background: #202124;
          border-color: #363739;
        }

        [data-theme="dark"] .calc-groups-total-bar .val {
          color: #81C995;
        }

        [data-theme="dark"] .calc-tick-mark {
          color: #9AA0A6;
        }

        [data-theme="dark"] .calc-tick-mark:hover,
        [data-theme="dark"] .calc-tick-mark.active {
          color: #E8EAED;
        }

      `}</style>
    </div>
  );
};

export default TeacherFinanceView;
