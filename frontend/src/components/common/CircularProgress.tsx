/** Circular progress ring. value 0–100, color via CSS var. */
export function CircularProgress({
  value,
  label,
  centerLabel,
  color = 'var(--color-accent)',
  size = 80,
  strokeWidth = 6,
}: {
  value: number;
  label: string;
  centerLabel: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  const dash = (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-300"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-[var(--color-text-primary)]"
          style={{ fontSize: size * 0.2 }}
        >
          {centerLabel}
        </div>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] text-center">
        {label}
      </p>
    </div>
  );
}
