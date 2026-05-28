import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '@/components/Layout/TopBar'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import api from '@/config/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface ServiceRequest {
  id: string
  serviceId: string
  serviceName: string
  name: string
  company: string
  email: string
  details: string
  status: 'PENDING' | 'REVIEWING' | 'CONTACTED' | 'REJECTED' | 'FULFILLED'
  createdAt: string
}

export default function ServiceRequests() {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['service-requests'],
    queryFn: async () => {
      const res = await api.get('/api/services/requests')
      return res.data.data as ServiceRequest[]
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await api.patch(`/api/services/requests/${id}`, { status })
      return res.data.data
    },
    onSuccess: () => {
      toast.success('Status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      setSelectedRequest(null)
    },
    onError: () => {
      toast.error('Failed to update status')
    }
  })

  const handleStatusChange = (status: string) => {
    if (!selectedRequest) return
    updateStatusMutation.mutate({ id: selectedRequest.id, status })
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (req: ServiceRequest) => format(new Date(req.createdAt), 'MMM d, yyyy'),
    },
    {
      key: 'service',
      header: 'Service',
      render: (req: ServiceRequest) => (
        <span className="font-medium text-white">{req.serviceName}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client / Company',
      render: (req: ServiceRequest) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{req.name}</span>
          <span className="text-xs text-gray-500">{req.company}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: ServiceRequest) => {
        const colors: Record<string, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
          PENDING: 'warning',
          REVIEWING: 'primary',
          CONTACTED: 'success',
          REJECTED: 'danger',
          FULFILLED: 'default',
        }
        return <Badge variant={colors[req.status]}>{req.status}</Badge>
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (req: ServiceRequest) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
          View Details
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col">
      <TopBar title="Service Requests" />

      <div className="p-6">
        <Table
          data={requests || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No service requests found."
          keyExtractor={(req) => req.id}
        />
      </div>

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Service Request Details"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Service Requested</p>
                <p className="text-sm font-medium text-white">{selectedRequest.serviceName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date Submitted</p>
                <p className="text-sm text-white">{format(new Date(selectedRequest.createdAt), 'PPpp')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Client Name</p>
                <p className="text-sm text-white">{selectedRequest.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm text-white">{selectedRequest.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Company</p>
                <p className="text-sm text-white">{selectedRequest.company}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                <Badge variant={selectedRequest.status === 'PENDING' ? 'warning' : 'default'}>
                  {selectedRequest.status}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Project Details</p>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-300 whitespace-pre-wrap">
                {selectedRequest.details}
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-white/10 pt-6 mt-6">
              <Button
                variant="outline"
                onClick={() => handleStatusChange('REVIEWING')}
                isLoading={updateStatusMutation.isPending}
              >
                Mark Reviewing
              </Button>
              <Button
                variant="primary"
                onClick={() => handleStatusChange('CONTACTED')}
                isLoading={updateStatusMutation.isPending}
              >
                Mark Contacted
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
