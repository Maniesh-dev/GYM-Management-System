'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#534AB7', '#1D9E75', '#BA7517', '#E24B4A', '#185FA5']

export function PlanPieChart({ data }: { data: { name: string; count: number }[] }) {
    if (data.length === 0) {
        return <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No active members</p>
    }

    return (
        <div className="w-full h-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={11}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(v) => [v, 'Members']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, zIndex: 50 }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}