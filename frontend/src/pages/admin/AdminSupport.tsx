import { CheckCircle2, Mail, MessageSquareText, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { Button, EmptyState, LoadingState, Modal, PageHeader, Pagination, Select, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { Paginated, SupportTicket } from '../../types'
import { cn, formatDateTime } from '../../utils'

const statusStyles: Record<string, string> = {
  open: 'bg-blush/20 text-[#a4483f]',
  in_progress: 'bg-[#f2dfbd] text-[#8a5a1f]',
  closed: 'bg-sage/20 text-[#2f6d42]',
}

export function AdminSupport() {
  const { success, error } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [meta, setMeta] = useState<Paginated<SupportTicket>['meta'] | undefined>()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [form, setForm] = useState({ status: 'in_progress', admin_response: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get<Paginated<SupportTicket>>('/admin/support-tickets', {
      params: { status: status || undefined, page, per_page: 20 },
    })
      .then(({ data }) => { setTickets(data.data); setMeta(data.meta) })
      .catch((err) => error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status, page, error])

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket)
    setForm({
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      admin_response: ticket.admin_response ?? '',
    })
  }

  const respond = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const { data } = await api.put(`/admin/support-tickets/${selected.id}`, form)
      success(data.message ?? 'Support request updated.')
      setSelected(null)
      load()
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Support tickets" subtitle="Reply to student questions and support requests." />

      <div className="app-card mb-5 p-4">
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="">All tickets</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading support tickets…" />
      ) : tickets.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {tickets.map((ticket, index) => (
              <div key={ticket.id} className="app-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brown-light text-brown">
                      <MessageSquareText size={18} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-ink">{ticket.subject}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <Mail size={12} /> {ticket.user?.name ?? 'Student'} · {ticket.user?.email ?? '—'}
                      </p>
                    </div>
                  </div>
                  <span className={cn('chip shrink-0', statusStyles[ticket.status] ?? statusStyles.open)}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 rounded-xl bg-cream p-3 text-xs leading-relaxed text-muted">{ticket.message}</p>
                {ticket.admin_response && (
                  <p className="mt-2 rounded-xl border border-sage/30 bg-[#f1faf3] p-3 text-xs leading-relaxed text-[#3d6f4c]">
                    <strong>Your reply: </strong>{ticket.admin_response}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f2e8db] pt-3">
                  <span className="text-[11px] text-muted">{formatDateTime(ticket.created_at)}</span>
                  <Button size="sm" onClick={() => openTicket(ticket)}>
                    {ticket.admin_response ? 'View / reply' : 'Respond'}
                  </Button>
                </div>

                {ticket.responded_at && index >= 0 && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-muted">
                    <CheckCircle2 size={11} /> Responded {formatDateTime(ticket.responded_at)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No support tickets" description="Student support requests will appear here." />
      )}

      <Modal open={Boolean(selected)} title={`Ticket #${selected?.id ?? ''}`} onClose={() => setSelected(null)}>
        {selected && (
          <form onSubmit={respond} className="space-y-4">
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-sm font-extrabold text-ink">{selected.subject}</p>
              <p className="mt-1 text-xs text-muted">{selected.user?.name ?? 'Student'} · {selected.user?.email ?? '—'}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">{selected.message}</p>
            </div>
            <label className="block">
              <span className="field-label">Status</span>
              <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="closed">Closed</option>
              </Select>
            </label>
            <label className="block">
              <span className="field-label">Your response</span>
              <Textarea
                value={form.admin_response}
                onChange={(event) => setForm({ ...form, admin_response: event.target.value })}
                placeholder="Write a clear and helpful response…"
              />
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" fullWidth onClick={() => setSelected(null)}>Cancel</Button>
              <Button type="submit" fullWidth loading={saving}><Send size={15} /> Send response</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
