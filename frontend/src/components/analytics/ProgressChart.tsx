import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ProgressRecord } from '../../api/types';

interface ProgressChartProps {
    history: ProgressRecord[];
    className?: string;
}

export function ProgressChart({ history, className }: ProgressChartProps) {
    // Compute rolling average or cumulative accuracy over the last N attempts
    // Since we don't have timestamps, we assume 'history' is chronological (or we treat it as such)

    // We'll take the last 50 items for the chart to keep it readable
    const recentHistory = history.slice(-50);

    // Create data points: moving average of last 10
    const data = recentHistory.map((_, index, arr) => {
        // Window for moving average (e.g. up to last 10 items)
        const windowStart = Math.max(0, index - 9);
        const windowSubset = arr.slice(windowStart, index + 1);
        const correctCount = windowSubset.filter((r) => r.correct).length;
        const accuracy = Math.round((correctCount / windowSubset.length) * 100);

        return {
            attempt: index + 1,
            accuracy,
        };
    });

    if (history.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-white border border-[var(--color-border)] rounded-xl p-8 text-[var(--color-text-tertiary)] text-sm ${className}`}>
                No data yet. Start a test to see your progress!
            </div>
        );
    }

    return (
        <div className={`bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm ${className}`}>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
                Performance Trend <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-2">(Moving average, last 50)</span>
            </h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-brand-blue)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--color-brand-blue)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis
                            dataKey="attempt"
                            hide
                        />
                        <YAxis
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-bg-primary)',
                                borderColor: 'var(--color-border)',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Accuracy']}
                            labelFormatter={() => ''}
                        />
                        <Area
                            type="monotone"
                            dataKey="accuracy"
                            stroke="var(--color-brand-blue)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorAccuracy)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
