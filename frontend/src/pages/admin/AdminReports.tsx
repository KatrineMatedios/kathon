import { Check, Eye, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import {
  Button,
  EmptyState,
  Input,
  ItemImage,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  TypeBadge,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Item, Paginated } from '../../types'
import { formatDate } from '../../utils'

export function AdminReports() {
  const { success, error } = useToast()
  const [reports, setReports] = useState<Item[]>([])
  const [meta, setMeta] = useState<Paginated<Item>['meta'] | undefined>()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<Paginated<Item>>('/admin/reports', {
      params: { q: search, item_type: type, item_status: status, page, per_page: 15 },
    })
      .then(({ data }) => { setReports(data.data); setMeta(data.meta) })
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type, status, page, error])

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); load() }, 350)
    return () => window.clearTimeout(timer)
  }, [search])

  const updateStatus = async (id: number, next: 'approved' | 'rejected') => {
    setBusy(id)
    try {
      const { data } = await api.put(`/admin/reports/${id}/status`, { item_status: next })
      success(data.message)
      load()
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this report permanently?')) return
    setBusy(id)
    try {
      const { data } = await api.delete<{ message: string }>(`/admin/reports/${id}`)
      success(data.message)
      load()
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader title="Manage reports" subtitle="Review, approve or remove item reports." />

      <div className="app-card mb-5 grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b09b8b]" size={17} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item reports" className="pl-11" />
        </div>
        <Select value={type} onChange={(event) => { setType(event.target.value); setPage(1) }}>
          <option value="">All types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </Select>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="returned">Returned</option>
          <option value="resolved">Resolved</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading reports…" />
      ) : reports.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {reports.map((report) => (
              <div key={report.id} className="app-card p-4">
                <div className="flex gap-3">
                  <ItemImage src={report.image_url} type={report.item_type} alt={report.item_name} className="h-24 w-24 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <TypeBadge type={report.item_type} />
                      <StatusBadge status={report.item_status} />
                    </div>
                    <h3 className="mt-2 truncate text-sm font-extrabold text-ink">{report.item_name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{report.description}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {report.category?.name ?? 'Uncategorized'} · {formatDate(report.date_reported)} · {report.reporter?.name ?? 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f2e8db] pt-3">
                  <Link to={`/items/${report.id}`} className="btn-outline flex-1 !py-2 !text-xs"><Eye size={14} /> Review</Link>
                  {report.item_status === 'pending' && (
                    <>
                      <Button size="sm" variant="secondary" loading={busy === report.id} onClick={() => updateStatus(report.id, 'approved')}>
                        <Check size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="danger" loading={busy === report.id} onClick={() => updateStatus(report.id, 'rejected')}>
                        <X size={14} /> Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" loading={busy === report.id} onClick={() => remove(report.id)} aria-label="Delete report">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No reports found" description="Try changing the filters above." />
      )}
    </div>
  )
}
