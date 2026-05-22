import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

export default function Hackathons() {
  const { data, isLoading } = useQuery({
    queryKey: ['hackathons'],
    queryFn: async () => {
      const res = await api.get('/api/hackathons?limit=100')
      return res.data
    },
  })

  const hackathons = data?.data || []

  return (
    <div className="flex flex-col">
      <TopBar title="Hackathons" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge label={`${hackathons.length} hackathons`} />
          <Button variant="primary" size="md">+ Add Hackathon</Button>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : hackathons.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No hackathons yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Mode</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Prize</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Registrations</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Featured</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathons.map((h: any) => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{h.title}</div>
                      <div className="text-xs text-gray-500">{h.organizer}</div>
                    </td>
                    <td className="px-6 py-4"><Badge label={h.mode} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{h.prizePool}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{h.currentParticipants}{h.maxParticipants ? `/${h.maxParticipants}` : ''}</td>
                    <td className="px-6 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block ${h.isFeatured ? 'bg-indigo-400' : 'bg-gray-600'}`} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
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
