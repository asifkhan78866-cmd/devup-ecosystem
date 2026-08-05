import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data?: Array<{ week: string; students: number; founders: number }>
}

export function UsersChart({ data }: Props) {
  const isEmpty = !data || data.length === 0 || data.every((d) => d.students === 0 && d.founders === 0)

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
        New Signups — Weekly
      </h3>
      <div className="h-64 flex items-center justify-center">
        {isEmpty ? (
          <p className="text-gray-600 text-sm">No signup data yet</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}
