import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Generate mock data for last 30 days
function generateData() {
  const data = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      applications: Math.floor(Math.random() * 8) + 1,
      approved: Math.floor(Math.random() * 4),
    })
  }
  return data
}

export function ApplicationsChart() {
  const data = useMemo(() => generateData(), [])

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
        Applications — Last 30 Days
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              tickLine={false}
              interval={4}
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
            />
            <Line
              type="monotone"
              dataKey="applications"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              name="Submitted"
            />
            <Line
              type="monotone"
              dataKey="approved"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
              name="Approved"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
