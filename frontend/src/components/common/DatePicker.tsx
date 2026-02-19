import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Props {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDate(str: string) {
  const [y, m, d] = str.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function valueToDisplay(v: string) {
  if (!v) return '';
  const { year, month, day } = parseDate(v);
  return `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

export function DatePicker({ value, onChange, min, placeholder = 'mm/dd/yyyy' }: Props) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(() => valueToDisplay(value));
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const initial = value ? parseDate(value) : { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    setInputText(valueToDisplay(value));
    setError('');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2 - 150,
    });
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isDisabled = (day: number) => {
    if (!min) return false;
    return toDateStr(viewYear, viewMonth, day) < min;
  };

  const isSelected = (day: number) => value === toDateStr(viewYear, viewMonth, day);
  const isToday = (day: number) => todayStr === toDateStr(viewYear, viewMonth, day);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 2) {
      raw = digits;
    } else if (digits.length <= 4) {
      raw = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      raw = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setInputText(raw);
    setError('');

    const parts = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (parts) {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const y = parseInt(parts[3], 10);
      if (m < 1 || m > 12 || d < 1 || d > 31) {
        setError('Invalid date');
        return;
      }
      const dateStr = toDateStr(y, m - 1, d);
      if (min && dateStr < min) {
        setError('Date must be today or later');
        return;
      }
      onChange(dateStr);
      setViewYear(y);
      setViewMonth(m - 1);
    } else if (!raw) {
      onChange('');
    }
  };

  return (
    <div className="relative w-full max-w-xs">
      <div className={`flex items-center gap-0 rounded-xl border bg-[var(--color-bg-primary)] transition-all ${
        error
          ? 'border-[var(--color-error)] focus-within:ring-2 focus-within:ring-[var(--color-error)]'
          : 'border-[var(--color-border)] focus-within:ring-2 focus-within:ring-[var(--color-brand-blue)] focus-within:border-[var(--color-brand-blue)]'
      }`}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={10}
          className="flex-1 px-4 py-3 bg-transparent text-base font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none rounded-l-xl"
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-3 text-[var(--color-brand-blue)] hover:bg-[var(--color-bg-hover)] transition-colors rounded-r-xl"
        >
          <Calendar className="w-5 h-5" />
        </button>
      </div>
      <p className={`text-xs mt-1.5 text-[var(--color-error)] transition-opacity ${error ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {error || '\u00A0'}
      </p>

      {open && createPortal(
        <div
          ref={ref}
          className="fixed w-[300px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl z-[100] animate-fade-in"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 pt-2 pb-3">
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[0.65rem] font-semibold text-[var(--color-text-muted)] py-1.5 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const disabled = isDisabled(day);
                const selected = isSelected(day);
                const tdy = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(toDateStr(viewYear, viewMonth, day));
                      setOpen(false);
                    }}
                    className={`
                      w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${disabled ? 'text-[var(--color-text-muted)] opacity-35 cursor-not-allowed' : ''}
                      ${selected ? 'bg-[var(--color-brand-blue)] text-white shadow-sm' : ''}
                      ${!selected && !disabled ? 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]' : ''}
                      ${tdy && !selected ? 'ring-1 ring-[var(--color-brand-blue)] ring-inset' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
