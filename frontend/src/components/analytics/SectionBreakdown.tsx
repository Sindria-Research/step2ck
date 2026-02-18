import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface SectionStats {
    name: string;
    correct: number;
    total: number;
}

export function SectionBreakdown({ sections, className }: { sections: SectionStats[], className?: string }) {
    const data = sections
        .filter((s) => s.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8) // Top 8 active sections
        .map(s => ({
            name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
            fullName: s.name,
            Correct: s.correct,
            Incorrect: s.total - s.correct,
        }));

    if (data.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-white border border-[var(--color-border)] rounded-xl p-8 text-[var(--color-text-tertiary)] text-sm ${className}`}>
                No section data available.
            </div>
        );
    }

    return (
        <div className={`bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm ${className}`}>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
                Section Performance <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-2">(Top 8 active)</span>
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--color-bg-tertiary)', opacity: 0.4 }}
                            contentStyle={{
                                backgroundColor: 'var(--color-bg-primary)',
                                borderColor: 'var(--color-border)',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar
                            dataKey="Correct"
                            stackId="a"
                            fill="var(--color-success)"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="Incorrect"
                            stackId="a"
                            fill="var(--color-error)"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                            fillOpacity={0.8}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
