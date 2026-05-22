import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function Cofounders() {
  const { data, isLoading } = useQuery({
    queryKey: ['cofounders'],
    queryFn: async () => {
      const res = await api.get('/api/cofounders?limit=100')
      return res.data
    },
  })

  const profiles = data?.data || []

  return (
    <div className="flex flex-col">
      <TopBar title="Co-Founders" />
      <div className="p-6 space-y-6">
        <Badge label={`${profiles.length} profiles`} />

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No co-founder profiles yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Stage</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Seeking</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{p.user?.profile?.name || 'Unknown'}</td>
                    <td className="px-6 py-4"><Badge label={p.role} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{p.stage}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.seeking?.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-white/5 text-xs text-gray-400 rounded">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
