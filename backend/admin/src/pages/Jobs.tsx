import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Trash } from 'lucide-react'

export default function Jobs() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs?limit=100')
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/jobs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(id)
    }
  }

  const jobs = data?.data || []

  return (
    <div className="flex flex-col">
      <TopBar title="Jobs" />
      <div className="p-6 space-y-6">
        <Badge label={`${jobs.length} jobs`} />

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No jobs posted yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Title</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Startup</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Location</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: any) => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{job.startup?.name || '—'}</td>
                    <td className="px-6 py-4"><Badge label={job.type} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{job.isRemote ? 'Remote' : job.location}</td>
                    <td className="px-6 py-4"><Badge label={job.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(job.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
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
