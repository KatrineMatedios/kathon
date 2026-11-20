import { Activity, Clock, Search, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client'
import { EmptyState, Input, LoadingState, PageHeader, Pagination, Select } from '../../components/ui'
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
  report_status_changed: 'Report status changed',
  claim_submitted: 'Claim submitted',
  claim_approved: 'Claim approved',
  claim_rejected: 'Claim rejected',
  profile_updated: 'Profile updated',
  email_verified: 'Email verified',
  password_reset: 'Password reset',
  support_requested: 'Support request sent',
  support_responded: 'Support request answered',
  user_activated: 'User activated',
  user_deactivated: 'User deactivated',
}

export function AdminActivityLogs() {
  const { error } = useToast()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [meta, setMeta] = useState<Paginated<ActivityEntry>['meta'] | undefined>()
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<Paginated<ActivityEntry>>('/admin/activity', {
      params: { action: action || undefined, user_id: userId || undefined, page, per_page: 20 },
    })
      .then(({ data }) => {
        if (!active) return
        setEntries(data.data)
        setMeta(data.meta)
      })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [action, userId, page, error])

  return (
    <div>
      <PageHeader title="Activity logs" subtitle="A complete audit trail of actions across CampusFind." />

      <div className="app-card mb-5 grid gap-3 p-4 sm:grid-cols-2">
        <Select value={action} onChange={(event) => { setAction(event.target.value); setPage(1) }}>
          <option value="">All actions</option>
          {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b09b8b]" size={17} />
          <Input
            value={userId}
            onChange={(event) => { setUserId(event.target.value.replace(/\D/g, '')); setPage(1) }}
            placeholder="Filter by user ID"
            className="pl-11"
            inputMode="numeric"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading activity logs…" />
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
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDateTime(entry.created_at)}</span>
                    {entry.user && <span className="flex items-center gap-1"><UserRound size={12} /> {entry.user.name}</span>}
                    {entry.subject_type && <span>{entry.subject_type.split('\\').pop()} #{entry.subject_id}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No activity found" description="Try a different action or user filter." />
      )}
    </div>
  )
}
