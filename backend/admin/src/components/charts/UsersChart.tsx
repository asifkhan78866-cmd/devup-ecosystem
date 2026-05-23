import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function generateData() {
  const data = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    data.push({
      week: `W${12 - i}`,
      students: Math.floor(Math.random() * 20) + 5,
      founders: Math.floor(Math.random() * 8) + 1,
    })
  }
  return data
}

export function UsersChart() {
  const data = useMemo(() => generateData(), [])

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
        New Signups — Weekly
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: 12,
              }}
              labelStyle={{ color: '#9ca3af' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="students"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              name="Students"
            />
            <Bar
              dataKey="founders"
              fill="#a855f7"
              radius={[4, 4, 0, 0]}
              name="Founders"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
