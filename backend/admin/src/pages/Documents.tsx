import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function Documents() {
  return (
    <div className="flex flex-col">
      <TopBar title="Documents" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge label="0 documents" />
          <Button variant="primary" size="md">+ Upload Document</Button>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">No documents yet</p>
            <p className="text-gray-700 text-sm mt-1">Upload NDAs and agreements for startups to sign</p>
          </div>
        </div>
      </div>
    </div>
  )
}
