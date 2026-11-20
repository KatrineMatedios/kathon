import { Activity, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, LoadingState, PageHeader, Pagination, Select } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { ActivityEntry, Paginated } from '../../types'
import { formatDateTime } from '../../utils'

const actionLabels: Record<string, string> = {
  registered: 'Account created',
  logged_in: 'Signed in',
  logged_out: 'Signed out',
  report_submitted: 'Report submitted',
  report_updated: 'Report updated',
  report_deleted: 'Report deleted',
  claim_submitted: 'Claim submitted',
  claim_approved: 'Claim approved',
  claim_rejected: 'Claim rejected',
  profile_updated: 'Profile updated',
  email_verified: 'Email verified',
  password_reset: 'Password reset',
  support_requested: 'Support request sent',
}

export function ActivityHistory() {
  const { error } = useToast()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [meta, setMeta] = useState<Paginated<ActivityEntry>['meta'] | undefined>()
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<Paginated<ActivityEntry>>('/activity', { params: { action: action || undefined, page, per_page: 20 } })
      .then(({ data }) => {
        if (!active) return
        setEntries(data.data)
        setMeta(data.meta)
      })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [action, page, error])

  return (
    <div>
      <PageHeader title="Activity history" subtitle="A timeline of your actions on CampusFind." />

      <div className="app-card mb-5 p-4">
        <Select value={action} onChange={(event) => { setAction(event.target.value); setPage(1) }}>
          <option value="">All activity</option>
          {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading activity…" />
      ) : entries.length ? (
        <>
          <div className="app-card overflow-hidden">
            {entries.map((entry, index) => (
              <div key={entry.id} className={`flex gap-3 p-4 ${index > 0 ? 'border-t border-[#f2e8db]' : ''}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brown-light/50 text-brown">
                  <Activity size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{actionLabels[entry.action] ?? entry.action}</p>
                  <p className="mt-0.5 text-xs text-muted">{entry.description}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                    <Clock size={12} /> {formatDateTime(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No activity yet" description="Your actions will appear here as you use CampusFind." />
      )}
    </div>
  )
}
