import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function generateData() {
  const data = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  let cumulative = 5
  for (let i = 0; i < 12; i++) {
    cumulative += Math.floor(Math.random() * 8) + 2
    data.push({
      month: months[i],
      startups: cumulative,
      funding: Math.floor(cumulative * (Math.random() * 50 + 20)),
    })
  }
  return data
}

export function GrowthChart() {
  const data = useMemo(() => generateData(), [])

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
        Ecosystem Growth
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStartups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
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
            />
            <Area
              type="monotone"
              dataKey="startups"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorStartups)"
              name="Total Startups"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
