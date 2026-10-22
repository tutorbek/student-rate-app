import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getGroupCategory } from '../utils/db';
import { renderGroupIcon } from '../utils/groupIcons';
import { renderAvatar } from '../utils/studentAvatars';
import { useModalDismiss } from '../hooks/useModalDismiss';
import './TeacherFinanceView.css';

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

          <section className="glass-card calc-main-card">
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
                        className="calc-payout-date-btn scale-active"
                        onClick={() => setCalPickerTarget('advance')}
                        title="Avans to'lov sanasini tanlash"
                      >
                        <IconCalendar size={13} />
                        <span>Har oy {calcAdvanceDay}-kuni</span>
                        <IconChevronDown size={12} className={`calc-date-chevron ${calPickerTarget === 'advance' ? 'rotate' : ''}`} />
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
                        className="calc-payout-date-btn scale-active"
                        onClick={() => setCalPickerTarget('salary')}
                        title="Oylik to'lov sanasini tanlash"
                      >
                        <IconCalendar size={13} />
                        <span>Har oy {calcSalaryDay}-kuni</span>
                        <IconChevronDown size={12} className={`calc-date-chevron ${calPickerTarget === 'salary' ? 'rotate' : ''}`} />
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
            <section className="glass-card calc-groups-card">
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
            <div className="calc-student-modal-header modal-header-fixed">
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
            <div className="calc-student-modal-body modal-body-scrollable">
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
            <div className="calc-student-modal-footer modal-actions-fixed">
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
    </div>
  );
};

export default TeacherFinanceView;
