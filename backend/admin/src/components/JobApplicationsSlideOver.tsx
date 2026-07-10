import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { SlideOver } from './ui/SlideOver'
import { Button } from './ui/Button'
import { Download, FileText, User } from 'lucide-react'
import { Badge } from './ui/Badge'

export function JobApplicationsSlideOver({
  jobId,
  jobTitle,
  isOpen,
  onClose,
}: {
  jobId: string | null
  jobTitle: string
  isOpen: boolean
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: async () => {
      if (!jobId) return { data: [] }
      const res = await api.get(`/api/jobs/${jobId}/applications`)
      return res.data
    },
    enabled: !!jobId && isOpen,
  })

  const applications = data?.data || []

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title={`Applications for ${jobTitle}`}>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No applications received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div key={app.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {app.applicantName || app.user?.profile?.name || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-400">{app.applicantEmail || app.user?.email}</p>
                    {app.applicantPhone && <p className="text-xs text-gray-500 mt-0.5">{app.applicantPhone}</p>}
                  </div>
                </div>
                <Badge label={app.status} />
              </div>

              {app.coverLetter && (
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-sm text-gray-300 mb-4 whitespace-pre-wrap">
                  <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Cover Note</span>
                  {app.coverLetter}
                </div>
              )}

              <div className="flex items-center gap-2">
                {app.resumeUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-[#c8f135] hover:text-[#b0d829] hover:bg-[#c8f135]/10 border border-[#c8f135]/20"
                    onClick={() => window.open(app.resumeUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" /> Resume
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  )
}
