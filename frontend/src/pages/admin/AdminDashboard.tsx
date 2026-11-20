import { CheckCircle2, ClipboardList, FileSearch, PackageSearch, SearchCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client'
import { ItemCard } from '../../components/ItemCard'
import { LoadingState, PageHeader } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import type { AdminDashboard as DashboardData } from '../../types'

export function AdminDashboard() {
  const { error } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    let active = true
    api.get<DashboardData>('/admin/dashboard')
      .then(({ data }) => { if (active) setData(data) })
      .catch((err) => { if (active) error(getErrorMessage(err)) })
    return () => { active = false }
  }, [error])

  if (!data) return <LoadingState label="Loading admin dashboard…" />

  const stats = [
    { label: 'Total users', value: data.stats.total_users, icon: Users, tint: 'bg-brown-light text-brown', to: '/admin/users' },
    { label: 'Lost items', value: data.stats.total_lost_items, icon: PackageSearch, tint: 'bg-blush/20 text-[#a4483f]', to: '/admin/reports' },
    { label: 'Found items', value: data.stats.total_found_items, icon: SearchCheck, tint: 'bg-sage/20 text-[#2f6d42]', to: '/admin/reports' },
    { label: 'Pending reports', value: data.stats.pending_reports, icon: FileSearch, tint: 'bg-[#f2dfbd] text-[#8a5a1f]', to: '/admin/reports' },
    { label: 'Pending claims', value: data.stats.pending_claims, icon: ClipboardList, tint: 'bg-blush/20 text-[#a4483f]', to: '/admin/claims' },
    { label: 'Resolved items', value: data.stats.resolved_items, icon: CheckCircle2, tint: 'bg-sage/20 text-[#2f6d42]', to: '/admin/reports' },
  ]

  return (
    <div className="space-y-7">
      <PageHeader title="Admin overview" subtitle="Monitor the health of your campus lost and found system." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} to={stat.to} className="app-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.tint}`}>
                <Icon size={19} />
              </span>
              <p className="mt-3 text-2xl font-extrabold text-brown">{stat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{stat.label}</p>
            </Link>
          )
        })}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink">Recent reports</h2>
          <Link to="/admin/reports" className="text-xs font-bold text-brown">Manage all</Link>
        </div>
        {data.recent_reports.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {data.recent_reports.map((item) => <ItemCard key={item.id} item={item} compact />)}
          </div>
        ) : <p className="text-sm text-muted">No reports yet.</p>}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink">Recent claims</h2>
          <Link to="/admin/claims" className="text-xs font-bold text-brown">Review all</Link>
        </div>
        {data.recent_claims.length ? (
          <div className="app-card overflow-hidden">
            {data.recent_claims.map((claim, index) => (
              <div key={claim.id} className={`flex items-center gap-3 p-4 ${index > 0 ? 'border-t border-[#f2e8db]' : ''}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brown-light text-brown">
                  <ClipboardList size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{claim.item?.item_name ?? 'Item'}</p>
                  <p className="text-xs text-muted">Claimed by {claim.claimant?.name ?? 'student'}</p>
                </div>
                <span className="chip bg-cream text-brown capitalize">{claim.status}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">No claims yet.</p>}
      </section>
    </div>
  )
}
