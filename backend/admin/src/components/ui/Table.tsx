import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  align?: 'left' | 'right' | 'center'
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  emptySubMessage?: string
  keyExtractor: (item: T) => string
}

export function Table<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
  emptySubMessage,
  keyExtractor,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-8 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-16 text-center">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-gray-700 text-sm mt-1">{emptySubMessage}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-${col.align || 'left'} text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
